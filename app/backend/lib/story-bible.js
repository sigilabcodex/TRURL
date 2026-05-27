import path from 'node:path';
import { readMarkdownDirectory } from './manuscript.js';

function summarizeBody(body) {
  return body
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !line.startsWith('#')) || 'No summary text available.';
}

export function toEntityRecord(entry, kind) {
  const meta = entry.frontmatter;
  return {
    id: meta.id || entry.path,
    type: meta.type || kind,
    name: meta.name || meta.label || entry.fileName,
    label: meta.label || null,
    status: meta.status || 'unknown',
    canon: meta.canon || null,
    first_appearance: meta.first_appearance || null,
    source_manuscript: meta.source_manuscript || null,
    path: entry.path,
    summary: summarizeBody(entry.body),
    body: entry.body,
  };
}

export const mapById = (records) => Object.fromEntries(records.map((record) => [record.id, record]));

export function resolveIds(ids, recordsById) {
  return (Array.isArray(ids) ? ids : [])
    .map((id) => recordsById[id])
    .filter(Boolean);
}

export async function loadStoryBibleRaw(repoRoot) {
  const [characterRaw, locationRaw, timelineRaw] = await Promise.all([
    readMarkdownDirectory(repoRoot, path.join('story-bible', 'characters')),
    readMarkdownDirectory(repoRoot, path.join('story-bible', 'locations')),
    readMarkdownDirectory(repoRoot, path.join('story-bible', 'timeline')),
  ]);

  return { characterRaw, locationRaw, timelineRaw };
}

export async function loadLinkedStoryBibleEntities(repoRoot, frontmatter) {
  const { characterRaw, locationRaw, timelineRaw } = await loadStoryBibleRaw(repoRoot);
  const characters = mapById(characterRaw.map((entry) => toEntityRecord(entry, 'character')));
  const locations = mapById(locationRaw.map((entry) => toEntityRecord(entry, 'location')));
  const timeline = mapById(timelineRaw.map((entry) => toEntityRecord(entry, 'timeline')));

  return {
    characters: resolveIds(frontmatter.character_ids, characters),
    locations: resolveIds(frontmatter.location_ids, locations),
    timeline: resolveIds(frontmatter.timeline_ids, timeline),
  };
}
