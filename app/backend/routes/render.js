import { buildDocumentPackage } from '../lib/render-package.js';

export async function handleRenderRoute(req, res, context) {
  const { repoRoot, readJsonBody, sendJson } = context;

  if (req.method === 'POST' && req.url === '/api/render/document-package') {
    try {
      const payload = await readJsonBody(req);
      const result = await buildDocumentPackage(repoRoot, payload);
      sendJson(res, 200, result);
    } catch (error) {
      const status = /Path|JSON/.test(error.message) ? 400 : 500;
      sendJson(res, status, { ok: false, error: error.message });
    }
    return true;
  }

  return false;
}
