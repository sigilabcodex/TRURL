import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { loadProject, validateProjectManifest } from '../app/backend/lib/project.js';
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

test('default project loads when manifest is missing', async () => {
  const repoRoot = await makeTempRepo();
  const project = await loadProject(repoRoot);

  assert.equal(project.schema, 'trurl-project/v0');
  assert.equal(project.defaultDocument, 'main');
  assert.equal(project.documents[0].manuscriptPath, 'manuscript');
  assert.equal(project.source, 'default');
  assert.deepEqual(project.warnings, []);
});

test('project manifest loads when present', async () => {
  const repoRoot = await makeTempRepo();
  await writeManifest(repoRoot, JSON.stringify(validManifest));

  const project = await loadProject(repoRoot);

  assert.equal(project.title, 'Test Project');
  assert.equal(project.source, '.trurl/project.json');
  assert.deepEqual(project.warnings, []);
  assert.deepEqual(project.documents, validManifest.documents);
});

test('invalid project manifest returns default project with warning', async () => {
  const repoRoot = await makeTempRepo();
  await writeManifest(repoRoot, JSON.stringify({ schema: 'wrong', documents: [] }));

  const project = await loadProject(repoRoot);

  assert.equal(project.source, 'default');
  assert.equal(project.documents[0].manuscriptPath, 'manuscript');
  assert.ok(project.warnings.length > 0);
  assert.match(project.warnings.join('\n'), /Invalid project manifest/);
});

test('project manifest validation rejects unsafe document paths', () => {
  const errors = validateProjectManifest({
    ...validManifest,
    documents: [
      {
        ...validManifest.documents[0],
        manuscriptPath: '../outside',
      },
    ],
  });

  assert.ok(errors.some((error) => error.includes('relative repository path')));
});

test('workspace snapshot includes project metadata', async () => {
  const repoRoot = path.resolve('.');
  const snapshot = await buildWorkspaceSnapshot(repoRoot);

  assert.equal(snapshot.project.schema, 'trurl-project/v0');
  assert.equal(snapshot.project.title, 'TRURL Demo Project');
  assert.equal(snapshot.project.defaultDocument, 'main');
  assert.equal(snapshot.project.documents[0].manuscriptPath, 'manuscript');
  assert.equal(snapshot.project.source, '.trurl/project.json');
  assert.deepEqual(snapshot.project.warnings, []);
});
