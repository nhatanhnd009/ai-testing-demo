import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Playwright discovers all four automation layers', async () => {
  const config = await readFile('playwright.config.ts', 'utf8');
  for (const required of [
    "testDir: './tests'",
    "'api/**/*.spec.ts'",
    "'ui/**/*.spec.ts'",
    "'integration/**/*.spec.ts'",
    "'end-to-end/**/*.spec.ts'",
    "testIdAttribute: 'data-test'",
  ]) {
    assert.match(
      config,
      new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
  }
});

test('project configuration declares Zephyr as testcase source', async () => {
  const config = await readFile('project/project.yaml', 'utf8');
  assert.match(config, /testcase_source:\s*zephyr/);
  assert.doesNotMatch(config, /testcases\/generated/);
});
