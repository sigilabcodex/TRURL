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
- `docs/roadmap/trurl-backlog.md` — current backlog, priorities, open decisions, and next implementation slices

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

Self-hosted VPS/private-server deployment is planned as a secure, private-by-default profile. The first design drafts live in `docs/deployment/self-hosting.md` and `docs/deployment/security.md`; Docker, authentication, reverse proxy, and deployment files are intentionally deferred. Publicly exposed instances will require HTTPS plus a private network, identity gate, or equivalent access control.

## Project Manifest

TRURL can read optional project metadata from `.trurl/project.json`. The current repository includes a minimal manifest:

```json
{
  "schema": "trurl-project/v0",
  "title": "TRURL Demo Project",
  "defaultDocument": "main",
  "documents": [
    {
      "id": "main",
      "title": "Main Manuscript",
      "manuscriptPath": "manuscript",
      "storyBiblePath": "story-bible",
      "notesPath": "notes",
      "revisionPath": "revision",
      "renderPresets": ["editorial-default"]
    }
  ]
}
```

The formal schema lives at `schema/trurl-project.schema.json`. It keeps required v0 fields explicit while allowing additional properties for forward compatibility as the manifest evolves.

Projects without this file still load with the existing one-repository/one-project defaults. When a manifest is missing or structurally invalid, TRURL falls back to the safe default project and includes simple `project.warnings` and `project.errors` arrays in the workspace payload. Recoverable issues, such as a `defaultDocument` that does not match any document id, keep the manifest loaded and derive `project.currentDocument` from the first document. The manifest is a backwards-compatible metadata foundation only; document switching UI, alternate folder loading, multi-project switching UI, databases, and cloud sync are deferred.

## Testing

Run the lightweight local test suite from the repository root:

```bash
npm run test
```

Run tests, backend syntax checks, launcher syntax check, and the frontend production build together:

```bash
npm run check
```

The test suite uses Node's built-in test runner and avoids browser automation for now.

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
