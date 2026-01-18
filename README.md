# TypeGlot 🌐

> Developer-first, Git-native internationalization (i18n) toolchain

TypeGlot is designed to replace cloud-based i18n services. Its core philosophy is that **translations are code**, should live in the repository, and must be **strongly typed**.

## ✨ Key Features

- **Git as Source of Truth** — No external databases. JSON translation files are committed alongside feature code
- **Strong Typing** — Compiler generates TypeScript functions for every key with full autocomplete
- **Context-Aware AI** — Extract JSDoc/TSDoc comments to provide deep context to AI translation models
- **Local Development Dashboard** — Visual UI for managing translations without leaving your workflow
- **VS Code Integration** — Inline translation previews and code actions directly in your editor

## 📦 Packages

| Package                                     | Description                                                      |
| ------------------------------------------- | ---------------------------------------------------------------- |
| [`@typeglot/core`](./packages/core)         | Shared logic for config parsing, AST analysis, and AI prompting  |
| [`@typeglot/compiler`](./packages/compiler) | Generates typed TypeScript functions from JSON translation files |
| [`@typeglot/cli`](./packages/cli)           | Command-line interface for initialization and management         |
| [`@typeglot/ui`](./packages/ui)             | Local React-based dashboard for managing translations            |
| [`@typeglot/vscode`](./packages/vscode)     | VS Code extension for in-editor experiences                      |

## 🚀 Quick Start

### Initialize a new project

```bash
npx typeglot init
```

This creates:

- `typeglot.config.json` — Configuration file
- `locales/en.json` — Source translation file
- `src/generated/i18n/` — Output directory for generated TypeScript

### Add translations

Edit `locales/en.json`:

```json
{
  "hello": "Hello",
  "welcome": "Welcome, {name}!",
  "items_count": "{count, plural, one {# item} other {# items}}"
}
```

### Build typed translations

```bash
npx typeglot build
```

This generates strongly-typed TypeScript functions:

```typescript
// src/generated/i18n/messages.ts (auto-generated)
export function hello(): string { ... }
export function welcome(params: { name: string }): string { ... }
export function items_count(params: { count: number }): string { ... }

export const m = { hello, welcome, items_count };
```

### Use in your code

```typescript
import { m } from './generated/i18n';

// Fully typed with autocomplete!
const greeting = m.welcome({ name: 'World' });
// → "Welcome, World!"
```

### Add context for AI translations

```typescript
/** @desc Button displayed when user finalizes their checkout */
const checkoutButton = m.checkout_now;
```

The JSDoc comment is extracted and sent to the AI for accurate, context-aware translations.

## 💻 Development Mode

Start the development server with file watching and local UI:

```bash
npx typeglot dev
```

This will:

- Watch for changes in `locales/*.json`
- Automatically recompile TypeScript on changes
- Launch a local dashboard at `http://localhost:3333`

## 🤖 AI Translation

Generate translations for target locales using AI:

```bash
# Translate all missing keys to Spanish and French
npx typeglot translate --target es fr

# Translate a specific key
npx typeglot translate --key checkout_now --target es fr de
```

Configure your AI provider in `typeglot.config.json`:

```json
{
  "sourceLocale": "en",
  "targetLocales": ["es", "fr", "de"],
  "ai": {
    "provider": "openai",
    "model": "gpt-4"
  }
}
```

## 🔧 Configuration

Create `typeglot.config.json` in your project root:

```json
{
  "sourceLocale": "en",
  "targetLocales": ["es", "fr", "de", "ja"],
  "localesDir": "./locales",
  "outputDir": "./src/generated/i18n",
  "include": ["src/**/*.{ts,tsx,js,jsx}"],
  "exclude": ["node_modules", "dist"],
  "ai": {
    "provider": "openai",
    "model": "gpt-4"
  }
}
```

## 🧩 VS Code Extension

The TypeGlot VS Code extension provides:

- **Inline Decorations** — See translation values directly in your code
- **Code Actions** — Quick fixes for translating keys and extracting strings
- **Dashboard Integration** — Open the local UI with one command

Install from the VS Code Marketplace or build locally:

```bash
cd packages/vscode
pnpm run package
```

## 🛠 Development

### Prerequisites

- Node.js 18+
- pnpm 8+

### Setup

```bash
# Clone the repository
git clone https://github.com/typeglot/typeglot.git
cd typeglot

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start development mode
pnpm dev
```

### Commands

| Command        | Description                     |
| -------------- | ------------------------------- |
| `pnpm install` | Install all dependencies        |
| `pnpm build`   | Build all packages              |
| `pnpm dev`     | Start development mode          |
| `pnpm lint`    | Run linting across all packages |
| `pnpm test`    | Run tests                       |
| `pnpm clean`   | Clean build outputs             |

## 📄 License

MIT © TypeGlot Team
