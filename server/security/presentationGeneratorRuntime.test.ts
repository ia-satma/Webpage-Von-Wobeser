import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import type { GeneratedPresentation } from '../../shared/schema';
import { embedPresentationFonts } from '../services/presentationFonts';
import {
  rasterizeSlide,
  resolveLocalAsset,
} from '../services/presentation/assets';
import type { SlideModel } from '../services/presentation/contracts';
import type { PresentationGeneratorDependencies } from '../services/presentation/dependencies';
import { buildTheme } from '../services/presentation/designSystem';
import { renderChartSvg } from '../services/presentation/dataVisuals';
import { PresentationOutputPipeline } from '../services/presentation/outputPipeline';
import { createPdfFromPngs } from '../services/presentation/pdfRenderer';
import { PresentationPptxRenderer } from '../services/presentation/pptxRenderer';
import { buildSvgDeck } from '../services/presentation/slideRenderers';
import {
  FIXTURE_IMAGE_URL,
  REPRESENTATIVE_PRESENTATION,
  presentationOptions,
} from './presentationGeneratorFixtures';

const CONTACT = [
  { label: 'Oficinas', value: 'Ciudad de México' },
  { label: 'Web', value: 'www.vonwobeser.com' },
];
const FIRM = 'Von Wobeser y Sierra, S.C.';
const DOCUMENT_KICKER = 'Presentación · 2026';
const CLOSING_FOOTER = `${FIRM} · www.vonwobeser.com`;

function sha256(value: string | Buffer): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function normalizeSvg(value: string): string {
  return value.replace(
    /data:font\/ttf;base64,[A-Za-z0-9+/=]+/g,
    'data:font/ttf;base64,<font>',
  );
}

async function assertPortablePng(
  png: Buffer,
  minimumBytes: number,
  minimumEntropy: number,
): Promise<void> {
  const image = sharp(png);
  const [metadata, stats] = await Promise.all([
    image.metadata(),
    image.stats(),
  ]);

  assert.equal(metadata.format, 'png');
  assert.equal(metadata.width, 1280);
  assert.equal(metadata.height, 720);
  assert.equal(metadata.space, 'srgb');
  assert.equal(metadata.depth, 'uchar');
  assert.equal(metadata.channels, 4);
  assert.equal(stats.isOpaque, true);
  assert.ok(png.length >= minimumBytes, 'el PNG debe contener una composición visible');
  assert.ok(stats.entropy >= minimumEntropy, 'el PNG no debe degradar a un lienzo vacío');
  assert.ok(stats.sharpness > 1, 'el PNG debe conservar bordes y texto renderizado');
  for (const channel of stats.channels.slice(0, 3)) {
    assert.ok(channel.min < 96, 'cada canal RGB debe conservar contenido oscuro');
    assert.equal(channel.max, 255);
  }
}

function generatedPresentation(overrides: Partial<GeneratedPresentation> = {}): GeneratedPresentation {
  return {
    id: 'presentation-test',
    title: 'Presentación controlada',
    topic: 'Prueba',
    template: 'vonwobeser',
    branding: 'vonwobeser',
    lang: 'es',
    slideCount: 2,
    pptxUrl: null,
    pdfUrl: null,
    pngUrls: [],
    sourceDocs: [],
    engine: 'test-native',
    status: 'active',
    archivedAt: null,
    createdAt: new Date('2026-08-13T06:00:00.000Z'),
    ...overrides,
  };
}

const PIPELINE_MODEL: SlideModel = {
  title: 'Presentación controlada',
  slides: [{ layout: 'bullets', title: 'Contenido', bullets: ['Punto de prueba'] }],
};

