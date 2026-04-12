# Validation and Refactor Scripts

Run scripts from repository root.

## Unified validation runner

Run all repository checks in one command:

- `python3 scripts/trurl_check.py`

This runs, in order:

1. `scripts/validate_frontmatter.py`
2. `scripts/check_crossrefs.py`
3. `scripts/check_manuscript_order.py`

If any check fails, `trurl_check.py` exits non-zero and prints a summary.

## Individual checks

Use these when you want a narrower validation pass:

- `python3 scripts/validate_frontmatter.py`
- `python3 scripts/check_crossrefs.py`
- `python3 scripts/check_manuscript_order.py`

## Safe entity rename utility

Rename a canonical character ID across `manuscript/` and `story-bible/`:

- Dry run (recommended first):
  - `python3 scripts/rename_entity.py char.narrator char.protagonist --dry-run`
- Apply changes:
  - `python3 scripts/rename_entity.py char.narrator char.protagonist`

Behavior notes:

- currently supports `char.*` IDs only.
- refuses to run if source ID is missing in `story-bible/characters/`.
- refuses to run if destination ID already exists.
- shows all files that would be changed.
- renames the matching character file when its filename follows convention (`char-<slug>.md`).

## Suggested local workflow on a feature branch

1. create a branch (for example `ops/entity-rename-pass`).
2. run `rename_entity.py` with `--dry-run`.
3. apply rename after review.
4. run `python3 scripts/trurl_check.py`.
5. commit related script + content changes together.

These scripts are intentionally lightweight and dependency-free.
