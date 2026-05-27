import { gitCommands, runGitCommands } from '../lib/git.js';

export async function handleGitRoute(req, res, context) {
  const { repoRoot, sendJson } = context;

  if (req.method === 'GET' && req.url === '/api/git/status') {
    const result = await runGitCommands(repoRoot, [gitCommands.status]);
    sendJson(res, 200, result);
    return true;
  }

  if (req.method === 'GET' && req.url === '/api/git/diff') {
    const result = await runGitCommands(repoRoot, [gitCommands.diffStat, gitCommands.diffScoped]);
    sendJson(res, 200, result);
    return true;
  }

  return false;
}
