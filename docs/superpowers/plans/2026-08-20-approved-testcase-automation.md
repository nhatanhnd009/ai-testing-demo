# Zephyr-Driven Playwright Testing Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the repository foundation and four project skills for human-reviewed Zephyr testcases and data-driven Playwright TypeScript automation across API, UI, API-to-UI integration, and release E2E layers.

**Architecture:** Zephyr is the only official testcase repository, while GitLab stores automation code and JSON test data. AI proposes cases in chat, publishes only after human instruction, rereads finalized Zephyr cases on an explicit script request, and generates one matching JSON data file per Playwright spec. This plan builds the framework and guardrails; it does not invent Zephyr Keys or create business scripts before a real reviewed `HC-Txxx` case exists.

**Tech Stack:** Node.js 20+, TypeScript, Playwright Test, JSON, dotenv, Node test runner, project-local Codex skills.

**Spec:** `docs/superpowers/specs/2026-08-20-approved-testcase-automation-design.md`

## Global Constraints

- Use Playwright Test and TypeScript for API and UI automation.
- Zephyr is the single source of truth for official testcases; do not keep a Git `testcases/` collection.
- Use `HC-T\d+` as the only official Test ID format.
- Automation generation requires a finalized Zephyr testcase plus an explicit human instruction.
- Every `*.spec.ts` has exactly one corresponding `*.testdata.json` with the same basename and relative layer/feature path.
- Test-specific API payloads, UI inputs, and expected values come from JSON.
- Real credentials and tokens remain in `.env` or CI secrets and never appear in JSON, source, reports, screenshots, or console output.
- Use Page Object Model for browser locators and reusable UI actions.
- API-to-UI tests verify API preparation before opening and asserting the UI.
- E2E tests live in a separate release directory and can run independently.
- Manual Zephyr cases never receive skipped or placeholder Playwright tests.
- Version one supports username/password login only; OTP, CAPTCHA, SSO, Microsoft, and Google login are out of scope.

---

### Task 1: Replace the VnExpress Layout with the Layered Testing Foundation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `tsconfig.json`
- Modify: `playwright.config.ts`
- Modify: `.env.example`
- Verify: `.gitignore`
- Modify: `project/project.yaml`
- Modify: `project/requirement-sources.yaml`
- Create: `project/zephyr.yaml`
- Modify: `scripts/check-config.mjs`
- Create: `scripts/check-config.test.mjs`
- Modify: `tests/fixtures/test.fixture.ts`
- Delete: `requirements/input/VNE-HOME-requirement.md`
- Delete: `requirements/analyzed/VNE-HOME-analysis.md`
- Delete: `testcases/generated/TC-VnExpress-Homepage.md`
- Delete: `tests/pages/VnExpressHomePage.ts`
- Delete: `tests/specs/vnexpress-homepage.spec.ts`

**Interfaces:**
- Produces: Playwright discovery roots `tests/api`, `tests/ui`, `tests/integration`, and `tests/end-to-end`.
- Produces: non-secret Zephyr settings `project_key`, `features_root`, `e2e_root`, and `test_key_pattern` in `project/zephyr.yaml`.
- Produces: a base fixture export from `tests/fixtures/test.fixture.ts` for later generated Page Objects and API clients.

- [ ] **Step 1: Write the failing configuration contract test**

```js
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
    assert.match(config, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('project configuration declares Zephyr as testcase source', async () => {
  const config = await readFile('project/project.yaml', 'utf8');
  assert.match(config, /testcase_source:\s*zephyr/);
  assert.doesNotMatch(config, /testcases\/generated/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test scripts/check-config.test.mjs`

Expected: FAIL because the current Playwright configuration only discovers `tests/specs` and the project still points to `testcases/generated`.

- [ ] **Step 3: Install runtime configuration dependencies**

Run:

```bash
npm install --save-dev dotenv tsx
```

Expected: `package.json` and `package-lock.json` contain `dotenv` and `tsx` under `devDependencies`.

- [ ] **Step 4: Replace the Playwright configuration**

Use this configuration contract:

```ts
import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: [
    'api/**/*.spec.ts',
    'ui/**/*.spec.ts',
    'integration/**/*.spec.ts',
    'end-to-end/**/*.spec.ts',
  ],
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['json', { outputFile: 'reports/results.json' }],
    ['html', { outputFolder: 'reports/playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://www.saucedemo.com/',
    testIdAttribute: 'data-test',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  outputDir: 'reports/test-results',
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

- [ ] **Step 5: Replace repository configuration**

Set `.env.example` to:

```env
BASE_URL=https://www.saucedemo.com/
LOGIN_URL=https://www.saucedemo.com/
API_BASE_URL=
TEST_USERNAME=standard_user
TEST_PASSWORD=secret_sauce
```

Set the relevant project contract to:

```yaml
project:
  name: testing
  type: web-and-api
  testcase_source: zephyr

test:
  framework: playwright
  language: typescript
  design_pattern: page-object-model
  browser: chromium
  test_id_pattern: "^HC-T[0-9]+$"

output:
  requirement_analysis: requirements/analyzed
  automation: tests
  test_data: tests/test-data
  reports: reports
```

Create `project/zephyr.yaml`:

```yaml
zephyr:
  enabled: false
  project_key: HC
  features_root: Features
  e2e_root: End-to-End/Release Full Flows
  test_key_pattern: "^HC-T[0-9]+$"
```

Add a disabled Zephyr source entry to `project/requirement-sources.yaml`. Do not add API tokens or credentials to either YAML file.

- [ ] **Step 6: Remove obsolete artifacts and reset the base fixture**

Delete every VnExpress requirement, testcase, Page Object, and spec listed in this task. Replace `tests/fixtures/test.fixture.ts` with:

```ts
import { test } from '@playwright/test';

export { expect } from '@playwright/test';
export { test };
```

Do not create a replacement business spec because no finalized Zephyr Key exists yet.

- [ ] **Step 7: Update the configuration validator**

Make `scripts/check-config.mjs` verify:

```js
const requiredFiles = [
  'package.json',
  'tsconfig.json',
  'playwright.config.ts',
  'project/project.yaml',
  'project/requirement-sources.yaml',
  'project/zephyr.yaml',
];

const requiredConfigText = [
  "testDir: './tests'",
  "'api/**/*.spec.ts'",
  "'ui/**/*.spec.ts'",
  "'integration/**/*.spec.ts'",
  "'end-to-end/**/*.spec.ts'",
  "testIdAttribute: 'data-test'",
  "outputFile: 'reports/results.json'",
  "outputFolder: 'reports/playwright-report'",
];
```

Also fail if `project/project.yaml` contains `testcases/generated` or if a `testcases/` directory still exists.

- [ ] **Step 8: Enable JSON imports in TypeScript**

Add this compiler option:

```json
"resolveJsonModule": true
```

Keep `strict`, `noEmit`, `NodeNext`, and the existing Playwright/Node types.

- [ ] **Step 9: Verify GREEN**

Run:

```bash
node --test scripts/check-config.test.mjs
node scripts/check-config.mjs
git check-ignore .env
git ls-files .env
```

Expected: both config checks pass, `.env` is ignored, and `git ls-files .env` prints nothing.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json tsconfig.json playwright.config.ts .env.example .gitignore project scripts/check-config.mjs scripts/check-config.test.mjs tests requirements testcases
git commit -m "feat: establish Zephyr-driven test layers"
```

### Task 2: Load Environment and Credential Profiles Safely

**Files:**
- Create: `tests/config/environment.ts`
- Create: `tests/config/environment.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `loadUiConfig(env?: NodeJS.ProcessEnv): { baseUrl: string; loginUrl: string }`.
- Produces: `loadApiConfig(env?: NodeJS.ProcessEnv): { apiBaseUrl: string }`.
- Produces: `loadCredentialProfile(profile: 'standardUser', env?: NodeJS.ProcessEnv): { username: string; password: string }`.

- [ ] **Step 1: Write failing environment tests**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  loadApiConfig,
  loadCredentialProfile,
  loadUiConfig,
} from './environment';

test('loads UI and API configuration', () => {
  const env = {
    BASE_URL: 'https://app.example.test/',
    LOGIN_URL: 'https://app.example.test/login',
    API_BASE_URL: 'https://api.example.test/',
  };
  assert.deepEqual(loadUiConfig(env), {
    baseUrl: env.BASE_URL,
    loginUrl: env.LOGIN_URL,
  });
  assert.deepEqual(loadApiConfig(env), { apiBaseUrl: env.API_BASE_URL });
});

test('resolves the standardUser profile without logging values', () => {
  assert.deepEqual(
    loadCredentialProfile('standardUser', {
      TEST_USERNAME: 'qa-user',
      TEST_PASSWORD: 'not-logged',
    }),
    { username: 'qa-user', password: 'not-logged' },
  );
});

test('reports only the missing variable name', () => {
  assert.throws(
    () => loadCredentialProfile('standardUser', { TEST_USERNAME: 'qa-user' }),
    /^Error: Missing required environment variable: TEST_PASSWORD$/,
  );
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --import tsx --test tests/config/environment.test.ts`

