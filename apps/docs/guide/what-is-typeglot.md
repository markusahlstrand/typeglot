# What is TypeGlot?

TypeGlot is a **developer-first, Git-native internationalization (i18n) toolchain** designed to replace cloud-based translation services. Its core philosophy is that translations are code, should live in the repository, and must be strongly typed.

## The Problem

Current i18n solutions have several pain points:

### Sync Anxiety

Cloud-based services like i18nexus create synchronization friction. You're constantly wondering: "Is my local state in sync? Did someone update a translation remotely?"

### No Version Control

Translations stored in external databases lose the benefits of Git — no history, no branches, no code review for translation changes.

### Magic Strings

Most i18n libraries use string keys like `t('user.welcome')`. These are:

- Not type-safe — typos silently fail at runtime
- Not autocomplete-friendly — you have to remember or look up key names
- Parameter-blind — no compile-time check that you're passing required parameters

### Context-Free AI Translation

When you use AI to translate, it only sees the raw text. Without context, it might translate "Save" as a noun (piggy bank) instead of a verb (save document).

## The Solution

TypeGlot addresses all of these issues:

### Git as Source of Truth

Translation JSON files live in your repository, versioned with Git. No external databases, no sync issues. Changes go through pull requests like any other code.

```
your-project/
├── locales/
│   ├── en.json    # Source translations
│   ├── es.json    # Spanish
│   └── fr.json    # French
└── src/
    └── generated/
        └── i18n/  # Auto-generated TypeScript
```

### Strong Typing

The compiler generates TypeScript functions for every translation key:

```typescript
// Auto-generated from locales/en.json
export function welcome(params: { name: string }): string { ... }
export function items_count(params: { count: number }): string { ... }

// Usage - fully typed with autocomplete
import { m } from './generated/i18n';

m.welcome({ name: 'World' })  // ✅ Type-safe
m.welcome({ naam: 'World' })  // ❌ Compile error: 'naam' does not exist
m.welcome()                   // ❌ Compile error: missing required parameter
```

### Context-Aware AI

TypeGlot extracts JSDoc comments from your source code and sends them to the AI model:

```typescript
/** @desc Button shown when user completes checkout process */
const checkoutButton = m.checkout_now;
```

The AI receives: "Button shown when user completes checkout process" along with the text "Checkout Now", ensuring accurate translation.

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  locales/*.json │────▶│    Compiler     │────▶│  TypeScript     │
│  (translations) │     │  @typeglot/     │     │  Functions      │
└─────────────────┘     │   compiler      │     └─────────────────┘
                        └─────────────────┘
                               ▲
                               │
┌─────────────────┐     ┌──────┴──────────┐
│  Source Code    │────▶│  Context Engine │
│  (JSDoc/TSDoc)  │     │  @typeglot/core │
└─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  AI Translation │
                        │  (with context) │
                        └─────────────────┘
```

1. **Define** translations in `locales/en.json`
2. **Compile** to TypeScript with `typeglot build`
3. **Use** typed functions in your code with JSDoc context
4. **Translate** missing keys with AI that understands context
5. **Review** changes through normal Git workflow
