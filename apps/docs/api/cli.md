# CLI Commands

Complete reference for TypeGlot CLI commands.

## Global Options

These options work with all commands:

| Option      | Description             |
| ----------- | ----------------------- |
| `--help`    | Show help for a command |
| `--version` | Show version number     |

## Commands

### init

Initialize TypeGlot in a project.

```bash
npx typeglot init [options]
```

#### Options

| Option                | Description        | Default     |
| --------------------- | ------------------ | ----------- |
| `-l, --locale <code>` | Source locale code | `en`        |
| `-d, --dir <path>`    | Locales directory  | `./locales` |

#### Examples

```bash
# Default initialization
npx typeglot init

# Custom source locale
npx typeglot init --locale de

# Custom directory
npx typeglot init --dir ./translations

# Combined
npx typeglot init -l fr -d ./i18n
```

#### Output

Creates:

- `typeglot.config.json`
- `{localesDir}/{locale}.json`
- `{outputDir}/` directory

---

### build

Compile translation files to TypeScript.

```bash
npx typeglot build [options]
```

#### Options

| Option          | Description       | Default |
| --------------- | ----------------- | ------- |
| `-w, --watch`   | Watch for changes | `false` |
| `-v, --verbose` | Verbose output    | `false` |

#### Examples

```bash
# Single build
npx typeglot build

# Watch mode
npx typeglot build --watch

# Verbose
npx typeglot build -v

# Watch with verbose
npx typeglot build -w -v
```

#### Output

Generates in `outputDir`:

- `messages.ts` — Typed translation functions
- `{locale}.ts` — Locale data for each language
- `index.ts` — Main entry point

---

### dev

Start development mode with file watching and dashboard.

```bash
npx typeglot dev [options]
```

#### Options

| Option                | Description       | Default |
| --------------------- | ----------------- | ------- |
| `-p, --port <number>` | Dashboard port    | `3333`  |
| `--no-ui`             | Disable dashboard | `false` |

#### Examples

```bash
# Default
npx typeglot dev

# Custom port
npx typeglot dev --port 4000

# Without dashboard
npx typeglot dev --no-ui
```

#### Behavior

1. Loads configuration
2. Performs initial compilation
3. Starts file watcher on `localesDir`
4. Launches dashboard (unless `--no-ui`)
5. Recompiles on file changes

Press `Ctrl+C` to stop.

---

### translate

Generate translations using AI.

```bash
npx typeglot translate [options]
```

#### Options

| Option                      | Description               | Default     |
| --------------------------- | ------------------------- | ----------- |
| `-t, --target <locales...>` | Target locales            | From config |
| `-k, --key <key>`           | Specific key to translate | All keys    |
| `--dry-run`                 | Preview without changes   | `false`     |

#### Examples

```bash
# Translate all missing keys
npx typeglot translate

# Specific locales
npx typeglot translate --target es fr

# Specific key
npx typeglot translate --key checkout_button

# Specific key to specific locales
npx typeglot translate -k welcome -t es fr de

# Dry run
npx typeglot translate --dry-run

# Key with glob pattern
npx typeglot translate --key "user.*"
```

#### Behavior

1. Loads configuration
2. Reads source locale file
3. Scans source files for JSDoc context
4. Identifies missing translations
5. Sends to AI with context
6. Writes translated values to locale files

#### Environment Variables

| Variable            | Required For       |
| ------------------- | ------------------ |
| `OPENAI_API_KEY`    | OpenAI provider    |
| `ANTHROPIC_API_KEY` | Anthropic provider |

---

### check

Validate translation coverage (planned feature).

```bash
npx typeglot check [options]
```

#### Options

| Option                   | Description            | Default |
| ------------------------ | ---------------------- | ------- |
| `--coverage <percent>`   | Minimum coverage       | `100`   |
| `--locales <locales...>` | Check specific locales | All     |

#### Examples

```bash
# Check all locales
npx typeglot check

# Require 90% coverage
npx typeglot check --coverage 90

# Check specific locales
npx typeglot check --locales es fr
```

---

## Exit Codes

| Code | Meaning                                           |
| ---- | ------------------------------------------------- |
| `0`  | Success                                           |
| `1`  | Error (invalid config, compilation failure, etc.) |

## Verbose Output

Enable verbose logging with `--verbose` or `-v`:

```bash
npx typeglot build --verbose
```

Output includes:

- Configuration details
- File paths being processed
- Compilation timing
- Key counts per file

## Configuration Discovery

The CLI looks for configuration in:

1. `typeglot.config.json`
2. `typeglot.config.js`
3. `.typeglotrc`

Override with `TYPEGLOT_CONFIG` environment variable:

```bash
TYPEGLOT_CONFIG=./custom-config.json npx typeglot build
```

## Working Directory

Commands run in the current working directory. Use `cd` to change:

```bash
cd packages/web
npx typeglot build
```

## Piping and Scripts

Commands work well in scripts:

```json
{
  "scripts": {
    "i18n:build": "typeglot build",
    "i18n:dev": "typeglot dev",
    "i18n:translate": "typeglot translate",
    "precommit": "typeglot build && git add src/generated/i18n"
  }
}
```
