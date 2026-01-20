# Getting Started

This guide will help you set up TypeGlot in your project in under 5 minutes.

## Prerequisites

- Node.js 18 or higher
- pnpm, npm, or yarn

## Installation

### Initialize a New Project

The fastest way to get started is using the CLI:

```bash
npx @typeglot/cli init
```

The init command is smart:

- **Detects existing locale files** in common locations (`locales/`, `src/locales/`, `src/i18n/`, etc.)
- **Detects monorepos** (pnpm workspaces, npm/yarn workspaces) and lets you choose which packages to initialize
- **Asks which locale is your source** if multiple locales are found

This creates:

- `typeglot.config.json` — Configuration file
- `locales/en.json` — Source translation file with examples (if no existing locales found)
- `src/generated/i18n/` — Output directory for generated TypeScript

### Monorepo Support

In a monorepo, the CLI will detect your workspace and offer options:

```
🌐 Initializing TypeGlot...

📦 Detected monorepo with packages:

? Where would you like to initialize TypeGlot?
  ❯ Root (shared translations)
    Specific packages

? Select packages to initialize:
  ◯ @myapp/frontend
  ◯ @myapp/backend
  ◯ @myapp/mobile
```

Choose **Root** if all packages share the same translations, or **Specific packages** to initialize each package independently.

### Existing Projects

If you already have translation files, TypeGlot will find them:

```
📂 Found existing locale files in src/locales/
   Locales: en, es, de

? Use existing locales directory (src/locales/)? Yes
? Which locale is your source (primary) locale? en
```

## What Gets Created

After running `typeglot init`, your project structure looks like this:

```
your-project/
├── typeglot.config.json     # Configuration file
├── locales/                  # Translation source files
│   └── en.json              # Source locale
└── src/generated/i18n/      # Generated TypeScript
    ├── index.ts             # Main exports + locale types
    ├── messages.ts          # Typed translation functions
    ├── en.ts                # English messages
    └── es.ts                # Spanish messages (etc.)
```

### What to Commit vs Gitignore

| File                   | Commit to Git? | Bundled in Production? | Description                    |
| ---------------------- | -------------- | ---------------------- | ------------------------------ |
| `typeglot.config.json` | ✅ Yes         | ❌ No                  | Configuration for the compiler |
| `locales/*.json`       | ✅ Yes         | ❌ No                  | Source translation files       |
| `src/generated/i18n/*` | ❌ No          | ✅ Yes                 | Generated TypeScript code      |

Add to your `.gitignore`:

```gitignore
# TypeGlot generated files
src/generated/i18n/
```

::: tip Zero Runtime Dependencies
The generated TypeScript code is **completely self-contained**. Your production bundle includes only the generated functions — no `@typeglot/*` packages, no JSON files, no external dependencies.
:::

### Manual Installation

If you prefer to set things up manually:

```bash
# Install the CLI
npm install -D @typeglot/cli

# Or with pnpm
pnpm add -D @typeglot/cli
```

Create `typeglot.config.json`:

```json
{
  "sourceLocale": "en",
  "targetLocales": ["es", "fr", "de"],
  "localesDir": "./locales",
  "outputDir": "./src/generated/i18n"
}
```

Create your source translation file `locales/en.json`:

```json
{
  "hello": "Hello",
  "welcome": "Welcome, {name}!",
  "items_count": "{count, plural, one {# item} other {# items}}"
}
```

## Building Translations

Compile your translations to TypeScript:

```bash
npx typeglot build
```

This generates typed functions in `src/generated/i18n/`:

```typescript
// messages.ts (auto-generated)
export function hello(): string { ... }
export function welcome(params: { name: string }): string { ... }
export function items_count(params: { count: number }): string { ... }

export const m = { hello, welcome, items_count };
```

## Using Translations

Import and use the typed functions:

```typescript
import { m } from './generated/i18n';

// Simple message
const greeting = m.hello();
// → "Hello"

// With parameters
const personalGreeting = m.welcome({ name: 'Alice' });
// → "Welcome, Alice!"

// With pluralization
const itemText = m.items_count({ count: 5 });
// → "5 items"
```

## Development Mode with Dashboard

Start the development server with the integrated dashboard:

```bash
npx @typeglot/cli dev
```

This will:

1. Watch `locales/*.json` for changes
2. Automatically recompile TypeScript on every change
3. Start an API server
4. Serve the local dashboard at `http://localhost:3333`

### Using the Dashboard

Open `http://localhost:3333` in your browser to:

- **View all translations** in a table format
- **Add new keys** with the "+ Add Key" button
- **Edit translations inline** by clicking any cell
- **Filter by language** to focus on specific locales
- **Search** for keys or values
- **See missing translations** highlighted in red

Changes made through the dashboard are saved directly to your JSON files and trigger automatic recompilation.

## Running Without Installation

You can run TypeGlot in any project folder without installing it:

```bash
npx @typeglot/cli dev
```

This makes it easy to:

- Try TypeGlot in existing projects
- Work on multiple projects without global installations
- Collaborate with team members (they just run `npx`)

## Adding Context for AI

To help AI generate accurate translations, add JSDoc comments:

```typescript
/** @desc Greeting shown on the homepage hero section */
const heroGreeting = m.welcome({ name: userName });

/**
 * @desc Button for adding items to shopping cart
 * @context E-commerce checkout flow
 */
const addButton = m.add_to_cart;
```

## Next Steps

- Learn about [Development Mode](/guide/development-mode) and the dashboard features
- Understand [Translation Files](/guide/translation-files) and supported formats
- Explore [Type Safety](/guide/type-safety) and generated code
- Set up [AI Translation](/guide/ai-translation) for automated translations
- Learn [JSDoc Context](/guide/jsdoc-context) for better AI results
