import path from 'node:path';
import { loadManuscriptChapter } from './manuscript.js';
import { loadLinkedStoryBibleEntities } from './story-bible.js';

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

export async function buildDocumentPackage(repoRoot, { path: manuscriptPath, stylePreset, outputTarget }) {
  const chapter = await loadManuscriptChapter(repoRoot, manuscriptPath);
  const linkedEntities = await loadLinkedStoryBibleEntities(repoRoot, chapter.frontmatter);
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
