import React from 'react';
import { summarizeGitStatus } from '../utils/gitStatus.js';

function labelForType(type) {
  if (type === 'untracked') return 'Untracked';
  if (type === 'modified') return 'Modified';
  if (type === 'added') return 'Added';
  if (type === 'deleted') return 'Deleted';
  return 'Changed';
}

export function GitPanel({
  gitDiff,
  gitError,
  gitState,
  gitStatus,
  onGitRequest,
}) {
  const statusSummary = gitStatus ? summarizeGitStatus(gitStatus) : null;

  return (
    <section className="git-panel">
      <div className="render-package-header">
        <div>
          <h3>Git</h3>
          <p>Read-only status and diff visibility. No commit, push, or revert actions.</p>
        </div>
        <span className="mock-badge">read</span>
      </div>

      <div className="git-controls">
        <button
          type="button"
          onClick={() => onGitRequest('/api/git/status', 'status')}
          disabled={gitState === 'loading'}
        >
          {gitState === 'loading' ? 'Loading...' : 'Refresh Status'}
        </button>
        <button
          type="button"
          onClick={() => onGitRequest('/api/git/diff', 'diff')}
          disabled={gitState === 'loading'}
        >
          {gitState === 'loading' ? 'Loading...' : 'Show Diff'}
        </button>
      </div>

      {gitError && (
        <div className="tool-state fail">
          <strong>Git request failed</strong>
          <p>{gitError}</p>
        </div>
      )}

      {statusSummary ? (
        <div className="git-workflow-summary">
          <div className={`tool-state ${statusSummary.isClean ? 'ok' : 'warn'}`}>
            <strong>{statusSummary.isClean ? 'Working tree clean' : 'Working tree has changes'}</strong>
            <p>
              Branch: {statusSummary.branch}. Changed files: {statusSummary.changedFiles.length}.
            </p>
          </div>

          {!statusSummary.isClean && (
            <ul className="git-file-list">
              {statusSummary.changedFiles.map((file) => (
                <li key={`${file.status}-${file.path}`}>
                  <span className={`status-badge ${file.type === 'untracked' ? 'fail' : 'ok'}`}>
                    {labelForType(file.type)}
                  </span>
                  <code>{file.path}</code>
                </li>
              ))}
            </ul>
          )}

          <details className="tool-raw-details">
            <summary>Raw status output</summary>
            <pre>{statusSummary.rawOutput || '(no output)'}</pre>
          </details>
        </div>
      ) : (
        <p className="package-empty">Refresh status to inspect branch and working tree state.</p>
      )}

      {gitDiff && (
        <details className="git-output git-diff-output">
          <summary>
            <span>Diff</span>
            <code>{gitDiff.ok ? 'ok' : 'fail'}</code>
          </summary>
          {gitDiff.commands.map((command) => (
            <div key={command.name}>
              <small>{command.command}</small>
              <pre>{command.stdout || command.stderr || '(no output)'}</pre>
            </div>
          ))}
        </details>
      )}
    </section>
  );
}
