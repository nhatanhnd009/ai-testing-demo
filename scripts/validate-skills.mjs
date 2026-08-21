import { access, readFile } from 'node:fs/promises';

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
    'HC-001',
    'Never create automation',
  ],
  'generate-automation': [
    'configured source',
    'reread',
    'HC-001',
    '*.spec.ts',
    '*.json',
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
    'HC-001',
  ],
};

const requested = process.argv[2];
const skillNames = requested ? [requested] : Object.keys(contracts);

for (const skillName of skillNames) {
  if (!(skillName in contracts)) {
    throw new Error(`Unknown skill: ${skillName}`);
  }

  const path = `.agents/skills/${skillName}/SKILL.md`;
  await access(path);
  const content = await readFile(path, 'utf8');
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatter) {
    throw new Error(`${path}: missing YAML frontmatter`);
  }

  if (!frontmatter[1].includes(`name: ${skillName}`)) {
    throw new Error(`${path}: name must be ${skillName}`);
  }

  if (!/description:\s*Use when/.test(frontmatter[1])) {
    throw new Error(`${path}: description must start with "Use when"`);
  }

  for (const requiredText of contracts[skillName]) {
    if (!content.includes(requiredText)) {
      throw new Error(`${path}: missing contract text "${requiredText}"`);
    }
  }
}

console.log(`Validated ${skillNames.length} project skill(s).`);
