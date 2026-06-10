import React, { useMemo } from 'react';
import { getOutlinerRows, summarizeOutliner } from '../utils/outliner.js';

function displayValue(value) {
  return value === null || value === undefined || value === '' ? '—' : value;
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(value || 0);
}

export function OutlinerView({
  chapters,
  selectedChapterId,
  onSelectedChapterChange,
  onViewChange,
}) {
  const rows = useMemo(() => getOutlinerRows(chapters), [chapters]);
  const summary = useMemo(() => summarizeOutliner(rows), [rows]);

  return (
    <section className="panel outliner-view" aria-label="Manuscript outliner">
      <div className="outliner-header">
        <div>
          <h2>Outliner</h2>
          <p>Read-only manuscript planning view. Select a row to inspect a chapter without editing or reordering.</p>
        </div>
        <button type="button" onClick={() => onViewChange('write')}>
          Back to Write
        </button>
      </div>

      <div className="outliner-summary" aria-label="Outliner summary">
        <div>
          <span>Total chapters</span>
          <strong>{formatNumber(summary.totalChapters)}</strong>
        </div>
        <div>
          <span>Approx. words</span>
          <strong>{formatNumber(summary.totalWords)}</strong>
        </div>
        <div>
          <span>With characters</span>
          <strong>{formatNumber(summary.chaptersWithCharacters)}</strong>
        </div>
        <div>
          <span>Timeline signals</span>
          <strong>{formatNumber(summary.chaptersWithTimeline)}</strong>
        </div>
      </div>

      <div className="outliner-table-wrap">
        <table className="outliner-table">
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Title</th>
              <th scope="col">Status</th>
              <th scope="col">Words</th>
              <th scope="col">Canon</th>
              <th scope="col">Source</th>
              <th scope="col">Path</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isSelected = row.id === selectedChapterId;
              return (
                <tr
                  key={row.id}
                  className={isSelected ? 'selected' : ''}
                  onClick={() => onSelectedChapterChange(row.id)}
                >
                  <td><strong>{displayValue(row.order ?? row.index)}</strong></td>
                  <td>
                    <button
                      type="button"
                      className="outliner-row-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectedChapterChange(row.id);
                      }}
                    >
                      {row.title}
                    </button>
                    <small>{displayValue(row.type)}</small>
                  </td>
                  <td><span className="outliner-pill">{displayValue(row.status)}</span></td>
                  <td>{formatNumber(row.wordCount)}</td>
                  <td>
                    <div className="outliner-counts" aria-label="Linked context counts">
                      <span>Chars {row.linkedCharacters}</span>
                      <span>Locs {row.linkedLocations}</span>
                      <span>Time {row.timelineSignals}</span>
                    </div>
                  </td>
                  <td>
                    <span>{displayValue(row.sourceText)}</span>
                    {row.sourceUrl && <code>{row.sourceUrl}</code>}
                  </td>
                  <td><code>{displayValue(row.path)}</code></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
