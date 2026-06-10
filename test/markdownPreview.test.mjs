import assert from 'node:assert/strict';
import test from 'node:test';
import { parseMarkdownPreview } from '../app/frontend/src/utils/markdownPreview.js';

test('markdown preview treats raw HTML as text', () => {
  const blocks = parseMarkdownPreview('<script>alert("x")</script>');

  assert.deepEqual(blocks, [
    {
      type: 'paragraph',
      children: [{ type: 'text', text: '<script>alert("x")</script>' }],
    },
  ]);
});

test('markdown preview renders headings', () => {
  assert.deepEqual(parseMarkdownPreview('# Title\n## Chapter\n### Scene'), [
    { type: 'heading', level: 1, children: [{ type: 'text', text: 'Title' }] },
    { type: 'heading', level: 2, children: [{ type: 'text', text: 'Chapter' }] },
    { type: 'heading', level: 3, children: [{ type: 'text', text: 'Scene' }] },
  ]);
});

test('markdown preview joins paragraph lines', () => {
  assert.deepEqual(parseMarkdownPreview('First line\nsecond line'), [
    {
      type: 'paragraph',
      children: [{ type: 'text', text: 'First line second line' }],
    },
  ]);
});

test('markdown preview renders blockquotes', () => {
  assert.deepEqual(parseMarkdownPreview('> First\n> **Second**'), [
    {
      type: 'blockquote',
      paragraphs: [
        [{ type: 'text', text: 'First' }],
        [{ type: 'strong', text: 'Second' }],
      ],
    },
  ]);
});

test('markdown preview renders unordered lists', () => {
  assert.deepEqual(parseMarkdownPreview('- one\n* two'), [
    {
      type: 'list',
      items: [
        [{ type: 'text', text: 'one' }],
        [{ type: 'text', text: 'two' }],
      ],
    },
  ]);
});

test('markdown preview renders bold and italic inline nodes', () => {
  assert.deepEqual(parseMarkdownPreview('Plain **bold** and *italic*.'), [
    {
      type: 'paragraph',
      children: [
        { type: 'text', text: 'Plain ' },
        { type: 'strong', text: 'bold' },
        { type: 'text', text: ' and ' },
        { type: 'em', text: 'italic' },
        { type: 'text', text: '.' },
      ],
    },
  ]);
});

test('markdown preview renders scene breaks as horizontal rules', () => {
  assert.deepEqual(parseMarkdownPreview('Before\n\n---\n\nAfter'), [
    { type: 'paragraph', children: [{ type: 'text', text: 'Before' }] },
    { type: 'hr' },
    { type: 'paragraph', children: [{ type: 'text', text: 'After' }] },
  ]);
});
