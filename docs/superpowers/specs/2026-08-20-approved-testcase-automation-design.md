# Zephyr-Driven API, UI, and E2E Automation Design

## Goal

Extend the `testing` project into a simple AI-assisted tester workflow using Playwright and TypeScript. AI analyzes requirements, proposes testcases for human review, publishes reviewed cases to Zephyr, and generates automation only when a human explicitly requests scripts for finalized Zephyr cases.

The solution supports API, UI, API-to-UI integration, manual, and release end-to-end coverage without storing a second official testcase repository in Git.

## Selected Architecture

Use Zephyr as the single source of truth for official testcases and GitLab as the source of truth for automation code.

```text
Requirement from Jira, Confluence, or local file
→ AI requirement analysis
→ AI presents proposed testcases in chat
→ Human performs first review
→ Human explicitly requests Zephyr update
→ AI creates or updates testcases in Zephyr
→ Another tester reviews and edits directly in Zephyr
→ Human manually confirms review completion
→ Human explicitly requests script generation by Zephyr Key
→ AI rereads the latest Zephyr testcase
→ AI generates Playwright TypeScript and matching JSON test data
→ Playwright execution and Pass/Fail report
→ Automation code review and merge in GitLab
```

There are no testcase status fields and no `draft`, `approved`, or `review` testcase folders in Git. A proposed testcase remains chat content until the first human review is complete. A Zephyr testcase becomes eligible for automation only after a human confirms that cross-review is complete and explicitly asks AI to create scripts.

## Technology

- Playwright Test for API and browser automation.
- TypeScript for Page Objects, API clients, fixtures, and specs.
- JSON for testcase-specific automation data.
- `.env` for secrets and environment-specific credentials.
- Zephyr for official testcase storage and review.
- GitLab for automation code review and version control.

No separate Postman or Newman runtime is required for automated API execution.

## Source of Truth

| Content | Source of truth |
|---|---|
| Requirement and acceptance criteria | Jira or Confluence |
| Requirement analysis used by the project | `requirements/analyzed/` |
| Official functional and E2E testcases | Zephyr |
| Playwright automation code | GitLab |
| Test-specific automation data | GitLab JSON test-data files |
| Credentials and secrets | Local or CI `.env`/secret configuration |
| Pass/Fail and automation evidence | Playwright reports and artifacts |

Do not maintain a second official testcase collection under a Git `testcases/` folder. If a testcase is exported from Zephyr for transfer or audit, its Testcase ID must remain the Zephyr Key.

## Zephyr Organization

Organize the Zephyr Test Repository by feature, with a separate end-to-end area:

```text
Test Repository
├── Features
│   ├── Authentication
│   ├── Product
│   └── Checkout
└── End-to-End
    └── Release Full Flows
```

Each official testcase contains:

- Testcase ID: the Zephyr Key in `HC-Txxx` format;
- Feature;
- Title;
- Preconditions;
- Test Layer;
- Steps;
- Test Data;
- Expected Result.

Allowed Test Layer values are:

```text
API
UI
API + UI
End-to-End
Manual
```

Testcase actions and expected results remain simple and complete. Testcases that cannot be automated remain in Zephyr with Test Layer `Manual`; do not create skipped or placeholder Playwright tests for them.

## Human Review and Publish Rules

1. AI presents proposed testcases in chat and does not write official testcase files or scripts.
2. The first human reviewer corrects the proposal in chat.
3. AI publishes to Zephyr only after an explicit human instruction.
4. Zephyr assigns the official key, such as `HC-T123`.
5. A second tester reviews and may edit the testcase directly in Zephyr.
6. Review completion is communicated manually; no testcase status or Git Merge Request is required.
7. Publishing or reviewing a testcase never triggers automation generation automatically.
8. AI generates automation only after a human names the finalized Zephyr Key and explicitly requests scripts.
9. Before generation, AI rereads the current Zephyr version so later reviewer edits are included.

GitLab Merge Requests apply only to automation code and configuration, not testcase review.

## Automation Layers

### API

Use Playwright's API request support. API specs call reusable clients under `tests/api-clients/`, validate status, response body, headers, and documented side effects, and obtain testcase-specific payloads and expected values from JSON.

### UI

Use browser fixtures and Page Object Model. Page Objects own locators and reusable actions. Specs own the Zephyr testcase flow and assertions but contain no raw selectors.

