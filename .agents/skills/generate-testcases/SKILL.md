---
name: generate-testcases
description: Use when an analyzed requirement needs complete feature or end-to-end testcase proposals, human review, Zephyr publication, or a reviewed Local Demo CSV.
---

# Generate Testcases

## Goal

Present complete testcase proposals in chat and preserve human control. Use the testcase source configured in `project/project.yaml`. Never create automation from this skill.

## Input

Read the selected analysis under `requirements/analyzed/` and the source references it cites. Stop when an Unclear Point blocks the requested scenario. Do not invent behavior or an official Testcase ID.

## Proposal Contract

Group cases by Feature or End-to-End flow. Present every proposed case in chat with:

- Title;
- Feature;
- Preconditions;
- Test Layer: `API`, `UI`, `API + UI`, `End-to-End`, or `Manual`;
- Steps;
- one Action, Test Data, and Expected Result per step.

Use `N/A` when a step has no Test Data. Before source persistence, show `Testcase ID: Pending`. Zephyr assigns its own keys. Local Demo assigns sequential keys matching `HC-[0-9]{3,}` only after human approval.

## Human and Source Gate

Follow this order exactly:

```text
read analyzed requirement
→ present proposed testcases in chat
→ wait for first human review
→ apply requested corrections in chat
→ persist only on explicit human instruction
→ capture or assign source-appropriate keys
→ stop without generating automation
```

For Zephyr, create feature cases under `Features/<feature>` and release flows under `End-to-End/Release Full Flows`. When updating an existing case, reread its current Zephyr version and preserve its key.

When `project.testcase_source` is `local-demo`, save approved cases under `testcases/` as CSV, mark `Source` as `Local Demo`, preserve one row per numbered step, and assign the next unused `HC-001`-style key. The CSV is a deliberate configured source, not an automatic fallback for unavailable Zephyr.

## Rules

- Zephyr assigns Zephyr testcase IDs such as `HC-T123`. Local Demo keys are locally assigned and never described as Zephyr keys.
- In Zephyr mode, a second tester reviews and edits directly in Zephyr.
- In Local Demo mode, explicit human approval in chat completes review for demo generation.
- Publishing or editing a case never triggers script generation.
- Manual cases remain in Zephyr and never receive placeholder tests.
- Never create automation, Page Objects, API clients, fixtures, specs, or JSON test data in this skill.
