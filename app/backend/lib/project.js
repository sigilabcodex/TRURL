import fs from 'node:fs/promises';
import path from 'node:path';

const PROJECT_SCHEMA = 'trurl-project/v0';
const PROJECT_MANIFEST_PATH = path.join('.trurl', 'project.json');

export function createDefaultProject(warnings = []) {
  return {
    schema: PROJECT_SCHEMA,
    title: 'TRURL Local Project',
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
    source: 'default',
    warnings,
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isRelativeSafePath(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return false;
  }

  if (path.isAbsolute(value)) {
    return false;
  }

  const normalized = value.replace(/\\/g, '/');
  return !normalized.split('/').includes('..');
}

function validateDocument(document, index) {
  const prefix = `documents[${index}]`;
  const errors = [];

  if (!isPlainObject(document)) {
    return [`${prefix} must be an object.`];
  }

  for (const key of ['id', 'title', 'manuscriptPath', 'storyBiblePath', 'notesPath', 'revisionPath']) {
    if (typeof document[key] !== 'string' || document[key].trim() === '') {
      errors.push(`${prefix}.${key} must be a non-empty string.`);
    }
  }

  for (const key of ['manuscriptPath', 'storyBiblePath', 'notesPath', 'revisionPath']) {
    if (!isRelativeSafePath(document[key])) {
      errors.push(`${prefix}.${key} must be a relative repository path.`);
    }
  }

  if (!Array.isArray(document.renderPresets)
    || document.renderPresets.some((preset) => typeof preset !== 'string' || preset.trim() === '')) {
    errors.push(`${prefix}.renderPresets must be an array of non-empty strings.`);
  }

  return errors;
}

export function validateProjectManifest(manifest) {
  const errors = [];

  if (!isPlainObject(manifest)) {
    return ['Project manifest must be a JSON object.'];
  }

  if (manifest.schema !== PROJECT_SCHEMA) {
    errors.push(`schema must be ${PROJECT_SCHEMA}.`);
  }

  if (typeof manifest.title !== 'string' || manifest.title.trim() === '') {
    errors.push('title must be a non-empty string.');
  }

  if (typeof manifest.defaultDocument !== 'string' || manifest.defaultDocument.trim() === '') {
    errors.push('defaultDocument must be a non-empty string.');
  }

  if (!Array.isArray(manifest.documents) || manifest.documents.length === 0) {
    errors.push('documents must be a non-empty array.');
  } else {
    manifest.documents.forEach((document, index) => {
      errors.push(...validateDocument(document, index));
    });

    const documentIds = new Set(
      manifest.documents
        .filter((document) => isPlainObject(document) && typeof document.id === 'string')
        .map((document) => document.id),
    );
    if (typeof manifest.defaultDocument === 'string' && !documentIds.has(manifest.defaultDocument)) {
      errors.push('defaultDocument must match a document id.');
    }
  }

  return errors;
}

function normalizeProjectManifest(manifest, source) {
  return {
    schema: manifest.schema,
    title: manifest.title,
    defaultDocument: manifest.defaultDocument,
    documents: manifest.documents.map((document) => ({
      id: document.id,
      title: document.title,
      manuscriptPath: document.manuscriptPath,
      storyBiblePath: document.storyBiblePath,
      notesPath: document.notesPath,
      revisionPath: document.revisionPath,
      renderPresets: [...document.renderPresets],
    })),
    source,
    warnings: [],
  };
}

export async function loadProject(repoRoot) {
  const manifestPath = path.join(repoRoot, PROJECT_MANIFEST_PATH);

  try {
    const raw = await fs.readFile(manifestPath, 'utf8');
    let manifest;
    try {
      manifest = JSON.parse(raw);
    } catch (error) {
      return createDefaultProject([`Invalid project manifest JSON: ${error.message}`]);
    }

    const errors = validateProjectManifest(manifest);
    if (errors.length > 0) {
      return createDefaultProject(errors.map((error) => `Invalid project manifest: ${error}`));
    }

    return normalizeProjectManifest(manifest, PROJECT_MANIFEST_PATH.replace(/\\/g, '/'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return createDefaultProject();
    }

    return createDefaultProject([`Unable to read project manifest: ${error.message}`]);
  }
}
