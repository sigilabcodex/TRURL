# TRURL Local Backend

Tiny local bridge for repository-backed reads, safe manuscript body writes, and read-only AI assistance.

## Purpose

Expose repository-backed workspace data for the frontend and a minimal save API without adding a database.

## Endpoint

- `GET /api/workspace` — returns manuscript index, selected metadata fields, story-bible entity maps, and section counts.
- `POST /api/save-manuscript` — saves manuscript body text back to a file in `manuscript/`.
- `POST /api/ai/summarize-chapter` — loads one manuscript file and returns a read-only AI summary.

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
