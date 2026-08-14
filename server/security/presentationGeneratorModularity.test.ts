import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

const root = process.cwd();
const facadePath = path.join(root, 'server', 'services', 'PresentationGenerator.ts');
const modulesDirectory = path.join(root, 'server', 'services', 'presentation');
const expectedExports = [
  'PresentationTemplate',
  'PresentationBranding',
  'PresentationFormat',
  'SlideLayout',
  'SlideChart',
  'SlideDiagram',
  'SlideImage',
  'SlideStatFigure',
  'SlideStat',
  'SlideQuote',
  'SlideColumn',
  'SlideModelSlide',
  'SlideModel',
  'RenderOptions',
  'RenderResult',
  'PresentationGenerator',
  'presentationGenerator',
] as const;

function parse(filePath: string): ts.SourceFile {
  return ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
}

function hasExport(node: ts.Node): boolean {
  return Boolean(node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword));
}

test('la fachada conserva exactamente las 17 exportaciones y renderAndSave', () => {
  const source = parse(facadePath);
  const exported: string[] = [];
  let generatorClass: ts.ClassDeclaration | undefined;

  for (const statement of source.statements) {
    if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) exported.push(element.name.text);
    }
    if (ts.isClassDeclaration(statement) && hasExport(statement) && statement.name) {
      exported.push(statement.name.text);
      if (statement.name.text === 'PresentationGenerator') generatorClass = statement;
    }
    if (ts.isVariableStatement(statement) && hasExport(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) exported.push(declaration.name.text);
      }
    }
  }

  assert.deepEqual(exported, [...expectedExports]);
  assert.ok(generatorClass);
  const methods = generatorClass.members.filter(ts.isMethodDeclaration);
  assert.deepEqual(methods.map((method) => method.name.getText(source)), ['renderAndSave']);
  const method = methods[0];
  assert.ok(method.body);
  assert.equal(
    source.text.slice(method.getStart(source), method.body.getStart(source)).replace(/\s+/g, ' ').trim(),
    'async renderAndSave(model: SlideModel, opts: RenderOptions): Promise<RenderResult>',
  );
  assert.match(source.text, /export const presentationGenerator = new PresentationGenerator\(\)/);
});

test('la fachada y los módulos respetan límites y dependencias unidireccionales', () => {
  const facade = fs.readFileSync(facadePath, 'utf8');
  assert.ok(facade.split('\n').length <= 150);
  assert.doesNotMatch(facade, /\b(?:sharp|PDFDocument|PptxGenJS|persistPublicMediaFiles|storage)\b/);

  const moduleFiles = fs.readdirSync(modulesDirectory)
    .filter((filename) => filename.endsWith('.ts') && !filename.startsWith('._'));
  assert.equal(moduleFiles.length, 9);
  for (const filename of moduleFiles) {
    const source = fs.readFileSync(path.join(modulesDirectory, filename), 'utf8');
    assert.ok(source.split('\n').length <= 350, `${filename} supera 350 líneas`);
    assert.doesNotMatch(
      source,
      /from\s+['"]\.\.\/PresentationGenerator['"]/,
      `${filename} no debe importar la fachada`,
    );
  }
});

test('el agente conserva la misma interfaz y queda fuera de esta fase', () => {
  const agent = fs.readFileSync(
    path.join(root, 'server', 'agents', 'specialized', 'PresentationGeneratorAgent.ts'),
    'utf8',
  );
  assert.equal(agent.split('\n').length, 580);
  assert.match(agent, /presentationGenerator\.renderAndSave\(model, \{/);
  assert.match(agent, /type SlideModel/);
  assert.match(agent, /type SlideLayout/);
});

test('las constantes de diseño, formatos, nombres y persistencia siguen congeladas', () => {
  const design = fs.readFileSync(path.join(modulesDirectory, 'designSystem.ts'), 'utf8');
  const contracts = fs.readFileSync(path.join(modulesDirectory, 'contracts.ts'), 'utf8');
  const output = fs.readFileSync(path.join(modulesDirectory, 'outputPipeline.ts'), 'utf8');
  const assets = fs.readFileSync(path.join(modulesDirectory, 'assets.ts'), 'utf8');

  assert.match(design, /W = 1280/);
  assert.match(design, /H = 720/);
  assert.match(design, /SPINE = 80/);
  assert.match(design, /RIGHT = 1200/);
  assert.match(contracts, /'section' \| 'bullets' \| 'closing' \| 'image' \| 'chart' \| 'diagram' \| 'stat' \| 'quote' \| 'twocolumn'/);
  assert.match(output, /`pres-\$\{stamp\}`/);
  assert.match(output, /\['pptx', 'pdf', 'png'\]/);
  assert.ok(output.indexOf('await deps.persistFiles(generatedFiles)') < output.indexOf('await deps.createHistory({'));
  assert.match(output, /deps\.deletePersistentObjects\(persistedObjectNames\)/);
  assert.match(assets, /'\/uploads\/':/);
  assert.match(assets, /'\/generated-images\/':/);
});
