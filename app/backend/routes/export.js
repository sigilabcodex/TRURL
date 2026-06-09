import { runOserExport } from '../render/export-oser.js';

export async function handleExportRoute(req, res, context) {
  const { sendJson } = context;

  if (req.method === 'POST' && req.url === '/api/export/oser') {
    try {
      const result = await runOserExport();
      sendJson(res, result && result.ok ? 200 : 500, result);
    } catch (error) {
      const diagnostics = error && typeof error === 'object' && error.diagnostics ? error.diagnostics : null;
      sendJson(res, 500, diagnostics || { ok: false, error: error.message });
    }
    return true;
  }

  return false;
}