function createPipelineHarness() {
  const operations: string[] = [];
  const writtenFiles: string[] = [];
  const configuration: Record<string, string> = {
    footer_firm: FIRM,
    site_url: 'https://www.vonwobeser.com',
    footer_phone: '+52 55 5258 1000',
    footer_address: 'Ciudad de México',
  };

  const dependencies: PresentationGeneratorDependencies = {
    outputDirectory: '/tmp/presentation-output-test',
    existsSync: () => false,
    makeDirectory: () => operations.push('mkdir'),
    joinPath: (...segments) => path.posix.join(...segments),
    writeFile: (filePath) => {
      writtenFiles.push(filePath);
      operations.push(`write:${path.extname(filePath)}`);
    },
    removeFile: (filePath) => operations.push(`remove:${path.extname(filePath)}`),
    resolveLogo: async () => {
      operations.push('logo');
      return null;
    },
    makeTheme: (options) => buildTheme(options, null),
    loadConfiguration: async () => {
      operations.push('config');
      return {};
    },
    configurationValue: (_config, key) => configuration[key] || '',
    buildSlides: () => {
      operations.push('slides');
      return [{ build: { svg: '<svg/>', image: null }, ground: 'white' }];
    },
    rasterize: async () => {
      operations.push('raster');
      return Buffer.from('png');
    },
    createPdf: async () => {
      operations.push('pdf');
      return Buffer.from('pdf');
    },
    buildPptx: async () => {
      operations.push('pptx');
      return {
        async writeFile() {
          operations.push('pptx-write');
        },
      } as never;
    },
    embedFonts: async () => {
      operations.push('embed');
    },
    persistFiles: async (files) => {
      operations.push(`persist:${files.length}`);
      return { persisted: true, objectNames: files.map((_, index) => `object-${index + 1}`) };
    },
    deletePersistentObjects: async (names) => {
      operations.push(`delete-persisted:${names.length}`);
    },
    createHistory: async (input) => {
      operations.push('history');
      return generatedPresentation({
        title: input.title,
        pptxUrl: input.pptxUrl ?? null,
        pdfUrl: input.pdfUrl ?? null,
        pngUrls: input.pngUrls || [],
        slideCount: input.slideCount ?? 0,
      });
    },
    isPersistentStorageUnavailable: () => false,
    randomUUID: () => '11111111-1111-4111-8111-111111111111',
    log: () => {},
    logError: () => operations.push('log-error'),
  };

  return {
    operations,
    writtenFiles,
    dependencies,
    pipeline: new PresentationOutputPipeline(dependencies),
  };
}

test('los tres temas conservan los hashes SVG normalizados y el ritmo de fondos', () => {
  const expectedHashes = {
    vonwobeser: 'e66372c01d56dde2c97e6cf318bae6502ae89e1ae15402a3042d116bc00403a1',
    minimal: '12825593f7f83cb389a20403cb455646a6675c3826e8ea4a087e94848459c591',
    dark: 'e66372c01d56dde2c97e6cf318bae6502ae89e1ae15402a3042d116bc00403a1',
  } as const;
  const expectedGrounds = {
    vonwobeser: ['white', 'dark', 'white', 'paper', 'white', 'white', 'white', 'paper', 'white', 'dark'],
    minimal: ['white', 'dark', 'white', 'white', 'white', 'white', 'white', 'paper', 'white', 'dark'],
    dark: ['white', 'dark', 'white', 'paper', 'white', 'white', 'white', 'paper', 'white', 'dark'],
  } as const;

  for (const template of ['vonwobeser', 'minimal', 'dark'] as const) {
    const theme = buildTheme(presentationOptions(template), null);
    const deck = buildSvgDeck(
      REPRESENTATIVE_PRESENTATION,
      theme,
      FIRM,
      DOCUMENT_KICKER,
      CLOSING_FOOTER,
      CONTACT,
    );
    assert.equal(deck.length, 10);
    assert.deepEqual(
      deck.map(({ ground }) => ground),
      expectedGrounds[template],
    );
    assert.equal(
      sha256(deck.map(({ build }) => normalizeSvg(build.svg)).join('\n')),
      expectedHashes[template],
    );
  }
});

