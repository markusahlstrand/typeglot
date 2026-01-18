# @typeglot/cli

The CLI package provides command-line tools for managing TypeGlot projects.

## Installation

```bash
# Global installation
npm install -g @typeglot/cli

# Or use with npx
npx typeglot <command>

# Or as dev dependency
npm install -D @typeglot/cli
```

## Commands

### typeglot init

Initialize TypeGlot in a new project:

```bash
npx typeglot init
```

Options:

| Option                  | Description        | Default     |
| ----------------------- | ------------------ | ----------- |
| `-l, --locale <locale>` | Source locale code | `en`        |
| `-d, --dir <directory>` | Locales directory  | `./locales` |

Example:

```bash
# Initialize with Spanish as source
npx typeglot init --locale es --dir ./translations
```

This creates:

- `typeglot.config.json`
- `locales/en.json` (or specified locale)
- `src/generated/i18n/` directory

### typeglot build

Compile translation files to TypeScript:

```bash
npx typeglot build
```

Options:

| Option          | Description                     |
| --------------- | ------------------------------- |
| `-w, --watch`   | Watch for changes and recompile |
| `-v, --verbose` | Show detailed output            |

Examples:

```bash
# Single build
npx typeglot build

# Watch mode
npx typeglot build --watch

# Verbose output
npx typeglot build --verbose
```

### typeglot dev

Start development mode with file watching and local UI:

```bash
npx typeglot dev
```

Options:

| Option              | Description                | Default |
| ------------------- | -------------------------- | ------- |
| `-p, --port <port>` | Port for development UI    | `3333`  |
| `--no-ui`           | Disable the development UI | -       |

Examples:

```bash
# Default port
npx typeglot dev

# Custom port
npx typeglot dev --port 4000

# Without UI
npx typeglot dev --no-ui
```

### typeglot translate

Generate translations using AI:

```bash
npx typeglot translate
```

Options:

| Option                      | Description                    |
| --------------------------- | ------------------------------ |
| `-t, --target <locales...>` | Target locales to translate    |
| `-k, --key <key>`           | Translate a specific key       |
| `--dry-run`                 | Preview without making changes |

Examples:

```bash
# Translate all missing keys
npx typeglot translate

# Translate to specific locales
npx typeglot translate --target es fr de

# Translate a specific key
npx typeglot translate --key checkout_button

# Dry run
npx typeglot translate --dry-run
```

## Programmatic Usage

You can also use CLI functions programmatically:

```typescript
import { initCommand, buildCommand, devCommand, translateCommand } from '@typeglot/cli';

// Initialize a project
await initCommand({ locale: 'en', dir: './locales' });

// Build translations
await buildCommand({ watch: false, verbose: true });

// Start dev mode
await devCommand({ port: '3333', ui: true });

// Translate
await translateCommand({ target: ['es', 'fr'] });
```

## Exit Codes

| Code | Description                                       |
| ---- | ------------------------------------------------- |
| `0`  | Success                                           |
| `1`  | Error (invalid config, compilation failure, etc.) |

## Environment Variables

| Variable            | Description                          |
| ------------------- | ------------------------------------ |
| `OPENAI_API_KEY`    | OpenAI API key for AI translation    |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI translation |
| `TYPEGLOT_CONFIG`   | Custom config file path              |

## Configuration File

The CLI reads configuration from `typeglot.config.json`:

```json
{
  "sourceLocale": "en",
  "targetLocales": ["es", "fr", "de"],
  "localesDir": "./locales",
  "outputDir": "./src/generated/i18n",
  "include": ["src/**/*.{ts,tsx}"],
  "exclude": ["node_modules"],
  "ai": {
    "provider": "openai",
    "model": "gpt-4"
  }
}
```

### Config File Locations

The CLI looks for config in this order:

1. `typeglot.config.json`
2. `typeglot.config.js`
3. `.typeglotrc`

## Output Examples

### typeglot init

```
🌐 Initializing TypeGlot...

✓ Created typeglot.config.json
✓ Created locales/
✓ Created locales/en.json with example keys
✓ Created src/generated/i18n/

TypeGlot initialized successfully! 🎉

Next steps:
  1. Add translations to locales/en.json
  2. Run npx typeglot build to generate TypeScript
  3. Run npx typeglot dev to start development mode
```

### typeglot build

```
🌐 TypeGlot Build

✓ Configuration loaded
✓ Compilation complete

✓ Generated 4 files with 15 keys
  src/generated/i18n/messages.ts
  src/generated/i18n/en.ts
  src/generated/i18n/es.ts
  src/generated/i18n/index.ts
```

### typeglot dev

```
🌐 Starting TypeGlot development mode...

✓ Configuration loaded
✓ Initial compilation complete (15 keys)
✓ Watching for changes in ./locales

📊 Development UI available at http://localhost:3333

Press Ctrl+C to stop
```

## Dependencies

- `@typeglot/core` — Configuration and types
- `@typeglot/compiler` — Translation compilation
- `commander` — CLI argument parsing
- `chalk` — Terminal colors
- `ora` — Spinners and progress
