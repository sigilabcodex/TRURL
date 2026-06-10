import React from 'react';

export function GitPanel({
  gitDiff,
  gitError,
  gitState,
  gitStatus,
  onGitRequest,
}) {
  return (
    <section className="git-panel">
      <div className="render-package-header">
        <div>
          <h3>Git</h3>
          <p>Read-only status and diff visibility.</p>
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

      {gitError && <p className="error">Git request failed: {gitError}</p>}

      {gitStatus ? (
        <div className="git-output">
          <div className="validation-check-header">
            <strong>Status</strong>
            <code>{gitStatus.ok ? 'ok' : 'fail'}</code>
          </div>
          {gitStatus.commands.map((command) => (
            <pre key={command.name}>
              {command.stdout || command.stderr || '(no output)'}
            </pre>
          ))}
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
