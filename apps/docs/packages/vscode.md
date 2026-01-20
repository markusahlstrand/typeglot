# TypeGlot VS Code Extension

The VS Code extension provides in-editor features for working with TypeGlot translations.

## Installation

### Direct Download

<a href="/typeglot-vscode-0.1.0.vsix" download class="vp-button">
  ⬇️ Download TypeGlot v0.1.0 (.vsix)
</a>

<br/><br/>

To install: Open VS Code → Command Palette (`Cmd/Ctrl + Shift + P`) → "Extensions: Install from VSIX..." → Select the downloaded file.

### From VS Code Marketplace

Search for "TypeGlot" in the VS Code Extensions view (`Cmd/Ctrl + Shift + X`).

### From Source

```bash
cd packages/vscode
pnpm install
pnpm run package
```

Then install the `.vsix` file from the command palette: "Extensions: Install from VSIX..."

## Features

### Inline Translation Decorations

See translation values directly in your code:

```typescript
const greeting = m.welcome; // → "Welcome, {name}!"
```

The translated value appears as a subtle annotation after the code.

### Code Actions

Quick fixes appear when your cursor is on a translation key:

- **Translate with AI** — Generate translations for the key
- **Go to Translation** — Jump to the locale file
- **Extract String** — Convert a hardcoded string to a translation key

### Commands

Access commands via the Command Palette (`Cmd/Ctrl + Shift + P`):

| Command                                     | Description                  |
| ------------------------------------------- | ---------------------------- |
| `TypeGlot: Initialize Project`              | Set up TypeGlot in workspace |
| `TypeGlot: Translate Key with AI`           | Generate AI translation      |
| `TypeGlot: Open Translation Dashboard`      | Launch local UI              |
| `TypeGlot: Refresh Translation Decorations` | Update inline previews       |

## Configuration

### Settings

Configure the extension in VS Code settings:

```json
{
  "typeglot.showInlineTranslations": true,
  "typeglot.previewLocale": "en",
  "typeglot.aiProvider": "copilot"
}
```

| Setting                  | Type    | Default     | Description                         |
| ------------------------ | ------- | ----------- | ----------------------------------- |
| `showInlineTranslations` | boolean | `true`      | Show inline translation decorations |
| `previewLocale`          | string  | `"en"`      | Locale to preview in decorations    |
| `aiProvider`             | string  | `"copilot"` | AI provider for translations        |

### AI Providers

| Provider    | Requirements                       |
| ----------- | ---------------------------------- |
| `copilot`   | GitHub Copilot extension installed |
| `openai`    | `OPENAI_API_KEY` in environment    |
| `anthropic` | `ANTHROPIC_API_KEY` in environment |

## Activation

The extension activates when:

- A `typeglot.config.json` file exists in the workspace
- A `.typeglotrc` file exists in the workspace

## Usage

### Viewing Translations

1. Open a TypeScript/JavaScript file
2. Hover over `m.key_name` to see the translation
3. Or view inline decorations (if enabled)

### Translating a Key

1. Place cursor on a translation key
2. Press `Cmd/Ctrl + .` to open Quick Fix menu
3. Select "TypeGlot: Translate with AI"
4. Enter target locales when prompted

### Opening the Dashboard

1. Open Command Palette (`Cmd/Ctrl + Shift + P`)
2. Type "TypeGlot: Open Translation Dashboard"
3. The dashboard opens in your browser

## Development

### Building

```bash
cd packages/vscode
pnpm run build
```

### Watch Mode

```bash
pnpm run watch
```

### Debugging

1. Open the `packages/vscode` folder in VS Code
2. Press `F5` to launch Extension Development Host
3. Test the extension in the new window

### Packaging

```bash
pnpm run package
```

Creates `typeglot-vscode-{version}.vsix`.

## Extension Manifest

Key contributions in `package.json`:

```json
{
  "contributes": {
    "commands": [
      {
        "command": "typeglot.init",
        "title": "TypeGlot: Initialize Project"
      }
    ],
    "configuration": {
      "title": "TypeGlot",
      "properties": {
        "typeglot.showInlineTranslations": {
          "type": "boolean",
          "default": true
        }
      }
    }
  }
}
```

## Architecture

```
packages/vscode/
├── src/
│   ├── extension.ts      # Entry point, activation
│   ├── decorations.ts    # Inline translation previews
│   └── code-actions.ts   # Quick fix provider
├── package.json          # Extension manifest
└── tsconfig.json
```

### Extension Entry Point

```typescript
// extension.ts
export function activate(context: vscode.ExtensionContext) {
  // Register commands
  // Set up decorations
  // Initialize code actions
}

export function deactivate() {
  // Cleanup
}
```

### Decoration Provider

```typescript
// decorations.ts
export class TranslationDecorator {
  updateDecorations(editor: vscode.TextEditor) {
    // Find m.key patterns
    // Load translation values
    // Apply decorations
  }
}
```

### Code Action Provider

```typescript
// code-actions.ts
export class TranslationCodeActionProvider {
  provideCodeActions(document, range) {
    // Detect translation keys
    // Offer quick fixes
  }
}
```

## Dependencies

- `@typeglot/core` — Shared logic
- `vscode` — VS Code API types
- `esbuild` — Bundling
