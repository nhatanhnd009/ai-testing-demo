# Testing POM Design

## Goal

Create a small AI-assisted tester project named `testing` that can analyze a local or linked requirement, generate reviewable test cases, generate Playwright automation using Page Object Model, run automated cases, and save Pass/Fail reports.

## Scope

The first version contains three repository skills:

1. `analyze-requirement`: convert a BRD, Jira ticket, Confluence page, or local requirement into a concise analysis.
2. `generate-testcases`: create Markdown test cases and Playwright POM code for cases marked `Automation`.
3. `run-testcases`: execute Playwright and summarize results.

Jira and Confluence writeback, Zephyr, CI/CD, test strategy, complex test data management, and multi-project orchestration are outside this version.

## Architecture

- `requirements/` stores source requirements and analyzed outputs.
- `testcases/generated/` stores human-readable generated test cases.
- `tests/pages/` stores locators and reusable page actions.
- `tests/fixtures/` constructs Page Objects.
- `tests/specs/` stores test flow and assertions.
- `reports/` stores Playwright HTML/JSON output and a small summary.
- `.agents/skills/` stores project-specific workflows that travel with the repository.

## Test Case Contract

Every generated test case must contain:

- Test Case ID
- Title
- Preconditions
- Execution Type: `Automation` or `Manual`
- one or more numbered steps
- Action and Expected Result for every step
- Test Data when the step needs input

Markdown is the source format in version one. Test code is not stored in `testcases/`.

## Page Object Model Rules

- Put locators and reusable page actions in `tests/pages/`.
- Put Page Object construction in `tests/fixtures/`.
- Put scenarios and assertions in `tests/specs/`.
- Do not duplicate selectors in spec files.
- Include the Test Case ID at the start of each Playwright test title.
- Do not create Playwright placeholders for Manual cases.

## Demo

The demo target is `https://vnexpress.net/`. The source requirement asks the project to verify that the homepage opens and exposes core navigation. The generated test cases include automated and manual examples; only automated cases are represented in Playwright.

## Verification

The project is accepted when:

1. The repository skills pass structural validation.
2. TypeScript compiles without errors.
3. Playwright can discover the VnExpress spec.
4. The demo test run writes JSON and HTML reports; external-site failures are reported rather than hidden.
5. README contains Windows installation, GitLab repository, execution, and report-opening instructions.
