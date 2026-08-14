import type { SlideChart, SlideDiagram } from './contracts';
import { FONT, type Theme, line, microLabel, r1, rect, text, wrap } from './designSystem';

export function chartPalette(t: Theme): string[] {
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
export interface Box { x: number; y: number; w: number; h: number }

export function renderChartSvg(chart: SlideChart, box: Box, t: Theme): string {
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

export function renderDiagramSvg(d: SlideDiagram, box: Box, t: Theme): string {
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
