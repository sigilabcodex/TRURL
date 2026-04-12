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

## What is Real in This Pass

- real manuscript discovery from local files
- real frontmatter parsing (`id`, `title`, `type`, `order`, `status`, links, sources)
- real chapter content display from Markdown body
- real context resolution against story-bible IDs
- repository section counts for manuscript/story bible/notes/revision
- workspace state indicator with selected chapter path

## What is Still Mocked / Deferred

- no write/save operations
- no git branch/status operations (no fake branch indicator shown)
- no validation action wiring from UI
- no AI calls
- no cloud sync/auth/multi-user features

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
