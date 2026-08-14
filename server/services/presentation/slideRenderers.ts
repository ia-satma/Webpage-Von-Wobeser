import type { SlideModel, SlideModelSlide } from './contracts';
import { resolveLocalAsset } from './assets';
import { renderChartSvg, renderDiagramSvg, type Box } from './dataVisuals';
import {
  FONT, H, RIGHT, SPINE, W, type Theme, footerChrome, fullStopSquare,
  ghostNumeral, headerA, kickerText, line, microLabel, rect, signatureStroke,
  svgFontDefs, text, wrap,
} from './designSystem';

export type Ground = 'white' | 'paper' | 'dark';
export interface ImageComposite { path: string; box: Box; cover?: boolean; scrim?: number }
export interface SlideBuild { svg: string; image: ImageComposite | null }

function groundFill(t: Theme, g: Ground): string {
  return g === 'dark' ? t.nearBlack : g === 'paper' ? t.paper : t.white;
}
function svgOpen(t: Theme, g: Ground): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${svgFontDefs()}<rect width="${W}" height="${H}" fill="${groundFill(t, g)}"/>`;
}
// SVG con fondo TRANSPARENTE — para diapositivas con imagen compuesta por sharp: el SVG va
// ENCIMA de la imagen y solo pinta el texto/fondo parcial, dejando ver la foto donde es transparente.
function svgOpenT(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${svgFontDefs()}`;
}


function renderCover(model: SlideModel, t: Theme, footer: string, docKicker: string): SlideBuild {
  const p: string[] = [];
  p.push(svgOpen(t, 'white'));
  p.push(kickerText(t, SPINE, 112, docKicker, t.burgundy));
  p.push(text({ x: RIGHT, y: 112, size: 11, color: t.nearBlack, font: FONT.label, weight: 600, tracking: 1.5, anchor: 'end', lines: ['VON WOBESER Y SIERRA'] }));
  p.push(line(SPINE, 128, RIGHT, 128, t.divider, 1));
  p.push(signatureStroke(t, SPINE, 300));
  const lines = wrap(model.title, 24).slice(0, 3);
  lines.forEach((ln, i) => p.push(text({ x: SPINE, y: 372 + i * 82, size: 76, color: t.nearBlack, font: FONT.serif, weight: 400, tracking: -0.5, lines: [ln] })));
  // Punto burgundy tras la última línea (aprox. según ancho del texto).
  const lastBaseline = 372 + (lines.length - 1) * 82;
  const lastW = (lines[lines.length - 1] || '').length * 40;
  p.push(fullStopSquare(t, Math.min(SPINE + lastW + 8, RIGHT - 20), lastBaseline, 76));
  if (model.subtitle) p.push(text({ x: SPINE, y: 588, size: 21, color: t.bodyGray, font: FONT.body, lines: wrap(model.subtitle, 56).slice(0, 2), lh: 31 }));
  p.push(line(SPINE, 632, RIGHT, 632, t.divider, 1));
  p.push(microLabel(t, SPINE, 664, footer, t.midGray));
  p.push(microLabel(t, RIGHT, 664, 'Confidencial', t.midGray, 'end'));
  p.push('</svg>');
  return { svg: p.join(''), image: null };
}

function renderSection(s: SlideModelSlide, t: Theme, idx: number): SlideBuild {
  const p: string[] = [];
  p.push(svgOpen(t, 'dark'));
  p.push(ghostNumeral(t, idx, 'dark'));
  p.push(signatureStroke(t, SPINE, 300));
  if (s.kicker) p.push(kickerText(t, SPINE, 332, s.kicker, t.burgundy));
  const lines = wrap(s.title, 26).slice(0, 2);
  lines.forEach((ln, i) => p.push(text({ x: SPINE, y: 404 + i * 66, size: 60, color: t.white, font: FONT.serif, weight: 400, tracking: -0.5, lines: [ln] })));
  if (s.bullets && s.bullets[0]) p.push(text({ x: SPINE, y: 404 + lines.length * 66 + 12, size: 18, color: t.white, opacity: 0.72, font: FONT.body, lines: wrap(s.bullets[0], 60).slice(0, 2), lh: 26 }));
  p.push(microLabel(t, SPINE, 684, 'Von Wobeser y Sierra', t.softGray));
  p.push('</svg>');
  return { svg: p.join(''), image: null };
}