test('PNG conserva 1280×720 y contenido visible para portada, gráfica e imagen', async () => {
  const theme = buildTheme(presentationOptions('vonwobeser'), null);
  const deck = buildSvgDeck(
    REPRESENTATIVE_PRESENTATION,
    theme,
    FIRM,
    DOCUMENT_KICKER,
    CLOSING_FOOTER,
    CONTACT,
  );
  const expected = new Map<number, { minimumBytes: number; minimumEntropy: number }>([
    [0, { minimumBytes: 20_000, minimumEntropy: 0.2 }],
    [4, { minimumBytes: 25_000, minimumEntropy: 0.3 }],
    [6, { minimumBytes: 100_000, minimumEntropy: 1.5 }],
  ]);

  for (const [index, requirements] of expected) {
    const png = await rasterizeSlide(deck[index].build, () => {});
    await assertPortablePng(
      png,
      requirements.minimumBytes,
      requirements.minimumEntropy,
    );
  }
});

test('gráficas negativas, de línea y pastel mantienen su semántica SVG', () => {
  const theme = buildTheme(presentationOptions('vonwobeser'), null);
  const box = { x: 80, y: 220, w: 900, h: 360 };
  const negativeBars = renderChartSvg(
    {
      type: 'bar',
      categories: ['A', 'B'],
      series: [{ name: 'Serie', values: [-12, 20] }],
      unit: '%',
    },
    box,
    theme,
  );
  const line = renderChartSvg(
    { type: 'line', categories: ['A', 'B'], series: [{ name: 'Serie', values: [4, 8] }] },
    box,
    theme,
  );
  const pie = renderChartSvg(
    { type: 'pie', categories: ['A', 'B'], series: [{ name: 'Serie', values: [25, 75] }] },
    box,
    theme,
  );

  assert.match(negativeBars, />-12%<\/tspan>/);
  assert.match(negativeBars, />20%<\/tspan>/);
  assert.match(line, /<polyline/);
  assert.equal((line.match(/<circle/g) || []).length, 2);
  assert.match(pie, /A — 25%/);
  assert.match(pie, /B — 75%/);
});

test('assets y color personalizado rechazan rutas y valores no permitidos', () => {
  const valid = resolveLocalAsset(FIXTURE_IMAGE_URL);
  assert.ok(valid?.endsWith(path.join('public', 'generated-images', path.basename(FIXTURE_IMAGE_URL))));
  assert.equal(resolveLocalAsset('/etc/passwd'), null);
  assert.equal(resolveLocalAsset('file:///etc/passwd'), null);
  assert.equal(resolveLocalAsset('/uploads/../package.json'), null);
  assert.equal(resolveLocalAsset('/generated-images/%2e%2e/package.json'), null);

  const invalidColor = buildTheme(
    { ...presentationOptions('vonwobeser'), branding: 'custom', customPrimaryColor: 'url(javascript:1)' },
    null,
  );
  const validColor = buildTheme(
    { ...presentationOptions('vonwobeser'), branding: 'custom', customPrimaryColor: '#123' },
    null,
  );
  assert.equal(invalidColor.burgundy, '#AA1A2E');
  assert.equal(validColor.burgundy, '#112233');
});

test('una imagen inexistente degrada de forma segura a viñetas', () => {
  const model: SlideModel = {
    ...REPRESENTATIVE_PRESENTATION,
    slides: REPRESENTATIVE_PRESENTATION.slides.map((slide) =>
      slide.layout === 'image'
        ? { ...slide, image: { ...slide.image, url: '/uploads/inexistente.png' } }
        : slide,
    ),
  };
  const deck = buildSvgDeck(
    model,
    buildTheme(presentationOptions('vonwobeser'), null),
    FIRM,
    DOCUMENT_KICKER,
    CLOSING_FOOTER,
    CONTACT,
  );
  assert.equal(deck[6].build.image, null);
  assert.match(deck[6].build.svg, /Coordinación multidisciplinaria/);
});

