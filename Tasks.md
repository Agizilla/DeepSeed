# Tasks

## Immediate

- [x] Add integration-like smoke test for import -> parse -> apply path.
- [x] Validate API error mapping (`401`, `402`, `429`, `5xx`) to user-friendly statuses.
- [x] Add parser regression fixtures for marker and diff modes.
- [x] Add UI test checklist for theme switching and settings persistence.
- [x] Add migration/normalization pass for legacy localStorage key prefixes (`mute_*` -> `deepseed_*`).

## Next

- [ ] Add conflict resolution UI for patch/apply collisions.
- [x] Add reversible apply (undo stack per session).
- [ ] Add JSON export for snippets in addition to markdown.

## Backlog

- [ ] Plugin interface for custom parsers.
- [ ] Optional git integration hooks.
- [ ] Accessibility pass (contrast, ARIA labels, keyboard nav).
