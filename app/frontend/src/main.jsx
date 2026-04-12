import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const repositorySections = [
  'Manuscript',
  'Story Bible',
  'Notes',
  'Revision',
  'AI',
  'Validation',
];

const chapters = [
  { id: 'ch-001', title: 'Chapter 01 — The Blackout at Dock Nine', status: 'Draft' },
  { id: 'ch-002', title: 'Chapter 02 — The Signal in the Salt', status: 'In Review' },
  { id: 'ch-003', title: 'Chapter 03 — Transit of Broken Moons', status: 'Planned' },
];

const linkedMetadata = {
  characters: ['Nara Vel', 'Ivo Pike', 'Marshal Dena Coil'],
  locations: ['Dock Nine', 'The Salt Trench Relay'],
  timeline: ['YR-318.220 / Night Watch', 'YR-318.221 / First Alarm'],
};

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>TRURL — Local Editor Surface (First Pass)</h1>
        <span className="badge">Mocked local state</span>
      </header>

      <main className="workspace-grid">
        <aside className="panel sidebar">
          <h2>Repository</h2>
          <nav>
            <ul>
              {repositorySections.map((section) => (
                <li key={section}>
                  <button type="button" className={section === 'Manuscript' ? 'active' : ''}>
                    {section}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <section className="panel editor">
          <div className="editor-header">
            <h2>Manuscript</h2>
            <p>Branch: <code>draft/first-ui-pass</code></p>
          </div>

          <div className="chapter-layout">
            <div className="chapter-list">
              <h3>Chapters</h3>
              <ul>
                {chapters.map((chapter, index) => (
                  <li key={chapter.id} className={index === 0 ? 'selected' : ''}>
                    <strong>{chapter.title}</strong>
                    <span>{chapter.status}</span>
                  </li>
                ))}
              </ul>
            </div>

            <article className="chapter-content">
              <h3>{chapters[0].title}</h3>
              <p>
                The lights of Dock Nine failed in sequence, not all at once. Nara counted each pulse
                before the bay dissolved into emergency red. Somewhere below, a relay horn dragged
                through the hull like an old promise being torn open.
              </p>
              <p>
                This is a mocked chapter surface. In future passes, this panel will load Markdown
                directly from <code>manuscript/</code> and stage edits for commit-aware workflows.
              </p>
            </article>
          </div>
        </section>

        <aside className="panel metadata">
          <h2>Context</h2>
          <section>
            <h3>Linked Characters</h3>
            <ul>
              {linkedMetadata.characters.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <h3>Linked Locations</h3>
            <ul>
              {linkedMetadata.locations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <h3>Timeline Signals</h3>
            <ul>
              {linkedMetadata.timeline.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </aside>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
