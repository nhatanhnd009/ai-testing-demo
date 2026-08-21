import { execFile } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

function ensureTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`;
}

export function parseGitHubRemote(remoteUrl) {
  const trimmed = remoteUrl.trim();
  const match =
    trimmed.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/) ??
    trimmed.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/);

  if (!match) {
    throw new Error('remote.origin.url must be a GitHub remote to build a Pages URL');
  }

  return { owner: match[1], repo: match[2] };
}

export function buildPagesUrl(repository, env = process.env) {
  if (env.REPORT_PUBLIC_URL) {
    return ensureTrailingSlash(env.REPORT_PUBLIC_URL);
  }

  return `https://${repository.owner}.github.io/${repository.repo}/`;
}

export function resolvePublishOptions(argv = process.argv.slice(2), env = process.env) {
  const options = {
    branch: env.REPORT_PAGES_BRANCH ?? 'gh-pages',
    reportDir: path.normalize(env.REPORT_DIR ?? 'reports/playwright-report'),
    resultsPath: path.normalize(env.REPORT_RESULTS ?? 'reports/results.json'),
    summaryPath: path.normalize(env.REPORT_SUMMARY ?? 'reports/summary.json'),
    commitMessage: env.REPORT_COMMIT_MESSAGE ?? 'Publish Playwright report',
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--branch' && next) {
      options.branch = next;
      index += 1;
    } else if (arg === '--report-dir' && next) {
      options.reportDir = path.normalize(next);
      index += 1;
    } else if (arg === '--results' && next) {
      options.resultsPath = path.normalize(next);
      index += 1;
    } else if (arg === '--summary' && next) {
      options.summaryPath = path.normalize(next);
      index += 1;
    } else if (arg === '--message' && next) {
      options.commitMessage = next;
      index += 1;
    } else {
      throw new Error(`Unknown or incomplete argument: ${arg}`);
    }
  }

  return options;
}

export function resolveGitAuthorEnv(env = process.env) {
  const name =
    env.REPORT_GIT_AUTHOR_NAME ??
    env.GIT_AUTHOR_NAME ??
    env.GIT_COMMITTER_NAME ??
    'AI Testing Demo';
  const email =
    env.REPORT_GIT_AUTHOR_EMAIL ??
    env.GIT_AUTHOR_EMAIL ??
    env.GIT_COMMITTER_EMAIL ??
    'ai-testing-demo@example.local';

  return {
    GIT_AUTHOR_NAME: name,
    GIT_AUTHOR_EMAIL: email,
    GIT_COMMITTER_NAME: name,
    GIT_COMMITTER_EMAIL: email,
  };
}

export async function assertReportReady(reportDir, summaryPath, resultsPath) {
  try {
    await readFile(path.join(reportDir, 'index.html'), 'utf8');
    await readFile(summaryPath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error('Run Playwright and npm run summarize before publishing the report');
    }
    throw error;
  }

  if (resultsPath) {
    const [resultsInfo, summaryInfo] = await Promise.all([
      stat(resultsPath),
      stat(summaryPath),
    ]);
    if (summaryInfo.mtimeMs < resultsInfo.mtimeMs) {
      throw new Error('reports/summary.json is older than reports/results.json; run npm run summarize before publishing');
    }
  }
}

async function runGit(args, options = {}) {
  const result = await execFileAsync('git', args, {
    cwd: options.cwd,
    encoding: 'utf8',
    env: options.env ? { ...process.env, ...options.env } : process.env,
  });
  return result.stdout.trim();
}

async function gitSucceeds(args, options = {}) {
  try {
    await runGit(args, options);
    return true;
  } catch {
    return false;
  }
}

async function emptyDirectory(directory) {
  const resolvedDirectory = path.resolve(directory);
  const resolvedTemp = path.resolve(tmpdir());

  if (!resolvedDirectory.startsWith(`${resolvedTemp}${path.sep}`)) {
    throw new Error(`Refusing to empty a directory outside the temp folder: ${directory}`);
  }

  const entries = await readdir(directory, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.name !== '.git')
      .map((entry) =>
        rm(path.join(directory, entry.name), { recursive: true, force: true }),
      ),
  );
}

