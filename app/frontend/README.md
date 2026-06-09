# TRURL Frontend (Repository-Backed Pass)

This pass upgrades the frontend from mocked data to a local repository viewer and Markdown authoring surface.

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
   - body-only authoring stats, read/edit/preview modes, and focus mode
   - source-only Markdown formatting helpers in edit mode
   - context panel resolved from `character_ids`, `location_ids`, `timeline_ids`
   - read-only mock render package preview for the selected chapter
   - read-only validation controls for repository health checks
   - read-only Git status and diff visibility

## Editor Quality-of-Life Features

- Information bar with selected path, word count, character count, estimated reading time, and current mode.
- Read mode for plain source viewing.
- Edit mode with a wider, padded, line-height-friendly Markdown textarea.
- Preview mode for a safe authoring preview generated from the current Markdown body.
- Basic Markdown insertion helpers for bold, italic, heading, blockquote, and scene break syntax.
- Clearer clean, unsaved, saving, and saved state indicators.
- Focus mode that hides side panels while preserving the same workspace state.

Markdown body text remains canonical. Formatting buttons insert Markdown syntax into the source; they do not create hidden rich-text state. The preview is an authoring aid only and does not modify source text.

## What is Real in This Pass

- real manuscript discovery from local files
- real frontmatter parsing (`id`, `title`, `type`, `order`, `status`, links, sources)
- real chapter content display from Markdown body
- body-only editing through the existing save endpoint
- body-only editor toolbar with selected path, word count, character count, estimated reading time, and mode
- safe authoring preview for simple Markdown structures; this is not the final OSER publishing render
- Focus Mode that hides side/context panels with CSS while keeping the same workspace state
- save action for manuscript body text through backend write endpoint
- clearer saved/saving/unsaved state indicator while editing
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
- no OSER import, dependency, or real rendering
- no HTML/PDF/EPUB generation from the frontend
- no cloud sync/auth/multi-user features
- no frontmatter editing in UI (body-only editing in this pass)
- no rich text editor dependency, WYSIWYG editing, or custom undo system
- no final publishing preview in the editor; OSER output remains separate from this authoring preview

## Run Locally

From the repository root:

```bash
npm run trurl
```

Or run the two app servers separately:

```bash
npm run dev:backend
npm run dev:frontend
```

Open the Vite URL shown in terminal, usually `http://localhost:5173`.
