# @typeglot/compiler

TypeGlot compiler - generates TypeScript functions from JSON translation files.

## Installation

```bash
npm install @typeglot/compiler
```

## Usage

```typescript
import { compile } from '@typeglot/compiler';

// Compile all translation files
await compile({
  sourceLocale: 'en',
  localesDir: './locales',
  outputDir: './src/generated/i18n',
});
```

### Watch mode

```typescript
import { watch } from '@typeglot/compiler';

// Watch for changes and recompile
const watcher = watch({
  sourceLocale: 'en',
  localesDir: './locales',
  outputDir: './src/generated/i18n',
});
```

## Features

- ⚡️ Fast compilation with minimal overhead
- 🔄 File watcher for development
- 📝 Generates fully typed TypeScript functions
- 🎯 Supports interpolation and pluralization
- 🌳 AST-based code generation

## Documentation

For complete documentation, visit [typeglot.ahlstrand.es](https://typeglot.ahlstrand.es)

## License

MIT
