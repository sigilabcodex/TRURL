import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readManuscriptChapters } from './frontmatter.js';
import { renderMarkdownBody } from './markdown-renderer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const defaultOutputPath = path.join(repoRoot, 'exports', 'editorial', 'manuscript.html');
const stylesheetSourcePath = path.join(__dirname, 'editorial.css');
const stylesheetFileName = 'editorial.css';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

function parseArgs(argv) {
  const args = { output: defaultOutputPath };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--output' || arg === '-o') {
      args.output = path.resolve(repoRoot, argv[index + 1]);
      index += 1;
    }
  }

  return args;
}

function renderChapter(chapter) {
  const chapterId = `${chapter.order ?? 'x'}-${slugify(chapter.title)}`;
  const bodyHtml = renderMarkdownBody(chapter.body);

  return `<article class="trurl-chapter" id="${escapeHtml(chapterId)}" data-source-path="${escapeHtml(chapter.path)}" data-chapter-id="${escapeHtml(chapter.id)}">
  <header class="chapter-header">
    <p class="chapter-kicker">${escapeHtml(chapter.type)}</p>
    <h1>${escapeHtml(chapter.title)}</h1>
    <dl class="chapter-meta">
      <dt>Source</dt>
      <dd><code>${escapeHtml(chapter.path)}</code></dd>
      <dt>Status</dt>
      <dd>${escapeHtml(chapter.status)}</dd>
    </dl>
  </header>
  <section class="chapter-body">
${bodyHtml.trim()}
  </section>
</article>`;
}

function renderDocument(chapters) {
  const tocItems = chapters.map((chapter) => {
    const chapterId = `${chapter.order ?? 'x'}-${slugify(chapter.title)}`;
    return `      <li><a href="#${escapeHtml(chapterId)}">${escapeHtml(chapter.title)}</a></li>`;
  }).join('\n');

  const chapterHtml = chapters.map(renderChapter).join('\n\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TRURL Manuscript</title>
  <meta name="generator" content="TRURL editorial HTML renderer">
  <link rel="stylesheet" href="${stylesheetFileName}">
</head>
<body>
  <header class="document-title">
    <p>TRURL Editorial HTML</p>
    <h1>Manuscript</h1>
  </header>
  <nav class="table-of-contents" aria-labelledby="toc-title">
    <h2 id="toc-title">Contents</h2>
    <ol>
${tocItems}
    </ol>
  </nav>
  <main>
${chapterHtml}
  </main>
</body>
</html>
`;
}

async function main() {
  const { output } = parseArgs(process.argv.slice(2));
  const chapters = await readManuscriptChapters(repoRoot);
  const html = renderDocument(chapters);

  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, html, 'utf8');
  await fs.copyFile(stylesheetSourcePath, path.join(path.dirname(output), stylesheetFileName));

  console.log(`Rendered ${chapters.length} manuscript chapter(s) to ${path.relative(repoRoot, output)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
