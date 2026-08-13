import { PDFDocument } from 'pdf-lib';
import { H, W } from './designSystem';

export async function createPdfFromPngs(pngBuffers: Buffer[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  for (const png of pngBuffers) {
    const image = await pdf.embedPng(png);
    const page = pdf.addPage([W, H]);
    page.drawImage(image, { x: 0, y: 0, width: W, height: H });
  }
  return pdf.save();
}
