import { access, readFile } from 'node:fs/promises';

const requiredFiles = [
  'package.json',
  'tsconfig.json',
  'playwright.config.ts',
  'project/project.yaml',
  'project/requirement-sources.yaml',
  'project/zephyr.yaml',
];

for (const file of requiredFiles) {
  await access(file);
}

const config = await readFile('playwright.config.ts', 'utf8');
for (const requiredText of [
  "testDir: './tests'",
  "'api/**/*.spec.ts'",
  "'ui/**/*.spec.ts'",
  "'integration/**/*.spec.ts'",
  "'end-to-end/**/*.spec.ts'",
  "testIdAttribute: 'data-test'",
  "outputFile: 'reports/results.json'",
  "outputFolder: 'reports/playwright-report'",
]) {
  if (!config.includes(requiredText)) {
    throw new Error(`Missing Playwright configuration: ${requiredText}`);
  }
}

const projectConfig = await readFile('project/project.yaml', 'utf8');
if (!projectConfig.includes('testcase_source: local-demo')) {
  throw new Error('project/project.yaml must declare testcase_source: local-demo');
}
if (!projectConfig.includes('test_id_pattern: "^HC-[0-9]{3,}$"')) {
  throw new Error('project/project.yaml must declare the Local Demo key pattern');
}
await access('testcases');

console.log('Configuration contract is valid.');