test('PDF se construye desde PNG visibles con páginas 1280×720', async () => {
  const theme = buildTheme(presentationOptions('vonwobeser'), null);
  const deck = buildSvgDeck(
    REPRESENTATIVE_PRESENTATION,
    theme,
    FIRM,
    DOCUMENT_KICKER,
    CLOSING_FOOTER,
    CONTACT,
  );
  const pngs = await Promise.all(
    [0, 4, 6].map((index) => rasterizeSlide(deck[index].build, () => {})),
  );
  const bytes = await createPdfFromPngs(pngs);
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 3);
  assert.deepEqual(
    pdf.getPages().map((page) => page.getSize()),
    Array.from({ length: 3 }, () => ({ width: 1280, height: 720 })),
  );
  await Promise.all([
    assertPortablePng(pngs[0], 20_000, 0.2),
    assertPortablePng(pngs[1], 25_000, 0.3),
    assertPortablePng(pngs[2], 100_000, 1.5),
  ]);
  assert.ok(bytes.length > 100_000, 'el PDF debe contener las tres imágenes renderizadas');
});

test('PPTX conserva diapositivas, notas, chart nativo, imágenes y fuentes incrustadas', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'vw-presentation-runtime-'));
  const filePath = path.join(directory, 'fixture.pptx');
  try {
    const theme = buildTheme(presentationOptions('vonwobeser'), null);
    const pptx = await new PresentationPptxRenderer().buildPptx(
      REPRESENTATIVE_PRESENTATION,
      theme,
      FIRM,
      DOCUMENT_KICKER,
      CONTACT,
      CLOSING_FOOTER,
      10,
    );
    await pptx.writeFile({ fileName: filePath });
    await embedPresentationFonts(filePath);

    const zip = await JSZip.loadAsync(readFileSync(filePath));
    const names = Object.keys(zip.files);
    const slideNames = names.filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name));
    const noteNames = names.filter((name) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(name));
    const chartNames = names.filter((name) => /^ppt\/charts\/chart\d+\.xml$/.test(name));
    const mediaNames = names.filter((name) => /^ppt\/media\//.test(name) && !name.endsWith('/'));
    const fontNames = names.filter((name) => /^ppt\/fonts\/.+\.fntdata$/.test(name));

    assert.equal(slideNames.length, 10);
    assert.equal(noteNames.length, 10);
    assert.equal(chartNames.length, 1);
    assert.ok(mediaNames.length >= 2);
    assert.equal(fontNames.length, 8);

    const slides = (await Promise.all(slideNames.map((name) => zip.file(name)!.async('string')))).join('\n');
    const notes = (await Promise.all(noteNames.map((name) => zip.file(name)!.async('string')))).join('\n');
    const presentation = await zip.file('ppt/presentation.xml')!.async('string');
    assert.match(slides, /typeface="Gelasio"/);
    assert.match(slides, /typeface="Inter"/);
    assert.match(notes, /Nota de sección para el expositor/);
    assert.match(presentation, /typeface="Gelasio"/);
    assert.match(presentation, /typeface="Inter"/);

    for (const expectedText of [
      'Panorama jurídico 2026',
      'Un entorno que exige decisiones claras',
      '45%',
      'Proceso recomendado',
      'La anticipación convierte la complejidad en una ventaja.',
      'Acciones coordinadas',
      'Gracias',
    ]) {
      assert.match(slides, new RegExp(expectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    assert.ok((slides.match(/<a:off\b/g) || []).length >= 30);
    assert.ok((slides.match(/<a:ext\b/g) || []).length >= 30);

    const charts = (await Promise.all(
      chartNames.map((name) => zip.file(name)!.async('string')),
    )).join('\n');
    assert.match(charts, /Escenario base/);
    assert.match(charts, /Fiscal/);
    assert.match(charts, /Competencia/);
    assert.match(charts, /-12/);
    assert.match(charts, /51/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('la canalización guarda local, persiste y solo entonces crea historial', async () => {
  const harness = createPipelineHarness();
  const result = await harness.pipeline.renderAndSave(
    PIPELINE_MODEL,
    presentationOptions('vonwobeser'),
  );

  assert.equal(result.success, true);
  assert.deepEqual(harness.operations, [
    'mkdir',
    'logo',
    'config',
    'slides',
    'mkdir',
    'raster',
    'write:.png',
    'pdf',
    'write:.pdf',
    'pptx',
    'pptx-write',
    'embed',
    'persist:3',
    'history',
    'remove:.png',
    'remove:.pdf',
    'remove:.pptx',
  ]);
  assert.equal(harness.writtenFiles.length, 2);
  assert.equal(result.presentation?.pptxUrl, 'private:generated-presentations/11111111-1111-4111-8111-111111111111/presentation.pptx');
  assert.equal(result.presentation?.pdfUrl, 'private:generated-presentations/11111111-1111-4111-8111-111111111111/presentation.pdf');
  assert.equal(result.presentation?.pngUrls.length, 1);
});

test('la canalización respeta formatos selectivos y no rasteriza un PPTX aislado', async () => {
  const harness = createPipelineHarness();
  const result = await harness.pipeline.renderAndSave(
    PIPELINE_MODEL,
    { ...presentationOptions('vonwobeser'), formats: ['pptx'] },
  );

  assert.equal(result.success, true);
  assert.doesNotMatch(harness.operations.join(','), /raster|pdf|write:\.png|write:\.pdf/);
  assert.match(harness.operations.join(','), /persist:1,history,remove:\.pptx$/);
  assert.deepEqual(result.presentation?.pngUrls, []);
  assert.equal(result.presentation?.pdfUrl, null);
});

test('un fallo posterior a App Storage revierte objetos y todos los archivos locales', async () => {
  const harness = createPipelineHarness();
  harness.dependencies.createHistory = async () => {
    harness.operations.push('history');
    throw new Error('history failed');
  };

  const result = await harness.pipeline.renderAndSave(
    PIPELINE_MODEL,
    presentationOptions('vonwobeser'),
  );
  assert.deepEqual(result, { success: false, error: 'history failed' });
  const persistence = harness.operations.indexOf('persist:3');
  const history = harness.operations.indexOf('history');
  const rollback = harness.operations.indexOf('delete-persisted:3');
  assert.ok(persistence < history && history < rollback);
  assert.deepEqual(
    harness.operations.filter((operation) => operation.startsWith('remove:')),
    ['remove:.png', 'remove:.pdf', 'remove:.pptx'],
  );
});

test('un fallo al limpiar temporales no revierte una presentación ya persistida', async () => {
  const harness = createPipelineHarness();
  let firstRemoval = true;
  harness.dependencies.removeFile = (filePath) => {
    harness.operations.push(`remove:${path.extname(filePath)}`);
    if (firstRemoval) {
      firstRemoval = false;
      throw new Error('temporary cleanup failed');
    }
  };

  const result = await harness.pipeline.renderAndSave(
    PIPELINE_MODEL,
    presentationOptions('vonwobeser'),
  );
  assert.equal(result.success, true);
  assert.equal(harness.operations.includes('delete-persisted:3'), false);
  assert.equal(harness.operations.includes('history'), true);
  assert.equal(harness.operations.filter((operation) => operation.startsWith('remove:')).length, 3);
});

test('la indisponibilidad de App Storage conserva el mensaje específico y limpia local', async () => {
  const harness = createPipelineHarness();
  const unavailable = new Error('persistent unavailable');
  harness.dependencies.persistFiles = async () => {
    harness.operations.push('persist-failed');
    throw unavailable;
  };
  harness.dependencies.isPersistentStorageUnavailable = (error) => error === unavailable;

  const result = await harness.pipeline.renderAndSave(
    PIPELINE_MODEL,
    presentationOptions('vonwobeser'),
  );
  assert.deepEqual(result, {
    success: false,
    error: 'App Storage no está disponible. La presentación no se guardó para evitar que se pierda al publicar.',
  });
  assert.equal(harness.operations.includes('history'), false);
  assert.deepEqual(
    harness.operations.filter((operation) => operation.startsWith('remove:')),
    ['remove:.png', 'remove:.pdf', 'remove:.pptx'],
  );
});

test('un modelo vacío se rechaza antes de tocar archivos o dependencias', async () => {
  const harness = createPipelineHarness();
  const result = await harness.pipeline.renderAndSave(
    { title: '', slides: [] },
    presentationOptions('vonwobeser'),
  );
  assert.deepEqual(result, {
    success: false,
    error: 'El modelo de diapositivas está vacío o es inválido.',
  });
  assert.deepEqual(harness.operations, []);
});
