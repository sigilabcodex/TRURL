import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getCurrentDocument,
  getCurrentDocumentId,
  getDocumentOptions,
  isDocumentSwitchingAvailable,
} from '../app/frontend/src/utils/documentSelector.js';

const mainDocument = {
  id: 'main',
  title: 'Main Manuscript',
  manuscriptPath: 'manuscript',
  storyBiblePath: 'story-bible',
  notesPath: 'notes',
  revisionPath: 'revision',
  renderPresets: ['editorial-default'],
};

const secondaryDocument = {
  id: 'secondary',
  title: 'Secondary Manuscript',
  manuscriptPath: 'manuscript-secondary',
  storyBiblePath: 'story-bible',
  notesPath: 'notes-secondary',
  revisionPath: 'revision-secondary',
  renderPresets: ['compact'],
};

test('document selector helper handles a single document project', () => {
  const project = {
    defaultDocument: 'main',
    currentDocument: mainDocument,
    documents: [mainDocument],
  };

  assert.equal(getCurrentDocumentId(project), 'main');
  assert.deepEqual(getDocumentOptions(project), [
    { id: 'main', title: 'Main Manuscript', isCurrent: true },
  ]);
  assert.deepEqual(getCurrentDocument(project), mainDocument);
  assert.equal(isDocumentSwitchingAvailable(project), false);
});

test('document selector helper marks the current document among multiple documents', () => {
  const project = {
    defaultDocument: 'main',
    currentDocument: secondaryDocument,
    documents: [mainDocument, secondaryDocument],
  };

  assert.equal(getCurrentDocumentId(project), 'secondary');
  assert.deepEqual(getDocumentOptions(project), [
    { id: 'main', title: 'Main Manuscript', isCurrent: false },
    { id: 'secondary', title: 'Secondary Manuscript', isCurrent: true },
  ]);
  assert.deepEqual(getCurrentDocument(project), secondaryDocument);
  assert.equal(isDocumentSwitchingAvailable(project), false);
});

test('document selector helper handles missing project data', () => {
  assert.equal(getCurrentDocumentId(null), '');
  assert.deepEqual(getDocumentOptions(null), []);
  assert.equal(getCurrentDocument(null), null);
  assert.equal(isDocumentSwitchingAvailable(null), false);
});

test('document selector helper falls back to defaultDocument or first document', () => {
  const defaultProject = {
    defaultDocument: 'secondary',
    documents: [mainDocument, secondaryDocument],
  };

  assert.equal(getCurrentDocumentId(defaultProject), 'secondary');
  assert.deepEqual(getCurrentDocument(defaultProject), secondaryDocument);

  const firstProject = {
    defaultDocument: 'missing',
    documents: [mainDocument, secondaryDocument],
  };

  assert.equal(getCurrentDocumentId(firstProject), 'main');
  assert.deepEqual(getCurrentDocument(firstProject), mainDocument);
});