async function prepareWorktree(worktreePath, branch, dependencies = {}) {
  const run = dependencies.runGit ?? runGit;
  const succeeds = dependencies.gitSucceeds ?? gitSucceeds;
  const localBranchExists = await succeeds([
    'show-ref',
    '--verify',
    `refs/heads/${branch}`,
  ]);

  if (localBranchExists) {
    await run(['worktree', 'add', worktreePath, branch]);
    return;
  }

  const remoteBranchExists = await succeeds([
    'ls-remote',
    '--exit-code',
    '--heads',
    'origin',
    branch,
  ]);

  if (remoteBranchExists) {
    await run(['fetch', 'origin', `${branch}:${branch}`]);
    await run(['worktree', 'add', worktreePath, branch]);
    return;
  }

  await run(['worktree', 'add', '--detach', worktreePath, 'HEAD']);
  await run(['switch', '--orphan', branch], { cwd: worktreePath });
  await succeeds(['rm', '-r', '--ignore-unmatch', '.'], { cwd: worktreePath });
}

async function writeRedirectIndex(worktreePath) {
  await writeFile(
    path.join(worktreePath, 'index.html'),
    [
      '<!doctype html>',
      '<meta charset="utf-8">',
      '<meta http-equiv="refresh" content="0; url=playwright-report/">',
      '<title>Playwright Report</title>',
      '<a href="playwright-report/">Open Playwright report</a>',
      '',
    ].join('\n'),
  );
}

async function copyReportAssets({ reportDir, summaryPath, worktreePath }) {
  await emptyDirectory(worktreePath);
  await mkdir(path.join(worktreePath, 'playwright-report'), { recursive: true });
  await cp(reportDir, path.join(worktreePath, 'playwright-report'), {
    recursive: true,
    force: true,
  });
  await cp(summaryPath, path.join(worktreePath, 'summary.json'), { force: true });
  await writeFile(path.join(worktreePath, '.nojekyll'), '');
  await writeRedirectIndex(worktreePath);
}

export async function publishReport(options = resolvePublishOptions(), dependencies = {}) {
  const run = dependencies.runGit ?? runGit;
  const succeeds = dependencies.gitSucceeds ?? gitSucceeds;
  const makeTempDir = dependencies.makeTempDir ?? mkdtemp;
  const authorEnv = dependencies.authorEnv ?? resolveGitAuthorEnv();

  await assertReportReady(options.reportDir, options.summaryPath, options.resultsPath);
  const remoteUrl = await run(['config', '--get', 'remote.origin.url']);
  const repository = parseGitHubRemote(remoteUrl);
  const publicUrl = buildPagesUrl(repository);

  if (options.dryRun) {
    return {
      branch: options.branch,
      changed: false,
      publicUrl,
      skippedPush: true,
    };
  }

  const tempRoot = await makeTempDir(path.join(tmpdir(), 'playwright-report-pages-'));
  const worktreePath = path.join(tempRoot, 'site');

  try {
    await prepareWorktree(worktreePath, options.branch, { runGit: run, gitSucceeds: succeeds });
    await copyReportAssets({ ...options, worktreePath });
    await run(['add', '-A'], { cwd: worktreePath });
    const status = await run(['status', '--porcelain'], { cwd: worktreePath });
    const changed = status.length > 0;

    if (changed) {
      await run(['commit', '-m', options.commitMessage], {
        cwd: worktreePath,
        env: authorEnv,
      });
    }

    await run(['push', 'origin', options.branch], { cwd: worktreePath });
    return { branch: options.branch, changed, publicUrl, skippedPush: false };
  } finally {
    await succeeds(['worktree', 'remove', '--force', worktreePath]);
    await rm(tempRoot, { recursive: true, force: true });
  }
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    const result = await publishReport(resolvePublishOptions());
    if (result.skippedPush) {
      console.log(`Dry run OK. Report URL will be ${result.publicUrl}`);
    } else {
      console.log(`Report published to ${result.publicUrl}`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
