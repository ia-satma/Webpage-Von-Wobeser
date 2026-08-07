import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import PptxGenJS from 'pptxgenjs';
import { PDFDocument } from 'pdf-lib';
import { storage } from '../storage';
import { getConfigMap, cfg } from '../mirror/siteConfig';
import type { GeneratedPresentation } from '../../shared/schema';
import { TYPOGRAPHY, TYPOGRAPHY_ASSETS } from '../../shared/typography';
import { embedPresentationFonts } from './presentationFonts';
import {
  deletePersistentMediaObjects,
  persistPublicMediaFiles,
  PersistentMediaUnavailableError,
  type PublicMediaFile,
} from '../media/persistentMedia';

// Generador NATIVO de presentaciones (sin LibreOffice/Chromium) — SISTEMA DE DISEÑO "MERIDIANO":
// editorial de prestigio para Von Wobeser y Sierra. Rejilla con "spine" en x=80, kickers en
// mayúsculas con tracking, cifras serif grandes, UN trazo horizontal de burgundy Pantone 187,
// ritmo de fondos (blanco / papel / negro), y numerales fantasma. Regla dura de marca: cualquier
// rectángulo burgundy es ancho >= alto (nunca una barra roja VERTICAL). Todo se dibuja como
// SVG (rect/line/circle/text/image) y se rasteriza con sharp para PNG/PDF; el PPTX se arma con
// pptxgenjs (cajas de texto reales, formas, gráficas nativas, imágenes) reflejando el mismo diseño.

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'generated-presentations');
const VW_LOGO_PATH = path.join(process.cwd(), 'attached_assets', 'vonwobeser_logo_hd.png');

const W = 1280;
const H = 720;
const SPINE = 80;          // eje izquierdo primario
const RIGHT = 1200;        // borde derecho de contenido

// --- Tipos del modelo (exportados; los consume el agente) ---
export type PresentationTemplate = 'vonwobeser' | 'minimal' | 'dark';
export type PresentationBranding = 'vonwobeser' | 'custom';
export type PresentationFormat = 'pptx' | 'pdf' | 'png';
export type SlideLayout = 'section' | 'bullets' | 'closing' | 'image' | 'chart' | 'diagram' | 'stat' | 'quote' | 'twocolumn';

export interface SlideChart {
  type: 'bar' | 'line' | 'pie';
  categories: string[];
  series: { name: string; values: number[] }[];
  unit?: string;
  insight?: string;   // "lectura clave" para el riel del gráfico (opcional)
}
export interface SlideDiagram {
  kind: 'flow' | 'steps' | 'list';
  nodes: string[];
}
export interface SlideImage {
  prompt?: string;
  url?: string;
  caption?: string;
}
export interface SlideStatFigure {
  value: string;   // "45%", "3", "$120M"
  unit?: string;
  label: string;
  note?: string;
}
export interface SlideStat { figures: SlideStatFigure[] }  // 1, 2 o 3
export interface SlideQuote { text: string; attribution?: string; role?: string }
export interface SlideColumn { heading: string; points: string[] }

export interface SlideModelSlide {
  layout: SlideLayout;
  title: string;
  kicker?: string;       // eyebrow en mayúsculas
  bullets?: string[];
  notes?: string;
  image?: SlideImage;
  chart?: SlideChart;
  diagram?: SlideDiagram;
  stat?: SlideStat;
  quote?: SlideQuote;
  columns?: SlideColumn[];
}
export interface SlideModel {
  title: string;
  subtitle?: string;
  slides: SlideModelSlide[];
}

export interface RenderOptions {
  template: PresentationTemplate;
  branding: PresentationBranding;
  lang: string;
  formats: PresentationFormat[];
  customLogoUrl?: string | null;
  customPrimaryColor?: string | null;
  topic?: string;
  sourceDocs?: string[];
  engine?: string;
}
export interface RenderResult {
  success: boolean;
  presentation?: GeneratedPresentation;
  error?: string;
}

// ============================================================
// Tokens de color, tipografía y fuentes
// ============================================================
const FONT = {
  serif: TYPOGRAPHY.title,
  body: TYPOGRAPHY.body,
  label: TYPOGRAPHY.body,
};

let svgFontDefsCache: string | null = null;

function svgFontDefs(): string {
  if (svgFontDefsCache) return svgFontDefsCache;
  const data = (filePath: string) => fs.readFileSync(filePath).toString('base64');
  svgFontDefsCache = `<defs><style><![CDATA[
@font-face{font-family:'Gelasio';src:url(data:font/ttf;base64,${data(TYPOGRAPHY_ASSETS.gelasioRegular)}) format('truetype');font-style:normal;font-weight:400}
@font-face{font-family:'Gelasio';src:url(data:font/ttf;base64,${data(TYPOGRAPHY_ASSETS.gelasioBold)}) format('truetype');font-style:normal;font-weight:700}
@font-face{font-family:'Inter';src:url(data:font/ttf;base64,${data(TYPOGRAPHY_ASSETS.interRegular)}) format('truetype');font-style:normal;font-weight:400}
@font-face{font-family:'Inter';src:url(data:font/ttf;base64,${data(TYPOGRAPHY_ASSETS.interRegular)}) format('truetype');font-style:normal;font-weight:500}
@font-face{font-family:'Inter';src:url(data:font/ttf;base64,${data(TYPOGRAPHY_ASSETS.interItalic)}) format('truetype');font-style:italic;font-weight:400}
@font-face{font-family:'Inter';src:url(data:font/ttf;base64,${data(TYPOGRAPHY_ASSETS.interItalic)}) format('truetype');font-style:italic;font-weight:500}
]]></style></defs>`;
  return svgFontDefsCache;
}

interface Palette {
  burgundy: string; burgundyDeep: string; burgundyTint: string; burgundyWash: string;
  nearBlack: string; bodyGray: string; midGray: string; softGray: string;
  divider: string; hairlineSoft: string; paper: string; ghostLight: string; ghostDark: string; darkHairline: string; white: string;
}
const BASE_PALETTE: Palette = {
  burgundy: '#AA1A2E', burgundyDeep: '#7E1422', burgundyTint: '#C8455A', burgundyWash: '#F4E7E9',
  nearBlack: '#1D1D1B', bodyGray: '#54565B', midGray: '#878A8E', softGray: '#BBBBBB',
  divider: '#D9D8D7', hairlineSoft: '#E3E2E1', paper: '#F2F1F0', ghostLight: '#ECEBEA', ghostDark: '#262523', darkHairline: '#3A3A38', white: '#FFFFFF',
};

