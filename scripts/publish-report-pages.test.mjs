import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  assertReportReady,
  buildPagesUrl,
  parseGitHubRemote,
  publishReport,
  resolveGitAuthorEnv,
  resolvePublishOptions,
} from './publish-report-pages.mjs';

test('parses HTTPS and SSH GitHub remotes', () => {
  assert.deepEqual(parseGitHubRemote('https://github.com/acme/shop-tests.git'), {
    owner: 'acme',
    repo: 'shop-tests',
  });
  assert.deepEqual(parseGitHubRemote('git@github.com:acme/shop-tests.git'), {
    owner: 'acme',
    repo: 'shop-tests',
  });
});

test('rejects non-GitHub remotes when building a Pages URL', () => {
  assert.throws(
    () => parseGitHubRemote('https://gitlab.com/acme/shop-tests.git'),
    /GitHub remote/,
  );
});

test('builds the GitHub Pages URL for the generated report', () => {
  assert.equal(
    buildPagesUrl({ owner: 'acme', repo: 'shop-tests' }),
    'https://acme.github.io/shop-tests/',
  );
});

test('allows an explicit public URL override', () => {
  assert.equal(
    buildPagesUrl(
      { owner: 'acme', repo: 'shop-tests' },
      { REPORT_PUBLIC_URL: 'https://qa.example.com/report' },
    ),
    'https://qa.example.com/report/',
  );
});

test('uses a non-persistent Git identity for report commits', () => {
  assert.deepEqual(resolveGitAuthorEnv({}), {
    GIT_AUTHOR_NAME: 'AI Testing Demo',
    GIT_AUTHOR_EMAIL: 'ai-testing-demo@example.local',
    GIT_COMMITTER_NAME: 'AI Testing Demo',
    GIT_COMMITTER_EMAIL: 'ai-testing-demo@example.local',
  });
});

test('allows overriding the report commit identity through env', () => {
  assert.deepEqual(
    resolveGitAuthorEnv({
      REPORT_GIT_AUTHOR_NAME: 'QA Bot',
      REPORT_GIT_AUTHOR_EMAIL: 'qa@example.com',
    }),
    {
      GIT_AUTHOR_NAME: 'QA Bot',
      GIT_AUTHOR_EMAIL: 'qa@example.com',
      GIT_COMMITTER_NAME: 'QA Bot',
      GIT_COMMITTER_EMAIL: 'qa@example.com',
    },
  );
});

test('resolves default publish options', () => {
  assert.deepEqual(resolvePublishOptions([], {}), {
    branch: 'gh-pages',
    reportDir: path.normalize('reports/playwright-report'),
    summaryPath: path.normalize('reports/summary.json'),
    commitMessage: 'Publish Playwright report',
    dryRun: false,
  });
});

test('requires the generated HTML report and summary before publishing', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'publish-report-pages-'));
  const reportDir = path.join(root, 'reports/playwright-report');
  const summaryPath = path.join(root, 'reports/summary.json');
  await mkdir(reportDir, { recursive: true });
  await mkdir(path.dirname(summaryPath), { recursive: true });
  await writeFile(path.join(reportDir, 'index.html'), '<!doctype html>\n');
  await writeFile(summaryPath, '{}\n');

  await assert.doesNotReject(() => assertReportReady(reportDir, summaryPath));
  await assert.rejects(
    () => assertReportReady(path.join(root, 'missing'), summaryPath),
    /Run Playwright and npm run summarize before publishing/,
  );
});

test('publishes generated report assets to a gh-pages worktree', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'publish-report-pages-'));
  const reportDir = path.join(root, 'reports/playwright-report');
  const summaryPath = path.join(root, 'reports/summary.json');
  await mkdir(reportDir, { recursive: true });
  await mkdir(path.dirname(summaryPath), { recursive: true });
  await writeFile(path.join(reportDir, 'index.html'), '<!doctype html>\n');
  await writeFile(summaryPath, '{"total":1}\n');

  const calls = [];
  let commitEnv;
  const result = await publishReport(
    resolvePublishOptions([
      '--branch',
      'gh-pages',
      '--report-dir',
      reportDir,
      '--summary',
      summaryPath,
    ]),
    {
      makeTempDir: async (prefix) => {
        const tempRoot = await mkdtemp(prefix);
        await mkdir(path.join(tempRoot, 'site'), { recursive: true });
        return tempRoot;
      },
      gitSucceeds: async (args) => {
        calls.push(args);
        return args[0] === 'rm' || args[0] === 'worktree';
      },
      runGit: async (args, options = {}) => {
        calls.push(args);
        if (args[0] === 'commit') {
          commitEnv = options.env;
        }
        if (args.join(' ') === 'config --get remote.origin.url') {
          return 'https://github.com/acme/shop-tests.git';
        }
        if (args.join(' ') === 'status --porcelain') {
          return 'A index.html';
        }
        return '';
      },
    },
  );

  assert.deepEqual(result, {
    branch: 'gh-pages',
    changed: true,
    publicUrl: 'https://acme.github.io/shop-tests/',
    skippedPush: false,
  });
  assert.ok(calls.some((args) => args.join(' ') === 'push origin gh-pages'));
  assert.equal(commitEnv?.GIT_AUTHOR_NAME, 'AI Testing Demo');
});
