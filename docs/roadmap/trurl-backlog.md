# TRURL Backlog and Roadmap

This roadmap captures TRURL's current product direction, near-term implementation priorities, and open architecture decisions. It is a planning document only; it does not introduce runtime behavior, backend endpoints, dependencies, or UI changes.

## Current Milestone

TRURL currently has a working local alpha foundation:

- Local launcher through `npm run trurl`, with backend and frontend started together.
- Repository-backed workspace loaded from local Markdown files.
- Safe body-only manuscript editing that preserves existing frontmatter.
- Read, Edit, and Preview editor modes.
- Focus Mode and layout polish for a more comfortable writing surface.
- Safe Markdown authoring preview helper with lightweight parsing tests.
- Optional `.trurl/project.json` project manifest foundation.
- `project.currentDocument` metadata exposed by `GET /api/workspace`.
- Read-only document selector groundwork in the transport bar; real switching remains deferred.
- Read-only manuscript outliner groundwork for planning and chapter scanning.
- Mock render package preview for the future TRURL to OSER boundary.
- Validation panel for frontmatter, cross-reference, and manuscript-order checks.
- Read-only Git status and scoped diff visibility.
- AI summarize endpoint with mock and Ollama provider configuration.
- Lightweight `node:test` coverage for fragile non-UI logic.

## Product Direction

TRURL is a Git-native longform writing workspace. Its core purpose is to make a repository feel like a structured writing studio: manuscript source, canon, notes, revision history, validation, and AI-assisted review live together in a diffable project.

TRURL should remain:

- Markdown/source-first.
- Project and canon aware.
- Local-first and Git-native.
- AI-assisted, but not AI-owned.
- Designed to connect explicitly with OSER for publishing and export.

TRURL is not yet:

- A full WYSIWYG editor.
- A visual page layout tool.
- A database CMS.
- A cloud sync service.
- A collaborative realtime editor.
- A final PDF, EPUB, or website renderer.

## Near-Term Priorities

### P0

- Stabilize editor UX: keep Read/Edit/Preview and Focus Mode predictable, comfortable, and source-oriented.
- Preserve the safe save model: body-only manuscript writes, frontmatter preservation, path validation, and explicit user action.
- Keep tests passing: `npm run check` remains the baseline before commits.
- Project manifest validation/schema foundation is in place: keep it backwards-compatible while future document switching remains deferred.
- Improve document metadata display: show current document context clearly without implementing switching yet.

### P1

- Document selector and multi-document groundwork: read-only selector is in place; real selection waits until the data model and folder-loading behavior are proven.
- OSER-backed preview or export bridge: replace mock package behavior with an explicit, testable adapter boundary.
- AI revision proposal endpoint: return structured suggestions and unified diffs only; do not apply changes automatically.
- Richer editor foundation evaluation: likely CodeMirror as a Markdown source editor before any WYSIWYG or block editor.
- Better diagnostics presentation: make validation, render, and Git output easier to scan without hiding important failure details.

### P2

- Real export presets: define project/document render presets and validate preset configuration.
- EPUB/PDF/web export workflows: produce explicit derived artifacts through OSER or an OSER-compatible adapter.
- Issue/revision workflow: track planned edits, accepted/rejected proposals, and revision notes in repository files.
- Side-by-side diff/review UI: make AI and user edits reviewable before save or commit.
- Story-bible editing: add safe editing workflows for canon records after manuscript body editing is mature.
- AI-assisted canon checks: compare manuscript changes against linked story-bible records and timeline constraints.

### Later

- Cloud sync.
- Collaboration.
- Plugin system.
- Global `trurl` binary/package.
- Database-backed mode.
- Full semantic block editor.


## Writing Tool Inspirations: Scrivener, Manuskript, and TRURL

Scrivener and Manuskript are useful references because they treat longform writing as more than a single text buffer. They model writing as a project made of composition, organization, research, outline management, metadata, revision, and compile/export workflows. TRURL should study those patterns without cloning their product shape or abandoning its repository-first design.

### Why These Tools Matter

They are useful because they center workflows that matter for books and other longform projects:

