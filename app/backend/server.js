import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { createAiProvider } from './ai/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const port = Number(process.env.PORT || 4177);
const execFileAsync = promisify(execFile);

const validationChecks = {
  frontmatter: {
    name: 'frontmatter',
    script: 'scripts/validate_frontmatter.py',
  },
  crossrefs: {
    name: 'crossrefs',
    script: 'scripts/check_crossrefs.py',
  },
  manuscriptOrder: {
    name: 'manuscript-order',
    script: 'scripts/check_manuscript_order.py',
  },
};

const validationOrder = [
  validationChecks.frontmatter,
  validationChecks.crossrefs,
  validationChecks.manuscriptOrder,
];

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
    return { frontmatter: {}, body: raw };
  }

  const frontmatter = parseYamlLikeBlock(frontmatterMatch[1]);
  const body = raw.slice(frontmatterMatch[0].length);
  return { frontmatter, body };
}

function getRawFrontmatterBlock(raw) {
  const frontmatterMatch = raw.match(/^---\n[\s\S]*?\n---\n?/);
  return frontmatterMatch ? frontmatterMatch[0] : '';
}

function validateManuscriptPath(relativePath) {
  if (typeof relativePath !== 'string' || !relativePath.endsWith('.md')) {
    throw new Error('Path must be a markdown file under manuscript/.');
  }

  const normalizedPath = relativePath.replace(/\\/g, '/');
  if (!normalizedPath.startsWith('manuscript/')) {
    throw new Error('Path must stay inside manuscript/.');
  }

  const absolutePath = path.resolve(repoRoot, normalizedPath);
  const manuscriptRoot = path.resolve(repoRoot, 'manuscript') + path.sep;
  if (!absolutePath.startsWith(manuscriptRoot)) {
    throw new Error('Path traversal outside manuscript/ is not allowed.');
  }

  return { normalizedPath, absolutePath };
}

async function saveManuscriptBody(relativePath, body) {
  if (typeof body !== 'string') {
    throw new Error('Body must be a string.');
  }

  const { normalizedPath, absolutePath } = validateManuscriptPath(relativePath);
  const raw = await fs.readFile(absolutePath, 'utf8');
  const frontmatterBlock = getRawFrontmatterBlock(raw);
  const updatedRaw = `${frontmatterBlock}${body}`;
  await fs.writeFile(absolutePath, updatedRaw, 'utf8');

  return { path: normalizedPath };
}

async function loadManuscriptChapter(relativePath) {
  const { normalizedPath, absolutePath } = validateManuscriptPath(relativePath);
  const raw = await fs.readFile(absolutePath, 'utf8');
  const { frontmatter, body } = extractFrontmatter(raw);

  return {
    path: normalizedPath,
    title: frontmatter.title || path.basename(normalizedPath, '.md'),
    frontmatter,
    body,
  };
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error('Invalid JSON body.');
  }
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

function toEntityRecord(entry, kind) {
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
}

const mapById = (records) => Object.fromEntries(records.map((record) => [record.id, record]));

function resolveIds(ids, recordsById) {
  return (Array.isArray(ids) ? ids : [])
    .map((id) => recordsById[id])
    .filter(Boolean);
}

function buildStyleConfig(stylePreset) {
  return {
    preset: typeof stylePreset === 'string' && stylePreset.trim() ? stylePreset.trim() : 'editorial-default',
    profile: 'project-default',
    typography: {
      bodyFont: 'serif',
      headingFont: 'sans',
      baseSize: '11pt',
      lineHeight: 1.45,
    },
    page: {
      size: 'letter',
      margins: {
        top: '0.85in',
        right: '0.75in',
        bottom: '0.85in',
        left: '0.75in',
      },
    },
    sections: {
      chapterStart: 'new-page',
      showChapterMetadata: false,
      includeTableOfContents: true,
    },
  };
}

function buildOutputConfig(outputTarget, selectedPath) {
  const target = typeof outputTarget === 'string' && outputTarget.trim() ? outputTarget.trim() : 'html';
  const outputName = path.basename(selectedPath, '.md');

  return {
    target,
    path: `exports/editorial/${outputName}.${target}`,
    includeAssets: true,
  };
}

async function loadLinkedStoryBibleEntities(frontmatter) {
  const [characterRaw, locationRaw, timelineRaw] = await Promise.all([
    readMarkdownDirectory(path.join('story-bible', 'characters')),
    readMarkdownDirectory(path.join('story-bible', 'locations')),
    readMarkdownDirectory(path.join('story-bible', 'timeline')),
  ]);

  const characters = mapById(characterRaw.map((entry) => toEntityRecord(entry, 'character')));
  const locations = mapById(locationRaw.map((entry) => toEntityRecord(entry, 'location')));
  const timeline = mapById(timelineRaw.map((entry) => toEntityRecord(entry, 'timeline')));

  return {
    characters: resolveIds(frontmatter.character_ids, characters),
    locations: resolveIds(frontmatter.location_ids, locations),
    timeline: resolveIds(frontmatter.timeline_ids, timeline),
  };
}

