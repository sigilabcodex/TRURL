import React from 'react';

function countLinkedEntities(packagePayload) {
  const linkedEntities = packagePayload?.package?.storyBible?.linkedEntities;
  if (!linkedEntities) {
    return { characters: 0, locations: 0, timeline: 0 };
  }

  return {
    characters: linkedEntities.characters?.length || 0,
    locations: linkedEntities.locations?.length || 0,
    timeline: linkedEntities.timeline?.length || 0,
  };
}

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
  const packageEntityCounts = countLinkedEntities(documentPackage);

  return (
    <section className="render-package">
      <div className="render-package-header">
        <div>
          <h3>Render Package</h3>
          <p>Mock TRURL package preview. No OSER render.</p>
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

      {packageError && <p className="error">Package failed: {packageError}</p>}

      {documentPackage ? (
        <div className="package-summary">
          <dl>
            <dt>Schema</dt>
            <dd>{documentPackage.package.schema}</dd>
            <dt>Mode</dt>
            <dd>{documentPackage.mode}</dd>
            <dt>Target</dt>
            <dd>{documentPackage.package.output.target}</dd>
            <dt>Output path</dt>
            <dd><code>{documentPackage.package.output.path}</code></dd>
            <dt>Selected</dt>
            <dd>{documentPackage.package.manuscript.selected.title}</dd>
            <dt>Source path</dt>
            <dd><code>{documentPackage.package.manuscript.selected.path}</code></dd>
            <dt>Entities</dt>
            <dd>
              {packageEntityCounts.characters} characters, {' '}
              {packageEntityCounts.locations} locations, {' '}
              {packageEntityCounts.timeline} timeline
            </dd>
            <dt>Style preset</dt>
            <dd>{documentPackage.package.style.preset}</dd>
            <dt>Warnings</dt>
            <dd>{documentPackage.warnings.length ? documentPackage.warnings.join(', ') : 'none'}</dd>
          </dl>

          <details>
            <summary>JSON preview</summary>
            <pre className="package-json">
              {JSON.stringify(documentPackage.package, null, 2)}
            </pre>
          </details>
        </div>
      ) : (
        <p className="package-empty">
          {selectedChapter ? `Ready for ${selectedChapter.path}` : 'Select a chapter first.'}
        </p>
      )}
    </section>
  );
}