function renderBullets(s: SlideModelSlide, t: Theme, ground: Ground, idx: number, total: number): SlideBuild {
  const p: string[] = [];
  p.push(svgOpen(t, ground));
  headerA(p, t, s.kicker, s.title, ground === 'dark' ? 'white' : (ground as 'white' | 'paper'));
  const items = (s.bullets || []).slice(0, 6);
  const n = items.length;
  const pitch = n <= 4 ? 94 : n === 5 ? 78 : 64;
  let y = 262;
  items.forEach((b, i) => {
    p.push(text({ x: SPINE, y, size: 22, color: t.burgundy, font: FONT.serif, weight: 400, lines: [String(i + 1).padStart(2, '0')] }));
    p.push(text({ x: 132, y, size: 18, color: t.nearBlack, font: FONT.body, weight: 700, lines: wrap(b, 58).slice(0, 3), lh: 26 }));
    y += pitch;
  });
  footerChrome(p, t, idx, total);
  p.push('</svg>');
  return { svg: p.join(''), image: null };
}

function renderStat(s: SlideModelSlide, t: Theme, ground: Ground, idx: number, total: number): SlideBuild {
  const p: string[] = [];
  p.push(svgOpen(t, ground));
  const figs = (s.stat?.figures || []).slice(0, 3);
  if (figs.length <= 1) {
    const f = figs[0] || { value: '', label: s.title };
    if (s.kicker) p.push(kickerText(t, SPINE, 116, s.kicker, t.burgundy));
    p.push(text({ x: SPINE, y: 430, size: 176, color: t.burgundy, font: FONT.serif, weight: 400, tracking: -3, lines: [f.value || ''] }));
    if (f.unit) p.push(text({ x: SPINE + (f.value || '').length * 96 + 10, y: 360, size: 44, color: t.burgundy, font: FONT.serif, lines: [f.unit] }));
    p.push(signatureStroke(t, SPINE, 468, 64));
    p.push(microLabel(t, SPINE, 500, f.label || s.title, t.midGray));
    if (f.note) p.push(text({ x: SPINE, y: 534, size: 17, color: t.bodyGray, font: FONT.body, lines: wrap(f.note, 60).slice(0, 2), lh: 26 }));
  } else {
    headerA(p, t, s.kicker, s.title, ground === 'dark' ? 'white' : (ground as 'white' | 'paper'), 40, 34);
    const xs = figs.length === 2 ? [80, 680] : [80, 460, 840];
    const cw = figs.length === 2 ? 520 : 340;
    if (figs.length === 3) { p.push(line(440, 300, 440, 470, t.divider, 1)); p.push(line(820, 300, 820, 470, t.divider, 1)); }
    else p.push(line(640, 300, 640, 470, t.divider, 1));
    figs.forEach((f, i) => {
      const x = xs[i];
      p.push(text({ x, y: 396, size: figs.length === 2 ? 128 : 96, color: t.nearBlack, font: FONT.serif, weight: 400, tracking: -2, lines: [f.value || ''] }));
      p.push(microLabel(t, x, 432, f.label || '', t.midGray));
      if (f.note) p.push(text({ x, y: 460, size: 15, color: t.bodyGray, font: FONT.body, lines: wrap(f.note, cw > 400 ? 40 : 30).slice(0, 2), lh: 20 }));
    });
  }
  footerChrome(p, t, idx, total);
  p.push('</svg>');
  return { svg: p.join(''), image: null };
}