async function summarizeChapter(relativePath) {
  const chapter = await loadManuscriptChapter(relativePath);
  const linkedEntities = await loadLinkedStoryBibleEntities(chapter.frontmatter);
  const provider = createAiProvider();
  const result = await provider.summarizeChapter({
    ...chapter,
    linkedEntities,
  });

  return {
    ok: true,
    provider: provider.name,
    model: provider.model,
    summary: result.summary,
    notes: result.notes || [],
  };
}

async function buildDocumentPackage({ path: manuscriptPath, stylePreset, outputTarget }) {
  const chapter = await loadManuscriptChapter(manuscriptPath);
  const linkedEntities = await loadLinkedStoryBibleEntities(chapter.frontmatter);
  const chapterRecord = {
    id: chapter.frontmatter.id || chapter.path,
    path: chapter.path,
    title: chapter.title,
    type: chapter.frontmatter.type || 'chapter',
    order: Number.isFinite(chapter.frontmatter.order) ? chapter.frontmatter.order : null,
    status: chapter.frontmatter.status || 'unknown',
    frontmatter: chapter.frontmatter,
    body: chapter.body,
    source: {
      format: 'markdown',
      path: chapter.path,
    },
  };

  return {
    ok: true,
    mode: 'mock-document-package',
    package: {
      schema: 'trurl-document-package/v0',
      status: {
        provider: 'trurl',
        mode: 'mock-document-package',
        rendered: false,
        oser: {
          called: false,
          dependencyLoaded: false,
        },
      },
      project: {
        id: 'trurl.local.project',
        title: 'Untitled TRURL Project',
        repositoryRoot: '.',
        generatedAt: new Date().toISOString(),
      },
      manuscript: {
        files: [chapterRecord],
        selected: {
          id: chapterRecord.id,
          path: chapterRecord.path,
          title: chapterRecord.title,
          type: chapterRecord.type,
          order: chapterRecord.order,
          status: chapterRecord.status,
          frontmatter: chapterRecord.frontmatter,
          body: chapterRecord.body,
          source: chapterRecord.source,
        },
      },
      storyBible: {
        linkedEntities,
      },
      assets: [],
      style: buildStyleConfig(stylePreset),
      output: buildOutputConfig(outputTarget, chapter.path),
    },
    warnings: [],
  };
}

async function runValidationCheck(check) {
  const command = `python3 ${check.script}`;

  try {
    const result = await execFileAsync('python3', [check.script], {
      cwd: repoRoot,
      maxBuffer: 1024 * 1024,
    });

    return {
      name: check.name,
      command,
      exitCode: 0,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (error) {
    return {
      name: check.name,
      command,
      exitCode: Number.isInteger(error.code) ? error.code : 1,
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
    };
  }
}

async function runValidationChecks(checks) {
  const results = [];

  for (const check of checks) {
    results.push(await runValidationCheck(check));
  }

  return {
    ok: results.every((result) => result.exitCode === 0),
    checks: results,
  };
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

  if (req.method === 'POST' && req.url === '/api/save-manuscript') {
    try {
      const payload = await readJsonBody(req);
      const result = await saveManuscriptBody(payload.path, payload.body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, ...result }));
    } catch (error) {
      const status = /Path|Body|JSON/.test(error.message) ? 400 : 500;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: error.message }));
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/ai/summarize-chapter') {
    try {
      const payload = await readJsonBody(req);
      const result = await summarizeChapter(payload.path);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (error) {
      const status = /Path|JSON|Unsupported AI provider/.test(error.message) ? 400 : 500;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: error.message }));
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/render/document-package') {
    try {
      const payload = await readJsonBody(req);
      const result = await buildDocumentPackage(payload);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (error) {
      const status = /Path|JSON/.test(error.message) ? 400 : 500;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: error.message }));
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/validate/frontmatter') {
    const result = await runValidationChecks([validationChecks.frontmatter]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/validate/crossrefs') {
    const result = await runValidationChecks([validationChecks.crossrefs]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/validate/manuscript-order') {
    const result = await runValidationChecks([validationChecks.manuscriptOrder]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/validate/all') {
    const result = await runValidationChecks(validationOrder);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(port, () => {
  console.log(`TRURL backend listening on http://localhost:${port}`);
});
