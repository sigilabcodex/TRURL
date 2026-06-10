import React from 'react';
import { getCheckStatus, summarizeValidation } from '../utils/validationSummary.js';

const validationActions = [
  { label: 'Run All', endpoint: '/api/validate/all', primary: true },
  { label: 'Frontmatter', endpoint: '/api/validate/frontmatter' },
  { label: 'Crossrefs', endpoint: '/api/validate/crossrefs' },
  { label: 'Manuscript Order', endpoint: '/api/validate/manuscript-order' },
];

function summarizeOutput(output) {
  const trimmed = output.trim();
  if (!trimmed) return '';
  const firstLine = trimmed.split(/\r?\n/)[0];
  return firstLine.length > 120 ? `${firstLine.slice(0, 117)}...` : firstLine;
}

export function ValidationPanel({
  validationError,
  validationResult,
  validationState,
  onRunValidation,
}) {
  const validationSummary = validationResult ? summarizeValidation(validationResult) : null;

  return (
    <section className="validation-panel">
      <div className="render-package-header">
        <div>
          <h3>Validation</h3>
          <p>Read-only repository health checks.</p>
        </div>
        {validationSummary && (
          <span className={`status-badge ${validationSummary.ok ? 'ok' : 'fail'}`}>
            {validationSummary.ok ? 'passed' : 'failed'}
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

      {validationError && (
        <div className="tool-state fail">
          <strong>Validation failed</strong>
          <p>{validationError}</p>
        </div>
      )}

      {validationSummary ? (
        <div className="validation-results">
          <div className={`tool-state ${validationSummary.ok ? 'ok' : 'fail'} validation-summary-card`}>
            <strong>{validationSummary.ok ? 'Passed' : 'Failed'}</strong>
            <p>
              {validationSummary.total} checks, {validationSummary.passed} passed, {' '}
              {validationSummary.failed} failed.
            </p>
          </div>
          <ul>
            {validationResult.checks.map((check) => {
              const checkStatus = getCheckStatus(check);
              const stdoutSummary = summarizeOutput(check.stdout || '');
              return (
                <li key={check.name} className="validation-check-card">
                  <div className="validation-check-header">
                    <strong>{check.name}</strong>
                    <span className={`status-badge ${checkStatus === 'pass' ? 'ok' : 'fail'}`}>
                      {checkStatus}
                    </span>
                    <code>exit {check.exitCode}</code>
                  </div>
                  {stdoutSummary && <p className="tool-output-summary">{stdoutSummary}</p>}
                  {check.stderr && <pre className="stderr">{check.stderr}</pre>}
                  {(check.stdout || check.stderr) && (
                    <details className="tool-raw-details">
                      <summary>Raw output</summary>
                      {check.stdout && <pre>{check.stdout}</pre>}
                      {check.stderr && <pre className="stderr">{check.stderr}</pre>}
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="package-empty">Run checks before editing or exporting.</p>
      )}
    </section>
  );
}
