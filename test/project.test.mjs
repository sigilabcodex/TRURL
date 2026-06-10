import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { getDefaultDocument, loadProject, validateProjectManifest } from '../app/backend/lib/project.js';
import { buildWorkspaceSnapshot } from '../app/backend/routes/workspace.js';

const validManifest = {
  schema: 'trurl-project/v0',
  title: 'Test Project',
  defaultDocument: 'main',
  documents: [
    {
      id: 'main',
      title: 'Main Manuscript',
      manuscriptPath: 'manuscript',
      storyBiblePath: 'story-bible',
      notesPath: 'notes',
      revisionPath: 'revision',
      renderPresets: ['editorial-default'],
    },
  ],
};

async function makeTempRepo() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'trurl-project-test-'));
}

async function writeManifest(repoRoot, manifestText) {
  await fs.mkdir(path.join(repoRoot, '.trurl'), { recursive: true });
  await fs.writeFile(path.join(repoRoot, '.trurl', 'project.json'), manifestText, 'utf8');
}

test('getDefaultDocument returns the defaultDocument match', () => {
  const project = {
    defaultDocument: 'secondary',
    documents: [
      { id: 'main', title: 'Main' },
      { id: 'secondary', title: 'Secondary' },
    ],
  };

  assert.deepEqual(getDefaultDocument(project), { id: 'secondary', title: 'Secondary' });
});

test('getDefaultDocument falls back to the first document', () => {
  const project = {
    defaultDocument: 'missing',
    documents: [
      { id: 'main', title: 'Main' },
      { id: 'secondary', title: 'Secondary' },
    ],
  };

  assert.deepEqual(getDefaultDocument(project), { id: 'main', title: 'Main' });
});

test('getDefaultDocument handles empty documents', () => {
  assert.equal(getDefaultDocument({ defaultDocument: 'main', documents: [] }), null);
  assert.equal(getDefaultDocument({ defaultDocument: 'main' }), null);
});

test('valid project manifest passes validation', () => {
  assert.deepEqual(validateProjectManifest(validManifest), {
    ok: true,
    warnings: [],
    errors: [],
  });
});

test('default project loads when manifest is missing', async () => {
  const repoRoot = await makeTempRepo();
  const project = await loadProject(repoRoot);

  assert.equal(project.schema, 'trurl-project/v0');
  assert.equal(project.defaultDocument, 'main');
  assert.equal(project.documents[0].manuscriptPath, 'manuscript');
  assert.equal(project.source, 'default');
  assert.deepEqual(project.warnings, []);
  assert.deepEqual(project.errors, []);
  assert.deepEqual(project.currentDocument, project.documents[0]);
});

test('project manifest loads when present', async () => {
  const repoRoot = await makeTempRepo();
  await writeManifest(repoRoot, JSON.stringify(validManifest));

  const project = await loadProject(repoRoot);

  assert.equal(project.title, 'Test Project');
  assert.equal(project.source, '.trurl/project.json');
  assert.deepEqual(project.warnings, []);
  assert.deepEqual(project.errors, []);
  assert.deepEqual(project.documents, validManifest.documents);
  assert.deepEqual(project.currentDocument, validManifest.documents[0]);
});

test('invalid project manifest returns default project with validation metadata', async () => {
  const repoRoot = await makeTempRepo();
  await writeManifest(repoRoot, JSON.stringify({ schema: 'wrong', documents: [] }));

  const project = await loadProject(repoRoot);

  assert.equal(project.source, 'default');
  assert.equal(project.documents[0].manuscriptPath, 'manuscript');
  assert.ok(project.warnings.length > 0);
  assert.ok(project.errors.length > 0);
  assert.match(project.warnings.join('\\n'), /Invalid project manifest/);
});

test('project manifest validation rejects unsafe document paths', () => {
  const result = validateProjectManifest({
    ...validManifest,
    documents: [
      {
        ...validManifest.documents[0],
        manuscriptPath: '../outside',
      },
    ],
  });

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('relative repository path')));
});

