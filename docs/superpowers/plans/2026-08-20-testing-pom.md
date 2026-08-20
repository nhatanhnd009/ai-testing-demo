# Testing POM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cloneable Playwright tester project that generates structured test cases and uses Page Object Model for the VnExpress demo.

**Architecture:** Requirements, generated test cases, executable automation, and reports are separate artifacts. Playwright page locators/actions live in Page Objects, while fixtures provide those objects and specs contain only scenario flow and assertions.

**Tech Stack:** Node.js 20+, TypeScript, `@playwright/test`, Markdown, YAML configuration.

**Spec:** `docs/superpowers/specs/2026-08-20-testing-pom-design.md`

## Global Constraints

- Keep version one limited to requirement analysis, test-case generation, POM automation, execution, and reports.
- Every generated test case must include ID, Title, Preconditions, Execution Type, Steps, Actions, and Expected Results.
- Do not create automation code for cases marked `Manual`.
- Store locators/actions in `tests/pages`, fixtures in `tests/fixtures`, and test flow/assertions in `tests/specs`.

---

### Task 1: Repository Foundation and Output Contracts

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `playwright.config.ts`
- Create: `project/project.yaml`
- Create: `project/requirement-sources.yaml`
- Create: `.gitignore`
- Create: `.env.example`

**Interfaces:**
- Produces: Playwright configuration with `baseURL`, HTML reporter, JSON reporter, and `tests/specs` as the test directory.

- [ ] Create a failing configuration test that checks required files and reporter paths.
- [ ] Run the test and confirm the missing configuration causes failure.
- [ ] Add the minimal configuration files.
- [ ] Run the configuration test and confirm it passes.
- [ ] Commit the repository foundation.

### Task 2: Project Skills

**Files:**
- Create: `.agents/skills/analyze-requirement/SKILL.md`
- Create: `.agents/skills/generate-testcases/SKILL.md`
- Create: `.agents/skills/run-testcases/SKILL.md`
- Create: `scripts/validate-skills.mjs`

**Interfaces:**
- Produces: Three project workflows with explicit input/output paths and a deterministic validator.

- [ ] Create validator checks for YAML frontmatter, required names, and output contracts.
- [ ] Run the validator before the skills exist and confirm it fails.
- [ ] Add one skill at a time, validating each before continuing.
- [ ] Run the validator and confirm all three skills pass.
- [ ] Commit the project skills.

### Task 3: VnExpress Requirement and Generated Test Cases

**Files:**
- Create: `requirements/input/VNE-HOME-requirement.md`
- Create: `requirements/analyzed/VNE-HOME-analysis.md`
- Create: `testcases/generated/TC-VnExpress-Homepage.md`
- Create: `scripts/validate-testcases.mjs`

**Interfaces:**
- Produces: Markdown cases whose headings match `VNE-HOME-NNN` and whose step tables contain `Step`, `Action`, `Test Data`, and `Expected Result`.

- [ ] Create validation checks for required testcase sections and step-table columns.
- [ ] Run the validator against an incomplete fixture and confirm it fails.
- [ ] Add the analyzed requirement and generated testcase document.
- [ ] Run the testcase validator and confirm it passes.
- [ ] Commit the requirement and testcase artifacts.

### Task 4: POM Automation and Result Summary

**Files:**
- Create: `tests/pages/VnExpressHomePage.ts`
- Create: `tests/fixtures/test.fixture.ts`
- Create: `tests/specs/vnexpress-homepage.spec.ts`
- Create: `scripts/summarize-results.mjs`
- Create: `scripts/summarize-results.test.mjs`

**Interfaces:**
- Produces: `VnExpressHomePage.open()`, stable visible-element locators, a `vnExpressHomePage` fixture, Test Case ID-prefixed specs, and `reports/summary.json`.

- [ ] Write summary-script tests for passed, failed, skipped, and missing report data.
- [ ] Run the tests and confirm the missing implementation fails.
- [ ] Implement the summary script minimally and confirm the tests pass.
- [ ] Add the Page Object, fixture, and specs.
- [ ] Run TypeScript compilation and Playwright test discovery.
- [ ] Commit POM automation.

### Task 5: User Guide and Full Verification

**Files:**
- Create: `README.md`
- Create: `AGENTS.md`

**Interfaces:**
- Produces: Windows setup, GitLab creation/push, skill invocation, test execution, and report instructions.

- [ ] Document prerequisites and exact PowerShell commands.
- [ ] Document how to create an empty GitLab repository and push `main`.
- [ ] Document the three agent prompts and generated-output locations.
- [ ] Run validators, unit tests, TypeScript compilation, Playwright discovery, and the demo test.
- [ ] Record actual verification results and commit the guide.
