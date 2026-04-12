# TRURL Local Backend

Tiny local bridge for repository-backed reads and safe manuscript body writes.

## Purpose

Expose repository-backed workspace data for the frontend and a minimal save API without adding a database.

## Endpoint

- `GET /api/workspace` — returns manuscript index, selected metadata fields, story-bible entity maps, and section counts.
- `POST /api/save-manuscript` — saves manuscript body text back to a file in `manuscript/`.

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

## Run

```bash
cd app/backend
npm install
npm run dev
```

Backend default URL: `http://localhost:4177`.
