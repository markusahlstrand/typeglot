# Configuration

Complete reference for TypeGlot configuration options.

## Configuration File

TypeGlot looks for configuration in these locations (in order):

1. `typeglot.config.json`
2. `typeglot.config.js`
3. `.typeglotrc`

## Full Configuration

```json
{
  "sourceLocale": "en",
  "targetLocales": ["es", "fr", "de", "ja", "zh"],
  "localesDir": "./locales",
  "outputDir": "./src/generated/i18n",
  "include": ["src/**/*.{ts,tsx,js,jsx}"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"],
  "ai": {
    "provider": "openai",
    "model": "gpt-4",
    "apiKey": "${OPENAI_API_KEY}",
    "batchSize": 10,
    "concurrency": 3
  },
  "dev": {
    "port": 3333,
    "open": true,
    "debounce": 300,
    "verbose": false
  }
}
```

## Options Reference

### sourceLocale

- **Type:** `string`
- **Default:** `"en"`

The primary language for your translations. This is the locale that serves as the source of truth.

```json
{
  "sourceLocale": "en"
}
```

### targetLocales

- **Type:** `string[]`
- **Default:** `[]`

Languages to translate into. Used by the `translate` command.

```json
{
  "targetLocales": ["es", "fr", "de", "ja"]
}
```

### localesDir

- **Type:** `string`
- **Default:** `"./locales"`

Directory containing translation JSON files. Relative to project root.

```json
{
  "localesDir": "./translations"
}
```

### outputDir

- **Type:** `string`
- **Default:** `"./src/generated/i18n"`

Directory for generated TypeScript files. Relative to project root.

```json
{
  "outputDir": "./src/i18n"
}
```

### include

- **Type:** `string[]`
- **Default:** `["src/**/*.{ts,tsx,js,jsx}"]`

Glob patterns for files to scan for JSDoc context extraction.

```json
{
  "include": ["src/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"]
}
```

### exclude

- **Type:** `string[]`
- **Default:** `["node_modules", "dist"]`

Glob patterns for files to exclude from scanning.

```json
{
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

### ai

AI translation configuration.

#### ai.provider

- **Type:** `"openai" | "anthropic" | "copilot"`
- **Default:** `"openai"`

The AI service to use for translations.

#### ai.model

- **Type:** `string`
- **Default:** varies by provider

The model to use. Examples:

- OpenAI: `"gpt-4"`, `"gpt-3.5-turbo"`
- Anthropic: `"claude-3-opus"`, `"claude-3-sonnet"`

#### ai.apiKey

- **Type:** `string`
- **Default:** `undefined`

API key for the AI provider. Supports environment variable interpolation.

```json
{
  "ai": {
    "apiKey": "${OPENAI_API_KEY}"
  }
}
```

#### ai.batchSize

- **Type:** `number`
- **Default:** `10`

Number of keys to translate in a single API request.

#### ai.concurrency

- **Type:** `number`
- **Default:** `3`

Number of parallel API requests.

### dev

Development mode configuration.

#### dev.port

- **Type:** `number`
- **Default:** `3333`

Port for the development dashboard.

#### dev.open

- **Type:** `boolean`
- **Default:** `true`

Automatically open the dashboard in the browser.

#### dev.debounce

- **Type:** `number`
- **Default:** `300`

Debounce time in milliseconds for file watching.

#### dev.verbose

- **Type:** `boolean`
- **Default:** `false`

Enable verbose logging in development mode.

## JavaScript Configuration

For dynamic configuration, use `typeglot.config.js`:

```javascript
// typeglot.config.js
export default {
  sourceLocale: 'en',
  targetLocales: process.env.TARGET_LOCALES?.split(',') || ['es', 'fr'],
  localesDir: './locales',
  outputDir: './src/generated/i18n',
  ai: {
    provider: process.env.AI_PROVIDER || 'openai',
    apiKey: process.env.OPENAI_API_KEY,
  },
};
```

## Environment Variables

Reference environment variables in JSON config with `${VAR_NAME}` syntax:

```json
{
  "ai": {
    "apiKey": "${OPENAI_API_KEY}",
    "model": "${AI_MODEL}"
  }
}
```

### Common Environment Variables

| Variable            | Description             |
| ------------------- | ----------------------- |
| `OPENAI_API_KEY`    | OpenAI API key          |
| `ANTHROPIC_API_KEY` | Anthropic API key       |
| `TYPEGLOT_CONFIG`   | Custom config file path |

## TypeScript Types

```typescript
import type { TypeGlotConfig } from '@typeglot/core';

const config: TypeGlotConfig = {
  sourceLocale: 'en',
  targetLocales: ['es', 'fr'],
  // ...
};
```

## Validation

Configuration is validated using Zod. Invalid config will throw an error:

```
Error: Invalid configuration
  - targetLocales: Expected array, received string
```

## Examples

### Minimal Config

```json
{
  "sourceLocale": "en",
  "targetLocales": ["es"]
}
```

### Full Config

```json
{
  "sourceLocale": "en",
  "targetLocales": ["es", "fr", "de", "ja", "zh", "ko", "pt", "it"],
  "localesDir": "./locales",
  "outputDir": "./src/generated/i18n",
  "include": ["src/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"],
  "ai": {
    "provider": "openai",
    "model": "gpt-4",
    "apiKey": "${OPENAI_API_KEY}",
    "batchSize": 10,
    "concurrency": 3
  },
  "dev": {
    "port": 3333,
    "open": true,
    "debounce": 300
  }
}
```

### Monorepo Config

```json
{
  "sourceLocale": "en",
  "targetLocales": ["es", "fr"],
  "localesDir": "../../shared/locales",
  "outputDir": "./src/generated/i18n",
  "include": ["../../packages/*/src/**/*.{ts,tsx}"]
}
```
