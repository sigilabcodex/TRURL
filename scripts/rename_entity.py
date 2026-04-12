#!/usr/bin/env python3
"""Safely rename a canonical entity ID across manuscript and story-bible files."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SCOPED_DIRS = ("manuscript", "story-bible")


@dataclass
class FileEdit:
    path: Path
    new_text: str
    replacements: int


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("old_id", help="Existing canonical ID (example: char.narrator)")
    parser.add_argument("new_id", help="New canonical ID (example: char.protagonist)")
    parser.add_argument("--dry-run", action="store_true", help="Preview edits without writing files")
    return parser.parse_args()


def validate_ids(old_id: str, new_id: str) -> None:
    if old_id == new_id:
        raise ValueError("old_id and new_id are identical; nothing to rename")

    for value, label in ((old_id, "old_id"), (new_id, "new_id")):
        if not re.fullmatch(r"char\.[a-z0-9-]+", value):
            raise ValueError(f"{label} must match pattern 'char.<slug>'")


def parse_frontmatter(path: Path) -> dict[str, str | list[str]] | None:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        return None
    parts = text.split("\n---\n", 1)
    if len(parts) != 2:
        return None

    data: dict[str, str | list[str]] = {}
    current_key: str | None = None
    for line in parts[0].splitlines()[1:]:
        if not line.strip():
            continue
        if line.startswith("  - ") and current_key:
            data.setdefault(current_key, [])
            if isinstance(data[current_key], list):
                data[current_key].append(line[4:].strip().strip('"'))
            continue
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        current_key = key.strip()
        data[current_key] = value.strip().strip('"')
    return data


def collect_md_files() -> list[Path]:
    files: list[Path] = []
    for dirname in SCOPED_DIRS:
        files.extend(sorted((ROOT / dirname).glob("**/*.md")))
    return files


def ensure_safe_operation(old_id: str, new_id: str, files: list[Path]) -> Path:
    char_files = sorted((ROOT / "story-bible" / "characters").glob("*.md"))

    old_file: Path | None = None
    for path in char_files:
        fm = parse_frontmatter(path)
        if fm and fm.get("id") == old_id:
            old_file = path
            break

    if not old_file:
        raise RuntimeError(f"No character file found with id '{old_id}' in story-bible/characters")

    for path in char_files:
        fm = parse_frontmatter(path)
        if fm and fm.get("id") == new_id:
            raise RuntimeError(f"Refusing rename: target id '{new_id}' already exists")

    occurrences = 0
    pattern = build_token_pattern(old_id)
    for path in files:
        text = path.read_text(encoding="utf-8")
        occurrences += len(pattern.findall(text))

    if occurrences == 0:
        raise RuntimeError(f"No occurrences of '{old_id}' found in scoped files")

    return old_file


def build_token_pattern(entity_id: str) -> re.Pattern[str]:
    escaped = re.escape(entity_id)
    return re.compile(rf"(?<![A-Za-z0-9_.-]){escaped}(?![A-Za-z0-9_.-])")


def plan_text_edits(files: list[Path], old_id: str, new_id: str) -> list[FileEdit]:
    pattern = build_token_pattern(old_id)
    edits: list[FileEdit] = []

    for path in files:
        text = path.read_text(encoding="utf-8")
        new_text, count = pattern.subn(new_id, text)
        if count:
            edits.append(FileEdit(path=path, new_text=new_text, replacements=count))

    return edits


def expected_character_filename(char_id: str) -> str:
    return f"char-{char_id.split('.', 1)[1]}.md"


def apply_edits(edits: list[FileEdit], dry_run: bool) -> None:
    if dry_run:
        return
    for edit in edits:
        edit.path.write_text(edit.new_text, encoding="utf-8")


def maybe_rename_character_file(old_file: Path, old_id: str, new_id: str, dry_run: bool) -> tuple[Path, Path] | None:
    expected_old = expected_character_filename(old_id)
    if old_file.name != expected_old:
        return None

    new_name = expected_character_filename(new_id)
    new_path = old_file.with_name(new_name)
    if new_path.exists() and new_path != old_file:
        raise RuntimeError(f"Refusing file rename: target file already exists: {new_path.relative_to(ROOT)}")

    if new_path == old_file:
        return None

    if not dry_run:
        old_file.rename(new_path)

    return old_file, new_path


def main() -> int:
    args = parse_args()
    try:
        validate_ids(args.old_id, args.new_id)
    except ValueError as exc:
        print(f"Error: {exc}")
        return 2

    files = collect_md_files()

    try:
        old_file = ensure_safe_operation(args.old_id, args.new_id, files)
    except RuntimeError as exc:
        print(f"Error: {exc}")
        return 1

    edits = plan_text_edits(files, args.old_id, args.new_id)
    file_move: tuple[Path, Path] | None = None

    print(f"Rename plan: {args.old_id} -> {args.new_id}")
    print(f"Mode: {'dry-run' if args.dry_run else 'apply'}")

    if not edits:
        print("No content edits required.")
    else:
        print("\nFiles to update:")
        for edit in edits:
            rel = edit.path.relative_to(ROOT)
            print(f"- {rel} ({edit.replacements} replacement{'s' if edit.replacements != 1 else ''})")

    try:
        file_move = maybe_rename_character_file(old_file, args.old_id, args.new_id, args.dry_run)
    except RuntimeError as exc:
        print(f"Error: {exc}")
        return 1

    if file_move:
        old_path, new_path = file_move
        print(f"- file rename: {old_path.relative_to(ROOT)} -> {new_path.relative_to(ROOT)}")

    if args.dry_run:
        print("\nDry-run complete. No files were modified.")
        return 0

    apply_edits(edits, dry_run=False)
    print("\nRename complete.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
