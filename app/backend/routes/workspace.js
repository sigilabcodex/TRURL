import path from 'node:path';
import { readMarkdownDirectory, saveManuscriptBody } from '../lib/manuscript.js';
import { loadProject } from '../lib/project.js';
import { mapById, toEntityRecord } from '../lib/story-bible.js';

export async function buildWorkspaceSnapshot(repoRoot) {
  const [project, manuscriptRaw, characterRaw, locationRaw, timelineRaw, notesRaw, revisionRaw] = await Promise.all([
    loadProject(repoRoot),
    readMarkdownDirectory(repoRoot, 'manuscript'),
    readMarkdownDirectory(repoRoot, path.join('story-bible', 'characters')),
    readMarkdownDirectory(repoRoot, path.join('story-bible', 'locations')),
    readMarkdownDirectory(repoRoot, path.join('story-bible', 'timeline')),
    readMarkdownDirectory(repoRoot, 'notes'),
    readMarkdownDirectory(repoRoot, 'revision'),
  ]);

  const chapters = manuscriptRaw
    .map((entry) => ({
      id: entry.frontmatter.id || entry.path,
      title: entry.frontmatter.title || entry.fileName,
      type: entry.frontmatter.type || 'chapter',
      order: Number.isFinite(entry.frontmatter.order) ? entry.frontmatter.order : null,
      status: entry.frontmatter.status || 'unknown',
      character_ids: entry.frontmatter.character_ids || [],
      location_ids: entry.frontmatter.location_ids || [],
      timeline_ids: entry.frontmatter.timeline_ids || [],
      source_text: entry.frontmatter.source_text || null,
      source_url: entry.frontmatter.source_url || null,
      path: entry.path,
      body: entry.body,
    }))
    .sort((a, b) => {
      if (a.order !== null && b.order !== null) return a.order - b.order;
      return a.path.localeCompare(b.path);
    });

  return {
    mode: 'local-repository',
    project,
    generatedAt: new Date().toISOString(),
    sections: {
      manuscript: chapters.length,
      storyBible: {
        characters: characterRaw.length,
        locations: locationRaw.length,
        timeline: timelineRaw.length,
      },
      notes: notesRaw.length,
      revision: revisionRaw.length,
    },
    chapters,
    entities: {
      characters: mapById(characterRaw.map((entry) => toEntityRecord(entry, 'character'))),
      locations: mapById(locationRaw.map((entry) => toEntityRecord(entry, 'location'))),
      timeline: mapById(timelineRaw.map((entry) => toEntityRecord(entry, 'timeline'))),
    },
  };
}

export async function handleWorkspaceRoute(req, res, context) {
  const { repoRoot, readJsonBody, sendJson } = context;

  if (req.url === '/api/workspace') {
    try {
      const snapshot = await buildWorkspaceSnapshot(repoRoot);
      sendJson(res, 200, snapshot);
    } catch (error) {
      sendJson(res, 500, { error: 'Failed to load local workspace.', detail: error.message });
    }
    return true;
  }

  if (req.method === 'POST' && req.url === '/api/save-manuscript') {
    try {
      const payload = await readJsonBody(req);
      const result = await saveManuscriptBody(repoRoot, payload.path, payload.body);
      sendJson(res, 200, { ok: true, ...result });
    } catch (error) {
      const status = /Path|Body|JSON/.test(error.message) ? 400 : 500;
      sendJson(res, status, { ok: false, error: error.message });
    }
    return true;
  }

  return false;
}
