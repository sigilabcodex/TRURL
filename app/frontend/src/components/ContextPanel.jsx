import React from 'react';

import { GitPanel } from './GitPanel.jsx';
import { RenderPackagePanel } from './RenderPackagePanel.jsx';
import { ValidationPanel } from './ValidationPanel.jsx';

export function ContextPanel({
  documentPackage,
  gitDiff,
  gitError,
  gitState,
  gitStatus,
  linked,
  outputTarget,
  packageError,
  packageState,
  selectedChapter,
  stylePreset,
  validationError,
  validationResult,
  validationState,
  onBuildPackage,
  onGitRequest,
  onOutputTargetChange,
  onRunValidation,
  onStylePresetChange,
}) {
  return (
    <aside className="panel metadata">
      <h2>Context</h2>
      <section>
        <h3>Linked Characters</h3>
        <ul>
          {linked.characters.map((item) => (
            <li key={item.id}>
              <strong>{item.name}</strong>
              <small>{item.status}</small>
              <p>{item.summary}</p>
              {item.first_appearance && <code>{item.first_appearance}</code>}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3>Linked Locations</h3>
        <ul>
          {linked.locations.map((item) => (
            <li key={item.id}>
              <strong>{item.name}</strong>
              <small>{item.status}</small>
              <p>{item.summary}</p>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3>Timeline Signals</h3>
        <ul>
          {linked.timeline.map((item) => (
            <li key={item.id}>
              <strong>{item.label || item.name}</strong>
              <small>{item.status}</small>
              <p>{item.summary}</p>
              {item.source_manuscript && <code>{item.source_manuscript}</code>}
            </li>
          ))}
        </ul>
      </section>
      <RenderPackagePanel
        documentPackage={documentPackage}
        outputTarget={outputTarget}
        packageError={packageError}
        packageState={packageState}
        selectedChapter={selectedChapter}
        stylePreset={stylePreset}
        onBuildPackage={onBuildPackage}
        onOutputTargetChange={onOutputTargetChange}
        onStylePresetChange={onStylePresetChange}
      />
      <ValidationPanel
        validationError={validationError}
        validationResult={validationResult}
        validationState={validationState}
        onRunValidation={onRunValidation}
      />
      <GitPanel
        gitDiff={gitDiff}
        gitError={gitError}
        gitState={gitState}
        gitStatus={gitStatus}
        onGitRequest={onGitRequest}
      />
    </aside>
  );
}
