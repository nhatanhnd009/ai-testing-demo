import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { validateAutomationTree } from './automation-mapping.mjs';

const USAGE = 'Usage: npm run test:id -- HC-001';

export function buildPlaywrightArgs(testId) {
  if (typeof testId !== 'string' || !/^HC-\d{3,}$/.test(testId)) {
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

export function assertTestIdExists(testId, discoveredIds) {
  if (!discoveredIds.includes(testId)) {
    throw new Error(`${testId} has no discovered automation`);
  }
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
    const testId = process.argv[2];
    buildPlaywrightArgs(testId);
    const mapping = await validateAutomationTree('tests', 'testcases');
    assertTestIdExists(testId, mapping.ids);
    process.exitCode = runById(testId);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
