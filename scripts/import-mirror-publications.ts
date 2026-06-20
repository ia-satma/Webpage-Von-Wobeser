/**
 * import-mirror-publications.ts
 *
 * Pobla la tabla `news` con publicaciones REALES y bilingues extraidas del mirror
 * del sitio viejo de Von Wobeser. NO usa PDFs ni el (inexistente) export JSON;
 * parsea directamente el HTML del mirror, que es la fuente bilingue limpia.
 *
 * Fuente:
 *   - Detalle EN: index.php/publication/p_id-N.html
 *   - Detalle ES: index.php/publicacion/p_id-M.html   (enlazado desde el EN via header__lang--item)
 *   - Listados:   index.php/publications/{articles,news}/*.html  (aportan la FECHA, ausente en el detalle)
 *
 * Idempotente: UPSERT por slug (onConflictDoUpdate). Re-correr no duplica.
 *
 * Compuerta de calidad: descarta articulos sin titulo limpio o sin contenido con
 * sustancia. Solo carga lo que pasa validacion.
 *
 * Uso:
 *   DATABASE_URL=postgresql://localhost:5432/vonwobeser_dev npx tsx scripts/import-mirror-publications.ts [--dry-run] [--limit N]
 */

import { db } from '../server/db';
import { news } from '../shared/schema';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

const MIRROR = path.resolve('MIRROR - VON WOBESER FRONT/mirror');
const EN_DETAIL_DIR = path.join(MIRROR, 'index.php/publication');
const ES_DETAIL_DIR = path.join(MIRROR, 'index.php/publicacion');
const EN_LIST_DIRS = [
  path.join(MIRROR, 'index.php/publications/articles'),
  path.join(MIRROR, 'index.php/publications/news'),
];

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_ARG = process.argv.indexOf('--limit');
const LIMIT = LIMIT_ARG !== -1 ? parseInt(process.argv[LIMIT_ARG + 1], 10) : Infinity;

// ---------- HTML helpers ----------

function readFile(p: string): string | null {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
}

/** Decodifica entidades HTML comunes. */
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rsquo;/g, '’')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&aacute;/g, 'á').replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í').replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú').replace(/&ntilde;/g, 'ñ')
    .replace(/&Aacute;/g, 'Á').replace(/&Eacute;/g, 'É')
    .replace(/&Iacute;/g, 'Í').replace(/&Oacute;/g, 'Ó')
    .replace(/&Uacute;/g, 'Ú').replace(/&Ntilde;/g, 'Ñ')
    .replace(/&uuml;/g, 'ü')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

/** Texto plano de un fragmento HTML, colapsando espacios. */
function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<\s*br\s*\/?\s*>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .trim();
}

/** Extrae el primer contenido interno de un <div class="..exactClass..">...</div> balanceando divs. */
function extractDivByClass(html: string, className: string): string | null {
  const re = new RegExp(`<div[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>`, 'i');
  const m = re.exec(html);
  if (!m) return null;
  const start = m.index + m[0].length;
  let depth = 1;
  const tagRe = /<\/?div\b[^>]*>/gi;
  tagRe.lastIndex = start;
  let tm: RegExpExecArray | null;
  while ((tm = tagRe.exec(html)) !== null) {
    if (tm[0].startsWith('</')) {
      depth--;
      if (depth === 0) return html.slice(start, tm.index);
    } else {
      depth++;
    }
  }
  return html.slice(start);
}

function extractTitle(html: string): string {
  const inner = extractDivByClass(html, 'single__meta--name');
  if (inner) {
    const t = htmlToText(inner);
    if (t) return t;
  }
  const tm = /<title>([^<]*)<\/title>/i.exec(html);
  if (tm) return decodeEntities(tm[1]).replace(/^Von Wobeser y Sierra\s*[-–]\s*/i, '').trim();
  return '';
}

function extractBody(html: string): string {
  const intro = extractDivByClass(html, 'single__content--intro');
  const txt = extractDivByClass(html, 'single__content--txt');
  const parts: string[] = [];
  if (intro) parts.push(htmlToText(intro));
  if (txt) parts.push(htmlToText(txt));
  return parts.filter(Boolean).join('\n\n').trim();
}

function extractPdfUrl(html: string): string | null {
  const m = /<a[^>]*class="[^"]*\bdownload\b[^"]*"[^>]*href="([^"]+\.pdf)"/i.exec(html);
  return m ? m[1] : null;
}

/** id ES vinculado desde el detalle EN (header__lang--item -> publicacion/p_id-N). */
function extractEsId(html: string): number | null {
  const m = /header__lang--item[^>]*href="\/index\.php\/publicacion\/p_id-(\d+)\.html"/i.exec(html);
  return m ? parseInt(m[1], 10) : null;
}

