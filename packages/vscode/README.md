# TypeGlot VS Code Extension

The TypeGlot VS Code extension provides an integrated, developer-first internationalization experience directly within your editor. Never leave VS Code to manage translations again.

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

- VS Code 1.90.0 or higher
- GitHub Copilot extension (for AI features)
- A TypeGlot project with `typeglot.config.json` or `locales/` directory

## License

MIT
