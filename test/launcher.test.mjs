import { execFileSync } from 'node:child_process';
import test from 'node:test';

test('TRURL launcher script syntax-checks without starting servers', () => {
  execFileSync('node', ['--check', 'scripts/dev-trurl.mjs'], { stdio: 'pipe' });
});
