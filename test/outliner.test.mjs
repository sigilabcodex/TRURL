import assert from 'node:assert/strict';
import test from 'node:test';
import { getChapterWordCount, getOutlinerRows, summarizeOutliner } from '../app/frontend/src/utils/outliner.js';

test('outliner word count handles empty or missing bodies', () => {
  assert.equal(getChapterWordCount({ body: '' }), 0);
  assert.equal(getChapterWordCount({ body: '   ' }), 0);
  assert.equal(getChapterWordCount({}), 0);
});

test('outliner word count counts simple prose words', () => {
  assert.equal(getChapterWordCount({ body: 'One two\nthree.' }), 3);
});

test('outliner rows preserve chapter order from the workspace payload', () => {
  const rows = getOutlinerRows([
    { id: 'b', title: 'Second', path: 'manuscript/02.md', order: 2, body: 'two' },
    { id: 'a', title: 'First', path: 'manuscript/01.md', order: 1, body: 'one' },
  ]);

  assert.deepEqual(rows.map((row) => row.id), ['b', 'a']);
  assert.deepEqual(rows.map((row) => row.order), [2, 1]);
});

test('outliner rows compute linked entity counts safely', () => {
  const rows = getOutlinerRows([
    {
      id: 'main',
      title: 'Main',
      path: 'manuscript/main.md',
      body: 'body text',
      character_ids: ['char.a', 'char.b'],
      location_ids: ['loc.a'],
      timeline_ids: ['time.a', 'time.b', 'time.c'],
    },
    {
      id: 'loose',
      title: 'Loose',
      path: 'manuscript/loose.md',
      body: 'body',
      character_ids: null,
    },
  ]);

  assert.equal(rows[0].linkedCharacters, 2);
  assert.equal(rows[0].linkedLocations, 1);
  assert.equal(rows[0].timelineSignals, 3);
  assert.equal(rows[1].linkedCharacters, 0);
  assert.equal(rows[1].linkedLocations, 0);
  assert.equal(rows[1].timelineSignals, 0);
});

test('outliner summary totals chapters, words, and linked rows', () => {
  const summary = summarizeOutliner([
    { wordCount: 10, linkedCharacters: 2, timelineSignals: 0 },
    { wordCount: 5, linkedCharacters: 0, timelineSignals: 1 },
    { wordCount: 0, linkedCharacters: 1, timelineSignals: 1 },
  ]);

  assert.deepEqual(summary, {
    totalChapters: 3,
    totalWords: 15,
    chaptersWithCharacters: 2,
    chaptersWithTimeline: 2,
  });
});
