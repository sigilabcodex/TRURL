import React from 'react';

export function ContextPanel({
  linked,
  selectedChapter,
}) {
  return (
    <aside className="panel metadata">
      <h2>Inspector</h2>
      {selectedChapter && (
        <section className="chapter-inspector">
          <h3>Selected Chapter</h3>
          <dl>
            <dt>Title</dt>
            <dd>{selectedChapter.title}</dd>
            <dt>Path</dt>
            <dd><code>{selectedChapter.path}</code></dd>
            <dt>Status</dt>
            <dd>{selectedChapter.status}</dd>
            <dt>Type</dt>
            <dd>{selectedChapter.type}</dd>
          </dl>
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
