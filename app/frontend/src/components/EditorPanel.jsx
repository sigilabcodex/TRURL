import React, { useMemo, useState } from 'react';

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

function parseInlineMarkdown(text) {
  const nodes = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**')) {
      nodes.push(<strong key={`${match.index}-strong`}>{token.slice(2, -2)}</strong>);
    } else {
      nodes.push(<em key={`${match.index}-em`}>{token.slice(1, -1)}</em>);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : text;
}

function renderPreviewBlocks(body) {
  const blocks = [];
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push(<hr key={`hr-${index}`} />);
      index += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 4);
      const HeadingTag = `h${level}`;
      blocks.push(
        <HeadingTag key={`heading-${index}`}>
          {parseInlineMarkdown(headingMatch[2])}
        </HeadingTag>,
      );
      index += 1;
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quoteLines = [];
      while (index < lines.length && lines[index].trim().startsWith('>')) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''));
        index += 1;
      }
      blocks.push(
        <blockquote key={`quote-${index}`}>
          {quoteLines.map((quoteLine, quoteIndex) => (
            <p key={`${quoteLine}-${quoteIndex}`}>{parseInlineMarkdown(quoteLine)}</p>
          ))}
        </blockquote>,
      );
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ''));
        index += 1;
      }
      blocks.push(
        <ul key={`list-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`}>{parseInlineMarkdown(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    const paragraphLines = [];
    while (
      index < lines.length
      && lines[index].trim()
      && !lines[index].trim().match(/^(#{1,6})\s+(.+)$/)
      && !lines[index].trim().startsWith('>')
      && !/^[-*]\s+/.test(lines[index].trim())
      && !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[index].trim())
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    blocks.push(
      <p key={`paragraph-${index}`}>
        {parseInlineMarkdown(paragraphLines.join(' '))}
      </p>,
    );
  }

  return blocks.length > 0 ? blocks : <p className="preview-empty">No body text yet.</p>;
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
  const [editorMode, setEditorMode] = useState('edit');
  const stats = useMemo(() => getEditorStats(editorBody), [editorBody]);
  const previewBlocks = useMemo(() => renderPreviewBlocks(editorBody), [editorBody]);
  const saveLabel = getSaveLabel({ isDirty, saveState });
  const saveDescription = getSaveDescription({ isDirty, saveState });

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
                  <button type="button" onClick={onToggleEditing}>
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

              <div className="editor-toolbar" aria-label="Editor details">
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
                <div className="editor-path">
                  <span>Path</span>
                  <strong>{selectedChapter.path}</strong>
                </div>
                <div className="editor-mode-toggle" aria-label="Editor mode">
                  <button
                    className={editorMode === 'edit' ? 'active' : ''}
                    type="button"
                    onClick={() => setEditorMode('edit')}
                  >
                    Edit
                  </button>
                  <button
                    className={editorMode === 'preview' ? 'active' : ''}
                    type="button"
                    onClick={() => setEditorMode('preview')}
                  >
                    Preview
                  </button>
                </div>
              </div>

              <div className="chapter-meta">
                <span>ID: {selectedChapter.id}</span>
                <span>Type: {selectedChapter.type}</span>
                <span>Status: {selectedChapter.status}</span>
              </div>

              {editorMode === 'preview' ? (
                <div className="authoring-preview" aria-label="Authoring Markdown preview">
                  {previewBlocks}
                </div>
              ) : isEditing ? (
                <textarea
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
