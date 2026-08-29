import { type Request, type Response, type NextFunction } from "express";
import fs from "fs";
import { eq, and, asc, inArray } from "drizzle-orm";
import { getMirrorDir, mirrorPath } from "./config";
import { renderAttorney } from "./renderAttorney";
import {
  renderAttorneyDirectory,
  renderAttorneyList,
  CATEGORIES,
  type AttorneyDirectoryFilters,
  type AttorneyDirectoryItem,
  type AttorneyDirectoryPractice,
} from "./renderAttorneyList";
import { renderSingle } from "./renderSingle";
import { renderHome } from "./renderHome";
import { renderPage } from "./renderPage";
import { renderFirmLanding } from "./renderFirmLanding";
import { renderGroupList, type GroupListItem } from "./renderGroupList";
import { renderNotFound } from "./renderNotFound";
import { applyCareersFormFix, applyContactForm } from "./formsFix";
import * as cheerio from "cheerio";
import { renderNewsList, renderNewsDetail } from "./renderNews";
import { applyPublicationsSearch, renderGlobalSearch } from "./renderSearch";
import { buildIdMaps, type IdMaps } from "./idMap";
import { cfg, getConfigMap, seedConfigDefaults } from "./siteConfig";
import { attorneyDirectoryPresetFromConfig } from "./publicAppearanceConfiguration";
import {
  setBaseUrl,
  setAnalyticsConfig,
  setFaviconConfig,
} from "./seo";
import { renderOfficeShowcase } from "./renderOfficeShowcase";
import { applyDiversityVideoGallery } from "./diversityVideoGallery";
import { getCachedPublicPage } from "./pageCache";
import { listPersistentPublicMediaPaths } from "../media/persistentMedia";
import { seedCookiePolicy } from "../privacy/cookieConsent";
import {
  isPublicPracticeSlug,
  isVisiblePublicPractice,
} from "./publicPracticeGroups";
import { storage } from "../storage";
import { db } from "../db";
import {
  teamMembers,
  teamMemberPracticeGroups,
  practiceGroups,
  teamMemberIndustryGroups,
  industryGroups,
} from "@shared/schema";
import { z } from "zod";
import { isMigrationReadOnlyEnabled } from "../database/maintenance";
import { normalizeVideoSource } from "@shared/videoSource";
import { getLocalizedAttorneyTitle } from "@shared/attorneyTitles";
import { getAttorneyPublicName, getAttorneySearchName } from "@shared/attorneyName";
import { comparePublicAttorneyDirectoryOrder } from "@shared/attorneyOrder";
import { getEditorialTypography, getEditorialTypographyForEntities } from "../editorialTypography";
import { getNavigationAvailability } from "./navigationConfiguration";
import { buildSearchableEditorialPages } from "./searchEditorialPages";
import { hasCompatibleLocalizedNewsTitle } from "./newsLanguage";

import {
  PAGE_KEYS,
  PAGE_SEO,
  TEMPLATES,
  applyInternsContent,
  applyProBonoMedia,
  escHtml,
  langOf,
  normalizeStr,
  pick,
  sendPage,
  tpl,
  warmTemplates,
  type Lang,
} from "./htmlPipeline";


const ATTORNEY_DIRECTORY_ROLE_KEYS = ["partners", "of-counsel", "counsel", "associates"] as const;
const EDITORIAL_ARCHIVE_PAGE_SIZE = 6;
const attorneyDirectoryQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  role: z.union([z.enum(ATTORNEY_DIRECTORY_ROLE_KEYS), z.literal("")]).optional(),
  practice: z.union([z.string().trim().regex(/^[a-z0-9-]{1,160}$/), z.literal("")]).optional(),
  letter: z.union([z.string().trim().regex(/^(?:[A-Za-z])?$/), z.literal("")]).optional(),
  "set-letter": z.union([z.string().trim().regex(/^(?:[A-Za-z])?$/), z.literal("")]).optional(),
});

const MANAGED_VIDEO_CONFIG_KEY = /^(?:hero_video(?:_mobile)?|firm_landing_hero_video|page_diversity_video_(?:main|[1-7])|office_video_[1-6])$/;
const VIDEO_SOURCE_ERROR = "Usa un archivo MP4, WebM, OGV o MOV, o una liga válida de YouTube o Vimeo.";

function normalizedManagedVideoValue(key: string, value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!MANAGED_VIDEO_CONFIG_KEY.test(key) || !raw) return raw;
  return normalizeVideoSource(raw);
}

/** Attorneys belonging to a practice group (reverse of the seeded relation). */
async function getAttorneysByPractice(practiceGroupId: string) {
  return db
    .select({ name: teamMembers.name, givenNames: teamMembers.givenNames, firstSurname: teamMembers.firstSurname, secondSurname: teamMembers.secondSurname, slug: teamMembers.slug, title: teamMembers.title, order: teamMembers.order })
    .from(teamMemberPracticeGroups)
    .innerJoin(teamMembers, eq(teamMemberPracticeGroups.teamMemberId, teamMembers.id))
    .where(and(eq(teamMemberPracticeGroups.practiceGroupId, practiceGroupId), eq(teamMembers.published, true)));
}

/**
 * Public industry rosters are intentionally limited to Partners. Their
 * existing editorial sequence is the firm's seniority order, maintained in
 * Administration under "Orden editorial > Socios". Other industry relations
 * remain stored for internal management and attorney profiles.
 */
async function getAttorneysByIndustry(industryGroupId: string) {
  return db
    .select({ id: teamMembers.id, name: teamMembers.name, givenNames: teamMembers.givenNames, firstSurname: teamMembers.firstSurname, secondSurname: teamMembers.secondSurname, slug: teamMembers.slug, title: teamMembers.title, order: teamMembers.order })
    .from(teamMemberIndustryGroups)
    .innerJoin(teamMembers, eq(teamMemberIndustryGroups.teamMemberId, teamMembers.id))
    .where(and(
      eq(teamMemberIndustryGroups.industryGroupId, industryGroupId),
      eq(teamMembers.title, "Partner"),
      eq(teamMembers.published, true),
    ))
    .orderBy(asc(teamMembers.order), asc(teamMembers.id));
}

