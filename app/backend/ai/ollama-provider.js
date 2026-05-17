function buildPrompt(input) {
  return [
    'You are assisting with a Git-native longform writing project.',
    'Summarize the chapter without proposing edits or rewriting manuscript text.',
    'Return concise prose only.',
    '',
    `Chapter title: ${input.title || input.path}`,
    '',
    'Frontmatter:',
    JSON.stringify(input.frontmatter || {}, null, 2),
    '',
    'Linked story-bible entities:',
    JSON.stringify(input.linkedEntities || {}, null, 2),
    '',
    'Chapter body:',
    input.body,
  ].join('\n');
}

export function createOllamaProvider({ model, baseUrl }) {
  const providerModel = model || 'llama3.1';
  const providerBaseUrl = (baseUrl || 'http://localhost:11434').replace(/\/+$/, '');

  return {
    name: 'ollama',
    model: providerModel,
    async summarizeChapter(input) {
      if (typeof fetch !== 'function') {
        throw new Error('Ollama provider requires a Node.js runtime with fetch support.');
      }

      const response = await fetch(`${providerBaseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: providerModel,
          prompt: buildPrompt(input),
          stream: false,
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Ollama request failed (${response.status}): ${detail}`);
      }

      const payload = await response.json();
      return {
        summary: String(payload.response || '').trim(),
        notes: [],
      };
    },
  };
}