Expected: FAIL because `tests/config/environment.ts` does not exist.

- [ ] **Step 3: Implement the typed configuration loader**

```ts
type UiConfig = { baseUrl: string; loginUrl: string };
type ApiConfig = { apiBaseUrl: string };
type CredentialProfile = { username: string; password: string };

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function loadUiConfig(env = process.env): UiConfig {
  return {
    baseUrl: required(env, 'BASE_URL'),
    loginUrl: required(env, 'LOGIN_URL'),
  };
}

export function loadApiConfig(env = process.env): ApiConfig {
  return { apiBaseUrl: required(env, 'API_BASE_URL') };
}

export function loadCredentialProfile(
  profile: 'standardUser',
  env = process.env,
): CredentialProfile {
  if (profile !== 'standardUser') throw new Error(`Unknown credential profile: ${profile}`);
  return {
    username: required(env, 'TEST_USERNAME'),
    password: required(env, 'TEST_PASSWORD'),
  };
}
```

- [ ] **Step 4: Add the unit-test command**

Set:

```json
"test:unit": "node --test scripts/check-config.test.mjs scripts/automation-mapping.test.mjs scripts/run-by-id.test.mjs scripts/summarize-results.test.mjs && node --import tsx --test tests/config/environment.test.ts"
```

- [ ] **Step 5: Verify GREEN**

Run:

```bash
node --import tsx --test tests/config/environment.test.ts
npm run typecheck
```

Expected: environment tests and TypeScript compilation pass without printing credential values.

- [ ] **Step 6: Commit**

```bash
git add tests/config package.json
git commit -m "feat: load protected automation profiles"
```

### Task 3: Enforce One Spec to One JSON and HC-T Mapping

**Files:**
- Create: `scripts/automation-mapping.mjs`
- Create: `scripts/automation-mapping.test.mjs`
- Create: `scripts/validate-automation-mapping.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `deriveTestDataPath(specPath: string): string`.
- Produces: `extractZephyrIds(source: string): string[]`.
- Produces: `validateSpecDataPair(specPath: string, dataPath: string, seenIds?: Set<string>): Promise<string[]>`.
- Produces: `validateAutomationTree(testsRoot?: string): Promise<{ specs: number; testcases: number }>`.

- [ ] **Step 1: Write failing path and ID tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveTestDataPath, extractZephyrIds } from './automation-mapping.mjs';

test('maps a layered spec to the matching test-data path', () => {
  assert.equal(
    deriveTestDataPath('tests/integration/authentication/login.spec.ts'),
    'tests/test-data/integration/authentication/login.testdata.json',
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
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test scripts/automation-mapping.test.mjs`

Expected: FAIL because `automation-mapping.mjs` does not exist.

- [ ] **Step 3: Implement path and title parsing**

Implement these exact rules:

```js
const LAYERS = ['api', 'ui', 'integration', 'end-to-end'];
const TEST_TITLE = /\btest\s*\(\s*(['"])(HC-T\d+)\s*\|[^'"]+\1/g;
const ANY_TEST_TITLE = /\btest\s*\(\s*(['"])([^'"]+)\1/g;
```

`deriveTestDataPath()` must normalize Windows separators, require a path under one of the four layer directories, move the relative path beneath `tests/test-data/`, and replace `.spec.ts` with `.testdata.json`.

`extractZephyrIds()` must throw when a discovered `test()` title does not begin with `HC-T\d+ |`, when no test exists, or when the same ID occurs more than once in the source.

