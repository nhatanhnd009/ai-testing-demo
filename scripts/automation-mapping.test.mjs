import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  deriveTestDataPath,
  extractTestcaseIds,
  validateLocalDemoMappings,
  validateAutomationTree,
  validateSpecDataPair,
} from './automation-mapping.mjs';

const LOCAL_DEMO_ROWS = [
  {
    TestcaseID: 'HC-001',
    Description: 'Login successfully',
  },
];

const VALID_SOURCE = `
import testData from './login.json';
import { test } from '../../fixtures/test.fixture';

test('HC-001 | Login successfully', async ({ page }) => {
  const data = testData['HC-001'];
  await page.goto(data.path);
});
`;

async function createPair({
  source = VALID_SOURCE,
  data = { 'HC-001': { path: '/inventory.html' } },
  includeData = true,
} = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'automation-mapping-'));
  const specPath = path.join(
    root,
    'tests/ui/authentication/login.spec.ts',
  );
  const dataPath = path.join(
    root,
    'tests/ui/authentication/login.json',
  );
  await mkdir(path.dirname(specPath), { recursive: true });
  await mkdir(path.dirname(dataPath), { recursive: true });
  const testcaseRoot = path.join(root, 'testcases');
  await mkdir(testcaseRoot, { recursive: true });
  await writeFile(
    path.join(testcaseRoot, 'local-demo.csv'),
    'TestcaseID,Description,Preconditions,Steps,Expected\nHC-001,Login successfully,N/A,1. Login,1. Logged in\n',
  );
  await writeFile(specPath, source);
  if (includeData) {
    await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`);
  }
  return { root, specPath, dataPath, testcaseRoot };
}

test('maps a layered spec to the matching test-data path', () => {
  assert.equal(
    deriveTestDataPath('tests/integration/authentication/login.spec.ts'),
    'tests/integration/authentication/login.json',
  );
});

test('normalizes a Windows spec path', () => {
  assert.equal(
    deriveTestDataPath('tests\\ui\\authentication\\login.spec.ts'),
    'tests/ui/authentication/login.json',
  );
});

test('extracts Local Demo testcase keys from Playwright titles', () => {
  const source = `
    test('HC-001 | Login successfully', async () => {});
    test('HC-002 | Reject invalid login', async () => {});
  `;

  assert.deepEqual(extractTestcaseIds(source), ['HC-001', 'HC-002']);
});

test('maps automation definitions to reviewed Local Demo CSV rows', () => {
  assert.doesNotThrow(() =>
    validateLocalDemoMappings(
      [{ id: 'HC-001', layer: 'ui', title: 'Login successfully' }],
      LOCAL_DEMO_ROWS,
    ),
  );
});

test('rejects an automation key missing from the Local Demo CSV', () => {
  assert.throws(
    () =>
      validateLocalDemoMappings(
        [{ id: 'HC-002', layer: 'ui', title: 'Reject invalid credentials' }],
        LOCAL_DEMO_ROWS,
      ),
    /HC-002 is missing from the Local Demo CSV/,
  );
});

test('rejects a title that disagrees with the Local Demo CSV', () => {
  assert.throws(
    () =>
      validateLocalDemoMappings(
        [{ id: 'HC-001', layer: 'ui', title: 'Different title' }],
        LOCAL_DEMO_ROWS,
      ),
    /HC-001 title does not match/,
  );
});

test('rejects a malformed Local Demo test title', () => {
  assert.throws(
    () => extractTestcaseIds("test('HC-01 | Login', async () => {});"),
    /must start with HC-001/,
  );
});

test('validates a matching spec and JSON pair', async () => {
  const { specPath, dataPath } = await createPair();
  assert.deepEqual(await validateSpecDataPair(specPath, dataPath), ['HC-001']);
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
    'login.json',
    'different.json',
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
    /HC-001 is missing from test data/,
  );
});

test('rejects an orphan JSON Test ID', async () => {
  const { specPath, dataPath } = await createPair({
    data: {
      'HC-001': { path: '/inventory.html' },
      'HC-999': { path: '/unused.html' },
    },
  });
  await assert.rejects(
    () => validateSpecDataPair(specPath, dataPath),
    /HC-999 has no matching test in the spec/,
  );
});

test('rejects a Test ID already used by another spec', async () => {
  const { specPath, dataPath } = await createPair();
  await assert.rejects(
    () => validateSpecDataPair(specPath, dataPath, new Set(['HC-001'])),
    /HC-001 is duplicated across spec files/,
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
  const testcaseRoot = path.join(root, 'testcases');
  await mkdir(testcaseRoot, { recursive: true });
  await writeFile(
    path.join(testcaseRoot, 'local-demo.csv'),
    'TestcaseID,Description,Preconditions,Steps,Expected\n',
  );
  assert.deepEqual(await validateAutomationTree(path.join(root, 'tests'), testcaseRoot), {
    specs: 0,
    testcases: 0,
    ids: [],
  });
});

test('counts valid production spec mappings', async () => {
  const { root, testcaseRoot } = await createPair();
  assert.deepEqual(await validateAutomationTree(path.join(root, 'tests'), testcaseRoot), {
    specs: 1,
    testcases: 1,
    ids: ['HC-001'],
  });
});
