---
layout: home

hero:
  name: TypeGlot
  text: Git-Native i18n Toolchain
  tagline: Developer-first internationalization with strong typing and AI-powered translations
  image:
    src: /logo.svg
    alt: TypeGlot
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/typeglot/typeglot

features:
  - icon: 📁
    title: Git as Source of Truth
    details: No external databases or sync anxiety. Translation files live in your repository alongside your code.
  - icon: 🔒
    title: Strongly Typed
    details: Auto-generated TypeScript functions with full type safety. No more magic strings or missing parameters.
  - icon: 🤖
    title: Context-Aware AI
    details: JSDoc comments provide rich context to AI models for accurate, nuanced translations.
  - icon: ⚡
    title: Instant Compilation
    details: Watch mode recompiles on every change. See your translations update in real-time.
  - icon: 🎨
    title: Local Dashboard
    details: Visual UI for managing translations without leaving your development workflow.
  - icon: 💻
    title: VS Code Integration
    details: Inline translation previews, code actions, and AI translation directly in your editor.
---

## Quick Start

```bash
# Initialize TypeGlot in your project
npx typeglot init

# Build typed translations
npx typeglot build

# Start development mode
npx typeglot dev
```

## Why TypeGlot?

Traditional i18n solutions often rely on cloud services that create **sync anxiety** — the constant worry about whether your local files match the remote state. They also lack true type safety, leaving you with magic strings that can silently break at runtime.

TypeGlot takes a different approach:

```typescript
// ❌ Traditional approach - magic strings, no type safety
t('user.welcome', { name: userName }); // typo? missing param? runtime error!

// ✅ TypeGlot approach - fully typed functions
m.user_welcome({ name: userName }); // autocomplete, compile-time errors
```

Your translations are **code**, and they deserve the same developer experience as the rest of your codebase.
