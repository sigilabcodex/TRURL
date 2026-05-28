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
const combinedMarkdownPath = path.join(tmpDir, 'manuscript.md');
const htmlOutputPath = path.join(outputDir, 'manuscript.html');
const printHtmlOutputPath = path.join(outputDir, 'manuscript-print.html');
const pdfOutputPath = path.join(outputDir, 'manuscript.pdf');
const diagnosticsPath = path.join(outputDir, 'diagnostics.json');

function relativeToRepo(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, '/');
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

    const imageMatches = [...chapter.body.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)];
    for (const match of imageMatches) {
      const src = match[1].split(/\s+/)[0].trim();
      if (src && !/^[a-z][a-z0-9+.-]*:/i.test(src) && !src.startsWith('/') && !src.startsWith('#')) {
        warnings.push({
          code: 'relative-image-path-risk',
          message: `${chapter.path} contains a relative image path that may not resolve from the combined temporary Markdown file: ${src}`,
          path: chapter.path,
          src,
        });
      }
    }
  }

  warnings.push({
    code: 'asset-copy-not-implemented',
    message: 'This experimental export does not copy or rewrite assets yet.',
  });

  return warnings;
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
    const startedAt = new Date().toISOString();
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
      resolve({
        ...record,
        startedAt,
        finishedAt: new Date().toISOString(),
        exitCode: null,
        ok: false,
        required: options.required !== false,
        stdout,
        stderr: stderr ? `${stderr}\n${error.message}` : error.message,
      });
    });

    child.on('close', (exitCode) => {
      const required = options.required !== false;
      resolve({
        ...record,
        startedAt,
        finishedAt: new Date().toISOString(),
        exitCode,
        ok: exitCode === 0 || !required,
        required,
        stdout,
        stderr,
      });
    });
  });
}

async function writeDiagnostics(payload) {
  await mkdir(outputDir, { recursive: true });
  await writeFile(diagnosticsPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function main() {
  const warnings = [];
  const commands = [];
  const startedAt = new Date().toISOString();
  let oserRoot;

  try {
    oserRoot = resolveOserRoot();
    await assertOserRoot(oserRoot);

    const chapters = await readManuscriptChapters(repoRoot);
    if (chapters.length === 0) {
      throw new Error('No manuscript chapters were found under manuscript/*.md.');
    }

    warnings.push(...collectChapterWarnings(chapters));

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

    const requiredFailures = commands.filter((command) => command.required && command.exitCode !== 0);
    const diagnostics = {
      ok: requiredFailures.length === 0,
      mode: 'experimental-oser-export',
      timestamp: new Date().toISOString(),
      startedAt,
      finishedAt: new Date().toISOString(),
      repoRoot,
      oserRoot,
      inputs: {
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
      },
      commands,
      warnings,
    };

    await writeDiagnostics(diagnostics);

    if (requiredFailures.length > 0) {
      const labels = requiredFailures.map((command) => command.label).join(', ');
      throw new Error(`OSER export failed during required command(s): ${labels}. See ${relativeToRepo(diagnosticsPath)}.`);
    }

    console.log(`OSER export wrote ${relativeToRepo(htmlOutputPath)}`);
    console.log(`OSER export wrote ${relativeToRepo(printHtmlOutputPath)}`);
    console.log(`OSER export wrote ${relativeToRepo(pdfOutputPath)}`);
    console.log(`OSER export wrote ${relativeToRepo(diagnosticsPath)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await writeDiagnostics({
      ok: false,
      mode: 'experimental-oser-export',
      timestamp: new Date().toISOString(),
      startedAt,
      finishedAt: new Date().toISOString(),
      repoRoot,
      oserRoot: oserRoot ?? null,
      outputs: {
        html: relativeToRepo(htmlOutputPath),
        printHtml: relativeToRepo(printHtmlOutputPath),
        pdf: relativeToRepo(pdfOutputPath),
        diagnostics: relativeToRepo(diagnosticsPath),
      },
      commands,
      warnings,
      error: message,
    });
    console.error(message);
    process.exitCode = 1;
  }
}

main();
