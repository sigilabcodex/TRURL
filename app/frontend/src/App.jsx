import React, { useEffect, useMemo, useState } from 'react';
import { ContextPanel } from './components/ContextPanel.jsx';
import { EditorPanel } from './components/EditorPanel.jsx';
import { WorkspaceSidebar } from './components/WorkspaceSidebar.jsx';
import { resolveLinkedEntities } from './utils/context.js';

export function App() {
  const [workspace, setWorkspace] = useState(null);
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
    <div className="app-shell">
      <header className="topbar">
        <h1>{workspace?.project?.title || 'TRURL — Local Repository Workspace'}</h1>
        <span className="badge">Mode: {workspace?.mode || 'loading...'}</span>
      </header>

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
        <EditorPanel
          editorBody={editorBody}
          error={error}
          isDirty={isDirty}
          isEditing={isEditing}
          isFocusMode={isFocusMode}
          saveState={saveState}
          selectedChapter={selectedChapter}
          selectedChapterId={selectedChapterId}
          workspace={workspace}
          onEditorBodyChange={setEditorBody}
          onFocusModeChange={setIsFocusMode}
          onSave={handleSave}
          onSelectedChapterChange={setSelectedChapterId}
          onToggleEditing={() => setIsEditing((value) => !value)}
        />
        <ContextPanel
          documentPackage={documentPackage}
          gitDiff={gitDiff}
          gitError={gitError}
          gitState={gitState}
          gitStatus={gitStatus}
          linked={linked}
          outputTarget={outputTarget}
          packageError={packageError}
          packageState={packageState}
          selectedChapter={selectedChapter}
          stylePreset={stylePreset}
          validationError={validationError}
          validationResult={validationResult}
          validationState={validationState}
          onBuildPackage={handleBuildPackage}
          onGitRequest={handleGitRequest}
          onOutputTargetChange={setOutputTarget}
          onRunValidation={handleRunValidation}
          onStylePresetChange={setStylePreset}
        />
      </main>
    </div>
  );
}
