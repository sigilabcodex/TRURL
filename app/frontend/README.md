# TRURL Frontend (First Application Pass)

This directory contains a **minimal local-first editor surface scaffold** for TRURL.
It is intentionally small and focused on validating UI direction, not product completeness.

## Stack Choice

- **Vite + React (JavaScript)**

Why this fits TRURL right now:

- fast local startup and minimal tooling overhead
- simple component model for panel-based manuscript/canon UI
- easy to keep repository-first boundaries (UI can consume Markdown files later without forcing backend complexity)
- maintainable for future contributors without introducing premature abstractions

## What is Included

- three-panel application shell:
  - left: repository sections
  - center: manuscript/chapter mock editor view
  - right: linked metadata/context
- visible TRURL-aligned sections:
  - Manuscript
  - Story Bible
  - Notes
  - Revision
  - AI
  - Validation
- mocked chapter list and chapter content
- mocked linked metadata (characters, locations, timeline)

## What is Mocked (Not Implemented Yet)

- no file I/O into `manuscript/` or `story-bible/`
- no persistent editing state
- no git operation wiring
- no backend API
- no AI calls

## Local Run

From repository root:

```bash
cd app/frontend
npm install
npm run dev
```

Then open the local Vite URL shown in terminal (typically `http://localhost:5173`).

## Next Step (Recommended)

Add a thin local data layer that reads repository Markdown/frontmatter into in-memory view models for:

- chapter index
- active chapter body
- linked character/location/timeline references

while still keeping Git and Markdown as the source of truth.
