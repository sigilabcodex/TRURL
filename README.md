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

## Feature Goals

- Repository-first manuscript authoring
- Story bible and continuity metadata management
- Branch-based rewriting and experimental narrative paths
- AI-assisted editing and structural refactoring
- Canon-aware consistency checks
- Future browser-based interface without breaking local/offline workflow

## Architecture Overview

TRURL starts as a repository architecture, then grows into toolchains and services:

1. **Repository layer**: Markdown files, schema drafts, and scripts
2. **Metadata layer**: frontmatter and canon documents
3. **Automation layer**: AI and validation scripts operating via Git diffs
4. **Application layer (future)**: frontend editor + backend GitHub bridge

The repository must remain fully usable without the web app. The web app is an optional control surface, not the source of truth.

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
