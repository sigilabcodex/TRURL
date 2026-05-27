import { createAiProvider } from '../ai/index.js';
import { loadManuscriptChapter } from '../lib/manuscript.js';
import { loadLinkedStoryBibleEntities } from '../lib/story-bible.js';

async function summarizeChapter(repoRoot, relativePath) {
  const chapter = await loadManuscriptChapter(repoRoot, relativePath);
  const linkedEntities = await loadLinkedStoryBibleEntities(repoRoot, chapter.frontmatter);
  const provider = createAiProvider();
  const result = await provider.summarizeChapter({
    ...chapter,
    linkedEntities,
  });

  return {
    ok: true,
    provider: provider.name,
    model: provider.model,
    summary: result.summary,
    notes: result.notes || [],
  };
}

export async function handleAiRoute(req, res, context) {
  const { repoRoot, readJsonBody, sendJson } = context;

  if (req.method === 'POST' && req.url === '/api/ai/summarize-chapter') {
    try {
      const payload = await readJsonBody(req);
      const result = await summarizeChapter(repoRoot, payload.path);
      sendJson(res, 200, result);
    } catch (error) {
      const status = /Path|JSON|Unsupported AI provider/.test(error.message) ? 400 : 500;
      sendJson(res, status, { ok: false, error: error.message });
    }
    return true;
  }

  return false;
}
