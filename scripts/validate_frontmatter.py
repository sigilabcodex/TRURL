#!/usr/bin/env python3
"""Validate required frontmatter fields for manuscript and story-bible files."""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = {
    "manuscript": ["id", "title", "type", "order", "status", "character_ids", "location_ids", "timeline_ids"],
    "characters": ["id", "type", "name", "status", "canon"],
    "locations": ["id", "type", "name", "status", "canon"],
    "timeline": ["id", "type", "label", "sequence", "status", "canon"],
}


def parse_frontmatter(path: Path):
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        return None, "missing opening frontmatter delimiter"

    parts = text.split("\n---\n", 1)
    if len(parts) != 2:
        return None, "missing closing frontmatter delimiter"

    raw = parts[0].splitlines()[1:]
    data = {}
    current_key = None

    for line in raw:
        if not line.strip():
            continue
        if line.startswith("  - ") and current_key:
            data.setdefault(current_key, [])
            if not isinstance(data[current_key], list):
                return None, f"mixed scalar/list values for '{current_key}'"
            data[current_key].append(line[4:].strip().strip('"'))
            continue

        if ":" not in line:
            return None, f"malformed frontmatter line: {line}"

        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip()
        current_key = key

        if not value:
            data[key] = []
        else:
            value = value.strip('"')
            if value.isdigit():
                data[key] = int(value)
            else:
                data[key] = value

    return data, None


def classify(path: Path):
    rel = path.relative_to(ROOT)
    if rel.parts[0] == "manuscript":
        return "manuscript"
    if rel.parts[0] == "story-bible" and len(rel.parts) > 1:
        if rel.parts[1] in {"characters", "locations", "timeline"}:
            return rel.parts[1]
    return None


def main():
    errors = []
    md_files = list((ROOT / "manuscript").glob("*.md"))
    md_files += list((ROOT / "story-bible").glob("**/*.md"))

    for path in sorted(md_files):
        kind = classify(path)
        if not kind:
            continue

        fm, err = parse_frontmatter(path)
        rel = path.relative_to(ROOT)
        if err:
            errors.append(f"{rel}: {err}")
            continue

        for field in REQUIRED[kind]:
            if field not in fm:
                errors.append(f"{rel}: missing required field '{field}'")

    if errors:
        print("Frontmatter validation failed:")
        for e in errors:
            print(f"- {e}")
        return 1

    print("Frontmatter validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