interface Theme extends Palette {
  template: PresentationTemplate;
  showGhost: boolean;       // numerales fantasma (off en minimal)
  paperBreathers: boolean;  // fondos papel en stat/quote (off en minimal)
  logo: { path: string; aspect: number } | null;
  pptxFontSerif: string; pptxFontBody: string; pptxFontLabel: string;
}

function isHexColor(v?: string | null): boolean {
  return !!v && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v.trim());
}
function expandHex(v: string): string {
  const m = /^#([0-9a-fA-F]{3})$/.exec(v.trim());
  if (m) return '#' + m[1].split('').map((c) => c + c).join('');
  return v.trim();
}

function buildTheme(opts: RenderOptions, logo: { path: string; aspect: number } | null): Theme {
  const p: Palette = { ...BASE_PALETTE };
  if (opts.branding === 'custom' && isHexColor(opts.customPrimaryColor)) {
    p.burgundy = expandHex(opts.customPrimaryColor!.trim());
  }
  return {
    ...p,
    template: opts.template,
    showGhost: opts.template !== 'minimal',
    paperBreathers: opts.template !== 'minimal',
    logo,
    pptxFontSerif: TYPOGRAPHY.title, pptxFontBody: TYPOGRAPHY.body, pptxFontLabel: TYPOGRAPHY.body,
  };
}

