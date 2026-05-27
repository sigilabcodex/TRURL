# TRURL Local Backend

Tiny local bridge for repository-backed reads, safe manuscript body writes, read-only AI assistance, mock render package assembly, validation checks, and Git visibility.

## Purpose

Expose repository-backed workspace data for the frontend and a minimal save API without adding a database.

## Endpoint

- `GET /api/workspace` — returns manuscript index, selected metadata fields, story-bible entity maps, and section counts.
- `POST /api/save-manuscript` — saves manuscript body text back to a file in `manuscript/`.
- `POST /api/ai/summarize-chapter` — loads one manuscript file and returns a read-only AI summary.
- `POST /api/render/document-package` — builds a read-only mock TRURL document package for future OSER integration.
- `POST /api/validate/frontmatter` — runs frontmatter validation.
- `POST /api/validate/crossrefs` — runs manuscript/story-bible cross-reference validation.
- `POST /api/validate/manuscript-order` — runs manuscript filename/order validation.
- `POST /api/validate/all` — runs all validation checks in stable order.
- `GET /api/git/status` — returns read-only branch/status output.
- `GET /api/git/diff` — returns read-only diff stat and scoped diff output.

### `POST /api/save-manuscript`

Request JSON:

```json
{
  "path": "manuscript/01-opening-confession.md",
  "body": "updated markdown body"
}
```

Safety rules in this pass:

- path must resolve inside `manuscript/`
- target must be a `.md` file
- existing frontmatter block is preserved exactly
- only the body after frontmatter is replaced

### `POST /api/ai/summarize-chapter`

Request JSON:

```json
{
  "path": "manuscript/01-opening-confession.md"
}
```

Response JSON:

```json
{
  "ok": true,
  "provider": "mock",
  "model": "mock-summary-v1",
  "summary": "[mock:mock-summary-v1] Opening Confession: ...",
  "notes": []
}
```

Safety rules in this pass:

- path uses the same manuscript path validation as `POST /api/save-manuscript`
- target must be a `.md` file under `manuscript/`
- the endpoint only reads manuscript and linked story-bible files
- no manuscript, story-bible, Git, or frontend state is modified

The AI request context includes the chapter title, parsed frontmatter, body, and linked character/location/timeline records from story-bible frontmatter IDs when available.

### `POST /api/render/document-package`

Request JSON:

```json
{
  "path": "manuscript/01-opening-confession.md",
  "stylePreset": "editorial-default",
  "outputTarget": "html"
}
```

Response JSON:

```json
{
  "ok": true,
  "mode": "mock-document-package",
  "package": {
    "schema": "trurl-document-package/v0",
    "status": {
      "provider": "trurl",
      "mode": "mock-document-package",
      "rendered": false
    },
    "project": {},
    "manuscript": {},
    "storyBible": {},
    "assets": [],
    "style": {},
    "output": {}
  },
  "warnings": []
}
```

This endpoint is the first backend shape for the future TRURL → OSER bridge object. It packages TRURL source data and render intent, but it does not import OSER, call OSER, render HTML, write export files, or modify manuscript/story-bible/Git/frontend state.

Safety rules in this pass:

- path uses the same manuscript path validation as `POST /api/save-manuscript`
- target must be a `.md` file under `manuscript/`
- linked story-bible entities are resolved from `character_ids`, `location_ids`, and `timeline_ids`
- generated package data is returned in the HTTP response only

Example request:

```bash
curl -s http://localhost:4177/api/render/document-package \
  -H 'Content-Type: application/json' \
  -d '{"path":"manuscript/01-opening-confession.md","stylePreset":"editorial-default","outputTarget":"html"}'
```

Path safety check:

```bash
curl -i http://localhost:4177/api/render/document-package \
  -H 'Content-Type: application/json' \
  -d '{"path":"../README.md","stylePreset":"editorial-default","outputTarget":"html"}'
```

### Validation Endpoints

Validation endpoints expose the existing repository scripts through a fixed backend allowlist. They do not accept arbitrary commands and do not write manuscript, story-bible, Git, or export state.

Available checks:

- `frontmatter` → `python3 scripts/validate_frontmatter.py`
- `crossrefs` → `python3 scripts/check_crossrefs.py`
- `manuscript-order` → `python3 scripts/check_manuscript_order.py`

Response JSON:

```json
{
  "ok": true,
  "checks": [
    {
      "name": "frontmatter",
      "command": "python3 scripts/validate_frontmatter.py",
      "exitCode": 0,
      "stdout": "Frontmatter validation passed.\n",
      "stderr": ""
    }
  ]
}
```

If a check exits nonzero, the HTTP request still returns structured JSON with `ok: false`, `exitCode`, `stdout`, and `stderr`.

Run one check:

```bash
curl -s -X POST http://localhost:4177/api/validate/frontmatter
curl -s -X POST http://localhost:4177/api/validate/crossrefs
curl -s -X POST http://localhost:4177/api/validate/manuscript-order
```

Run all checks:

```bash
curl -s -X POST http://localhost:4177/api/validate/all
```

### Git Visibility Endpoints

Git endpoints expose fixed read-only commands only. They do not accept command input and do not create branches, commit, revert, merge, push, or modify files.

Commands:

- `GET /api/git/status` → `git status --short --branch`
- `GET /api/git/diff` → `git diff --stat` and `git diff -- app/backend app/frontend README.md docs scripts ai schema manuscript story-bible notes revision`

Response JSON:

```json
{
  "ok": true,
  "commands": [
    {
      "name": "status",
      "command": "git status --short --branch",
      "exitCode": 0,
      "stdout": "## main\n",
      "stderr": ""
    }
  ]
}
```

If Git exits nonzero, the response uses `ok: false` and still includes `stdout`, `stderr`, and `exitCode`.

Examples:

```bash
curl -s http://localhost:4177/api/git/status
curl -s http://localhost:4177/api/git/diff
```

## AI Provider Configuration

The backend selects an AI provider from environment variables:

- `TRURL_AI_PROVIDER=mock|ollama` defaults to `mock`
- `TRURL_AI_MODEL` defaults to `mock-summary-v1` for mock and `llama3.1` for Ollama
- `TRURL_AI_BASE_URL` defaults to `http://localhost:11434` for Ollama

### Mock Mode

Mock mode is deterministic and does not call a model server:

```bash
cd app/backend
TRURL_AI_PROVIDER=mock npm run dev
```

Example request:

```bash
curl -s http://localhost:4177/api/ai/summarize-chapter \
  -H 'Content-Type: application/json' \
  -d '{"path":"manuscript/01-opening-confession.md"}'
```

### Ollama Mode

Start Ollama locally and make sure the configured model is available. Then run:

```bash
cd app/backend
TRURL_AI_PROVIDER=ollama TRURL_AI_MODEL=llama3.1 npm run dev
```

Use a custom Ollama URL when needed:

```bash
TRURL_AI_PROVIDER=ollama \
TRURL_AI_MODEL=llama3.1 \
TRURL_AI_BASE_URL=http://localhost:11434 \
npm run dev
```

Example request:

```bash
curl -s http://localhost:4177/api/ai/summarize-chapter \
  -H 'Content-Type: application/json' \
  -d '{"path":"manuscript/01-opening-confession.md"}'
```

## Run

```bash
cd app/backend
npm install
npm run dev
```

Backend default URL: `http://localhost:4177`.
