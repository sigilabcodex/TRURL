import React, { useMemo } from 'react';
import { getChapterMetadataRows, normalizeChapterMetadata } from '../utils/chapterMetadata.js';

export function ContextPanel({
  linked,
  selectedChapter,
}) {
  const metadataRows = useMemo(() => getChapterMetadataRows(selectedChapter), [selectedChapter]);
  const metadata = useMemo(() => normalizeChapterMetadata(selectedChapter), [selectedChapter]);

  return (
    <aside className="panel metadata">
      <h2>Inspector</h2>
      {selectedChapter && (
        <section className="chapter-inspector">
          <h3>Selected Chapter</h3>
          <dl>
            {metadataRows.map((row) => (
              <React.Fragment key={row.key}>
                <dt>{row.label}</dt>
                <dd>{row.code ? <code>{row.value}</code> : row.value}</dd>
              </React.Fragment>
            ))}
          </dl>
          {metadata.revisionNotes !== '—' && (
            <p className="chapter-summary"><strong>Revision notes:</strong> {metadata.revisionNotes}</p>
          )}
          {metadata.warnings.length > 0 && (
            <div className="metadata-warnings" aria-label="Metadata notes">
              {metadata.warnings.map((warning) => (
                <span key={warning}>{warning}</span>
              ))}
            </div>
          )}
        </section>
      )}
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
    </aside>
  );
}
