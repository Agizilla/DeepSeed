# Deepseek Project Viewer

Browser-first project dashboard for AI-assisted coding workflows.

## Why this project exists

Most AI coding flows are either:

- chat-only (hard to turn responses into reliable file changes), or
- agent-heavy (high setup overhead for solo developers).

This project focuses on a practical middle path:

- ask model -> edit response -> parse actions -> review/apply changes

with strong local control and low friction.

## Core capabilities

- Project file viewer and metadata panel.
- DeepSeek panel with direct API calls.
- Editable AI response output before parsing.
- Parser modes (`auto`, marker-based, diff-based).
- Local apply/export workflow with ZIP download support.
- Snippet bookmarking with tags and markdown/zip exports.
- Settings support via `settings.config` + localStorage/sessionStorage.

## Who this is for

- Solo developers who want speed without giving up review control.
- Builders who prefer browser-first/offline-friendly tooling.
- Contributors exploring structured AI-to-code patch workflows.

## Architecture at a glance

- `Mute Project Dashboard_deepseek_v5.html`: app shell and UI layout.
- `dashboard.css`: UI styling and themes.
- `dashboard.js`: app state, UI behavior, DeepSeek integration, parser/apply orchestration.
- `deepseek-parser.js`: reusable parser logic (importable by other viewers).
- `tests/deepseek-parser.test.js`: parser unit tests.

Flow:

1. User sends prompt in DeepSeek panel.
2. Response returns to editable textarea.
3. Parser extracts file actions from response text.
4. Viewer previews and applies changes in local app state.
5. User exports changed files/snippets as needed.

## Quick start

1. Clone the repo.
2. Open `Mute Project Dashboard_deepseek_v5.html` in a modern browser.
3. Optional: copy `settings.config.example` to `settings.config` and fill values.
4. Open DeepSeek panel, login with API key, and run `Ask` / `Ask + Parse`.

## Local config

Use `settings.config` (not committed):

```ini
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_MODEL=deepseek-coder
DEEPSEEK_ENDPOINT=https://api.deepseek.com/v1/chat/completions
SNIPPET_TAGS=TODO, Do more research, Maybe later, Look into this
```

## Troubleshooting

- `HTTP 401`: API key invalid or malformed.
- `HTTP 402`: account has insufficient balance/quota.
- `HTTP 429`: rate limit hit, retry with backoff.
- Empty parse result: switch parser mode and verify response format markers.

## Testing

```bash
node --check dashboard.js
node --check deepseek-parser.js
node --test tests/deepseek-parser.test.js
```

## Good first issues

- Add API error-to-UI mapping helpers for clearer auth/billing/rate-limit messages.
- Add parser fixtures for malformed/mixed marker+diff responses.
- Add smoke test for prompt -> parse -> apply flow.
- Improve keyboard accessibility for settings and AI panel controls.

## Contributing

See `CONTRIBUTING.md` for workflow and PR requirements.

## License

MIT. See `LICENSE`.
