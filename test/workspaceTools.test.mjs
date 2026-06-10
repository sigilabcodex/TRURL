import assert from 'node:assert/strict';
import test from 'node:test';
import { WORKSPACE_TOOLS, isWorkspaceToolId, toggleWorkspaceTool } from '../app/frontend/src/utils/workspaceTools.js';

test('workspace tools expose the expected global tool IDs', () => {
  assert.deepEqual(WORKSPACE_TOOLS.map((tool) => tool.id), [
    'render',
    'validation',
    'git',
  ]);
});

test('workspace tool validation only accepts known tool IDs', () => {
  assert.equal(isWorkspaceToolId('render'), true);
  assert.equal(isWorkspaceToolId('validation'), true);
  assert.equal(isWorkspaceToolId('git'), true);
  assert.equal(isWorkspaceToolId('theme'), false);
});

test('toggleWorkspaceTool opens, closes, and rejects invalid tools', () => {
  assert.equal(toggleWorkspaceTool(null, 'render'), 'render');
  assert.equal(toggleWorkspaceTool('render', 'render'), null);
  assert.equal(toggleWorkspaceTool('render', 'git'), 'git');
  assert.equal(toggleWorkspaceTool('git', 'unknown'), null);
});
