---
name: generate-automation
description: Use when a human explicitly requests Playwright TypeScript scripts for reviewed testcase keys from Zephyr or the configured Local Demo CSV.
---

# Generate Automation

## Goal

Generate discoverable Playwright TypeScript only from the latest reviewed testcase in the configured source and keep all testcase-specific data in the matching JSON file.

## Required Gate

Read `project/project.yaml` and apply the gate for its testcase source.

For Zephyr, require both statements from the human:

1. cross-review in Zephyr is complete;
2. create scripts for named finalized Zephyr Keys matching the configured Zephyr pattern.

Publishing or editing a testcase does not satisfy this gate. Always reread every requested `HC-Txxx` testcase from Zephyr immediately before generation. Stop if Zephyr is unavailable, a key is missing, Test Layer is `Manual`, or a step is ambiguous.

For Local Demo, require explicit human approval of the proposals and named keys matching `HC-[0-9]{3,}`. Reread each requested key from the reviewed CSV under `testcases/` immediately before generation. Stop if a key is absent, duplicated, marked with a source other than `Local Demo`, has Test Layer `Manual`, or contains an ambiguous step.

## Layer Selection

Write automation according to Test Layer:

| Test Layer | Spec location |
|---|---|
| API | `tests/api/<feature>/*.spec.ts` |
| UI | `tests/ui/<feature>/*.spec.ts` |
| API + UI | `tests/integration/<feature>/*.spec.ts` |
| End-to-End | `tests/end-to-end/<flow>/*.spec.ts` |

Put reusable request behavior in `tests/api-clients`, UI locators/actions in `tests/pages`, and shared construction in `tests/fixtures`.

## Data Contract

Create exactly one `*.json` for each `*.spec.ts`. Place it in the same directory as the spec and use the same basename.

Use every testcase key consistently. For example in Local Demo:

```text
CSV:       HC-001
Spec:      HC-001 | Login successfully
JSON key:  HC-001
Report:    HC-001
```

Load API payloads, UI inputs, and expected values through the matching key, such as `testData['HC-001']`. Do not hardcode testcase-specific values in the test callback. Store only credential profile names in JSON; load real values from `.env` through `tests/config/environment.ts`.

## API and Browser Workflow

- For API, use Playwright's request context and reusable clients.
- For API + UI, execute and verify API preparation before opening the UI; clean up by API when the testcase requires it.
- For UI and End-to-End, open the real configured site before writing locators, log in when required, and follow finalized steps in order.
- Select locators by `getByTestId` → `getByRole` → `getByLabel` → `getByPlaceholder` → stable CSS.
- Verify every locator against the rendered state and keep it in a Page Object. Never guess or place raw selectors in specs.

## Verification

Run:

```bash
npm run check:mapping
npm run typecheck
npm run test:list
```

Confirm every requested key appears in discovery and its matching JSON. Report a blocker rather than creating skipped, placeholder, or false-pass tests.
