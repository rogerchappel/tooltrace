import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
assert.equal(pkg.type, 'module');
assert.ok(pkg.bin?.tooltrace, 'CLI bin is exposed');
assert.ok(pkg.exports?.['.'], 'core export is exposed');
assert.ok(pkg.exports?.['./react'], 'react export is exposed');
assert.ok(pkg.exports?.['./styles.css'], 'style export is exposed');
assert.ok(pkg.repository?.url?.includes('rogerchappel/tooltrace'), 'repository metadata points to GitHub');
assert.ok(pkg.keywords.includes('local-first'), 'local-first keyword is present');
assert.notEqual(pkg.sideEffects, false, 'sideEffects must not disable packaged CSS imports');
if (Array.isArray(pkg.sideEffects)) {
  assert.ok(pkg.sideEffects.some((pattern) => String(pattern).endsWith('.css')), 'sideEffects keeps *.css files marked as side-effect-full');
}
