import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const gitDiffPaths = [
  'app/backend',
  'app/frontend',
  'README.md',
  'docs',
  'scripts',
  'ai',
  'schema',
  'manuscript',
  'story-bible',
  'notes',
  'revision',
];

export const gitCommands = {
  status: {
    name: 'status',
    args: ['status', '--short', '--branch'],
  },
  diffStat: {
    name: 'diff-stat',
    args: ['diff', '--stat'],
  },
  diffScoped: {
    name: 'diff-scoped',
    args: ['diff', '--', ...gitDiffPaths],
  },
};

async function runFixedCommand(repoRoot, executable, args, name) {
  const command = [executable, ...args].join(' ');

  try {
    const result = await execFileAsync(executable, args, {
      cwd: repoRoot,
      maxBuffer: 1024 * 1024 * 4,
    });

    return {
      name,
      command,
      exitCode: 0,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (error) {
    return {
      name,
      command,
      exitCode: Number.isInteger(error.code) ? error.code : 1,
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
    };
  }
}

export async function runGitCommands(repoRoot, commands) {
  const results = [];

  for (const command of commands) {
    results.push(await runFixedCommand(repoRoot, 'git', command.args, command.name));
  }

  return {
    ok: results.every((result) => result.exitCode === 0),
    commands: results,
  };
}