- [ ] **Step 4: Write failing spec/data pair tests**

Create temporary files in the Node test using `mkdtemp`, `mkdir`, and `writeFile`. Verify all of these cases:

```text
PASS: spec imports its matching JSON and uses testData['HC-T123']
FAIL: matching JSON file is missing
FAIL: spec does not import the matching JSON
FAIL: HC-T123 is missing from JSON
FAIL: JSON contains orphan HC-T999
FAIL: two specs reuse HC-T123
FAIL: test callback contains a testcase-specific string/number/boolean literal
```

Use this valid fixture source:

```ts
import testData from '../../test-data/ui/authentication/login.testdata.json';
import { test } from '../../fixtures/test.fixture';

test('HC-T123 | Login successfully', async ({ page }) => {
  const data = testData['HC-T123'];
  await page.goto(data.path);
});
```

Use this valid JSON:

```json
{
  "HC-T123": {
    "path": "/inventory.html"
  }
}
```

- [ ] **Step 5: Implement pair and tree validation**

`validateSpecDataPair()` must:

1. derive and require the exact JSON path;
2. require an import whose resolved path is that JSON file;
3. parse the JSON as an object;
4. require `testData['HC-Txxx']` or `testData["HC-Txxx"]` for every spec ID;
5. reject JSON keys not used by the spec;
6. reject IDs already present in the supplied `seenIds` set;
7. use the TypeScript compiler API to inspect each `test()` callback and reject string, number, `true`, or `false` literals except the key literal inside `testData['HC-Txxx']` and labels passed as the first argument of `test.step()`.

`validateAutomationTree()` must recursively scan only `tests/api`, `tests/ui`, `tests/integration`, and `tests/end-to-end`. With no specs it returns `{ specs: 0, testcases: 0 }`. It must never scan Node unit tests under `tests/config`.

- [ ] **Step 6: Add the executable validator**

```js
import { validateAutomationTree } from './automation-mapping.mjs';

const result = await validateAutomationTree('tests');
console.log(
  `Validated ${result.testcases} Zephyr mapping(s) across ${result.specs} spec file(s).`,
);
```

Add:

```json
"check:mapping": "node scripts/validate-automation-mapping.mjs"
```

- [ ] **Step 7: Verify GREEN**

Run:

```bash
node --test scripts/automation-mapping.test.mjs
npm run check:mapping
```

Expected: all mapping unit tests pass; the repository reports zero production mappings until a real finalized Zephyr testcase is automated.

- [ ] **Step 8: Commit**

```bash
git add scripts/automation-mapping.mjs scripts/automation-mapping.test.mjs scripts/validate-automation-mapping.mjs package.json
git commit -m "feat: validate Zephyr spec data mappings"
```

### Task 4: Map Every Playwright Result to an HC-T Key

**Files:**
- Modify: `scripts/summarize-results.mjs`
- Modify: `scripts/summarize-results.test.mjs`

**Interfaces:**
- Produces: `summarizePlaywrightReport(report): { total; passed; failed; skipped; failedTestIds; testcases }`.
- Produces: each `testcases` item as `{ testId: string; title: string; status: 'passed' | 'failed' | 'skipped' }`.

- [ ] **Step 1: Replace the report unit test with HC-T cases**

```js
test('maps every Playwright result to its Zephyr key', () => {
  const report = {
    suites: [{
      specs: [
        {
          title: 'HC-T123 | Login successfully',
          tests: [{ results: [{ status: 'passed' }] }],
        },
        {
          title: 'HC-T124 | Reject invalid login',
          tests: [{ results: [{ status: 'failed' }] }],
        },
      ],
    }],
  };

  assert.deepEqual(summarizePlaywrightReport(report), {
    total: 2,
    passed: 1,
    failed: 1,
    skipped: 0,
    failedTestIds: ['HC-T124'],
    testcases: [
      { testId: 'HC-T123', title: 'Login successfully', status: 'passed' },
      { testId: 'HC-T124', title: 'Reject invalid login', status: 'failed' },
    ],
  });
});

test('rejects a Playwright result without an HC-T key', () => {
  const report = {
    suites: [{ specs: [{ title: 'Login successfully', tests: [{ results: [] }] }] }],
  };
  assert.throws(() => summarizePlaywrightReport(report), /missing HC-T Test ID/);
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test scripts/summarize-results.test.mjs`

