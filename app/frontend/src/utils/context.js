export function resolveLinkedEntities(selectedChapter, entities) {
  if (!selectedChapter || !entities) {
    return { characters: [], locations: [], timeline: [] };
  }

  const byIds = (ids, map) => ids
    .map((id) => map[id])
    .filter(Boolean);

  return {
    characters: byIds(selectedChapter.character_ids || [], entities.characters || {}),
    locations: byIds(selectedChapter.location_ids || [], entities.locations || {}),
    timeline: byIds(selectedChapter.timeline_ids || [], entities.timeline || {}),
  };
}
