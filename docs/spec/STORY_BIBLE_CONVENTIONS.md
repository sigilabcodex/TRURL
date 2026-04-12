# Story Bible Conventions

This document defines file shape and ID rules for `story-bible/`.

## Directory Scope

- `story-bible/characters/`: one file per character.
- `story-bible/locations/`: one file per location.
- `story-bible/timeline/`: one file per timeline event.

## ID and Naming Conventions

- Character IDs: `char.<slug>` (example: `char.narrator`).
- Location IDs: `loc.<slug>` (example: `loc.old-man-house`).
- Timeline IDs: `time.<slug>` (example: `time.police-arrival`).
- File names should mirror IDs without prefix punctuation where practical:
  - `char-narrator.md`
  - `loc-old-man-house.md`
  - `time-police-arrival.md`

## Character File Structure

Required frontmatter:

- `id`
- `type: character`
- `name`
- `status`
- `canon` (`canonical` or `provisional`)

Recommended body sections:

1. `## Summary`
2. `## Motivations`
3. `## Relationships`
4. `## Evidence` (chapter/timeline references)

## Location File Structure

Required frontmatter:

- `id`
- `type: location`
- `name`
- `status`
- `canon`

Recommended body sections:

1. `## Description`
2. `## Narrative Function`
3. `## Linked Events`

## Timeline Entry Structure

Required frontmatter:

- `id`
- `type: timeline`
- `label`
- `sequence` (integer-like string for now)
- `status`
- `canon`

Recommended body fields/sections:

- `character_ids`
- `location_ids`
- `source_manuscript`
- short `## Event` paragraph

## Canonical vs Provisional Facts

- `canon: canonical` means accepted truth in current branch.
- `canon: provisional` means unresolved/branch-local assumption.
- Provisional records must include a note in body (`## Open Questions` or equivalent).

## Aliases and Uncertain Facts

- Keep aliases in frontmatter `aliases` list.
- Use `uncertain_facts` in body as bullets with confidence tags:
  - `[low]`, `[medium]`, `[high]`
- Do not silently promote uncertain facts to canonical. Update `canon` status in an explicit continuity commit.