function renderChart(s: SlideModelSlide, t: Theme, idx: number, total: number): SlideBuild {
  const p: string[] = [];
  p.push(svgOpen(t, 'white'));
  if (s.kicker) p.push(kickerText(t, SPINE, 116, s.kicker, t.burgundy));
  p.push(text({ x: SPINE, y: 140, size: 34, color: t.nearBlack, font: FONT.serif, weight: 400, tracking: -0.2, lines: wrap(s.title, 42).slice(0, 1) }));
  p.push(line(SPINE, 200, RIGHT, 200, t.divider, 1));
  const chart = s.chart!;
  const hasRail = !!(chart.insight && chart.insight.trim());
  if (hasRail) {
    p.push(renderChartSvg(chart, { x: SPINE, y: 240, w: 740, h: 360 }, t));
    p.push(signatureStroke(t, 880, 240, 40));
    p.push(kickerText(t, 880, 272, 'Lectura clave', t.burgundy));
    p.push(text({ x: 880, y: 372, size: 17, color: t.bodyGray, font: FONT.body, lines: wrap(chart.insight!, 34).slice(0, 6), lh: 26 }));
  } else {
    p.push(renderChartSvg(chart, { x: SPINE, y: 232, w: 1120, h: 372 }, t));
  }
  footerChrome(p, t, idx, total);
  p.push('</svg>');
  return { svg: p.join(''), image: null };
}

function renderDiagram(s: SlideModelSlide, t: Theme, idx: number, total: number): SlideBuild {
  const p: string[] = [];
  p.push(svgOpen(t, 'white'));
  const top = headerA(p, t, s.kicker, s.title, 'white', 40, 34);
  p.push(renderDiagramSvg(s.diagram!, { x: SPINE, y: top + 6, w: RIGHT - SPINE, h: Math.max(180, 600 - top) }, t));
  footerChrome(p, t, idx, total);
  p.push('</svg>');
  return { svg: p.join(''), image: null };
}

function renderImage(s: SlideModelSlide, t: Theme, idx: number, total: number): SlideBuild {
  const p: string[] = [];
  const localPath = resolveLocalAsset(s.image?.url);
  const bullets = (s.bullets || []).slice(0, 4);
  if (!localPath) {
    // sin imagen → degradar a bullets con encabezado.
    return renderBullets({ ...s, layout: 'bullets' }, t, 'white', idx, total);
  }
  if (bullets.length > 0) {
    // Half-bleed: imagen a la derecha (640→1280); el SVG (transparente) solo pinta el lado de texto.
    p.push(svgOpenT());
    p.push(rect(0, 0, 640, 720, t.white)); // fondo blanco del lado de texto (deja ver la foto a la derecha)
    p.push(signatureStroke(t, SPINE, 140));
    if (s.kicker) p.push(kickerText(t, SPINE, 172, s.kicker, t.burgundy));
    p.push(text({ x: SPINE, y: 240, size: 40, color: t.nearBlack, font: FONT.serif, weight: 400, tracking: -0.3, lines: wrap(s.title, 24).slice(0, 2), lh: 46 }));
    let y = 336;
    bullets.forEach((b) => { p.push(rect(SPINE, y - 14, 8, 8, t.burgundy)); const l = wrap(b, 34); p.push(text({ x: 112, y, size: 17, color: t.bodyGray, font: FONT.body, lines: l, lh: 26 })); y += l.length * 26 + 20; });
    // Footer solo en el lado blanco (no cruza la foto).
    p.push(line(SPINE, 664, 600, 664, t.divider, 1));
    p.push(microLabel(t, SPINE, 684, 'Von Wobeser y Sierra', t.midGray));
    p.push(text({ x: 600, y: 684, size: 11, color: t.nearBlack, font: FONT.label, weight: 600, tracking: 1.5, anchor: 'end', lines: [`${String(idx).padStart(2, '0')} / ${String(total).padStart(2, '0')}`] }));
    p.push('</svg>');
    return { svg: p.join(''), image: { path: localPath, box: { x: 640, y: 0, w: 640, h: 720 }, cover: true } };
  }
  // Full-bleed: imagen a sangre + scrim uniforme (sharp) + bloque inferior-izq para legibilidad.
  p.push(svgOpenT());
  p.push(rect(0, 360, 940, 360, t.nearBlack, 0.5)); // refuerzo inferior-izq (semitransparente sobre la foto)
  p.push(signatureStroke(t, SPINE, 492, 48, t.white));
  if (s.kicker) p.push(kickerText(t, SPINE, 524, s.kicker, t.white));
  p.push(text({ x: SPINE, y: 572, size: 38, color: t.white, font: FONT.serif, weight: 400, lines: wrap(s.title, 30).slice(0, 2), lh: 44 }));
  if (s.image?.caption) p.push(text({ x: SPINE, y: 676, size: 14, color: t.white, opacity: 0.85, font: FONT.body, lines: wrap(s.image.caption, 60).slice(0, 1) }));
  p.push('</svg>');
  return { svg: p.join(''), image: { path: localPath, box: { x: 0, y: 0, w: 1280, h: 720 }, cover: true, scrim: 0.35 } };
}

