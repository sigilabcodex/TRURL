#!/usr/bin/env python3
"""Run TRURL validation checks through a unified local entrypoint."""

from __future__ import annotations

from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]

CHECKS = [
    ("Frontmatter validation", [sys.executable, "scripts/validate_frontmatter.py"]),
    ("Cross-reference validation", [sys.executable, "scripts/check_crossrefs.py"]),
    ("Manuscript order validation", [sys.executable, "scripts/check_manuscript_order.py"]),
]


def run_check(name: str, command: list[str]) -> tuple[bool, int]:
    print(f"\n==> {name}")
    completed = subprocess.run(command, cwd=ROOT)
    ok = completed.returncode == 0
    print(f"[{ 'PASS' if ok else 'FAIL' }] {name}")
    return ok, completed.returncode


def main() -> int:
    results: list[tuple[str, bool, int]] = []

    for name, command in CHECKS:
        ok, code = run_check(name, command)
        results.append((name, ok, code))

    failed = [name for name, ok, _ in results if not ok]

    print("\n=== TRURL Check Summary ===")
    for name, ok, _ in results:
        status = "PASS" if ok else "FAIL"
        print(f"- {status}: {name}")

    if failed:
        print("\nOne or more checks failed.")
        return 1

    print("\nAll checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
