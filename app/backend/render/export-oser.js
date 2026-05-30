import { access, mkdir, stat, writeFile } from 'node:fs/promises';
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

async function analyzeMarkdownAssets(chapters) {
  const images = [];
  const warnings = [];

  for (const chapter of chapters) {
    const chapterAbsolutePath = path.join(repoRoot, chapter.path);
    const chapterDir = path.dirname(chapterAbsolutePath);
    const imageMatches = chapter.body.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g);

    for (const match of imageMatches) {
      const alt = match[1];
      const rawTarget = match[2].trim();
      const src = extractMarkdownLinkDestination(rawTarget);
      const baseRecord = {
        chapterPath: chapter.path,
        alt,
        src,
        rawTarget,
      };

      if (!src) {
        images.push({
          ...baseRecord,
          kind: 'empty',
          exists: false,
        });
        warnings.push({
          code: 'markdown-image-empty-src',
          message: `${chapter.path} contains a Markdown image with an empty source.`,
          path: chapter.path,
        });
        continue;
      }

      if (isExternalAssetRef(src)) {
        images.push({
          ...baseRecord,
          kind: 'external',
          exists: null,
        });
        continue;
      }

      if (src.startsWith('/') || src.startsWith('#')) {
        images.push({
          ...baseRecord,
          kind: src.startsWith('#') ? 'anchor' : 'absolute',
          exists: null,
        });
        continue;
      }

      const resolvedPath = path.resolve(chapterDir, src);
      const exists = await fileExists(resolvedPath);
      const imageRecord = {
        ...baseRecord,
        kind: 'relative',
        resolvedPath: relativeToRepo(resolvedPath),
        exists,
        plannedOutputPath: path.posix.join('exports/oser/assets', path.basename(src)),
      };
      images.push(imageRecord);

      if (!exists) {
        warnings.push({
          code: 'markdown-image-missing',
          message: `${chapter.path} references a missing relative image: ${src}`,
          path: chapter.path,
          src,
          resolvedPath: imageRecord.resolvedPath,
        });
      }
    }
  }

  if (images.some((image) => image.kind === 'relative')) {
    warnings.push({
      code: 'asset-copy-not-implemented',
      message: 'Relative Markdown images were detected, but this experimental export does not copy assets or rewrite image paths yet.',
      plannedAssetsDir: relativeToRepo(assetsOutputDir),
    });
  }

  return {
    copyImplemented: false,
    plannedAssetsDir: relativeToRepo(assetsOutputDir),
    images,
    warnings,
  };
}

function extractMarkdownLinkDestination(rawTarget) {
  if (!rawTarget) return '';

  if (rawTarget.startsWith('<')) {
    const closingIndex = rawTarget.indexOf('>');
    if (closingIndex > 0) {
      return rawTarget.slice(1, closingIndex).trim();
    }
  }

  return rawTarget.split(/\s+/)[0].trim();
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

function buildCombinedMarkdown(chapters) {
  const parts = ['# Manuscript'];

  for (const chapter of chapters) {
    const body = normalizeBody(chapter.body);
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
    copyImplemented: false,
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

async function main() {
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

    assets = await analyzeMarkdownAssets(chapters);
    warnings.push(...collectChapterWarnings(chapters));
    warnings.push(...assets.warnings);

    await mkdir(tmpDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });
    await writeFile(combinedMarkdownPath, buildCombinedMarkdown(chapters), 'utf8');

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

    if (errors.length > 0) {
      const labels = errors.map((error) => error.commandLabel).join(', ');
      throw new Error(`OSER export failed during required command(s): ${labels}. See ${relativeToRepo(diagnosticsPath)}.`);
    }

    console.log(`OSER export wrote ${relativeToRepo(htmlOutputPath)}`);
    console.log(`OSER export wrote ${relativeToRepo(printHtmlOutputPath)}`);
    console.log(`OSER export wrote ${relativeToRepo(pdfOutputPath)}`);
    console.log(`OSER export wrote ${relativeToRepo(diagnosticsPath)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await writeDiagnostics(buildExportResult({
      ok: false,
      startedAt,
      startedMs,
      oserRoot,
      chapters,
      commands,
      warnings,
      errors: [{ code: 'oser-export-failed', message }],
      assets,
    }));
    console.error(message);
    process.exitCode = 1;
  }
}

main();
