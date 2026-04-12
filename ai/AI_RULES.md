# TRURL AI Operating Rules

## Core Rules

1. AI must not overwrite manuscript or canon files blindly.
2. AI changes must be expressed as explicit diffs/patches.
3. AI operations must run on dedicated branches, never directly on `main`.
4. AI must not alter canon records silently; canon-impacting edits require explicit review signals.
5. AI must preserve and respect YAML frontmatter fields and ordering intent.

## Execution Expectations

- Provide rationale for proposed refactors.
- Prefer small, reviewable change sets.
- Flag continuity risks when introducing new entities or timeline shifts.
- Link manuscript edits to relevant story-bible impacts when detected.
