# Public Launch Checklist

## Pre-publish safety

1. Verify no secrets are tracked:
   - `settings.config` must not exist in git history or staged files.
   - only `settings.config.example` should be committed.
2. Confirm tests/checks pass:
   - `node --check dashboard.js`
   - `node --check deepseek-parser.js`
   - `node --test tests/deepseek-parser.test.js`
3. Confirm documentation exists and is coherent:
   - `README.md`
   - `CONTRIBUTING.md`
   - `CODE_OF_CONDUCT.md`
   - `LICENSE`
   - `Roadmap.md`, `Tasks.md`, `Status.md`, `SprintPlanning.md`

## Suggested first commit messages

Use this sequence for clean public history:

1. `chore: initialize repository baseline and ignore local secrets`
   - include `.gitignore`, `LICENSE`
2. `docs: add README with architecture, quickstart, and troubleshooting`
   - include `README.md`
3. `docs: add contribution standards and community templates`
   - include `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `.github/ISSUE_TEMPLATE/*`, `.github/pull_request_template.md`
4. `ci: add GitHub Actions checks for syntax and parser tests`
   - include `.github/workflows/ci.yml`
5. `docs: add planning artifacts for roadmap, tasks, and sprint execution`
   - include `Roadmap.md`, `Tasks.md`, `Status.md`, `SprintPlanning.md`
6. `feat: browser-first deepseek project viewer with parser and snippet workflow`
   - include app sources and tests

## First push commands

```bash
git init
git add .
git commit -m "chore: initialize repository baseline and ignore local secrets"

# Create follow-up commits by staging selected files per message above.

git remote add origin <your_repo_url>
git branch -M main
git push -u origin main
```

## Post-publish setup

1. Enable GitHub Issues and Discussions.
2. Protect `main` branch with required CI checks.
3. Create labels: `bug`, `enhancement`, `good first issue`, `parser`, `ui`, `docs`.
4. Open 3 starter issues from the `Good first issues` section in `README.md`.
