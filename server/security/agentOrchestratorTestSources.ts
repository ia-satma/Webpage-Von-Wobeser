import fs from 'node:fs';
import path from 'node:path';

/**
 * Assertions that once inspected the monolithic orchestrator must cover the
 * stable facade and every internal service after modularization.
 */
export function readAgentOrchestratorSources(): string {
  const root = process.cwd();
  const directory = path.join(root, 'server', 'agents', 'core', 'orchestrator');
  const modules = fs.readdirSync(directory)
    .filter((name) => name.endsWith('.ts') && !name.startsWith('._'))
    .sort()
    .map((name) => fs.readFileSync(path.join(directory, name), 'utf8'));
  const facade = fs.readFileSync(
    path.join(root, 'server', 'agents', 'core', 'AgentOrchestrator.ts'),
    'utf8',
  );
  return [facade, ...modules].join('\n');
}
