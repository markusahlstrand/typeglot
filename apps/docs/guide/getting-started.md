# Getting Started

This guide will help you set up TypeGlot in your project in under 5 minutes.

## Prerequisites

- Node.js 18 or higher
- pnpm, npm, or yarn

## Installation

### Initialize a New Project

The fastest way to get started is using the CLI:

```bash
npx typeglot init
```

This creates:

- `typeglot.config.json` — Configuration file
- `locales/en.json` — Source translation file with examples
- `src/generated/i18n/` — Output directory for generated TypeScript

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

## Development Mode

Start the development server for automatic recompilation:

```bash
npx typeglot dev
```

This will:

1. Watch `locales/*.json` for changes
2. Automatically recompile TypeScript
3. Launch the local dashboard at `http://localhost:3333`

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

- Learn about [Translation Files](/guide/translation-files) and supported formats
- Understand [Type Safety](/guide/type-safety) and generated code
- Set up [AI Translation](/guide/ai-translation) for automated translations
- Explore [JSDoc Context](/guide/jsdoc-context) for better AI results
