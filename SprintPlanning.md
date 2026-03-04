# Sprint Planning

## Sprint Goal

Increase reliability and contributor readiness without changing core architecture.

## Sprint Length

2 weeks

## Work Breakdown (1-3 hour tasks)

1. Add API error code mapping utility and UI messaging polish.
   - Estimate: 2h
   - Testing: simulate `401/402/429/500` responses.

2. Add parser fixture tests for mixed and malformed blocks.
   - Estimate: 3h
   - Testing: `node --test tests/deepseek-parser.test.js`.

3. Add smoke test script for end-to-end parse/apply sanity.
   - Estimate: 3h
   - Testing: run smoke script in CI.

4. Add README troubleshooting section for API/auth/config issues.
   - Estimate: 1h
   - Testing: manual doc review.

5. Add contribution templates and labels guidance.
   - Estimate: 2h
   - Testing: create sample issue/PR locally.

6. Add UI a11y quick pass (labels, focus indicators, button names).
   - Estimate: 3h
   - Testing: keyboard-only walkthrough.

7. Add theme regression checklist and manual QA notes.
   - Estimate: 1h
   - Testing: all themes verified against core panels.

## Exit Criteria

- CI green on default branch.
- Parser tests expanded and stable.
- Common API failures are actionable from UI messages.
- Public contribution docs are complete and coherent.
