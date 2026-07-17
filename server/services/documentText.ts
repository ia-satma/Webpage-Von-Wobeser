import * as fs from 'fs';
import * as path from 'path';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import JSZip from 'jszip';

// Extracción de texto de documentos subidos como insumo del generador de presentaciones.
// Todo JS puro (sin LibreOffice/Chromium): pdf-parse (.pdf), mammoth (.docx), jszip (.pptx),
// lectura directa (.tex/.txt/.md). Los binarios legados .doc/.ppt NO se parsean sin
// LibreOffice, así que se aceptan pero se devuelve ok:false con un aviso claro para que la UI
// pida convertirlos a .docx/.pptx — el resto de la generación continúa con los demás insumos.

export interface ExtractedDoc {
  name: string;   // nombre original del archivo (para mostrar en el reporte)
  ext: string;    // extensión en minúsculas, con punto (.pdf, .docx, ...)
  text: string;   // texto extraído ('' si no se pudo)
  ok: boolean;    // true si se extrajo texto útil
  note?: string;  // aviso (ej. formato legado no soportado)
}

// Tope por documento para no reventar el contexto del LLM con un PDF enorme; el servicio
// aplica además un tope global sobre la suma de todos los documentos.
const MAX_CHARS_PER_DOC = 40000;

const LEGACY_BINARY = new Set(['.doc', '.ppt']);

function clamp(text: string): string {
  const clean = (text || '').replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trim();
  return clean.length > MAX_CHARS_PER_DOC ? clean.slice(0, MAX_CHARS_PER_DOC) : clean;
}

async function extractPdf(filePath: string): Promise<string> {
  const parser = new PDFParse({ url: 'file://' + path.resolve(filePath) });
  const result = await parser.getText();
  return result?.text || '';
}

async function extractDocx(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  return result?.value || '';
}

// Un .pptx es un ZIP; el texto de cada diapositiva vive en ppt/slides/slideN.xml dentro de
// nodos <a:t>...</a:t>. No hace falta un parser XML completo: se extraen los <a:t> por regex.
async function extractPptx(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buffer);
  const slideNames = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || '0', 10);
      const nb = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || '0', 10);
      return na - nb;
    });

  const parts: string[] = [];
  for (const name of slideNames) {
    const xml = await zip.files[name].async('string');
    const texts = Array.from(xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)).map((m) => decodeXmlEntities(m[1]));
    const slideText = texts.join(' ').replace(/\s+/g, ' ').trim();
    if (slideText) parts.push(slideText);
  }
  return parts.join('\n\n');
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

// Limpieza ligera de LaTeX: quita comentarios, comandos y llaves para dejar el texto legible.
function stripLatex(raw: string): string {
  return raw
    .replace(/(^|[^\\])%.*$/gm, '$1')             // comentarios (% no escapado)
    .replace(/\\(begin|end)\{[^}]*\}/g, ' ')      // \begin{...}/\end{...}
    .replace(/\\[a-zA-Z]+\*?(\[[^\]]*\])?(\{[^}]*\})?/g, ' ') // \comando[opt]{arg}
    .replace(/[{}]/g, ' ')
    .replace(/\$[^$]*\$/g, ' ')                    // matemáticas inline
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function extractText(filePath: string, originalName?: string): Promise<ExtractedDoc> {
  const name = originalName || path.basename(filePath);
  const ext = path.extname(name || filePath).toLowerCase();

  const base: ExtractedDoc = { name, ext, text: '', ok: false };

  if (LEGACY_BINARY.has(ext)) {
    return {
      ...base,
      note: `El formato ${ext} (Office antiguo binario) no se puede leer aquí. Vuelve a guardarlo como ${ext === '.doc' ? '.docx' : '.pptx'} y súbelo de nuevo.`,
    };
  }

  try {
    let text = '';
    switch (ext) {
      case '.pdf':
        text = await extractPdf(filePath);
        break;
      case '.docx':
        text = await extractDocx(filePath);
        break;
      case '.pptx':
        text = await extractPptx(filePath);
        break;
      case '.tex':
        text = stripLatex(fs.readFileSync(filePath, 'utf8'));
        break;
      case '.txt':
      case '.md':
        text = fs.readFileSync(filePath, 'utf8');
        break;
      default:
        return { ...base, note: `Tipo de archivo no soportado: ${ext || '(sin extensión)'}.` };
    }

    const clamped = clamp(text);
    if (!clamped) {
      return { ...base, note: 'No se pudo extraer texto del documento (¿está vacío o es solo imágenes?).' };
    }
    return { name, ext, text: clamped, ok: true };
  } catch (err: any) {
    console.error(`[documentText] Falló la extracción de ${name}:`, err?.message);
    return { ...base, note: `Error al leer el documento: ${err?.message || 'desconocido'}.` };
  }
}

/**
 * Extrae y combina el texto de varios documentos. Devuelve el texto combinado (con separadores
 * por documento), la lista de nombres usados con éxito, y las notas de los que fallaron.
 */
export async function extractManyTexts(
  files: { path: string; originalName?: string }[],
  maxTotalChars = 60000,
): Promise<{ combinedText: string; usedDocs: string[]; notes: string[] }> {
  const usedDocs: string[] = [];
  const notes: string[] = [];
  const chunks: string[] = [];
  let total = 0;

  for (const f of files) {
    const doc = await extractText(f.path, f.originalName);
    if (doc.ok && doc.text) {
      const remaining = maxTotalChars - total;
      if (remaining <= 0) {
        notes.push(`"${doc.name}" se omitió: se alcanzó el límite de texto combinado.`);
        continue;
      }
      const slice = doc.text.slice(0, remaining);
      chunks.push(`### Documento: ${doc.name}\n${slice}`);
      total += slice.length;
      usedDocs.push(doc.name);
    } else if (doc.note) {
      notes.push(`"${doc.name}": ${doc.note}`);
    }
  }

  return { combinedText: chunks.join('\n\n'), usedDocs, notes };
}
