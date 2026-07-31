import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import JSZip from 'jszip';
import { TYPOGRAPHY, TYPOGRAPHY_ASSETS } from '../../shared/typography';

type EmbeddedFontStyle = 'regular' | 'bold' | 'italic' | 'boldItalic';

const PRESENTATION_FONTS: Array<{
  family: string;
  pitchFamily: string;
  styles: Record<EmbeddedFontStyle, string>;
}> = [
  {
    family: TYPOGRAPHY.title,
    pitchFamily: '18',
    styles: {
      regular: TYPOGRAPHY_ASSETS.gelasioRegular,
      bold: TYPOGRAPHY_ASSETS.gelasioBold,
      italic: TYPOGRAPHY_ASSETS.gelasioItalic,
      boldItalic: TYPOGRAPHY_ASSETS.gelasioBoldItalic,
    },
  },
  {
    family: TYPOGRAPHY.body,
    pitchFamily: '34',
    styles: {
      regular: TYPOGRAPHY_ASSETS.atkinsonRegular,
      bold: TYPOGRAPHY_ASSETS.atkinsonBold,
      italic: TYPOGRAPHY_ASSETS.atkinsonItalic,
      boldItalic: TYPOGRAPHY_ASSETS.atkinsonBoldItalic,
    },
  },
];

function xmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Incorpora las dos familias OFL dentro del paquete OOXML. PowerPoint usa
 * relaciones de tipo `font` y partes `application/x-fontdata`; el texto sigue
 * siendo editable y no depende de fuentes instaladas en el equipo receptor.
 */
export async function embedPresentationFonts(pptxPath: string): Promise<void> {
  for (const font of PRESENTATION_FONTS) {
    for (const filePath of Object.values(font.styles)) {
      if (!fs.existsSync(filePath)) {
        throw new Error(`No se encontró el recurso tipográfico requerido: ${path.basename(filePath)}`);
      }
    }
  }

  const zip = await JSZip.loadAsync(fs.readFileSync(pptxPath));
  const presentationPart = zip.file('ppt/presentation.xml');
  const relationshipsPart = zip.file('ppt/_rels/presentation.xml.rels');
  const contentTypesPart = zip.file('[Content_Types].xml');
  if (!presentationPart || !relationshipsPart || !contentTypesPart) {
    throw new Error('El PPTX generado no contiene las partes OOXML requeridas para incrustar fuentes.');
  }

  let presentationXml = await presentationPart.async('string');
  let relationshipsXml = await relationshipsPart.async('string');
  let contentTypesXml = await contentTypesPart.async('string');
  if (presentationXml.includes('<p:embeddedFontLst>')) return;

  const relationshipNumbers = Array.from(relationshipsXml.matchAll(/\bId="rId(\d+)"/g))
    .map((match) => Number(match[1]))
    .filter(Number.isFinite);
  let nextRelationship = Math.max(0, ...relationshipNumbers) + 1;
  const relationships: string[] = [];
  const embeddedFonts: string[] = [];

  for (const font of PRESENTATION_FONTS) {
    const styleReferences: Partial<Record<EmbeddedFontStyle, string>> = {};
    for (const [style, filePath] of Object.entries(font.styles) as Array<[EmbeddedFontStyle, string]>) {
      const relationshipId = `rId${nextRelationship++}`;
      const filename = `font-${randomUUID()}.fntdata`;
      zip.file(`ppt/fonts/${filename}`, fs.readFileSync(filePath), { binary: true });
      relationships.push(
        `<Relationship Id="${relationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/font" Target="fonts/${filename}"/>`,
      );
      styleReferences[style] = relationshipId;
    }
    embeddedFonts.push(
      `<p:embeddedFont><p:font typeface="${xmlAttr(font.family)}" pitchFamily="${font.pitchFamily}" charset="0"/>` +
      `<p:regular r:id="${styleReferences.regular}"/><p:bold r:id="${styleReferences.bold}"/>` +
      `<p:italic r:id="${styleReferences.italic}"/><p:boldItalic r:id="${styleReferences.boldItalic}"/>` +
      `</p:embeddedFont>`,
    );
  }

  const embeddedFontList = `<p:embeddedFontLst>${embeddedFonts.join('')}</p:embeddedFontLst>`;
  if (presentationXml.includes('<p:defaultTextStyle')) {
    presentationXml = presentationXml.replace('<p:defaultTextStyle', `${embeddedFontList}<p:defaultTextStyle`);
  } else {
    presentationXml = presentationXml.replace('</p:presentation>', `${embeddedFontList}</p:presentation>`);
  }
  relationshipsXml = relationshipsXml.replace('</Relationships>', `${relationships.join('')}</Relationships>`);
  if (!/Extension="fntdata"/i.test(contentTypesXml)) {
    contentTypesXml = contentTypesXml.replace(
      '</Types>',
      '<Default Extension="fntdata" ContentType="application/x-fontdata"/></Types>',
    );
  }

  zip.file('ppt/presentation.xml', presentationXml);
  zip.file('ppt/_rels/presentation.xml.rels', relationshipsXml);
  zip.file('[Content_Types].xml', contentTypesXml);
  fs.writeFileSync(
    pptxPath,
    await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } }),
  );
}
