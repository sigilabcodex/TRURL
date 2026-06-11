# TRURL Chapter Metadata Model

This note defines the read-only chapter and scene metadata model TRURL currently understands from manuscript frontmatter. It does not introduce metadata editing, migrations, drag-and-drop ordering, or save behavior changes.

Markdown body text remains canonical for prose. Frontmatter remains canonical for chapter metadata. The current editor save path is still body-only and preserves the existing frontmatter block verbatim.

## Current Runtime Shape

```json
{
  "id": "ms.opening-confession",
  "title": "Opening Confession",
  "type": "chapter",
  "order": 1,
  "status": "revised",
  "character_ids": ["char.narrator"],
  "location_ids": ["loc.old-man-house"],
  "timeline_ids": ["time.vulture-eye-obsession"],
  "source_text": "The Tell-Tale Heart",
  "source_url": "https://www.gutenberg.org/ebooks/2148"
}
```

`GET /api/workspace` exposes normalized chapter fields for existing UI behavior and also includes a read-only `metadata` object containing the parsed frontmatter for display groundwork.

## Currently Observed Fields

These fields exist in the sample corpus or current schema and are display-only in the UI:

- `id`: stable manuscript record id, usually `ms.*`.
- `title`: chapter or scene title.
- `type`: current values include `chapter`; schema also allows `interlude`, `appendix`, and `fragment`.
- `order`: numeric manuscript ordering signal.
- `status`: current values include `draft` and `revised`; schema also allows `locked` and `deprecated`.
- `character_ids`: linked story-bible character ids.
- `location_ids`: linked story-bible location ids.
- `timeline_ids`: linked timeline ids.
- `source_text`: source or adaptation reference label.
- `source_url`: source reference URL.

## Recommended Future Fields

These fields are safe to display when present and may become editable later after a dedicated frontmatter editing design exists:

- `source`: preferred future alias for `source_text` when the value is not specifically a text title.
- `canon`: chapter-level canon state such as `canonical` or `provisional`.
- `pov`: point-of-view character or narrator label.
- `location`: human-readable primary location label, separate from `location_ids`.
- `characters`: human-readable or shorthand participant list, separate from canonical `character_ids`.
- `timeline`: human-readable timeline label or shorthand list, separate from canonical `timeline_ids`.
- `tags`: freeform planning labels.
- `summary`: compact chapter or scene summary.
- `revision_notes`: short editorial note for revision planning.

## Metadata Health

TRURL presents frontend-only Metadata Health as advisory guidance. It is not a replacement for repository validation scripts and does not block save, render, export, or Git actions.

Current issue levels:

- Warning: missing frontmatter `id`.
- Warning: missing frontmatter `title`.
- Warning: unknown `type`.
- Warning: unknown `status`.
- Info: `source`/`source_text` exists without `source_url`, or `source_url` exists without source text.
- Info: empty `summary`.
- Info: no linked characters.
- Info: no linked locations.
- Info: no timeline signals.

These issues are intentionally gentle. They make metadata gaps visible in the Inspector, Outliner, and Validation drawer without editing files.

## Display-Only Rules For Now

- Inspector, Outliner, and Validation drawer may show supported metadata and gentle advisory health notes.
- Missing `id` or `title` is a display note, not a blocking validation error in the frontend.
- Unknown `status` or `type` is a display note, not a save blocker.
- Scalar and array tag forms are normalized for display.
- `source` and `source_text` are treated as display aliases.
- Frontend metadata normalization must not mutate chapter data.

## Later Editable Candidates

Good candidates for future controlled editing:

- `title`
- `type`
- `status`
- `pov`
- `location`
- `tags`
- `summary`
- `revision_notes`

Fields that affect structure or references should wait for stricter validation and review UI:

- `id`
- `order`
- `character_ids`
- `location_ids`
- `timeline_ids`

## Explicit Deferrals

This metadata groundwork does not implement:

- Metadata editing.
- Blocking save/export based on frontend Metadata Health.
- Frontmatter write APIs.
- Reordering or drag-and-drop.
- Document switching.
- Save behavior changes.
- Migration of existing manuscript files.