/** Fetch an attorney's practice & industry groups via the join tables. */
async function getAttorneyGroups(memberId: string) {
  const [pg, ig] = await Promise.all([
    db
      .select({ name: practiceGroups.name, nameEs: practiceGroups.nameEs, slug: practiceGroups.slug })
      .from(teamMemberPracticeGroups)
      .innerJoin(practiceGroups, eq(teamMemberPracticeGroups.practiceGroupId, practiceGroups.id))
      .where(and(eq(teamMemberPracticeGroups.teamMemberId, memberId), eq(practiceGroups.published, true))),
    db
      .select({ name: industryGroups.name, nameEs: industryGroups.nameEs, slug: industryGroups.slug })
      .from(teamMemberIndustryGroups)
      .innerJoin(industryGroups, eq(teamMemberIndustryGroups.industryGroupId, industryGroups.id))
      .where(and(eq(teamMemberIndustryGroups.teamMemberId, memberId), eq(industryGroups.published, true))),
  ]);
  return { practiceGroups: pg.filter((group) => isPublicPracticeSlug(group.slug)), industryGroups: ig };
}

// ES attorney-listing category slugs → our canonical category keys.
const ES_CATEGORY: Record<string, string> = {
  socios: "partners",
  "of-counsel-sp": "of-counsel",
  "counsel-sp": "counsel",
  asociados: "associates",
};

const OFFICE_GALLERY_DEFAULTS = [
  ["/img/Collage/collage_01.jpg", "Tall view on the left side of the office gallery", "Vista alta en el lado izquierdo de la galería de oficinas"],
  ["/img/Collage/collage_02.jpg", "Upper wide view of the new offices", "Vista panorámica superior de las nuevas oficinas"],
  ["/img/Collage/collage_05.jpg", "Lower wide view of the new offices", "Vista panorámica inferior de las nuevas oficinas"],
  ["/img/Collage/collage_07.jpg", "Upper view of a collaboration area", "Vista superior de un área de colaboración"],
  ["/img/Collage/collage_04.jpg", "Lower view of a collaboration area", "Vista inferior de un área de colaboración"],
  ["/img/Collage/05.jpg", "Tall view on the right side of the office gallery", "Vista alta en el lado derecho de la galería de oficinas"],
  ["/img/Collage/collage_09.jpg", "Tall architectural detail of the offices", "Detalle arquitectónico vertical de las oficinas"],
  ["/img/Collage/collage_08.jpg", "Upper architectural detail of the offices", "Detalle arquitectónico superior de las oficinas"],
  ["/img/Collage/collage_03.jpg", "Lower architectural detail of the offices", "Detalle arquitectónico inferior de las oficinas"],
] as const;

const LEGACY_OFFICE_GALLERY_PLACEHOLDERS = new Set([
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80",
  "https://images.unsplash.com/photo-1600508774634-4e11d34730e2?w=800&q=80",
  "https://images.unsplash.com/photo-1497366858526-0766cadbe8fa?w=800&q=80",
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80",
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80",
]);

async function ensureOfficeShowcaseData(): Promise<void> {
  const currentOffices = await storage.getOffices();
  if (!currentOffices.length) {
    await storage.createOffice({
      name: "Von Wobeser y Sierra — Mexico City",
      nameEs: "Von Wobeser y Sierra — Ciudad de México",
      city: "Mexico City",
      country: "Mexico",
      countryEs: "México",
      address: "Torre SOMA Chapultepec, 18th floor. Campos Elíseos 204, Polanco\nEntrance on Arquímedes Street No. 10\n11550 Mexico City",
      addressEs: "Torre SOMA Chapultepec Piso 18. Campos Elíseos 204, Polanco\nAcceso por Calle Arquímedes N.° 10\nC.P. 11550, Ciudad de México",
      phone: "+52 55 5258 1000",
      email: "info@vonwobeser.com",
      latitude: "19.427559",
      longitude: "-99.195333",
      timezone: "America/Mexico_City",
      description: "Headquarters and new offices in Polanco.",
      descriptionEs: "Sede principal y nuevas oficinas en Polanco.",
      imageUrl: "/img/Banner/03.jpg",
      isHeadquarters: true,
      published: true,
      order: 0,
    });
  }

  const currentImages = await storage.getOfficeImages();
  if (currentImages.length === 1 && currentImages[0].imageUrl === "https://vonwobeser.com/images/vonwobeser_2025.png") {
    const first = OFFICE_GALLERY_DEFAULTS[0];
    await storage.updateOfficeImage(currentImages[0].id, { imageUrl: first[0], alt: first[1], altEs: first[2], order: 0 });
    currentImages[0] = { ...currentImages[0], imageUrl: first[0], alt: first[1], altEs: first[2], order: 0 };
  }
  for (const image of currentImages) {
    if (!LEGACY_OFFICE_GALLERY_PLACEHOLDERS.has(image.imageUrl)) continue;
    const index = Math.max(0, Math.min(OFFICE_GALLERY_DEFAULTS.length - 1, image.order ?? 0));
    const item = OFFICE_GALLERY_DEFAULTS[index];
    await storage.updateOfficeImage(image.id, { imageUrl: item[0], alt: item[1], altEs: item[2], order: index });
    image.imageUrl = item[0];
    image.alt = item[1];
    image.altEs = item[2];
    image.order = index;
  }
  const occupiedOrders = new Set(currentImages.map((image) => image.order ?? 0));
  for (let index = 0; index < OFFICE_GALLERY_DEFAULTS.length; index += 1) {
    if (occupiedOrders.has(index)) continue;
    const item = OFFICE_GALLERY_DEFAULTS[index];
    await storage.createOfficeImage({ imageUrl: item[0], alt: item[1], altEs: item[2], order: index });
  }
}

