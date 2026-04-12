# Frontmatter Specification (v0.2 draft)

Minimal frontmatter contract for TRURL Markdown documents.

## General

- Frontmatter must be YAML between opening/closing `---` lines.
- IDs are string identifiers and are case-sensitive.
- Lists must be YAML arrays.

## Manuscript Files (`manuscript/*.md`)

### Required

- `id` (string, pattern suggestion: `ms.<slug>`)
- `title` (string)
- `type` (enum: `chapter`, `interlude`, `appendix`, `fragment`)
- `order` (integer)
- `status` (enum: `draft`, `revised`, `locked`, `deprecated`)
- `character_ids` (string array, `char.*` IDs)
- `location_ids` (string array, `loc.*` IDs)
- `timeline_ids` (string array, `time.*` IDs)

### Optional

- `source_text` (string, for imported public-domain corpora)
- `source_url` (string URL)
- `notes` (string)

## Character Files (`story-bible/characters/*.md`)

### Required

- `id` (string, `char.*`)
- `type` (`character`)
- `name` (string)
- `status` (string)
- `canon` (`canonical` or `provisional`)

### Optional

- `aliases` (string array)
- `first_appearance` (string path)
- `tags` (string array)

## Location Files (`story-bible/locations/*.md`)

### Required

- `id` (string, `loc.*`)
- `type` (`location`)
- `name` (string)
- `status` (string)
- `canon` (`canonical` or `provisional`)

### Optional

- `aliases` (string array)
- `region` (string)

## Timeline Files (`story-bible/timeline/*.md`)

### Required

- `id` (string, `time.*`)
- `type` (`timeline`)
- `label` (string)
- `sequence` (integer)
- `status` (string)
- `canon` (`canonical` or `provisional`)

### Optional

- `character_ids` (string array)
- `location_ids` (string array)
- `source_manuscript` (string path)

## Canonical Examples

### Manuscript

```yaml
---
id: ms.police-arrival
title: "Police Arrival"
type: chapter
order: 3
status: revised
character_ids:
  - char.narrator
  - char.police-officers
location_ids:
  - loc.old-man-house
timeline_ids:
  - time.police-arrival
source_text: "The Tell-Tale Heart"
source_url: "https://www.gutenberg.org/ebooks/2148"
---
```

### Character

```yaml
---
id: char.narrator
type: character
name: "Unnamed Narrator"
status: active
canon: canonical
aliases:
  - "The Confessor"
first_appearance: manuscript/01-opening-confession.md
---
```

### Location

```yaml
---
id: loc.old-man-house
type: location
name: "Old Man's House"
status: active
canon: canonical
aliases:
  - "The Chamber"
region: "Unnamed town"
---
```

### Timeline

```yaml
---
id: time.vulture-eye-obsession
type: timeline
label: "Obsession with the Eye"
sequence: 1
status: fixed
canon: canonical
character_ids:
  - char.narrator
  - char.old-man
location_ids:
  - loc.old-man-house
source_manuscript: manuscript/01-opening-confession.md
---
```