Expected: FAIL because the current summarizer recognizes the old VnExpress ID and does not return a `testcases` array.

- [ ] **Step 3: Implement strict HC-T result mapping**

For every Playwright spec result:

```js
const match = spec.title?.match(/^(HC-T\d+)\s*\|\s*(.+)$/);
if (!match) throw new Error(`Playwright result is missing HC-T Test ID: ${spec.title}`);
const [, testId, title] = match;
```

Normalize Playwright statuses to `passed`, `failed`, or `skipped`, preserve `failedTestIds`, and append the mapped testcase object. Change the summary target to `process.env.BASE_URL ?? process.env.API_BASE_URL ?? 'not-configured'`.

- [ ] **Step 4: Verify GREEN**

Run: `node --test scripts/summarize-results.test.mjs`

Expected: all summary tests pass and every returned testcase includes `HC-Txxx`.

- [ ] **Step 5: Commit**

```bash
git add scripts/summarize-results.mjs scripts/summarize-results.test.mjs
git commit -m "feat: report results by Zephyr key"
```

### Task 5: Implement the Four-Skill Zephyr Workflow

**Files:**
- Modify: `.agents/skills/analyze-requirement/SKILL.md`
- Modify: `.agents/skills/generate-testcases/SKILL.md`
- Create: `.agents/skills/generate-automation/SKILL.md`
- Create: `.agents/skills/generate-automation/agents/openai.yaml`
- Modify: `.agents/skills/run-testcases/SKILL.md`
- Modify: `scripts/validate-skills.mjs`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: requirement sources, explicit human commands, Zephyr connector availability, and finalized `HC-Txxx` keys.
- Produces: chat-only testcase proposals, explicit Zephyr create/update operations, and guarded automation generation instructions.

- [ ] **Step 1: Write the new skill contracts before editing skills**

Set these required contract fragments in `scripts/validate-skills.mjs`:

```js
const contracts = {
  'analyze-requirement': [
    'requirements/analyzed',
    'Confluence',
    'Jira',
    'API + UI',
    'Unclear Points',
  ],
  'generate-testcases': [
    'in chat',
    'Zephyr',
    'explicit human instruction',
    'Test Layer',
    'Expected Result',
    'HC-T',
    'Never create automation',
  ],
  'generate-automation': [
    'finalized Zephyr Keys',
    'reread',
    'HC-T',
    '*.spec.ts',
    '*.testdata.json',
    'tests/api-clients',
    'tests/pages',
    'getByTestId',
    'npm run check:mapping',
  ],
  'run-testcases': [
    'npm run test:api',
    'npm run test:ui',
    'npm run test:integration',
    'npm run test:e2e',
    'reports/results.json',
    'HC-T',
  ],
};
```

- [ ] **Step 2: Run validation and verify RED**

Run: `node scripts/validate-skills.mjs`

Expected: FAIL because `generate-automation` is absent and the other skills still describe Git testcase files and VnExpress IDs.

- [ ] **Step 3: Update requirement analysis instructions**

Require the analyzer to classify testable behavior as API, UI, API + UI, End-to-End, or Manual; identify API-to-UI precondition dependencies; preserve Unclear Points; and avoid creating testcase IDs.

- [ ] **Step 4: Replace testcase generation instructions**

The skill must enforce this order:

```text
read analyzed requirement
→ present complete proposed cases in chat
→ wait for first human review
→ publish or update Zephyr only on explicit instruction
→ capture returned HC-Txxx keys
→ stop without generating automation
```

Every proposed case contains Title, Feature, Preconditions, Test Layer, Steps, Test Data, and Expected Result. Before Zephyr creation it has no official Testcase ID. When updating an existing testcase, reread it first and preserve its Zephyr Key.

If no connected Zephyr capability is available, report a connection blocker and keep the reviewed content in chat; do not create a Git testcase file as a fallback.

- [ ] **Step 5: Create `generate-automation`**

Its required workflow is:

