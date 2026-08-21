# Testing Agent Rules

## Required Workflow

Follow this order:

1. Analyze the requirement with `analyze-requirement`.
2. Resolve every blocking Unclear Point.
3. Use `generate-testcases` to present complete proposals in chat.
4. Wait for first human review.
5. Follow the configured testcase source:
   - `zephyr`: publish or update Zephyr only on explicit human instruction, then wait for cross-review confirmation.
   - `local-demo`: after explicit human approval, assign sequential local keys and save the reviewed cases under `testcases/` as CSV.
6. Generate automation only when a human explicitly names reviewed keys from the configured testcase source.
7. For Zephyr, reread the finalized cases after cross-review. For Local Demo, reread the reviewed CSV.
8. Use `HC-001`, `HC-002`, ... for Local Demo keys. Continue naturally with `HC-1000` after `HC-999`.
9. Run verification, execute selected automation, and summarize results.

Do not publish to Zephyr without an explicit human instruction. Local Demo CSV files are review artifacts, not Zephyr testcase records. Do not generate scripts after publication or review automatically.

## Zephyr Testcase Contract

Every official testcase is stored in Zephyr and includes:

- Zephyr Key in `HC-T\d+` format;
- Feature and Title;
- Preconditions;
- Test Layer: `API`, `UI`, `API + UI`, `End-to-End`, or `Manual`;
- numbered Steps;
- one Action, Test Data, and Expected Result per step.

Feature cases belong under `Features`. Release full flows belong under `End-to-End/Release Full Flows`.

## Local Demo Testcase Contract

When `project.testcase_source` is `local-demo`:

- store reviewed testcase rows under `testcases/` as CSV;
- use unique keys matching `HC-[0-9]{3,}`;
- mark every row with `Source` equal to `Local Demo`;
- preserve Feature, Title, Preconditions, Test Layer, numbered Step, Action, Test Data, and Expected Result;
- treat the CSV as the automation source until Zephyr is enabled;
- do not represent Local Demo keys as Zephyr-assigned keys.

## Automation Contract

- Use Playwright Test with TypeScript.
- Put API specs in `tests/api`, UI specs in `tests/ui`, API-to-UI specs in `tests/integration`, and release flows in `tests/end-to-end`.
- Put reusable API behavior in `tests/api-clients`.
- Put UI locators and actions in `tests/pages` and construct Page Objects in `tests/fixtures`.
- Start every Playwright title with its finalized key from the configured testcase source.
- Every spec requires one matching JSON data file in the same directory, with the same basename and `.json` extension.
- Map the same testcase key in the testcase source, spec title, JSON key, and report.
- Keep testcase-specific payloads, inputs, and expected values in JSON.
- Keep real credentials and tokens in `.env`; never put them in JSON or Git.
- For `API + UI`, verify API preparation before opening and asserting the UI.
- Do not create skipped or placeholder automation for Manual cases.

## Locator Contract

Inspect the live rendered UI before generating locators. Use `getByTestId` → `getByRole` → `getByLabel` → `getByPlaceholder` → stable CSS. Keep raw selectors out of specs and report a blocker instead of guessing.

## Verification

Run `npm run verify` after generation. Run the selected layer or Test ID, then run `npm run summarize` even when Playwright reports failed cases.
