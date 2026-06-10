import React from 'react';

const repositorySections = [
  { key: 'Manuscript', countKey: 'manuscript' },
  { key: 'Story Bible', countKey: 'storyBible' },
  { key: 'Notes', countKey: 'notes' },
  { key: 'Revision', countKey: 'revision' },
  { key: 'AI', countKey: null },
  { key: 'Validation', countKey: null },
];

function renderCount(sectionKey, sections) {
  if (!sections) {
    return '...';
  }

  if (sectionKey === 'storyBible') {
    const total = sections.storyBible.characters + sections.storyBible.locations + sections.storyBible.timeline;
    return total;
  }

  return sections[sectionKey] ?? '—';
}

export function WorkspaceSidebar({
  activeSection,
  currentDocument,
  isEditing,
  project,
  selectedChapter,
  sections,
  themeId,
  themes,
  onActiveSectionChange,
  onThemeChange,
}) {
  return (
    <aside className="panel sidebar">
      <h2>{project?.title || 'Repository'}</h2>
      {project?.source && (
        <p className="project-source">Project: {project.source}</p>
      )}
      {project?.warnings?.length > 0 && (
        <p className="project-warning">Project manifest warning</p>
      )}
      <nav>
        <ul>
          {repositorySections.map((section) => {
            const isActive = section.key === activeSection;
            const count = section.countKey ? renderCount(section.countKey, sections) : 'next';
            return (
              <li key={section.key}>
                <button
                  type="button"
                  className={isActive ? 'active' : ''}
                  onClick={() => onActiveSectionChange(section.key)}
                >
                  <span>{section.key}</span>
                  <small>{count}</small>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="workspace-state">
        <h3>Workspace State</h3>
        <p><strong>Project:</strong> {project?.title || 'none'}</p>
        <p><strong>Document:</strong> {currentDocument?.title || 'none'}</p>
        <p><strong>Manuscript:</strong> {currentDocument?.manuscriptPath || 'manuscript'}</p>
        <p><strong>Story Bible:</strong> {currentDocument?.storyBiblePath || 'story-bible'}</p>
        <p><strong>Section:</strong> {activeSection}</p>
        <p><strong>Selected:</strong> {selectedChapter?.path || 'none'}</p>
        <p><strong>Local:</strong> repository-backed {isEditing ? 'edit' : 'read'} mode</p>
        <label className="theme-selector">
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
      </div>
    </aside>
  );
}
