# Core API

API reference for the `@typeglot/core` package.

## Configuration

### loadConfig

Load TypeGlot configuration from a project directory.

```typescript
function loadConfig(projectRoot: string): Promise<TypeGlotConfig>;
```

**Parameters:**

- `projectRoot` — Absolute path to the project directory

**Returns:** Promise resolving to the parsed configuration

**Example:**

```typescript
import { loadConfig } from '@typeglot/core';

const config = await loadConfig('/path/to/project');
console.log(config.sourceLocale); // 'en'
```

---

### saveConfig

Save configuration to a file.

```typescript
function saveConfig(projectRoot: string, config: TypeGlotConfig, fileName?: string): Promise<void>;
```

**Parameters:**

- `projectRoot` — Project directory path
- `config` — Configuration object
- `fileName` — Config filename (default: `typeglot.config.json`)

**Example:**

```typescript
import { saveConfig } from '@typeglot/core';

await saveConfig('/path/to/project', {
  sourceLocale: 'en',
  targetLocales: ['es', 'fr'],
  localesDir: './locales',
  outputDir: './src/generated/i18n',
});
```

---

### validateConfig

Validate and parse a configuration object.

```typescript
function validateConfig(config: unknown): TypeGlotConfig;
```

**Parameters:**

- `config` — Raw configuration object

**Returns:** Validated TypeGlotConfig

**Throws:** ZodError if validation fails

**Example:**

```typescript
import { validateConfig } from '@typeglot/core';

try {
  const config = validateConfig({
    sourceLocale: 'en',
    targetLocales: ['es'],
  });
} catch (error) {
  console.error('Invalid config:', error);
}
```

---

### DEFAULT_CONFIG

Default configuration values.

```typescript
const DEFAULT_CONFIG: TypeGlotConfig = {
  sourceLocale: 'en',
  targetLocales: [],
  localesDir: './locales',
  outputDir: './src/generated/i18n',
  include: ['src/**/*.{ts,tsx,js,jsx}'],
  exclude: ['node_modules', 'dist'],
};
```

---

## AST Analysis

### createProject

Create a ts-morph Project for AST analysis.

```typescript
function createProject(tsConfigPath?: string): Project;
```

**Parameters:**

- `tsConfigPath` — Optional path to tsconfig.json

**Returns:** ts-morph Project instance

**Example:**

```typescript
import { createProject } from '@typeglot/core';

const project = createProject('./tsconfig.json');
project.addSourceFilesAtPaths('src/**/*.ts');
```

---

### extractJSDocContext

Extract JSDoc context for a translation key from source files.

```typescript
function extractJSDocContext(
  project: Project,
  sourceFiles: string[],
  translationKey: string
): JSDocContext | undefined;
```

**Parameters:**

- `project` — ts-morph Project instance
- `sourceFiles` — Array of file paths to search
- `translationKey` — The translation key to find context for

**Returns:** JSDocContext object or undefined

**Example:**

```typescript
import { createProject, extractJSDocContext } from '@typeglot/core';

const project = createProject();
project.addSourceFilesAtPaths('src/**/*.ts');

const context = extractJSDocContext(project, ['src/Button.tsx'], 'checkout_button');

// { description: 'Button for checkout', maxLength: 20 }
```

---

### findTranslationUsages

Find all usages of translation keys in source files.

```typescript
function findTranslationUsages(project: Project, sourceFiles: string[]): TranslationUsage[];
```

**Parameters:**

- `project` — ts-morph Project instance
- `sourceFiles` — Array of file paths to search

**Returns:** Array of TranslationUsage objects

**Example:**

```typescript
import { createProject, findTranslationUsages } from '@typeglot/core';

const project = createProject();
project.addSourceFilesAtPaths('src/**/*.ts');

const usages = findTranslationUsages(project, ['src/App.tsx']);
// [{ key: 'hello', filePath: 'src/App.tsx', line: 10, column: 5 }]
```

---

### getUsedTranslationKeys

Get all unique translation keys used in source files.

```typescript
function getUsedTranslationKeys(project: Project, sourceFiles: string[]): Set<string>;
```

**Parameters:**

- `project` — ts-morph Project instance
- `sourceFiles` — Array of file paths to search

**Returns:** Set of translation key strings

---

## AI Prompts

### buildTranslationPrompt

Build a prompt for AI translation with context.

```typescript
function buildTranslationPrompt(request: TranslationRequest): string;
```

**Parameters:**

- `request` — Translation request object

**Returns:** Formatted prompt string

**Example:**

```typescript
import { buildTranslationPrompt } from '@typeglot/core';

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

---

### parseMessageParams

Extract parameters from a translation message.

```typescript
function parseMessageParams(value: string): Array<{ name: string; type: 'string' | 'number' }>;
```

**Parameters:**

- `value` — Translation message string

**Returns:** Array of parameter objects

**Example:**

```typescript
import { parseMessageParams } from '@typeglot/core';

const params = parseMessageParams('Hello, {name}! You have {count} items.');
// [{ name: 'name', type: 'string' }, { name: 'count', type: 'string' }]
```

---

## Translation Providers

### BaseTranslationProvider

Abstract base class for implementing translation providers.

```typescript
abstract class BaseTranslationProvider implements TranslationProvider {
  abstract name: string;
  abstract translate(request: TranslationRequest): Promise<TranslationResult>;
  translateBatch(requests: TranslationRequest[]): Promise<TranslationResult[]>;
  protected buildPrompt(request: TranslationRequest): string;
}
```

**Example:**

```typescript
import { BaseTranslationProvider, TranslationRequest, TranslationResult } from '@typeglot/core';

class OpenAIProvider extends BaseTranslationProvider {
  name = 'openai';

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const prompt = this.buildPrompt(request);

    // Call OpenAI API...
    const response = await callOpenAI(prompt);

    return {
      key: request.message.key,
      sourceValue: request.message.value,
      translatedValue: response,
      confidence: 0.95,
    };
  }
}
```

---

### MockTranslationProvider

Mock provider for testing.

```typescript
class MockTranslationProvider extends BaseTranslationProvider {
  name = 'mock';
  translate(request: TranslationRequest): Promise<TranslationResult>;
}
```

Returns translations in format: `[{locale}] {original text}`

---

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

### TranslationParam

```typescript
interface TranslationParam {
  name: string;
  type: 'string' | 'number' | 'date';
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

### TranslationUsage

```typescript
interface TranslationUsage {
  key: string;
  filePath: string;
  line: number;
  column: number;
  context?: string;
}
```
