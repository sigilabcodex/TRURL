import { normalizeChapterMetadata } from './chapterMetadata.js';
import { getChapterMetadataHealth } from './metadataHealth.js';

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

export function getChapterWordCount(chapter) {
  const body = typeof chapter?.body === 'string' ? chapter.body.trim() : '';
  if (!body) {
    return 0;
  }

  return body.split(/\s+/).filter(Boolean).length;
}

export function getOutlinerRows(chapters = []) {
  return toArray(chapters).map((chapter, index) => {
    const metadata = normalizeChapterMetadata(chapter);
    const health = getChapterMetadataHealth(chapter);

    return {
      id: chapter?.id || chapter?.path || String(index),
      order: Number.isFinite(chapter?.order) ? chapter.order : null,
      index: index + 1,
      title: metadata.title === '—' ? 'Untitled' : metadata.title,
      path: chapter?.path || '',
      status: metadata.status,
      type: metadata.type,
      canon: metadata.canon,
      sourceText: metadata.source.text,
      sourceUrl: metadata.source.url,
      tags: metadata.tags,
      metadataWarnings: metadata.warnings,
      metadataHealth: health,
      wordCount: getChapterWordCount(chapter),
      linkedCharacters: metadata.participants.characters.length,
      linkedLocations: metadata.participants.locations.length,
      timelineSignals: metadata.participants.timeline.length,
    };
  });
}

export function summarizeOutliner(rows = []) {
  const safeRows = toArray(rows);

  return {
    totalChapters: safeRows.length,
    totalWords: safeRows.reduce((total, row) => total + (Number.isFinite(row?.wordCount) ? row.wordCount : 0), 0),
    chaptersWithCharacters: safeRows.filter((row) => (row?.linkedCharacters || 0) > 0).length,
    chaptersWithTimeline: safeRows.filter((row) => (row?.timelineSignals || 0) > 0).length,
  };
}
