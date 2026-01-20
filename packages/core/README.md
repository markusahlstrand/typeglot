# @typeglot/core

Core logic for TypeGlot - config parsing, AST analysis, and AI prompting strategies.

## Installation

```bash
npm install @typeglot/core
```

## Usage

### Load configuration

```typescript
import { loadConfig } from '@typeglot/core';

const config = await loadConfig('./typeglot.config.json');
```

### Extract JSDoc context

```typescript
import { extractJSDocContext } from '@typeglot/core';

const context = await extractJSDocContext('./src/app.ts', 'welcome_message');
// Returns JSDoc comments for better AI translations
```

### AI Translation

```typescript
import { generateAIPrompt } from '@typeglot/core';

const prompt = generateAIPrompt({
  key: 'checkout_button',
  sourceText: 'Checkout',
  targetLocale: 'es',
  context: 'Button displayed when user finalizes their checkout',
});
```

## Features

- 🔧 Configuration management with validation
- 🌳 TypeScript AST analysis for JSDoc extraction
- 🤖 AI prompt generation for accurate translations
- 📦 Shared utilities for all TypeGlot packages

## Documentation

For complete documentation, visit [typeglot.ahlstrand.es](https://typeglot.ahlstrand.es)

## License

MIT
