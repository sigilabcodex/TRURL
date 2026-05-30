import { access, copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readManuscriptChapters } from './frontmatter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const outputDir = path.join(repoRoot, 'exports', 'oser');
const tmpDir = path.join(outputDir, '.tmp');
const assetsOutputDir = path.join(outputDir, 'assets');
const combinedMarkdownPath = path.join(tmpDir, 'manuscript.md');
const htmlOutputPath = path.join(outputDir, 'manuscript.html');
const printHtmlOutputPath = path.join(outputDir, 'manuscript-print.html');
const pdfOutputPath = path.join(outputDir, 'manuscript.pdf');
const diagnosticsPath = path.join(outputDir, 'diagnostics.json');

function relativeToRepo(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, '/');
}

function nowIso() {
  return new Date().toISOString();
}

function resolveOserRoot() {
  const configuredRoot = process.env.TRURL_OSER_ROOT;
  if (!configuredRoot || configuredRoot.trim().length === 0) {
    throw new Error('TRURL_OSER_ROOT is not set. Point it to the local OSER repository.');
  }

  return path.resolve(configuredRoot);
}

async function assertOserRoot(oserRoot) {
  let rootStat;
  try {
    rootStat = await stat(oserRoot);
  } catch {
    throw new Error(`TRURL_OSER_ROOT does not exist: ${oserRoot}`);
  }

  if (!rootStat.isDirectory()) {
    throw new Error(`TRURL_OSER_ROOT is not a directory: ${oserRoot}`);
  }

  try {
    await access(path.join(oserRoot, 'package.json'));
  } catch {
    throw new Error(`TRURL_OSER_ROOT does not look like an OSER repository; package.json was not found: ${oserRoot}`);
  }
}

function startsWithHeading(body) {
  return /^#\s+\S/.test(body.trimStart());
}

function normalizeBody(body) {
  return body.replace(/\r\n?/g, '\n').trim();
}

function collectChapterWarnings(chapters) {
  const warnings = [];

  for (const chapter of chapters) {
    if (!chapter.rawFrontmatter) {
      warnings.push({
        code: 'chapter-frontmatter-missing',
        message: `${chapter.path} does not have frontmatter; fallback metadata was used.`,
        path: chapter.path,
      });
    }

    if (chapter.order === null) {
      warnings.push({
        code: 'chapter-order-missing',
        message: `${chapter.path} does not have a numeric order; path ordering was used as fallback.`,
        path: chapter.path,
      });
    }
  }

  return warnings;
}