// ============================================================
// Utilidades SVG de bajo nivel
// ============================================================
function esc(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function rect(x: number, y: number, w: number, h: number, fill: string, opacity = 1): string {
  return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="${fill}"${opacity !== 1 ? ` fill-opacity="${opacity}"` : ''}/>`;
}
function line(x1: number, y1: number, x2: number, y2: number, stroke: string, w = 1, opacity = 1): string {
  return `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${stroke}" stroke-width="${w}"${opacity !== 1 ? ` stroke-opacity="${opacity}"` : ''}/>`;
}
function r1(n: number): string { return (Math.round(n * 10) / 10).toString(); }

interface Txt {
  x: number; y: number; size: number; color: string; font: string;
  weight?: number; anchor?: 'start' | 'middle' | 'end'; tracking?: number; lines: string[]; lh?: number; opacity?: number;
}
function text(t: Txt): string {
  const lh = t.lh ?? Math.round(t.size * 1.3);
  const anchor = t.anchor ?? 'start';
  const ls = t.tracking ? ` letter-spacing="${t.tracking}"` : '';
  const op = t.opacity != null && t.opacity !== 1 ? ` fill-opacity="${t.opacity}"` : '';
  const tspans = t.lines.map((ln, i) => `<tspan x="${r1(t.x)}" dy="${i === 0 ? 0 : lh}">${esc(ln)}</tspan>`).join('');
  const requestedWeight = t.weight ?? 400;
  const weight = t.font === TYPOGRAPHY.body ? Math.min(500, Math.max(400, requestedWeight)) : requestedWeight;
  return `<text x="${r1(t.x)}" y="${r1(t.y)}" font-family="${t.font}" font-size="${t.size}" fill="${t.color}" font-weight="${weight}" text-anchor="${anchor}"${ls}${op}>${tspans}</text>`;
}
// Envuelve por conteo aproximado de caracteres (SVG <text> no auto-envuelve).
function wrap(s: string, maxChars: number): string[] {
  const words = (s || '').replace(/\s+/g, ' ').trim().split(' ');
  const out: string[] = [];
  let ln = '';
  for (const w of words) {
    if (!ln) { ln = w; continue; }
    if ((ln + ' ' + w).length <= maxChars) ln += ' ' + w;
    else { out.push(ln); ln = w; }
  }
  if (ln) out.push(ln);
  return out.length ? out : [''];
}

// Dispositivos de marca comunes -------------------------------------------------
function signatureStroke(t: Theme, x: number, y: number, w = 48, color?: string): string {
  return rect(x, y, w, 3, color ?? t.burgundy); // horizontal (ancho>=alto), respeta la regla de marca
}
function kickerText(t: Theme, x: number, baseline: number, s: string, color: string, anchor: 'start' | 'end' = 'start'): string {
  return text({ x, y: baseline, size: 13, color, font: FONT.label, weight: 700, tracking: 2.4, anchor, lines: [(s || '').toUpperCase()] });
}
function microLabel(t: Theme, x: number, baseline: number, s: string, color: string, anchor: 'start' | 'end' = 'start'): string {
  return text({ x, y: baseline, size: 11, color, font: FONT.label, weight: 600, tracking: 1.5, anchor, lines: [(s || '').toUpperCase()] });
}
function fullStopSquare(t: Theme, x: number, baseline: number, cap: number, color?: string): string {
  const side = Math.max(8, Math.round(cap * 0.22));
  return rect(x, baseline - side, side, side, color ?? t.burgundy);
}
function ghostNumeral(t: Theme, n: number, ground: 'white' | 'paper' | 'dark' | 'burgundy'): string {
  if (!t.showGhost) return '';
  const color = ground === 'dark' ? t.ghostDark : ground === 'burgundy' ? t.burgundyTint : t.ghostLight;
  const label = String(n).padStart(2, '0');
  return text({ x: 1240, y: 560, size: 320, color, font: FONT.serif, weight: 400, anchor: 'end', lines: [label] });
}
// Header Pattern A: trazo + kicker + título + hairline. Devuelve la Y de inicio de contenido.
function headerA(parts: string[], t: Theme, kicker: string | undefined, title: string, ground: 'white' | 'paper', titleSize = 46, maxChars = 30): number {
  parts.push(signatureStroke(t, SPINE, 84));
  if (kicker) parts.push(kickerText(t, SPINE, 116, kicker, t.burgundy));
  const lines = wrap(title, maxChars).slice(0, 2);
  const lh = Math.round(titleSize * 1.13);
  const firstBaseline = lines.length > 1 ? 160 : 168;
  parts.push(text({ x: SPINE, y: firstBaseline, size: titleSize, color: t.nearBlack, font: FONT.serif, weight: 400, tracking: -0.4, lines, lh }));
  const hairlineY = lines.length > 1 ? 224 : 196;
  parts.push(line(SPINE, hairlineY, RIGHT, hairlineY, t.divider, 1));
  return hairlineY + 56;
}
function footerChrome(parts: string[], t: Theme, index: number, total: number, dark = false): string {
  const color = dark ? t.white : t.nearBlack;
  const muted = dark ? t.softGray : t.midGray;
  parts.push(line(SPINE, 664, RIGHT, 664, dark ? t.darkHairline : t.divider, 1));
  parts.push(microLabel(t, SPINE, 684, 'Von Wobeser y Sierra', muted));
  const cur = String(index).padStart(2, '0');
  parts.push(text({ x: RIGHT, y: 684, size: 11, color, font: FONT.label, weight: 600, tracking: 1.5, anchor: 'end', lines: [`${cur} / ${String(total).padStart(2, '0')}`] }));
  return '';
}

// ============================================================
// Gráficas (con soporte de valores NEGATIVOS y línea base en cero)
// ============================================================
function chartPalette(t: Theme): string[] {
  return [t.burgundy, t.bodyGray, t.midGray, t.softGray, t.divider];
}
function niceMax(v: number): number {
  if (!isFinite(v) || v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return nice * pow;
}
function fmtNum(v: number, unit?: string): string {
  const s = Number.isInteger(v) ? String(v) : String(Math.round(v * 10) / 10);
  return unit ? `${s}${unit}` : s;
}
interface Box { x: number; y: number; w: number; h: number }

function renderChartSvg(chart: SlideChart, box: Box, t: Theme): string {
  const parts: string[] = [];
  const palette = chartPalette(t);
  const cats = (chart.categories || []).map(String);
  const series = (chart.series || []).filter((s) => s && Array.isArray(s.values)).slice(0, chart.type === 'pie' ? 1 : 4);
  if (cats.length === 0 || series.length === 0) return '';

  if (chart.type === 'pie') {
    const values = series[0].values.map((v) => Math.max(0, Number(v) || 0));
    const total = values.reduce((a, b) => a + b, 0) || 1;
    const r = Math.max(20, Math.min(box.h, box.w * 0.5) / 2 - 10);
    const cx = box.x + r + 10;
    const cy = box.y + box.h / 2;
    let angle = -Math.PI / 2;
    values.forEach((v, i) => {
      const frac = v / total;
      const next = angle + frac * Math.PI * 2;
      const color = palette[i % palette.length];
      if (frac >= 0.999) parts.push(`<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" fill="${color}"/>`);
      else {
        const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
        const x2 = cx + r * Math.cos(next), y2 = cy + r * Math.sin(next);
        parts.push(`<path d="M ${r1(cx)} ${r1(cy)} L ${r1(x1)} ${r1(y1)} A ${r1(r)} ${r1(r)} 0 ${frac > 0.5 ? 1 : 0} 1 ${r1(x2)} ${r1(y2)} Z" fill="${color}"/>`);
      }
      angle = next;
    });
    const lx = cx + r + 48;
    let ly = box.y + Math.max(10, (box.h - cats.length * 32) / 2);
    cats.forEach((c, i) => {
      const pct = Math.round((values[i] / total) * 100);
      parts.push(rect(lx, ly, 12, 12, palette[i % palette.length]));
      parts.push(text({ x: lx + 22, y: ly + 11, size: 16, color: t.bodyGray, font: FONT.body, lines: [`${c} — ${pct}%`] }));
      ly += 32;
    });
    return parts.join('');
  }

  // Barra / línea con rango [min,max] y línea base en cero (soporta negativos).
  const padL = 70, padB = 46, padT = 12, padR = 14;
  const px = box.x + padL, py = box.y + padT, pw = box.w - padL - padR, ph = box.h - padT - padB;
  const allVals = series.flatMap((s) => s.values.map((v) => Number(v) || 0));
  const dataMax = Math.max(0, ...allVals);
  const dataMin = Math.min(0, ...allVals);
  const axisMax = niceMax(dataMax);
  const axisMin = dataMin < 0 ? -niceMax(-dataMin) : 0;
  const range = axisMax - axisMin || 1;
  const yOf = (v: number) => py + ph - ((v - axisMin) / range) * ph;
  const zeroY = yOf(0);
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const val = axisMin + (range / steps) * i;
    const gy = yOf(val);
    parts.push(line(px, gy, px + pw, gy, Math.abs(val) < 1e-9 ? t.softGray : t.ghostLight, 1));
    parts.push(text({ x: px - 12, y: gy + 5, size: 12, color: t.midGray, font: FONT.label, weight: 600, tracking: 0.5, anchor: 'end', lines: [fmtNum(val, chart.unit)] }));
  }
  const groups = cats.length;
  const groupW = pw / groups;

  if (chart.type === 'bar') {
    const barW = (groupW * 0.62) / series.length;
    const showValues = groups * series.length <= 8;
    cats.forEach((c, gi) => {
      const gx = px + gi * groupW + groupW * 0.19;
      series.forEach((s, si) => {
        const v = Number(s.values[gi]) || 0;
        const vy = yOf(v);
        const top = Math.min(vy, zeroY), bh = Math.abs(vy - zeroY);
        const bx = gx + si * barW;
        parts.push(rect(bx, top, barW * 0.88, Math.max(0, bh), palette[si % palette.length]));
        if (showValues) parts.push(text({ x: bx + barW * 0.44, y: (v >= 0 ? top - 8 : top + bh + 18), size: 13, color: t.bodyGray, font: FONT.body, anchor: 'middle', lines: [fmtNum(v, chart.unit)] }));
      });
      parts.push(text({ x: px + gi * groupW + groupW / 2, y: py + ph + 26, size: 14, color: t.bodyGray, font: FONT.body, anchor: 'middle', lines: wrap(c, 12).slice(0, 2), lh: 16 }));
    });
  } else {
    series.forEach((s, si) => {
      const pts = cats.map((_, gi) => [px + gi * groupW + groupW / 2, yOf(Number(s.values[gi]) || 0)] as [number, number]);
      const color = palette[si % palette.length];
      parts.push(`<polyline points="${pts.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="${si === 0 ? 3 : 2}"/>`);
      pts.forEach(([x, y]) => parts.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="4" fill="${color}"/>`));
    });
    cats.forEach((c, gi) => parts.push(text({ x: px + gi * groupW + groupW / 2, y: py + ph + 26, size: 14, color: t.bodyGray, font: FONT.body, anchor: 'middle', lines: wrap(c, 12).slice(0, 2), lh: 16 })));
  }
  if (series.length > 1) {
    let lx = box.x + padL;
    const ly = box.y + box.h - 6;
    series.forEach((s, si) => {
      parts.push(rect(lx, ly - 13, 14, 14, palette[si % palette.length]));
      const label = s.name || `Serie ${si + 1}`;
      parts.push(text({ x: lx + 20, y: ly, size: 13, color: t.bodyGray, font: FONT.body, lines: [label] }));
      lx += 20 + label.length * 8 + 26;
    });
  }
  return parts.join('');
}

function renderDiagramSvg(d: SlideDiagram, box: Box, t: Theme): string {
  const parts: string[] = [];
  const nodes = (d.nodes || []).map(String).filter(Boolean).slice(0, 6);
  if (nodes.length === 0) return '';
  const arrow = (x: number, y: number) => `<path d="M ${r1(x)} ${r1(y)} l -9 -8 l 0 16 z" fill="${t.midGray}"/>`;

  if (nodes.length <= 4) {
    const gap = 44, n = nodes.length;
    const bw = (box.w - (n - 1) * gap) / n;
    const bh = Math.min(160, box.h * 0.6);
    const by = box.y + (box.h - bh) / 2;
    nodes.forEach((node, i) => {
      const bx = box.x + i * (bw + gap);
      parts.push(rect(bx, by, bw, bh, t.paper));
      parts.push(rect(bx, by, bw, 4, t.burgundy));       // regla HORIZONTAL (no barra vertical roja)
      parts.push(microLabel(t, bx + 16, by + 30, `Paso ${String(i + 1).padStart(2, '0')}`, t.midGray));
      const lines = wrap(node, Math.max(10, Math.floor(bw / 11))).slice(0, 4);
      const sy = by + bh / 2 + 6 - (lines.length - 1) * 12;
      parts.push(text({ x: bx + bw / 2, y: sy, size: 19, color: t.nearBlack, font: FONT.body, weight: 700, anchor: 'middle', lines, lh: 24 }));
      if (i < n - 1) { const ax = bx + bw, ay = by + bh / 2; parts.push(line(ax + 6, ay, ax + gap - 8, ay, t.midGray, 2)); parts.push(arrow(ax + gap - 4, ay)); }
    });
  } else {
    const n = nodes.length, rowH = box.h / n;
    nodes.forEach((node, i) => {
      const cy = box.y + i * rowH + rowH / 2;
      const r = Math.min(22, rowH / 2 - 8);
      const cxp = box.x + r + 4;
      parts.push(`<circle cx="${r1(cxp)}" cy="${r1(cy)}" r="${r1(r)}" fill="${t.burgundy}"/>`);
      parts.push(text({ x: cxp, y: cy + 6, size: 18, color: t.white, font: FONT.serif, weight: 700, anchor: 'middle', lines: [String(i + 1)] }));
      parts.push(text({ x: cxp + r + 22, y: cy + 6, size: 20, color: t.bodyGray, font: FONT.body, lines: wrap(node, 62).slice(0, 2), lh: 24 }));
      if (i < n - 1) parts.push(line(cxp, cy + r + 2, cxp, box.y + (i + 1) * rowH + rowH / 2 - r - 2, t.divider, 2));
    });
  }
  return parts.join('');
}

// ============================================================
// Contexto de render (fondo por slide + composites de imagen)
// ============================================================
type Ground = 'white' | 'paper' | 'dark';
interface ImageComposite { path: string; box: Box; cover?: boolean; scrim?: number }
interface SlideBuild { svg: string; image: ImageComposite | null }

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

function resolveLocalAsset(url?: string | null): string | null {
  if (!url) return null;
  const clean = url.split('?')[0];
  const map: Record<string, string> = {
    '/uploads/': path.join(process.cwd(), 'uploads'),
    '/generated-images/': path.join(process.cwd(), 'public', 'generated-images'),
  };
  for (const [prefix, dir] of Object.entries(map)) {
    if (clean.startsWith(prefix)) {
      const p = path.join(dir, path.basename(clean));
      return fs.existsSync(p) ? p : null;
    }
  }
  // SEGURIDAD: no se resuelven rutas absolutas arbitrarias (evita leer archivos del servidor).
  return null;
}

// ============================================================
// Renderers por tipo de diapositiva (SVG / PNG / PDF)
// ============================================================
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
function groundFor(s: SlideModelSlide, t: Theme, prevPaper: boolean): Ground {
  if (s.layout === 'section' || s.layout === 'closing') return 'dark';
  if (s.layout === 'quote') return 'paper';
  if (s.layout === 'stat' && t.paperBreathers && !prevPaper) return 'paper';
  return 'white';
}

export class PresentationGenerator {
  private log(msg: string): void { console.log(`[PresentationGenerator] ${msg}`); }

  private async logoInfo(opts: RenderOptions): Promise<{ path: string; aspect: number } | null> {
    let logoPath: string | null = null;
    if (opts.branding === 'custom') logoPath = resolveLocalAsset(opts.customLogoUrl);
    if (!logoPath && fs.existsSync(VW_LOGO_PATH)) logoPath = VW_LOGO_PATH;
    if (!logoPath) return null;
    try { const meta = await sharp(logoPath).metadata(); return { path: logoPath, aspect: (meta.height || 1) / (meta.width || 1) }; } catch { return null; }
  }

  private async rasterize(build: SlideBuild): Promise<Buffer> {
    let base = await sharp(Buffer.from(build.svg)).png().toBuffer();
    if (build.image) {
      try {
        const b = build.image.box;
        const fit = build.image.cover ? 'cover' : 'inside';
        let img = sharp(build.image.path).resize(Math.round(b.w), Math.round(b.h), { fit: fit as any });
        let buf = await img.png().toBuffer();
        if (build.image.scrim) {
          // Oscurece uniformemente la imagen full-bleed (scrim plano, sin gradiente).
          const dark = await sharp({ create: { width: Math.round(b.w), height: Math.round(b.h), channels: 4, background: { r: 29, g: 29, b: 27, alpha: build.image.scrim } } }).png().toBuffer();
          buf = await sharp(buf).composite([{ input: dark, top: 0, left: 0 }]).png().toBuffer();
        }
        const meta = await sharp(buf).metadata();
        const left = Math.round(b.x + (b.w - (meta.width || b.w)) / 2);
        const top = Math.round(b.y + (b.h - (meta.height || b.h)) / 2);
        // La imagen va DEBAJO del texto: se compone la imagen sobre el fondo y el SVG encima.
        const bg = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } }).png().toBuffer();
        base = await sharp(bg)
          .composite([{ input: buf, top, left }, { input: Buffer.from(build.svg), top: 0, left: 0 }])
          .png().toBuffer();
      } catch (e: any) { this.log(`No se pudo componer la imagen: ${e?.message}`); }
    }
    // Logo discreto abajo-derecha en TODAS las diapositivas.
    // (se compone al final para quedar sobre cualquier fondo)
    return base;
  }

  private async composeLogo(buf: Buffer, logo: { path: string; aspect: number } | null, dark: boolean): Promise<Buffer> {
    if (!logo) return buf;
    try {
      const w = 132, h = Math.round(w * logo.aspect);
      const logoBuf = await sharp(logo.path).resize(w, h, { fit: 'inside' }).png().toBuffer();
      return await sharp(buf).composite([{ input: logoBuf, top: H - h - 26, left: W - w - 40 }]).png().toBuffer();
    } catch { return buf; }
  }

  async renderAndSave(model: SlideModel, opts: RenderOptions): Promise<RenderResult> {
    const generatedFiles: PublicMediaFile[] = [];
    let persistedObjectNames: string[] = [];
    try {
      if (!model || !model.title || !Array.isArray(model.slides) || model.slides.length === 0) {
        return { success: false, error: 'El modelo de diapositivas está vacío o es inválido.' };
      }
      if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

      const logo = await this.logoInfo(opts);
      const t = buildTheme(opts, logo);
      const lang: 'en' | 'es' = opts.lang === 'en' ? 'en' : 'es';
      const config = await getConfigMap();
      const firm = cfg(config, 'footer_firm', lang) || 'Von Wobeser y Sierra, S.C.';
      const site = cfg(config, 'site_url', lang) || 'https://www.vonwobeser.com';
      const phone = cfg(config, 'footer_phone', lang) || '';
      const addr = cfg(config, 'footer_address', lang) || 'Ciudad de México';
      const footer = `${firm}`;
      const docKicker = lang === 'en' ? 'Presentation · 2026' : 'Presentación · 2026';
      const trunc = (s: string, n: number) => (s && s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
      const contact = [
        { label: lang === 'en' ? 'Offices' : 'Oficinas', value: trunc(addr, 44) },
        { label: 'Web', value: site.replace(/^https?:\/\//, '') },
        ...(phone ? [{ label: lang === 'en' ? 'Phone' : 'Teléfono', value: phone }] : []),
      ];

      const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const baseName = `pres-${stamp}`;
      const formats = opts.formats && opts.formats.length ? opts.formats : ['pptx', 'pdf', 'png'];
      const total = model.slides.length + 1;

      // Construir SVG por diapositiva (con fondo por ritmo).
      const builds: { build: SlideBuild; ground: Ground }[] = [];
      builds.push({ build: renderCover(model, t, footer, docKicker), ground: 'white' });
      let prevPaper = false;
      let sectionIdx = 0;
      model.slides.forEach((s, i) => {
        const ground = groundFor(s, t, prevPaper);
        prevPaper = ground === 'paper';
        const idx = i + 2;
        let b: SlideBuild;
        switch (s.layout) {
          case 'section': b = renderSection(s, t, ++sectionIdx); break;
          case 'stat': b = renderStat(s, t, ground, idx, total); break;
          case 'chart': b = s.chart ? renderChart(s, t, idx, total) : renderBullets(s, t, ground, idx, total); break;
          case 'diagram': b = s.diagram ? renderDiagram(s, t, idx, total) : renderBullets(s, t, ground, idx, total); break;
          case 'image': b = renderImage(s, t, idx, total); break;
          case 'quote': b = renderQuote(s, t, idx, total); break;
          case 'twocolumn': b = renderTwoColumn(s, t, ground, idx, total); break;
          case 'closing': b = renderClosing(s, t, `${firm} · ${site.replace(/^https?:\/\//, '')}`, contact); break;
          default: b = renderBullets(s, t, ground, idx, total);
        }
        builds.push({ build: b, ground });
      });

      let pptxUrl: string | null = null, pdfUrl: string | null = null;
      const pngUrls: string[] = [];
      const needPng = formats.includes('png'), needPdf = formats.includes('pdf');
      let pngBuffers: Buffer[] = [];
      if (needPng || needPdf) {
        for (let i = 0; i < builds.length; i++) {
          // La marca la lleva el WORDMARK de texto ("VON WOBESER Y SIERRA") presente en cada
          // diapositiva; NO se compone el logo gráfico (era redundante y chocaba con el número de
          // diapositiva abajo-derecha).
          const png = await this.rasterize(builds[i].build);
          pngBuffers.push(png);
          if (needPng) {
            const fn = `${baseName}-slide-${i + 1}.png`;
            const absolutePath = path.join(OUTPUT_DIR, fn);
            const publicPath = `/generated-presentations/${fn}`;
            fs.writeFileSync(absolutePath, png);
            generatedFiles.push({ absolutePath, publicPath });
            pngUrls.push(publicPath);
          }
        }
        this.log(`Renderizadas ${pngBuffers.length} diapositivas a PNG`);
      }

      if (needPdf && pngBuffers.length) {
        const pdf = await PDFDocument.create();
        for (const png of pngBuffers) { const img = await pdf.embedPng(png); const pg = pdf.addPage([W, H]); pg.drawImage(img, { x: 0, y: 0, width: W, height: H }); }
        const bytes = await pdf.save();
        const fn = `${baseName}.pdf`;
        const absolutePath = path.join(OUTPUT_DIR, fn);
        const publicPath = `/generated-presentations/${fn}`;
        fs.writeFileSync(absolutePath, bytes);
        generatedFiles.push({ absolutePath, publicPath });
        pdfUrl = publicPath;
        this.log('PDF generado');
      }

      if (formats.includes('pptx')) {
        const pptx = await this.buildPptx(model, t, footer, docKicker, contact, `${firm} · ${site.replace(/^https?:\/\//, '')}`, total);
        const fn = `${baseName}.pptx`;
        const absolutePath = path.join(OUTPUT_DIR, fn);
        const publicPath = `/generated-presentations/${fn}`;
        await pptx.writeFile({ fileName: absolutePath });
        await embedPresentationFonts(absolutePath);
        generatedFiles.push({ absolutePath, publicPath });
        pptxUrl = publicPath;
        this.log('PPTX generado');
      }

      // El historial solo se confirma después de que todos los formatos solicitados
      // quedaron protegidos. En Replit/producción App Storage es obligatorio.
      const persistence = await persistPublicMediaFiles(generatedFiles);
      persistedObjectNames = persistence.objectNames;

      const presentation = await storage.createGeneratedPresentation({
        title: model.title, topic: opts.topic || null, template: opts.template, branding: opts.branding, lang: opts.lang,
        slideCount: total, pptxUrl, pdfUrl, pngUrls, sourceDocs: opts.sourceDocs || [], engine: opts.engine || 'openai+native',
      });
      return { success: true, presentation };
    } catch (err: any) {
      await deletePersistentMediaObjects(persistedObjectNames);
      for (const generatedFile of generatedFiles) {
        try {
          fs.unlinkSync(generatedFile.absolutePath);
        } catch {
          // El archivo quizá no llegó a escribirse o ya fue limpiado.
        }
      }
      console.error('[PresentationGenerator] Error:', err);
      if (err instanceof PersistentMediaUnavailableError) {
        return {
          success: false,
          error: 'App Storage no está disponible. La presentación no se guardó para evitar que se pierda al publicar.',
        };
      }
      return { success: false, error: err?.message || 'Falló la generación de la presentación.' };
    }
  }

  // ============================================================
  // PPTX (pptxgenjs) — refleja MERIDIANO con texto real + formas + gráficas nativas
  // ============================================================
  private hx(c: string): string { return c.replace('#', ''); }

  private async diagramPng(d: SlideDiagram, t: Theme): Promise<Buffer> {
    const wPx = 1180, hPx = 470;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${wPx}" height="${hPx}">${svgFontDefs()}<rect width="${wPx}" height="${hPx}" fill="${t.white}"/>${renderDiagramSvg(d, { x: 24, y: 24, w: wPx - 48, h: hPx - 48 }, t)}</svg>`;
    return sharp(Buffer.from(svg)).png().toBuffer();
  }

  private async buildPptx(model: SlideModel, t: Theme, footer: string, docKicker: string, contact: { label: string; value: string }[], closingFooter: string, total: number): Promise<PptxGenJS> {
    const pptx = new PptxGenCtor();
    pptx.defineLayout({ name: 'VW', width: 13.333, height: 7.5 });
    pptx.layout = 'VW';
    const IN = (px: number) => px / 96;
    const PT = (px: number) => px * 0.75;
    const S = FONT_PPTX;
    const white = { color: this.hx(t.white) }, dark = { color: this.hx(t.nearBlack) }, paper = { color: this.hx(t.paper) };
    const burg = this.hx(t.burgundy), nb = this.hx(t.nearBlack), body = this.hx(t.bodyGray), mid = this.hx(t.midGray), div = this.hx(t.divider);
    const palette = chartPalette(t).map((c) => this.hx(c));

    const addLogo = (_sl: PptxGenJS.Slide) => { /* la marca la lleva el wordmark de texto; sin logo gráfico (evita choque con el nº de diapositiva) */ };
    const stroke = (sl: PptxGenJS.Slide, xPx: number, yPx: number, wPx = 48, color = burg) => sl.addShape(pptx.ShapeType.rect, { x: IN(xPx), y: IN(yPx), w: IN(wPx), h: IN(3), fill: { color } });
    const hline = (sl: PptxGenJS.Slide, yPx: number, color = div, x1 = 80, x2 = 1200) => sl.addShape(pptx.ShapeType.line, { x: IN(x1), y: IN(yPx), w: IN(x2 - x1), h: 0, line: { color, width: 0.75 } });
    const kicker = (sl: PptxGenJS.Slide, xPx: number, yPx: number, s: string, color = burg, align: 'left' | 'right' = 'left') => sl.addText((s || '').toUpperCase(), { x: IN(xPx - (align === 'right' ? 300 : 0)), y: IN(yPx - 14), w: IN(align === 'right' ? 300 + (1200 - xPx) : 400), h: IN(18), align, fontFace: S.label, fontSize: 9.75, bold: true, charSpacing: 2, color });
    const footChrome = (sl: PptxGenJS.Slide, idx: number, darkbg = false) => {
      hline(sl, 664, darkbg ? this.hx(t.darkHairline) : div);
      sl.addText('VON WOBESER Y SIERRA', { x: IN(80), y: IN(672), w: IN(400), h: IN(18), fontFace: S.label, fontSize: 8.25, bold: true, charSpacing: 1.5, color: darkbg ? this.hx(t.softGray) : mid });
      sl.addText(`${String(idx).padStart(2, '0')} / ${String(total).padStart(2, '0')}`, { x: IN(900), y: IN(672), w: IN(300), h: IN(18), align: 'right', fontFace: S.label, fontSize: 8.25, bold: true, charSpacing: 1.5, color: darkbg ? white.color : nb });
    };

    // Portada
    const cover = pptx.addSlide(); cover.background = white;
    kicker(cover, 80, 112, docKicker);
    cover.addText('VON WOBESER Y SIERRA', { x: IN(800), y: IN(98), w: IN(400), h: IN(18), align: 'right', fontFace: S.label, fontSize: 8.25, bold: true, charSpacing: 1.5, color: nb });
    hline(cover, 128);
    stroke(cover, 80, 300);
    cover.addText(model.title, { x: IN(80), y: IN(330), w: IN(860), h: IN(220), fontFace: S.serif, fontSize: 54, color: nb, align: 'left', valign: 'top', lineSpacingMultiple: 1.05 });
    if (model.subtitle) cover.addText(model.subtitle, { x: IN(80), y: IN(560), w: IN(660), h: IN(60), fontFace: S.body, fontSize: 15.75, color: body });
    hline(cover, 632);
    cover.addText(footer.toUpperCase(), { x: IN(80), y: IN(652), w: IN(500), h: IN(18), fontFace: S.label, fontSize: 8.25, bold: true, charSpacing: 1.5, color: mid });
    addLogo(cover);

    const contentTitle = (sl: PptxGenJS.Slide, kk: string | undefined, title: string, sizePt = 34.5) => {
      stroke(sl, 80, 84); if (kk) kicker(sl, 80, 116, kk);
      sl.addText(title, { x: IN(80), y: IN(132), w: IN(1120), h: IN(70), fontFace: S.serif, fontSize: sizePt, color: nb, valign: 'top' });
      hline(sl, 196);
    };

    let sectionIdx = 0;
    for (let i = 0; i < model.slides.length; i++) {
      const s = model.slides[i]; const idx = i + 2;
      const sl = pptx.addSlide();

      if (s.layout === 'section') {
        sl.background = dark; sectionIdx++;
        if (t.showGhost) sl.addText(String(sectionIdx).padStart(2, '0'), { x: IN(700), y: IN(220), w: IN(560), h: IN(360), align: 'right', fontFace: S.serif, fontSize: 200, color: this.hx(t.ghostDark) });
        stroke(sl, 80, 300);
        if (s.kicker) sl.addText(s.kicker.toUpperCase(), { x: IN(80), y: IN(318), w: IN(500), h: IN(18), fontFace: S.label, fontSize: 9.75, bold: true, charSpacing: 2, color: burg });
        sl.addText(s.title, { x: IN(80), y: IN(360), w: IN(900), h: IN(150), fontFace: S.serif, fontSize: 45, color: white.color, valign: 'top' });
      } else if (s.layout === 'closing') {
        sl.background = dark;
        sl.addText('VON WOBESER Y SIERRA', { x: IN(80), y: IN(98), w: IN(400), h: IN(18), fontFace: S.label, fontSize: 8.25, bold: true, charSpacing: 1.5, color: white.color });
        stroke(sl, 80, 300, 64); sl.addText((s.kicker || 'Contacto').toUpperCase(), { x: IN(80), y: IN(318), w: IN(400), h: IN(18), fontFace: S.label, fontSize: 9.75, bold: true, charSpacing: 2, color: burg });
        sl.addText(s.title || 'Gracias', { x: IN(80), y: IN(360), w: IN(900), h: IN(80), fontFace: S.serif, fontSize: 45, color: white.color });
        hline(sl, 470, this.hx(t.darkHairline));
        contact.slice(0, 4).forEach((c, ci) => {
          const x = ci % 2 === 0 ? 80 : 680; const y = ci < 2 ? 500 : 556;
          sl.addText(c.label.toUpperCase(), { x: IN(x), y: IN(y - 14), w: IN(400), h: IN(16), fontFace: S.label, fontSize: 8.25, bold: true, charSpacing: 1.5, color: burg });
          sl.addText(c.value, { x: IN(x), y: IN(y + 8), w: IN(460), h: IN(24), fontFace: S.body, fontSize: 12, color: white.color });
        });
      } else if (s.layout === 'quote') {
        sl.background = paper;
        sl.addText('“', { x: IN(60), y: IN(120), w: IN(200), h: IN(160), fontFace: S.serif, fontSize: 150, bold: true, color: this.hx(t.burgundyWash) });
        sl.addText((s.quote?.text || s.title), { x: IN(80), y: IN(240), w: IN(900), h: IN(220), fontFace: S.serif, fontSize: 30, color: nb, valign: 'top', lineSpacingMultiple: 1.3 });
        stroke(sl, 80, 548, 40);
        if (s.quote?.attribution) sl.addText(s.quote.attribution.toUpperCase() + (s.quote.role ? '   ·   ' + s.quote.role : ''), { x: IN(80), y: IN(562), w: IN(900), h: IN(20), fontFace: S.label, fontSize: 10.5, bold: true, charSpacing: 1.2, color: nb });
      } else if (s.layout === 'stat') {
        sl.background = t.paperBreathers ? paper : white;
        const figs = (s.stat?.figures || []).slice(0, 3);
        if (figs.length <= 1) {
          const f = figs[0] || { value: '', label: s.title };
          if (s.kicker) sl.addText(s.kicker.toUpperCase(), { x: IN(80), y: IN(102), w: IN(500), h: IN(18), fontFace: S.label, fontSize: 9.75, bold: true, charSpacing: 2, color: burg });
          sl.addText(f.value || '', { x: IN(80), y: IN(250), w: IN(900), h: IN(220), fontFace: S.serif, fontSize: 132, color: burg });
          stroke(sl, 80, 468, 64);
          sl.addText((f.label || s.title || '').toUpperCase(), { x: IN(80), y: IN(486), w: IN(700), h: IN(18), fontFace: S.label, fontSize: 8.25, bold: true, charSpacing: 1.5, color: mid });
          if (f.note) sl.addText(f.note, { x: IN(80), y: IN(516), w: IN(560), h: IN(50), fontFace: S.body, fontSize: 12.75, color: body });
        } else {
          contentTitle(sl, s.kicker, s.title, 30);
          const xs = figs.length === 2 ? [80, 680] : [80, 460, 840];
          figs.forEach((f, ci) => {
            sl.addText(f.value || '', { x: IN(xs[ci]), y: IN(300), w: IN(340), h: IN(110), fontFace: S.serif, fontSize: figs.length === 2 ? 96 : 72, color: nb });
            sl.addText((f.label || '').toUpperCase(), { x: IN(xs[ci]), y: IN(418), w: IN(340), h: IN(18), fontFace: S.label, fontSize: 8.25, bold: true, charSpacing: 1.5, color: mid });
            if (f.note) sl.addText(f.note, { x: IN(xs[ci]), y: IN(444), w: IN(340), h: IN(44), fontFace: S.body, fontSize: 11.25, color: body });
          });
        }
        footChrome(sl, idx);
      } else if (s.layout === 'chart' && s.chart) {
        sl.background = white;
        if (s.kicker) kicker(sl, 80, 116, s.kicker);
        sl.addText(s.title, { x: IN(80), y: IN(108), w: IN(1120), h: IN(50), fontFace: S.serif, fontSize: 25.5, color: nb });
        hline(sl, 200);
        this.addPptxChart(pptx, sl, s.chart, palette, nb, mid, IN, s.chart.insight ? { x: 80, y: 240, w: 740, h: 360 } : { x: 80, y: 232, w: 1120, h: 372 });
        if (s.chart.insight) { stroke(sl, 880, 240, 40); sl.addText('LECTURA CLAVE', { x: IN(880), y: IN(258), w: IN(320), h: IN(16), fontFace: S.label, fontSize: 9.75, bold: true, charSpacing: 2, color: burg }); sl.addText(s.chart.insight, { x: IN(880), y: IN(300), w: IN(320), h: IN(300), fontFace: S.body, fontSize: 12.75, color: body }); }
        footChrome(sl, idx);
      } else if (s.layout === 'diagram' && s.diagram) {
        sl.background = white; contentTitle(sl, s.kicker, s.title, 30);
        const png = await this.diagramPng(s.diagram, t);
        sl.addImage({ data: `data:image/png;base64,${png.toString('base64')}`, x: IN(80), y: IN(252), w: IN(1120), h: IN(360), sizing: { type: 'contain', w: IN(1120), h: IN(360) } });
        footChrome(sl, idx);
      } else if (s.layout === 'image') {
        sl.background = white;
        const localPath = resolveLocalAsset(s.image?.url);
        const bullets = (s.bullets || []);
        if (localPath) {
          stroke(sl, 80, 140); if (s.kicker) kicker(sl, 80, 172, s.kicker);
          sl.addText(s.title, { x: IN(80), y: IN(200), w: IN(460), h: IN(100), fontFace: S.serif, fontSize: 30, color: nb });
          if (bullets.length) {
            const items = bullets.slice(0, 4).map((b) => ({ text: b, options: { bullet: { code: '25AA' }, color: body, fontFace: S.body, fontSize: 12.75, paraSpaceAfter: 8 } }));
            sl.addText(items as any, { x: IN(80), y: IN(320), w: IN(460), h: IN(280), valign: 'top' });
          }
          sl.addImage({ path: localPath, x: IN(640), y: 0, w: IN(640), h: 7.5, sizing: { type: 'cover', w: IN(640), h: 7.5 } });
        } else {
          contentTitle(sl, s.kicker, s.title, 30);
          const items = bullets.slice(0, 6).map((b) => ({ text: b, options: { bullet: { code: '25AA' }, color: body, fontFace: S.body, fontSize: 12.75, paraSpaceAfter: 8 } }));
          if (items.length) sl.addText(items as any, { x: IN(80), y: IN(252), w: IN(1120), h: IN(340), valign: 'top' });
        }
        footChrome(sl, idx);
      } else if (s.layout === 'twocolumn') {
        sl.background = white; contentTitle(sl, s.kicker, s.title, 30);
        sl.addShape(pptx.ShapeType.line, { x: IN(640), y: IN(224), w: 0, h: IN(376), line: { color: div, width: 0.75 } });
        const cols = (s.columns && s.columns.length ? s.columns : [{ heading: '', points: (s.bullets || []).slice(0, Math.ceil((s.bullets || []).length / 2)) }, { heading: '', points: (s.bullets || []).slice(Math.ceil((s.bullets || []).length / 2)) }]).slice(0, 2);
        [80, 680].forEach((x, ci) => {
          const col = cols[ci]; if (!col) return;
          if (col.heading) sl.addText(col.heading.toUpperCase(), { x: IN(x), y: IN(238), w: IN(520), h: IN(18), fontFace: S.label, fontSize: 9.75, bold: true, charSpacing: 2, color: burg });
          const items = (col.points || []).slice(0, 6).map((p) => ({ text: p, options: { bullet: { code: '25AA' }, color: body, fontFace: S.body, fontSize: 12.75, paraSpaceAfter: 8 } }));
          if (items.length) sl.addText(items as any, { x: IN(x), y: IN(284), w: IN(500), h: IN(320), valign: 'top' });
        });
        footChrome(sl, idx);
      } else {
        // bullets
        sl.background = white; contentTitle(sl, s.kicker, s.title, 34.5);
        const items = (s.bullets || []).slice(0, 6).map((b, bi) => ({ text: b, options: { color: body, fontFace: S.body, fontSize: 13.5, bold: false, paraSpaceAfter: 14, bullet: { characterCode: '25AA' } } }));
        if (items.length) sl.addText(items as any, { x: IN(80), y: IN(252), w: IN(1050), h: IN(350), valign: 'top' });
        footChrome(sl, idx);
      }
      if (s.notes) sl.addNotes(s.notes);
      addLogo(sl);
    }
    return pptx;
  }

  private addPptxChart(pptx: PptxGenJS, sl: PptxGenJS.Slide, chart: SlideChart, palette: string[], nb: string, mid: string, IN: (n: number) => number, boxPx: { x: number; y: number; w: number; h: number }): void {
    const cats = (chart.categories || []).map(String);
    const series = (chart.series || []).filter((s) => s && Array.isArray(s.values));
    if (cats.length === 0 || series.length === 0) return;
    const box = { x: IN(boxPx.x), y: IN(boxPx.y), w: IN(boxPx.w), h: IN(boxPx.h) };
    if (chart.type === 'pie') {
      const data = [{ name: chart.series[0]?.name || 'Datos', labels: cats, values: (series[0].values || []).map((v) => Number(v) || 0) }];
      sl.addChart(pptx.ChartType.pie, data as any, { ...box, showLegend: true, legendPos: 'r', legendColor: nb, showPercent: true, chartColors: palette, dataLabelColor: 'FFFFFF' });
    } else {
      const data = series.slice(0, 4).map((se, i) => ({ name: se.name || `Serie ${i + 1}`, labels: cats, values: (se.values || []).map((v) => Number(v) || 0) }));
      const type = chart.type === 'line' ? pptx.ChartType.line : pptx.ChartType.bar;
      sl.addChart(type, data as any, { ...box, barDir: 'col', chartColors: palette, showLegend: series.length > 1, legendPos: 'b', legendColor: nb, catAxisLabelColor: nb, valAxisLabelColor: mid, showValue: false });
    }
  }
}

// pptxgenjs es dual CJS/ESM; bajo esbuild/tsx el default puede venir como { default: class }.
const PptxGenCtor = ((PptxGenJS as any)?.default ?? PptxGenJS) as typeof PptxGenJS;
const FONT_PPTX = { serif: TYPOGRAPHY.title, body: TYPOGRAPHY.body, label: TYPOGRAPHY.body };

export const presentationGenerator = new PresentationGenerator();
