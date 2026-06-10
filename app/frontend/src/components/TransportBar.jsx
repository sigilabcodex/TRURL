import React from 'react';
import { DocumentSelector } from './DocumentSelector.jsx';
import { WORKSPACE_TOOLS } from '../utils/workspaceTools.js';

function getSaveLabel({ isDirty, saveState }) {
  if (saveState === 'saving') return 'Saving';
  if (isDirty) return 'Unsaved';
  if (saveState === 'saved') return 'Saved';
  return 'Clean';
}

export function TransportBar({
  activeTool,
  activeView,
  isDirty,
  isFocusMode,
  project,
  saveState,
  selectedChapter,
  themeId,
  themes,
  onFocusModeChange,
  onThemeChange,
  onViewChange,
  onToolChange,
}) {
  const saveLabel = getSaveLabel({ isDirty, saveState });

  return (
    <section className="transport-bar" aria-label="Workspace command bar">
      <div className="transport-context">
        <div>
          <span className="transport-label">Project</span>
          <strong>{project?.title || 'TRURL Workspace'}</strong>
        </div>
        <DocumentSelector project={project} isFocusMode={isFocusMode} />
        <div className="transport-chapter">
          <span className="transport-label">Chapter</span>
          <strong>{selectedChapter?.title || 'No chapter selected'}</strong>
          {selectedChapter?.path && <code>{selectedChapter.path}</code>}
        </div>
        <div className={`transport-save ${isDirty ? 'dirty' : saveState}`}>
          <span className="transport-label">Save</span>
          <strong>{saveLabel}</strong>
        </div>
      </div>

      <div className="transport-actions">
        {!isFocusMode && (
          <div className="transport-view-toggle" aria-label="Workspace view">
            <button
              className={activeView === 'write' ? 'active' : ''}
              type="button"
              onClick={() => onViewChange('write')}
            >
              Write
            </button>
            <button
              className={activeView === 'outliner' ? 'active' : ''}
              type="button"
              onClick={() => onViewChange('outliner')}
            >
              Outliner
            </button>
          </div>
        )}
        <label className="transport-theme">
          <span>Theme</span>
          <select
            value={themeId}
            onChange={(event) => onThemeChange(event.target.value)}
          >
            {themes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.label}
              </option>
            ))}
          </select>
        </label>
        <button
          className={`focus-toggle ${isFocusMode ? 'active' : ''}`}
          type="button"
          onClick={() => onFocusModeChange(!isFocusMode)}
        >
          {isFocusMode ? 'Exit Focus' : 'Focus'}
        </button>
        <div className="transport-tool-tabs" aria-label="Workspace tools">
          {WORKSPACE_TOOLS.map((tool) => (
            <button
              key={tool.id}
              className={activeTool === tool.id ? 'active' : ''}
              type="button"
              onClick={() => onToolChange(tool.id)}
              aria-expanded={activeTool === tool.id}
            >
              {tool.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
