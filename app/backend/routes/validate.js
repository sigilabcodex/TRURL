import { runValidationChecks, validationChecks, validationOrder } from '../lib/validation.js';

export async function handleValidateRoute(req, res, context) {
  const { repoRoot, sendJson } = context;

  if (req.method === 'POST' && req.url === '/api/validate/frontmatter') {
    const result = await runValidationChecks(repoRoot, [validationChecks.frontmatter]);
    sendJson(res, 200, result);
    return true;
  }

  if (req.method === 'POST' && req.url === '/api/validate/crossrefs') {
    const result = await runValidationChecks(repoRoot, [validationChecks.crossrefs]);
    sendJson(res, 200, result);
    return true;
  }

  if (req.method === 'POST' && req.url === '/api/validate/manuscript-order') {
    const result = await runValidationChecks(repoRoot, [validationChecks.manuscriptOrder]);
    sendJson(res, 200, result);
    return true;
  }

  if (req.method === 'POST' && req.url === '/api/validate/all') {
    const result = await runValidationChecks(repoRoot, validationOrder);
    sendJson(res, 200, result);
    return true;
  }

  return false;
}
