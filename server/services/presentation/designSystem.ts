import * as fs from 'fs';
import { TYPOGRAPHY, TYPOGRAPHY_ASSETS } from '../../../shared/typography';
import type { PresentationTemplate, RenderOptions } from './contracts';

export const W = 1280;
export const H = 720;
export const SPINE = 80;          // eje izquierdo primario
export const RIGHT = 1200;        // borde derecho de contenido

// Tokens de color, tipografía y fuentes
// ============================================================
export const FONT = {
  serif: TYPOGRAPHY.title,
  body: TYPOGRAPHY.body,
  label: TYPOGRAPHY.body,
};

let svgFontDefsCache: string | null = null;

export function svgFontDefs(): string {
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

export interface Palette {
  burgundy: string; burgundyDeep: string; burgundyTint: string; burgundyWash: string;
  nearBlack: string; bodyGray: string; midGray: string; softGray: string;
  divider: string; hairlineSoft: string; paper: string; ghostLight: string; ghostDark: string; darkHairline: string; white: string;
}
export const BASE_PALETTE: Palette = {
  burgundy: '#AA1A2E', burgundyDeep: '#7E1422', burgundyTint: '#C8455A', burgundyWash: '#F4E7E9',
  nearBlack: '#1D1D1B', bodyGray: '#54565B', midGray: '#878A8E', softGray: '#BBBBBB',
  divider: '#D9D8D7', hairlineSoft: '#E3E2E1', paper: '#F2F1F0', ghostLight: '#ECEBEA', ghostDark: '#262523', darkHairline: '#3A3A38', white: '#FFFFFF',
};

export interface Theme extends Palette {
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

export function buildTheme(opts: RenderOptions, logo: { path: string; aspect: number } | null): Theme {
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
export function esc(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
export function rect(x: number, y: number, w: number, h: number, fill: string, opacity = 1): string {
  return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="${fill}"${opacity !== 1 ? ` fill-opacity="${opacity}"` : ''}/>`;
}
export function line(x1: number, y1: number, x2: number, y2: number, stroke: string, w = 1, opacity = 1): string {
  return `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${stroke}" stroke-width="${w}"${opacity !== 1 ? ` stroke-opacity="${opacity}"` : ''}/>`;
}
export function r1(n: number): string { return (Math.round(n * 10) / 10).toString(); }

export interface Txt {
  x: number; y: number; size: number; color: string; font: string;
  weight?: number; anchor?: 'start' | 'middle' | 'end'; tracking?: number; lines: string[]; lh?: number; opacity?: number;
}
export function text(t: Txt): string {
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
export function wrap(s: string, maxChars: number): string[] {
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
export function signatureStroke(t: Theme, x: number, y: number, w = 48, color?: string): string {
  return rect(x, y, w, 3, color ?? t.burgundy); // horizontal (ancho>=alto), respeta la regla de marca
}
export function kickerText(t: Theme, x: number, baseline: number, s: string, color: string, anchor: 'start' | 'end' = 'start'): string {
  return text({ x, y: baseline, size: 13, color, font: FONT.label, weight: 700, tracking: 2.4, anchor, lines: [(s || '').toUpperCase()] });
}
export function microLabel(t: Theme, x: number, baseline: number, s: string, color: string, anchor: 'start' | 'end' = 'start'): string {
  return text({ x, y: baseline, size: 11, color, font: FONT.label, weight: 600, tracking: 1.5, anchor, lines: [(s || '').toUpperCase()] });
}
export function fullStopSquare(t: Theme, x: number, baseline: number, cap: number, color?: string): string {
  const side = Math.max(8, Math.round(cap * 0.22));
  return rect(x, baseline - side, side, side, color ?? t.burgundy);
}
export function ghostNumeral(t: Theme, n: number, ground: 'white' | 'paper' | 'dark' | 'burgundy'): string {
  if (!t.showGhost) return '';
  const color = ground === 'dark' ? t.ghostDark : ground === 'burgundy' ? t.burgundyTint : t.ghostLight;
  const label = String(n).padStart(2, '0');
  return text({ x: 1240, y: 560, size: 320, color, font: FONT.serif, weight: 400, anchor: 'end', lines: [label] });
}
// Header Pattern A: trazo + kicker + título + hairline. Devuelve la Y de inicio de contenido.
export function headerA(parts: string[], t: Theme, kicker: string | undefined, title: string, ground: 'white' | 'paper', titleSize = 46, maxChars = 30): number {
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
export function footerChrome(parts: string[], t: Theme, index: number, total: number, dark = false): string {
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
