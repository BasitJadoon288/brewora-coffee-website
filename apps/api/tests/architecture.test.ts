import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

/** Enforces the Clean Architecture dependency rule on the real import graph. */
const SRC = path.resolve(__dirname, '../src');
const LAYERS = ['domain', 'application', 'infrastructure', 'presentation'] as const;
type Layer = (typeof LAYERS)[number];
const COMPOSITION = ['container.ts', 'app.ts', 'bootstrap.ts', 'server.ts'];
const ALLOWED: Record<Layer, { layers: Layer[]; packages: string[] }> = {
  domain: { layers: ['domain'], packages: [] },
  application: { layers: ['domain', 'application'], packages: ['zod'] },
  infrastructure: { layers: ['domain', 'application', 'infrastructure'], packages: ['*'] },
  presentation: { layers: ['domain', 'application', 'presentation'], packages: ['express', 'zod'] },
};
const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.ts') ? [path.join(d, e.name)] : []));
const layerOf = (file: string): Layer | null => { const seg = path.relative(SRC, file).split(path.sep); return (seg.find(s => (LAYERS as readonly string[]).includes(s)) as Layer) ?? null; };
const importsOf = (file: string) => [...fs.readFileSync(file, 'utf8').matchAll(/(?:from|import)\s+['"]([^'"]+)['"]/g)].map(m => m[1]);

describe('clean architecture dependency rule', () => {
  const files = walk(SRC).filter(f => layerOf(f) && !COMPOSITION.includes(path.relative(SRC, f)) && !f.includes(`${path.sep}scripts${path.sep}`));
  it('finds source files in every layer', () => { for (const l of LAYERS) expect(files.some(f => layerOf(f) === l)).toBe(true); });
  it('no layer imports something it must not depend on', () => {
    const violations: string[] = [];
    for (const f of files) {
      const layer = layerOf(f)!; const rule = ALLOWED[layer];
      for (const imp of importsOf(f)) {
        if (imp.startsWith('.')) {
          const target = layerOf(path.resolve(path.dirname(f), imp) + '.ts') ?? layerOf(path.resolve(path.dirname(f), imp) + '/x.ts');
          if (target && !rule.layers.includes(target)) violations.push(`${path.relative(SRC, f)} (${layer}) -> ${imp} (${target})`);
        } else if (!imp.startsWith('node:') && !['crypto', 'fs', 'path'].includes(imp) && !rule.packages.includes('*') && !rule.packages.includes(imp.split('/')[0])) {
          violations.push(`${path.relative(SRC, f)} (${layer}) -> package "${imp}"`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
