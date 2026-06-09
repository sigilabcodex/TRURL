import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';

const processes = new Map();
let shuttingDown = false;

function prefixOutput(stream, label, target) {
  const lines = createInterface({ input: stream });
  lines.on('line', (line) => {
    target.write(`[${label}] ${line}\n`);
  });
}

function signalProcess(child, signal) {
  try {
    if (isWindows) {
      child.kill(signal);
    } else {
      process.kill(-child.pid, signal);
    }
  } catch (error) {
    if (error.code !== 'ESRCH') {
      throw error;
    }
  }
}

function startProcess(label, args, options = {}) {
  const child = spawn(npmCommand, args, {
    cwd: options.cwd || repoRoot,
    env: {
      ...process.env,
      ...options.env,
    },
    stdio: ['inherit', 'pipe', 'pipe'],
    detached: !isWindows,
  });

  processes.set(label, child);
  prefixOutput(child.stdout, label, process.stdout);
  prefixOutput(child.stderr, label, process.stderr);

  child.on('error', (error) => {
    console.error(`[${label}] failed to start: ${error.message}`);
    shutdown(1);
  });

  child.on('exit', (code, signal) => {
    processes.delete(label);
    if (!shuttingDown) {
      const status = signal ? `signal ${signal}` : `exit code ${code}`;
      console.error(`[${label}] stopped with ${status}`);
      shutdown(code ?? 1);
    }
  });
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of processes.values()) {
    if (!child.killed) {
      signalProcess(child, 'SIGTERM');
    }
  }

  const forceTimer = setTimeout(() => {
    for (const child of processes.values()) {
      if (!child.killed) {
        signalProcess(child, 'SIGKILL');
      }
    }
  }, 3000);

  const finishTimer = setInterval(() => {
    if (processes.size === 0) {
      clearInterval(finishTimer);
      clearTimeout(forceTimer);
      process.exit(exitCode);
    }
  }, 50);
}

process.on('SIGINT', () => {
  console.log('\nStopping TRURL dev servers...');
  shutdown(0);
});

process.on('SIGTERM', () => {
  shutdown(0);
});

startProcess('backend', ['--prefix', 'app/backend', 'run', 'dev'], {
  env: { PORT: '4177' },
});

startProcess('frontend', ['--prefix', 'app/frontend', 'run', 'dev']);
