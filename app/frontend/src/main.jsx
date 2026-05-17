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

function countLinkedEntities(packagePayload) {
  const linkedEntities = packagePayload?.package?.storyBible?.linkedEntities;
  if (!linkedEntities) {
    return { characters: 0, locations: 0, timeline: 0 };
  }

  return {
    characters: linkedEntities.characters?.length || 0,
    locations: linkedEntities.locations?.length || 0,
    timeline: linkedEntities.timeline?.length || 0,
  };
}

const validationActions = [
  { label: 'All Checks', endpoint: '/api/validate/all', primary: true },
  { label: 'Frontmatter', endpoint: '/api/validate/frontmatter' },
  { label: 'Crossrefs', endpoint: '/api/validate/crossrefs' },
  { label: 'Manuscript Order', endpoint: '/api/validate/manuscript-order' },
];

function App() {
  const [workspace, setWorkspace] = useState(null);
  const [activeSection, setActiveSection] = useState('Manuscript');
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editorBody, setEditorBody] = useState('');
  const [saveState, setSaveState] = useState('idle');
  const [error, setError] = useState(null);
  const [stylePreset, setStylePreset] = useState('editorial-default');
  const [outputTarget, setOutputTarget] = useState('html');
  const [packageState, setPackageState] = useState('idle');
  const [packageError, setPackageError] = useState(null);
  const [documentPackage, setDocumentPackage] = useState(null);
  const [validationState, setValidationState] = useState('idle');
  const [validationError, setValidationError] = useState(null);
  const [validationResult, setValidationResult] = useState(null);

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
      setDocumentPackage(null);
      setPackageState('idle');
      setPackageError(null);
    }
  }, [selectedChapterId, selectedChapter?.body, selectedChapter]);

  const isDirty = selectedChapter ? editorBody !== selectedChapter.body : false;
  const packageEntityCounts = countLinkedEntities(documentPackage);

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

  async function handleBuildPackage() {
    if (!selectedChapter) return;

    setPackageState('loading');
    setPackageError(null);

    try {
      const response = await fetch('/api/render/document-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: selectedChapter.path,
          stylePreset,
          outputTarget,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || `Package request failed (${response.status})`);
      }

      setDocumentPackage(payload);
      setPackageState('ready');
    } catch (buildError) {
      setPackageState('idle');
      setPackageError(buildError.message);
    }
  }

  async function handleRunValidation(endpoint) {
    setValidationState('loading');
    setValidationError(null);

    try {
      const response = await fetch(endpoint, { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || `Validation request failed (${response.status})`);
      }

      setValidationResult(payload);
      setValidationState('ready');
    } catch (validationRequestError) {
      setValidationState('idle');
      setValidationError(validationRequestError.message);
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
          <section className="render-package">
            <div className="render-package-header">
              <div>
                <h3>Render Package</h3>
                <p>Mock TRURL package preview. No OSER render.</p>
              </div>
              <span className="mock-badge">mock</span>
            </div>

            <div className="package-controls">
              <label>
                <span>Style preset</span>
                <input
                  type="text"
                  value={stylePreset}
                  onChange={(event) => setStylePreset(event.target.value)}
                  placeholder="editorial-default"
                />
              </label>
              <label>
                <span>Output target</span>
                <select
                  value={outputTarget}
                  onChange={(event) => setOutputTarget(event.target.value)}
                >
                  <option value="html">html</option>
                  <option value="pdf">pdf</option>
                  <option value="epub">epub</option>
                  <option value="web">web</option>
                </select>
              </label>
              <button
                type="button"
                onClick={handleBuildPackage}
                disabled={!selectedChapter || packageState === 'loading'}
              >
                {packageState === 'loading' ? 'Building...' : 'Build Package'}
              </button>
            </div>

            {packageError && <p className="error">Package failed: {packageError}</p>}

            {documentPackage ? (
              <div className="package-summary">
                <dl>
                  <dt>Schema</dt>
                  <dd>{documentPackage.package.schema}</dd>
                  <dt>Mode</dt>
                  <dd>{documentPackage.mode}</dd>
                  <dt>Target</dt>
                  <dd>{documentPackage.package.output.target}</dd>
                  <dt>Output path</dt>
                  <dd><code>{documentPackage.package.output.path}</code></dd>
                  <dt>Selected</dt>
                  <dd>{documentPackage.package.manuscript.selected.title}</dd>
                  <dt>Source path</dt>
                  <dd><code>{documentPackage.package.manuscript.selected.path}</code></dd>
                  <dt>Entities</dt>
                  <dd>
                    {packageEntityCounts.characters} characters, {' '}
                    {packageEntityCounts.locations} locations, {' '}
                    {packageEntityCounts.timeline} timeline
                  </dd>
                  <dt>Style preset</dt>
                  <dd>{documentPackage.package.style.preset}</dd>
                  <dt>Warnings</dt>
                  <dd>{documentPackage.warnings.length ? documentPackage.warnings.join(', ') : 'none'}</dd>
                </dl>

                <details>
                  <summary>JSON preview</summary>
                  <pre className="package-json">
                    {JSON.stringify(documentPackage.package, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <p className="package-empty">
                {selectedChapter ? `Ready for ${selectedChapter.path}` : 'Select a chapter first.'}
              </p>
            )}
          </section>
          <section className="validation-panel">
            <div className="render-package-header">
              <div>
                <h3>Validation</h3>
                <p>Read-only repository health checks.</p>
              </div>
              {validationResult && (
                <span className={`status-badge ${validationResult.ok ? 'ok' : 'fail'}`}>
                  {validationResult.ok ? 'ok' : 'fail'}
                </span>
              )}
            </div>

            <div className="validation-controls">
              {validationActions.map((action) => (
                <button
                  key={action.endpoint}
                  type="button"
                  className={action.primary ? 'primary' : ''}
                  onClick={() => handleRunValidation(action.endpoint)}
                  disabled={validationState === 'loading'}
                >
                  {validationState === 'loading' ? 'Running...' : action.label}
                </button>
              ))}
            </div>

            {validationError && <p className="error">Validation failed: {validationError}</p>}

            {validationResult ? (
              <div className="validation-results">
                <p className={`validation-overall ${validationResult.ok ? 'ok' : 'fail'}`}>
                  Overall: {validationResult.ok ? 'passed' : 'failed'}
                </p>
                <ul>
                  {validationResult.checks.map((check) => (
                    <li key={check.name}>
                      <div className="validation-check-header">
                        <strong>{check.name}</strong>
                        <code>exit {check.exitCode}</code>
                      </div>
                      {check.stdout && (
                        <pre>{check.stdout}</pre>
                      )}
                      {check.stderr && (
                        <pre className="stderr">{check.stderr}</pre>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="package-empty">Run checks manually before edits or exports.</p>
            )}
          </section>
        </aside>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
