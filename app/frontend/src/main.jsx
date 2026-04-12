import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

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

function resolveLinkedEntities(selectedChapter, entities) {
  if (!selectedChapter || !entities) {
    return { characters: [], locations: [], timeline: [] };
  }

  const byIds = (ids, map) => ids
    .map((id) => map[id])
    .filter(Boolean);

  return {
    characters: byIds(selectedChapter.character_ids || [], entities.characters || {}),
    locations: byIds(selectedChapter.location_ids || [], entities.locations || {}),
    timeline: byIds(selectedChapter.timeline_ids || [], entities.timeline || {}),
  };
}

function App() {
  const [workspace, setWorkspace] = useState(null);
  const [activeSection, setActiveSection] = useState('Manuscript');
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editorBody, setEditorBody] = useState('');
  const [saveState, setSaveState] = useState('idle');
  const [error, setError] = useState(null);

  async function loadWorkspace(preferredChapterId = null) {
    try {
      const response = await fetch('/api/workspace');
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const payload = await response.json();
      setWorkspace(payload);
      setError(null);

      if (payload.chapters.length === 0) {
        setSelectedChapterId(null);
        return;
      }

      const hasPreferred = preferredChapterId
        && payload.chapters.some((chapter) => chapter.id === preferredChapterId);
      setSelectedChapterId(hasPreferred ? preferredChapterId : payload.chapters[0].id);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    loadWorkspace();
  }, []);

  const selectedChapter = useMemo(() => (
    workspace?.chapters.find((chapter) => chapter.id === selectedChapterId) || null
  ), [workspace, selectedChapterId]);

  const linked = useMemo(
    () => resolveLinkedEntities(selectedChapter, workspace?.entities),
    [selectedChapter, workspace],
  );

  useEffect(() => {
    if (selectedChapter) {
      setEditorBody(selectedChapter.body);
      setSaveState('idle');
      setIsEditing(false);
    }
  }, [selectedChapterId, selectedChapter?.body, selectedChapter]);

  const isDirty = selectedChapter ? editorBody !== selectedChapter.body : false;

  async function handleSave() {
    if (!selectedChapter || !isEditing) return;

    setSaveState('saving');
    setError(null);

    try {
      const response = await fetch('/api/save-manuscript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: selectedChapter.path,
          body: editorBody,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || `Save failed (${response.status})`);
      }

      await loadWorkspace(selectedChapter.id);
      setSaveState('saved');
      setIsEditing(false);
    } catch (saveError) {
      setSaveState('idle');
      setError(saveError.message);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>TRURL — Local Repository Workspace</h1>
        <span className="badge">Mode: {workspace?.mode || 'loading...'}</span>
      </header>

      <main className="workspace-grid">
        <aside className="panel sidebar">
          <h2>Repository</h2>
          <nav>
            <ul>
              {repositorySections.map((section) => {
                const isActive = section.key === activeSection;
                const count = section.countKey ? renderCount(section.countKey, workspace?.sections) : 'next';
                return (
                  <li key={section.key}>
                    <button
                      type="button"
                      className={isActive ? 'active' : ''}
                      onClick={() => setActiveSection(section.key)}
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
            <p><strong>Section:</strong> {activeSection}</p>
            <p><strong>Selected:</strong> {selectedChapter?.path || 'none'}</p>
            <p><strong>Local:</strong> repository-backed {isEditing ? 'edit' : 'read'} mode</p>
          </div>
        </aside>

        <section className="panel editor">
          <div className="editor-header">
            <h2>Manuscript</h2>
            <p>
              {workspace
                ? `${workspace.chapters.length} chapter file(s) loaded`
                : 'Loading repository index...'}
            </p>
          </div>

          {error && <p className="error">Failed to load workspace: {error}</p>}

          <div className="chapter-layout">
            <div className="chapter-list">
              <h3>Chapters</h3>
              <ul>
                {(workspace?.chapters || []).map((chapter) => (
                  <li
                    key={chapter.id}
                    className={selectedChapterId === chapter.id ? 'selected' : ''}
                    onClick={() => setSelectedChapterId(chapter.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        setSelectedChapterId(chapter.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                  >
                    <strong>{chapter.order ?? '—'}. {chapter.title}</strong>
                    <span>Status: {chapter.status}</span>
                    <span className="path">{chapter.path}</span>
                  </li>
                ))}
              </ul>
            </div>

            <article className="chapter-content">
              {selectedChapter ? (
                <>
                  <div className="chapter-content-header">
                    <h3>{selectedChapter.title}</h3>
                    <div className="chapter-controls">
                      <span className={`dirty-indicator ${isDirty ? 'dirty' : ''}`}>
                        {isDirty ? 'Unsaved changes' : saveState === 'saved' ? 'Saved' : 'No changes'}
                      </span>
                      <button type="button" onClick={() => setIsEditing((value) => !value)}>
                        {isEditing ? 'Cancel' : 'Edit'}
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={!isEditing || !isDirty || saveState === 'saving'}
                      >
                        {saveState === 'saving' ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                  <div className="chapter-meta">
                    <span>ID: {selectedChapter.id}</span>
                    <span>Type: {selectedChapter.type}</span>
                    <span>Status: {selectedChapter.status}</span>
                  </div>
                  {isEditing ? (
                    <textarea
                      className="chapter-editor"
                      value={editorBody}
                      onChange={(event) => setEditorBody(event.target.value)}
                    />
                  ) : (
                    <pre>{selectedChapter.body}</pre>
                  )}
                </>
              ) : (
                <p>Select a manuscript chapter to view its content.</p>
              )}
            </article>
          </div>
        </section>

        <aside className="panel metadata">
          <h2>Context</h2>
          <section>
            <h3>Linked Characters</h3>
            <ul>
              {linked.characters.map((item) => (
                <li key={item.id}>
                  <strong>{item.name}</strong>
                  <small>{item.status}</small>
                  <p>{item.summary}</p>
                  {item.first_appearance && <code>{item.first_appearance}</code>}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3>Linked Locations</h3>
            <ul>
              {linked.locations.map((item) => (
                <li key={item.id}>
                  <strong>{item.name}</strong>
                  <small>{item.status}</small>
                  <p>{item.summary}</p>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3>Timeline Signals</h3>
            <ul>
              {linked.timeline.map((item) => (
                <li key={item.id}>
                  <strong>{item.label || item.name}</strong>
                  <small>{item.status}</small>
                  <p>{item.summary}</p>
                  {item.source_manuscript && <code>{item.source_manuscript}</code>}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
