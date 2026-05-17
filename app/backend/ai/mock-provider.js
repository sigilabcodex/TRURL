function firstBodyLines(body, limit = 2) {
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .slice(0, limit);
}

export function createMockProvider({ model }) {
  const providerModel = model || 'mock-summary-v1';

  return {
    name: 'mock',
    model: providerModel,
    async summarizeChapter(input) {
      const lines = firstBodyLines(input.body);
      const title = input.title || input.path;
      const linkedCount = Object.values(input.linkedEntities || {})
        .reduce((total, items) => total + items.length, 0);
      const preview = lines.length > 0 ? lines.join(' ') : 'No manuscript body text was available.';

      return {
        summary: `[mock:${providerModel}] ${title}: ${preview}`,
        notes: [
          `Frontmatter fields: ${Object.keys(input.frontmatter || {}).sort().join(', ') || 'none'}`,
          `Linked story-bible entities included: ${linkedCount}`,
        ],
      };
    },
  };
}