function makeExcerpt(content: string, max = 280): string {
  const flat = content.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const lastDot = cut.lastIndexOf('. ');
  if (lastDot > max * 0.6) return cut.slice(0, lastDot + 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…';
}

function slugify(title: string, id: number): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 70)
    .replace(/^-+|-+$/g, '');
  // sufijo con el p_id EN -> slug unico y estable (idempotente entre corridas)
  return `${base || 'publicacion'}-${id}`;
}

// ---------- Fechas ----------

const EN_MONTHS: Record<string, string> = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
};

/** Parsea fechas de los listados: "March, 2024" o "March 5, 2024". Devuelve YYYY-MM-DD o null. */
function parseListingDate(raw: string): string | null {
  const s = decodeEntities(raw).replace(/\s+/g, ' ').trim().toLowerCase();
  let m = /([a-z]+)\s+(\d{1,2}),?\s*(\d{4})/.exec(s);
  if (m && EN_MONTHS[m[1]]) {
    return `${m[3]}-${EN_MONTHS[m[1]]}-${m[2].padStart(2, '0')}`;
  }
  m = /([a-z]+),?\s*(\d{4})/.exec(s);
  if (m && EN_MONTHS[m[1]]) {
    return `${m[2]}-${EN_MONTHS[m[1]]}-01`;
  }
  return null;
}

/** Fecha embebida en el nombre del PDF: 2026-05-27-... o 21_02_03_... */
function parsePdfDate(pdfUrl: string | null): string | null {
  if (!pdfUrl) return null;
  const base = pdfUrl.split('/').pop() || '';
  let m = /(\d{4})-(\d{2})-(\d{2})/.exec(base);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /\b(\d{2})_(\d{2})_(\d{2})\b/.exec(base);
  if (m) {
    const yy = parseInt(m[1], 10);
    const year = yy > 50 ? `19${m[1]}` : `20${m[1]}`;
    return `${year}-${m[2]}-${m[3]}`;
  }
  // ano en cualquier carpeta intermedia: /PDF_news/2017/... o /PDF_articles/2018/...
  const ym = /\/(\d{4})\//.exec(pdfUrl);
  if (ym) {
    const yr = parseInt(ym[1], 10);
    if (yr >= 1990 && yr <= 2030) return `${ym[1]}-01-01`;
  }
  return null;
}

/** Construye mapa p_id(EN) -> { date, category } leyendo los listados EN. */
function buildDateMap(): Map<number, { date: string; category: string }> {
  const map = new Map<number, { date: string; category: string }>();
  for (const dir of EN_LIST_DIRS) {
    const category = dir.endsWith('news') ? 'press' : 'insights';
    let files: string[] = [];
    try {
      files = fs.readdirSync(dir).filter((f) => f.endsWith('.html'));
    } catch {
      continue;
    }
    for (const file of files) {
      const html = readFile(path.join(dir, file));
      if (!html) continue;
      const cardRe = /publication\/p_id-(\d+)\.html[\s\S]*?archive__item--date"[^>]*>([\s\S]*?)<\/div>/gi;
      let cm: RegExpExecArray | null;
      while ((cm = cardRe.exec(html)) !== null) {
        const id = parseInt(cm[1], 10);
        const date = parseListingDate(cm[2]);
        if (date && !map.has(id)) {
          map.set(id, { date, category });
        }
      }
    }
  }
  return map;
}

// ---------- Quality gate ----------

const BRAND_NOISE = [
  'von wobeser y sierra, s.c.',
  'paseo de los tamarindos',
  'all rights reserved',
  'derechos reservados',
];

interface Candidate {
  enId: number;
  esId: number | null;
  title: string;
  titleEs: string;
  excerpt: string;
  excerptEs: string;
  content: string;
  contentEs: string;
  slug: string;
  pdfUrl: string | null;
  date: string;
  category: string;
  bilingual: boolean;
}

function passesQuality(c: Candidate): { ok: boolean; reason?: string } {
  if (!c.title || c.title.length < 8) return { ok: false, reason: 'title-too-short' };
  if (c.title.length > 480) return { ok: false, reason: 'title-too-long' };
  const hasContent = c.content && c.content.replace(/\s+/g, '').length >= 40;
  if (!hasContent && !c.pdfUrl) return { ok: false, reason: 'no-content-no-pdf' };
  const sample = (c.title + ' ' + c.content).slice(0, 500);
  const weird = (sample.match(/[�]/g) || []).length;
  if (weird > 3) return { ok: false, reason: 'garbled' };
  const low = c.content.toLowerCase().trim();
  if (low && BRAND_NOISE.some((n) => low === n)) return { ok: false, reason: 'boilerplate-only' };
  if (!c.date) return { ok: false, reason: 'no-date' };
  return { ok: true };
}

// ---------- Main ----------

