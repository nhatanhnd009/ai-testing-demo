import path from 'node:path';
import { readdir, readFile } from 'node:fs/promises';

import ts from 'typescript';

const LAYERS = ['api', 'ui', 'integration', 'end-to-end'];
const TEST_TITLE = /^(HC-T\d+)\s+\|\s+.+$/;
const ANY_TEST_TITLE = /\btest\s*\(\s*(['"])([^'"]+)\1/g;

export function deriveTestDataPath(specPath) {
  const normalized = path.normalize(specPath).replaceAll('\\', '/');
  const layerPattern = LAYERS.join('|');
  const match = normalized.match(
    new RegExp(`^(.*?tests)/(${layerPattern})/(.+)\\.spec\\.ts$`),
  );
  if (!match) {
    throw new Error(`Spec path must be under a supported test layer: ${specPath}`);
  }

  const [, testsRoot, layer, relativePath] = match;
  return `${testsRoot}/test-data/${layer}/${relativePath}.testdata.json`;
}

export function extractZephyrIds(source) {
  const titles = [...source.matchAll(ANY_TEST_TITLE)].map((match) => match[2]);
  if (titles.length === 0) {
    throw new Error('Spec must contain at least one test() title');
  }

  const ids = titles.map((title) => {
    const match = title.match(TEST_TITLE);
    if (!match) {
      throw new Error(`Playwright title must start with HC-T123 | format: ${title}`);
    }
    return match[1];
  });

  if (new Set(ids).size !== ids.length) {
    throw new Error('A Zephyr Test ID may appear only once in a spec');
  }
  return ids;
}

function assertNoTestcaseLiterals(source, specPath) {
  const sourceFile = ts.createSourceFile(
    specPath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  function inspectCallbackLiteral(node) {
    if (ts.isStringLiteral(node)) {
      const parent = node.parent;
      const isTestDataKey =
        ts.isElementAccessExpression(parent) &&
        parent.argumentExpression === node &&
        ts.isIdentifier(parent.expression) &&
        parent.expression.text === 'testData' &&
        /^HC-T\d+$/.test(node.text);
      const isStepLabel =
        ts.isCallExpression(parent) &&
        parent.arguments[0] === node &&
        ts.isPropertyAccessExpression(parent.expression) &&
        ts.isIdentifier(parent.expression.expression) &&
        parent.expression.expression.text === 'test' &&
        parent.expression.name.text === 'step';

      if (!isTestDataKey && !isStepLabel) {
        throw new Error(
          `${specPath}: Move testcase-specific literal to JSON: ${node.getText(sourceFile)}`,
        );
      }
    } else if (
      ts.isNumericLiteral(node) ||
      node.kind === ts.SyntaxKind.TrueKeyword ||
      node.kind === ts.SyntaxKind.FalseKeyword
    ) {
      throw new Error(
        `${specPath}: Move testcase-specific literal to JSON: ${node.getText(sourceFile)}`,
      );
    }
    node.forEachChild(inspectCallbackLiteral);
  }

  function findTests(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'test'
    ) {
      const callback = node.arguments[1];
      if (callback && (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))) {
        callback.forEachChild(inspectCallbackLiteral);
      }
    }
    node.forEachChild(findTests);
  }

  findTests(sourceFile);
}

export async function validateSpecDataPair(
  specPath,
  dataPath,
  seenIds = new Set(),
) {
  const expectedDataPath = deriveTestDataPath(specPath);
  if (path.resolve(dataPath) !== path.resolve(expectedDataPath)) {
    throw new Error(`${specPath}: Test-data path must be ${expectedDataPath}`);
  }

  const source = await readFile(specPath, 'utf8');
  let rawData;
  try {
    rawData = await readFile(dataPath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error(`${specPath}: Matching test-data file is missing: ${dataPath}`);
    }
    throw error;
  }

  const importMatch = source.match(
    /import\s+testData\s+from\s+(['"])([^'"]+\.testdata\.json)\1\s*;/,
  );
  const resolvedImport = importMatch
    ? path.resolve(path.dirname(specPath), importMatch[2])
    : undefined;
  if (resolvedImport !== path.resolve(dataPath)) {
    throw new Error(`${specPath}: Spec must import its matching test-data file`);
  }

  const ids = extractZephyrIds(source);
  const data = JSON.parse(rawData);
  if (!data || Array.isArray(data) || typeof data !== 'object') {
    throw new Error(`${dataPath}: Test data must be a JSON object`);
  }

  for (const id of ids) {
    if (!(id in data)) {
      throw new Error(`${dataPath}: ${id} is missing from test data`);
    }
    const dataAccess = new RegExp(`testData\\[['"]${id}['"]\\]`);
    if (!dataAccess.test(source)) {
      throw new Error(`${specPath}: ${id} must read testData['${id}']`);
    }
    if (seenIds.has(id)) {
      throw new Error(`${specPath}: ${id} is duplicated across spec files`);
    }
  }

  for (const id of Object.keys(data)) {
    if (!/^HC-T\d+$/.test(id)) {
      throw new Error(`${dataPath}: Invalid Zephyr Test ID: ${id}`);
    }
    if (!ids.includes(id)) {
      throw new Error(`${dataPath}: ${id} has no matching test in the spec`);
    }
  }

  assertNoTestcaseLiterals(source, specPath);
  for (const id of ids) seenIds.add(id);
  return ids;
}

async function findSpecs(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }

  const specs = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      specs.push(...(await findSpecs(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith('.spec.ts')) {
      specs.push(entryPath);
    }
  }
  return specs;
}

export async function validateAutomationTree(testsRoot = 'tests') {
  const seenIds = new Set();
  let specCount = 0;
  let testcaseCount = 0;

  for (const layer of LAYERS) {
    const specs = await findSpecs(path.join(testsRoot, layer));
    for (const specPath of specs) {
      const ids = await validateSpecDataPair(
        specPath,
        deriveTestDataPath(specPath),
        seenIds,
      );
      specCount += 1;
      testcaseCount += ids.length;
    }
  }

  return { specs: specCount, testcases: testcaseCount };
}
