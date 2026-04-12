---
id: rev.001
title: "Clarity pass for pronoun and sound motif consistency"
status: open
branch: rev/telltale-clarity-pass
---

## Objective
Improve readability while preserving original voice intensity.

## Tasks
- [ ] Normalize references to "the old man" vs "he" when ambiguous.
- [ ] Mark one canonical spelling for repeated sound terms (beating/heartbeat).
- [ ] Ensure manuscript `status` moves from `draft` to `revised` only after prose review.

## Safety Checks
- Run `python3 scripts/validate_frontmatter.py`
- Run `python3 scripts/check_crossrefs.py`
- Run `python3 scripts/check_manuscript_order.py`
