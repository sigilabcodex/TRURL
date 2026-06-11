# TRURL Editor and Project Architecture

This note evaluates larger editor and document-management choices for TRURL. It does not implement a rich-text editor, project switcher, database, cloud sync, or OSER rendering. See `chapter-metadata.md` for the read-only chapter metadata display model.

TRURL should remain source-oriented: Markdown manuscript bodies, frontmatter metadata, story-bible records, and Git history are the durable project state. The editor can become more comfortable, but it should not make rendered output or hidden editor state canonical.

## Editor Model Options

### Textarea + Markdown Helpers

- Source-of-truth safety: Strong. The textarea edits the exact Markdown body that is saved.
- Markdown compatibility: Strong. There is no conversion layer.
- Longform writing ergonomics: Adequate for early use. It supports basic prose editing but lacks advanced search, folding, syntax awareness, and structural navigation.
- Semantic publishing potential: Good if manuscript conventions remain clear. Semantics live in Markdown and frontmatter rather than editor internals.
- Complexity: Low.
- Suitability for TRURL now: Best current fit. It preserves safety while improving everyday writing comfort.

### CodeMirror

- Source-of-truth safety: Strong when configured as a Markdown source editor.
- Markdown compatibility: Strong. CodeMirror can edit Markdown directly and add syntax highlighting, keymaps, search, linting, and folding.
- Longform writing ergonomics: Good for source-centric authors who tolerate a code-editor feel.
- Semantic publishing potential: Good as a source editor, especially with lint diagnostics tied to manuscript conventions.
- Complexity: Moderate. It adds a dependency and configuration surface.
- Suitability for TRURL now: A likely next step when textarea limitations become painful, especially for search, large files, or Markdown-aware commands.

### ProseMirror / TipTap

- Source-of-truth safety: Mixed. These editors maintain a structured document model, then serialize to Markdown or another format.
- Markdown compatibility: Possible, but round-tripping must be tested carefully. Unsupported Markdown can be lost or normalized unexpectedly.
- Longform writing ergonomics: Strong. They support rich editing, plugins, selections, comments, slash commands, and custom nodes.
- Semantic publishing potential: Strong if TRURL adopts a formal document schema.
- Complexity: High. Schema design, Markdown parsing/serialization, plugin behavior, and migration rules become major architecture decisions.
- Suitability for TRURL now: Avoid for now. It is justified only after TRURL has a stable semantic document model and clear round-trip tests.

### Milkdown

- Source-of-truth safety: Moderate. Milkdown is Markdown-oriented but still sits on ProseMirror concepts.
- Markdown compatibility: Good for many Markdown workflows, but still requires round-trip validation for TRURL conventions.
- Longform writing ergonomics: Good. It can feel more writer-friendly than a plain code editor.
- Semantic publishing potential: Good if its schema can map cleanly to TRURL and OSER concepts.
- Complexity: Moderate to high.
- Suitability for TRURL now: Interesting later, not now. It should be evaluated after CodeMirror and after TRURL has stricter examples for manuscript structures.

### Lexical

- Source-of-truth safety: Mixed. Lexical is a rich editor framework with its own editor state.
- Markdown compatibility: Possible through import/export, but Markdown is not inherently the canonical model.
- Longform writing ergonomics: Strong for interactive editing once configured.
- Semantic publishing potential: Good with custom nodes, but that requires a maintained schema and serialization contract.
- Complexity: High.
- Suitability for TRURL now: Avoid for now. It would shift attention toward editor-state engineering before TRURL's document model is ready.

### Custom Semantic Block Editor

- Source-of-truth safety: Potentially strong if blocks map directly to Markdown and frontmatter, but risky if the mapping is incomplete.
- Markdown compatibility: Depends entirely on the block grammar and serializer.
- Longform writing ergonomics: Potentially strong for structured books, essays, notes, and canon-linked blocks.
- Semantic publishing potential: Very strong. Blocks could map directly to OSER sections, figures, notes, citations, and export diagnostics.
- Complexity: Very high. It requires schema design, migrations, keyboard behavior, copy/paste behavior, Markdown round-tripping, and accessibility work.
- Suitability for TRURL now: Not yet. It is a future research direction after the source conventions and OSER package contract stabilize.

## Recommendation

Use textarea + Markdown helpers now. This keeps Markdown body text canonical, keeps save behavior simple, avoids heavy dependencies, and lets TRURL improve the writing surface without committing to a rich editor architecture too early.

Avoid full WYSIWYG, ProseMirror/TipTap, Lexical, Milkdown, and a custom block editor for now. They are powerful, but they would require TRURL to define and test a full document model before the project has enough real examples.

A richer editor becomes justified when at least one of these is true:

- Long manuscripts expose textarea performance or navigation limits.
- Authors need source-aware search, folding, linting, or multi-cursor commands.
- TRURL needs validated Markdown transformations with strong round-trip tests.
- OSER package generation requires semantic structures that plain Markdown helpers cannot express comfortably.
- Comments, tracked suggestions, citations, figures, or structured notes become first-class editing workflows.

The likely next editor step is CodeMirror as a Markdown source editor, not WYSIWYG.

## Styling Model

TRURL should distinguish four layers that are easy to blur:

