import assert from 'node:assert/strict';
import test from 'node:test';

import { assertTestIdExists, buildPlaywrightArgs } from './run-by-id.mjs';

test('builds an exact Playwright grep for a Local Demo key', () => {
  assert.deepEqual(buildPlaywrightArgs('HC-001'), [
    'playwright',
    'test',
    '--grep',
    '^HC-001 \\|',
    '--pass-with-no-tests',
  ]);
});

test('rejects a malformed or missing Local Demo key', () => {
  for (const testId of [undefined, '', 'HC-01', 'HC-001x', 'TC-123']) {
    assert.throws(
      () => buildPlaywrightArgs(testId),
      /Usage: npm run test:id -- HC-001/,
    );
  }
});

test('rejects a well-formed key that has no discovered automation', () => {
  assert.throws(
    () => assertTestIdExists('HC-999', ['HC-001', 'HC-002']),
    /HC-999 has no discovered automation/,
  );
});
