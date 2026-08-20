import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'node:crypto';
import type PptxGenJS from 'pptxgenjs';
import type { GeneratedPresentation, InsertGeneratedPresentation } from '../../../shared/schema';
import { storage } from '../../storage';
import { cfg, getConfigMap, type ConfigMap } from '../../mirror/siteConfig';
import {
  deletePrivatePresentationObjects,
  persistPrivatePresentationFiles,
  PrivatePresentationStorageUnavailableError,
  type PrivatePresentationFile,
} from '../../media/privatePresentations';
import { embedPresentationFonts } from '../presentationFonts';
import { rasterizeSlide, resolveLogoInfo } from './assets';
import type { RenderOptions, SlideModel } from './contracts';
import { buildTheme, type Theme } from './designSystem';
import { createPdfFromPngs } from './pdfRenderer';
import { PresentationPptxRenderer } from './pptxRenderer';
import { buildSvgDeck, type RenderedSlide, type SlideBuild } from './slideRenderers';

export interface PresentationGeneratorDependencies {
  outputDirectory: string;
  existsSync(filePath: string): boolean;
  makeDirectory(filePath: string): void;
  joinPath(...segments: string[]): string;
  writeFile(filePath: string, contents: Buffer | Uint8Array): void;
  removeFile(filePath: string): void;
  resolveLogo(options: RenderOptions): Promise<{ path: string; aspect: number } | null>;
  makeTheme(options: RenderOptions, logo: { path: string; aspect: number } | null): Theme;
  loadConfiguration(): Promise<ConfigMap>;
  configurationValue(config: ConfigMap, key: string, lang: 'en' | 'es'): string;
  buildSlides(
    model: SlideModel,
    theme: Theme,
    footer: string,
    documentKicker: string,
    closingFooter: string,
    contact: { label: string; value: string }[],
  ): RenderedSlide[];
  rasterize(build: SlideBuild): Promise<Buffer>;
  createPdf(pngBuffers: Buffer[]): Promise<Uint8Array>;
  buildPptx(
    model: SlideModel,
    theme: Theme,
    footer: string,
    documentKicker: string,
    contact: { label: string; value: string }[],
    closingFooter: string,
    total: number,
  ): Promise<PptxGenJS>;
  embedFonts(filePath: string): Promise<void>;
  persistFiles(files: PrivatePresentationFile[]): Promise<{ persisted: boolean; objectNames: string[] }>;
  deletePersistentObjects(objectNames: string[]): Promise<void>;
  createHistory(input: InsertGeneratedPresentation & { id?: string }): Promise<GeneratedPresentation>;
  isPersistentStorageUnavailable(error: unknown): boolean;
  randomUUID(): string;
  log(message: string): void;
  logError(error: unknown): void;
}

export function createDefaultPresentationDependencies(): PresentationGeneratorDependencies {
  const pptxRenderer = new PresentationPptxRenderer();
  const log = (message: string) => console.log(`[PresentationGenerator] ${message}`);

  return {
    outputDirectory: path.join(process.cwd(), 'private', 'generated-presentations'),
    existsSync: fs.existsSync,
    makeDirectory: (filePath) => fs.mkdirSync(filePath, { recursive: true }),
    joinPath: path.join,
    writeFile: fs.writeFileSync,
    removeFile: fs.unlinkSync,
    resolveLogo: resolveLogoInfo,
    makeTheme: buildTheme,
    loadConfiguration: getConfigMap,
    configurationValue: cfg,
    buildSlides: buildSvgDeck,
    rasterize: (build) => rasterizeSlide(build, log),
    createPdf: createPdfFromPngs,
    buildPptx: (...args) => pptxRenderer.buildPptx(...args),
    embedFonts: embedPresentationFonts,
    persistFiles: persistPrivatePresentationFiles,
    deletePersistentObjects: deletePrivatePresentationObjects,
    createHistory: (input) => storage.createGeneratedPresentation(input),
    isPersistentStorageUnavailable: (error) => error instanceof PrivatePresentationStorageUnavailableError,
    randomUUID,
    log,
    logError: (error) => console.error('[PresentationGenerator] Error:', error),
  };
}
