# TRURL and OSER Integration Architecture

This document describes a future integration boundary between TRURL and OSER.

OSER, the Open Source Editorial Renderer, is expected to become a rendering, design, and export engine for structured Markdown projects. TRURL should remain the repository-first writing, canon, Git, and AI workspace. The integration should let OSER live inside a TRURL workflow as an editorial rendering layer without making rendered output the source of truth.

This is an architecture note only. It does not add OSER code, runtime dependencies, rendering endpoints, frontend UI, or export behavior.

## Responsibilities

### TRURL Owns

- Manuscript Markdown under `manuscript/`.
- Story-bible records under `story-bible/`.
- Notes, revision plans, and workflow documentation.
- Frontmatter conventions and validation rules.
- Repository indexing and workspace snapshots.
- Git-native branch, diff, review, and merge workflows.
- AI guardrails, context assembly, and proposal workflows.
- Safe local backend APIs that read or update repository files explicitly.

TRURL is responsible for preserving authorial and canonical state. It may prepare structured context for renderers, but it should not treat rendered output as canonical manuscript data.

### OSER Owns

- Structured Markdown to semantic HTML transformation.
- Editorial HTML conventions and accessibility-oriented markup.
- CSS design systems, layout presets, and typography rules.
- Paged HTML behavior for print-oriented output.
- Export pipelines for HTML, PDF, EPUB, and web bundles.
- Render validation, layout warnings, and export diagnostics.
- Reusable document models for rendering and styling.

OSER should consume structured document packages and produce derived outputs. It should not decide canon, rewrite prose, or mutate TRURL manuscript files.

### Outside Both For Now

- Cloud hosting and publication platforms.
- Commercial print vendor integrations.
- Collaborative real-time editing.
- Rights management, DRM, and sales/distribution workflows.
- Binary asset management beyond references to repository files.
- Visual page-builder state that cannot be represented as text config.

Those areas may become integrations later, but they should not shape the first TRURL and OSER contract.

## Conceptual Model

TRURL and OSER should use a clear data flow:

```text
TRURL Markdown + canon
        |
        v
TRURL workspace snapshot
        |
        v
TRURL document package
        |
        v
OSER document model
        |
        v
Generated outputs
```

### Source of Truth

TRURL manuscript and story-bible Markdown remain the source of truth. Frontmatter stores structured metadata such as IDs, order, status, and linked canon records. Git records the history of changes to those files.

### Workspace Snapshot

The TRURL backend already exposes a workspace snapshot through `GET /api/workspace`. That snapshot is a structured project view: chapters, selected metadata fields, story-bible entity maps, and section counts.

A future OSER integration should build from this kind of snapshot rather than scanning arbitrary UI state. The snapshot can be expanded or converted into a render-specific package when needed.

### OSER Document Model

OSER should receive a rendering representation, not direct write access to the repository. Its document model can normalize headings, sections, notes, figures, citations, page metadata, and style configuration for export.

The OSER model is allowed to be more layout-aware than TRURL, but it should preserve source references back to TRURL paths and IDs.

### Derived Artifacts

Generated HTML, CSS bundles, paginated HTML, PDF, EPUB, and web outputs are derived artifacts. They can be committed when useful, but they should be reproducible from source Markdown plus text-based configuration.

The existing `exports/editorial/` output and backend render helper are useful prototypes of this boundary. They should not be expanded into a full OSER implementation inside TRURL during this pass.

## Possible Integration Modes

### Local CLI Invocation

TRURL could eventually call an OSER CLI with a generated document package:

```text
trurl package -> oser render --input package.json --target html
```

This keeps the boundary simple, debuggable, and friendly to local/offline workflows.

### Backend Adapter Endpoint

The TRURL backend could expose render endpoints that assemble a document package, call OSER, and return preview/export status. The backend remains an adapter; OSER remains the renderer.

### Future Frontend Preview Panel

The frontend could request previews from the backend and show semantic HTML or paged output beside the manuscript. Editing would still happen against TRURL Markdown, not against OSER output.

