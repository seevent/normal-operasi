import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { hasModernColor, replaceModernColors, HTML2CANVAS_COLOR_PROPERTIES } from '../src/lib/utils/pdfColors.ts';

const fake = (c) => `rgb(${c.length}, 0, 0)`;

test('hasModernColor: mengenali oklch/oklab/lab/lch/color()/color-mix, bukan rgb/hex', () => {
  for (const v of ['oklch(0.967 0.003 264.542)', 'oklab(0.5 0.1 0.1 / 0.5)', 'lab(50% 20 30)', 'lch(50% 30 120)', 'color(srgb 1 0 0)', 'color-mix(in oklab, red, blue)']) {
    assert.equal(hasModernColor(v), true, v);
  }
  for (const v of ['rgb(0, 0, 0)', 'rgba(1, 2, 3, 0.5)', '#fff', 'none', 'transparent', 'currentcolor', 'linear-gradient(rgb(0,0,0), #fff)']) {
    assert.equal(hasModernColor(v), false, v);
  }
  // Pemanggilan berulang tidak terpengaruh lastIndex regex global
  assert.equal(hasModernColor('oklch(1 0 0)'), true);
  assert.equal(hasModernColor('oklch(1 0 0)'), true);
});

test('replaceModernColors: hanya fungsi warna yang diganti, termasuk di dalam shadow & gradien', () => {
  assert.equal(replaceModernColors('oklch(0.5 0.1 200)', () => 'rgb(1, 2, 3)'), 'rgb(1, 2, 3)');
  assert.equal(
    replaceModernColors('oklch(0 0 0 / 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px', () => 'rgba(0, 0, 0, 0.1)'),
    'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px'
  );
  assert.equal(
    replaceModernColors('linear-gradient(to right in oklab, oklch(0.6 0.2 250) 0%, oklch(0.7 0.1 150) 100%)', fake),
    'linear-gradient(to right in oklab, rgb(18, 0, 0) 0%, rgb(18, 0, 0) 100%)'
  );
});

test('replaceModernColors: fungsi bersarang diganti utuh; kurung tak lengkap dibiarkan', () => {
  assert.equal(replaceModernColors('color-mix(in oklab, oklch(0.5 0 0) 50%, transparent)', () => 'X'), 'X');
  assert.equal(replaceModernColors('oklch(0.5 0 0', () => 'X'), 'oklch(0.5 0 0');
  assert.equal(replaceModernColors('rgb(0, 0, 0)', () => 'X'), 'rgb(0, 0, 0)');
});

test('properti yang dinormalkan = semua properti warna yang diurai html2canvas 1.4.1', () => {
  const src = readFileSync(new URL('../node_modules/html2canvas/dist/html2canvas.esm.js', import.meta.url), 'utf8');
  const parsed = [...src.matchAll(/this\.(\w+) = parse\(context, \w+,/g)]
    .map(([, name]) => name)
    .filter((name) => /Color$|Image$|Shadow$/.test(name) || name === 'color')
    .map((name) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`).replace(/^webkit/, '-webkit'));
  assert.deepEqual([...parsed].sort(), [...HTML2CANVAS_COLOR_PROPERTIES].sort());
});

test('generatePdfBlob menormalkan warna lewat onclone dan tetap memanggil onclone milik pemanggil', () => {
  const src = readFileSync(new URL('../src/lib/services/pdfService.ts', import.meta.url), 'utf8');
  assert.match(src, /onclone: \(doc: Document, el\?: HTMLElement\) => \{/);
  assert.match(src, /inlineLegacyColors\(el \?\? doc\.body\)/);
  assert.match(src, /userOnclone\?\.\(doc, el\)/);
});
