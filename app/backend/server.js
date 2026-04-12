import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const port = Number(process.env.PORT || 4177);

function coerceValue(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+$/.test(value)) return Number(value);
  return value.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
}

function parseYamlLikeBlock(block) {
  const lines = block.split('\n');
  const output = {};
  let currentListKey = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    const listItemMatch = line.match(/^\s*[-]\s+(.*)$/);
    if (listItemMatch && currentListKey) {
      output[currentListKey].push(coerceValue(listItemMatch[1].trim()));
      continue;
    }

    const kvMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kvMatch) continue;

    const [, key, rawValue] = kvMatch;
    if (rawValue === '') {
      output[key] = [];
      currentListKey = key;
    } else {
      output[key] = coerceValue(rawValue.trim());
      currentListKey = null;
    }
  }

  return output;
}

function extractFrontmatter(raw) {
  const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!frontmatterMatch) {
    return { frontmatter: {}, body: raw.trim() };
  }

  const frontmatter = parseYamlLikeBlock(frontmatterMatch[1]);
  const body = raw.slice(frontmatterMatch[0].length).trim();
  return { frontmatter, body };
}

async function readMarkdownDirectory(relativeDir) {
  const absoluteDir = path.join(repoRoot, relativeDir);
  const entries = await fs.readdir(absoluteDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const results = [];
  for (const fileName of files) {
    const absolutePath = path.join(absoluteDir, fileName);
    const relativePath = path.join(relativeDir, fileName).replace(/\\/g, '/');
    const raw = await fs.readFile(absolutePath, 'utf8');
    const { frontmatter, body } = extractFrontmatter(raw);
    results.push({ fileName, path: relativePath, frontmatter, body });
  }

  return results;
}

function summarizeBody(body) {
  return body
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !line.startsWith('#')) || 'No summary text available.';
}

async function buildWorkspaceSnapshot() {
  const [manuscriptRaw, characterRaw, locationRaw, timelineRaw, notesRaw, revisionRaw] = await Promise.all([
    readMarkdownDirectory('manuscript'),
    readMarkdownDirectory(path.join('story-bible', 'characters')),
    readMarkdownDirectory(path.join('story-bible', 'locations')),
    readMarkdownDirectory(path.join('story-bible', 'timeline')),
    readMarkdownDirectory('notes'),
    readMarkdownDirectory('revision'),
  ]);

  const chapters = manuscriptRaw
    .map((entry) => ({
      id: entry.frontmatter.id || entry.path,
      title: entry.frontmatter.title || entry.fileName,
      type: entry.frontmatter.type || 'chapter',
      order: Number.isFinite(entry.frontmatter.order) ? entry.frontmatter.order : null,
      status: entry.frontmatter.status || 'unknown',
      character_ids: entry.frontmatter.character_ids || [],
      location_ids: entry.frontmatter.location_ids || [],
      timeline_ids: entry.frontmatter.timeline_ids || [],
      source_text: entry.frontmatter.source_text || null,
      source_url: entry.frontmatter.source_url || null,
      path: entry.path,
      body: entry.body,
    }))
    .sort((a, b) => {
      if (a.order !== null && b.order !== null) return a.order - b.order;
      return a.path.localeCompare(b.path);
    });

  const toEntityRecord = (entry, kind) => {
    const meta = entry.frontmatter;
    return {
      id: meta.id || entry.path,
      type: meta.type || kind,
      name: meta.name || meta.label || entry.fileName,
      label: meta.label || null,
      status: meta.status || 'unknown',
      canon: meta.canon || null,
      first_appearance: meta.first_appearance || null,
      source_manuscript: meta.source_manuscript || null,
      path: entry.path,
      summary: summarizeBody(entry.body),
      body: entry.body,
    };
  };

  const mapById = (records) => Object.fromEntries(records.map((record) => [record.id, record]));

  return {
    mode: 'local-repository',
    generatedAt: new Date().toISOString(),
    sections: {
      manuscript: chapters.length,
      storyBible: {
        characters: characterRaw.length,
        locations: locationRaw.length,
        timeline: timelineRaw.length,
      },
      notes: notesRaw.length,
      revision: revisionRaw.length,
    },
    chapters,
    entities: {
      characters: mapById(characterRaw.map((entry) => toEntityRecord(entry, 'character'))),
      locations: mapById(locationRaw.map((entry) => toEntityRecord(entry, 'location'))),
      timeline: mapById(timelineRaw.map((entry) => toEntityRecord(entry, 'timeline'))),
    },
  };
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/api/workspace') {
    try {
      const snapshot = await buildWorkspaceSnapshot();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(snapshot));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to load local workspace.', detail: error.message }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(port, () => {
  console.log(`TRURL backend listening on http://localhost:${port}`);
});
