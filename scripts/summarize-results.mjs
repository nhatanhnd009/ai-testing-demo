import 'dotenv/config';

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

function collectSpecs(suites) {
  return suites.flatMap((suite) => [
    ...(suite.specs ?? []),
    ...collectSpecs(suite.suites ?? []),
  ]);
}

export function summarizePlaywrightReport(report) {
  if (!Array.isArray(report.suites)) {
    throw new Error('Playwright report does not contain a suites array');
  }

  const counts = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    failedTestIds: [],
    testcases: [],
  };

  for (const spec of collectSpecs(report.suites)) {
    const match = spec.title?.match(/^(HC-\d{3,})\s*\|\s*(.+)$/);
    if (!match) {
      throw new Error(`Playwright result is missing Local Demo Test ID: ${spec.title}`);
    }
    const [, testId, title] = match;

    for (const test of spec.tests ?? []) {
      counts.total += 1;
      const rawStatus = test.results?.at(-1)?.status ?? 'skipped';
      const status =
        rawStatus === 'passed'
          ? 'passed'
          : rawStatus === 'skipped'
            ? 'skipped'
            : 'failed';

      if (status === 'passed') {
        counts.passed += 1;
      } else if (status === 'skipped') {
        counts.skipped += 1;
      } else {
        counts.failed += 1;
        if (!counts.failedTestIds.includes(testId)) {
          counts.failedTestIds.push(testId);
        }
      }

      counts.testcases.push({ testId, title, status });
    }
  }

  return counts;
}

export function resolveReportTarget(env = process.env) {
  return env.BASE_URL ?? env.API_BASE_URL ?? 'not-configured';
}

async function main() {
  const reportPath = process.argv[2] ?? 'reports/results.json';
  const outputPath = process.argv[3] ?? 'reports/summary.json';
  const raw = await readFile(reportPath, 'utf8');
  const counts = summarizePlaywrightReport(JSON.parse(raw));
  const summary = {
    project: 'testing',
    target: resolveReportTarget(),
    ...counts,
    generatedAt: new Date().toISOString(),
  };

  await mkdir('reports', { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`Summary written to ${outputPath}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