async function prepareMarkdownAssets(chapters) {
  const images = [];
  const warnings = [];
  const usedOutputNames = new Map();

  await mkdir(assetsOutputDir, { recursive: true });

  for (const chapter of chapters) {
    const chapterAbsolutePath = path.join(repoRoot, chapter.path);
    const chapterDir = path.dirname(chapterAbsolutePath);
    const imageMatches = chapter.body.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g);

    for (const match of imageMatches) {
      const alt = match[1];
      const rawTarget = match[2].trim();
      const parsedTarget = parseMarkdownLinkTarget(rawTarget);
      const originalSrc = parsedTarget.src;
      const baseRecord = {
        chapterPath: chapter.path,
        alt,
        originalSrc,
        rawTarget,
      };

      if (!originalSrc) {
        const warning = {
          code: 'markdown-image-empty-src',
          message: `${chapter.path} contains a Markdown image with an empty source.`,
          path: chapter.path,
        };
        images.push({
          ...baseRecord,
          kind: 'empty',
          exists: false,
          copied: false,
          warning,
        });
        warnings.push(warning);
        continue;
      }

      if (isExternalAssetRef(originalSrc)) {
        images.push({
          ...baseRecord,
          kind: 'external',
          resolvedPath: null,
          copiedTo: null,
          rewrittenSrc: originalSrc,
          exists: null,
          copied: false,
        });
        continue;
      }

      if (originalSrc.startsWith('/') || originalSrc.startsWith('#')) {
        images.push({
          ...baseRecord,
          kind: originalSrc.startsWith('#') ? 'anchor' : 'absolute',
          resolvedPath: null,
          copiedTo: null,
          rewrittenSrc: originalSrc,
          exists: null,
          copied: false,
        });
        continue;
      }

      const resolvedPath = path.resolve(chapterDir, originalSrc);
      const exists = await fileExists(resolvedPath);
      const outputName = uniqueAssetOutputName(chapter.path, originalSrc, usedOutputNames);
      const copiedToAbsolute = path.join(assetsOutputDir, outputName);
      const copiedTo = relativeToRepo(copiedToAbsolute);
      const rewrittenSrc = normalizePath(path.relative(tmpDir, copiedToAbsolute));
      const imageRecord = {
        ...baseRecord,
        kind: 'relative',
        resolvedPath: relativeToRepo(resolvedPath),
        copiedTo,
        rewrittenSrc,
        exists,
        copied: false,
      };

      if (!exists) {
        const warning = {
          code: 'markdown-image-missing',
          message: `${chapter.path} references a missing relative image: ${originalSrc}`,
          path: chapter.path,
          src: originalSrc,
          resolvedPath: imageRecord.resolvedPath,
        };
        imageRecord.warning = warning;
        images.push(imageRecord);
        warnings.push(warning);
        continue;
      }

      await copyFile(resolvedPath, copiedToAbsolute);
      imageRecord.copied = true;
      images.push(imageRecord);
    }
  }

  return {
    copyImplemented: true,
    plannedAssetsDir: relativeToRepo(assetsOutputDir),
    images,
    warnings,
  };
}

function rewriteChapterMarkdownAssetRefs(body, chapterPath, assets) {
  const chapterAssets = assets.images.filter((image) => image.chapterPath === chapterPath);
  if (chapterAssets.length === 0) {
    return body;
  }

  let imageIndex = 0;
  return body.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (fullMatch, alt, rawTarget) => {
    const image = chapterAssets[imageIndex];
    imageIndex += 1;

    if (!image || !image.rewrittenSrc || !image.copied) {
      return fullMatch;
    }

    const parsedTarget = parseMarkdownLinkTarget(rawTarget.trim());
    const rewrittenTarget = parsedTarget.title
      ? `${image.rewrittenSrc} ${parsedTarget.title}`
      : image.rewrittenSrc;

    return `![${alt}](${rewrittenTarget})`;
  });
}

function parseMarkdownLinkTarget(rawTarget) {
  if (!rawTarget) {
    return { src: '', title: '' };
  }

  if (rawTarget.startsWith('<')) {
    const closingIndex = rawTarget.indexOf('>');
    if (closingIndex > 0) {
      return {
        src: rawTarget.slice(1, closingIndex).trim(),
        title: rawTarget.slice(closingIndex + 1).trim(),
      };
    }
  }

  const match = rawTarget.match(/^(\S+)(?:\s+([\s\S]+))?$/);
  return {
    src: match?.[1]?.trim() ?? '',
    title: match?.[2]?.trim() ?? '',
  };
}

