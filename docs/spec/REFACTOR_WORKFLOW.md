# Refactor Workflow (Entity Rename Example)

Practical branch workflow for safe cross-file literary refactors.

## 1) Create a branch

```bash
git checkout -b ops/rename-char-id
```

Keep one continuity objective per branch.

## 2) Preview the rename first

```bash
python3 scripts/rename_entity.py char.narrator char.protagonist --dry-run
```

Review the file list and replacement counts before modifying content.

## 3) Apply the rename

```bash
python3 scripts/rename_entity.py char.narrator char.protagonist
```

The tool updates references in `manuscript/` and `story-bible/`, and may rename the character file if it follows naming conventions.

## 4) Inspect changes

```bash
git status
git diff
```

Confirm the rename stayed mechanical (IDs only) and did not introduce prose regressions.

## 5) Re-run checks

```bash
python3 scripts/trurl_check.py
```

All checks should pass before commit.

## 6) Commit and push

```bash
git add manuscript story-bible scripts docs/spec/REFACTOR_WORKFLOW.md
git commit -m "Rename char ID and revalidate continuity"
git push -u origin ops/rename-char-id
```

If checks fail, fix issues and rerun checks before pushing.
