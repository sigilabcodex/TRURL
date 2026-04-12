# Manuscript Conventions

This document defines the operational rules for files under `manuscript/`.

## File Naming

- Filename pattern: `NN-slug.md`
  - `NN` is a zero-padded integer (`01`, `02`, ...).
  - `slug` is lowercase kebab-case and should describe narrative function (`opening-confession`, `arrival-at-vault`).
- One narrative unit per file.
- Reserved ranges:
  - `01-69`: mainline narrative units.
  - `70-79`: interludes.
  - `80-89`: appendices embedded in manuscript flow.
  - `90-99`: fragments, alternates, and draft experiments.

## Numbering and Order

- Files are read in lexical order and expected to match narrative order.
- Frontmatter `order` must match filename numeric prefix.
- Do not renumber old files casually; do it as a single explicit restructuring commit.

## Scene Split Recommendations

- Split when any of these changes occur:
  - POV switch.
  - major location change.
  - meaningful timeline jump.
  - explicit structural break (new chapter-like beat).
- Avoid micro-files for every paragraph. A scene-sized unit is preferred.

## Drafts, Fragments, and Appendices

- Set `type` in frontmatter:
  - `chapter` (default narrative unit)
  - `interlude`
  - `appendix`
  - `fragment`
- Set `status` to represent readiness:
  - `draft`, `revised`, `locked`, `deprecated`
- Experimental alternates live in `manuscript/90-*.md` with `type: fragment` and should be linked from `revision/` tasks before merge decisions.

## Cross-References from Manuscript

Use IDs, not prose names, in frontmatter:

- `character_ids`: list of `char.*` IDs.
- `location_ids`: list of `loc.*` IDs.
- `timeline_ids`: list of `time.*` IDs.

These IDs must resolve to files in `story-bible/characters`, `story-bible/locations`, and `story-bible/timeline`.

## What Goes Where

- `manuscript/`: canonical narrative text that readers would read.
- `notes/`: exploratory research, open questions, scraps, speculative alternatives.
- `revision/`: actionable edit plans, branch-level edit logs, and decision records.

Rule of thumb: if it is canon text, it belongs in `manuscript/`; if it is thinking, it belongs in `notes/`; if it is a queued or completed editorial action, it belongs in `revision/`.
