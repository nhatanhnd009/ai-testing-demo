---
name: analyze-requirement
description: Use when a BRD, Jira ticket, Confluence page, or local requirement must be converted into a testable analysis before test cases are generated.
---

# Analyze Requirement

## Goal

Create a concise, evidence-based requirement analysis. Do not invent business rules or expected behavior that the source does not state.

## Input

Use one or more of these sources:

- a local file under `requirements/input`;
- a Jira issue supplied by the user or available through a connector;
- a Confluence page supplied by the user or available through a connector.

Record each source name, issue key, page ID, URL, or local path that is actually available. If a remote source cannot be read, report the blocker instead of fabricating its content.

## Workflow

1. Read `project/project.yaml` and `project/requirement-sources.yaml`.
2. Read all available requirement sources.
3. Extract only explicitly supported behavior.
4. Separate testable behavior from missing or ambiguous behavior.
5. Classify each testable behavior as `API`, `UI`, `API + UI`, `End-to-End`, or `Manual`.
6. Record API dependencies that must prepare data before UI verification.
7. Save the analysis to `requirements/analyzed/<requirement-id>-analysis.md`.

## Output Contract

Write sections in this order:

1. `# <Requirement ID> — Requirement Analysis`
2. `## Sources`
3. `## Objective`
4. `## Actors`
5. `## Preconditions`
6. `## Functional Flow`
7. `## Business and Validation Rules`
8. `## Testable Behaviors`
9. `## Suggested Test Layers`
10. `## API-to-UI Dependencies`
11. `## Unclear Points`
12. `## Excluded from Testcase Generation`

For every Unclear Point, explain exactly what is missing and where confirmation is needed. Do not generate testable behavior for that point until the user or requirement source resolves it.

## Quality Check

- Every testable behavior traces to a source.
- Every behavior has a suggested Test Layer.
- API + UI behaviors state which API outcome is required before UI verification.
- Assumptions are absent.
- Official Testcase IDs are absent; Zephyr assigns them only after publication.
- Contradictory sources are listed under Unclear Points.
- The saved file exists under `requirements/analyzed`.
