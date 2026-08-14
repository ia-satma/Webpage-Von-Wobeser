import { readMirrorSources } from "./mirrorTestSources";
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import { embedPresentationFonts } from '../services/presentationFonts';
import { readPresentationGeneratorSources } from './presentationGeneratorTestSources';
import {
  legacyHtmlLanguage,
  legacyPaginationDestination,
  normalizeLegacyHtmlLanguage,
  normalizeLegacyTypography,
} from '../mirror/legacyHtml';

const read = (relative: string) => readFileSync(new URL(relative, import.meta.url), 'utf8');

test('sitio y panel usan solamente Gelasio e Inter como familias activas', () => {
  const typography = read('../../frontend-mirror/templates/beez3/css/typography.css');
  const publicCss = [
    read('../../frontend-mirror/templates/beez3/css/style.css'),
    read('../../frontend-mirror/templates/beez3/css/von.css'),
    read('../../frontend-mirror/css/estilos_home.css'),
  ].join('\n');
  const adminCss = read('../../client/src/index.css');
  const adminHtml = read('../../client/index.html');
  const server = readMirrorSources();

  assert.match(typography, /--font-title:\s*"Gelasio", serif/);
  assert.match(typography, /--font-body:\s*"Inter", sans-serif/);
  assert.match(typography, /Gelasio-Variable\.woff2/);
  assert.match(typography, /Inter-Variable\.woff2/);
  assert.match(publicCss, /font-family:\s*"Gelasio"/);
  assert.match(publicCss, /font-family:\s*"Inter"/);
  assert.match(adminCss, /--font-title:\s*"Gelasio", serif/);
  assert.match(adminCss, /--font-body:\s*"Inter", sans-serif/);
  assert.match(adminCss, /url\("\/templates\/beez3\/webfont\/Gelasio-Variable\.woff2"\)/);
  assert.match(adminCss, /url\("\/templates\/beez3\/webfont\/Inter-Variable\.woff2"\)/);
  assert.match(adminCss, /--font-heading:\s*var\(--font-title\)/);
  assert.match(adminCss, /--font-sans:\s*var\(--font-body\)/);
  assert.match(adminHtml, /typography\.css\?v=20260813-admin-font-cache/);
  assert.match(server, /Inter-Variable\.woff2/);
  assert.match(server, /Gelasio-Variable\.woff2/);
  assert.match(server, /normalizeLegacyTypography/);
  assert.match(server, /originalLanguageLink/);

  const activeSources = `${publicCss}\n${adminCss}\n${adminHtml}\n${server}`;
  assert.doesNotMatch(activeSources, /fonts\.(?:googleapis|gstatic)\.com/);
  assert.doesNotMatch(activeSources, /(?:Publico|Geomanist|Optima)[-A-Za-z0-9]*\.(?:woff2?|otf|ttf)/);
  assert.doesNotMatch(typography, /Atkinson/);
  assert.equal(
    existsSync(new URL('../../frontend-mirror/templates/beez3/webfont/AtkinsonHyperlegible-Regular.woff2', import.meta.url)),
    false,
  );
  assert.equal(
    existsSync(new URL('../../assets/fonts/Atkinson-Hyperlegible/AtkinsonHyperlegible-Regular.ttf', import.meta.url)),
    false,
  );
});

