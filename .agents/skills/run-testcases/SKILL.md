---
name: run-testcases
description: Use when Playwright API, UI, integration, end-to-end, or selected testcase scripts must execute with reviewable Pass, Fail, or Skipped evidence.
---

# Run Testcases

## Goal

Run selected Playwright automation, preserve evidence, and map every result to its key from the configured testcase source.

## Preconditions

Run `npm run verify`. Confirm required `.env` values exist for the selected layer and Chromium is installed for browser tests. Stop on a missing browser, API, URL, credential, JSON mapping, or testcase key instead of claiming execution occurred.

## Select Scope

```bash
npm run test:api
npm run test:ui
npm run test:integration
npm run test:e2e
npm run test:id -- HC-001
```

Use `npm test` only when all automation layers are intended. Do not execute Manual cases through Playwright. The E2E command runs only `tests/end-to-end/` for release full flows.

## Save Results

Playwright writes:

- `reports/results.json` for machine-readable results;
- `reports/playwright-report/` for HTML;
- `reports/test-results/` for screenshots, videos, and traces.

Then run:

```bash
npm run summarize
```

Use the same configured testcase key, such as Local Demo `HC-001`, in the Playwright title, JSON test data, failed Test ID list, and summary testcase result.

## Result Rules

- Report Pass only when Playwright reports `passed`.
- Report Fail for assertions, API setup, login, locator, environment, timeout, and cleanup failures.
- Report Skipped only when Playwright reports `skipped`.
- Never convert a blocker to Pass.
- Include failed testcase keys and evidence paths in the final response.
