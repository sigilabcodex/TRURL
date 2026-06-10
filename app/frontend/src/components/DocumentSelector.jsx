import React from 'react';
import {
  getCurrentDocument,
  getCurrentDocumentId,
  getDocumentOptions,
  isDocumentSwitchingAvailable,
} from '../utils/documentSelector.js';

function renderValue(value) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'none';
  }

  return value || 'none';
}

export function DocumentSelector({ project, isFocusMode = false }) {
  const options = getDocumentOptions(project);
  const currentDocumentId = getCurrentDocumentId(project);
  const currentDocument = getCurrentDocument(project);
  const switchingAvailable = isDocumentSwitchingAvailable(project);
  const documentCount = options.length;
  const className = `transport-document document-selector ${isFocusMode ? 'focus-mode' : ''}`;

  return (
    <div className={className}>
      <div className="document-selector-heading">
        <div>
          <span className="transport-label">Document</span>
          <strong>{currentDocument?.title || 'No document'}</strong>
        </div>
        <small>{documentCount === 1 ? '1 document' : `${documentCount} documents`}</small>
      </div>

      <select
        aria-label="Current document"
        value={currentDocumentId}
        disabled={!switchingAvailable}
        onChange={() => {}}
      >
        {options.length > 0 ? options.map((document) => (
          <option key={document.id} value={document.id}>
            {document.title}{document.isCurrent ? ' (current)' : ''}
          </option>
        )) : (
          <option value="">No documents</option>
        )}
      </select>

      <p className="document-selector-notice">
        Read-only selector: current repository still loads the default document.
      </p>

      {currentDocument && (
        <details className="document-selector-details">
          <summary>Document metadata</summary>
          <dl>
            <dt>ID</dt>
            <dd><code>{renderValue(currentDocument.id)}</code></dd>
            <dt>Title</dt>
            <dd>{renderValue(currentDocument.title)}</dd>
            <dt>Manuscript</dt>
            <dd><code>{renderValue(currentDocument.manuscriptPath)}</code></dd>
            <dt>Story Bible</dt>
            <dd><code>{renderValue(currentDocument.storyBiblePath)}</code></dd>
            <dt>Notes</dt>
            <dd><code>{renderValue(currentDocument.notesPath)}</code></dd>
            <dt>Revision</dt>
            <dd><code>{renderValue(currentDocument.revisionPath)}</code></dd>
            <dt>Presets</dt>
            <dd>{renderValue(currentDocument.renderPresets)}</dd>
          </dl>
        </details>
      )}
    </div>
  );
}