- Project organization: documents, sections, folders, research, and project-level metadata live together.
- Composition: drafting happens in manageable units rather than one giant file.
- Research management: notes and references are close to the manuscript but separate from source prose.
- Outline management: structure can be inspected, rearranged, and annotated.
- Metadata: chapters and scenes can carry status, labels, summaries, targets, and revision notes.
- Revision: writers need snapshots, comparisons, draft states, and change review.
- Compile/export: writing source and final output are related but not the same concern.

### What TRURL Should Learn

TRURL should adapt these concepts in a source-first way:

- Binder/project tree: a navigation model for project, documents, manuscript files, notes, research, and canon records.
- Corkboard/card view: a card-based overview for chapters or scenes using titles, summaries, status, and order.
- Outliner: a dense structural view for document order, metadata, progress, and validation state.
- Chapter/scene metadata: explicit status, summary, target, POV, location, timeline, and revision fields where they fit TRURL conventions.
- Character/location/timeline integration: canon-aware writing context should remain a first-class part of the workspace.
- Research folder: keep notes, references, source excerpts, and preparation material close to the manuscript without mixing them into canonical prose.
- Snapshots/versioning: use Git-native snapshots and diffs rather than inventing a hidden history system.
- Writing targets: document, chapter, scene, and session progress can help writers understand momentum.
- Status tracking: draft/revised/locked/deprecated and later custom labels should be visible and filterable.
- Compile/export pipeline: TRURL should prepare source and render intent; OSER should own final rendering.
- Distraction-free writing mode: Focus Mode should keep improving as the primary drafting surface.

### What TRURL Should Not Copy Blindly

TRURL should avoid patterns that conflict with its source-first model:

- Do not become a proprietary monolith.
- Do not hide source files in opaque project formats.
- Do not make rich editor state the source of truth too early.
- Do not replace Git with an internal history system.
- Do not make export styling inseparable from writing.
- Do not require cloud sync.
- Do not make project organization depend on a database before plain files and manifests have been exhausted.

### TRURL's Differentiators

TRURL's direction should remain distinct:

- Markdown/source-first.
- Git-native.
- Local-first.
- Project and canon aware.
- AI-assisted but not AI-owned.
- OSER-compatible for publishing and export.
- Friendly to open formats and reviewable text diffs.
- Eventually useful for books, essays, articles, translations, editions, and microsites.

### Possible Scrivener/Manuskript-Inspired Features

#### P0 / Current Foundation

- Project manifest.
- Document metadata.
- Chapter list.
- Story-bible links.
- Focus Mode.
- Validation.
- Git status and scoped diff visibility.

#### P1 / Near-Term

- Document selector.
- Read-only Outliner view.
- Card/corkboard view for chapters.
- Chapter/scene metadata editor.
- Writing targets and progress.
- Research/notes panel.
- Snapshots via Git.
- Better search.

#### P2

- Drag-to-reorder outline with safe frontmatter updates.
- Split editor / compare view.
- Revision workflow.
- AI-assisted summaries and consistency checks.
- OSER-backed preview/export presets.

#### Later

- Full semantic editor.
- Plugin system.
- Collaboration.
- Optional cloud sync.
- Global packaged app.

## Local AI Strategy

TRURL should support local models first where practical. Ollama is already a useful integration target because it fits TRURL's local-first posture and can be run without sending manuscripts or canon records to external services. Specific model choices should remain examples to test later, not permanent product recommendations.

Local models should initially be used for bounded tasks:

- Summarization.
- Metadata extraction.
- Character/location detection.
- Outline suggestions.
- Canon consistency hints.
- Revision suggestions.
- Style checks.

AI should propose, not silently modify. AI outputs should be reviewable as structured proposals, warnings, or unified diffs. External/cloud models can remain optional later, but TRURL should not require them for core local workflows.

## Open Architecture Decisions

### Editor Model

Textarea plus Markdown helpers is the current safest model. CodeMirror is the likely next source-editor upgrade when search, folding, linting, keymaps, or large-file behavior become limiting. ProseMirror, TipTap, Milkdown, Lexical, or a custom semantic block editor should wait until TRURL has stricter document schemas and round-trip tests.

### Source of Truth

Markdown body text and frontmatter remain canonical. Rich editor state should not become hidden source of truth unless TRURL adopts a documented, diffable, and testable serialization model.

