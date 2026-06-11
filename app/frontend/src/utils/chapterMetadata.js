export const EMPTY_METADATA_VALUE = '—';

const KNOWN_STATUSES = new Set(['draft', 'revised', 'locked', 'deprecated']);
const KNOWN_TYPES = new Set(['chapter', 'scene', 'interlude', 'appendix', 'fragment']);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isPresent(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function firstPresent(...values) {
  return values.find(isPresent);
}

function display(value) {
  return isPresent(value) ? String(value) : EMPTY_METADATA_VALUE;
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value
      .filter(isPresent)
      .map((item) => String(item).trim());
  }

  if (!isPresent(value)) {
    return [];
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getRawMetadata(chapter) {
  return isPlainObject(chapter?.metadata) ? chapter.metadata : {};
}

export function getChapterStatus(chapter) {
  const metadata = getRawMetadata(chapter);
  return display(firstPresent(metadata.status, chapter?.status));
}

export function getChapterType(chapter) {
  const metadata = getRawMetadata(chapter);
  return display(firstPresent(metadata.type, chapter?.type));
}

export function getChapterSource(chapter) {
  const metadata = getRawMetadata(chapter);
  return {
    text: display(firstPresent(metadata.source, metadata.source_text, chapter?.source, chapter?.source_text)),
    url: display(firstPresent(metadata.source_url, chapter?.source_url)),
  };
}

export function getChapterTags(chapter) {
  return normalizeList(getRawMetadata(chapter).tags);
}

export function getChapterParticipants(chapter) {
  const metadata = getRawMetadata(chapter);

  return {
    characters: normalizeList(firstPresent(metadata.characters, metadata.character_ids, chapter?.characters, chapter?.character_ids)),
    locations: normalizeList(firstPresent(metadata.locations, metadata.location_ids, chapter?.locations, chapter?.location_ids)),
    timeline: normalizeList(firstPresent(metadata.timeline, metadata.timeline_ids, chapter?.timeline, chapter?.timeline_ids)),
  };
}

export function normalizeChapterMetadata(chapter) {
  const metadata = getRawMetadata(chapter);
  const status = getChapterStatus(chapter);
  const type = getChapterType(chapter);
  const source = getChapterSource(chapter);
  const tags = getChapterTags(chapter);
  const participants = getChapterParticipants(chapter);
  const warnings = [];

  if (!isPresent(metadata.id)) {
    warnings.push('Missing frontmatter id.');
  }

  if (!isPresent(metadata.title)) {
    warnings.push('Missing frontmatter title.');
  }

  if (status === EMPTY_METADATA_VALUE || !KNOWN_STATUSES.has(status)) {
    warnings.push(status === EMPTY_METADATA_VALUE ? 'Missing status.' : `Unknown status: ${status}.`);
  }

  if (type === EMPTY_METADATA_VALUE || !KNOWN_TYPES.has(type)) {
    warnings.push(type === EMPTY_METADATA_VALUE ? 'Missing type.' : `Unknown type: ${type}.`);
  }

  return {
    id: display(firstPresent(metadata.id, chapter?.id)),
    title: display(firstPresent(metadata.title, chapter?.title)),
    type,
    status,
    path: display(chapter?.path),
    canon: display(metadata.canon),
    source,
    pov: display(metadata.pov),
    location: display(metadata.location),
    tags,
    summary: display(metadata.summary),
    revisionNotes: display(metadata.revision_notes),
    participants,
    warnings,
  };
}

export function getChapterMetadataRows(chapter) {
  const metadata = normalizeChapterMetadata(chapter);

  return [
    { key: 'title', label: 'Title', value: metadata.title },
    { key: 'id', label: 'ID', value: metadata.id, code: true },
    { key: 'type', label: 'Type', value: metadata.type },
    { key: 'status', label: 'Status', value: metadata.status },
    { key: 'path', label: 'Path', value: metadata.path, code: true },
    { key: 'source', label: 'Source', value: metadata.source.text },
    { key: 'source_url', label: 'Source URL', value: metadata.source.url, code: metadata.source.url !== EMPTY_METADATA_VALUE },
    { key: 'canon', label: 'Canon', value: metadata.canon },
    { key: 'tags', label: 'Tags', value: metadata.tags.length > 0 ? metadata.tags.join(', ') : EMPTY_METADATA_VALUE },
    { key: 'summary', label: 'Summary', value: metadata.summary },
  ];
}
