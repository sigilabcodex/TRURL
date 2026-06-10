import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { extractFrontmatter, parseYamlLikeBlock } from '../app/backend/lib/frontmatter.js';
import { gitCommands } from '../app/backend/lib/git.js';
import { validateManuscriptPath } from '../app/backend/lib/manuscript.js';
import { validationChecks, validationOrder } from '../app/backend/lib/validation.js';

test('frontmatter parser coerces simple YAML-like metadata', () => {
  assert.deepEqual(parseYamlLikeBlock('id: ms.test\norder: 2\nlocked: false\ntitle: "A Test"\ncharacter_ids:\n  - char.one\n  - char.two'), {
    id: 'ms.test',
    order: 2,
    locked: false,
    title: 'A Test',
    character_ids: ['char.one', 'char.two'],
  });
});

test('extractFrontmatter returns parsed metadata and body', () => {
  const raw = '---\nid: ms.test\ntitle: Test\n---\nBody text';

  assert.deepEqual(extractFrontmatter(raw), {
    frontmatter: { id: 'ms.test', title: 'Test' },
    body: 'Body text',
  });
});

test('manuscript path validation accepts normalized markdown paths', () => {
  const repoRoot = path.resolve('/tmp/trurl-test');
  const result = validateManuscriptPath(repoRoot, 'manuscript/chapter.md');

  assert.equal(result.normalizedPath, 'manuscript/chapter.md');
  assert.equal(result.absolutePath, path.join(repoRoot, 'manuscript', 'chapter.md'));
});

test('manuscript path validation rejects traversal and non-manuscript paths', () => {
  const repoRoot = path.resolve('/tmp/trurl-test');

  assert.throws(
    () => validateManuscriptPath(repoRoot, 'manuscript/../README.md'),
    /Path traversal outside manuscript/,
  );
  assert.throws(
    () => validateManuscriptPath(repoRoot, 'story-bible/characters/char.md'),
    /inside manuscript/,
  );
  assert.throws(
    () => validateManuscriptPath(repoRoot, 'manuscript/chapter.txt'),
    /markdown file/,
  );
});

test('validation checks are fixed allowlisted scripts', () => {
  assert.deepEqual(validationChecks, {
    frontmatter: { name: 'frontmatter', script: 'scripts/validate_frontmatter.py' },
    crossrefs: { name: 'crossrefs', script: 'scripts/check_crossrefs.py' },
    manuscriptOrder: { name: 'manuscript-order', script: 'scripts/check_manuscript_order.py' },
  });
  assert.deepEqual(validationOrder, [
    validationChecks.frontmatter,
    validationChecks.crossrefs,
    validationChecks.manuscriptOrder,
  ]);
});

test('git commands are fixed allowlisted command arguments', () => {
  assert.deepEqual(gitCommands.status, {
    name: 'status',
    args: ['status', '--short', '--branch'],
  });
  assert.deepEqual(gitCommands.diffStat, {
    name: 'diff-stat',
    args: ['diff', '--stat'],
  });
  assert.equal(gitCommands.diffScoped.name, 'diff-scoped');
  assert.deepEqual(gitCommands.diffScoped.args.slice(0, 2), ['diff', '--']);
  assert.ok(gitCommands.diffScoped.args.includes('manuscript'));
  assert.ok(gitCommands.diffScoped.args.includes('story-bible'));
});
