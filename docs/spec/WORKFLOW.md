# Workflow Conventions

Operational Git workflow for TRURL repositories.

## Branch Naming

Suggested prefixes:

- `draft/<scope>` — early prose development.
- `rev/<scope>` — revision pass against existing manuscript.
- `canon/<scope>` — story-bible and continuity updates.
- `ai/<scope>` — AI-proposed edits requiring explicit human review.
- `ops/<scope>` — scripts, schema, and repository tooling.

Examples:

- `rev/telltale-clarity-pass`
- `canon/police-rank-normalization`
- `ai/scene-compression-01`

## Revision Workflow

1. Open branch with one clear objective.
2. Update `revision/` task file with intent and acceptance criteria.
3. Edit manuscript/canon/notes as needed.
4. Run validation scripts before commit.
5. Commit related changes together.
6. Summarize what changed and why in commit message.

## AI Edit Policy

AI edits are proposals, not automatic truth.

- AI changes must be in dedicated `ai/*` branch.
- AI must produce diff-sized, reviewable batches.
- Human reviewer confirms:
  - continuity correctness
  - voice/style fit
  - frontmatter integrity
  - cross-reference resolution
- Merge only after script checks pass.

## Safe Find/Replace Operations

For batch text operations:

1. scope files explicitly (`manuscript/` only, or a specific subset).
2. preview matches first.
3. avoid replacing IDs (`char.*`, `loc.*`, `time.*`) unless intentional.
4. run cross-reference checks after replacement.
5. commit replacements separately from substantive prose rewrites.

## Commit Grouping Rules

Commit together:

- one coherent narrative change and its required metadata updates.
- one canon update and linked timeline fixes.
- one script change and its usage docs/tests.

Commit separately:

- mechanical renames vs content rewrites.
- manuscript prose changes vs tooling/schema changes.
- AI-generated bulk edits vs manual cleanup.

This keeps diffs reviewable and rollback-safe.
