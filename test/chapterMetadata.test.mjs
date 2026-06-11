import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getChapterMetadataRows,
  getChapterParticipants,
  getChapterSource,
  getChapterTags,
  normalizeChapterMetadata,
} from '../app/frontend/src/utils/chapterMetadata.js';

test('chapter metadata normalizer handles missing metadata safely', () => {
  const metadata = normalizeChapterMetadata({ path: 'manuscript/untitled.md' });

  assert.equal(metadata.id, '—');
  assert.equal(metadata.title, '—');
  assert.equal(metadata.path, 'manuscript/untitled.md');
  assert.ok(metadata.warnings.includes('Missing frontmatter id.'));
  assert.ok(metadata.warnings.includes('Missing frontmatter title.'));
});

test('chapter metadata normalizer accepts scalar and array tags', () => {
  assert.deepEqual(getChapterTags({ metadata: { tags: 'noir, confession' } }), ['noir', 'confession']);
  assert.deepEqual(getChapterTags({ metadata: { tags: ['noir', 'confession'] } }), ['noir', 'confession']);
});

test('chapter metadata normalizer handles source and source_url safely', () => {
  const source = getChapterSource({
    metadata: {
      source: 'Archive Draft',
      source_url: 'https://example.test/source',
    },
  });

  assert.deepEqual(source, {
    text: 'Archive Draft',
    url: 'https://example.test/source',
  });

  assert.deepEqual(getChapterSource({ metadata: { source_text: 'Legacy Source' } }), {
    text: 'Legacy Source',
    url: '—',
  });
});

test('chapter metadata normalizer reports unknown status and type as display warnings', () => {
  const metadata = normalizeChapterMetadata({
    metadata: {
      id: 'ms.test',
      title: 'Test',
      status: 'reviewing',
      type: 'sequence',
    },
  });

  assert.equal(metadata.status, 'reviewing');
  assert.equal(metadata.type, 'sequence');
  assert.ok(metadata.warnings.includes('Unknown status: reviewing.'));
  assert.ok(metadata.warnings.includes('Unknown type: sequence.'));
});

test('chapter metadata normalizer reads participants from aliases or id lists', () => {
  assert.deepEqual(getChapterParticipants({
    metadata: {
      characters: 'char.a, char.b',
      location_ids: ['loc.a'],
      timeline: 'time.a',
    },
  }), {
    characters: ['char.a', 'char.b'],
    locations: ['loc.a'],
    timeline: ['time.a'],
  });
});

test('chapter metadata rows are display-safe and compact', () => {
  const rows = getChapterMetadataRows({
    path: 'manuscript/01.md',
    metadata: {
      id: 'ms.one',
      title: 'One',
      type: 'chapter',
      status: 'draft',
      tags: ['opening'],
    },
  });

  assert.deepEqual(rows.map((row) => row.key), [
    'title',
    'id',
    'type',
    'status',
    'path',
    'source',
    'source_url',
    'canon',
    'tags',
    'summary',
  ]);
  assert.equal(rows.find((row) => row.key === 'tags').value, 'opening');
});

test('chapter metadata normalizer does not mutate input', () => {
  const chapter = Object.freeze({
    metadata: Object.freeze({
      id: 'ms.safe',
      title: 'Safe',
      type: 'chapter',
      status: 'draft',
      tags: Object.freeze(['one']),
    }),
    path: 'manuscript/safe.md',
  });

  const metadata = normalizeChapterMetadata(chapter);
  metadata.tags.push('two');

  assert.deepEqual(chapter.metadata.tags, ['one']);
});