```text
require manual confirmation that cross-review is complete
→ require explicit script request with HC-Txxx keys
→ read latest testcase versions from Zephyr
→ reject Manual or ambiguous cases
→ choose api, ui, integration, or end-to-end path from Test Layer
→ for UI layers, open the live site and verify locators
→ create/update API clients, Page Objects, and fixtures
→ create one spec and exactly one matching JSON file
→ map every requested HC-Txxx key in both files
→ run mapping validation, TypeScript, and Playwright discovery
```

It must use locator priority `getByTestId` → `getByRole` → `getByLabel` → `getByPlaceholder` → stable CSS. It must use API request setup before browser verification for `API + UI`, keep credentials in `.env`, and stop rather than guess when Zephyr, API, login, UI, or locators are unavailable.

- [ ] **Step 6: Update execution instructions**

Document layer commands, `npm run test:id -- HC-T123`, evidence locations, and the rule that browser/API/setup failures remain failures. E2E execution must run only `tests/end-to-end/` when selected.

- [ ] **Step 7: Update `AGENTS.md`**

Replace the old Git testcase contract with the approved workflow. State explicitly:

```text
Do not create an official testcase file in Git.
Do not publish to Zephyr without an explicit human instruction.
Do not generate scripts after publication or review automatically.
Generate scripts only after a human confirms cross-review and names HC-Txxx keys.
Every spec requires one matching JSON data file.
```

- [ ] **Step 8: Validate all four skills**

Run:

```bash
node scripts/validate-skills.mjs
python3 /root/.codex/skills/oai/skill-creator/scripts/quick_validate.py .agents/skills/analyze-requirement
python3 /root/.codex/skills/oai/skill-creator/scripts/quick_validate.py .agents/skills/generate-testcases
python3 /root/.codex/skills/oai/skill-creator/scripts/quick_validate.py .agents/skills/generate-automation
python3 /root/.codex/skills/oai/skill-creator/scripts/quick_validate.py .agents/skills/run-testcases
```

Expected: all validators pass.

- [ ] **Step 9: Commit**

```bash
git add .agents/skills scripts/validate-skills.mjs AGENTS.md
git commit -m "feat: add Zephyr-gated tester skills"
```

### Task 6: Add Layer and Test-ID Execution Commands

**Files:**
- Create: `scripts/run-by-id.mjs`
- Create: `scripts/run-by-id.test.mjs`
- Modify: `package.json`
- Modify: `.agents/skills/run-testcases/SKILL.md`

**Interfaces:**
- Produces: `buildPlaywrightArgs(testId: string): string[]`.
- Produces: `npm run test:api`, `test:ui`, `test:integration`, `test:e2e`, and `test:id -- HC-T123`.

- [ ] **Step 1: Write failing Test-ID command tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPlaywrightArgs } from './run-by-id.mjs';

test('builds an exact HC-T grep', () => {
  assert.deepEqual(buildPlaywrightArgs('HC-T123'), [
    'playwright',
    'test',
    '--grep',
    '^HC-T123 \\|',
  ]);
});