test('duplicate document ids fail validation and use safe fallback', async () => {
  const manifest = {
    ...validManifest,
    documents: [
      validManifest.documents[0],
      {
        ...validManifest.documents[0],
        title: 'Duplicate Main',
      },
    ],
  };

  const validation = validateProjectManifest(manifest);
  assert.equal(validation.ok, false);
  assert.ok(validation.errors.some((error) => error.includes('must be unique')));

  const repoRoot = await makeTempRepo();
  await writeManifest(repoRoot, JSON.stringify(manifest));
  const project = await loadProject(repoRoot);

  assert.equal(project.source, 'default');
  assert.ok(project.errors.some((error) => error.includes('must be unique')));
});

test('defaultDocument mismatch warns and currentDocument falls back to first document', async () => {
  const manifest = {
    ...validManifest,
    defaultDocument: 'missing',
    documents: [
      validManifest.documents[0],
      {
        ...validManifest.documents[0],
        id: 'secondary',
        title: 'Secondary Manuscript',
        manuscriptPath: 'manuscript-secondary',
      },
    ],
  };

  const validation = validateProjectManifest(manifest);
  assert.equal(validation.ok, true);
  assert.ok(validation.warnings.some((warning) => warning.includes('defaultDocument')));

  const repoRoot = await makeTempRepo();
  await writeManifest(repoRoot, JSON.stringify(manifest));
  const project = await loadProject(repoRoot);

  assert.equal(project.source, '.trurl/project.json');
  assert.deepEqual(project.errors, []);
  assert.ok(project.warnings.some((warning) => warning.includes('defaultDocument')));
  assert.equal(project.currentDocument.id, 'main');
});

test('empty documents fails validation and safe fallback is used', async () => {
  const manifest = {
    ...validManifest,
    documents: [],
  };

  const validation = validateProjectManifest(manifest);
  assert.equal(validation.ok, false);
  assert.ok(validation.errors.some((error) => error.includes('non-empty array')));

  const repoRoot = await makeTempRepo();
  await writeManifest(repoRoot, JSON.stringify(manifest));
  const project = await loadProject(repoRoot);

  assert.equal(project.source, 'default');
  assert.equal(project.currentDocument.id, 'main');
  assert.ok(project.errors.some((error) => error.includes('non-empty array')));
});

test('renderPresets must be an array of strings when present', () => {
  const result = validateProjectManifest({
    ...validManifest,
    documents: [
      {
        ...validManifest.documents[0],
        renderPresets: ['editorial-default', 42],
      },
    ],
  });

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('renderPresets')));
});

test('missing renderPresets warns and normalizes to an empty array', async () => {
  const documentWithoutPresets = { ...validManifest.documents[0] };
  delete documentWithoutPresets.renderPresets;
  const manifest = {
    ...validManifest,
    documents: [documentWithoutPresets],
  };

  const validation = validateProjectManifest(manifest);
  assert.equal(validation.ok, true);
  assert.ok(validation.warnings.some((warning) => warning.includes('renderPresets')));

  const repoRoot = await makeTempRepo();
  await writeManifest(repoRoot, JSON.stringify(manifest));
  const project = await loadProject(repoRoot);

  assert.deepEqual(project.currentDocument.renderPresets, []);
  assert.ok(project.warnings.some((warning) => warning.includes('renderPresets')));
});

test('project schema file exists and is valid JSON', async () => {
  const schemaPath = path.resolve('schema', 'trurl-project.schema.json');
  const schema = JSON.parse(await fs.readFile(schemaPath, 'utf8'));

  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.properties.schema.const, 'trurl-project/v0');
  assert.deepEqual(schema.required, ['schema', 'title', 'defaultDocument', 'documents']);
  assert.ok(schema.properties.documents.items.required.includes('renderPresets'));
});

test('workspace snapshot includes project metadata', async () => {
  const repoRoot = path.resolve('.');
  const snapshot = await buildWorkspaceSnapshot(repoRoot);

  assert.equal(snapshot.project.schema, 'trurl-project/v0');
  assert.equal(snapshot.project.title, 'TRURL Demo Project');
  assert.equal(snapshot.project.defaultDocument, 'main');
  assert.equal(snapshot.project.documents[0].manuscriptPath, 'manuscript');
  assert.deepEqual(snapshot.project.currentDocument, snapshot.project.documents[0]);
  assert.equal(snapshot.project.source, '.trurl/project.json');
  assert.deepEqual(snapshot.project.warnings, []);
  assert.deepEqual(snapshot.project.errors, []);
});
