import React, { useMemo, useRef, useState } from 'react';
import { renderMarkdownPreview } from '../utils/markdownPreview.js';

const WORDS_PER_MINUTE = 225;

function getEditorStats(body) {
  const trimmed = body.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;

  return {
    words,
    characters: body.length,
    readingMinutes: Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)),
  };
}

function getSaveLabel({ isDirty, saveState }) {
  if (saveState === 'saving') return 'Saving';
  if (isDirty) return 'Unsaved';
  if (saveState === 'saved') return 'Saved';
  return 'Clean';
}

function getSaveDescription({ isDirty, saveState }) {
  if (saveState === 'saving') return 'Writing body text...';
  if (isDirty) return 'Local edits not saved';
  if (saveState === 'saved') return 'Saved to manuscript file';
  return 'No local edits';
}

function getModeLabel(mode) {
  if (mode === 'edit') return 'edit';
  if (mode === 'preview') return 'preview';
  return 'read';
}

export function EditorPanel({
  editorBody,
  error,
  isDirty,
  isEditing,
  isFocusMode,
  saveState,
  selectedChapter,
  selectedChapterId,
  workspace,
  onEditorBodyChange,
  onFocusModeChange,
  onSave,
  onSelectedChapterChange,
  onToggleEditing,
}) {
  const [editorMode, setEditorMode] = useState('read');
  const textareaRef = useRef(null);
  const activeMode = isEditing ? editorMode : (editorMode === 'preview' ? 'preview' : 'read');
  const stats = useMemo(() => getEditorStats(editorBody), [editorBody]);
  const previewBlocks = useMemo(() => renderMarkdownPreview(editorBody), [editorBody]);
  const saveLabel = getSaveLabel({ isDirty, saveState });
  const saveDescription = getSaveDescription({ isDirty, saveState });

  function switchMode(nextMode) {
    if (nextMode === 'edit' && !isEditing) {
      onToggleEditing();
    }

    if (nextMode === 'read' && isEditing) {
      onToggleEditing();
    }

    setEditorMode(nextMode);
  }

  function toggleEditing() {
    if (isEditing) {
      setEditorMode('read');
    } else {
      setEditorMode('edit');
    }
    onToggleEditing();
  }

  function updateBodyWithSelection(nextBody, selectionStart, selectionEnd) {
    onEditorBodyChange(nextBody);
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(selectionStart, selectionEnd);
    });
  }

  function replaceSelection(formatSelection) {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? editorBody.length;
    const end = textarea?.selectionEnd ?? editorBody.length;
    const selectedText = editorBody.slice(start, end);
    const replacement = formatSelection(selectedText);
    const nextBody = `${editorBody.slice(0, start)}${replacement.text}${editorBody.slice(end)}`;
    updateBodyWithSelection(
      nextBody,
      start + replacement.selectionStart,
      start + replacement.selectionEnd,
    );
  }

  function wrapSelection(before, after = before, placeholder = 'text') {
    replaceSelection((selectedText) => {
      const inner = selectedText || placeholder;
      return {
        text: `${before}${inner}${after}`,
        selectionStart: before.length,
        selectionEnd: before.length + inner.length,
      };
    });
  }

  function prefixSelectionLines(prefix, placeholder) {
    replaceSelection((selectedText) => {
      const inner = selectedText || placeholder;
      const lines = inner.split('\n');
      const text = lines.map((line) => `${prefix}${line}`).join('\n');
      return {
        text,
        selectionStart: prefix.length,
        selectionEnd: text.length,
      };
    });
  }

  function insertSceneBreak() {
    replaceSelection(() => ({
      text: '\n\n---\n\n',
      selectionStart: 6,
      selectionEnd: 6,
    }));
  }

  return (
    <section className="panel editor">
      <div className="editor-header">
        <div>
          <h2>Manuscript</h2>
          <p>
            {workspace
              ? `${workspace.chapters.length} chapter file(s) loaded`
              : 'Loading repository index...'}
          </p>
        </div>
        <button
          className={`focus-toggle ${isFocusMode ? 'active' : ''}`}
          type="button"
          onClick={() => onFocusModeChange(!isFocusMode)}
        >
          {isFocusMode ? 'Exit Focus' : 'Focus'}
        </button>
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
                onClick={() => onSelectedChapterChange(chapter.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    onSelectedChapterChange(chapter.id);
                  }
                }}
                tabIndex={0}
                role="button"
              >
                <strong>{chapter.order ?? '-'}. {chapter.title}</strong>
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
                <div>
                  <h3>{selectedChapter.title}</h3>
                  <p className="selected-path">{selectedChapter.path}</p>
                </div>
                <div className="chapter-controls">
                  <div className={`save-status ${isDirty ? 'dirty' : saveState}`}>
                    <strong>{saveLabel}</strong>
                    <span>{saveDescription}</span>
                  </div>
                  <button type="button" onClick={toggleEditing}>
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={!isEditing || !isDirty || saveState === 'saving'}
                  >
                    {saveState === 'saving' ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              <div className="editor-info-bar" aria-label="Editor details">
                <div className="editor-stat">
                  <span>Words</span>
                  <strong>{stats.words}</strong>
                </div>
                <div className="editor-stat">
                  <span>Characters</span>
                  <strong>{stats.characters}</strong>
                </div>
                <div className="editor-stat">
                  <span>Reading time</span>
                  <strong>{stats.readingMinutes} min</strong>
                </div>
                <div className="editor-stat">
                  <span>Mode</span>
                  <strong>{getModeLabel(activeMode)}</strong>
                </div>
                <div className="editor-path">
                  <span>Path</span>
                  <strong>{selectedChapter.path}</strong>
                </div>
                <div className="editor-mode-toggle" aria-label="Editor mode">
                  <button
                    className={activeMode === 'read' ? 'active' : ''}
                    type="button"
                    onClick={() => switchMode('read')}
                  >
                    Read
                  </button>
                  <button
                    className={activeMode === 'edit' ? 'active' : ''}
                    type="button"
                    onClick={() => switchMode('edit')}
                  >
                    Edit
                  </button>
                  <button
                    className={activeMode === 'preview' ? 'active' : ''}
                    type="button"
                    onClick={() => switchMode('preview')}
                  >
                    Preview
                  </button>
                </div>
              </div>

              {isEditing && (
                <div className="format-toolbar" aria-label="Markdown formatting helpers">
                  <button type="button" onClick={() => wrapSelection('**', '**', 'bold text')}>
                    Bold
                  </button>
                  <button type="button" onClick={() => wrapSelection('*', '*', 'italic text')}>
                    Italic
                  </button>
                  <button type="button" onClick={() => prefixSelectionLines('## ', 'Heading')}>
                    Heading
                  </button>
                  <button type="button" onClick={() => prefixSelectionLines('> ', 'Quoted text')}>
                    Blockquote
                  </button>
                  <button type="button" onClick={insertSceneBreak}>
                    Scene break
                  </button>
                </div>
              )}

              <div className="chapter-meta">
                <span>ID: {selectedChapter.id}</span>
                <span>Type: {selectedChapter.type}</span>
                <span>Status: {selectedChapter.status}</span>
              </div>

              {activeMode === 'preview' ? (
                <div className="authoring-preview" aria-label="Authoring Markdown preview">
                  {previewBlocks}
                </div>
              ) : activeMode === 'edit' ? (
                <textarea
                  ref={textareaRef}
                  className="chapter-editor"
                  value={editorBody}
                  onChange={(event) => onEditorBodyChange(event.target.value)}
                  spellCheck="true"
                />
              ) : (
                <pre className="chapter-read-body">{selectedChapter.body}</pre>
              )}
            </>
          ) : (
            <p>Select a manuscript chapter to view its content.</p>
          )}
        </article>
      </div>
    </section>
  );
}