### API + UI Integration

Use one Playwright test when the finalized testcase requires an API step before UI verification:

```text
Load HC-Txxx data
→ call API to create or update precondition data
→ verify required API response
→ open the browser in the required state
→ perform or observe the UI flow
→ verify the expected UI result
→ clean up through API when required
```

Do not split a single finalized API-to-UI testcase into unrelated test results. A failure must show whether API setup, API verification, UI navigation, or UI assertion failed.

### End-to-End

End-to-end testcases live under Zephyr's `End-to-End/Release Full Flows` area and automation lives under `tests/end-to-end/`. These tests cover complete critical business flows before release.

API may prepare prerequisite data and clean up after execution. The critical user business journey itself runs through UI unless the Zephyr testcase explicitly defines an API-to-UI flow. Release execution can target the whole `tests/end-to-end/` directory without also running every feature spec.

## Project Structure

```text
testing/
├── .env.example
├── .gitignore
├── .agents/skills/
│   ├── analyze-requirement/
│   ├── generate-testcases/
│   ├── generate-automation/
│   └── run-testcases/
├── requirements/
│   ├── input/
│   └── analyzed/
├── tests/
│   ├── api/
│   ├── ui/
│   ├── integration/
│   ├── end-to-end/
│   ├── pages/
│   ├── api-clients/
│   ├── fixtures/
│   └── test-data/
│       ├── api/
│       ├── ui/
│       ├── integration/
│       └── end-to-end/
├── reports/
└── scripts/
```

Feature subfolders may be created beneath each automation layer. The same relative feature path is used beneath `tests/test-data/`.

## One Spec to One Test-Data File

Every `*.spec.ts` file must have exactly one corresponding `*.testdata.json` file. They share the same basename and relative feature path.

```text
tests/integration/authentication/login.spec.ts
↔
tests/test-data/integration/authentication/login.testdata.json
```

The JSON object is keyed by official Zephyr Keys:

```json
{
  "HC-T123": {
    "credentialProfile": "standardUser",
    "apiSetup": {
      "accountStatus": "active"
    },
    "ui": {
      "expectedPage": "inventory"
    },
    "expected": {
      "productListVisible": true,
      "shoppingCartVisible": true
    }
  }
}
```

Rules:

- Every automated testcase title starts with its Zephyr Key.
- Every Test ID must match `HC-T\d+`.
- The same key is used in Zephyr, any testcase export, the spec title, the JSON key, and the Pass/Fail report.
- Every Test ID declared by a spec exists exactly once in its corresponding JSON file.
- Every JSON Test ID maps to a test in that spec; orphan data is invalid.
- Test-specific API payloads, UI inputs, and expected values come from JSON rather than being hardcoded in specs.
- Shared control flow remains in fixtures, Page Objects, API clients, and helpers rather than being copied into JSON.
- Changing ordinary test data requires changing only the JSON file.

A validation script must reject missing data files, mismatched basenames or paths, invalid or duplicate Zephyr Keys, missing JSON entries, orphan JSON entries, and testcase-specific data hardcoded in specs when it belongs in JSON.

## Identifier Mapping

Use one identifier everywhere:

```text
Zephyr testcase:       HC-T123
Exported testcase ID:  HC-T123
Playwright test title: HC-T123 | Login successfully
JSON object key:       HC-T123
Report result:         HC-T123
```

AI must not invent a temporary official Testcase ID before Zephyr creates the case. The proposal shown in chat has no official ID. After publishing, the Zephyr response supplies the `HC-Txxx` key used by all downstream artifacts.

## Credentials and Environment Configuration

Store real credentials only in the project-root `.env` or CI secret configuration:

```env
BASE_URL=https://website-test.com/
LOGIN_URL=https://website-test.com/login
API_BASE_URL=https://api.website-test.com/
TEST_USERNAME=tester01
TEST_PASSWORD=real-password
```

Commit `.env.example` with empty or public demonstration values only. Keep `.env` ignored by Git.

Rules:

- Never store real usernames, passwords, tokens, or API secrets in Zephyr, JSON test-data files, specs, Page Objects, reports, screenshots, console output, or Git.
- JSON may contain a logical reference such as `credentialProfile: standardUser`.
- Fixtures resolve credential profiles from environment configuration without logging secret values.
- Stop with a clear blocker when required configuration is missing.
- Version one supports normal username/password login only. OTP, CAPTCHA, SSO, Microsoft, and Google login are out of scope.