- Authoring formatting: Markdown syntax authors type while writing, such as headings, emphasis, blockquotes, lists, and scene breaks.
- Semantic document structure: The meaning of content, such as chapter, interlude, appendix, note, figure, citation, timeline reference, or canon link.
- Editorial rendering: The transformation of source content into semantic HTML with appropriate classes, landmarks, metadata, and diagnostics.
- Final export styling: Target-specific CSS, typography, page rules, EPUB structure, PDF layout, and microwebsite presentation.

The editor can help insert authoring Markdown, but it should not pretend to be final layout. TRURL should store source and semantic intent. OSER should own editorial rendering and final export styling.

## OSER Relationship

TRURL should remain source/canon oriented. It owns manuscript Markdown, story-bible records, Git workflow, AI guardrails, validation, and document package preparation.

OSER should handle semantic HTML, editorial CSS, paged output, PDF, EPUB, and microwebsite exports. OSER can consume TRURL document packages and return rendered artifacts plus diagnostics, but OSER output should remain derived from source.

The preview inside TRURL can be approximate now. It should help authors read what they are writing, not promise final typography or page layout. Later, TRURL can offer an OSER-backed preview panel that displays semantic render output while source editing still happens in TRURL.

## Multi-Project and Document Management Models

### One Git Repo = One TRURL Project

Pros:

- Simple mental model.
- Git history maps cleanly to one project.
- Existing folder conventions already work.
- Low implementation cost.

Cons:

- Awkward for series, collections, translations, editions, or related documents.
- Shared story-bible and notes may need duplication across repos.
- Cross-document exports require ad hoc conventions.

### One Git Repo = Many Documents or Projects

Pros:

- Supports book series, essays, translations, editions, and shared canon in one repository.
- Makes cross-document AI context and shared story-bible records easier.
- Enables project-level and document-level render presets.

Cons:

- Requires a project index and document selection model.
- More path validation and UI state are needed.
- Git diffs are broader and may mix unrelated document work.

### Workspace Index File

A workspace index could list all TRURL documents in a repo.

Pros:

- Easy to discover documents.
- Can be hand-edited and reviewed in Git.
- Does not require a database.

Cons:

- Needs schema validation.
- Can drift from files unless tooling validates it.
- May duplicate metadata already in frontmatter.

### Document Package Manifest

A package manifest could describe a render/export bundle for one document.

Pros:

- Aligns with OSER export needs.
- Good for reproducible HTML/PDF/EPUB/web outputs.
- Can capture source paths, style presets, output targets, and asset references.

Cons:

- Better as an export contract than as the primary authoring project model.
- May become too render-oriented if used for project navigation.

### `.trurl/project.json`

A project manifest can describe the repository-level TRURL project and its documents.

Pros:

- Clear home for title, default document, document paths, and render presets.
- Diffable and reviewable.
- Keeps project state local to the repository.
- Does not require backend storage beyond reading JSON.

Cons:

- Adds one more source of truth to validate.
- Needs migration strategy as schema evolves.
- UI must handle missing or invalid manifests gracefully.

### `.trurl/documents/*.json`

Separate document manifests can describe each book, essay, edition, or translation.

Pros:

- Scales better for many documents.
- Avoids one large project file.
- Makes per-document settings easy to diff.

Cons:

- More file discovery and validation logic.
- Cross-document references need conventions.
- Overkill for the current single-document sample corpus.

### OSER Package and Export Manifests

OSER-facing manifests can describe generated packages and exports.

Pros:

- Good boundary between authoring and rendering.
- Supports reproducible exports and diagnostics.
- Can be generated from TRURL source plus project config.

Cons:

- Should not replace TRURL source configuration.
- Generated manifests can become noisy if committed too early.

## Recommended Near-Term Project Format

Near term, add a minimal optional `.trurl/project.json` after the current frontend and backend shape stabilizes. The backend can continue to work without it, using current folder defaults. When present, the file can identify the project and document roots explicitly.

Example shape:

```json
{
  "schema": "trurl-project/v0",
  "title": "Untitled TRURL Project",
  "defaultDocument": "main",
  "documents": [
    {
      "id": "main",
      "title": "Main Manuscript",
      "manuscriptPath": "manuscript",
      "storyBiblePath": "story-bible",
      "notesPath": "notes",
      "revisionPath": "revision",
      "renderPresets": ["editorial-default"]
    }
  ]
}
```

Rules for a first implementation later:

- Treat the file as optional.
- Validate paths remain inside the repository.
- Keep Markdown files and frontmatter canonical.
- Do not move current content automatically.
- Start with one selected document, then add UI switching after the data model is proven.

## Future Support

This model can later support:

- Multiple books in one repo by adding more document entries with separate manuscript paths.
- Essays and articles by allowing document types and shorter manuscript directories.
- Translations by mapping translated manuscript paths to the same canon or source document.
- Editions by adding edition IDs, source relationships, and render presets.
- Web, PDF, and EPUB exports by linking documents to OSER package/export manifests.
- AI-assisted document preparation by giving AI a bounded document manifest and source paths.
- OSER export packages by generating render packages from `.trurl/project.json` plus manuscript and story-bible source.

## Explicit Deferrals

This note does not implement:

- Full project switcher UI.
- Database storage.
- Cloud sync.
- Full rich-text editor.
- Final OSER rendering implementation.
- Global document registry outside the repository.
- Automatic migrations for existing projects.