function renderQuote(s: SlideModelSlide, t: Theme, idx: number, total: number): SlideBuild {
  const p: string[] = [];
  p.push(svgOpen(t, 'paper'));
  const q = s.quote || { text: s.title };
  p.push(text({ x: 76, y: 250, size: 200, color: t.burgundyWash, font: FONT.serif, weight: 700, lines: ['“'] }));
  p.push(text({ x: SPINE, y: 340, size: 40, color: t.nearBlack, font: FONT.serif, weight: 400, tracking: -0.25, lines: wrap(q.text || '', 46).slice(0, 4), lh: 52 }));
  p.push(signatureStroke(t, SPINE, 548, 40));
  if (q.attribution) {
    p.push(text({ x: SPINE, y: 576, size: 14, color: t.nearBlack, font: FONT.label, weight: 700, tracking: 1.5, lines: [(q.attribution || '').toUpperCase()] }));
    if (q.role) p.push(microLabel(t, SPINE, 600, q.role, t.midGray));
  }
  p.push(microLabel(t, SPINE, 684, 'Von Wobeser y Sierra', t.midGray));
  p.push('</svg>');
  return { svg: p.join(''), image: null };
}

function renderTwoColumn(s: SlideModelSlide, t: Theme, ground: Ground, idx: number, total: number): SlideBuild {
  const p: string[] = [];
  p.push(svgOpen(t, ground));
  headerA(p, t, s.kicker, s.title, ground === 'dark' ? 'white' : (ground as 'white' | 'paper'), 40, 34);
  p.push(line(640, 224, 640, 600, t.divider, 1));
  const cols = (s.columns && s.columns.length ? s.columns : [
    { heading: '', points: (s.bullets || []).slice(0, Math.ceil((s.bullets || []).length / 2)) },
    { heading: '', points: (s.bullets || []).slice(Math.ceil((s.bullets || []).length / 2)) },
  ]).slice(0, 2);
  const xs = [SPINE, 680];
  cols.forEach((col, ci) => {
    const x = xs[ci];
    p.push(line(x, 224, x + 520, 224, t.divider, 1));
    if (col.heading) p.push(kickerText(t, x, 252, col.heading, t.burgundy));
    let y = 296;
    (col.points || []).slice(0, 6).forEach((pt) => { p.push(rect(x, y - 12, 8, 8, t.burgundy)); const l = wrap(pt, 40); p.push(text({ x: x + 28, y, size: 17, color: t.bodyGray, font: FONT.body, lines: l, lh: 26 })); y += l.length * 26 + 18; });
  });
  footerChrome(p, t, idx, total);
  p.push('</svg>');
  return { svg: p.join(''), image: null };
}

