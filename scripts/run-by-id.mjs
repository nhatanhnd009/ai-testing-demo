import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const USAGE = 'Usage: npm run test:id -- HC-T123';

export function buildPlaywrightArgs(testId) {
  if (typeof testId !== 'string' || !/^HC-T\d+$/.test(testId)) {
    throw new Error(USAGE);
  }

  return [
    'playwright',
    'test',
    '--grep',
    `^${testId} \\|`,
    '--pass-with-no-tests',
  ];
}

export function runById(testId) {
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(command, buildPlaywrightArgs(testId), {
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

const isDirectRun = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    process.exitCode = runById(process.argv[2]);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
