import * as cheerio from "cheerio";
import { buildVideoEmbedUrl, parseVideoSource } from "@shared/videoSource";
import { cfg, type ConfigMap } from "./siteConfig";
import { applySeo, breadcrumbNode } from "./seo";
import { renderRichText } from "./sanitize";
import { isVisiblePublicPractice } from "./publicPracticeGroups";

type Lang = "en" | "es";

type Publishable = {
  published?: boolean | null;
  slug?: string | null;
};

type FirmRanking = Publishable & {
  name?: string | null;
  nameEs?: string | null;
  publication?: string | null;
  publicationEs?: string | null;
  year?: number | null;
  category?: string | null;
  categoryEs?: string | null;
  ranking?: string | null;
  rankingEs?: string | null;
  description?: string | null;
  descriptionEs?: string | null;
  logoUrl?: string | null;
  externalUrl?: string | null;
  isHighlight?: boolean | null;
  order?: number | null;
};

export type FirmLandingData = {
  teamMembers?: Publishable[];
  practices?: Publishable[];
  industries?: Publishable[];
  rankings?: FirmRanking[];
};

const FALLBACK = {
  en: {
    valuesIntro: "The principles that guide our work and our relationship with clients.",
    values: [
      ["Integrity", "We do what we say, work with clarity and uphold the highest ethical standards."],
      ["Excellence", "We pursue the highest quality in our legal services and seek effective, innovative solutions."],
      ["Commitment", "We place the client’s interests first and work to understand their business and environment."],
      ["Agility", "We provide comprehensive and timely counsel that adds value to every matter."],
      ["Diversity", "A highly prepared and diverse team enriches our perspective and strengthens our practice."],
    ],
    cultureSubtitle: "Professional rigor, collaboration and continuous learning",
    cultureIntro: "We cultivate an environment in which legal talent works across disciplines, shares knowledge and develops solutions for complex matters.",
    culture: [
      ["Modern workplace", "Facilities conceived to promote collaboration, creativity and well-being."],
      ["Team collaboration", "Our practices and industry groups combine specialized perspectives to provide comprehensive counsel."],
      ["Professional development", "Continuous learning, mentoring and professional growth are central to the development of our team."],
      ["Community involvement", "Our Pro Bono work and collaboration with civil society extend our impact beyond client matters."],
      ["Sustainable performance", "We seek working practices that support consistent excellence and the well-being of our people."],
      ["Innovation mindset", "We value initiative, technology and new approaches that improve the way we deliver legal services."],
    ],
    diversitySubtitle: "Different perspectives strengthen our firm",
    diversityIntro: "We are committed to an inclusive workplace where every person is valued, respected and able to develop their potential.",
    diversityCommitment: "Diversity is a core value that shapes how we work, grow and serve our clients. We continually review our practices to contribute to a more equitable legal profession.",
    diversity: [
      ["Inclusive recruitment", "We evaluate talent through skills, experience and potential, promoting equal opportunities."],
      ["Gender equality", "We promote the development and participation of women at every level of the organization."],
      ["Equal opportunities", "Our people have access to development resources, challenging matters and professional growth."],
      ["Inclusive workplace", "We foster a respectful environment in which differences are valued and every voice can be heard."],
    ],
    rankingsIntro: "The firm and its attorneys are consistently recognized by leading international legal directories.",
    rankingsEmpty: "Recognition records can be managed from the administration panel.",
    proBonoText: "For more than 35 years, our firm has supported access to justice through legal services for people and organizations that need them.",
    careersText: "Build your career alongside a team that combines legal excellence, collaboration and continuous learning.",
    finalText: "Meet our team, explore our capabilities or contact us.",
  },
  es: {
    valuesIntro: "Los principios que guían nuestro trabajo y nuestra relación con los clientes.",
    values: [
      ["Integridad", "Hacemos lo que decimos, trabajamos con claridad y nos conducimos bajo los estándares éticos más altos."],
      ["Excelencia", "Buscamos la más alta calidad en nuestros servicios jurídicos y soluciones efectivas e innovadoras."],
      ["Compromiso", "Anteponemos el interés del cliente y trabajamos para comprender su negocio y su entorno."],
      ["Agilidad", "Brindamos asesoría integral y oportuna que agrega valor a cada asunto."],
      ["Diversidad", "Un equipo altamente preparado y diverso enriquece nuestra perspectiva y fortalece nuestra práctica."],
    ],
    cultureSubtitle: "Rigor profesional, colaboración y aprendizaje continuo",
    cultureIntro: "Cultivamos un entorno en el que el talento jurídico trabaja entre disciplinas, comparte conocimiento y desarrolla soluciones para asuntos complejos.",
    culture: [
      ["Espacios de trabajo modernos", "Instalaciones concebidas para promover la colaboración, la creatividad y el bienestar."],
      ["Colaboración en equipo", "Nuestras prácticas y grupos por industria combinan perspectivas especializadas para brindar asesoría integral."],
      ["Desarrollo profesional", "El aprendizaje continuo, la mentoría y el crecimiento profesional son centrales para el desarrollo de nuestro equipo."],
      ["Participación comunitaria", "Nuestro trabajo Pro Bono y la colaboración con la sociedad civil extienden nuestro impacto más allá de los asuntos de clientes."],
      ["Desempeño sostenible", "Buscamos prácticas de trabajo que favorezcan la excelencia constante y el bienestar de nuestra gente."],
      ["Mentalidad de innovación", "Valoramos la iniciativa, la tecnología y nuevas formas de mejorar la prestación de nuestros servicios jurídicos."],
    ],
    diversitySubtitle: "Las perspectivas diferentes fortalecen nuestra firma",
    diversityIntro: "Estamos comprometidos con un entorno incluyente en el que cada persona sea valorada, respetada y pueda desarrollar su potencial.",
    diversityCommitment: "La diversidad es un valor central que define cómo trabajamos, crecemos y servimos a nuestros clientes. Revisamos continuamente nuestras prácticas para contribuir a una profesión jurídica más equitativa.",
    diversity: [
      ["Contratación incluyente", "Evaluamos el talento por sus capacidades, experiencia y potencial, promoviendo la igualdad de oportunidades."],
      ["Igualdad de género", "Promovemos el desarrollo y la participación de las mujeres en todos los niveles de la organización."],
      ["Igualdad de oportunidades", "Nuestra gente tiene acceso a recursos de desarrollo, asuntos desafiantes y crecimiento profesional."],
      ["Entorno incluyente", "Fomentamos un entorno respetuoso en el que se valoran las diferencias y todas las voces pueden ser escuchadas."],
    ],
    rankingsIntro: "La firma y sus abogados son reconocidos constantemente por los principales directorios jurídicos internacionales.",
    rankingsEmpty: "Los reconocimientos pueden administrarse desde el panel.",
    proBonoText: "Durante más de 35 años, nuestra firma ha apoyado el acceso a la justicia mediante servicios jurídicos para personas y organizaciones que los necesitan.",
    careersText: "Desarrolla tu carrera junto a un equipo que combina excelencia jurídica, colaboración y aprendizaje continuo.",
    finalText: "Conoce a nuestro equipo, explora nuestras capacidades o ponte en contacto.",
  },
} as const;

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escAttr(value: unknown): string {
  return esc(value).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function safeMediaUrl(value: unknown): string {
  const url = String(value ?? "").trim();
  if (/^\/[a-z0-9_./%+@~:-]+(?:\?[^"'<>]*)?$/i.test(url)) return url;
  if (/^https:\/\/[a-z0-9.-]+(?:[/:?#][^\s"'<>]*)?$/i.test(url)) return url;
  return "";
}

function safeHref(value: unknown, fallback: string): string {
  const href = String(value ?? "").trim();
  if (/^\/(?!\/)[a-z0-9_./%+@~:?&=#-]*$/i.test(href)) return href;
  if (/^https:\/\/[a-z0-9.-]+(?:[/:?#][^\s"'<>]*)?$/i.test(href)) return href;
  if (/^(?:mailto|tel):[a-z0-9+@._% -]+$/i.test(href)) return href;
  return fallback;
}

function plain(value: unknown): string {
  return String(value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function text(config: ConfigMap, key: string, lang: Lang, fallback = ""): string {
  return cfg(config, key, lang).trim() || fallback;
}

function rich(config: ConfigMap, key: string, lang: Lang, fallback = ""): string {
  return renderRichText(text(config, key, lang, fallback));
}

function visible(config: ConfigMap, key: string, lang: Lang): boolean {
  return text(config, key, lang, "true").toLowerCase() !== "false";
}

function order(config: ConfigMap, key: string, lang: Lang, fallback: number): number {
  const parsed = Number.parseInt(text(config, key, lang, String(fallback)), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sectionHeading(eyebrow: string, title: string, intro?: string): string {
  return `<header class="vw-firm__section-heading">
    <p class="vw-firm__eyebrow">${esc(eyebrow)}</p>
    <h2>${esc(title)}</h2>
    ${intro ? `<p class="vw-firm__lede">${esc(intro)}</p>` : ""}
  </header>`;
}

function renderIndexedList(
  items: Array<{ title: string; body: string }>,
  listClass: string,
  wrapCopy: boolean,
  indexClass = "",
): string {
  const $list = cheerio.load("<ol></ol>", null, false);
  const list = $list("ol").addClass(listClass);

  items.forEach((item, index) => {
    const row = $list("<li></li>");
    const itemIndex = $list("<span></span>").text(String(index + 1).padStart(2, "0"));
    if (indexClass) itemIndex.addClass(indexClass);
    row.append(itemIndex);

    const title = $list("<h3></h3>").text(item.title);
    const body = plain(item.body);
    if (wrapCopy) {
      const copy = $list("<div></div>").append(title);
      if (body) copy.append($list("<p></p>").text(body));
      row.append(copy);
    } else {
      row.append(title);
      if (body) row.append($list("<p></p>").text(body));
    }

    list.append(row);
  });

  return $list.html();
}

function renderHistory(config: ConfigMap, lang: Lang, transitionMedia = ""): string {
  const fallbackIntro = lang === "es"
    ? "Von Wobeser y Sierra nació en 1986 con la excelencia y la integridad como piedras angulares. Hoy, nuestro equipo multidisciplinario brinda asesoría jurídica integral a través de las prácticas y grupos por industria de la firma."
    : "Von Wobeser y Sierra was founded in 1986 with excellence and integrity as its cornerstones. Today, our multidisciplinary team provides comprehensive legal counsel through the firm’s practices and industry groups.";
  const fallbackBody = lang === "es"
    ? "El medio empresarial y legal reconoce a nuestro equipo por su experiencia, especialización y capacidad para asesorar a compañías líderes durante su desarrollo en México y en el extranjero.\n\nTrabajamos como un socio estratégico, combinando asesoría preventiva y resolutiva con un entendimiento profundo del negocio de cada cliente y de sus asuntos legales más relevantes."
    : "The business and legal community recognizes our team for its experience, specialization and ability to advise leading companies throughout their development in Mexico and abroad.\n\nWe work as a strategic partner, combining preventive and solution-oriented counsel with a deep understanding of each client’s business and most relevant legal matters.";
  const configuredTitle = text(config, "firm_landing_history_title", lang, lang === "es" ? "En breve" : "At a glance");
  const title = configuredTitle === "Nuestra historia"
    ? "En breve"
    : configuredTitle === "Our history"
      ? "At a glance"
      : configuredTitle;
  const since = text(config, "firm_landing_history_since", lang, lang === "es" ? "Desde 1986" : "Since 1986");
  const image = safeMediaUrl(text(config, "firm_landing_history_image", lang, "/img/Collage/collage_07.jpg"));
  const imageAlt = text(
    config,
    "firm_landing_history_image_alt",
    lang,
    lang === "es"
      ? "Área de colaboración en las oficinas de Von Wobeser y Sierra"
      : "Collaboration area at the Von Wobeser y Sierra offices",
  );

  return `<section class="vw-firm__section vw-firm__history vw-firm-reveal" id="historia" aria-labelledby="vw-firm-history-title">
    <span class="vw-anchor-alias" id="history" aria-hidden="true"></span>
    <div class="vw-firm__container vw-firm__history-grid">
      <div>
        <p class="vw-firm__eyebrow">${esc(since)}</p>
        <h2 id="vw-firm-history-title">${esc(title)}</h2>
        ${image ? `<figure class="vw-firm__history-media"><img src="${escAttr(image)}" alt="${escAttr(imageAlt)}" loading="lazy" decoding="async"></figure>` : ""}
      </div>
      <div class="vw-firm__history-copy">
        <div class="vw-firm__history-intro">${renderRichText(text(config, "page_firm_intro", lang, fallbackIntro))}</div>
        <div class="vw-firm__prose">${renderRichText(text(config, "page_firm_body", lang, fallbackBody))}</div>
      </div>
    </div>
    ${transitionMedia ? `<figure class="vw-firm__feature-media">${transitionMedia}</figure>` : ""}
  </section>`;
}

function renderStats(config: ConfigMap, lang: Lang, data: FirmLandingData): string {
  const published = (items: Publishable[] | undefined) =>
    (items || []).filter((item) => item.published !== false).length;
  const fallbackValues = [
    "40+",
    lang === "es" ? "Más de 180" : "More than 180",
    String((data.practices || []).filter(isVisiblePublicPractice).length),
    String(published(data.industries)),
  ];
  const fallbackLabels = lang === "es"
    ? ["Años de experiencia", "Integrantes del equipo legal", "Prácticas legales", "Grupos de práctica por industria"]
    : ["Years of experience", "Legal team members", "Legal practices", "Industry practice groups"];
  const stats = fallbackValues.map((fallback, index) => {
    const configured = text(config, `firm_landing_stat_${index + 1}_value`, lang, fallback) || fallback;
    const configuredLabel = text(config, `firm_landing_stat_${index + 1}_label`, lang, fallbackLabels[index]);
    const isLegacyAttorneyLabel = index === 1 && /^(abogados|attorneys)$/i.test(configuredLabel.trim());
    const teamStatMatch = index === 1 ? configured.trim().match(/^(.+?)\s+(\d+[\d,.+]*?)$/) : null;
    return {
      // Corrige el valor histórico equivocado sin bloquear otras cifras editoriales.
      value: index === 2 && configured.trim() === "19" ? fallback : configured,
      // Reemplaza únicamente la etiqueta heredada; una personalización del CMS se conserva.
      label: isLegacyAttorneyLabel ? fallbackLabels[index] : configuredLabel,
      teamStatPrefix: teamStatMatch?.[1],
      teamStatNumber: teamStatMatch?.[2],
    };
  });
  const title = text(config, "firm_landing_stats_title", lang, lang === "es" ? "Nuestra firma en cifras" : "Our firm in numbers");

  return `<section class="vw-firm__section vw-firm__stats vw-firm-reveal" id="cifras" aria-labelledby="vw-firm-stats-title">
    <div class="vw-firm__container">
      <h2 id="vw-firm-stats-title">${esc(title)}</h2>
      <dl class="vw-firm__stats-grid">
        ${stats.map((stat) => `<div><dd${stat.teamStatNumber ? ' class="vw-firm__stat-value vw-firm__stat-value--team"' : ""}>${stat.teamStatNumber
          ? `<span class="vw-firm__stat-prefix">${esc(stat.teamStatPrefix)}</span> <span class="vw-firm__stat-number">${esc(stat.teamStatNumber)}</span>`
          : esc(stat.value)}</dd><dt>${esc(stat.label)}</dt></div>`).join("")}
      </dl>
    </div>
  </section>`;
}

function renderValues(config: ConfigMap, lang: Lang): string {
  const fallback = FALLBACK[lang];
  const title = text(config, "firm_landing_values_title", lang, lang === "es" ? "Nuestros valores" : "Our values");
  const intro = text(config, "firm_landing_values_intro", lang, fallback.valuesIntro);
  const items = Array.from({ length: 5 }, (_, index) => ({
    title: text(config, `firm_landing_value_${index + 1}_title`, lang, fallback.values[index][0]),
    body: text(config, `firm_landing_value_${index + 1}_body`, lang, fallback.values[index][1]),
  })).filter((item) => item.title || item.body);
  const list = renderIndexedList(items, "vw-firm__values-list", true, "vw-firm__index");

  return `<section class="vw-firm__section vw-firm__values vw-firm-reveal" id="valores" aria-labelledby="vw-firm-values-title"><span class="vw-anchor-alias" id="propuesta-de-valor"></span><span class="vw-anchor-alias" id="value-proposition"></span>
    <div class="vw-firm__container vw-firm__values-grid">
      <div class="vw-firm__values-heading">
        <h2 id="vw-firm-values-title">${esc(title)}</h2>
        ${intro ? `<p class="vw-firm__lede">${esc(intro)}</p>` : ""}
      </div>
      ${list}
    </div>
  </section>`;
}

function renderCulture(config: ConfigMap, lang: Lang): string {
  const fallback = FALLBACK[lang];
  const title = text(config, "firm_landing_culture_title", lang, lang === "es" ? "Nuestra cultura" : "Our culture");
  const subtitle = text(config, "firm_landing_culture_subtitle", lang, fallback.cultureSubtitle);
  const intro = text(config, "firm_landing_culture_intro", lang, fallback.cultureIntro);
  const image = safeMediaUrl(text(config, "firm_landing_culture_image", lang, "/img/Collage/collage_03.jpg"));
  const imageAlt = text(config, "firm_landing_culture_image_alt", lang, lang === "es" ? "Arquitectura en la Ciudad de México" : "Architecture in Mexico City");
  const items = Array.from({ length: 6 }, (_, index) => ({
    title: text(config, `firm_landing_culture_${index + 1}_title`, lang, fallback.culture[index][0]),
    body: text(config, `firm_landing_culture_${index + 1}_body`, lang, fallback.culture[index][1]),
  })).filter((item) => item.title || item.body);
  const list = renderIndexedList(items, "vw-firm__culture-list", false, "vw-firm__index");

  return `<section class="vw-firm__section vw-firm__culture vw-firm-reveal" id="cultura" aria-labelledby="vw-firm-culture-title">
    <div class="vw-firm__container">
      <div class="vw-firm__culture-intro">
        <div>
          <p class="vw-firm__eyebrow">${esc(subtitle)}</p>
          <h2 id="vw-firm-culture-title">${esc(title)}</h2>
        </div>
        ${intro ? `<p class="vw-firm__lede">${esc(intro)}</p>` : ""}
      </div>
      ${image ? `<figure class="vw-firm__culture-media"><img src="${escAttr(image)}" alt="${escAttr(imageAlt)}" loading="lazy" decoding="async"></figure>` : ""}
      ${list}
    </div>
  </section>`;
}

function renderDiversity(config: ConfigMap, lang: Lang): string {
  const fallback = FALLBACK[lang];
  const title = text(config, "firm_landing_diversity_title", lang, lang === "es" ? "Diversidad e inclusión" : "Diversity & inclusion");
  const subtitle = text(config, "firm_landing_diversity_subtitle", lang, fallback.diversitySubtitle);
  const intro = text(config, "firm_landing_diversity_intro", lang, fallback.diversityIntro);
  const commitment = text(config, "firm_landing_diversity_commitment", lang, fallback.diversityCommitment);
  const cta = text(config, "firm_landing_diversity_cta", lang, lang === "es" ? "Conoce nuestro compromiso" : "Learn about our commitment");
  const fallbackPath = lang === "es" ? "/nuestra-firma/diversidad" : "/our-firm/diversity";
  const path = safeHref(text(config, "firm_landing_diversity_path", lang), fallbackPath);
  const items = Array.from({ length: 4 }, (_, index) => ({
    title: text(config, `firm_landing_diversity_${index + 1}_title`, lang, fallback.diversity[index][0]),
    body: text(config, `firm_landing_diversity_${index + 1}_body`, lang, fallback.diversity[index][1]),
  })).filter((item) => item.title || item.body);
  const list = renderIndexedList(items, "vw-firm__diversity-list", true);

  return `<section class="vw-firm__section vw-firm__diversity vw-firm-reveal" id="diversidad" aria-labelledby="vw-firm-diversity-title">
    <div class="vw-firm__container">
      <div class="vw-firm__diversity-heading">
        ${sectionHeading(subtitle, title, intro)}
        ${commitment ? `<div class="vw-firm__diversity-commitment">${rich({ item: { value: commitment, valueEs: commitment, type: "text" } }, "item", lang)}</div>` : ""}
      </div>
      ${list}
      <a class="vw-firm__text-link" href="${path}">${esc(cta)}<span aria-hidden="true">→</span></a>
    </div>
  </section>`;
}

function rankingCopy(item: FirmRanking, lang: Lang): { name: string; meta: string; description: string } {
  const name = lang === "es" ? item.nameEs || item.name : item.name || item.nameEs;
  const publication = lang === "es" ? item.publicationEs || item.publication : item.publication || item.publicationEs;
  const ranking = lang === "es" ? item.rankingEs || item.ranking : item.ranking || item.rankingEs;
  const category = lang === "es" ? item.categoryEs || item.category : item.category || item.categoryEs;
  const description = lang === "es" ? item.descriptionEs || item.description : item.description || item.descriptionEs;
  return {
    name: String(name || publication || ""),
    meta: [publication, ranking, category, item.year].filter(Boolean).join(" · "),
    description: String(description || ""),
  };
}

function renderRankings(config: ConfigMap, lang: Lang, data: FirmLandingData): string {
  const configuredTitle = text(config, "firm_landing_rankings_title", lang, lang === "es" ? "Reconocimientos" : "Rankings & recognition");
  const title = lang === "es" && configuredTitle === "Rankings y reconocimientos"
    ? "Reconocimientos"
    : configuredTitle;
  const intro = text(config, "firm_landing_rankings_intro", lang, FALLBACK[lang].rankingsIntro);
  const empty = text(config, "firm_landing_rankings_empty", lang, FALLBACK[lang].rankingsEmpty);
  const rankings = (data.rankings || [])
    .filter((item) => item.published !== false)
    .sort((a, b) => Number(Boolean(b.isHighlight)) - Number(Boolean(a.isHighlight))
      || (a.order ?? 0) - (b.order ?? 0)
      || (b.year ?? 0) - (a.year ?? 0))
    .slice(0, 8);

  const list = rankings.length
    ? `<ol class="vw-firm__rankings-list">${rankings.map((item, index) => {
        const copy = rankingCopy(item, lang);
        const logo = safeMediaUrl(item.logoUrl);
        const href = safeHref(item.externalUrl, "");
        const content = `<span class="vw-firm__index">${String(index + 1).padStart(2, "0")}</span>
          ${logo ? `<img src="${escAttr(logo)}" alt="" loading="lazy" decoding="async">` : ""}
          <span class="vw-firm__ranking-copy"><strong>${esc(copy.name)}</strong>${copy.meta ? `<small>${esc(copy.meta)}</small>` : ""}${copy.description ? `<span>${esc(copy.description)}</span>` : ""}</span>
          ${href ? `<span class="vw-firm__ranking-arrow" aria-hidden="true">↗</span>` : ""}`;
        return `<li>${href ? `<a href="${escAttr(href)}" target="_blank" rel="noopener noreferrer">${content}</a>` : `<div>${content}</div>`}</li>`;
      }).join("")}</ol>`
    : `<p class="vw-firm__empty">${esc(empty)}</p>`;

  return `<section class="vw-firm__section vw-firm__rankings vw-firm-reveal" id="reconocimientos" aria-labelledby="vw-firm-rankings-title"><span class="vw-anchor-alias" id="recognitions"></span>
    <div class="vw-firm__container vw-firm__rankings-grid">
      ${sectionHeading("VWyS", title, intro)}
      ${list}
    </div>
  </section>`;
}

function renderPathways(config: ConfigMap, lang: Lang): string {
  const proBonoPath = safeHref(
    text(config, "firm_landing_probono_path", lang),
    lang === "es" ? "/nuestra-firma/probono" : "/our-firm/our-firm-probono",
  );
  const careersPath = safeHref(
    text(config, "firm_landing_careers_path", lang),
    lang === "es" ? "/bolsa-de-trabajo" : "/careers",
  );
  const learn = lang === "es" ? "Conocer más" : "Learn more";
  const cards = [
    {
      label: "01",
      title: text(config, "firm_landing_probono_title", lang, "Pro Bono"),
      body: text(config, "firm_landing_probono_text", lang, FALLBACK[lang].proBonoText),
      cta: text(config, "firm_landing_probono_cta", lang, learn),
      path: proBonoPath,
    },
    {
      label: "02",
      title: text(config, "firm_landing_careers_title", lang, lang === "es" ? "Carrera en VWyS" : "Careers"),
      body: text(config, "firm_landing_careers_text", lang, FALLBACK[lang].careersText),
      cta: text(config, "firm_landing_careers_cta", lang, learn),
      path: careersPath,
    },
  ];
  return `<section class="vw-firm__section vw-firm__pathways vw-firm-reveal" aria-label="${escAttr(lang === "es" ? "Pro Bono y Carrera" : "Pro Bono and Careers")}">
    <div class="vw-firm__container vw-firm__pathways-grid">
      ${cards.map((card) => `<article>
        <span class="vw-firm__index">${card.label}</span>
        <h2>${esc(card.title)}</h2>
        <p>${esc(card.body)}</p>
        <a class="vw-firm__text-link" href="${card.path}">${esc(card.cta)}<span aria-hidden="true">→</span></a>
      </article>`).join("")}
    </div>
  </section>`;
}

function renderFinalCta(config: ConfigMap, lang: Lang): string {
  const title = text(config, "firm_landing_cta_title", lang, lang === "es" ? "¿Cómo podemos ayudarte?" : "How can we help?");
  const body = text(config, "firm_landing_cta_text", lang, FALLBACK[lang].finalText);
  const fallbackPaths = lang === "es"
    ? ["/attorneys", "/capacidades/practicas", "/capacidades/industrias", "/contacto"]
    : ["/attorneys?lang=en", "/capabilities/practices", "/capabilities/industries", "/contact"];
  const fallbackLabels = lang === "es"
    ? ["Nuestros abogados", "Prácticas", "Industrias", "Contacto"]
    : ["Our attorneys", "Practices", "Industries", "Contact"];
  const links = Array.from({ length: 4 }, (_, index) => ({
    label: text(config, `firm_landing_cta_${index + 1}_label`, lang, fallbackLabels[index]),
    path: safeHref(text(config, `firm_landing_cta_${index + 1}_path`, lang), fallbackPaths[index]),
  }));

  return `<section class="vw-firm__section vw-firm__cta vw-firm-reveal" aria-labelledby="vw-firm-cta-title">
    <div class="vw-firm__container vw-firm__cta-grid">
      <div><h2 id="vw-firm-cta-title">${esc(title)}</h2>${body ? `<p>${esc(body)}</p>` : ""}</div>
      <nav aria-label="${escAttr(lang === "es" ? "Siguientes pasos" : "Next steps")}">
        ${links.map((link, index) => `<a href="${escAttr(link.path)}"><span>${String(index + 1).padStart(2, "0")}</span>${esc(link.label)}<b aria-hidden="true">→</b></a>`).join("")}
      </nav>
    </div>
  </section>`;
}

const STYLE = `<style id="vw-firm-landing-style">
  .vw-firm{--vw-red:#a9192d;--vw-ink:#555;--vw-mid:#6a6a6a;--vw-line:#b9b9b9;--vw-paper:#f3f3f1;background:#fff;color:var(--vw-ink);font-family:var(--vw-font-body);overflow:hidden}
  .vw-firm *{box-sizing:border-box}.vw-firm__container{width:min(100% - 8vw,86rem);margin:0 auto}.vw-firm__section{position:relative;padding:clamp(5.5rem,10vw,10rem) 0}.vw-firm h1,.vw-firm h2,.vw-firm h3{font-family:var(--vw-font-editorial);font-weight:400;text-wrap:balance}.vw-firm h2{font-size:clamp(2.8rem,5.4vw,5.8rem);line-height:.98;letter-spacing:-.025em;margin:0}.vw-firm h3{font-size:clamp(1.6rem,2.3vw,2.45rem);line-height:1.08;margin:0}.vw-firm p{margin:0}.vw-firm__eyebrow{color:var(--vw-red);font-family:var(--vw-font-ui);font-size:.72rem;font-weight:500;letter-spacing:.16em;line-height:1.4;text-transform:uppercase}.vw-firm__lede{font-size:clamp(1.05rem,1.45vw,1.3rem);line-height:1.6;max-width:36rem;text-wrap:pretty}.vw-firm__index{font-family:var(--vw-font-ui);font-size:.7rem;font-variant-numeric:tabular-nums;font-weight:500;letter-spacing:.12em}
  .vw-firm__hero{display:grid;min-height:clamp(36rem,68dvh,46rem);position:relative;isolation:isolate;align-items:end;background:#696969;color:#fff;padding:clamp(9rem,13vw,11rem) 0 clamp(4rem,6vw,6rem);box-shadow:inset 0 -.55rem 0 var(--vw-red)}.vw-firm__hero-media,.vw-firm__hero-media:after{position:absolute;inset:0}.vw-firm__hero-media{z-index:-1;margin:0}.vw-firm__hero-media img,.vw-firm__hero-media video,.vw-firm__hero-media iframe,.vw-firm__video-facade{width:100%;height:100%;display:block;object-fit:cover}.vw-firm__hero-media iframe{border:0}.vw-firm__hero-media:after{content:"";z-index:1;pointer-events:none;background:linear-gradient(90deg,rgba(29,29,29,.78) 0%,rgba(29,29,29,.38) 58%,rgba(169,25,45,.24) 100%)}.vw-firm__video-facade{position:relative;border:0;padding:0;background:#555;cursor:pointer}.vw-firm__video-facade img{position:absolute;inset:0}.vw-firm__video-play{position:absolute;left:50%;top:50%;z-index:2;width:4.5rem;height:4.5rem;border:2px solid #fff;border-radius:50%;display:grid;place-items:center;transform:translate(-50%,-50%);background:rgba(169,25,45,.88);color:#fff;font:1.4rem/1 var(--vw-font-ui);box-shadow:0 .4rem 1.5rem rgba(0,0,0,.28)}.vw-firm__video-facade:focus-visible{outline:3px solid #fff;outline-offset:-6px}.vw-firm__hero-grid{display:grid;grid-template-columns:minmax(0,7fr) minmax(12rem,3fr);gap:8vw;align-items:end}.vw-firm__hero h1{font-size:clamp(4rem,8vw,8.5rem);line-height:.82;letter-spacing:-.045em;margin:.7rem 0 1.6rem;max-width:11ch}.vw-firm__hero-subtitle{font-family:var(--vw-font-editorial);font-size:clamp(1.45rem,2.2vw,2.25rem);line-height:1.2;max-width:24ch;text-wrap:balance}.vw-firm__scroll{display:flex;align-items:center;gap:1rem;align-self:end;color:#fff;font-family:var(--vw-font-ui);font-size:.7rem;letter-spacing:.13em;text-decoration:none;text-transform:uppercase}.vw-firm__scroll:before{content:"";width:3.2rem;height:2px;background:var(--vw-red)}.vw-firm__scroll:after{content:"↓";font-size:1rem}
  .vw-firm__history{background:#fff;padding:clamp(5rem,8vw,7.5rem) 0}.vw-firm__history-grid{display:grid;grid-template-columns:minmax(20rem,4.5fr) minmax(0,5.5fr);gap:clamp(3rem,6vw,7rem);align-items:start}.vw-firm__history h2{margin-top:1rem}.vw-firm__history-media{height:clamp(16rem,23vw,21rem);margin:2.2rem 0 0;overflow:hidden}.vw-firm__history-media img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .7s cubic-bezier(.16,1,.3,1),filter .4s ease}.vw-firm__history-media:hover img{transform:scale(1.02);filter:saturate(.9)}.vw-firm__history-copy{padding-top:.35rem}.vw-firm__history-intro{font-family:var(--vw-font-editorial);font-size:clamp(1.55rem,2.35vw,2.35rem);line-height:1.32;max-width:30ch}.vw-firm__history-intro p{margin:0}.vw-firm__prose{margin-top:2.5rem;font-size:1rem;line-height:1.75;max-width:42rem}.vw-firm__prose p{margin:0}
  .vw-firm__stats{background:var(--vw-red);color:#fff;padding:clamp(4.5rem,7vw,6.5rem) 0}.vw-firm__stats h2{font-size:clamp(2rem,3vw,3.2rem);padding-bottom:2.2rem;border-bottom:1px solid rgba(255,255,255,.5)}.vw-firm__stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin:0}.vw-firm__stats-grid>div{padding:2.8rem 2rem 0;border-left:1px solid rgba(255,255,255,.42)}.vw-firm__stats-grid>div:first-child{border-left:0;padding-left:0}.vw-firm__stats-grid dd{font-family:var(--vw-font-editorial);font-size:clamp(3.6rem,6vw,6.5rem);line-height:.85;margin:0;color:#fff;font-variant-numeric:tabular-nums}.vw-firm__stat-value--team{position:relative;display:block;line-height:.85}.vw-firm__stat-prefix{position:absolute;left:0;bottom:calc(100% + .45rem);font-family:var(--vw-font-ui);font-size:clamp(.68rem,1vw,.82rem);font-weight:500;letter-spacing:.12em;line-height:1;text-transform:uppercase;white-space:nowrap}.vw-firm__stat-number{display:block;font-size:inherit;line-height:.85}.vw-firm__stats-grid dt{font-family:var(--vw-font-ui);font-size:.75rem;letter-spacing:.12em;line-height:1.45;margin-top:1.2rem;text-transform:uppercase}
  .vw-firm__values{background:var(--vw-paper);padding:clamp(3.75rem,5.5vw,5.75rem) 0 clamp(4.25rem,6vw,6.25rem)}.vw-firm__values-grid{display:grid;grid-template-columns:1fr;gap:clamp(2.75rem,4vw,4rem)}.vw-firm__values-heading{display:grid;grid-template-columns:minmax(0,1fr);row-gap:1rem;align-items:start;max-width:48rem}.vw-firm__values-heading h2{margin:0}.vw-firm__values-heading .vw-firm__lede{align-self:start;max-width:34rem}.vw-firm__values-list{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));list-style:none;margin:0;padding:0;border-top:2px solid var(--vw-red)}.vw-firm__values-list li{display:block;min-height:14rem;padding:1.8rem 1.3rem 2rem;border-left:1px solid var(--vw-line);border-bottom:1px solid var(--vw-line)}.vw-firm__values-list li:first-child{border-left:0}.vw-firm__values-list .vw-firm__index{display:block;color:var(--vw-red);margin-bottom:2.2rem}.vw-firm__values-list h3{font-size:clamp(1.3rem,1.7vw,1.8rem);margin-bottom:.8rem}.vw-firm__values-list p{font-size:.9rem;line-height:1.55;max-width:24rem}
  .vw-firm__culture{background:#fff}.vw-firm__culture-intro{display:grid;grid-template-columns:minmax(15rem,4fr) minmax(0,4fr);gap:12vw;align-items:end}.vw-firm__culture-intro h2{margin-top:1rem}.vw-firm__culture-media{height:clamp(20rem,46vw,40rem);margin:5rem 0 0;overflow:hidden}.vw-firm__culture-media img{display:block;width:100%;height:100%;object-fit:cover;filter:grayscale(1);transition:filter .5s ease,transform .8s cubic-bezier(.16,1,.3,1)}.vw-firm__culture-media:hover img{filter:grayscale(.35);transform:scale(1.015)}.vw-firm__culture-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:8vw;list-style:none;margin:0;padding:3rem 0 0}.vw-firm__culture-list li{display:grid;grid-template-columns:2.5rem minmax(0,1fr);column-gap:1.2rem;padding:2.4rem 0;border-bottom:1px solid var(--vw-line)}.vw-firm__culture-list li:nth-child(odd){transform:translateY(2rem)}.vw-firm__culture-list h3{font-size:clamp(1.45rem,2vw,2rem);margin-bottom:.8rem}.vw-firm__culture-list p{grid-column:2;font-size:.96rem;line-height:1.65;max-width:31rem}
  .vw-firm__diversity{background:#d0d0cf}.vw-firm__diversity-heading{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,3fr);gap:10vw;align-items:end}.vw-firm__section-heading h2{margin:1rem 0 2rem}.vw-firm__diversity-commitment{font-family:var(--vw-font-editorial);font-size:clamp(1.4rem,2vw,2rem);line-height:1.38}.vw-firm__diversity-commitment p{margin:0}.vw-firm__diversity-list{list-style:none;margin:5rem 0 3.5rem;padding:0;border-top:1px solid #8f8f8f}.vw-firm__diversity-list li{display:grid;grid-template-columns:5rem minmax(12rem,3fr) minmax(0,5fr);gap:2rem;padding:2.2rem 0;border-bottom:1px solid #8f8f8f}.vw-firm__diversity-list>li>span{color:var(--vw-red);font-family:var(--vw-font-ui);font-size:.72rem;font-weight:500;letter-spacing:.13em}.vw-firm__diversity-list h3{font-size:clamp(1.45rem,2vw,2rem)}.vw-firm__diversity-list p{font-size:.96rem;line-height:1.65;max-width:36rem}.vw-firm__text-link{display:inline-flex;align-items:center;gap:1.2rem;color:inherit;font-family:var(--vw-font-ui);font-size:.72rem;font-weight:500;letter-spacing:.12em;text-decoration:none;text-transform:uppercase;border-bottom:1px solid var(--vw-red);padding-bottom:.55rem}.vw-firm__text-link span{font-size:1.1rem;transition:transform .22s ease}.vw-firm__text-link:hover span,.vw-firm__text-link:focus-visible span{transform:translateX(.35rem)}
  .vw-firm__rankings{background:#fff}.vw-firm__rankings-grid{display:grid;grid-template-columns:minmax(15rem,3fr) minmax(0,5fr);gap:10vw}.vw-firm__rankings .vw-firm__section-heading{position:sticky;top:9rem;align-self:start}.vw-firm__rankings-list{list-style:none;margin:0;padding:0;border-top:1px solid var(--vw-line)}.vw-firm__rankings-list li{border-bottom:1px solid var(--vw-line)}.vw-firm__rankings-list a,.vw-firm__rankings-list li>div{display:grid;grid-template-columns:2.7rem 4.5rem minmax(0,1fr) 1.5rem;gap:1.25rem;align-items:center;color:inherit;text-decoration:none;padding:1.65rem 0}.vw-firm__rankings-list img{width:4.5rem;height:3.5rem;object-fit:contain;filter:grayscale(1)}.vw-firm__ranking-copy{display:flex;flex-direction:column;gap:.3rem}.vw-firm__ranking-copy strong{font-family:var(--vw-font-editorial);font-size:1.3rem;font-weight:400}.vw-firm__ranking-copy small{font-family:var(--vw-font-ui);font-size:.68rem;letter-spacing:.08em;text-transform:uppercase}.vw-firm__ranking-copy>span{font-size:.85rem;line-height:1.5}.vw-firm__ranking-arrow{font-size:1.15rem;transition:transform .22s ease}.vw-firm__rankings-list a:hover .vw-firm__ranking-arrow{transform:translate(.2rem,-.2rem)}.vw-firm__empty{border-top:1px solid var(--vw-line);padding-top:2rem;line-height:1.6}
  .vw-firm__pathways{background:#686868;color:#fff}.vw-firm__pathways-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.vw-firm__pathways article{min-height:26rem;padding:1rem 6vw 0 0;display:flex;flex-direction:column;align-items:flex-start}.vw-firm__pathways article+article{border-left:1px solid rgba(255,255,255,.4);padding-left:6vw;padding-right:0}.vw-firm__pathways h2{font-size:clamp(3rem,5vw,5rem);margin:2rem 0}.vw-firm__pathways p{font-size:1rem;line-height:1.7;max-width:34rem;margin-bottom:3rem}.vw-firm__pathways .vw-firm__text-link{margin-top:auto;color:#fff}
  .vw-firm__cta{background:var(--vw-red);color:#fff;padding:clamp(5rem,8vw,7.5rem) 0}.vw-firm__cta-grid{display:grid;grid-template-columns:minmax(0,4fr) minmax(18rem,4fr);gap:12vw;align-items:end}.vw-firm__cta .vw-firm__eyebrow{color:#fff}.vw-firm__cta h2{margin:1rem 0 2rem}.vw-firm__cta p{font-size:1.05rem;line-height:1.6;max-width:28rem}.vw-firm__cta nav{border-top:1px solid rgba(255,255,255,.5)}.vw-firm__cta nav a{display:grid;grid-template-columns:2.5rem minmax(0,1fr) 2rem;gap:1rem;align-items:center;color:#fff;font-family:var(--vw-font-editorial);font-size:clamp(1.25rem,2vw,1.9rem);text-decoration:none;padding:1.35rem 0;border-bottom:1px solid rgba(255,255,255,.5)}.vw-firm__cta nav a>span{font-family:var(--vw-font-ui);color:#fff;font-size:.65rem;font-weight:500;letter-spacing:.1em}.vw-firm__cta nav b{font-family:var(--vw-font-ui);font-weight:400;transition:transform .22s ease}.vw-firm__cta nav a:hover b,.vw-firm__cta nav a:focus-visible b{transform:translateX(.35rem)}
  /* Escala editorial compartida: Gelasio jerarquiza los títulos; Inter sostiene la lectura. */
  .vw-firm__hero h1{font-size:clamp(3.85rem,7.1vw,7.15rem);line-height:.88;letter-spacing:-.04em;max-width:10ch}.vw-firm__hero-subtitle{font-size:clamp(1.4rem,1.85vw,2rem);line-height:1.24;max-width:23ch}.vw-firm h2{font-size:clamp(2.55rem,4.2vw,4.65rem);line-height:1.03;letter-spacing:-.022em}.vw-firm h3{font-size:clamp(1.38rem,1.7vw,1.82rem);line-height:1.16}.vw-firm__lede{font-size:clamp(1rem,1.2vw,1.16rem);line-height:1.58}.vw-firm__history-intro{font-size:clamp(1.45rem,1.9vw,2rem);line-height:1.38;max-width:32ch}.vw-firm__prose{font-size:clamp(.98rem,1.05vw,1.08rem);line-height:1.7;max-width:40rem}.vw-firm__stats h2{font-size:clamp(2.3rem,3vw,3.45rem)}.vw-firm__stats-grid dd{font-size:clamp(3.5rem,5.5vw,5.9rem)}.vw-firm__values-list h3,.vw-firm__culture-list h3,.vw-firm__diversity-list h3{font-size:clamp(1.32rem,1.5vw,1.65rem);line-height:1.15}.vw-firm__diversity-commitment{font-size:clamp(1.3rem,1.65vw,1.7rem);line-height:1.42}.vw-firm__pathways h2{font-size:clamp(2.55rem,3.8vw,4.25rem);line-height:1.02}.vw-firm__cta nav a{font-size:clamp(1.18rem,1.65vw,1.55rem)}
  .vw-firm a:focus-visible{outline:2px solid var(--vw-red);outline-offset:5px}.vw-firm--motion .vw-firm-reveal{opacity:0;transform:translateY(2rem);transition:opacity .7s ease,transform .7s cubic-bezier(.16,1,.3,1)}.vw-firm--motion .vw-firm-reveal.is-visible{opacity:1;transform:none}
  @media(max-width:900px){.vw-firm__container{width:min(100% - 3rem,48rem)}.vw-firm__section{padding:5.5rem 0}.vw-firm__hero{min-height:42rem;padding-top:9rem}.vw-firm__hero-grid,.vw-firm__history-grid,.vw-firm__values-grid,.vw-firm__culture-intro,.vw-firm__diversity-heading,.vw-firm__rankings-grid,.vw-firm__cta-grid{grid-template-columns:1fr;gap:3rem}.vw-firm__hero h1{font-size:clamp(4rem,18vw,7rem)}.vw-firm__scroll{display:none}.vw-firm__prose{margin-top:2rem}.vw-firm__stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.vw-firm__stats-grid>div{border-left:0;border-top:1px solid rgba(255,255,255,.3);padding:2.2rem 1rem 1rem 0}.vw-firm__stats-grid>div:nth-child(even){border-left:1px solid rgba(255,255,255,.3);padding-left:1.5rem}.vw-firm__values-heading{gap:1.5rem}.vw-firm__values-list{grid-template-columns:repeat(2,minmax(0,1fr))}.vw-firm__values-list li:nth-child(odd){border-left:0}.vw-firm__culture-list{grid-template-columns:1fr}.vw-firm__culture-list li:nth-child(odd){transform:none}.vw-firm__diversity-list li{grid-template-columns:3rem minmax(0,1fr)}.vw-firm__diversity-list li>div{grid-column:2}.vw-firm__pathways-grid{grid-template-columns:1fr}.vw-firm__pathways article{min-height:22rem;padding:0 0 4rem}.vw-firm__pathways article+article{border-left:0;border-top:1px solid rgba(255,255,255,.4);padding:4rem 0 0}.vw-firm__cta-grid{align-items:start}}
  @media(max-width:560px){.vw-firm__container{width:calc(100% - 2rem)}.vw-firm__section{padding:4.5rem 0}.vw-firm__hero{min-height:36rem;padding:8rem 0 3.5rem}.vw-firm__hero h1{font-size:clamp(3.25rem,16vw,5rem)}.vw-firm__hero-subtitle{font-size:1.35rem}.vw-firm h2{font-size:clamp(2.25rem,10vw,3.25rem)}.vw-firm__history-intro{font-size:1.55rem}.vw-firm__stats-grid dd{font-size:3.5rem}.vw-firm__values-list{grid-template-columns:1fr}.vw-firm__values-list li{min-height:0;border-left:0}.vw-firm__culture-media{height:20rem;margin-top:3.5rem}.vw-firm__culture-list li{grid-template-columns:2rem minmax(0,1fr);gap:.8rem}.vw-firm__diversity-list{margin-top:3.5rem}.vw-firm__diversity-list li{grid-template-columns:2.2rem minmax(0,1fr);gap:1rem}.vw-firm__rankings-list a,.vw-firm__rankings-list li>div{grid-template-columns:2rem minmax(0,1fr) 1.2rem}.vw-firm__rankings-list img{display:none}.vw-firm__ranking-copy{grid-column:2}.vw-firm__pathways h2{font-size:3.2rem}}
  @media(prefers-reduced-motion:reduce){.vw-firm *{scroll-behavior:auto!important}.vw-firm--motion .vw-firm-reveal{opacity:1;transform:none;transition:none}.vw-firm__history-media img,.vw-firm__culture-media img,.vw-firm__text-link span,.vw-firm__ranking-arrow,.vw-firm__cta nav b{transition:none}}
  /* Encabezado editorial compartido: la fotografía acompaña el título, no compite con él. */
  .vw-firm__hero{display:block;min-height:0;padding:clamp(6rem,7vw,7.5rem) 0 2rem;background:#fff;color:var(--vw-ink);box-shadow:none}.vw-firm__hero-heading{display:flex;flex-direction:column;align-items:center;max-width:64rem;text-align:center}.vw-firm__hero .vw-firm__eyebrow{margin:0 0 1rem;color:var(--vw-red);font:500 .75rem/1.2 var(--vw-font-ui);letter-spacing:.28em;text-transform:uppercase}.vw-firm__hero h1{max-width:15ch;margin:0;color:#565656;font:400 clamp(2.6rem,4.7vw,4.75rem)/1.08 var(--vw-font-editorial);letter-spacing:-.025em}.vw-firm__hero-subtitle{max-width:48rem;margin:1.15rem auto 0;color:#606060;font:400 clamp(1rem,1.3vw,1.18rem)/1.55 var(--vw-font-body);text-wrap:balance}.vw-firm__hero-rule{display:block;width:100%;height:1px;margin:clamp(2.4rem,4vw,3.6rem) 0 0;background:var(--vw-red)}.vw-firm__history{padding:3.25rem 0 0}.vw-firm__feature-media{position:relative;display:block;width:min(100% - 8vw,86rem);aspect-ratio:21/7;margin:clamp(3.5rem,5vw,5rem) auto clamp(3rem,4.5vw,4.5rem);overflow:hidden;background:#e8e8e6}.vw-firm__feature-media img,.vw-firm__feature-media video,.vw-firm__feature-media iframe,.vw-firm__feature-media .vw-firm__video-facade{width:100%;height:100%;display:block;object-fit:cover}.vw-firm__feature-media iframe{border:0}.vw-firm__feature-media .vw-firm__video-facade{border:0}.vw-firm__feature-media .vw-firm__video-play{background:rgba(172,22,44,.9)}
  @media(max-width:900px){.vw-firm__hero{min-height:0;padding:5.75rem 0 2.5rem}.vw-firm__hero h1{font-size:clamp(2.55rem,8vw,4rem)}.vw-firm__history{padding:3.5rem 0 0}.vw-firm__feature-media{width:min(100% - 3rem,48rem)}}
  @media(max-width:560px){.vw-firm__hero{padding:5.25rem 0 2.5rem}.vw-firm__hero h1{font-size:clamp(2.45rem,11vw,3.25rem)}.vw-firm__hero-subtitle{font-size:1rem;line-height:1.55}.vw-firm__history{padding:3.25rem 0 0}.vw-firm__feature-media{width:calc(100% - 2rem);aspect-ratio:16/8;margin:3.25rem auto 3.25rem}}
  @media print{.vw-firm__hero{min-height:0;padding:3rem 0;color:#222}.vw-firm__hero-media,.vw-firm__feature-media{display:none}.vw-firm__section{padding:2rem 0}.vw-firm__values-heading,.vw-firm__rankings .vw-firm__section-heading{position:static}.vw-firm-reveal{opacity:1!important;transform:none!important}}
</style>`;

const SCRIPT = `<script id="vw-firm-landing-script">(function(){
  var root=document.querySelector('.vw-firm');if(!root)return;
  var facade=root.querySelector('.vw-firm__video-facade');
  if(facade){facade.addEventListener('click',function(){
    var src=facade.getAttribute('data-embed');if(!src)return;
    var frame=document.createElement('iframe');frame.src=src;frame.title=facade.getAttribute('aria-label')||'Video';frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';frame.referrerPolicy='strict-origin-when-cross-origin';frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-presentation');frame.setAttribute('allowfullscreen','');
    facade.replaceWith(frame);
  },{once:true});}
  var items=root.querySelectorAll('.vw-firm-reveal');
  if(!('IntersectionObserver' in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    for(var i=0;i<items.length;i++)items[i].classList.add('is-visible');return;
  }
  root.classList.add('vw-firm--motion');
  var observer=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});
  },{rootMargin:'0px 0px -10% 0px',threshold:.08});
  for(var j=0;j<items.length;j++)observer.observe(items[j]);
})();</script>`;

export function renderFirmLanding(
  templateHtml: string,
  config: ConfigMap,
  lang: Lang,
  data: FirmLandingData = {},
): string {
  const $ = cheerio.load(templateHtml);
  const heroVisible = visible(config, "firm_landing_hero_visible", lang);
  const eyebrow = text(
    config,
    "firm_landing_eyebrow",
    lang,
    lang === "es" ? "Nuestra firma" : "Our firm",
  ).trim() || (lang === "es" ? "Nuestra firma" : "Our firm");
  const configuredTitle = text(config, "firm_landing_title", lang, "Von Wobeser y Sierra");
  const title = configuredTitle === "Nuestra Firma" || configuredTitle === "Our Firm"
    ? "Von Wobeser y Sierra"
    : configuredTitle;
  const subtitle = text(
    config,
    "firm_landing_subtitle",
    lang,
    lang === "es" ? "Más de cuarenta años de excelencia jurídica en México" : "More than forty years of legal excellence in Mexico",
  );
  const configuredHeroImage = text(config, "firm_landing_hero_image", lang, "/img/Collage/collage_02.jpg");
  const heroImage = safeMediaUrl(configuredHeroImage === "/images/home-hero.jpg" ? "/img/Collage/collage_02.jpg" : configuredHeroImage);
  const heroVideoSource = parseVideoSource(text(config, "firm_landing_hero_video", lang));
  const configuredHeroAlt = text(config, "firm_landing_hero_alt", lang);
  const heroAlt = !configuredHeroAlt || configuredHeroAlt === "Vista aérea de la Ciudad de México" || configuredHeroAlt === "Aerial view of Mexico City"
    ? (lang === "es"
      ? "Sala de consejo de las nuevas oficinas de Von Wobeser y Sierra"
      : "Boardroom at the new Von Wobeser y Sierra offices")
    : configuredHeroAlt;
  const heroVideo = heroVideoSource?.kind === "file" ? heroVideoSource.url : "";
  const heroEmbed = heroVideoSource && heroVideoSource.kind !== "file"
    ? buildVideoEmbedUrl(heroVideoSource, { autoplay: true, controls: true, muted: true, playsInline: true })
    : null;
  const playLabel = lang === "es" ? "Reproducir video" : "Play video";

  const heroMedia = heroEmbed
    ? `<button class="vw-firm__video-facade" type="button" data-embed="${escAttr(heroEmbed)}" aria-label="${escAttr(`${playLabel}: ${heroAlt}`)}">${heroImage ? `<img src="${escAttr(heroImage)}" alt="" fetchpriority="high" decoding="async">` : ""}<span class="vw-firm__video-play" aria-hidden="true">▶</span></button>`
    : heroVideo
      ? `<video autoplay muted loop playsinline preload="metadata"${heroImage ? ` poster="${escAttr(heroImage)}"` : ""} aria-label="${escAttr(heroAlt)}"><source src="${escAttr(heroVideo)}"></video>`
      : heroImage
        ? `<img src="${escAttr(heroImage)}" alt="${escAttr(heroAlt)}" loading="lazy" decoding="async">`
        : "";
  const hero = heroVisible ? `<section class="vw-firm__hero" aria-labelledby="vw-firm-title">
    <div class="vw-firm__container vw-firm__hero-heading">
      <p class="vw-firm__eyebrow">${esc(eyebrow)}</p>
      <h1 id="vw-firm-title">${esc(title)}</h1>
      <p class="vw-firm__hero-subtitle">${esc(subtitle)}</p>
      <span class="vw-firm__hero-rule" aria-hidden="true"></span>
    </div>
  </section>` : "";

  const sections = [
    { id: "hero", visible: heroVisible, order: order(config, "firm_landing_hero_order", lang, 0), html: hero },
    { id: "history", visible: visible(config, "firm_landing_history_visible", lang), order: order(config, "firm_landing_history_order", lang, 10), html: renderHistory(config, lang, heroVisible ? heroMedia : "") },
    { id: "stats", visible: visible(config, "firm_landing_stats_visible", lang), order: order(config, "firm_landing_stats_order", lang, 20), html: renderStats(config, lang, data) },
    { id: "values", visible: visible(config, "firm_landing_values_visible", lang), order: order(config, "firm_landing_values_order", lang, 30), html: renderValues(config, lang) },
    { id: "cta", visible: visible(config, "firm_landing_cta_visible", lang), order: order(config, "firm_landing_cta_order", lang, 80), html: renderFinalCta(config, lang) },
  ]
    .filter((section) => section.visible)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

  const landing = `<main class="vw-firm" id="main-content">${sections.map((section) => section.html).join("")}</main>`;
  const originalPage = $(".page").first();
  if (originalPage.length) originalPage.replaceWith(landing);
  else $("#top").first().prepend(landing);
  $(".page__sidebar").remove();
  $("html").attr("lang", lang === "es" ? "es-mx" : "en-gb");
  $("head").append(STYLE);
  $("body").append(SCRIPT);

  const defaultSeoTitle = lang === "es"
    ? "Von Wobeser y Sierra | Firma legal en México"
    : "Von Wobeser y Sierra | Mexican law firm";
  const configuredSeoTitle = plain(text(config, "firm_landing_seo_title", lang, defaultSeoTitle));
  const seoTitle = configuredSeoTitle === "Nuestra Firma | Von Wobeser y Sierra"
    ? defaultSeoTitle
    : configuredSeoTitle === "Our Firm | Von Wobeser y Sierra"
      ? defaultSeoTitle
      : configuredSeoTitle || defaultSeoTitle;
  const seoDescription = text(config, "firm_landing_seo_description", lang, subtitle);
  const configuredSeoImage = text(config, "firm_landing_seo_image", lang, heroImage || "/img/Collage/collage_02.jpg");
  const seoImage = safeMediaUrl(configuredSeoImage === "/images/home-hero.jpg" ? "/img/Collage/collage_02.jpg" : configuredSeoImage);
  const socialTitle = plain(text(config, "firm_landing_social_title", lang, seoTitle)) || seoTitle;
  const socialDescription = text(config, "firm_landing_social_description", lang, seoDescription);
  const path = lang === "es" ? "/acerca-de" : "/about";
  const configuredCanonicalEs = safeHref(text(config, "firm_landing_canonical", "es"), "/acerca-de");
  const configuredCanonicalEn = safeHref(text(config, "firm_landing_canonical", "en"), "/about");
  const canonicalEs = configuredCanonicalEs === "/nuestra-firma" ? "/acerca-de" : configuredCanonicalEs;
  const canonicalEn = configuredCanonicalEn === "/our-firm" ? "/about" : configuredCanonicalEn;
  applySeo($, {
    lang,
    path,
    alternatePaths: { es: canonicalEs, en: canonicalEn },
    title: seoTitle,
    description: seoDescription,
    socialTitle,
    socialDescription,
    image: seoImage,
    type: "website",
    jsonLd: [
      breadcrumbNode(
        [
          { name: lang === "es" ? "Inicio" : "Home", path: "/" },
          { name: title, path },
        ],
        lang,
      ),
      {
        "@type": "AboutPage",
        name: title,
        description: seoDescription,
        inLanguage: lang === "es" ? "es-MX" : "en",
        about: { "@id": "#organization" },
      },
    ],
  });

  return $.html();
}
