import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export const validationChecks = {
  frontmatter: {
    name: 'frontmatter',
    script: 'scripts/validate_frontmatter.py',
  },
  crossrefs: {
    name: 'crossrefs',
    script: 'scripts/check_crossrefs.py',
  },
  manuscriptOrder: {
    name: 'manuscript-order',
    script: 'scripts/check_manuscript_order.py',
  },
};

export const validationOrder = [
  validationChecks.frontmatter,
  validationChecks.crossrefs,
  validationChecks.manuscriptOrder,
];

async function runValidationCheck(repoRoot, check) {
  const command = `python3 ${check.script}`;

  try {
    const result = await execFileAsync('python3', [check.script], {
      cwd: repoRoot,
      maxBuffer: 1024 * 1024,
    });

    return {
      name: check.name,
      command,
      exitCode: 0,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (error) {
    return {
      name: check.name,
      command,
      exitCode: Number.isInteger(error.code) ? error.code : 1,
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
    };
  }
}

export async function runValidationChecks(repoRoot, checks) {
  const results = [];

  for (const check of checks) {
    results.push(await runValidationCheck(repoRoot, check));
  }

  return {
    ok: results.every((result) => result.exitCode === 0),
    checks: results,
  };
}
