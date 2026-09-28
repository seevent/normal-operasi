import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('Dependencies audit: unused libraries are removed from package.json and vite.config.ts', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const viteConfig = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8');

  assert.equal(pkg.dependencies['konva'], undefined, 'konva should be removed');
  assert.equal(pkg.dependencies['react-konva'], undefined, 'react-konva should be removed');
  assert.equal(pkg.dependencies['use-image'], undefined, 'use-image should be removed');
  assert.equal(pkg.dependencies['@tanstack/react-store'], undefined, '@tanstack/react-store should be removed');
  assert.equal(pkg.dependencies['@tanstack/store'], undefined, '@tanstack/store should be removed');

  assert.ok(!viteConfig.includes("'konva'"), 'konva should be removed from vite.config.ts');
  assert.ok(!viteConfig.includes("'react-konva'"), 'react-konva should be removed from vite.config.ts');
  assert.ok(!viteConfig.includes("'use-image'"), 'use-image should be removed from vite.config.ts');
});