### Future Export Pipeline

Export workflows could produce static files under an export directory, with explicit target names and reproducible configuration. Export jobs should surface warnings and generated file paths.

### Optional Package Dependency Later

If the boundary stabilizes, TRURL may later use OSER as a package dependency. That should wait until the document package contract and minimal adapter behavior are clear.

## Proposed Data Contract

A draft TRURL document package for OSER could look like this:

```json
{
  "schema": "trurl-document-package/v0",
  "project": {
    "id": "trurl.local.project",
    "title": "Untitled TRURL Project",
    "repositoryRoot": ".",
    "generatedAt": "2026-05-17T00:00:00.000Z"
  },
  "manuscript": {
    "files": [
      {
        "id": "ms.opening-confession",
        "path": "manuscript/01-opening-confession.md",
        "title": "Opening Confession",
        "type": "chapter",
        "order": 1,
        "status": "revised",
        "frontmatter": {
          "id": "ms.opening-confession",
          "title": "Opening Confession",
          "type": "chapter",
          "order": 1,
          "status": "revised",
          "character_ids": ["char.narrator"],
          "location_ids": ["loc.old-man-house"],
          "timeline_ids": ["time.vulture-eye-obsession"]
        },
        "body": "Markdown body text...",
        "source": {
          "format": "markdown",
          "path": "manuscript/01-opening-confession.md"
        }
      }
    ],
    "selected": {
      "id": "ms.opening-confession",
      "path": "manuscript/01-opening-confession.md",
      "frontmatter": {},
      "body": "Markdown body text..."
    }
  },
  "storyBible": {
    "linkedEntities": {
      "characters": [
        {
          "id": "char.narrator",
          "type": "character",
          "name": "Unnamed Narrator",
          "status": "active",
          "canon": "canonical",
          "path": "story-bible/characters/char-narrator.md",
          "summary": "First-person speaker insisting on sanity while recounting a murder."
        }
      ],
      "locations": [],
      "timeline": []
    }
  },
  "assets": [
    {
      "id": "cover",
      "path": "assets/cover.jpg",
      "role": "cover",
      "alt": "Cover image description"
    }
  ],
  "style": {
    "preset": "editorial-default",
    "profile": "project-default",
    "typography": {
      "bodyFont": "serif",
      "headingFont": "sans",
      "baseSize": "11pt",
      "lineHeight": 1.45
    },
    "page": {
      "size": "letter",
      "margins": {
        "top": "0.85in",
        "right": "0.75in",
        "bottom": "0.85in",
        "left": "0.75in"
      }
    },
    "sections": {
      "chapterStart": "new-page",
      "showChapterMetadata": false,
      "includeTableOfContents": true
    }
  },
  "output": {
    "target": "html",
    "path": "exports/editorial/manuscript.html",
    "includeAssets": true
  }
}
```

The exact schema should evolve through examples before becoming strict. The important boundary is that TRURL supplies source content, source paths, frontmatter, linked context, assets, style config, and output intent; OSER returns render products and diagnostics.

## Style and Design Configuration

TRURL could manage style as text-based project configuration rather than visual editor state.

### Editorial Presets

Presets should describe named rendering approaches, such as `editorial-default`, `manuscript-review`, `print-proof`, or `web-serial`. A preset can be OSER-owned while the selected preset lives in TRURL config.

### Typography Rules

Typography rules should be declarative: body font category, heading font category, size scale, line height, paragraph spacing, blockquote treatment, and code/table behavior. Project-specific font files or web font policies can be referenced by path later.

### Page Sizes

Page settings should include page size, margins, running headers, footers, page numbering, widows/orphans, and chapter break behavior. These settings belong in config, not hard-coded UI state.

### Section and Chapter Formatting

TRURL can expose manuscript `type`, `order`, `title`, and status metadata. OSER can map those fields to chapter openers, table-of-contents entries, appendix treatment, interludes, and fragments.

