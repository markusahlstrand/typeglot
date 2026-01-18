# Compiler API

API reference for the `@typeglot/compiler` package.

## TypeGlotCompiler

Main compiler class for generating TypeScript from translation files.

### Constructor

```typescript
new TypeGlotCompiler(options: CompilerOptions)
```

**Parameters:**

```typescript
interface CompilerOptions {
  config: TypeGlotConfig; // TypeGlot configuration
  projectRoot: string; // Absolute path to project root
  verbose?: boolean; // Enable verbose logging
}
```

**Example:**

```typescript
import { TypeGlotCompiler } from '@typeglot/compiler';

const compiler = new TypeGlotCompiler({
  config: {
    sourceLocale: 'en',
    targetLocales: ['es', 'fr'],
    localesDir: './locales',
    outputDir: './src/generated/i18n',
  },
  projectRoot: process.cwd(),
  verbose: true,
});
```

---

### compile()

Compile all translation files to TypeScript.

```typescript
compile(): Promise<CompileResult[]>
```

**Returns:** Array of compilation results

**Example:**

```typescript
const results = await compiler.compile();

for (const result of results) {
  if (result.success) {
    console.log(`Generated: ${result.outputPath} (${result.keysCount} keys)`);
  } else {
    console.error(`Failed: ${result.outputPath}`, result.errors);
  }
}
```

---

### compileSingle()

Compile a single locale file.

```typescript
compileSingle(filePath: string): Promise<CompileResult>
```

**Parameters:**

- `filePath` — Path to the locale JSON file

**Returns:** Compilation result

**Example:**

```typescript
const result = await compiler.compileSingle('./locales/es.json');
```

---

## TranslationWatcher

File watcher for development mode.

### Constructor

```typescript
new TranslationWatcher(options: WatcherOptions)
```

**Parameters:**

```typescript
interface WatcherOptions extends CompilerOptions {
  onCompile?: (results: { success: boolean; path: string }[]) => void;
  onError?: (error: Error) => void;
}
```

**Example:**

```typescript
import { TranslationWatcher } from '@typeglot/compiler';

const watcher = new TranslationWatcher({
  config,
  projectRoot: process.cwd(),
  onCompile: (results) => {
    console.log(`Compiled ${results.length} files`);
  },
  onError: (error) => {
    console.error('Error:', error.message);
  },
});
```

---

### start()

Start watching for file changes.

```typescript
start(): Promise<void>
```

Performs initial compilation and then watches for changes.

---

### stop()

Stop watching.

```typescript
stop(): Promise<void>
```

---

## Parser Functions

### parseTranslationFile

Parse a JSON translation file.

```typescript
function parseTranslationFile(filePath: string): Promise<ParsedTranslations>;
```

**Parameters:**

- `filePath` — Path to JSON file

**Returns:** Flattened translations object

**Example:**

```typescript
import { parseTranslationFile } from '@typeglot/compiler';

const translations = await parseTranslationFile('./locales/en.json');
// { 'hello': 'Hello', 'user.name': 'Name' }
```

---

### parseParameters

Extract parameter names from a translation value.

```typescript
function parseParameters(value: string): string[];
```

**Parameters:**

- `value` — Translation message string

**Returns:** Array of parameter names

**Example:**

```typescript
import { parseParameters } from '@typeglot/compiler';

const params = parseParameters('Hello, {name}! Count: {count}');
// ['name', 'count']
```

---

## Generator Functions

### generateTypedFunctions

Generate TypeScript code for translation functions.

```typescript
function generateTypedFunctions(translations: ParsedTranslations, locale: string): string;
```

**Parameters:**

- `translations` — Parsed translations object
- `locale` — Source locale code

**Returns:** Generated TypeScript code as string

**Example:**

```typescript
import { generateTypedFunctions } from '@typeglot/compiler';

const code = generateTypedFunctions({ hello: 'Hello', welcome: 'Welcome, {name}!' }, 'en');

console.log(code);
// export function hello(): string { ... }
// export function welcome(params: { name: string }): string { ... }
```

---

## Types

### CompileResult

```typescript
interface CompileResult {
  success: boolean; // Whether compilation succeeded
  outputPath: string; // Path to generated file
  keysCount: number; // Number of translation keys
  errors?: string[]; // Error messages if failed
}
```

### ParsedTranslations

```typescript
type ParsedTranslations = Record<string, string>;
```

Flat object mapping translation keys to values. Nested keys are flattened with dot notation.

---

## Generated Code Structure

The compiler generates the following files:

### index.ts

Main entry point:

```typescript
export * from './messages.js';
export * as en from './en.js';
export * as es from './es.js';
export const availableLocales = ['en', 'es'] as const;
export type Locale = (typeof availableLocales)[number];
```

### messages.ts

Typed translation functions:

```typescript
export function setLocale(locale: Locale): void;
export function getLocale(): Locale;
export function loadMessages(messages: Record<string, string>): void;

export function hello(): string;
export function welcome(params: { name: string }): string;

export const m = { hello, welcome } as const;
```

### {locale}.ts

Locale-specific data:

```typescript
export const locale = 'es' as const;
export const messages = {
  hello: 'Hola',
  welcome: '¡Bienvenido, {name}!',
} as const;
export type MessageKey = keyof typeof messages;
```

---

## Usage Example

Complete example showing compilation workflow:

```typescript
import { TypeGlotCompiler, TranslationWatcher } from '@typeglot/compiler';
import { loadConfig } from '@typeglot/core';

async function main() {
  const config = await loadConfig(process.cwd());

  // One-time build
  const compiler = new TypeGlotCompiler({
    config,
    projectRoot: process.cwd(),
    verbose: true,
  });

  const results = await compiler.compile();
  console.log(`Built ${results.length} files`);

  // Or watch mode
  const watcher = new TranslationWatcher({
    config,
    projectRoot: process.cwd(),
    onCompile: () => console.log('Recompiled'),
  });

  await watcher.start();

  // Stop on SIGINT
  process.on('SIGINT', async () => {
    await watcher.stop();
    process.exit(0);
  });
}

main();
```
