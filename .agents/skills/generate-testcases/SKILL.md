---
name: generate-testcases
description: Use when an analyzed requirement needs complete feature or end-to-end testcase proposals, human review, or an explicitly requested Zephyr create or update.
---

# Generate Testcases

## Goal

Present complete testcase proposals in chat, preserve human control, and use Zephyr as the only official testcase repository. Never create automation from this skill.

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

Use `N/A` when a step has no Test Data. Before Zephyr creation, show `Testcase ID: Assigned by Zephyr` rather than inventing an `HC-T` key.

## Human and Zephyr Gate

Follow this order exactly:

```text
read analyzed requirement
→ present proposed testcases in chat
→ wait for first human review
→ apply requested corrections in chat
→ publish or update Zephyr only on explicit human instruction
→ capture the returned HC-Txxx keys
→ stop without generating automation
```

Create feature cases under the configured `Features/<feature>` folder. Create release flows under `End-to-End/Release Full Flows`. When updating an existing case, reread its current Zephyr version and preserve its `HC-Txxx` key.

If no connected Zephyr capability is available, report the connection blocker and keep the reviewed content in chat. Do not create a Git testcase file as a fallback.

## Rules

- Zephyr assigns every official `HC-Txxx` Testcase ID.
- A second tester reviews and edits directly in Zephyr.
- Review completion is communicated manually; do not add a testcase status.
- Publishing or editing a case never triggers script generation.
- Manual cases remain in Zephyr and never receive placeholder tests.
- Never create automation, Page Objects, API clients, fixtures, specs, or JSON test data in this skill.
