import { readdirSync, readFileSync } from 'node:fs';

const facadeUrl = new URL('../services/PresentationGenerator.ts', import.meta.url);
const modulesUrl = new URL('../services/presentation/', import.meta.url);

export function readPresentationGeneratorModule(filename: string): string {
  return readFileSync(new URL(filename, modulesUrl), 'utf8');
}

export function readPresentationGeneratorSources(): string {
  const facade = readFileSync(facadeUrl, 'utf8');
  const modules = readdirSync(modulesUrl)
    .filter((filename) => filename.endsWith('.ts') && !filename.startsWith('._'))
    .sort()
    .map((filename) => readPresentationGeneratorModule(filename));
  return [facade, ...modules].join('\n');
}
