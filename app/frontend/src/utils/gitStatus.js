function classifyStatusCode(statusCode) {
  if (statusCode === '??') return 'untracked';
  if (statusCode.includes('M')) return 'modified';
  if (statusCode.includes('A')) return 'added';
  if (statusCode.includes('D')) return 'deleted';
  if (statusCode.includes('R')) return 'renamed';
  if (statusCode.includes('C')) return 'copied';
  if (statusCode.includes('U')) return 'unmerged';
  return 'changed';
}

export function parseGitStatusOutput(stdout = '') {
  const lines = stdout.split(/\r?\n/).filter(Boolean);
  const branchLine = lines.find((line) => line.startsWith('##')) || '';
  const fileLines = lines.filter((line) => !line.startsWith('##'));
  const files = fileLines.map((line) => {
    const status = line.slice(0, 2);
    const path = line.slice(3).trim();

    return {
      status,
      path,
      type: classifyStatusCode(status),
    };
  });

  return {
    branchLine,
    branch: branchLine.replace(/^##\s*/, '') || 'unknown',
    files,
    changedFiles: files,
    modifiedFiles: files.filter((file) => file.type === 'modified'),
    untrackedFiles: files.filter((file) => file.type === 'untracked'),
    isClean: files.length === 0,
  };
}

export function summarizeGitStatus(gitStatus) {
  const statusCommand = gitStatus?.commands?.find((command) => command.name === 'status')
    || gitStatus?.commands?.[0];
  const parsed = parseGitStatusOutput(statusCommand?.stdout || '');

  return {
    ok: Boolean(gitStatus?.ok),
    command: statusCommand?.command || '',
    rawOutput: statusCommand?.stdout || statusCommand?.stderr || '',
    ...parsed,
  };
}
