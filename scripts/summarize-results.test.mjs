import assert from 'node:assert/strict';
import test from 'node:test';

import {
  resolveReportTarget,
  summarizePlaywrightReport,
} from './summarize-results.mjs';

test('uses the configured UI URL as the report target', () => {
  assert.equal(
    resolveReportTarget({ BASE_URL: 'https://app.example.test/' }),
    'https://app.example.test/',
  );
});

test('maps every Playwright result to its Local Demo key', () => {
  const report = {
    suites: [
      {
        specs: [
          {
            title: 'HC-001 | Login successfully',
            tests: [{ results: [{ status: 'passed' }] }],
          },
          {
            title: 'HC-002 | Reject invalid login',
            tests: [{ results: [{ status: 'failed' }] }],
          },
          {
            title: 'HC-003 | Future case',
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
    failedTestIds: ['HC-002'],
    testcases: [
      { testId: 'HC-001', title: 'Login successfully', status: 'passed' },
      { testId: 'HC-002', title: 'Reject invalid login', status: 'failed' },
      { testId: 'HC-003', title: 'Future case', status: 'skipped' },
    ],
  });
});

test('rejects a Playwright result without a Local Demo key', () => {
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
    /missing Local Demo Test ID/,
  );
});

test('rejects a report without suites', () => {
  assert.throws(
    () => summarizePlaywrightReport({}),
    /does not contain a suites array/,
  );
});
