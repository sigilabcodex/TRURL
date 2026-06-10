import assert from 'node:assert/strict';
import test from 'node:test';
import { parseGitStatusOutput, summarizeGitStatus } from '../app/frontend/src/utils/gitStatus.js';
import { countLinkedEntities, summarizeRenderPackage } from '../app/frontend/src/utils/renderPackageSummary.js';
import { summarizeValidation } from '../app/frontend/src/utils/validationSummary.js';

test('git status parser extracts branch and modified files', () => {
  const parsed = parseGitStatusOutput('## main...origin/main\n M app/file.js\nM  app/other.js\n');

  assert.equal(parsed.branchLine, '## main...origin/main');
  assert.equal(parsed.branch, 'main...origin/main');
  assert.equal(parsed.modifiedFiles.length, 2);
  assert.equal(parsed.modifiedFiles[0].path, 'app/file.js');
  assert.equal(parsed.isClean, false);
});

test('git status parser extracts untracked files', () => {
  const parsed = parseGitStatusOutput('## main\n?? notes/new.md\n');

  assert.equal(parsed.untrackedFiles.length, 1);
  assert.equal(parsed.untrackedFiles[0].path, 'notes/new.md');
  assert.equal(parsed.untrackedFiles[0].type, 'untracked');
});

test('git status summary detects clean status', () => {
  const summary = summarizeGitStatus({
    ok: true,
    commands: [{ name: 'status', command: 'git status --short --branch', stdout: '## main\n', stderr: '' }],
  });

  assert.equal(summary.branch, 'main');
  assert.equal(summary.isClean, true);
  assert.equal(summary.changedFiles.length, 0);
});

test('validation summary handles all passing checks', () => {
  assert.deepEqual(summarizeValidation({
    ok: true,
    checks: [
      { name: 'frontmatter', exitCode: 0 },
      { name: 'crossrefs', exitCode: 0 },
    ],
  }), {
    ok: true,
    total: 2,
    passed: 2,
    failed: 0,
  });
});

test('validation summary handles one failing check', () => {
  assert.deepEqual(summarizeValidation({
    ok: false,
    checks: [
      { name: 'frontmatter', exitCode: 0 },
      { name: 'crossrefs', exitCode: 1 },
    ],
  }), {
    ok: false,
    total: 2,
    passed: 1,
    failed: 1,
  });
});

test('render package summary counts linked entities', () => {
  const payload = {
    warnings: ['example'],
    package: {
      manuscript: { selected: { title: 'Chapter One', path: 'manuscript/01.md' } },
      output: { target: 'html', path: 'exports/01.html' },
      style: { preset: 'editorial-default' },
      storyBible: {
        linkedEntities: {
          characters: [{ id: 'a' }, { id: 'b' }],
          locations: [{ id: 'l' }],
          timeline: [{ id: 't' }],
        },
      },
    },
  };

  assert.deepEqual(countLinkedEntities(payload), {
    characters: 2,
    locations: 1,
    timeline: 1,
  });
  assert.equal(summarizeRenderPackage(payload).warningsCount, 1);
});

test('render package summary handles missing package safely', () => {
  assert.equal(summarizeRenderPackage(null), null);
  assert.deepEqual(countLinkedEntities({}), {
    characters: 0,
    locations: 0,
    timeline: 0,
  });
});
