import path from 'node:path';
import { readdir, readFile } from 'node:fs/promises';

import ts from 'typescript';

const LAYERS = ['api', 'ui', 'integration', 'end-to-end'];
const TEST_TITLE = /^(HC-\d{3,})\s+\|\s+(.+)$/;
const ANY_TEST_TITLE = /\btest\s*\(\s*(['"])([^'"]+)\1/g;

function parseCsv(source) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && source[index + 1] === '\n') index += 1;
      row.push(field);
      field = '';
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
    } else {
      field += character;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (quoted) throw new Error('Local Demo CSV contains an unclosed quote');
  if (rows.length === 0) return [];

  const [headers, ...dataRows] = rows;
  return dataRows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])),
  );
}

function normalizeLayer(layer) {
  return layer.trim().toLowerCase().replaceAll(' ', '-');
}

export function validateLocalDemoMappings(automationDefinitions, csvRows) {
  const cases = new Map();
  for (const row of csvRows) {
    if (row.Source && row.Source !== 'Local Demo') continue;
    const id = row.TestcaseID || row['Testcase ID'];
    if (!/^HC-\d{3,}$/.test(id)) {
      throw new Error(`Invalid Local Demo testcase ID: ${id}`);
    }
    const definition = {
      layer: row['Test Layer'] ? normalizeLayer(row['Test Layer']) : undefined,
      title: row.Description || row.Title,
    };
    const existing = cases.get(id);
    if (
      existing &&
      ((existing.layer && definition.layer && existing.layer !== definition.layer) ||
        existing.title !== definition.title)
    ) {
      throw new Error(`${id} has inconsistent rows in the Local Demo CSV`);
    }
    cases.set(id, definition);
  }

  for (const automation of automationDefinitions) {
    const source = cases.get(automation.id);
    if (!source) {
      throw new Error(`${automation.id} is missing from the Local Demo CSV`);
    }
    if (source.title !== automation.title) {
      throw new Error(`${automation.id} title does not match the Local Demo CSV`);
    }
    if (source.layer && source.layer !== automation.layer) {
      throw new Error(`${automation.id} layer does not match the Local Demo CSV`);
    }
  }
}

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
  return `${testsRoot}/${layer}/${relativePath}.json`;
}

export function extractTestcaseIds(source) {
  const titles = [...source.matchAll(ANY_TEST_TITLE)].map((match) => match[2]);
  if (titles.length === 0) {
    throw new Error('Spec must contain at least one test() title');
  }

  const ids = titles.map((title) => {
    const match = title.match(TEST_TITLE);
    if (!match) {
      throw new Error(`Playwright title must start with HC-001 | format: ${title}`);
    }
    return match[1];
  });

  if (new Set(ids).size !== ids.length) {
    throw new Error('A testcase ID may appear only once in a spec');
  }
  return ids;
}

function extractTestcaseDefinitions(source, layer) {
  return [...source.matchAll(ANY_TEST_TITLE)].map((match) => {
    const titleMatch = match[2].match(TEST_TITLE);
    if (!titleMatch) {
      throw new Error(`Playwright title must start with HC-001 | format: ${match[2]}`);
    }
    return { id: titleMatch[1], layer, title: titleMatch[2] };
  });
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
        /^HC-\d{3,}$/.test(node.text);
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
    /import\s+testData\s+from\s+(['"])([^'"]+\.json)\1\s*;/,
  );
  const resolvedImport = importMatch
    ? path.resolve(path.dirname(specPath), importMatch[2])
    : undefined;
  if (resolvedImport !== path.resolve(dataPath)) {
    throw new Error(`${specPath}: Spec must import its matching test-data file`);
  }

  const ids = extractTestcaseIds(source);
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
    if (!/^HC-\d{3,}$/.test(id)) {
      throw new Error(`${dataPath}: Invalid testcase ID: ${id}`);
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

async function findCsvFiles(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await findCsvFiles(entryPath)));
    else if (entry.isFile() && entry.name.endsWith('.csv')) files.push(entryPath);
  }
  return files;
}

export async function validateAutomationTree(
  testsRoot = 'tests',
  testcaseRoot = 'testcases',
) {
  const seenIds = new Set();
  const automationDefinitions = [];
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
      const source = await readFile(specPath, 'utf8');
      automationDefinitions.push(...extractTestcaseDefinitions(source, layer));
      specCount += 1;
      testcaseCount += ids.length;
    }
  }

  const csvFiles = await findCsvFiles(testcaseRoot);
  const csvRows = (
    await Promise.all(csvFiles.map(async (csvPath) => parseCsv(await readFile(csvPath, 'utf8'))))
  ).flat();
  validateLocalDemoMappings(automationDefinitions, csvRows);

  return { specs: specCount, testcases: testcaseCount, ids: [...seenIds] };
}