const PRACTICE_HOME_IMAGES: Record<string, string> = {
  "administrative-law": "/images/banners/13.jpg",
  "antitrust-competition": "/images/banners/banner_competition.jpg",
  arbitration: "/images/banners/3.jpg",
  "banking-finance": "/images/banners/4.jpg",
  "bankruptcy-restructuring": "/images/banners/5.jpg",
  "corporate-ma": "/images/banners/7-a.jpg",
  "energy-natural-resources": "/images/banners/home-slider-01.jpg",
  environmental: "/images/banners/banner_environmental.jpg",
  esg: "/images/esg.jpeg",
  "immigration-global-mobility": "/images/banners/image.png",
  "intellectual-property": "/images/banners/banner_ip.jpg",
  "international-trade": "/images/banners/11.jpg",
  "investigations-anticorruption": "/images/banners/home-slider-02.jpg",
  "labor-employment": "/images/banners/12.jpg",
  litigation: "/images/banners/13.jpg",
  "projects-infrastructure": "/images/banners/18.jpg",
  "real-estate": "/images/banners/14.jpg",
  tax: "/images/banners/15.jpg",
  "telecommunications-media-technology": "/images/banners/16.jpg",
};

const INDUSTRY_HOME_IMAGES: Record<string, string> = {
  "automotive-mobility-manufacturing": "/images/banners/1_ind.jpg",
  "consumer-goods": "/images/banners/francesca-grima-vwZo1zAYPws-unsplash_1.jpg",
  "energy-natural-resources-industry": "/images/banners/3_ind.jpg",
  "financial-services": "/images/banners/4_ind.jpg",
  "pharmaceutical-life-sciences": "/images/banners/5_ind.jpg",
  "real-estate-industry": "/images/_banners/pexels-photo-3637943.jpeg",
  "technology-industry": "/images/_banners/pexels-googledeepmind-18069816.jpg",
};

/**
 * Completa únicamente huecos heredados del HTML capturado. Nunca pisa imágenes ni
 * testimonios administrados: después del primer arranque, el panel es la fuente de verdad.
 */
async function ensureHomeContentData(): Promise<void> {
  const [practices, industries, currentTestimonials] = await Promise.all([
    storage.getPracticeGroups(),
    storage.getIndustryGroups(),
    storage.getTestimonials(),
  ]);
  await Promise.all([
    ...practices
      .filter((group) => !group.imageUrl && PRACTICE_HOME_IMAGES[group.slug])
      .map((group) => storage.updatePracticeGroup(group.id, { imageUrl: PRACTICE_HOME_IMAGES[group.slug] })),
    ...industries
      .filter((group) => !group.imageUrl && INDUSTRY_HOME_IMAGES[group.slug])
      .map((group) => storage.updateIndustryGroup(group.id, { imageUrl: INDUSTRY_HOME_IMAGES[group.slug] })),
  ]);

  if (!currentTestimonials.length) {
    const defaults = [
      {
        quote: "Von Wobeser y Sierra, S.C. is a full-service law firm that has successfully blended elite corporate and disputes work. It is possibly the only firm in this market with perfectly balanced strength in both areas, making it well served to assist companies with the most challenging legal matters.",
        quoteEs: "Von Wobeser y Sierra, S.C. es una firma de servicio integral que ha combinado exitosamente trabajo corporativo y contencioso de élite. Es posiblemente la única firma de este mercado con una fortaleza perfectamente equilibrada en ambas áreas, lo que le permite asistir a empresas en los asuntos legales más desafiantes.",
        authorName: "Latin Lawyer",
        source: "Latin Lawyer",
        sourceEs: "Latin Lawyer",
        isFeatured: true,
        published: true,
        order: 1,
      },
      {
        quote: "With a high-profile client base across Latin America, Europe and the US, Von Wobeser y Sierra, S.C.'s service corresponds to that of a highly qualified, international firm.",
        quoteEs: "Con una destacada base de clientes en América Latina, Europa y Estados Unidos, el servicio de Von Wobeser y Sierra, S.C. corresponde al de una firma internacional altamente calificada.",
        authorName: "Legal 500",
        source: "Legal 500",
        sourceEs: "Legal 500",
        isFeatured: true,
        published: true,
        order: 2,
      },
      {
        quote: "This is a firm with the capacity to give comprehensive and practical advice. The lawyers are committed to the client and are always accessible.",
        quoteEs: "Es una firma con la capacidad de brindar asesoría integral y práctica. Los abogados están comprometidos con el cliente y siempre están disponibles.",
        authorName: "Chambers & Partners Latin America",
        source: "Chambers & Partners Latin America",
        sourceEs: "Chambers & Partners Latin America",
        isFeatured: true,
        published: true,
        order: 3,
      },
    ];
    for (const testimonial of defaults) await storage.createTestimonial(testimonial);
  }
}

/**
 * Wires the original (mirror) frontend to our backend.
 * Registered AFTER the API routes and BEFORE the SPA catch-all.
 */
