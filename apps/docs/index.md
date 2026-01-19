---
layout: home

hero:
  name: TypeGlot
  text: The Type-Safe i18n Toolchain
  tagline: Best-in-class TypeScript support. 100% local. Zero fees. AI-powered translations using the tools you already pay for.
  image:
    src: /logo.svg
    alt: TypeGlot
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: How It Works
      link: /guide/how-it-works
    - theme: alt
      text: Compare Platforms
      link: /guide/comparison

features:
  - icon: 🔒
    title: True Type Safety
    details: The ONLY i18n solution with full compile-time type checking. Every key is a typed function with autocomplete and parameter validation.
  - icon: 📦
    title: Git-Native, Zero Sync
    details: No cloud services, no subscription fees, no sync conflicts. Your repo is the source of truth. Works 100% offline.
  - icon: 🤖
    title: Your AI, Supercharged
    details: Use GitHub Copilot, Claude, or ChatGPT—AI you already pay for. JSDoc context ensures perfect translations every time.
  - icon: 💰
    title: Free Forever
    details: No hidden costs, no per-seat pricing, no usage limits. Just install and build. Perfect for startups and open source.
  - icon: 🎨
    title: Beautiful Local UI
    details: Manage all your translations in a gorgeous dashboard that runs locally. No web login required.
  - icon: 💻
    title: Native VS Code Extension
    details: Inline previews, quick actions, AI translation, and auto-fixes. The best i18n developer experience, period.
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

Tired of paying $120/month for cloud translation platforms that give you magic strings and sync headaches? **TypeGlot is different.**

### 🎯 Best-in-Breed Type Safety

TypeGlot is the **only** i18n solution that gives you real TypeScript types:

```typescript
// ❌ Traditional i18n - magic strings, runtime errors
t('user.welcome', { name: userName }); // typo? wrong param? 💥 at runtime

// ✅ TypeGlot - fully typed, compile-time safe
m.user_welcome({ name: userName }); // ✨ autocomplete, type checking, refactoring
```

### 💎 Zero Vendor Lock-In, Zero Fees

- **No cloud sync** - Your Git repo is the source of truth
- **No subscription fees** - Install once, use forever
- **No sync anxiety** - What you commit is what runs in production
- **Works offline** - No internet? No problem.

### 🧠 Context is King

Traditional platforms make translators guess. TypeGlot gives AI the full picture:

```typescript
/**
 * @desc Button shown in checkout. User clicks to finalize purchase.
 * Should create urgency and be action-oriented.
 * @example "Complete Your Order", "Finish Purchase Now"
 */
const checkoutButton = m.checkout_complete();
```

Your JSDoc comments travel with the key, giving AI models the context they need for **perfect** translations.

### 🚀 Built for Developers

- **Watch mode** - instant recompilation
- **Local UI** - beautiful dashboard that runs locally
- **VS Code extension** - inline previews, AI translation, quick fixes
- **CLI-first** - automate everything in CI/CD

## Better Than Cloud Platforms?

For **developers** who value type safety and Git workflows? **Absolutely.**

For large enterprises needing translation agencies and complex workflows? Maybe not yet.

[See honest comparison with Lokalise, Crowdin, Phrase, and others →](/guide/comparison)
