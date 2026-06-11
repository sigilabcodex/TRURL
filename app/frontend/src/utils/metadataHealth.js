import { EMPTY_METADATA_VALUE, normalizeChapterMetadata } from './chapterMetadata.js';

function hasValue(value) {
  return value !== EMPTY_METADATA_VALUE && value !== null && value !== undefined && String(value).trim() !== '';
}

function createIssue(level, code, label) {
  return { level, code, label };
}

function summarizeIssues(issues) {
  return issues.reduce((summary, issue) => {
    summary[issue.level] += 1;
    return summary;
  }, { error: 0, warning: 0, info: 0 });
}

export function getChapterMetadataHealth(chapter) {
  const metadata = normalizeChapterMetadata(chapter);
  const issues = [];

  metadata.warnings.forEach((warning) => {
    if (warning === 'Missing frontmatter id.') {
      issues.push(createIssue('warning', 'missing-id', 'Missing id'));
    }

    if (warning === 'Missing frontmatter title.') {
      issues.push(createIssue('warning', 'missing-title', 'Missing title'));
    }

    if (warning.startsWith('Unknown type:')) {
      issues.push(createIssue('warning', 'unknown-type', warning.replace(/\.$/, '')));
    }

    if (warning.startsWith('Unknown status:')) {
      issues.push(createIssue('warning', 'unknown-status', warning.replace(/\.$/, '')));
    }
  });

  if (hasValue(metadata.source.text) !== hasValue(metadata.source.url)) {
    issues.push(createIssue('info', 'partial-source', 'Incomplete source'));
  }

  if (!hasValue(metadata.summary)) {
    issues.push(createIssue('info', 'empty-summary', 'No summary'));
  }

  if (metadata.participants.characters.length === 0) {
    issues.push(createIssue('info', 'no-characters', 'No linked characters'));
  }

  if (metadata.participants.locations.length === 0) {
    issues.push(createIssue('info', 'no-locations', 'No linked locations'));
  }

  if (metadata.participants.timeline.length === 0) {
    issues.push(createIssue('info', 'no-timeline', 'No timeline signals'));
  }

  return {
    issues,
    summary: summarizeIssues(issues),
  };
}

export function getProjectMetadataHealth(chapters = []) {
  const chapterHealth = (Array.isArray(chapters) ? chapters : []).map((chapter) => ({
    id: chapter?.id || chapter?.path || 'unknown',
    title: chapter?.title || chapter?.path || 'Untitled',
    health: getChapterMetadataHealth(chapter),
  }));

  const summary = chapterHealth.reduce((total, item) => {
    total.error += item.health.summary.error;
    total.warning += item.health.summary.warning;
    total.info += item.health.summary.info;
    return total;
  }, { error: 0, warning: 0, info: 0 });

  return {
    chapters: chapterHealth,
    summary,
  };
}
