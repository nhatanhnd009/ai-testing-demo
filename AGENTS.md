# Testing Agent Rules

## Required Workflow

Follow this order:

1. Analyze the requirement with `analyze-requirement`.
2. Resolve every blocking Unclear Point.
3. Use `generate-testcases` to present complete proposals in chat.
4. Wait for first human review.
5. Publish or update Zephyr only on explicit human instruction.
6. Let another tester review and edit directly in Zephyr.
7. Wait for manual confirmation that cross-review is complete.
8. Generate automation only when a human explicitly names finalized `HC-Txxx` keys.
9. Run verification, execute selected automation, and summarize results.

Do not create an official testcase file in Git. Do not publish to Zephyr without an explicit human instruction. Do not generate scripts after publication or review automatically.

## Zephyr Testcase Contract

Every official testcase is stored in Zephyr and includes:

- Zephyr Key in `HC-T\d+` format;
- Feature and Title;
- Preconditions;
- Test Layer: `API`, `UI`, `API + UI`, `End-to-End`, or `Manual`;
- numbered Steps;
- one Action, Test Data, and Expected Result per step.

Feature cases belong under `Features`. Release full flows belong under `End-to-End/Release Full Flows`.

## Automation Contract

- Use Playwright Test with TypeScript.
- Put API specs in `tests/api`, UI specs in `tests/ui`, API-to-UI specs in `tests/integration`, and release flows in `tests/end-to-end`.
- Put reusable API behavior in `tests/api-clients`.
- Put UI locators and actions in `tests/pages` and construct Page Objects in `tests/fixtures`.
- Start every Playwright title with its finalized Zephyr Key.
- Every spec requires one matching JSON data file under `tests/test-data` with the same layer, feature path, and basename.
- Map the same `HC-Txxx` in Zephyr, the spec title, JSON key, and report.
- Keep testcase-specific payloads, inputs, and expected values in JSON.
- Keep real credentials and tokens in `.env`; never put them in JSON or Git.
- For `API + UI`, verify API preparation before opening and asserting the UI.
- Do not create skipped or placeholder automation for Manual cases.

## Locator Contract

Inspect the live rendered UI before generating locators. Use `getByTestId` → `getByRole` → `getByLabel` → `getByPlaceholder` → stable CSS. Keep raw selectors out of specs and report a blocker instead of guessing.

## Verification

Run `npm run verify` after generation. Run the selected layer or Test ID, then run `npm run summarize` even when Playwright reports failed cases.
