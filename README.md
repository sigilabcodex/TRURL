# TRURL

**T.R.U.R.L. — TRURL (is a) Repository Utility for Restructuring Literature**

TRURL is a Git-native writing environment for longform narrative work. The repository is the writing studio: manuscripts live as Markdown files, canon is recorded in dedicated story-bible documents, and revision history is preserved through branching and commits.

The goal is not to replace authorship with automation. The goal is to create a structured system where human intent leads, AI assists, and continuity remains trackable at every step.

## Philosophy: Git-Native Writing

- **Markdown is truth**: narrative, canon, notes, and revision context are plain text.
- **Git is memory**: commits and branches are the authoritative revision engine.
- **AI is assistant**: AI proposes structured changes through diffs, never opaque overwrite.
- **Structure over formatting**: semantic organization comes before presentation.
- **Refactoring over rewriting**: improve manuscripts with traceable transformations.
- **Canon over improvisation**: continuity and lore integrity are first-class constraints.

## Operational Specs (Second Pass)

- `docs/spec/MANUSCRIPT_CONVENTIONS.md`
- `docs/spec/STORY_BIBLE_CONVENTIONS.md`
- `docs/spec/FRONTMATTER.md`
- `docs/spec/WORKFLOW.md`
- `docs/spec/SAMPLE_CORPUS.md`
- `docs/architecture/oser-integration.md` — planned TRURL ↔ OSER rendering/export architecture boundary

## Validation Scripts

Run from repository root:

- `python3 scripts/validate_frontmatter.py`
- `python3 scripts/check_crossrefs.py`
- `python3 scripts/check_manuscript_order.py`

## Run Locally

Install the app dependencies from the repository root:

```bash
npm install --prefix app/backend
npm install --prefix app/frontend
```

Start the backend and frontend together:

```bash
npm run trurl
```

This starts the local backend on `http://localhost:4177` and the Vite frontend on `http://localhost:5173` unless Vite selects the next available port. The frontend proxies `/api` requests to the backend.

The same launcher is also available as:

```bash
npm run dev
```

Individual development commands are available when needed:

```bash
npm run dev:backend
npm run dev:frontend
npm run build
npm run check
```

For command-style local usage without global packaging, add a temporary shell alias with your local repository path:

```bash
alias trurl='cd /path/to/TRURL && npm run trurl'
```

A real global `trurl` binary is intentionally deferred to a future packaging step.

## Folder Layout

- `docs/` — project-level documentation, specifications, and architecture
  - `docs/spec/` — formal project specification documents
  - `docs/architecture/` — system architecture and component design
- `manuscript/` — chapter/prologue Markdown source files
- `story-bible/` — canonical world-state references
  - `story-bible/characters/` — character dossiers
  - `story-bible/locations/` — location records
  - `story-bible/timeline/` — timeline continuity records
- `notes/` — exploratory writing notes, research fragments, ideation
- `revision/` — revision plans, edit logs, and branch-specific change notes
- `ai/` — AI operating policies, prompts, and guardrail documents
- `app/` — future web application boundary
  - `app/frontend/` — editor UI and client interfaces (future)
  - `app/backend/` — API bridge and orchestration services (future)
- `schema/` — JSON schemas for document metadata and canon structures
- `scripts/` — lightweight repository automation tools

## Roadmap

### v0.1 — Repository + Markdown Core
- Bootstrap repository architecture
- Define manuscript and canon document conventions
- Establish schema draft and AI rule constraints

### v0.2 — AI Refactor Tooling
- Introduce scriptable AI-assisted refactor workflows
- Enforce branch-only AI operations with diff outputs
- Add canon/frontmatter validation checks

### v0.3 — Web Editor Surface
- Build minimal frontend for manuscript and bible browsing/editing
- Add backend bridge for safe Git operations
- Preserve full offline usability through repository-first design