### Project Shape

The current behavior remains one repository as one project. `.trurl/project.json` creates a path toward one repository with many documents, editions, translations, or export profiles, but switching and alternate folder roots are deliberately deferred.

### TRURL vs OSER

TRURL owns source, canon, project metadata, Git workflows, validation, AI proposal guardrails, and document package preparation. OSER should own semantic rendering, editorial CSS, paged output, PDF, EPUB, and microwebsite exports.

### AI Proposal Safety

AI proposals should be represented as structured suggestions and reviewable diffs. AI should not write manuscript, story-bible, Git, or project state without explicit user action and a visible diff.

### Export Artifacts

Exports may be generated files or ephemeral previews. Generated exports are useful when reproducibility and review matter; ephemeral previews are useful for quick author feedback. The boundary should stay explicit, with source files never treated as derived output.

## Proposed Next Implementation Slices

### A. Create Roadmap/Backlog Document If Missing

Goal: Keep a living backlog that captures product direction, priorities, safety rules, and next implementation slices.

Files likely touched:

- `docs/roadmap/trurl-backlog.md`
- `README.md`

Non-goals:

- No app behavior changes.
- No backend endpoint changes.
- No dependencies.

Verification checklist:

- `npm run check`
- README links to the roadmap.
- Roadmap renders as readable Markdown.

### B. Project Manifest JSON Schema Foundation

Status: Implemented as a foundation pass. Keep future changes focused on schema evolution and validation refinements before document switching.

Goal: Maintain the formal schema for `.trurl/project.json` and test the current manifest against it.

Files likely touched:

- `schema/`
- `.trurl/project.json`
- `app/backend/lib/project.js`
- `test/project.test.mjs`
- `README.md`

Non-goals:

- No project switching UI.
- No folder loading changes.
- No migration tooling.

Verification checklist:

- `npm run test`
- `npm run check`
- Invalid paths and missing fields produce warnings or validation errors.
- Projects without a manifest still load defaults.

### C. Document Selector Read-Only UI

Status: Implemented as frontend groundwork. Keep future work focused on real selection only after folder-loading and save semantics are designed.

Goal: Display available documents from `project.documents` without changing the active document or folder loading behavior.

Files likely touched:

- `app/frontend/src/App.jsx`
- `app/frontend/src/components/WorkspaceSidebar.jsx`
- `app/frontend/src/styles.css`
- `app/frontend/README.md`

Non-goals:

- No real document switching.
- No alternate folder loading.
- No save behavior changes.

Verification checklist:

- `npm run build`
- `npm run check`
- Workspace loads with and without a manifest.
- UI clearly marks the current document.

### D. Read-Only Outliner View

Status: Implemented as frontend groundwork. Reordering, drag-and-drop, and metadata editing remain deferred.

Goal: Maintain a structural view of manuscript chapters with order, title, status, path, and linked canon counts.

Files likely touched:

- `app/frontend/src/App.jsx`
- New or existing frontend components under `app/frontend/src/components/`
- `app/frontend/src/styles.css`
- `app/frontend/README.md`

Non-goals:

- No drag reorder.
- No frontmatter editing.
- No document switching.

Verification checklist:

- `npm run build`
- `npm run check`
- Outliner reflects existing workspace data.
- Selecting a row does not alter save behavior.

### E. Add Chapter/Scene Metadata Editor

Goal: Design and implement a safe metadata editing path for selected frontmatter fields after schema and UX rules are clear.

Files likely touched:

- `app/backend/lib/manuscript.js`
- `app/backend/routes/workspace.js` or a new route only if approved
- `app/frontend/src/components/EditorPanel.jsx`
- `schema/`
- `test/`
- `app/backend/README.md`

Non-goals:

- No arbitrary frontmatter rewrite.
- No body text changes as part of metadata saves.
- No drag reorder in this slice.

Verification checklist:

- `npm run test`
- `npm run check`
- Existing body-only save remains unchanged.
- Metadata edits preserve unrelated frontmatter fields and formatting as much as practical.

### F. Add Writing Targets

Goal: Add optional project, document, chapter, or session writing targets derived from source metrics and future metadata.