## Live UI Inspection and Locator Strategy

For UI, integration, and end-to-end scripts, AI must open the real configured application with Playwright before generating locators. It logs in when required, follows the finalized Zephyr steps, and inspects the rendered DOM in the corresponding state.

Use locator priority:

```text
getByTestId
→ getByRole
→ getByLabel
→ getByPlaceholder
→ stable CSS
```

Verify that each locator resolves the intended element. Keep locators in Page Objects, avoid XPath and unstable generated classes, and report a blocker rather than guessing.

## Skill Responsibilities

### `analyze-requirement`

- Read Jira, Confluence, or a local requirement.
- Save the verified analysis under `requirements/analyzed/`.
- Identify API behavior, UI behavior, cross-layer dependencies, and unclear points.
- Do not invent behavior for ambiguous requirements.

### `generate-testcases`

- Generate complete testcase proposals in chat, grouped by feature or end-to-end flow.
- Include Title, Preconditions, Test Layer, Steps, Test Data, and Expected Result.
- Publish or update Zephyr only after explicit human instruction.
- Use the Zephyr-assigned `HC-Txxx` key after creation.
- Never create automation code.

### `generate-automation`

- Accept finalized Zephyr Keys named by the human.
- Reread the latest testcase version from Zephyr.
- Reject `Manual` cases.
- Generate the appropriate API, UI, integration, or end-to-end spec.
- Generate exactly one matching JSON test-data file for each spec.
- Use API clients, Page Objects, and fixtures for reusable behavior.
- Validate Zephyr Key mapping, JSON mapping, TypeScript compilation, and Playwright discovery.

### `run-testcases`

- Run selected feature, layer, Test ID, or the complete end-to-end release suite.
- Preserve JSON, HTML, screenshots, video, and trace evidence.
- Report Pass, Fail, or Skipped using the matching `HC-Txxx` key.
- Do not hide API setup, login, locator, environment, or cleanup failures.

## Failure and Blocker Handling

Stop generation or execution and identify the Zephyr Key when:

- the human has not explicitly confirmed cross-review completion;
- the current Zephyr testcase cannot be read;
- the Testcase ID is not in `HC-Txxx` format;
- the testcase is Manual or its Test Layer is missing;
- a required JSON mapping cannot be generated unambiguously;
- credentials or environment configuration are missing;
- the API or application is unreachable;
- API setup or verification fails;
- login fails;
- the required UI state cannot be reached;
- a finalized step is ambiguous;
- no reliable locator can be verified.

Never guess, silently skip finalized steps, hardcode a false success, expose credentials, or generate a placeholder test.

## Reporting

Playwright writes:

- machine-readable results to `reports/results.json`;
- HTML output to `reports/playwright-report/`;
- screenshots, videos, and traces to `reports/test-results/`;
- a concise summary to `reports/summary.json`.

Each automated result maps to its `HC-Txxx` key. Result synchronization back to Zephyr can be added later; it is not required for the first implementation unless explicitly requested.

## Acceptance Criteria

1. The project uses Playwright Test and TypeScript for both API and UI automation.
2. Zephyr is the only official testcase repository; Git contains no duplicate testcase collection.
3. AI presents proposed cases in chat and publishes them only after human instruction.
4. A second tester reviews directly in Zephyr and communicates completion manually.
5. Automation is generated only after an explicit human request naming finalized Zephyr Keys.
6. Features, API, UI, API-to-UI integration, Manual, and release end-to-end cases are represented by Test Layer.
7. Every spec has exactly one matching JSON test-data file with the same basename and relative path.
8. The same `HC-Txxx` identifier maps Zephyr, exports, specs, JSON, and reports.
9. Test-specific payloads, inputs, and expected values are loaded from JSON; secrets remain in `.env`.
10. API-to-UI tests perform and verify API preparation before UI assertions.
11. UI automation uses Page Object Model and locators verified against the live application.
12. End-to-end tests can run as a complete release suite.
13. Validators reject invalid IDs, missing or orphan JSON mappings, missing configuration, and undiscoverable tests.
14. Playwright execution preserves Pass/Fail evidence without converting blockers into passes.
