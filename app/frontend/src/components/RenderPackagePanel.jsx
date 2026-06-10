import React from 'react';
import { summarizeRenderPackage } from '../utils/renderPackageSummary.js';

export function RenderPackagePanel({
  documentPackage,
  outputTarget,
  packageError,
  packageState,
  selectedChapter,
  stylePreset,
  onBuildPackage,
  onOutputTargetChange,
  onStylePresetChange,
}) {
  const packageSummary = summarizeRenderPackage(documentPackage);

  return (
    <section className="render-package">
      <div className="render-package-header">
        <div>
          <h3>Render Package</h3>
          <p>Mock TRURL package preview. No OSER render and no export files written.</p>
        </div>
        <span className="mock-badge">mock</span>
      </div>

      <div className="package-status" aria-label="Render package status">
        <span>Mock package only</span>
        <span>{selectedChapter ? selectedChapter.path : 'No chapter selected'}</span>
        <span>Target: {outputTarget}</span>
      </div>

      <div className="package-controls">
        <label>
          <span>Style preset</span>
          <input
            type="text"
            value={stylePreset}
            onChange={(event) => onStylePresetChange(event.target.value)}
            placeholder="editorial-default"
          />
        </label>
        <label>
          <span>Output target</span>
          <select
            value={outputTarget}
            onChange={(event) => onOutputTargetChange(event.target.value)}
          >
            <option value="html">html</option>
            <option value="pdf">pdf</option>
            <option value="epub">epub</option>
            <option value="web">web</option>
          </select>
        </label>
        <button
          type="button"
          onClick={onBuildPackage}
          disabled={!selectedChapter || packageState === 'loading'}
        >
          {packageState === 'loading' ? 'Building...' : 'Build Package'}
        </button>
      </div>

      {packageError && (
        <div className="tool-state fail">
          <strong>Package failed</strong>
          <p>{packageError}</p>
        </div>
      )}

      {packageSummary ? (
        <div className="package-summary">
          <div className="tool-state ok">
            <strong>Package built</strong>
            <p>Mock document package is ready for inspection. No export files were written.</p>
          </div>
          <dl>
            <dt>Chapter</dt>
            <dd>{packageSummary.selectedTitle}</dd>
            <dt>Source path</dt>
            <dd><code>{packageSummary.selectedPath}</code></dd>
            <dt>Target</dt>
            <dd>{packageSummary.target}</dd>
            <dt>Output path</dt>
            <dd><code>{packageSummary.outputPath}</code></dd>
            <dt>Style preset</dt>
            <dd>{packageSummary.stylePreset}</dd>
            <dt>Linked entities</dt>
            <dd>
              {packageSummary.linkedEntities.characters} characters, {' '}
              {packageSummary.linkedEntities.locations} locations, {' '}
              {packageSummary.linkedEntities.timeline} timeline
            </dd>
            <dt>Warnings</dt>
            <dd>{packageSummary.warningsCount}</dd>
          </dl>

          <details>
            <summary>JSON preview</summary>
            <pre className="package-json">
              {JSON.stringify(documentPackage.package, null, 2)}
            </pre>
          </details>
        </div>
      ) : (
        <p className="package-empty">Select a chapter and build a mock document package.</p>
      )}
    </section>
  );
}
