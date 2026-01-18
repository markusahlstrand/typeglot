# @typeglot/core

The core package provides shared logic used by all other TypeGlot packages.

## Installation

```bash
npm install @typeglot/core
# or
pnpm add @typeglot/core
```

## Features

- Configuration parsing and validation
- AST analysis for JSDoc extraction
- AI prompt building strategies
- Type definitions

## Configuration Loading

```typescript
import { loadConfig, saveConfig, validateConfig } from '@typeglot/core';

// Load config from project root
const config = await loadConfig('/path/to/project');

// Validate a config object
const validated = validateConfig({
  sourceLocale: 'en',
  targetLocales: ['es', 'fr'],
});

// Save config to file
await saveConfig('/path/to/project', config);
```

### Default Configuration

```typescript
import { DEFAULT_CONFIG } from '@typeglot/core';

console.log(DEFAULT_CONFIG);
// {
//   sourceLocale: 'en',
//   targetLocales: [],
//   localesDir: './locales',
//   outputDir: './src/generated/i18n',
//   include: ['src/**/*.{ts,tsx,js,jsx}'],
//   exclude: ['node_modules', 'dist'],
// }
```

## AST Analysis

### Extract JSDoc Context

```typescript
import { createProject, extractJSDocContext } from '@typeglot/core';

// Create a ts-morph project
const project = createProject('./tsconfig.json');

// Add source files
project.addSourceFilesAtPaths('src/**/*.ts');

// Extract JSDoc for a translation key
const context = extractJSDocContext(project, ['src/components/Button.tsx'], 'checkout_button');

console.log(context);
// {
//   description: 'Button for completing checkout',
//   context: 'Shown on cart page',
//   maxLength: 20
// }
```

### Find Translation Usages

```typescript
import { createProject, findTranslationUsages } from '@typeglot/core';

const project = createProject();
project.addSourceFilesAtPaths('src/**/*.ts');

const usages = findTranslationUsages(project, ['src/App.tsx']);

console.log(usages);
// [
//   { key: 'hello', filePath: 'src/App.tsx', line: 10, column: 5 },
//   { key: 'welcome', filePath: 'src/App.tsx', line: 15, column: 12 },
// ]
```

## AI Prompt Building

```typescript
import { buildTranslationPrompt, parseMessageParams } from '@typeglot/core';

// Parse parameters from a message
const params = parseMessageParams('Hello, {name}! You have {count} items.');
// [{ name: 'name', type: 'string' }, { name: 'count', type: 'string' }]

// Build a prompt for AI translation
const prompt = buildTranslationPrompt({
  sourceLocale: 'en',
  targetLocale: 'es',
  message: {
    key: 'welcome',
    value: 'Welcome, {name}!',
    params: [{ name: 'name', type: 'string' }],
  },
  jsDocContext: {
    description: 'Greeting shown after login',
  },
});
```

## Translation Providers

```typescript
import { BaseTranslationProvider, TranslationRequest, TranslationResult } from '@typeglot/core';

// Create a custom provider
class MyProvider extends BaseTranslationProvider {
  name = 'my-provider';

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const prompt = this.buildPrompt(request);
    // Call your AI service...
    return {
      key: request.message.key,
      sourceValue: request.message.value,
      translatedValue: '...',
      confidence: 0.95,
    };
  }
}
```

## Types

### TypeGlotConfig

```typescript
interface TypeGlotConfig {
  sourceLocale: string;
  targetLocales: string[];
  localesDir: string;
  outputDir: string;
  include: string[];
  exclude: string[];
  ai?: {
    provider: 'openai' | 'anthropic' | 'copilot';
    model?: string;
    apiKey?: string;
  };
}
```

### JSDocContext

```typescript
interface JSDocContext {
  description?: string;
  example?: string;
  context?: string;
  maxLength?: number;
}
```

### TranslationMessage

```typescript
interface TranslationMessage {
  key: string;
  value: string;
  params?: TranslationParam[];
  pluralization?: PluralForm[];
}
```

### TranslationRequest

```typescript
interface TranslationRequest {
  sourceLocale: string;
  targetLocale: string;
  message: TranslationMessage;
  jsDocContext?: JSDocContext;
  fileContext?: string;
}
```

### TranslationResult

```typescript
interface TranslationResult {
  key: string;
  sourceValue: string;
  translatedValue: string;
  confidence: number;
  notes?: string;
}
```

## Dependencies

- `ts-morph` — TypeScript AST manipulation
- `zod` — Schema validation
