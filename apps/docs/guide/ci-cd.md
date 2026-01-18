# CI/CD Integration

TypeGlot integrates with your CI/CD pipeline to automate translation workflows and ensure translation quality.

## Overview

Typical CI/CD workflow:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   PR Push    │────▶│   Validate   │────▶│    Build     │
│              │     │ Translations │     │   Project    │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │ Auto-Translate│
                     │ Missing Keys │
                     └──────────────┘
```

## GitHub Actions

### Validate Translations

Ensure all translations are present and valid:

```yaml
# .github/workflows/validate-translations.yml
name: Validate Translations

on:
  pull_request:
    paths:
      - 'locales/**'
      - 'src/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build translations
        run: npx typeglot build

      - name: Check for missing keys
        run: npx typeglot check
```

### Auto-Translate on Push

Automatically translate new keys when the source locale changes:

```yaml
# .github/workflows/auto-translate.yml
name: Auto-Translate

on:
  push:
    branches: [main]
    paths:
      - 'locales/en.json' # Source locale

jobs:
  translate:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Translate missing keys
        run: npx typeglot translate
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

      - name: Check for changes
        id: changes
        run: |
          if git diff --quiet locales/; then
            echo "has_changes=false" >> $GITHUB_OUTPUT
          else
            echo "has_changes=true" >> $GITHUB_OUTPUT
          fi

      - name: Create Pull Request
        if: steps.changes.outputs.has_changes == 'true'
        uses: peter-evans/create-pull-request@v5
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: 'chore(i18n): add AI-generated translations'
          title: '🌐 Update translations'
          body: |
            This PR contains AI-generated translations for new keys.

            Please review the translations before merging.
          branch: auto-translations
          labels: i18n, automated
```

### Check for Missing Translations

Block PRs that have missing translations:

```yaml
# .github/workflows/check-translations.yml
name: Check Translations

on:
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Check translation coverage
        run: |
          npx typeglot check --coverage 100 || {
            echo "❌ Missing translations detected"
            echo "Run 'npx typeglot translate' to generate missing translations"
            exit 1
          }
```

## GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - validate
  - translate

validate-translations:
  stage: validate
  image: node:20
  script:
    - npm ci
    - npx typeglot build
    - npx typeglot check
  rules:
    - changes:
        - locales/**
        - src/**

auto-translate:
  stage: translate
  image: node:20
  script:
    - npm ci
    - npx typeglot translate
    - |
      if git diff --quiet locales/; then
        echo "No new translations"
      else
        git config user.email "bot@example.com"
        git config user.name "Translation Bot"
        git add locales/
        git commit -m "chore(i18n): add translations"
        git push origin HEAD:auto-translations
      fi
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      changes:
        - locales/en.json
  variables:
    OPENAI_API_KEY: $OPENAI_API_KEY
```

## Pre-commit Hooks

Use Husky to validate translations before commit:

```bash
# Install Husky
npm install -D husky lint-staged
npx husky init
```

```json
// package.json
{
  "lint-staged": {
    "locales/*.json": ["npx typeglot build", "git add src/generated/i18n"]
  }
}
```

```bash
# .husky/pre-commit
npx lint-staged
```

## Environment Variables

Store sensitive data in CI secrets:

| Secret              | Description                     |
| ------------------- | ------------------------------- |
| `OPENAI_API_KEY`    | OpenAI API key for translations |
| `ANTHROPIC_API_KEY` | Anthropic API key (alternative) |

### GitHub

```bash
gh secret set OPENAI_API_KEY --body "sk-..."
```

### GitLab

Settings → CI/CD → Variables → Add variable

## CLI Commands for CI

### `typeglot build`

Compile translations. Fails if JSON is invalid.

```bash
npx typeglot build
```

### `typeglot check`

Validate translation coverage.

```bash
# Check all locales have all keys
npx typeglot check

# Require 100% coverage
npx typeglot check --coverage 100

# Check specific locales
npx typeglot check --locales es fr
```

### `typeglot translate`

Generate missing translations.

```bash
# Translate all missing
npx typeglot translate

# Dry run (no changes)
npx typeglot translate --dry-run

# Specific locales
npx typeglot translate --target es fr
```

## Best Practices

### 1. Separate Validation from Translation

Don't auto-translate in PRs. Instead:

- Validate in PR checks
- Auto-translate only on main branch
- Create PR for review

### 2. Review Machine Translations

Always have humans review AI translations:

```yaml
- name: Create Pull Request
  uses: peter-evans/create-pull-request@v5
  with:
    reviewers: translation-team
```

### 3. Cache Dependencies

Speed up CI with caching:

```yaml
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/pnpm-lock.yaml') }}
```

### 4. Fail Fast

Check translations early in the pipeline:

```yaml
jobs:
  validate:
    # Runs first, fails fast
  build:
    needs: validate
  test:
    needs: validate
```

### 5. Notification on Failure

Alert the team when translations fail:

```yaml
- name: Notify on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    channel-id: translations
    slack-message: '❌ Translation validation failed'
```
