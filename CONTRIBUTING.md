# Contributing

## Setup

1. Fork and clone the repository.
2. Use a modern Node.js version (18+ recommended).
3. Keep `settings.config` local and never commit API keys.

## Branching

- Create one branch per task/bugfix.
- Keep pull requests focused and small.

## Code changes

- Prefer minimal, targeted edits.
- Do not commit generated artifacts.
- Preserve backward compatibility in parser/apply flows when possible.

## Validation checklist

Run before opening a PR:

```bash
node --check dashboard.js
node --check deepseek-parser.js
node --test tests/deepseek-parser.test.js
```

## PR expectations

- Clear summary of behavior changes.
- Risk notes for parser/apply logic.
- Tests updated or rationale for why no tests changed.
- Screenshots for UI changes.

## Commit style

Recommended prefixes:

- `fix:` bug fixes
- `feat:` features
- `refactor:` internal cleanup
- `test:` test updates
- `docs:` docs updates

