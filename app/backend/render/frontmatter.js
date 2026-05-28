import fs from 'node:fs/promises';
import path from 'node:path';

export function coerceFrontmatterValue(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+$/.test(value)) return Number(value);
  return value.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
}

export function parseYamlLikeFrontmatter(block) {
  const lines = block.split('\n');
  const output = {};
  let currentListKey = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    const listItemMatch = line.match(/^\s*[-]\s+(.*)$/);
    if (listItemMatch && currentListKey) {
      output[currentListKey].push(coerceFrontmatterValue(listItemMatch[1].trim()));
      continue;
    }

    const kvMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kvMatch) continue;

    const [, key, rawValue] = kvMatch;
    if (rawValue === '') {
      output[key] = [];
      currentListKey = key;
    } else {
      output[key] = coerceFrontmatterValue(rawValue.trim());
      currentListKey = null;
    }
  }

  return output;
}

export function splitMarkdownDocument(raw) {
  const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!frontmatterMatch) {
    return { frontmatter: {}, rawFrontmatter: '', body: raw };
  }

  return {
    frontmatter: parseYamlLikeFrontmatter(frontmatterMatch[1]),
    rawFrontmatter: frontmatterMatch[1],
    body: raw.slice(frontmatterMatch[0].length),
  };
}

export async function readManuscriptChapters(repoRoot) {
  const manuscriptDir = path.join(repoRoot, 'manuscript');
  const entries = await fs.readdir(manuscriptDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const chapters = [];
  for (const fileName of files) {
    const absolutePath = path.join(manuscriptDir, fileName);
    const raw = await fs.readFile(absolutePath, 'utf8');
    const { frontmatter, rawFrontmatter, body } = splitMarkdownDocument(raw);

    chapters.push({
      id: frontmatter.id || `manuscript.${fileName}`,
      title: frontmatter.title || fileName,
      type: frontmatter.type || 'chapter',
      order: Number.isFinite(frontmatter.order) ? frontmatter.order : null,
      status: frontmatter.status || 'unknown',
      path: path.join('manuscript', fileName).replace(/\\/g, '/'),
      frontmatter,
      rawFrontmatter,
      body,
    });
  }

  return chapters.sort((a, b) => {
    if (a.order !== null && b.order !== null && a.order !== b.order) return a.order - b.order;
    if (a.order !== null && b.order === null) return -1;
    if (a.order === null && b.order !== null) return 1;
    return a.path.localeCompare(b.path);
  });
}
