# TypeGlot - Development Instructions

## Project Overview
TypeGlot is a developer-first, Git-native internationalization (i18n) toolchain. Translations are code, should live in the repository, and must be strongly typed.

## Architecture
This is a pnpm monorepo with the following packages:

- **@typeglot/core** - Shared logic for config parsing, AST analysis (JSDoc extraction), and AI prompting strategies
- **@typeglot/compiler** - High-performance tool that turns JSON translation files into typed TypeScript functions
- **@typeglot/cli** - Terminal interface (`npx typeglot init`, `dev`, `translate` commands)
- **@typeglot/ui** - Local React-based dashboard for managing translations (Vite + React)
- **@typeglot/vscode** - VS Code extension for in-editor translation experiences

## Development Guidelines

### Code Style
- Use TypeScript throughout all packages
- Follow strict TypeScript compiler options
- Use ESLint for linting
- Prefer functional patterns where appropriate

### Package Dependencies
- `ts-morph` for AST analysis in core package
- `commander` for CLI argument parsing
- `vite` + `react` for the UI dashboard
- VS Code Extension API for the editor integration

### Commands
- `pnpm install` - Install all dependencies
- `pnpm build` - Build all packages
- `pnpm dev` - Start development mode
- `pnpm lint` - Run linting across all packages
- `pnpm test` - Run tests

### Key Concepts
1. **Git as Source of Truth** - No external databases, JSON/TS translation files are committed
2. **Strong Typing** - Compiler generates TypeScript functions for every key
3. **Context-Aware AI** - Extract JSDoc/TSDoc comments for accurate translations

### Translation File Format
Source translations live in `locales/[lang].json` format with support for:
- Interpolation parameters: `"welcome": "Hello, {name}!"`
- Pluralization: `"items_count": "{count, plural, one {# item} other {# items}}"`

### JSDoc Context Example
```typescript
/** @desc Button displayed when user finalizes their checkout */
const checkoutButton = m.checkout_now;
```
