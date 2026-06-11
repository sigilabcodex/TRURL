import assert from 'node:assert/strict';
import test from 'node:test';
import { getChapterMetadataHealth, getProjectMetadataHealth } from '../app/frontend/src/utils/metadataHealth.js';

const cleanChapter = Object.freeze({
  id: 'ms.clean',
  title: 'Clean',
  path: 'manuscript/clean.md',
  metadata: Object.freeze({
    id: 'ms.clean',
    title: 'Clean',
    type: 'chapter',
    status: 'draft',
    source_text: 'Source',
    source_url: 'https://example.test/source',
    summary: 'A compact summary.',
    character_ids: Object.freeze(['char.one']),
    location_ids: Object.freeze(['loc.one']),
    timeline_ids: Object.freeze(['time.one']),
  }),
});

test('metadata health for a complete chapter has no warnings or errors', () => {
  const health = getChapterMetadataHealth(cleanChapter);

  assert.equal(health.summary.error, 0);
  assert.equal(health.summary.warning, 0);
  assert.equal(health.summary.info, 0);
});

test('metadata health reports missing frontmatter id and title as warnings', () => {
  const health = getChapterMetadataHealth({
    id: 'manuscript/fallback.md',
    title: 'Fallback title',
    metadata: { type: 'chapter', status: 'draft' },
  });

  assert.ok(health.issues.some((issue) => issue.level === 'warning' && issue.code === 'missing-id'));
  assert.ok(health.issues.some((issue) => issue.level === 'warning' && issue.code === 'missing-title'));
});

test('metadata health reports unknown status and type as warnings', () => {
  const health = getChapterMetadataHealth({
    metadata: {
      id: 'ms.odd',
      title: 'Odd',
      type: 'sequence',
      status: 'reviewing',
    },
  });

  assert.ok(health.issues.some((issue) => issue.code === 'unknown-type'));
  assert.ok(health.issues.some((issue) => issue.code === 'unknown-status'));
});

test('metadata health project summary counts issues across chapters', () => {
  const health = getProjectMetadataHealth([
    cleanChapter,
    { metadata: { type: 'chapter', status: 'draft' } },
    { metadata: { id: 'ms.partial', title: 'Partial', type: 'chapter', status: 'draft', source_url: 'https://example.test' } },
  ]);

  assert.equal(health.chapters.length, 3);
  assert.equal(health.summary.error, 0);
  assert.equal(health.summary.warning, 2);
  assert.ok(health.summary.info > 0);
});

test('metadata health handles missing chapter safely', () => {
  const health = getChapterMetadataHealth(null);

  assert.equal(health.summary.error, 0);
  assert.ok(health.summary.warning > 0);
  assert.ok(health.summary.info > 0);
});

test('metadata health helper does not mutate input', () => {
  const health = getChapterMetadataHealth(cleanChapter);
  health.issues.push({ level: 'warning', code: 'test', label: 'Test' });

  assert.deepEqual(cleanChapter.metadata.character_ids, ['char.one']);
});
