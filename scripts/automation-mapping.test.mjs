import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  deriveTestDataPath,
  extractZephyrIds,
  validateAutomationTree,
  validateSpecDataPair,
} from './automation-mapping.mjs';

const VALID_SOURCE = `
import testData from '../../test-data/ui/authentication/login.testdata.json';
import { test } from '../../fixtures/test.fixture';

test('HC-T123 | Login successfully', async ({ page }) => {
  const data = testData['HC-T123'];
  await page.goto(data.path);
});
`;

async function createPair({
  source = VALID_SOURCE,
  data = { 'HC-T123': { path: '/inventory.html' } },
  includeData = true,
} = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'automation-mapping-'));
  const specPath = path.join(
    root,
    'tests/ui/authentication/login.spec.ts',
  );
  const dataPath = path.join(
    root,
    'tests/test-data/ui/authentication/login.testdata.json',
  );
  await mkdir(path.dirname(specPath), { recursive: true });
  await mkdir(path.dirname(dataPath), { recursive: true });
  await writeFile(specPath, source);
  if (includeData) {
    await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`);
  }
  return { root, specPath, dataPath };
}

test('maps a layered spec to the matching test-data path', () => {
  assert.equal(
    deriveTestDataPath('tests/integration/authentication/login.spec.ts'),
    'tests/test-data/integration/authentication/login.testdata.json',
  );
});

test('normalizes a Windows spec path', () => {
  assert.equal(
    deriveTestDataPath('tests\\ui\\authentication\\login.spec.ts'),
    'tests/test-data/ui/authentication/login.testdata.json',
  );
});

test('extracts only HC Zephyr keys from Playwright titles', () => {
  const source = `
    test('HC-T123 | Login successfully', async () => {});
    test('HC-T124 | Reject invalid login', async () => {});
  `;

  assert.deepEqual(extractZephyrIds(source), ['HC-T123', 'HC-T124']);
});

test('rejects a non-Zephyr test title', () => {
  assert.throws(
    () => extractZephyrIds("test('LOGIN-001 | Login', async () => {});"),
    /must start with HC-T[0-9]+/,
  );
});

test('validates a matching spec and JSON pair', async () => {
  const { specPath, dataPath } = await createPair();
  assert.deepEqual(await validateSpecDataPair(specPath, dataPath), ['HC-T123']);
});

test('rejects a missing JSON file', async () => {
  const { specPath, dataPath } = await createPair({ includeData: false });
  await assert.rejects(
    () => validateSpecDataPair(specPath, dataPath),
    /Matching test-data file is missing/,
  );
});

test('rejects an import that does not target the matching JSON', async () => {
  const source = VALID_SOURCE.replace(
    'login.testdata.json',
    'different.testdata.json',
  );
  const { specPath, dataPath } = await createPair({ source });
  await assert.rejects(
    () => validateSpecDataPair(specPath, dataPath),
    /must import its matching test-data file/,
  );
});

test('rejects a Test ID missing from JSON', async () => {
  const { specPath, dataPath } = await createPair({ data: {} });
  await assert.rejects(
    () => validateSpecDataPair(specPath, dataPath),
    /HC-T123 is missing from test data/,
  );
});

test('rejects an orphan JSON Test ID', async () => {
  const { specPath, dataPath } = await createPair({
    data: {
      'HC-T123': { path: '/inventory.html' },
      'HC-T999': { path: '/unused.html' },
    },
  });
  await assert.rejects(
    () => validateSpecDataPair(specPath, dataPath),
    /HC-T999 has no matching test in the spec/,
  );
});

test('rejects a Test ID already used by another spec', async () => {
  const { specPath, dataPath } = await createPair();
  await assert.rejects(
    () => validateSpecDataPair(specPath, dataPath, new Set(['HC-T123'])),
    /HC-T123 is duplicated across spec files/,
  );
});

test('rejects testcase-specific literals inside a test callback', async () => {
  const source = VALID_SOURCE.replace(
    'await page.goto(data.path);',
    "await page.goto('/hardcoded-path');",
  );
  const { specPath, dataPath } = await createPair({ source });
  await assert.rejects(
    () => validateSpecDataPair(specPath, dataPath),
    /Move testcase-specific literal to JSON/,
  );
});

test('returns zero mappings when no production specs exist', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'automation-tree-empty-'));
  assert.deepEqual(await validateAutomationTree(path.join(root, 'tests')), {
    specs: 0,
    testcases: 0,
  });
});

test('counts valid production spec mappings', async () => {
  const { root } = await createPair();
  assert.deepEqual(await validateAutomationTree(path.join(root, 'tests')), {
    specs: 1,
    testcases: 1,
  });
});
