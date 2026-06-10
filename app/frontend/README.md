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
   - transport bar with project/read-only document selector/chapter context, save state, Focus, Theme, and global tool toggles
   - real chapter list
   - selected chapter body
   - body-only authoring stats, read/edit/preview modes, and focus mode
   - source-only Markdown formatting helpers in edit mode
   - contextual inspector resolved from `character_ids`, `location_ids`, `timeline_ids`
   - workspace tools drawer for render package, validation, and Git panels
   - read-only mock render package preview for the selected chapter
   - read-only validation controls for repository health checks
   - read-only Git status and diff visibility


## Workspace Organization

The top transport bar is the command surface for global workspace controls. It shows project, a read-only current document selector, selected chapter, save state, Focus, Theme, and toggles for Render, Validation, and Git. Those tool toggles open one workspace tools drawer below the transport bar.

The document selector previews the future multi-document workflow from `project.documents`. It is intentionally disabled: changing documents does not update frontend state, backend state, loaded manuscript/story-bible/notes/revision folders, or save behavior. The selector exposes compact current-document metadata so manifest data is visible before real switching is implemented.

The right panel is now a contextual inspector only: selected chapter metadata, linked characters, linked locations, and timeline signals. Render, Validation, and Git keep using the same frontend calls and backend endpoints, but they no longer compete with story-bible context in the right rail.

Render, Validation, and Git are global workflow tools in the transport drawer. Render currently builds a mock document package summary only and remains a placeholder until real OSER integration. Validation presents pass/fail rollups for the existing checks. Git remains strictly read-only: it parses status output and keeps raw status/diff details available without commit, push, revert, branch, merge, or other write actions.

This reorganization is frontend-only. It does not change API behavior, save behavior, project manifests, repository files, or backend state.

## Editor Quality-of-Life Features

- Information bar with selected path, word count, character count, estimated reading time, and current mode.
- Read mode for plain source viewing.
- Edit mode with a wider, padded, line-height-friendly Markdown textarea.
- Preview mode for a safe authoring preview generated from the current Markdown body.
- Basic Markdown insertion helpers for bold, italic, heading, blockquote, and scene break syntax.
- Clearer clean, unsaved, saving, and saved state indicators.
- Polished Focus Mode that centers the editor, hides side panels, and gives the writing surface more room while preserving the same workspace state.
- Layout polish that keeps the three-column workspace but gives the editor more usable width and makes diagnostics less dominant.
- Lightweight frontend themes for long writing sessions: Light, Dark, Sepia / Paper, Solar / Warm, and Midnight.

Markdown body text remains canonical. Formatting buttons insert Markdown syntax into the source; they do not create hidden rich-text state. The preview is an authoring aid only and does not modify source text. These layout changes do not alter frontend state architecture or backend behavior.

Theme selection is stored in browser `localStorage` under `trurl.theme`. Themes are frontend-only preferences; they do not change repository files, backend state, project manifests, or exported output.

## What is Real in This Pass

- real manuscript discovery from local files
- real frontmatter parsing (`id`, `title`, `type`, `order`, `status`, links, sources)
- real chapter content display from Markdown body
- body-only editing through the existing save endpoint
- body-only editor toolbar with selected path, word count, character count, estimated reading time, and mode
- safe authoring preview for simple Markdown structures; this is not the final OSER publishing render
- Focus Mode that hides side/context panels with CSS while keeping the same workspace state
- local theme selection in the transport bar for comfortable reading and writing palettes
- transport-controlled read-only document selector with current manifest metadata
- transport-controlled workspace tools drawer for Render, Validation, and Git workflow panels
- contextual inspector for linked story-bible data and selected chapter metadata
- save action for manuscript body text through backend write endpoint
- clearer saved/saving/unsaved state indicator while editing
- real context resolution against story-bible IDs
- repository section counts for manuscript/story bible/notes/revision
- workspace state indicator with selected chapter path
- manual `POST /api/render/document-package` request for the selected chapter
- mock render package workflow summary with collapsed JSON preview
- manual validation requests for frontmatter, crossrefs, manuscript order, or all checks
- validation pass/fail summary with compact check cards
- manual `GET /api/git/status` and `GET /api/git/diff` requests
- parsed read-only Git status summary with collapsed raw status and diff output

## What is Still Mocked / Deferred

- no git branch, commit, merge, revert, or push operations
- no OSER import, dependency, or real rendering
- no HTML/PDF/EPUB generation from the frontend
- no cloud sync/auth/multi-user features
- no real document switching; the selector is read-only and the repository still loads the default document folders
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
