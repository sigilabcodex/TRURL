# TRURL Frontend (Repository-Backed Pass)

This pass upgrades the frontend from mocked data to a local repository viewer.

## Local Architecture

- `app/frontend` (Vite + React) renders the three-panel workspace UI.
- `app/backend` (small Node HTTP service) reads Markdown files from the repository and exposes a JSON snapshot.
- The repository remains the single source of truth; no database is introduced.

## Data Flow

1. Backend reads Markdown files from:
   - `manuscript/`
   - `story-bible/characters/`
   - `story-bible/locations/`
   - `story-bible/timeline/`
   - `notes/` and `revision/` (for section counts)
2. Backend parses YAML frontmatter + Markdown body.
3. Frontend requests `GET /api/workspace`.
4. Frontend renders:
   - real chapter list
   - selected chapter body
   - context panel resolved from `character_ids`, `location_ids`, `timeline_ids`
   - read-only mock render package preview for the selected chapter
   - read-only validation controls for repository health checks
   - read-only Git status and diff visibility

## What is Real in This Pass

- real manuscript discovery from local files
- real frontmatter parsing (`id`, `title`, `type`, `order`, `status`, links, sources)
- real chapter content display from Markdown body
- read mode + explicit edit mode toggle for selected chapter body
- save action for manuscript body text through backend write endpoint
- dirty/unsaved state indicator while editing
- real context resolution against story-bible IDs
- repository section counts for manuscript/story bible/notes/revision
- workspace state indicator with selected chapter path
- manual `POST /api/render/document-package` request for the selected chapter
- compact render package summary and scrollable JSON preview
- manual validation requests for frontmatter, crossrefs, manuscript order, or all checks
- compact validation status/output display
- manual `GET /api/git/status` and `GET /api/git/diff` requests
- compact read-only Git output display

## What is Still Mocked / Deferred

- no git branch, commit, merge, revert, or push operations
- no AI calls
- no OSER import, dependency, or real rendering
- no HTML/PDF/EPUB generation from the frontend
- no cloud sync/auth/multi-user features
- no frontmatter editing in UI (body-only editing in this pass)
- no rich text editing/toolbar/undo system

## Run Locally

From repository root, in two terminals:

### Terminal 1 — backend

```bash
cd app/backend
npm install
npm run dev
```

### Terminal 2 — frontend

```bash
cd app/frontend
npm install
npm run dev
```

Open the Vite URL shown in terminal (usually `http://localhost:5173`).
