# TypeGlot - Type-Safe i18n for VS Code

[![Version](https://img.shields.io/visual-studio-marketplace/v/typeglot.typeglot-vscode)](https://marketplace.visualstudio.com/items?itemName=typeglot.typeglot-vscode)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/typeglot.typeglot-vscode)](https://marketplace.visualstudio.com/items?itemName=typeglot.typeglot-vscode)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**The only i18n solution with full TypeScript support.** Git-native translations, inline previews, and AI-powered translation via GitHub Copilot.

## ✨ Why TypeGlot?

| Feature            | TypeGlot                            | Other i18n        |
| ------------------ | ----------------------------------- | ----------------- |
| **Type Safety**    | ✅ Full compile-time checking       | ❌ Magic strings  |
| **Git-Native**     | ✅ No cloud sync needed             | ⚠️ Requires sync  |
| **AI Translation** | ✅ Uses Copilot you already pay for | 💰 Extra cost     |
| **Context-Aware**  | ✅ JSDoc → AI prompt                | ❌ Manual context |
| **Cost**           | ✅ Free forever                     | 💰 $50-120/month  |

## Features

### 🔤 Inline Translation Previews (Ghost Text)

See your translations directly in the code as you type. The extension renders the translated text as subtle ghost text next to your translation keys.

```typescript
/** @desc Success message shown after the user saves their profile */
const msg = m.profile_save_success();  → "Profile saved successfully!"
```

### ⚡ Code Actions (Quick Fixes)

Missing translations? The extension provides intelligent code actions:

- **Create translation** - Add a new translation key when one is missing
- **Translate with AI** - Use GitHub Copilot to translate missing keys
- **Go to translation** - Jump directly to the JSON definition
- **Extract string** - Extract hardcoded strings into translation keys

### 🤖 AI-Powered Translation

Leverages VS Code's built-in Language Model API (GitHub Copilot) for context-aware translations:

- Automatically extracts JSDoc comments for translation context
- Preserves parameters like `{name}` and `{count}`
- Maintains tone and formality across languages

### 📊 Integrated Dashboard

A React-based webview panel showing:

- Translation progress per locale
- Missing translations overview
- One-click "Translate All" functionality

### 🔍 Diagnostics

Real-time warnings in your code:

- Missing translation keys (yellow squiggles)
- Incomplete translations (hints showing which locales are missing)

## Usage

### Writing Translations with Context

Use JSDoc comments to provide context for AI translations:

```typescript
/** @desc Button displayed when user finalizes their checkout */
const checkoutButton = m.checkout_now();

/**
 * @desc Error message when payment fails
 * @context Displayed in a modal dialog after payment failure
 */
const paymentError = m.payment_failed();
```

The extension extracts these comments and includes them in the AI prompt, resulting in more accurate translations.

### The Compiler Loop

1. **Write code** with a new translation key (e.g., `m.new_feature()`)
2. **See the warning** - Extension flags missing keys
3. **Quick Fix** - Click the lightbulb or press `Cmd+.`
4. **AI translates** - The key is translated to all target locales
5. **Types update** - The `typeglot --watch` process regenerates types
6. **TypeScript recognizes** - Full autocomplete and type checking

## Commands

| Command                                   | Keybinding    | Description                   |
| ----------------------------------------- | ------------- | ----------------------------- |
| `TypeGlot: Translate Key with AI`         | `Cmd+Shift+T` | Translate the key at cursor   |
| `TypeGlot: Open Translation Dashboard`    | -             | Open the webview dashboard    |
| `TypeGlot: Refresh Decorations`           | -             | Refresh inline previews       |
| `TypeGlot: Go to Translation`             | -             | Navigate to JSON definition   |
| `TypeGlot: Extract String to Translation` | -             | Extract selected string       |
| `TypeGlot: Translate All Missing`         | -             | Translate all incomplete keys |

## Configuration

| Setting                           | Default     | Description                              |
| --------------------------------- | ----------- | ---------------------------------------- |
| `typeglot.showInlineTranslations` | `true`      | Show ghost text previews                 |
| `typeglot.previewLocale`          | `"en"`      | Locale to show in previews               |
| `typeglot.aiProvider`             | `"copilot"` | AI provider (copilot, openai, anthropic) |
| `typeglot.highlightMissingKeys`   | `true`      | Show warnings for missing keys           |
| `typeglot.autoDetectContext`      | `true`      | Extract JSDoc for AI context             |
| `typeglot.decorationStyle`        | `"inline"`  | How to display translations              |

## Development

### Building

```bash
# From monorepo root
pnpm vscode build

# Or from this directory
pnpm build
```

### Testing

Press `F5` in VS Code to launch an Extension Development Host with the extension loaded.

### Packaging

```bash
pnpm package
```

This creates a `.vsix` file for distribution.

## Architecture

```
src/
├── extension.ts           # Main entry point, command registration
├── decorations.ts         # Inline ghost text rendering
├── code-actions.ts        # Quick fix provider
├── diagnostics.ts         # Warning/error provider
├── dashboard.ts           # Webview panel
└── services/
    ├── translation-service.ts      # AI translation via LM API
    └── translation-file-manager.ts # JSON file I/O and caching
```

## Requirements

- VS Code 1.108.0 or higher
- GitHub Copilot extension (for AI features)
- A TypeGlot project with `typeglot.config.json`

## Quick Start

1. **Install the extension**
2. **Initialize TypeGlot** in your project:
   ```bash
   npx typeglot init
   ```
3. **Start dev mode** (in terminal):
   ```bash
   npx typeglot dev
   ```
4. **Write code** with translation keys — see inline previews instantly!

## Learn More

- 📖 [Documentation](https://typeglot.dev)
- 🐛 [Report Issues](https://github.com/markusahlstrand/typeglot/issues)
- ⭐ [Star on GitHub](https://github.com/markusahlstrand/typeglot)

## License

MIT © [TypeGlot](https://typeglot.dev)
