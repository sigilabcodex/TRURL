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
  return toArray(chapters).map((chapter, index) => ({
    id: chapter?.id || chapter?.path || String(index),
    order: Number.isFinite(chapter?.order) ? chapter.order : null,
    index: index + 1,
    title: chapter?.title || 'Untitled',
    path: chapter?.path || '',
    status: chapter?.status || '',
    type: chapter?.type || '',
    sourceText: chapter?.source_text || '',
    sourceUrl: chapter?.source_url || '',
    wordCount: getChapterWordCount(chapter),
    linkedCharacters: toArray(chapter?.character_ids).length,
    linkedLocations: toArray(chapter?.location_ids).length,
    timelineSignals: toArray(chapter?.timeline_ids).length,
  }));
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
