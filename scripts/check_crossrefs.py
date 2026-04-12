#!/usr/bin/env python3
"""Check manuscript cross-reference IDs against story-bible IDs."""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]


def parse_frontmatter(path: Path):
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        return None
    parts = text.split("\n---\n", 1)
    if len(parts) != 2:
        return None

    raw = parts[0].splitlines()[1:]
    data = {}
    current_key = None
    for line in raw:
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
        key = key.strip()
        value = value.strip()
        current_key = key
        data[key] = [] if not value else value.strip('"')
    return data


def collect_ids(directory: str):
    ids = set()
    for path in sorted((ROOT / directory).glob("*.md")):
        fm = parse_frontmatter(path)
        if fm and isinstance(fm.get("id"), str):
            ids.add(fm["id"])
    return ids


def as_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def main():
    char_ids = collect_ids("story-bible/characters")
    loc_ids = collect_ids("story-bible/locations")
    time_ids = collect_ids("story-bible/timeline")

    errors = []
    for path in sorted((ROOT / "manuscript").glob("*.md")):
        fm = parse_frontmatter(path)
        if not fm:
            errors.append(f"{path.relative_to(ROOT)}: missing or malformed frontmatter")
            continue

        for ref in as_list(fm.get("character_ids")):
            if ref not in char_ids:
                errors.append(f"{path.relative_to(ROOT)}: unresolved character_id '{ref}'")
        for ref in as_list(fm.get("location_ids")):
            if ref not in loc_ids:
                errors.append(f"{path.relative_to(ROOT)}: unresolved location_id '{ref}'")
        for ref in as_list(fm.get("timeline_ids")):
            if ref not in time_ids:
                errors.append(f"{path.relative_to(ROOT)}: unresolved timeline_id '{ref}'")

    if errors:
        print("Cross-reference check failed:")
        for e in errors:
            print(f"- {e}")
        return 1

    print("Cross-reference check passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
