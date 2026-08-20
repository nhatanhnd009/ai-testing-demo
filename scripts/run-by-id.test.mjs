import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPlaywrightArgs } from './run-by-id.mjs';

test('builds an exact Playwright grep for a Zephyr key', () => {
  assert.deepEqual(buildPlaywrightArgs('HC-T123'), [
    'playwright',
    'test',
    '--grep',
    '^HC-T123 \\|',
    '--pass-with-no-tests',
  ]);
});

test('rejects a malformed or missing Zephyr key', () => {
  for (const testId of [undefined, '', 'HC-T', 'HC-T1234x', 'TC-123']) {
    assert.throws(
      () => buildPlaywrightArgs(testId),
      /Usage: npm run test:id -- HC-T123/,
    );
  }
});
