# TRURL Architecture (Initial Pass)

This document defines the initial architecture boundaries for TRURL.

## System View

TRURL is designed as a repository-first system. The repository itself functions as the persistent data layer.

```text
+---------------------+
| Author / Editor     |
+----------+----------+
           |
           v
+---------------------+        +---------------------+
| Frontend (future)   | <----> | Backend (future)    |
| Editor UI           |        | GitHub API Bridge   |
+----------+----------+        +----------+----------+
           |                              |
           +---------------+--------------+
                           |
                           v
                 +---------------------+
                 | Git Repository      |
                 | (Markdown + Canon)  |
                 +----------+----------+
                            |
                            v
                 +---------------------+
                 | AI Refactor Layer   |
                 | (diff + branch ops) |
                 +---------------------+
```

## Frontend (Editor UI)

Future responsibilities:

- browse and edit manuscript Markdown
- inspect story-bible records
- visualize frontmatter and canon links
- initiate branch-scoped rewrite workflows
- preview diffs before commit

The frontend is optional. Local editing in a text editor remains a first-class path.

## Backend (GitHub API Bridge)

Future responsibilities:

- expose safe repository operations to frontend clients
- create branches and pull requests
- run validation scripts
- broker AI tasks with repository context

The backend should avoid duplicating repository state; it orchestrates operations against Git.

## Repository as Database

TRURL uses the repository as its primary datastore:

- Markdown documents = narrative and canon records
- frontmatter = structured metadata
- JSON schema = validation contract
- commits/branches = historical and experimental state

No separate database is required for the initial architecture.

## Markdown Parser Layer

A parser layer (script/tool level) will eventually:

- read YAML frontmatter
- index chapter metadata
- extract references to characters/locations/timeline tags
- produce continuity-check inputs

This layer should remain lightweight and scriptable.

## AI Refactoring Layer

AI should operate under strict constraints:

- branch-only changes
- diff-first outputs
- frontmatter-aware edits
- canon-sensitive behavior

High-level flow:

```text
Request -> Context Build -> AI Proposal -> Diff Review -> Commit on Branch -> Merge Decision
```

## Branch Workflow

TRURL branch workflow (baseline):

1. Create branch for rewrite or refactor theme.
2. Apply manual and/or AI-assisted edits.
3. Validate metadata and canon consistency.
4. Review diff with narrative intent.
5. Commit with explicit scope.
6. Merge when approved.

```text
main
 ├── rewrite/alt-opening
 ├── refactor/continuity-pass
 └── ai/scene-compression-test
```