test('el panel aísla su interfaz en Inter sin desactivar la tipografía editorial', () => {
  const adminCss = read('../../client/src/index.css');
  const adminLayout = read('../../client/src/components/admin/AdminLayout.tsx');
  const adminLogin = read('../../client/src/pages/admin/AdminLogin.tsx');
  const typography = read('../../frontend-mirror/templates/beez3/css/typography.css');

  assert.match(adminLayout, /<SidebarProvider className="admin-shell">/);
  assert.match(adminLogin, /<div className="admin-shell min-h-screen/);
  assert.match(adminCss, /@font-face\s*\{[\s\S]*?font-family:\s*"Inter"[\s\S]*?Inter-Variable\.woff2/);
  assert.match(adminCss, /:root\s*\{[\s\S]*?--font-body:\s*"Inter", sans-serif/);
  assert.match(adminCss, /\.admin-shell\s*\{[\s\S]*?--font-heading:\s*var\(--font-body\)/);
  assert.match(adminCss, /\.admin-shell\s*\{[\s\S]*?--font-serif:\s*var\(--font-body\)/);
  assert.match(adminCss, /\.admin-shell\s+:where\(h1, h2, h3, h4, h5, h6\)\s*\{[\s\S]*?font-family:\s*var\(--font-body\)\s*!important/);
  assert.match(typography, /\[data-vw-font="gelasio"\][\s\S]*?font-family:\s*var\(--vw-font-editorial\)\s*!important/);
  assert.match(typography, /\[data-vw-font="inter"\][\s\S]*?font-family:\s*var\(--vw-font-body\)\s*!important/);
});

test('Inter no supera Medium (500) y Nuevas oficinas conserva la jerarquía aprobada', () => {
  const typography = read('../../frontend-mirror/templates/beez3/css/typography.css');
  const tailwind = read('../../tailwind.config.ts');
  const generator = readPresentationGeneratorSources();
  const presentationFonts = read('../services/presentationFonts.ts');

  const interFaces = typography.match(/@font-face\s*\{[\s\S]*?font-family:\s*"Inter"[\s\S]*?\}/g) || [];
  assert.equal(interFaces.length, 2);
  assert.ok(interFaces.every((face) => /font-weight:\s*400 500/.test(face)));
  assert.match(typography, /font-synthesis:\s*none/);
  assert.match(tailwind, /bold:\s*"500"/);
  assert.match(tailwind, /black:\s*"500"/);
  assert.match(generator, /Math\.min\(500, Math\.max\(400, requestedWeight\)\)/);
  assert.doesNotMatch(presentationFonts, /bold:\s*TYPOGRAPHY_ASSETS\.interBold/);

  const homeCss = read('../../frontend-mirror/templates/beez3/css/style.css');
  const homeRenderer = read('../mirror/renderHome.ts');
  const homeConfig = read('../mirror/siteConfig.ts');
  const homeStaticEn = read('../../frontend-mirror/index.html');
  const homeStaticEs = read('../../frontend-mirror/index.php/home/index.html');
  assert.match(homeCss, /\.home__rojo--title\s*\{[^}]*font-family:\s*var\(--font-title,\s*"Gelasio"[^}]*font-size:\s*clamp\(1\.75rem,\s*2\.8vw,\s*2\.8rem\)[^}]*font-weight:\s*400\s*!important[^}]*text-transform:\s*none\s*!important[^}]*white-space:\s*nowrap/);
  assert.match(homeCss, /\.home__rojo--subtitle\s*\{[^}]*font-family:\s*var\(--font-body,\s*"Inter"[^}]*font-size:\s*clamp\(1\.1rem,\s*0\.9rem \+ 1\.1vw,\s*1\.75rem\)[^}]*font-weight:\s*400\s*!important[^}]*text-transform:\s*none\s*!important/);
  assert.match(homeCss, /\.home__rojo--cta\s*\{[^}]*border-bottom:\s*1px solid rgba\(255, 255, 255, 0\.5\)[^}]*color:\s*#fff\s*!important[^}]*font-size:\s*0\.56rem\s*!important[^}]*font-weight:\s*500\s*!important/);
  assert.match(homeCss, /\.home__rojo--action\s*\{[^}]*align-self:\s*center[^}]*text-align:\s*right[^}]*width:\s*min\(440px, 100%\)/);
  assert.match(homeCss, /\.home__rojo--cta\s*\{[^}]*text-decoration:\s*none\s*!important/);
  assert.match(homeCss, /\.home__rojo--cta\.vw-read-more::after\s*\{[^}]*content:\s*none[^}]*display:\s*none/);
  assert.match(homeCss, /\.home__rojo--cta\s*\{[^}]*min-height:\s*44px/);
  assert.match(homeCss, /\.home__rojo--cta:focus-visible\s*\{[^}]*outline:\s*2px solid #fff/);
  assert.match(homeCss, /@media \(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\.home__rojo--cta-arrow\s*\{[^}]*transition:\s*none/);
  assert.doesNotMatch(homeCss, /\.home__rojo--title\s*\{[^}]*font-weight:\s*600/);
  assert.match(homeRenderer, /<h2 class="home__rojo--title">/);
  assert.match(homeRenderer, /class="home__rojo--cta-arrow" aria-hidden="true">→/);
  assert.doesNotMatch(homeRenderer, /style="font-size:\s*1\.4rem/);
  assert.doesNotMatch(homeRenderer, /<p style="text-align:\s*right;">/);
  assert.match(homeConfig, /key: "banner_title", value: "We go where clients need us", valueEs: "Vamos a donde los clientes nos necesitan"/);
  for (const homeStatic of [homeStaticEn, homeStaticEs]) {
    assert.match(homeStatic, /href="\/templates\/beez3\/css\/style\.css\?v=20260814-banner-compact"/);
    assert.match(homeStatic, /href="\/templates\/beez3\/css\/typography\.css\?v=20260812-attorney-profiles"/);
    assert.match(homeStatic, /<h2 class="home__rojo--title">/);
    assert.match(homeStatic, /<p class="home__rojo--subtitle">/);
    assert.match(homeStatic, /<p class="home__rojo--action">/);
    assert.doesNotMatch(homeStatic, /home__rojo--txt[\s\S]{0,600}style="font-size:\s*1\.4rem/);
  }
  assert.match(homeStaticEn, /<h2 class="home__rojo--title">We go where clients need us<\/h2>/);
  assert.match(homeStaticEs, /<h2 class="home__rojo--title">Vamos a donde los clientes nos necesitan<\/h2>/);
});

test('módulos nuevos no pueden reintroducir familias tipográficas anteriores', () => {
  const roots = [
    new URL('../../client/src/', import.meta.url),
    new URL('../agents/', import.meta.url),
    new URL('../mirror/', import.meta.url),
    new URL('../services/', import.meta.url),
    new URL('../../shared/', import.meta.url),
    new URL('../../scripts/', import.meta.url),
  ];
  const extensions = /\.(?:css|html|ts|tsx)$/;
  const forbidden = /font-family\s*:[^;}\n]*(?:Arial|Georgia|Publico|Geomanist|Optima|Atkinson|Lato|Playfair|Cormorant|Calibri|Century Gothic)/i;
  const violations: string[] = [];

  const visit = (directory: URL) => {
    for (const name of readdirSync(directory)) {
      const unresolved = new URL(name, directory);
      const directoryEntry = statSync(unresolved).isDirectory();
      const entry = directoryEntry ? new URL(`${name}/`, directory) : unresolved;
      if (directoryEntry) visit(entry);
      else if (extensions.test(name)) {
        const source = readFileSync(entry, 'utf8');
        if (forbidden.test(source)) violations.push(entry.pathname);
      }
    }
  };
  for (const root of roots) visit(root);
  assert.deepEqual(violations, []);
});

test('guías, agentes y configuración futura reconocen únicamente Gelasio e Inter', () => {
  const guidelines = read('../../design_guidelines.md');
  const typographyTokens = read('../../shared/typography.ts');
  const tailwind = read('../../tailwind.config.ts');
  const agentRoots = [
    new URL('../agents/', import.meta.url),
    new URL('../../services/agents/', import.meta.url),
  ];
  const forbiddenFamily = /\b(?:Publico|Geomanist|Optima|Atkinson|Georgia|Arial|Calibri|Century Gothic|Lato|Playfair Display|Cormorant Garamond|Times New Roman)\b/i;
  const agentViolations: string[] = [];

  const visitAgents = (directory: URL) => {
    if (!existsSync(directory)) return;
    for (const name of readdirSync(directory)) {
      const unresolved = new URL(name, directory);
      const directoryEntry = statSync(unresolved).isDirectory();
      const entry = directoryEntry ? new URL(`${name}/`, directory) : unresolved;
      if (directoryEntry) visitAgents(entry);
      else if (/\.(?:md|ts|tsx|txt)$/.test(name) && forbiddenFamily.test(readFileSync(entry, 'utf8'))) {
        agentViolations.push(entry.pathname);
      }
    }
  };
  for (const root of agentRoots) visitAgents(root);

  assert.match(guidelines, /\*\*Gelasio\*\*/);
  assert.match(guidelines, /\*\*Inter\*\*/);
  assert.doesNotMatch(guidelines, forbiddenFamily);
  assert.match(typographyTokens, /title:\s*"Gelasio"/);
  assert.match(typographyTokens, /body:\s*"Inter"/);
  assert.match(tailwind, /sans:\s*\["var\(--font-sans\)"\]/);
  assert.match(tailwind, /heading:\s*\["var\(--font-heading\)"\]/);
  assert.deepEqual(agentViolations, []);
});

test('HTML histórico recibe idioma, tipografías y paginación bilingüe correctos', () => {
  assert.equal(legacyHtmlLanguage('/index.php/publications/news/start-10.html'), 'en');
  assert.equal(legacyHtmlLanguage('/index.php/publicaciones/noticias/start-10.html'), 'es');
  assert.equal(legacyHtmlLanguage('/index.php/publicaciones/noticias/start-10.html', 'en'), 'en');
  assert.match(normalizeLegacyHtmlLanguage('<html lang="en-gb"><body></body></html>', 'es'), /<html lang="es-mx">/);
  assert.match(normalizeLegacyHtmlLanguage('<html class="no-js"><body></body></html>', 'en'), /<html class="no-js" lang="en-gb">/);

  const normalized = normalizeLegacyTypography(
    '<style>h1{font-family:Publico-Roman}p{font-family:OptimaLTStd}</style>'
      + '<span style="font-family:tahoma, arial, helvetica, sans-serif">Texto</span>',
  );
  assert.doesNotMatch(normalized, /Publico|Optima|tahoma|arial|helvetica/i);
  assert.match(normalized, /Gelasio/);
  assert.match(normalized, /Inter/);

  const normalizedControls = normalizeLegacyTypography(
    '<input class="search__form--input" style="font-family:Publico-Roman">'
      + '<div class="header--btn" style="font-family:Geomanist-Book,serif">MENÚ</div>',
  );
  assert.match(normalizedControls, /search__form--input[^>]+font-family:Inter/);
  assert.match(normalizedControls, /font-family:Inter,sans-serif/);
  assert.doesNotMatch(normalizedControls, /font-family:(?:Gelasio|Inter),serif/);

  assert.equal(legacyPaginationDestination('/index.php/publications/news/start-10.html'), '/news?page=1&lang=en');
  assert.equal(legacyPaginationDestination('/index.php/publicaciones/noticias/start-50.html'), '/news?page=3');
  assert.equal(legacyPaginationDestination('/index.php/publications/articles/start-140.html'), '/articles?page=6&lang=en');
  assert.equal(legacyPaginationDestination('/index.php/publicaciones/articulos/start-20.html'), '/articles?page=1');
  assert.equal(legacyPaginationDestination('/index.php/publicaciones/noticias/index.html'), null);
});

test('los SVG nuevos incrustan las dos familias antes de rasterizar PDF y PNG', () => {
  const generator = readPresentationGeneratorSources();
  assert.match(generator, /data:font\/ttf;base64/);
  assert.match(generator, /font-family:'Gelasio'/);
  assert.match(generator, /font-family:'Inter'/);
  assert.match(generator, /\$\{svgFontDefs\(\)\}/);
  assert.doesNotMatch(generator, /const FONT(?:_PPTX)?\s*=\s*\{[^}]+(?:Georgia|Calibri|Century Gothic)/s);
});

test('los PPTX nuevos contienen Gelasio e Inter editables e incrustadas en OOXML', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'vw-typography-'));
  const filePath = path.join(directory, 'sample.pptx');
  try {
    const source = new JSZip();
    source.file(
      '[Content_Types].xml',
      '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>',
    );
    source.file(
      'ppt/presentation.xml',
      '<?xml version="1.0"?><p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:defaultTextStyle/></p:presentation>',
    );
    source.file(
      'ppt/_rels/presentation.xml.rels',
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>',
    );
    writeFileSync(filePath, await source.generateAsync({ type: 'nodebuffer' }));

    await embedPresentationFonts(filePath);
    const output = await JSZip.loadAsync(readFileSync(filePath));
    const presentation = await output.file('ppt/presentation.xml')!.async('string');
    const relationships = await output.file('ppt/_rels/presentation.xml.rels')!.async('string');
    const contentTypes = await output.file('[Content_Types].xml')!.async('string');
    const fontParts = Object.keys(output.files).filter((name) => /^ppt\/fonts\/font-.+\.fntdata$/.test(name));

    assert.match(presentation, /typeface="Gelasio"/);
    assert.match(presentation, /typeface="Inter"/);
    assert.equal((presentation.match(/<p:embeddedFont>/g) || []).length, 2);
    assert.equal((relationships.match(/relationships\/font"/g) || []).length, 8);
    assert.equal(fontParts.length, 8);
    assert.match(contentTypes, /Extension="fntdata" ContentType="application\/x-fontdata"/);
    for (const name of fontParts) {
      const font = await output.file(name)!.async('nodebuffer');
      assert.ok(font.length > 40_000);
      assert.deepEqual([...font.subarray(0, 4)], [0, 1, 0, 0]);
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
