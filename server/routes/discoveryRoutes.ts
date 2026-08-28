import type { Express } from "express";
import { isPublishedPublicPractice } from "../mirror/publicPracticeGroups";
import { getBaseUrl } from "../mirror/seo";
import { storage } from "../storage";

export function registerDiscoveryRoutes(app: Express): void {
  app.get("/robots.txt", (_req, res) => {
    const base = getBaseUrl();
    const robotsTxt = `# robots.txt for ${base}
User-agent: *
Allow: /

# Disallow API endpoints
Disallow: /api/

# Sitemap location
Sitemap: ${base}/sitemap.xml
`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(robotsTxt);
  });

  // llms.txt — índice legible por motores generativos (GEO). Formato llmstxt.org:
  // describe qué es la firma y enlaza sus secciones clave para que la IA cite bien.
  app.get('/llms.txt', (_req, res) => {
    const base = getBaseUrl();
    const llms = `# Von Wobeser y Sierra, S.C.

> Von Wobeser y Sierra es una de las firmas de abogados líderes en México, con reconocimiento internacional (Chambers, The Legal 500, Latin Lawyer). Ofrece asesoría en derecho corporativo, litigio, arbitraje, competencia económica, propiedad intelectual, laboral, fiscal, ambiental y más. Sede en Ciudad de México. Sitio bilingüe español/inglés (versión en inglés con ?lang=en).

## Secciones principales
- [Inicio](${base}/): presentación de la firma.
- [Nuestra Firma](${base}/acerca-de): historia, valores y enfoque.
- [Pro Bono](${base}/nuestra-firma/probono): programa de trabajo pro bono de la firma.
- [Diversidad e Inclusión](${base}/nuestra-firma/diversidad): iniciativas de diversidad e inclusión.
- [Abogados / Socios](${base}/attorneys/partners): directorio del equipo legal.
- [Noticias y publicaciones](${base}/news): actualizaciones legales y de la firma.
- [Contacto](${base}/contacto): datos de contacto y ubicación.
- [Bolsa de trabajo](${base}/bolsa-de-trabajo): oportunidades profesionales.

## Recursos
- [Mapa del sitio (sitemap.xml)](${base}/sitemap.xml)
- Contacto: Torre SOMA, Campos Elíseos 204, Polanco, Ciudad de México — +52 55 5258 1000
`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(llms);
  });

  // Caché del sitemap (1 h): antes se regeneraba cargando TODAS las tablas en cada
  // hit de crawler. TTL corto para reflejar contenido nuevo sin regenerar por request.
  let sitemapCache: { xml: string; at: number } | null = null;
  const SITEMAP_TTL_MS = 60 * 60 * 1000;

  app.get("/sitemap.xml", async (_req, res) => {
    try {
      if (sitemapCache && Date.now() - sitemapCache.at < SITEMAP_TTL_MS) {
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(sitemapCache.xml);
      }
      const baseUrl = getBaseUrl();
      const today = new Date().toISOString().split('T')[0];
      const xmlEsc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

      // Genera una <url> con alternates reales. Algunas secciones comparten ruta y
      // usan ?lang=en; las institucionales tienen rutas distintas (/contacto|/contact).
      const urlEntry = (esPath: string, enPath: string, changefreq: string, priority: string, lastmod = today) => {
        const es = `${baseUrl}${esPath}`;
        const en = `${baseUrl}${enPath}`;
        return `
  <url>
    <loc>${xmlEsc(es)}</loc>
    <xhtml:link rel="alternate" hreflang="es-MX" href="${xmlEsc(es)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${xmlEsc(en)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEsc(es)}"/>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
      };

      // Rutas REALES del espejo (antes apuntaba a rutas del viejo SPA que ya no existen).
      const staticPages = [
        { es: '/', en: '/?lang=en', changefreq: 'weekly', priority: '1.0' },
        { es: '/nuevas-oficinas/', en: '/new-offices/', changefreq: 'monthly', priority: '0.8' },
        { es: '/acerca-de', en: '/about', changefreq: 'monthly', priority: '0.8' },
        { es: '/nuestra-firma/probono', en: '/our-firm/our-firm-probono', changefreq: 'monthly', priority: '0.6' },
        { es: '/nuestra-firma/diversidad', en: '/our-firm/diversity', changefreq: 'monthly', priority: '0.6' },
        { es: '/capacidades', en: '/capabilities', changefreq: 'monthly', priority: '0.8' },
        { es: '/capacidades/practicas', en: '/capabilities/practices', changefreq: 'weekly', priority: '0.8' },
        { es: '/capacidades/industrias', en: '/capabilities/industries', changefreq: 'weekly', priority: '0.8' },
        { es: '/publicaciones', en: '/publications', changefreq: 'weekly', priority: '0.8' },
        { es: '/news', en: '/news?lang=en', changefreq: 'daily', priority: '0.9' },
        { es: '/articles', en: '/articles?lang=en', changefreq: 'weekly', priority: '0.8' },
        { es: '/attorneys', en: '/attorneys?lang=en', changefreq: 'weekly', priority: '0.8' },
        { es: '/attorneys/partners', en: '/attorneys/partners?lang=en', changefreq: 'weekly', priority: '0.8' },
        { es: '/attorneys/of-counsel', en: '/attorneys/of-counsel?lang=en', changefreq: 'weekly', priority: '0.6' },
        { es: '/attorneys/counsel', en: '/attorneys/counsel?lang=en', changefreq: 'weekly', priority: '0.6' },
        { es: '/attorneys/associates', en: '/attorneys/associates?lang=en', changefreq: 'weekly', priority: '0.6' },
        { es: '/contacto', en: '/contact', changefreq: 'monthly', priority: '0.7' },
        { es: '/bolsa-de-trabajo', en: '/careers', changefreq: 'weekly', priority: '0.7' },
        { es: '/bolsa-de-trabajo/pasantes', en: '/careers/interns', changefreq: 'monthly', priority: '0.6' },
        { es: '/aviso', en: '/privacy', changefreq: 'yearly', priority: '0.4' },
      ];

      const [teamMembers, practiceGroups, industryGroups, newsItems] = await Promise.all([
        storage.getTeamMembers(),
        storage.getPracticeGroups(),
        storage.getIndustryGroups(),
        storage.getNews(),
      ]);

      // array.join en vez de string += en bucle (evita O(n²) de concatenación).
      const parts: string[] = [];

      for (const page of staticPages) parts.push(urlEntry(page.es, page.en, page.changefreq, page.priority));

      for (const member of teamMembers as any[]) {
        if (member.published === false) continue;
        parts.push(urlEntry(`/abogado/${member.slug}`, `/lawyer/${member.slug}?lang=en`, 'monthly', '0.6'));
      }
      for (const group of practiceGroups as any[]) {
        if (!isPublishedPublicPractice(group)) continue;
        parts.push(urlEntry(`/practice/${group.slug}`, `/practice/${group.slug}?lang=en`, 'monthly', '0.7'));
      }
      for (const group of industryGroups as any[]) {
        if (group.published === false) continue;
        parts.push(urlEntry(`/industry/${group.slug}`, `/industry/${group.slug}?lang=en`, 'monthly', '0.7'));
      }
      for (const newsItem of newsItems as any[]) {
        if (newsItem.published !== true || (newsItem.publishAt && new Date(newsItem.publishAt) > new Date())) continue;
        const lastmod = newsItem.date ? new Date(newsItem.date).toISOString().split('T')[0] : today;
        parts.push(urlEntry(`/news/${newsItem.slug}`, `/news/${newsItem.slug}?lang=en`, 'monthly', '0.6', lastmod));
      }

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${parts.join('')}
</urlset>`;

      sitemapCache = { xml: sitemap, at: Date.now() };
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(sitemap);
    } catch (error) {
      console.error("Sitemap generation error:", error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>');
    }
  });
}
