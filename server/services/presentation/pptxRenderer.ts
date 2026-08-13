import sharp from 'sharp';
import PptxGenJS from 'pptxgenjs';
import { TYPOGRAPHY } from '../../../shared/typography';
import type { SlideChart, SlideDiagram, SlideModel } from './contracts';
import { resolveLocalAsset } from './assets';
import { chartPalette, renderDiagramSvg } from './dataVisuals';
import { svgFontDefs, type Theme } from './designSystem';

// pptxgenjs es dual CJS/ESM; bajo esbuild/tsx el default puede venir como { default: class }.
const PptxGenCtor = ((PptxGenJS as any)?.default ?? PptxGenJS) as typeof PptxGenJS;
const FONT_PPTX = { serif: TYPOGRAPHY.title, body: TYPOGRAPHY.body, label: TYPOGRAPHY.body };

export class PresentationPptxRenderer {
  private hx(c: string): string { return c.replace('#', ''); }

  private async diagramPng(d: SlideDiagram, t: Theme): Promise<Buffer> {
    const wPx = 1180, hPx = 470;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${wPx}" height="${hPx}">${svgFontDefs()}<rect width="${wPx}" height="${hPx}" fill="${t.white}"/>${renderDiagramSvg(d, { x: 24, y: 24, w: wPx - 48, h: hPx - 48 }, t)}</svg>`;
    return sharp(Buffer.from(svg)).png().toBuffer();
  }

  async buildPptx(model: SlideModel, t: Theme, footer: string, docKicker: string, contact: { label: string; value: string }[], closingFooter: string, total: number): Promise<PptxGenJS> {
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
