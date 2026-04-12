# TRURL Local Backend

Tiny local bridge for repository reads.

## Purpose

Expose repository-backed workspace data for the frontend without adding a database or write layer.

## Endpoint

- `GET /api/workspace` — returns manuscript index, selected metadata fields, story-bible entity maps, and section counts.

## Run

```bash
cd app/backend
npm install
npm run dev
```

Backend default URL: `http://localhost:4177`.