Files likely touched:

- `.trurl/project.json` or future manifest schema
- `app/backend/lib/project.js`
- `app/frontend/src/components/EditorPanel.jsx`
- `app/frontend/src/components/WorkspaceSidebar.jsx`
- `test/`

Non-goals:

- No cloud analytics.
- No background tracking service.
- No hidden state outside repository files.

Verification checklist:

- `npm run test`
- `npm run check`
- Missing targets are handled gracefully.
- Word counts remain consistent with editor stats.

### G. Add AI Proposal Endpoint Returning Reviewable Suggestions/Diffs Only

Goal: Add a safe AI proposal endpoint that returns structured suggestions and unified diffs without applying changes.

Files likely touched:

- `app/backend/routes/ai.js`
- `app/backend/ai/`
- `app/backend/lib/manuscript.js`
- Frontend AI panel or `ContextPanel` integration
- `test/`
- `app/backend/README.md`

Non-goals:

- No automatic writes.
- No Git commits.
- No frontmatter edits.
- No applying diffs from the UI yet.

Verification checklist:

- `npm run test`
- `npm run check`
- Proposal endpoint rejects unsafe paths.
- Response includes source path, suggestion metadata, and diff text.
- Manuscript files remain unchanged after request.

### H. Add OSER-Backed Preview/Export Bridge

Goal: Replace the mock-only render path with an explicit bridge that can call OSER or an OSER-compatible adapter when configured.

Files likely touched:

- `app/backend/lib/render-package.js`
- `app/backend/routes/render.js`
- `app/frontend/src/components/RenderPackagePanel.jsx`
- `docs/architecture/oser-integration.md`
- `test/`

Non-goals:

- No implicit export writes.
- No generated output as source of truth.
- No required OSER dependency until the adapter contract is stable.

Verification checklist:

- `npm run test`
- `npm run check`
- Mock mode remains available.
- Preview/export diagnostics are explicit.
- Source files remain unchanged by preview requests.

## Safety Rules

- Markdown and frontmatter remain the source of truth.
- Preserve manuscript frontmatter unless a task explicitly changes frontmatter behavior.
- Use body-only save for manuscript edits unless a separate approved design expands this.
- No opaque project database.
- Do not execute arbitrary shell or Git commands from backend requests.
- Keep Git endpoints read-only until a dedicated Git workflow is designed.
- Do not let AI write files without explicit user action and a visible diff.
- Run `npm run check` before commit.
- Do not modify manuscript or story-bible content during infrastructure, layout, or architecture work.
- Keep generated outputs and source files clearly separated.
- Maintain backwards compatibility for repositories without `.trurl/project.json`.

## Git and Workflow Notes

Recommended workflow:

- Run `npm run check` before commit.
- Keep commits separated by concern: backend helper, frontend UI, docs, tests.
- Avoid `git add .`; stage only files relevant to the task.
- Use the Git panel for inspection only.
- Push only clean checkpoints with passing tests.
- Keep manuscript/story-bible content changes separate from infrastructure changes.

## Relationship With OSER

TRURL prepares and manages source, canon, project metadata, validation state, AI context, and render intent. OSER should render semantic document packages into HTML, CSS, PDF, EPUB, and web outputs.

The current render package panel is a mock bridge. It proves the shape of a TRURL document package without importing OSER, calling OSER, writing export files, or treating rendered output as canonical source.

Future OSER integration should remain explicit and testable:

- TRURL builds a document package.
- OSER or an adapter validates/render it.
- Outputs and diagnostics are returned or written as explicit derived artifacts.
- Source Markdown and story-bible records remain authoritative.

## Definition of Done for the Next Phase

TRURL should feel like a usable alpha when a local author can:

- Open a TRURL repository with one command.
- See project and current document metadata.
- Select a chapter.
- Write comfortably in Edit mode.
- Read source calmly in Read mode.
- Preview Markdown safely in Preview mode.
- Save manuscript body text without changing frontmatter.
- Validate repository health.
- Inspect Git status and scoped diffs.
- Create a render package or export preview through an explicit bridge.
- Request AI suggestions safely as reviewable proposals.
- Run `npm run check` and get a passing local quality gate.
