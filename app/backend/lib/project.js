import fs from 'node:fs/promises';
import path from 'node:path';

const PROJECT_SCHEMA = 'trurl-project/v0';
const PROJECT_MANIFEST_PATH = path.join('.trurl', 'project.json');

export function getDefaultDocument(project) {
  const documents = Array.isArray(project?.documents) ? project.documents : [];
  if (documents.length === 0) {
    return null;
  }

  return documents.find((document) => document.id === project.defaultDocument) || documents[0];
}

function toCurrentDocument(document) {
  if (!document) {
    return null;
  }

  return {
    id: document.id,
    title: document.title,
    manuscriptPath: document.manuscriptPath,
    storyBiblePath: document.storyBiblePath,
    notesPath: document.notesPath,
    revisionPath: document.revisionPath,
    renderPresets: [...document.renderPresets],
  };
}

function attachCurrentDocument(project) {
  return {
    ...project,
    currentDocument: toCurrentDocument(getDefaultDocument(project)),
  };
}

export function createDefaultProject(warnings = [], errors = []) {
  return attachCurrentDocument({
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
    errors,
  });
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
  const warnings = [];
  const errors = [];

  if (!isPlainObject(document)) {
    return { warnings, errors: [`${prefix} must be an object.`] };
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

  if (document.renderPresets === undefined) {
    warnings.push(`${prefix}.renderPresets is missing; using an empty array.`);
  } else if (!Array.isArray(document.renderPresets)
    || document.renderPresets.some((preset) => typeof preset !== 'string' || preset.trim() === '')) {
    errors.push(`${prefix}.renderPresets must be an array of non-empty strings.`);
  }

  return { warnings, errors };
}

export function validateProjectManifest(manifest) {
  const warnings = [];
  const errors = [];

  if (!isPlainObject(manifest)) {
    return { ok: false, warnings, errors: ['Project manifest must be a JSON object.'] };
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
      const result = validateDocument(document, index);
      warnings.push(...result.warnings);
      errors.push(...result.errors);
    });

    const documentIds = new Set();
    const duplicateIds = new Set();
    manifest.documents.forEach((document) => {
      if (!isPlainObject(document) || typeof document.id !== 'string' || document.id.trim() === '') {
        return;
      }

      if (documentIds.has(document.id)) {
        duplicateIds.add(document.id);
      }
      documentIds.add(document.id);
    });

    duplicateIds.forEach((id) => {
      errors.push(`document id "${id}" must be unique.`);
    });

    if (typeof manifest.defaultDocument === 'string' && !documentIds.has(manifest.defaultDocument)) {
      warnings.push('defaultDocument does not match a document id; using the first document.');
    }
  }

  return { ok: errors.length === 0, warnings, errors };
}

function normalizeProjectManifest(manifest, source, warnings = []) {
  return attachCurrentDocument({
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
      renderPresets: Array.isArray(document.renderPresets) ? [...document.renderPresets] : [],
    })),
    source,
    warnings,
    errors: [],
  });
}

export async function loadProject(repoRoot) {
  const manifestPath = path.join(repoRoot, PROJECT_MANIFEST_PATH);

  try {
    const raw = await fs.readFile(manifestPath, 'utf8');
    let manifest;
    try {
      manifest = JSON.parse(raw);
    } catch (error) {
      return createDefaultProject(['Invalid project manifest JSON; using defaults.'], [error.message]);
    }

    const validation = validateProjectManifest(manifest);
    if (!validation.ok) {
      return createDefaultProject(
        ['Invalid project manifest; using defaults.', ...validation.warnings],
        validation.errors,
      );
    }

    return normalizeProjectManifest(manifest, PROJECT_MANIFEST_PATH.replace(/\\/g, '/'), validation.warnings);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return createDefaultProject();
    }

    return createDefaultProject(['Unable to read project manifest; using defaults.'], [error.message]);
  }
}
