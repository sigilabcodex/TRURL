import React from 'react';

const validationActions = [
  { label: 'All Checks', endpoint: '/api/validate/all', primary: true },
  { label: 'Frontmatter', endpoint: '/api/validate/frontmatter' },
  { label: 'Crossrefs', endpoint: '/api/validate/crossrefs' },
  { label: 'Manuscript Order', endpoint: '/api/validate/manuscript-order' },
];

export function ValidationPanel({
  validationError,
  validationResult,
  validationState,
  onRunValidation,
}) {
  return (
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
            onClick={() => onRunValidation(action.endpoint)}
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
  );
}