export async function createMirrorRuntime() {
  const mirrorDir = getMirrorDir();

  if (!fs.existsSync(mirrorPath(TEMPLATES.attorney.en))) {
    console.warn(
      `[mirror] Plantilla no encontrada en ${mirrorPath(TEMPLATES.attorney.en)} — ` +
        `define MIRROR_DIR si el espejo está en otra ruta. Rutas del espejo deshabilitadas.`,
    );
    return null;
  }

  console.log(`[mirror] Sirviendo frontend del espejo desde: ${mirrorDir}`);
  warmTemplates(); // precarga plantillas a RAM (evita I/O de disco por request)
  try {
    if (process.env.SECURITY_READ_ONLY_SMOKE !== "true" && !isMigrationReadOnlyEnabled()) {
      await seedConfigDefaults();
      await seedCookiePolicy();
      await ensureOfficeShowcaseData();
      await ensureHomeContentData();
    }
    // Base URL para canonical/OG/JSON-LD: una URL de producción explícita, el
    // dominio publicado de Replit o, fuera de él, la key editable site_url.
    const configAtStartup = await getConfigMap();
    setBaseUrl(configAtStartup.site_url?.value);
    // GA4 / Search Console: igual que site_url, se lee una vez al arrancar — si se
    // editan en el panel después, el cambio aplica hasta el siguiente restart.
    setAnalyticsConfig({
      ga4MeasurementId: configAtStartup.ga4_measurement_id?.value,
      searchConsoleVerification: configAtStartup.google_site_verification?.value,
    });
    setFaviconConfig(configAtStartup.site_favicon?.value);
  } catch (e) {
    console.warn("[mirror] No se pudo sembrar siteConfig:", (e as Error).message);
  }
  let ids: IdMaps = { attorney: new Map(), practice: new Map(), industry: new Map() };
  try {
    ids = await buildIdMaps();
    console.log(
      `[mirror] Mapa de URLs originales: ${ids.attorney.size} abogados, ${ids.practice.size} prácticas, ${ids.industry.size} industrias.`,
    );
  } catch (e) {
    console.warn("[mirror] No se pudo construir el mapa de IDs:", (e as Error).message);
  }

  // Mapa de publicaciones originales (p_id de Joomla → slug de news), para servir
  // las URLs originales /index.php/publication/p_id-X.html de forma dinámica.
  const pubIdMap = new Map<string, string>();
  try {
    for (const n of await storage.getNews()) {
      const lid = (n as any).legacyId;
      if (lid) pubIdMap.set(String(lid), n.slug);
    }
    console.log(`[mirror] Mapa de publicaciones originales: ${pubIdMap.size}`);
  } catch (e) {
    console.warn("[mirror] No se pudo construir pubIdMap:", (e as Error).message);
  }

  // ---------- Reusable serve helpers ------------------------------------
  const withDisabledExternalUrls = async <T extends { id: string }>(items: T[]): Promise<Array<T & { disabledExternalUrls: string[] }>> =>
    Promise.all(items.map(async (item) => ({
      ...item,
      disabledExternalUrls: await storage.getDisabledNewsExternalUrls(item.id),
    })));

  const serveAttorney = async (slug: string | undefined, lang: Lang, res: Response, next: NextFunction) => {
    if (!slug) return next();
    let member = await storage.getTeamMemberBySlug(slug);
    if (!member) member = await storage.getTeamMemberById(slug);
    if (!member) return next();
    if ((member as any).published === false) return next(); // oculto
    const [groups, relatedNews, config] = await Promise.all([
      getAttorneyGroups(member.id),
      storage.getPublishedNewsByTeamMemberIdPage({
        teamMemberId: member.id,
        // La ficha es una selección editorial breve; el archivo por autor
        // conserva el resto de publicaciones y su paginación normal.
        limit: 3,
        offset: 0,
        language: lang,
      }).then((result) => withDisabledExternalUrls(result.rows)).catch(() => []),
      getConfigMap(),
    ]);
    const typography = await getEditorialTypography("team_member", member.id);
    const associateExperienceVisible = cfg(config, "associate_experience_visible", lang).trim().toLowerCase() === "true";
    sendPage(res, renderAttorney(
      pick(TEMPLATES.attorney, lang),
      { ...member, ...groups, relatedNews },
      lang,
      typography,
      { associateExperienceVisible },
    ));
  };

  const serveList = async (
    category: string,
    lang: Lang,
    res: Response,
    next: NextFunction,
    query: Record<string, any> = {},
    showSearch = false,
  ) => {
    // La búsqueda ahora vive en su propia página de resultados (como el sitio
    // real). Si llega un /attorneys?q=... (link viejo) se redirige a /buscar.
    const q = (query.q as string) || undefined;
    const position = (query.position as string) || undefined;
    const practiceSlug = (query.practice as string) || undefined;
    if (q || position || practiceSlug) {
      const p = new URLSearchParams();
      if (q) p.set("q", q);
      if (position) p.set("position", position);
      if (practiceSlug) p.set("practice", practiceSlug);
      if (lang === "en") p.set("lang", "en");
      return res.redirect(302, `/attorneys/buscar?${p.toString()}`);
    }

    const cat = CATEGORIES[category];
    if (!cat) return next();
    const all = await storage.getTeamMembers();
    const attorneys = all
      .filter((m: any) => m.title === cat.title && m.published !== false)
      .sort(comparePublicAttorneyDirectoryOrder);

    const practiceGroupsRaw = await storage.getPracticeGroups();
    const practiceGroups = practiceGroupsRaw
      .filter(isVisiblePublicPractice)
      .map((pg) => ({ slug: pg.slug, name: pg.name, nameEs: pg.nameEs }));

    sendPage(res, renderAttorneyList(pick(TEMPLATES.list, lang), attorneys, category, lang, { practiceGroups, showSearch }));
  };

  const serveAttorneyDirectory = async (lang: Lang, res: Response, query: Record<string, unknown>) => {
    const parsed = attorneyDirectoryQuerySchema.safeParse(query);
    if (!parsed.success) {
      res
        .status(400)
        .type("html")
        .send(`<!doctype html><html lang="${lang}"><meta charset="utf-8"><title>${lang === "es" ? "Filtros inválidos" : "Invalid filters"}</title><body><p>${lang === "es" ? "Revisa los filtros e inténtalo de nuevo." : "Review the filters and try again."}</p></body></html>`);
      return;
    }

    const filters: AttorneyDirectoryFilters = {
      q: parsed.data.q || "",
      role: parsed.data.role || "",
      practice: parsed.data.practice || "",
      letter: (parsed.data["set-letter"] ?? parsed.data.letter ?? "").toUpperCase(),
    };
    const [members, practiceGroupsRaw, practiceRelations, config] = await Promise.all([
      storage.getTeamMembers(),
      storage.getPracticeGroups(),
      db
        .select({
          teamMemberId: teamMemberPracticeGroups.teamMemberId,
          practiceSlug: practiceGroups.slug,
          published: practiceGroups.published,
        })
        .from(teamMemberPracticeGroups)
        .innerJoin(practiceGroups, eq(teamMemberPracticeGroups.practiceGroupId, practiceGroups.id)),
      getConfigMap(),
    ]);

    const practices: AttorneyDirectoryPractice[] = practiceGroupsRaw
      .filter(isVisiblePublicPractice)
      .map((group) => ({
        slug: group.slug,
        name: lang === "es" ? group.nameEs : group.name,
      }));
    const publicPracticeSlugs = new Set(practices.map((practice) => practice.slug));
    const practicesByAttorney = new Map<string, string[]>();
    for (const relation of practiceRelations) {
      if (relation.published === false || !publicPracticeSlugs.has(relation.practiceSlug)) continue;
      const memberPractices = practicesByAttorney.get(relation.teamMemberId) || [];
      memberPractices.push(relation.practiceSlug);
      practicesByAttorney.set(relation.teamMemberId, memberPractices);
    }

    const roleByTitle = new Map(
      ATTORNEY_DIRECTORY_ROLE_KEYS.map((role) => [CATEGORIES[role].title, role]),
    );
    const attorneys: AttorneyDirectoryItem[] = members
      .filter((member) => member.published !== false && roleByTitle.has(member.title))
      .sort(comparePublicAttorneyDirectoryOrder)
      .map((member) => {
        const role = roleByTitle.get(member.title)!;
        return {
          id: member.id,
          slug: member.slug,
          name: getAttorneyPublicName(member),
          searchName: getAttorneySearchName(member),
          role,
          roleLabel: getLocalizedAttorneyTitle(member, lang) || CATEGORIES[role][lang === "es" ? "es" : "en"],
          imageUrl: member.imageUrl || "",
          practiceSlugs: practicesByAttorney.get(member.id) || [],
        };
      });

    await sendPage(res, renderAttorneyDirectory(
      pick(TEMPLATES.list, lang),
      attorneys,
      practices,
      filters,
      lang,
      attorneyDirectoryPresetFromConfig(config),
    ));
  };

  // Ruta histórica: sus filtros se convierten a los del directorio unificado.
  const redirectAttorneySearch = (lang: Lang, res: Response, query: Record<string, unknown>) => {
    const rawQuery = typeof query.q === "string" ? query.q.trim().slice(0, 200) : "";
    const kind = typeof query.kind === "string" ? query.kind.toLowerCase() : "";
    const position = typeof query.position === "string" ? query.position : "";
    const practice = typeof query.practice === "string" ? query.practice : "";
    const params = new URLSearchParams();

    if (kind === "letter") {
      const letter = rawQuery.charAt(0).toUpperCase();
      if (/^[A-Z]$/.test(letter)) params.set("letter", letter);
    } else if (rawQuery) {
      params.set("q", rawQuery);
    }
    if (ATTORNEY_DIRECTORY_ROLE_KEYS.includes(position as typeof ATTORNEY_DIRECTORY_ROLE_KEYS[number])) {
      params.set("role", position);
    }
    if (/^[a-z0-9-]{1,160}$/.test(practice)) params.set("practice", practice);
    if (lang === "en") params.set("lang", "en");

    res.redirect(302, `/attorneys${params.size ? `?${params.toString()}` : ""}`);
  };

  const servePractice = async (slug: string | undefined, lang: Lang, res: Response, next: NextFunction) => {
    if (!slug) return next();
    if (!isPublicPracticeSlug(slug)) {
      res.status(410).type("html").send(lang === "es" ? "Esta sección fue retirada" : "This section has been retired");
      return;
    }
    const group = await storage.getPracticeGroupBySlug(slug);
    if (!group) return next();
    if ((group as any).published === false) return next(); // oculta
    const attorneys = await getAttorneysByPractice(group.id);
    const typography = await getEditorialTypography("practice_group", group.id);
    sendPage(res, renderSingle(pick(TEMPLATES.practice, lang), group, attorneys, "practice", lang, typography));
  };

  const serveIndustry = async (slug: string | undefined, lang: Lang, res: Response, next: NextFunction) => {
    if (!slug) return next();
    const group = await storage.getIndustryGroupBySlug(slug);
    if (!group) return next();
    if ((group as any).published === false) return next(); // oculta
    const attorneys = await getAttorneysByIndustry(group.id);
    const typography = await getEditorialTypography("industry_group", group.id);
    sendPage(res, renderSingle(pick(TEMPLATES.industry, lang), group, attorneys, "industry", lang, typography));
  };

  // Un borrador (published=false) o un artículo programado a futuro (publishAt) NUNCA debe
  // ser públicamente alcanzable — antes no se comprobaba en la ruta de detalle ni en los
  // listados, así que una noticia sin publicar filtraba su URL con solo conocer el slug.
  const isPubliclyVisible = (n: { published?: boolean | null; publishAt?: Date | string | null }): boolean =>
    n.published === true && (!n.publishAt || new Date(n.publishAt) <= new Date());

  const serveNewsDetail = async (slug: string | undefined, lang: Lang, res: Response, next: NextFunction) => {
    if (!slug) return next();
    const item = await storage.getNewsBySlug(slug);
    if (!item || !isPubliclyVisible(item)) return next();
    const [publicRelations, disabledExternalUrls] = await Promise.all([
      storage.getPublicNewsTeamMemberRelations(item.id),
      storage.getDisabledNewsExternalUrls(item.id),
    ]);
    const relatedTeamMembers = publicRelations
      .filter((relation) => relation.member.published === true)
      .map((relation) => ({ ...relation.member, relationshipRole: relation.relationshipRole }));
    const authorTeamMemberIds = relatedTeamMembers
      .filter((member) => member.relationshipRole === "author")
      .map((member) => member.id);
    // La red editorial conecta las publicaciones por temas, autores y categoría. La
    // ponderación está en storage para que cada criterio se pueda controlar desde CMS.
    const relatedNews = await storage.getEditorialRecommendations({
      excludeNewsId: item.id,
      teamMemberIds: authorTeamMemberIds,
      tags: item.tags || [],
      category: item.category,
      limit: 6,
    }).then(withDisabledExternalUrls).catch(() => []);
    const typography = await getEditorialTypography("news", item.id);
    sendPage(res, renderNewsDetail(pick(TEMPLATES.newsDetail, lang), { ...item, disabledExternalUrls, relatedTeamMembers, relatedNews }, lang, typography));
  };

  type PublicAuthorFilter = { id: string; slug: string; name: string };

  const serveNewsList = async (lang: Lang, res: Response, page = 1, query = "", author?: PublicAuthorFilter) => {
    const perPage = 24;
    const fetchAuthorPage = (targetPage: number) => storage.getPublishedNewsByTeamMemberIdPage({
      teamMemberId: author!.id,
      query: query.length >= 2 ? query : undefined,
      limit: perPage,
      offset: (targetPage - 1) * perPage,
      language: lang,
    });
    const authorPage = author && (!query || query.length >= 2) ? await fetchAuthorPage(page) : null;
    // Cuenta + una sola página en SQL, en vez de traer TODAS las noticias y paginar en memoria.
    const searched = !author && query.length >= 2
      ? await storage.searchPublishedNewsPage({ query, limit: perPage, offset: Math.max(0, page - 1) * perPage })
      : null;
    const total = authorPage?.total ?? searched?.total ?? (query ? 0 : await storage.getPublishedNewsCount());
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const p = Math.min(Math.max(1, page), totalPages);
    const slice = author
      ? (authorPage && p === page ? authorPage.rows : (query && query.length < 2 ? [] : (await fetchAuthorPage(p)).rows))
      : query.length >= 2 && p !== page
      ? (await storage.searchPublishedNewsPage({ query, limit: perPage, offset: (p - 1) * perPage })).rows
      : searched?.rows ?? (query ? [] : await storage.getPublishedNewsPage(perPage, (p - 1) * perPage));
    sendPage(
      res,
      renderNewsList(pick(TEMPLATES.newsList, lang), slice, lang, { page: p, totalPages, totalItems: total }, { query, author }),
    );
  };

  // "Artículos"/"Articles": antes HTML congelado (express.static), enlazando a las mismas
  // noticias legacy p_id-N.html que "Noticias" — resulta que en la DB ya conviven bajo la
  // MISMA tabla `news`, distinguidas por `category` ("news" vs "articles", ~284 filas). Se
  // reusa renderNewsList con opts distintos; Noticias sigue sin filtrar por categoría (no se
  // le quita nada de lo que ya mostraba), así que un artículo puede aparecer en ambos listados.
  const serveArticlesList = async (lang: Lang, res: Response, page = 1, query = "", author?: PublicAuthorFilter) => {
    const perPage = EDITORIAL_ARCHIVE_PAGE_SIZE;
    const fetchAuthorPage = (targetPage: number) => storage.getPublishedNewsByTeamMemberIdPage({
      teamMemberId: author!.id,
      query: query.length >= 2 ? query : undefined,
      category: "articles",
      limit: perPage,
      offset: (targetPage - 1) * perPage,
      language: lang,
    });
    const authorPage = author && (!query || query.length >= 2) ? await fetchAuthorPage(page) : null;
    const searched = !author && query.length >= 2
      ? await storage.searchPublishedNewsPage({
          query,
          limit: perPage,
          offset: Math.max(0, page - 1) * perPage,
          category: "articles",
        })
      : null;
    const total = authorPage?.total ?? searched?.total ?? (query ? 0 : await storage.getPublishedNewsCount("articles"));
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const p = Math.min(Math.max(1, page), totalPages);
    const slice = author
      ? (authorPage && p === page ? authorPage.rows : (query && query.length < 2 ? [] : (await fetchAuthorPage(p)).rows))
      : query.length >= 2 && p !== page
      ? (await storage.searchPublishedNewsPage({ query, limit: perPage, offset: (p - 1) * perPage, category: "articles" })).rows
      : searched?.rows ?? (query ? [] : await storage.getPublishedNewsPage(perPage, (p - 1) * perPage, "articles"));
    sendPage(
      res,
      renderNewsList(pick(TEMPLATES.articlesList, lang), slice, lang, { page: p, totalPages, totalItems: total }, {
        // Misma convención que "/news": una sola ruta corta, idioma por ?lang=en (no
        // /publicaciones/articulos como ruta "limpia" — esa forma queda solo como legacy).
        basePath: "/articles",
        title: { en: "Articles | Von Wobeser y Sierra", es: "Artículos | Von Wobeser y Sierra" },
        description: {
          en: "Legal articles and opinion pieces authored by Von Wobeser y Sierra attorneys.",
          es: "Artículos y columnas de opinión escritos por los abogados de Von Wobeser y Sierra.",
        },
        crumbLabel: { en: "Articles", es: "Artículos" },
        editorialHeader: {
          eyebrow: { en: "Insights", es: "Insights" },
          title: { en: "Articles", es: "Artículos" },
          description: {
            en: "Legal articles and opinion pieces authored by Von Wobeser y Sierra attorneys.",
            es: "Artículos y columnas de opinión escritos por los abogados de Von Wobeser y Sierra.",
          },
          officeVisual: {
            image: "/img/Collage/collage_02.jpg",
            scene: "meeting-room",
            alt: {
              en: "Meeting room at Von Wobeser y Sierra's new offices",
              es: "Sala de juntas de las nuevas oficinas de Von Wobeser y Sierra",
            },
          },
        },
        query,
        author,
      }),
    );
  };

  const serveGlobalSearch = async (lang: Lang, res: Response, query: string) => {
    const normalized = normalizeStr(query);
    const empty = { team: [], practiceGroups: [], industryGroups: [], news: [], events: [], pages: [] };
    if (normalized.length < 2) {
      return sendPage(res, renderGlobalSearch(pick(TEMPLATES.publications, lang), empty, query, lang));
    }
    const [teamRows, practiceRows, industryRows, newsRows, eventRows, config] = await Promise.all([
      storage.getTeamMembers(),
      storage.getPracticeGroups(),
      storage.getIndustryGroups(),
      storage.searchNews(query, 20),
      storage.getEvents(),
      getConfigMap(),
    ]);
    const editorialPages = buildSearchableEditorialPages(config, await getNavigationAvailability(config));
    const contains = (...values: Array<string | null | undefined>) =>
      values.some((value) => normalizeStr(value || "").includes(normalized));
    const results = {
      team: teamRows
        .filter((item) => item.published !== false && contains(getAttorneySearchName(item), item.title, item.titleEs, item.role, item.roleEs, item.bio, item.bioEs))
        .slice(0, 20),
      practiceGroups: practiceRows
        .filter((item) => isVisiblePublicPractice(item) && contains(item.name, item.nameEs, item.description, item.descriptionEs))
        .slice(0, 12),
      industryGroups: industryRows
        .filter((item) => item.published !== false && contains(item.name, item.nameEs, item.description, item.descriptionEs))
        .slice(0, 12),
      news: newsRows,
      events: eventRows
        .filter((item) => contains(item.title, item.titleEs, item.description, item.descriptionEs, item.location, item.locationEs))
        .slice(0, 12),
      pages: editorialPages.filter((item) => contains(item.title, item.titleEs, item.description, item.descriptionEs)),
    };
    return sendPage(res, renderGlobalSearch(pick(TEMPLATES.publications, lang), results, query, lang));
  };

  const serveHome = async (lang: Lang, res: Response, bypassCache = false) => {
    const build = async () => {
      const config = await getConfigMap();
      const configuredPages = Number.parseInt(cfg(config, "home_news_pages", "en"), 10);
      const newsLimit = (Number.isFinite(configuredPages)
        ? Math.min(10, Math.max(1, configuredPages))
        : 5) * 2;
      const newsCandidateLimit = Math.min(80, newsLimit * 4);
      // Las destacadas van primero y el resto se completa con las publicadas más
      // recientes. La cantidad se administra como páginas de dos noticias.
      const [featured, rankings, practices, industries, testimonials, persistentMediaPaths] = await Promise.all([
        storage.getFeaturedNews(newsCandidateLimit),
        storage.getRankings(),
        storage.getPracticeGroups(),
        storage.getIndustryGroups(),
        storage.getTestimonials(),
        listPersistentPublicMediaPaths(),
      ]);
      let heroNews = featured.filter((item) => hasCompatibleLocalizedNewsTitle(item, lang)).slice(0, newsLimit);
      if (heroNews.length < newsLimit) {
        const recent = await storage.getRecentPublishedNews(newsCandidateLimit);
        heroNews = [
          ...heroNews,
          ...recent.filter((item) => hasCompatibleLocalizedNewsTitle(item, lang) && !heroNews.some((featuredItem) => featuredItem.id === item.id)),
        ].slice(0, newsLimit);
      }
      const testimonialTypography = await getEditorialTypographyForEntities("testimonial", testimonials.map((item) => item.id));
      return renderHome(
        pick(TEMPLATES.home, lang), heroNews, config, lang, rankings, practices, industries,
        testimonials.map((item) => ({ ...item, typography: testimonialTypography.get(item.id) })),
        persistentMediaPaths,
      );
    };
    const html = bypassCache ? await build() : await getCachedPublicPage(`home:${lang}`, build);
    await sendPage(res, html);
  };

  const serveOfficeShowcase = async (lang: Lang, res: Response) => {
    const [config, officeRows, gallery] = await Promise.all([
      getConfigMap(),
      storage.getOffices(),
      storage.getOfficeImages(),
    ]);
    const office = officeRows.find((item) => item.isHeadquarters && item.published !== false)
      || officeRows.find((item) => item.published !== false);
    if (config.office_published?.value === "false" || !office) {
      await sendPage(
        res,
        renderNotFound(pick(TEMPLATES.publications, lang), lang, lang === "es" ? "/nuevas-oficinas/" : "/new-offices/"),
        404,
      );
      return;
    }
    const html = renderOfficeShowcase(
      pick(TEMPLATES.offices, lang),
      config,
      lang,
      office,
      gallery,
      pick(TEMPLATES.home, lang),
    );
    sendPage(res, html);
  };

  const serveFirmLanding = async (lang: Lang, res: Response) => {
    const [config, members, practices, industries] = await Promise.all([
      getConfigMap(),
      storage.getTeamMembers(),
      storage.getPracticeGroups(),
      storage.getIndustryGroups(),
    ]);
    sendPage(
      res,
      renderFirmLanding(pick(TEMPLATES.firm, lang), config, lang, {
        teamMembers: members,
        practices,
        industries,
      }),
    );
  };

  // Páginas institucionales del espejo: conservan su diseño capturado y reciben únicamente
  // el contenido editable de siteConfig. El resumen del video usa una ruta independiente.
  const servePage = async (which: keyof typeof PAGE_KEYS, lang: Lang, res: Response) => {
    const [config, contactPractices] = await Promise.all([
      getConfigMap(),
      which === "contact" ? storage.getPracticeGroups() : Promise.resolve([]),
    ]);
    const seo = PAGE_SEO[which];
    sendPage(
      res,
      renderPage(
        pick(TEMPLATES[which], lang),
        config,
        lang,
        PAGE_KEYS[which],
        { path: seo.path[lang], title: seo.title[lang], alternatePaths: seo.path },
        which === "careers"
          ? ($: cheerio.CheerioAPI) => applyCareersFormFix($, lang, config)
          : which === "contact"
            ? ($: cheerio.CheerioAPI) => applyContactForm($, lang, config, contactPractices)
            : which === "publications"
              ? ($: cheerio.CheerioAPI) => applyPublicationsSearch($, lang)
            : which === "diversity"
              ? ($: cheerio.CheerioAPI) => applyDiversityVideoGallery($, config, lang)
              : which === "proBono"
                ? ($: cheerio.CheerioAPI) => applyProBonoMedia($, config, lang)
                : undefined,
        // Diversidad conserva una galería heredada debajo de su texto, por lo que
        // necesita insertar el contenido administrable antes de esa galería. Pro
        // Bono no: sus logotipos se reconstruyen en applyProBonoMedia(), así que
        // anteponer el cuerpo del CMS dejaba dos copias del mismo texto visible.
        which === "diversity" ? { bodyMode: "prepend" } : undefined,
      ),
    );
  };

  // Listados "Prácticas" / "Grupos de práctica por industria": antes eran HTML estático
  // congelado (18/19-jun-2026), desconectado de la base de datos. Ahora se generan desde
  // storage.getPracticeGroups()/getIndustryGroups() en cada request, y enlazan a la ruta
  // dinámica /practice|industry/:slug (no a la vieja URL numérica legacy).
  const GROUP_LIST_SEO = {
    practice: {
      path: { en: "/capabilities/practices", es: "/capacidades/practicas" },
      title: { en: "Practices | Von Wobeser y Sierra", es: "Áreas de práctica | Von Wobeser y Sierra" },
      crumb: { en: "Practices", es: "Áreas de práctica" },
      desc: {
        en: "Explore the practice areas of Von Wobeser y Sierra, a full-service Mexican law firm.",
        es: "Conoce las áreas de práctica de Von Wobeser y Sierra, despacho mexicano de servicio integral.",
      },
      template: TEMPLATES.practiceList,
      linkPrefix: "/practice/" as const,
    },
    industry: {
      path: { en: "/capabilities/industries", es: "/capacidades/industrias" },
      title: { en: "Industry Groups | Von Wobeser y Sierra", es: "Grupos de práctica por industria | Von Wobeser y Sierra" },
      crumb: { en: "Industry Groups", es: "Grupos de práctica por industria" },
      desc: {
        en: "Explore the industry groups of Von Wobeser y Sierra, a full-service Mexican law firm.",
        es: "Conoce los grupos de práctica por industria de Von Wobeser y Sierra, despacho mexicano de servicio integral.",
      },
      template: TEMPLATES.industryList,
      linkPrefix: "/industry/" as const,
    },
  } as const;

  const serveGroupList = async (kind: keyof typeof GROUP_LIST_SEO, lang: Lang, res: Response) => {
    const seo = GROUP_LIST_SEO[kind];
    const [rows, config] = await Promise.all([
      kind === "practice" ? storage.getPracticeGroups() : storage.getIndustryGroups(),
      getConfigMap(),
    ]);
    const items: GroupListItem[] = rows
      .filter((r: any) => r.published !== false && (kind !== "practice" || isPublicPracticeSlug(r.slug)))
      .map((r: any) => ({ slug: r.slug, name: r.name, nameEs: r.nameEs, order: r.order }));
    sendPage(
      res,
      renderGroupList(pick(seo.template, lang), items, seo.linkPrefix, lang, {
        path: seo.path[lang],
        title: seo.title[lang],
        description: seo.desc[lang],
        crumbLabel: seo.crumb[lang],
      }, config),
    );
  };

  const wrap = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => fn(req, res, next).catch(next);

  const publicSearchSchema = z.string().trim().max(200);
  const publicAuthorSchema = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160);
  const parsePublicSearch = (value: unknown, lang: Lang, res: Response): string | null => {
    const parsed = publicSearchSchema.safeParse(typeof value === "string" ? value : "");
    if (parsed.success) return parsed.data;
    res
      .status(400)
      .type("html")
      .send(
        `<!doctype html><html lang="${lang}"><meta charset="utf-8"><title>${lang === "es" ? "Búsqueda inválida" : "Invalid search"}</title>` +
        `<body><p>${lang === "es" ? "La búsqueda no puede superar 200 caracteres." : "Search cannot exceed 200 characters."}</p></body></html>`,
      );
    return null;
  };
  const parsePublicPage = (value: unknown): number => {
    const parsed = z.coerce.number().int().min(1).max(10_000).safeParse(value || 1);
    return parsed.success ? parsed.data : 1;
  };
  const resolvePublicAuthor = async (value: unknown, lang: Lang, res: Response): Promise<PublicAuthorFilter | undefined | null> => {
    if (value === undefined || value === "") return undefined;
    const parsed = publicAuthorSchema.safeParse(typeof value === "string" ? value : "");
    if (!parsed.success) {
      res.status(400).type("html").send(
        `<!doctype html><html lang="${lang}"><meta charset="utf-8"><title>${lang === "es" ? "Autor inválido" : "Invalid author"}</title>` +
        `<body><p>${lang === "es" ? "El autor indicado no es válido." : "The requested author is invalid."}</p></body></html>`,
      );
      return null;
    }
    const member = await storage.getTeamMemberBySlug(parsed.data);
    if (!member || member.published !== true) {
      res.status(404).type("html").send(
        `<!doctype html><html lang="${lang}"><meta charset="utf-8"><title>${lang === "es" ? "Autor no encontrado" : "Author not found"}</title>` +
        `<body><p>${lang === "es" ? "No encontramos el abogado solicitado." : "We could not find the requested attorney."}</p></body></html>`,
      );
      return null;
    }
    return { id: member.id, slug: member.slug, name: getAttorneyPublicName(member) };
  };
  const searchRedirect = (rawKind: unknown, rawQuery: unknown, lang: Lang): string => {
    const kind = String(rawKind || "general").trim().toLowerCase();
    const query = String(rawQuery || "").trim().slice(0, 200);
    const path = ["noticias", "news"].includes(kind)
      ? "/news"
      : ["articulos", "articles"].includes(kind)
        ? "/articles"
        : "/search";
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (lang === "en") params.set("lang", "en");
    const suffix = params.toString();
    return suffix ? `${path}?${suffix}` : path;
  };


  return {
    ES_CATEGORY,
    MANAGED_VIDEO_CONFIG_KEY,
    TEMPLATES,
    VIDEO_SOURCE_ERROR,
    applyInternsContent,
    escHtml,
    ids,
    langOf,
    mirrorDir,
    normalizedManagedVideoValue,
    parsePublicPage,
    parsePublicSearch,
    pick,
    pubIdMap,
    redirectAttorneySearch,
    resolvePublicAuthor,
    searchRedirect,
    sendPage,
    serveArticlesList,
    serveAttorney,
    serveAttorneyDirectory,
    serveFirmLanding,
    serveGlobalSearch,
    serveGroupList,
    serveHome,
    serveIndustry,
    serveList,
    serveNewsDetail,
    serveNewsList,
    serveOfficeShowcase,
    servePage,
    servePractice,
    tpl,
    wrap,
  };
}

export type MirrorRuntime = NonNullable<Awaited<ReturnType<typeof createMirrorRuntime>>>;
