import fs from 'node:fs/promises';
import path from 'node:path';
import { extractFrontmatter, getRawFrontmatterBlock } from './frontmatter.js';

export function validateManuscriptPath(repoRoot, relativePath) {
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

export async function saveManuscriptBody(repoRoot, relativePath, body) {
  if (typeof body !== 'string') {
    throw new Error('Body must be a string.');
  }

  const { normalizedPath, absolutePath } = validateManuscriptPath(repoRoot, relativePath);
  const raw = await fs.readFile(absolutePath, 'utf8');
  const frontmatterBlock = getRawFrontmatterBlock(raw);
  const updatedRaw = `${frontmatterBlock}${body}`;
  await fs.writeFile(absolutePath, updatedRaw, 'utf8');

  return { path: normalizedPath };
}

export async function loadManuscriptChapter(repoRoot, relativePath) {
  const { normalizedPath, absolutePath } = validateManuscriptPath(repoRoot, relativePath);
  const raw = await fs.readFile(absolutePath, 'utf8');
  const { frontmatter, body } = extractFrontmatter(raw);

  return {
    path: normalizedPath,
    title: frontmatter.title || path.basename(normalizedPath, '.md'),
    frontmatter,
    body,
  };
}

export async function readMarkdownDirectory(repoRoot, relativeDir) {
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
