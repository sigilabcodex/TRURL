export const WORKSPACE_TOOLS = [
  { id: 'render', label: 'Render' },
  { id: 'validation', label: 'Validation' },
  { id: 'git', label: 'Git' },
];

const workspaceToolIds = new Set(WORKSPACE_TOOLS.map((tool) => tool.id));

export function isWorkspaceToolId(toolId) {
  return workspaceToolIds.has(toolId);
}

export function toggleWorkspaceTool(currentToolId, nextToolId) {
  if (!isWorkspaceToolId(nextToolId)) {
    return null;
  }

  return currentToolId === nextToolId ? null : nextToolId;
}
