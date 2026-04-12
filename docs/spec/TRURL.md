# TRURL Specification

## Purpose

TRURL is a repository-native system for building and revising longform narrative projects. It treats writing as a structured, evolvable codebase where text, canon, and revision context are versioned together.

## Core Concepts

1. **Repository as workspace**: all narrative artifacts are persisted in Git.
2. **Documented structure**: manuscript, canon, notes, and revision layers are explicit directories.
3. **Traceable change**: edits are recorded as commits, comparisons, and branch histories.
4. **Human-led workflow**: AI supports transformation, but authors control acceptance.

## Markdown as Source of Truth

Markdown files are the canonical storage format for manuscript chapters, story-bible records, and operational notes. Any future UI or API must consume and emit Markdown-compatible changes.

## Git as Revision Engine

Git provides:

- version history
- branching for alternate drafts
- diff-based review
- merge-based integration
- reproducible checkpoints for narrative state

Git operations are not implementation detail; they are a core design primitive.

## AI as Refactoring Layer

AI in TRURL is constrained to assisted refactoring operations:

- suggest structural edits
- propose continuity repairs
- generate patch/diff candidates
- summarize branch-level narrative deltas

AI output must be inspectable and commit-safe.

## Structure vs Text Editing

TRURL distinguishes between:

- **Text editing**: sentence-level prose changes
- **Structure editing**: chapter boundaries, metadata, canon links, timeline alignment

The architecture prioritizes structure visibility to support large narrative systems.

## Canon Management

Canon is stored in `story-bible/` and treated as a first-class system dependency. Changes to canon are explicit, reviewable, and linked to manuscript implications.

## Continuity Tracking

Continuity is tracked through:

- frontmatter metadata (`characters`, `location`, `timeline`, `status`)
- timeline records
- character/location references
- revision notes for canon-impacting edits

## Branch-Based Rewriting

Major rewrites should occur in dedicated branches. Branches support:

- speculative narrative variants
- focused editorial campaigns
- safe AI-assisted experiments
- controlled merge decisions into primary narrative lines
