import React, { useEffect, useMemo, useState } from 'react';
import { ContextPanel } from './components/ContextPanel.jsx';
import { EditorPanel } from './components/EditorPanel.jsx';
import { GitPanel } from './components/GitPanel.jsx';
import { OutlinerView } from './components/OutlinerView.jsx';
import { RenderPackagePanel } from './components/RenderPackagePanel.jsx';
import { TransportBar } from './components/TransportBar.jsx';
import { ValidationPanel } from './components/ValidationPanel.jsx';
import { WorkspaceSidebar } from './components/WorkspaceSidebar.jsx';
import { resolveLinkedEntities } from './utils/context.js';
import { DEFAULT_THEME_ID, THEMES, normalizeThemeId } from './utils/themes.js';
import { toggleWorkspaceTool } from './utils/workspaceTools.js';

const THEME_STORAGE_KEY = 'trurl.theme';

function getInitialThemeId() {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME_ID;
  }

  try {
    return normalizeThemeId(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_THEME_ID;
  }
}

export function App() {
  const [workspace, setWorkspace] = useState(null);
  const [themeId, setThemeId] = useState(getInitialThemeId);
  const [activeTool, setActiveTool] = useState(null);
  const [activeView, setActiveView] = useState('write');
  const [activeSection, setActiveSection] = useState('Manuscript');
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
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
  const [gitState, setGitState] = useState('idle');
  const [gitError, setGitError] = useState(null);
  const [gitStatus, setGitStatus] = useState(null);
  const [gitDiff, setGitDiff] = useState(null);

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

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeId);
    } catch {
      // Theme persistence is a local preference; the UI can still run without storage.
    }
  }, [themeId]);

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

  async function handleGitRequest(endpoint, target) {
    setGitState('loading');
    setGitError(null);

    try {
      const response = await fetch(endpoint);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || `Git request failed (${response.status})`);
      }

      if (target === 'status') {
        setGitStatus(payload);
      } else {
        setGitDiff(payload);
      }
      setGitState('ready');
    } catch (gitRequestError) {
      setGitState('idle');
      setGitError(gitRequestError.message);
    }
  }

  return (
    <div className="app-shell" data-theme={themeId}>
      <header className="topbar">
        <h1>TRURL</h1>
        <span className="badge">Mode: {workspace?.mode || 'loading...'}</span>
      </header>

      <TransportBar
        activeTool={activeTool}
        activeView={activeView}
        isDirty={isDirty}
        isFocusMode={isFocusMode}
        project={workspace?.project}
        saveState={saveState}
        selectedChapter={selectedChapter}
        themeId={themeId}
        themes={THEMES}
        onFocusModeChange={setIsFocusMode}
        onThemeChange={setThemeId}
        onViewChange={setActiveView}
        onToolChange={(toolId) => setActiveTool((currentToolId) => toggleWorkspaceTool(currentToolId, toolId))}
      />

      {activeTool && (
        <section className={`workspace-tools-drawer ${isFocusMode ? 'focus-mode' : ''}`}>
          <div className="workspace-tools-shell">
            {activeTool === 'render' && (
              <RenderPackagePanel
                documentPackage={documentPackage}
                outputTarget={outputTarget}
                packageError={packageError}
                packageState={packageState}
                selectedChapter={selectedChapter}
                stylePreset={stylePreset}
                onBuildPackage={handleBuildPackage}
                onOutputTargetChange={setOutputTarget}
                onStylePresetChange={setStylePreset}
              />
            )}
            {activeTool === 'validation' && (
              <ValidationPanel
                chapters={workspace?.chapters || []}
                validationError={validationError}
                validationResult={validationResult}
                validationState={validationState}
                onRunValidation={handleRunValidation}
              />
            )}
            {activeTool === 'git' && (
              <GitPanel
                gitDiff={gitDiff}
                gitError={gitError}
                gitState={gitState}
                gitStatus={gitStatus}
                onGitRequest={handleGitRequest}
              />
            )}
          </div>
        </section>
      )}

      <main className={`workspace-grid ${isFocusMode ? 'focus-mode' : ''}`}>
        <WorkspaceSidebar
          activeSection={activeSection}
          currentDocument={workspace?.project?.currentDocument}
          isEditing={isEditing}
          selectedChapter={selectedChapter}
          project={workspace?.project}
          sections={workspace?.sections}
          onActiveSectionChange={setActiveSection}
        />
        {activeView === 'outliner' ? (
          <OutlinerView
            chapters={workspace?.chapters || []}
            selectedChapterId={selectedChapterId}
            onSelectedChapterChange={setSelectedChapterId}
            onViewChange={setActiveView}
          />
        ) : (
          <EditorPanel
            editorBody={editorBody}
            error={error}
            isDirty={isDirty}
            isEditing={isEditing}
            saveState={saveState}
            selectedChapter={selectedChapter}
            selectedChapterId={selectedChapterId}
            workspace={workspace}
            onEditorBodyChange={setEditorBody}
            onSave={handleSave}
            onSelectedChapterChange={setSelectedChapterId}
            onToggleEditing={() => setIsEditing((value) => !value)}
          />
        )}
        <ContextPanel
          linked={linked}
          selectedChapter={selectedChapter}
        />
      </main>
    </div>
  );
}
