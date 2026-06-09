import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleAiRoute } from './routes/ai.js';
import { handleExportRoute } from './routes/export.js';
import { handleGitRoute } from './routes/git.js';
import { handleRenderRoute } from './routes/render.js';
import { handleValidateRoute } from './routes/validate.js';
import { handleWorkspaceRoute } from './routes/workspace.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const port = Number(process.env.PORT || 4177);

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error('Invalid JSON body.');
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

const routeHandlers = [
  handleWorkspaceRoute,
  handleAiRoute,
  handleRenderRoute,
  handleValidateRoute,
  handleExportRoute,
  handleGitRoute,
];

const context = {
  repoRoot,
  readJsonBody,
  sendJson,
};

const server = http.createServer(async (req, res) => {
  for (const handleRoute of routeHandlers) {
    if (await handleRoute(req, res, context)) {
      return;
    }
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(port, () => {
  console.log(`TRURL backend listening on http://localhost:${port}`);
});