function uniqueAssetOutputName(chapterPath, originalSrc, usedOutputNames) {
  const parsed = path.parse(originalSrc.split(/[?#]/)[0]);
  const extension = parsed.ext || '';
  const baseName = safeFileName(parsed.name || 'asset');
  const chapterName = safeFileName(path.basename(chapterPath, path.extname(chapterPath)));
  const initialName = `${chapterName}-${baseName}${extension}`;
  const key = `${chapterPath}\n${originalSrc}`;

  if (!usedOutputNames.has(initialName)) {
    usedOutputNames.set(initialName, key);
    return initialName;
  }

  if (usedOutputNames.get(initialName) === key) {
    return initialName;
  }

  let counter = 2;
  while (true) {
    const candidate = `${chapterName}-${baseName}-${counter}${extension}`;
    if (!usedOutputNames.has(candidate)) {
      usedOutputNames.set(candidate, key);
      return candidate;
    }
    counter += 1;
  }
}

function safeFileName(value) {
  return value.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '') || 'asset';
}

function normalizePath(value) {
  return value.replace(/\\/g, '/');
}

function isExternalAssetRef(src) {
  return /^[a-z][a-z0-9+.-]*:/i.test(src) || src.startsWith('//');
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function buildCombinedMarkdown(chapters, assets = emptyAssetsReport()) {
  const parts = ['# Manuscript'];

  for (const chapter of chapters) {
    const body = normalizeBody(rewriteChapterMarkdownAssetRefs(chapter.body, chapter.path, assets));
    const heading = `# ${chapter.title}`;
    const chapterParts = [];

    if (!startsWithHeading(body)) {
      chapterParts.push(heading);
    }

    if (body.length > 0) {
      chapterParts.push(body);
    }

    parts.push(chapterParts.join('\n\n'));
  }

  return `${parts.filter(Boolean).join('\n\n---\n\n')}\n`;
}

async function rewriteGeneratedHtmlAssetRefs(filePath) {
  const html = await readFile(filePath, 'utf8');
  const rewritten = html.replace(/(src=["'])\.\.\/assets\//g, '$1assets/');
  if (rewritten !== html) {
    await writeFile(filePath, rewritten, 'utf8');
  }
}

function commandRecord(label, args, cwd) {
  return {
    label,
    command: 'npm',
    args,
    cwd,
    shell: ['npm', ...args].join(' '),
  };
}

function runCommand(record, options = {}) {
  return new Promise((resolve) => {
    const startedAt = nowIso();
    const startedMs = Date.now();
    const child = spawn(record.command, record.args, {
      cwd: record.cwd,
      env: process.env,
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      const finishedAt = nowIso();
      resolve({
        ...record,
        startedAt,
        finishedAt,
        durationMs: Date.now() - startedMs,
        exitCode: null,
        ok: false,
        required: options.required !== false,
        stdout,
        stderr: stderr ? `${stderr}\n${error.message}` : error.message,
      });
    });

    child.on('close', (exitCode) => {
      const required = options.required !== false;
      const finishedAt = nowIso();
      resolve({
        ...record,
        startedAt,
        finishedAt,
        durationMs: Date.now() - startedMs,
        exitCode,
        ok: exitCode === 0 || !required,
        required,
        stdout,
        stderr,
      });
    });
  });
}

function parseValidateCommand(command) {
  if (!command) {
    return null;
  }

  const summaryMatch = command.stdout.match(/Summary:\s+(\d+) errors,\s+(\d+) warnings,\s+(\d+) info\./i);

  return {
    ok: command.exitCode === 0,
    commandLabel: command.label,
    exitCode: command.exitCode,
    summary: summaryMatch
      ? {
          errors: Number(summaryMatch[1]),
          warnings: Number(summaryMatch[2]),
          info: Number(summaryMatch[3]),
        }
      : null,
    rawText: command.stdout.trim(),
    stderr: command.stderr.trim(),
  };
}

function buildExportResult({
  ok,
  startedAt,
  startedMs,
  oserRoot,
  chapters = [],
  commands = [],
  warnings = [],
  errors = [],
  assets = emptyAssetsReport(),
}) {
  const finishedAt = nowIso();

  return {
    ok,
    mode: 'experimental-oser-export',
    schemaVersion: 'trurl.oser-export-result/v1',
    timestamp: finishedAt,
    startedAt,
    finishedAt,
    durationMs: Date.now() - startedMs,
    inputs: {
      repoRoot,
      oserRoot: oserRoot ?? null,
      chapters: chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        order: chapter.order,
        path: chapter.path,
      })),
      combinedMarkdownPath: relativeToRepo(combinedMarkdownPath),
    },
    outputs: {
      html: relativeToRepo(htmlOutputPath),
      printHtml: relativeToRepo(printHtmlOutputPath),
      pdf: relativeToRepo(pdfOutputPath),
      diagnostics: relativeToRepo(diagnosticsPath),
      plannedAssetsDir: relativeToRepo(assetsOutputDir),
    },
    assets,
    oserDiagnostics: {
      validate: parseValidateCommand(commands.find((command) => command.label === 'validate')),
    },
    commands,
    warnings,
    errors,
  };
}

function emptyAssetsReport() {
  return {
    copyImplemented: true,
    plannedAssetsDir: relativeToRepo(assetsOutputDir),
    images: [],
    warnings: [],
  };
}

function requiredCommandErrors(commands) {
  return commands
    .filter((command) => command.required && command.exitCode !== 0)
    .map((command) => ({
      code: 'oser-command-failed',
      message: `OSER export failed during required command: ${command.label}.`,
      commandLabel: command.label,
      exitCode: command.exitCode,
    }));
}

async function writeDiagnostics(payload) {
  await mkdir(outputDir, { recursive: true });
  await writeFile(diagnosticsPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

export async function runOserExport() {
  const warnings = [];
  const commands = [];
  const startedAt = nowIso();
  const startedMs = Date.now();
  let oserRoot;
  let chapters = [];
  let assets = emptyAssetsReport();

  try {
    oserRoot = resolveOserRoot();
    await assertOserRoot(oserRoot);

    chapters = await readManuscriptChapters(repoRoot);
    if (chapters.length === 0) {
      throw new Error('No manuscript chapters were found under manuscript/*.md.');
    }

    assets = await prepareMarkdownAssets(chapters);
    warnings.push(...collectChapterWarnings(chapters));
    warnings.push(...assets.warnings);

    await mkdir(tmpDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });
    await writeFile(combinedMarkdownPath, buildCombinedMarkdown(chapters, assets), 'utf8');

    const plannedCommands = [
      commandRecord('validate', ['--prefix', oserRoot, 'run', 'validate', '--', combinedMarkdownPath], repoRoot),
      commandRecord('render-html', ['--prefix', oserRoot, 'run', 'render:html', '--', combinedMarkdownPath, htmlOutputPath], repoRoot),
      commandRecord('render-print-html', [
        '--prefix',
        oserRoot,
        'run',
        'render:html',
        '--',
        combinedMarkdownPath,
        printHtmlOutputPath,
        '--style',
        'packages/html-renderer/styles/print.css',
      ], repoRoot),
      commandRecord('render-pdf', ['--prefix', oserRoot, 'run', 'render:pdf', '--', combinedMarkdownPath, pdfOutputPath], repoRoot),
    ];

    for (const plannedCommand of plannedCommands) {
      const result = await runCommand(plannedCommand, {
        required: plannedCommand.label !== 'validate',
      });
      commands.push(result);

      if (!result.ok && result.required) {
        break;
      }
    }

    if (commands.find((command) => command.label === 'render-html' && command.exitCode === 0)) {
      await rewriteGeneratedHtmlAssetRefs(htmlOutputPath);
    }
    if (commands.find((command) => command.label === 'render-print-html' && command.exitCode === 0)) {
      await rewriteGeneratedHtmlAssetRefs(printHtmlOutputPath);
    }

    const errors = requiredCommandErrors(commands);
    const diagnostics = buildExportResult({
      ok: errors.length === 0,
      startedAt,
      startedMs,
      oserRoot,
      chapters,
      commands,
      warnings,
      errors,
      assets,
    });

    await writeDiagnostics(diagnostics);

    return diagnostics;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const diagnostics = buildExportResult({
      ok: false,
      startedAt,
      startedMs,
      oserRoot,
      chapters,
      commands,
      warnings,
      errors: [{ code: 'oser-export-failed', message }],
      assets,
    });
    await writeDiagnostics(diagnostics);
    console.error(message);
    return diagnostics;
  }
}

async function main() {
  try {
    const diagnostics = await runOserExport();
    if (diagnostics && !diagnostics.ok) {
      process.exitCode = 1;
    }
    return diagnostics;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
    return error?.diagnostics ?? null;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
