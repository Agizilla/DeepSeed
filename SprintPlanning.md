# Sprint Planning

## Sprint Goal

Harden the core workflow (`ask -> parse -> review/apply -> export`) with better reliability, clearer failure handling, and test coverage.

## Sprint Length

1 week

## Work Breakdown (1-3 hour tasks)

1. Implement explicit API status mapping (`401`, `402`, `429`, `5xx`) in `askDeepseek`.
   - Estimate: 2h
   - Output: status-to-message helper + targeted UI auth/status text.
   - Testing: mock response objects and verify messages by status.

2. Add parser regression fixtures for marker and diff edge cases.
   - Estimate: 3h
   - Output: fixture files + table-driven tests for malformed/mixed inputs.
   - Testing: `node --test tests/deepseek-parser.test.js`.

3. Add integration-like smoke test for `import -> parse -> apply`.
   - Estimate: 3h
   - Output: script that runs parser + apply helpers against sample input and validates resulting tree/sets.
   - Testing: execute smoke script in CI.

4. Add UI/manual QA checklist for theme and settings persistence.
   - Estimate: 1h
   - Output: `tests/manual-ui-checklist.md`.
   - Testing: manual pass across all themes and persistence controls.

5. Add localStorage key migration from legacy `mute_*` keys to `deepseed_*`.
   - Estimate: 2h
   - Output: one-time migration on startup, backwards-compatible read path.
   - Testing: simulate browser data with old keys and verify seamless load.

6. Add conflict preview groundwork for import collisions.
   - Estimate: 3h
   - Output: detect risky applies (missing base/mismatch) and surface warnings in import list.
   - Testing: crafted diff inputs where base content diverges.

## Exit Criteria

- CI green with expanded parser and smoke coverage.
- API failure messages are specific and actionable.
- Theme/settings persistence checklist completed.
- Legacy localStorage keys migrate without data loss.
- Collision warnings appear before risky import apply actions.