test('rejects an invalid Test ID', () => {
  assert.throws(() => buildPlaywrightArgs('LOGIN-123'), /must match HC-T[0-9]+/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test scripts/run-by-id.test.mjs`

Expected: FAIL because `run-by-id.mjs` does not exist.

- [ ] **Step 3: Implement the cross-platform runner**

```js
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function buildPlaywrightArgs(testId) {
  if (!/^HC-T\d+$/.test(testId)) {
    throw new Error(`Test ID must match HC-T[0-9]+: ${testId}`);
  }
  return ['playwright', 'test', '--grep', `^${testId} \\|`];
}

function main() {
  const [testId] = process.argv.slice(2);
  const args = buildPlaywrightArgs(testId);
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(command, args, { stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
```

- [ ] **Step 4: Add layer commands**

Add:

```json
"test:api": "playwright test tests/api",
"test:ui": "playwright test tests/ui",
"test:integration": "playwright test tests/integration",
"test:e2e": "playwright test tests/end-to-end",
"test:id": "node scripts/run-by-id.mjs"
```

- [ ] **Step 5: Verify GREEN**

Run:

```bash
node --test scripts/run-by-id.test.mjs
npm run test:list
```

Expected: runner unit tests pass; Playwright discovery succeeds and lists zero production tests until real Zephyr keys are requested.

- [ ] **Step 6: Commit**

```bash
git add scripts/run-by-id.mjs scripts/run-by-id.test.mjs package.json .agents/skills/run-testcases/SKILL.md
git commit -m "feat: run Playwright by layer and Zephyr key"
```

### Task 7: Update Verification, Windows Guide, and Downloadable ZIP

**Files:**
- Modify: `README.md`
- Modify: `package.json`
- Replace: `testing-pom.zip`

**Interfaces:**
- Produces: one Windows guide for requirement analysis, Zephyr review, explicit automation generation, API/UI/integration/E2E execution, and reports.
- Produces: a ZIP without `.env`, Git history, dependencies, reports, or an obsolete Git testcase collection.

- [ ] **Step 1: Replace the verification command**

Set:

```json
"verify": "npm run check:config && npm run check:skills && npm run check:mapping && npm run test:unit && npm run typecheck && npm run test:list"
```

Remove the obsolete `check:testcases` command and all references to `scripts/validate-testcases.mjs`; delete that script after no command or skill uses it.

- [ ] **Step 2: Document the exact human workflow**

README must show:

```text
analyze requirement
→ generate proposed cases in chat
→ first human review
→ explicit Zephyr update
→ cross-review in Zephyr
→ manual review-complete notification
→ explicit "create scripts for HC-Txxx"
→ generate Playwright TypeScript plus matching JSON
→ verify, execute, report, and review automation in GitLab
```

State that Zephyr owns official testcases, GitLab owns only automation, and no script is generated merely because a testcase was created or edited.

- [ ] **Step 3: Document the path and data mapping**

Include this exact example:

```text
tests/integration/authentication/login.spec.ts
tests/test-data/integration/authentication/login.testdata.json

Zephyr testcase:       HC-T123
Playwright test title: HC-T123 | Login successfully
JSON key:              HC-T123
Report result:         HC-T123
```

Explain that ordinary data changes happen only in JSON, locators remain in Page Objects, reusable API behavior remains in API clients, and credentials remain in `.env`.

- [ ] **Step 4: Document Windows setup and commands**

Include:

```powershell
$env:TESTING_REPOSITORY_URL = "https://gitlab.com/example-group/testing.git"
git clone $env:TESTING_REPOSITORY_URL testing
cd testing
npm install
npx playwright install chromium
Copy-Item .env.example .env
npm run verify

npm run test:api
npm run test:ui
npm run test:integration
npm run test:e2e
npm run test:id -- HC-T123
npm run summarize
npm run report
```

Tell the user to edit `.env` locally and never commit it.

- [ ] **Step 5: Run complete non-browser verification**

Run:

```bash
npm run verify
git check-ignore .env
git ls-files .env
rg -n "VnExpress|VNE-HOME|testcases/generated|TC_DRAFT|TC_APPROVED" . --glob '!docs/superpowers/**'
git diff --check
```

Expected: verification exits zero, `.env` is ignored and untracked, the repository contains no obsolete VnExpress/testcase-state contract outside historical design documents, and `git diff --check` is clean.

- [ ] **Step 6: Package and inspect the ZIP**

Commit documentation first so `git archive` includes it:

```bash
git add README.md package.json package-lock.json scripts/validate-testcases.mjs
git commit -m "docs: explain Zephyr-driven automation workflow"
git archive --format=zip --output=../testing-pom.zip HEAD
unzip -t ../testing-pom.zip
unzip -l ../testing-pom.zip
```

Confirm that the archive contains four project skills, layered Playwright configuration, mapping validation, environment template, Windows guide, and report tooling. Confirm it excludes `.env`, `node_modules`, reports, `.git`, and the deleted `testcases/` directory.

- [ ] **Step 7: Final human gate after foundation delivery**

Present the completed framework and stop. The next allowed workflow is:

1. use `analyze-requirement` on a real requirement;
2. use `generate-testcases` to present cases in chat;
3. wait for human review and explicit Zephyr publication;
4. wait for cross-review completion;
5. accept a separate explicit request such as `Create scripts for HC-T123`.

Do not add a sample business spec with a synthetic `HC-Txxx` key merely to make Playwright discovery non-empty.
