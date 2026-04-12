#!/usr/bin/env python3
"""Verify manuscript filename numbering and frontmatter order consistency."""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PATTERN = re.compile(r"^(\d{2})-[a-z0-9-]+\.md$")


def parse_order(path: Path):
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        return None
    parts = text.split("\n---\n", 1)
    if len(parts) != 2:
        return None
    for line in parts[0].splitlines():
        if line.startswith("order:"):
            value = line.split(":", 1)[1].strip()
            if value.isdigit():
                return int(value)
    return None


def main():
    files = sorted((ROOT / "manuscript").glob("*.md"))
    errors = []
    prefixes = []

    for path in files:
        m = PATTERN.match(path.name)
        if not m:
            errors.append(f"{path.relative_to(ROOT)}: filename does not match NN-slug.md")
            continue

        prefix = int(m.group(1))
        prefixes.append(prefix)

        order = parse_order(path)
        if order is None:
            errors.append(f"{path.relative_to(ROOT)}: missing numeric frontmatter order")
        elif order != prefix:
            errors.append(f"{path.relative_to(ROOT)}: frontmatter order {order} does not match filename prefix {prefix}")

    for prev, curr in zip(prefixes, prefixes[1:]):
        if curr != prev + 1:
            errors.append(f"manuscript numbering gap or jump: {prev:02d} -> {curr:02d}")

    if errors:
        print("Manuscript order check failed:")
        for e in errors:
            print(f"- {e}")
        return 1

    print("Manuscript order check passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
