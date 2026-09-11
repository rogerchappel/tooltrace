import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

// `"sideEffects": false` tells bundlers (webpack and friends) that importing
// tooltrace/styles.css is a no-op, and tree shaking silently drops the
// stylesheet that README.md and examples/react-embed.jsx tell consumers to
// import. The manifest must therefore never claim the package is globally
// side-effect free, and the exported stylesheet must stay marked as
// side-effect-full.

test('sideEffects never disables packaged CSS imports', () => {
  assert.notEqual(pkg.sideEffects, false, '"sideEffects": false strips tooltrace/styles.css from bundler consumers');
  if (Array.isArray(pkg.sideEffects)) {
    const cssPatterns = pkg.sideEffects.filter((pattern) => String(pattern).endsWith('.css'));
    assert.ok(cssPatterns.length > 0, 'sideEffects list must keep *.css files marked as side-effect-full');
  }
});

test('the exported stylesheet target is covered by the sideEffects list', () => {
  const target = pkg.exports['./styles.css'];
  assert.ok(target?.endsWith('.css'), 'the ./styles.css export maps to a stylesheet');
  if (pkg.sideEffects === true) {
    return;
  }
  assert.ok(Array.isArray(pkg.sideEffects), 'sideEffects is true or a pattern list');
  const covered = pkg.sideEffects.some((pattern) => {
    const value = String(pattern);
    if (value.startsWith('*')) {
      return target.endsWith(value.slice(1));
    }
    return target === value || target.endsWith(`/${value}`);
  });
  assert.ok(covered, `${target} must be matched by a sideEffects pattern so bundlers keep it`);
});
