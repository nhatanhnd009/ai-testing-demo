import assert from 'node:assert/strict';
import test from 'node:test';

import { summarizePlaywrightReport } from './summarize-results.mjs';

test('maps every Playwright result to its Zephyr key', () => {
  const report = {
    suites: [
      {
        specs: [
          {
            title: 'HC-T123 | Login successfully',
            tests: [{ results: [{ status: 'passed' }] }],
          },
          {
            title: 'HC-T124 | Reject invalid login',
            tests: [{ results: [{ status: 'failed' }] }],
          },
          {
            title: 'HC-T125 | Future case',
            tests: [{ results: [{ status: 'skipped' }] }],
          },
        ],
      },
    ],
  };

  assert.deepEqual(summarizePlaywrightReport(report), {
    total: 3,
    passed: 1,
    failed: 1,
    skipped: 1,
    failedTestIds: ['HC-T124'],
    testcases: [
      { testId: 'HC-T123', title: 'Login successfully', status: 'passed' },
      { testId: 'HC-T124', title: 'Reject invalid login', status: 'failed' },
      { testId: 'HC-T125', title: 'Future case', status: 'skipped' },
    ],
  });
});

test('rejects a Playwright result without an HC-T key', () => {
  const report = {
    suites: [
      {
        specs: [
          {
            title: 'Login successfully',
            tests: [{ results: [] }],
          },
        ],
      },
    ],
  };

  assert.throws(
    () => summarizePlaywrightReport(report),
    /missing HC-T Test ID/,
  );
});

test('rejects a report without suites', () => {
  assert.throws(
    () => summarizePlaywrightReport({}),
    /does not contain a suites array/,
  );
});