async function main() {
  console.log(`Mirror: ${MIRROR}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY-RUN (no escribe DB)' : 'WRITE'}${LIMIT !== Infinity ? `  limit=${LIMIT}` : ''}`);

  const dateMap = buildDateMap();
  console.log(`Listados EN: ${dateMap.size} fechas mapeadas por p_id`);

  const enFiles = fs
    .readdirSync(EN_DETAIL_DIR)
    .filter((f) => /^p_id-\d+\.html$/.test(f));
  console.log(`Detalles EN encontrados: ${enFiles.length}`);

  const candidates: Candidate[] = [];
  const rejected: Record<string, number> = {};

  for (const file of enFiles) {
    const enId = parseInt(file.match(/p_id-(\d+)/)![1], 10);
    const enHtml = readFile(path.join(EN_DETAIL_DIR, file));
    if (!enHtml) continue;

    const title = extractTitle(enHtml);
    const content = extractBody(enHtml);
    const pdfUrl = extractPdfUrl(enHtml);
    const esId = extractEsId(enHtml);

    let titleEs = '';
    let contentEs = '';
    let bilingual = false;
    if (esId != null) {
      const esHtml = readFile(path.join(ES_DETAIL_DIR, `p_id-${esId}.html`));
      if (esHtml) {
        titleEs = extractTitle(esHtml);
        contentEs = extractBody(esHtml);
        bilingual = !!(titleEs && titleEs.length >= 8);
      }
    }
    if (!titleEs) titleEs = title;
    if (!contentEs) contentEs = content;

    const listing = dateMap.get(enId);
    const date = listing?.date || parsePdfDate(pdfUrl) || '';
    const category = listing?.category || (pdfUrl ? 'insights' : 'press');

    const cand: Candidate = {
      enId,
      esId,
      title,
      titleEs,
      excerpt: makeExcerpt(content || title),
      excerptEs: makeExcerpt(contentEs || titleEs),
      content,
      contentEs,
      slug: slugify(title || `pub-${enId}`, enId),
      pdfUrl,
      date,
      category,
      bilingual,
    };

    const q = passesQuality(cand);
    if (!q.ok) {
      rejected[q.reason!] = (rejected[q.reason!] || 0) + 1;
      continue;
    }
    candidates.push(cand);
  }

  console.log(`\nCandidatos que pasan la compuerta de calidad: ${candidates.length}`);
  console.log(`Bilingues (ES real, no espejado): ${candidates.filter((c) => c.bilingual).length}`);
  console.log('Rechazados por motivo:', JSON.stringify(rejected));

  const toLoad = candidates
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, LIMIT);

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: muestra de 5 ---');
    for (const c of toLoad.slice(0, 5)) {
      console.log(`[${c.date}] (${c.bilingual ? 'BILINGUE' : 'EN-only'}) ${c.title.slice(0, 70)}`);
      console.log(`   slug=${c.slug} pdf=${c.pdfUrl ? 'si' : 'no'}`);
    }
    console.log(`\nDRY RUN: cargaria ${toLoad.length} articulos.`);
    process.exit(0);
  }

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const c of toLoad) {
    try {
      const categoryEs = c.category === 'press' ? 'Prensa' : 'Insights';
      const res = await db
        .insert(news)
        .values({
          title: c.title,
          titleEs: c.titleEs,
          excerpt: c.excerpt,
          excerptEs: c.excerptEs,
          content: c.content || null,
          contentEs: c.contentEs || null,
          slug: c.slug,
          pdfUrl: c.pdfUrl,
          date: new Date(c.date + 'T00:00:00Z'),
          published: true,
          category: c.category,
          categoryEs,
        })
        .onConflictDoUpdate({
          target: news.slug,
          set: {
            title: c.title,
            titleEs: c.titleEs,
            excerpt: c.excerpt,
            excerptEs: c.excerptEs,
            content: c.content || null,
            contentEs: c.contentEs || null,
            pdfUrl: c.pdfUrl,
            date: new Date(c.date + 'T00:00:00Z'),
            category: c.category,
            categoryEs,
            published: true,
          },
        })
        .returning({ id: news.id, xmax: sql<string>`xmax` });
      if (res[0] && res[0].xmax === '0') inserted++;
      else updated++;
    } catch (err) {
      errors++;
      if (errors <= 10) console.error(`Error en ${c.slug}:`, String(err).slice(0, 200));
    }
  }

  console.log(`\n=== Import completo ===`);
  console.log(`Insertados nuevos: ${inserted}`);
  console.log(`Actualizados (upsert): ${updated}`);
  console.log(`Errores: ${errors}`);

  const total = await db.execute(sql`SELECT count(*)::int AS n FROM news`);
  console.log(`Total news en DB: ${(total.rows[0] as any).n}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fallo:', err);
  process.exit(1);
});