### Notes, Citations, and Figures

TRURL should preserve source Markdown and metadata for notes, citations, and figures. OSER can decide how they render for a target. Missing captions, alt text, unresolved citation keys, or unsupported figure layouts should become warnings.

### Per-Project Style Profiles

A future project could store style profiles in a text file such as `config/style-profiles.json` or another documented path. Profiles should be diffable and reviewable like any other repository artifact.

## AI Relationship

AI may assist the TRURL and OSER boundary by suggesting:

- style profiles that fit a project goal.
- document structure cleanup, such as missing chapter titles or inconsistent section types.
- missing captions, alt text, citation metadata, or figure roles.
- export warnings and likely layout risks.
- continuity-aware formatting notes, such as when an appendix or timeline record may need special treatment.

AI must not silently rewrite source text, overwrite manuscript content, alter canon records, or override frontmatter. Any AI-produced style or structure change should be represented as a reviewable text diff or an explicit warning.

## Safety Rules

- Source Markdown remains authoritative.
- Story-bible records remain authoritative for canon context.
- OSER outputs are derived artifacts.
- Generated files should be reproducible from Markdown plus text configuration.
- Formatting changes should be diffable and config-driven when possible.
- No hidden binary-only state should be required to reproduce a render.
- No automatic overwrite of manuscript content is allowed.
- Preview and export operations should be read-only against manuscript files.
- Export writes should be explicit, target derived output directories, and report generated paths.
- Render diagnostics should never be treated as accepted edits without human review.

## Proposed Backend Endpoints

These endpoints are future examples only. They should not be added until the package contract and adapter behavior are ready.

- `POST /api/render/preview` — build a document package for selected content and return semantic preview HTML plus warnings.
- `POST /api/render/export-html` — generate static HTML/CSS output into a derived export path.
- `POST /api/render/export-pdf` — generate PDF output through OSER or an OSER-managed print pipeline.
- `GET /api/render/presets` — list available OSER presets and project style profiles.
- `POST /api/render/validate-style-config` — validate a style profile and return errors/warnings without rendering.

Endpoint safety should follow the same direction as existing backend APIs: validate paths, avoid hidden state, and distinguish source writes from derived output writes.

## Proposed Frontend UX Later

A future frontend could add a `Design / Preview` panel without turning TRURL into a visual page builder.

Possible UI areas:

- Style preset selector.
- Project style profile selector.
- Semantic HTML preview.
- Paged preview for print-oriented output.
- Export status and generated file list.
- Warnings panel for missing metadata, unsupported Markdown, unresolved assets, or layout risks.
- Source links from rendered sections back to manuscript paths and IDs.

The preview should support author review, not replace the manuscript editor. Editing source content should continue to happen through Markdown-aware TRURL workflows.

## Phased Roadmap

### Phase 1: Architecture Doc Only

Capture the boundary, responsibilities, safety rules, and draft package shape. Do not add runtime dependencies or behavior.

### Phase 2: Static Sample Document Package

Create a checked-in example package generated from the sample corpus. Use it to test assumptions about manuscript, story-bible, assets, style, and output fields.

### Phase 3: Mock OSER Adapter

Add a mock adapter that accepts a document package and returns deterministic preview/export placeholders. This should prove endpoint shape without invoking OSER.

### Phase 4: Real OSER CLI or Package Integration

Connect to OSER through a local CLI or package after the contract is stable. Keep the adapter isolated so TRURL remains repository-first.

### Phase 5: Frontend Preview Panel

Add a preview surface that can display semantic HTML, paged preview states, warnings, and export status.

### Phase 6: Export Workflows

Add explicit HTML, PDF, EPUB, and web export workflows with reproducible output paths and validation reports.

## Current Non-Goals

- Importing OSER code into TRURL.
- Adding OSER as a dependency.
- Replacing current manuscript Markdown conventions.
- Implementing render/export endpoints.
- Building a visual page builder.
- Treating generated output as canonical manuscript state.