function renderClosing(s: SlideModelSlide, t: Theme, footer: string, contact: { label: string; value: string }[]): SlideBuild {
  const p: string[] = [];
  p.push(svgOpen(t, 'dark'));
  p.push(text({ x: SPINE, y: 112, size: 11, color: t.white, font: FONT.label, weight: 600, tracking: 1.5, lines: ['VON WOBESER Y SIERRA'] }));
  p.push(signatureStroke(t, SPINE, 300, 64));
  p.push(kickerText(t, SPINE, 332, s.kicker || 'Contacto', t.burgundy));
  p.push(text({ x: SPINE, y: 400, size: 60, color: t.white, font: FONT.serif, weight: 400, tracking: -0.5, lines: wrap(s.title || 'Gracias', 24).slice(0, 1) }));
  p.push(fullStopSquare(t, Math.min(SPINE + (s.title || 'Gracias').length * 34, RIGHT - 20), 400, 60));
  if (s.bullets && s.bullets[0]) p.push(text({ x: SPINE, y: 452, size: 21, color: t.white, opacity: 0.75, font: FONT.body, lines: wrap(s.bullets[0], 56).slice(0, 1) }));
  p.push(line(SPINE, 470, RIGHT, 470, t.darkHairline, 1));
  contact.slice(0, 4).forEach((c, i) => {
    const x = i % 2 === 0 ? SPINE : 680;
    const yBase = i < 2 ? 506 : 562;
    p.push(microLabel(t, x, yBase, c.label, t.burgundy));
    p.push(text({ x, y: yBase + 26, size: 16, color: t.white, font: FONT.body, lines: [c.value] }));
  });
  p.push(microLabel(t, SPINE, 684, footer, t.softGray));
  p.push('</svg>');
  return { svg: p.join(''), image: null };
}

// Fondo por diapositiva según el RITMO del sistema (blanco / papel / negro).
export function groundFor(s: SlideModelSlide, t: Theme, prevPaper: boolean): Ground {
  if (s.layout === 'section' || s.layout === 'closing') return 'dark';
  if (s.layout === 'quote') return 'paper';
  if (s.layout === 'stat' && t.paperBreathers && !prevPaper) return 'paper';
  return 'white';
}

export interface RenderedSlide {
  build: SlideBuild;
  ground: Ground;
}

export function buildSvgDeck(
  model: SlideModel,
  theme: Theme,
  footer: string,
  documentKicker: string,
  closingFooter: string,
  contact: { label: string; value: string }[],
): RenderedSlide[] {
  const total = model.slides.length + 1;
  const builds: RenderedSlide[] = [
    { build: renderCover(model, theme, footer, documentKicker), ground: 'white' },
  ];
  let previousWasPaper = false;
  let sectionIndex = 0;

  model.slides.forEach((slide, index) => {
    const ground = groundFor(slide, theme, previousWasPaper);
    previousWasPaper = ground === 'paper';
    const displayIndex = index + 2;
    let build: SlideBuild;
    switch (slide.layout) {
      case 'section': build = renderSection(slide, theme, ++sectionIndex); break;
      case 'stat': build = renderStat(slide, theme, ground, displayIndex, total); break;
      case 'chart': build = slide.chart
        ? renderChart(slide, theme, displayIndex, total)
        : renderBullets(slide, theme, ground, displayIndex, total); break;
      case 'diagram': build = slide.diagram
        ? renderDiagram(slide, theme, displayIndex, total)
        : renderBullets(slide, theme, ground, displayIndex, total); break;
      case 'image': build = renderImage(slide, theme, displayIndex, total); break;
      case 'quote': build = renderQuote(slide, theme, displayIndex, total); break;
      case 'twocolumn': build = renderTwoColumn(slide, theme, ground, displayIndex, total); break;
      case 'closing': build = renderClosing(slide, theme, closingFooter, contact); break;
      default: build = renderBullets(slide, theme, ground, displayIndex, total);
    }
    builds.push({ build, ground });
  });

  return builds;
}
