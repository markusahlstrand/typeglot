# AI Translation

TypeGlot integrates with AI providers to automatically generate translations while preserving context and nuance.

## Overview

Unlike traditional translation services, TypeGlot sends **rich context** to the AI:

1. The source text to translate
2. JSDoc/TSDoc comments describing the usage
3. Parameter information
4. File context (optional)

This results in more accurate, contextually appropriate translations.

## Configuration

Configure your AI provider in `typeglot.config.json`:

```json
{
  "sourceLocale": "en",
  "targetLocales": ["es", "fr", "de", "ja"],
  "ai": {
    "provider": "openai",
    "model": "gpt-4",
    "apiKey": "${OPENAI_API_KEY}"
  }
}
```

### Supported Providers

| Provider       | Models                         | API Key Variable    |
| -------------- | ------------------------------ | ------------------- |
| OpenAI         | gpt-4, gpt-3.5-turbo           | `OPENAI_API_KEY`    |
| Anthropic      | claude-3-opus, claude-3-sonnet | `ANTHROPIC_API_KEY` |
| GitHub Copilot | Uses VS Code LM API            | N/A (VS Code only)  |

### Environment Variables

Store API keys in environment variables, not in the config file:

```bash
# .env (add to .gitignore!)
OPENAI_API_KEY=sk-...
```

Reference them in the config:

```json
{
  "ai": {
    "apiKey": "${OPENAI_API_KEY}"
  }
}
```

## Usage

### Translate All Missing Keys

```bash
npx @typeglot/cli translate
```

This will:

1. Scan source locale for all keys
2. Find keys missing in target locales
3. Extract JSDoc context from source code
4. Generate translations using AI
5. Write to target locale files

### Translate Specific Keys

```bash
npx @typeglot/cli translate --key checkout_button
npx @typeglot/cli translate --key "user.*"  # Glob patterns
```

### Translate to Specific Locales

```bash
npx @typeglot/cli translate --target es fr
```

### Dry Run

Preview what would be translated without making changes:

```bash
npx @typeglot/cli translate --dry-run
```

## Context Extraction

TypeGlot extracts context from your source code to improve translation quality.

### JSDoc Comments

```typescript
/** @desc Call-to-action button for completing purchase */
const checkoutButton = m.checkout_now;
```

The AI receives:

```
Context: "Call-to-action button for completing purchase"
Text: "Checkout Now"
```

### Multiple Tags

```typescript
/**
 * @desc Error message when payment fails
 * @context Shown in a modal dialog after checkout
 * @maxLength 50
 */
const paymentError = m.payment_failed;
```

### Supported Tags

| Tag          | Description                           |
| ------------ | ------------------------------------- |
| `@desc`      | Description of the text's purpose     |
| `@context`   | Where/when the text appears           |
| `@example`   | Example usage or screenshot reference |
| `@maxLength` | Maximum character limit               |

## How the Prompt Works

TypeGlot builds a detailed prompt for the AI:

```
Translate the following text from English to Spanish.

## Context from Developer
Description: Call-to-action button for completing purchase
Usage Context: Shown in a modal dialog after checkout
Maximum Length: 50 characters

## Text to Translate
Key: checkout_now
Source (en): Checkout Now

## Parameters
The following parameters must be preserved in the translation:
- {count} (number)

## Instructions
1. Preserve all parameter placeholders like {name} exactly as they appear
2. Maintain the same tone and formality level
3. Keep any HTML/Markdown formatting intact
4. Return ONLY the translated text, no explanations
```

## Batch Translation

For efficiency, TypeGlot batches translation requests:

```typescript
// typeglot.config.json
{
  "ai": {
    "batchSize": 10,  // Translate 10 keys per request
    "concurrency": 3  // 3 parallel requests
  }
}
```

## Quality Review

AI translations should always be reviewed. TypeGlot supports this workflow:

### 1. Generate Draft Translations

```bash
npx @typeglot/cli translate --target es
```

### 2. Review in Dashboard

```bash
npx @typeglot/cli dev
```

Open `http://localhost:3333` to review and edit translations.

### 3. Commit Changes

```bash
git add locales/
git commit -m "Add Spanish translations for checkout flow"
```

## CI/CD Integration

Automate translation in your CI pipeline:

```yaml
# .github/workflows/translate.yml
name: Auto-translate

on:
  push:
    paths:
      - 'locales/en.json'

jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm install

      - name: Translate missing keys
        run: npx @typeglot/cli translate
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

      - name: Create PR
        uses: peter-evans/create-pull-request@v5
        with:
          title: 'chore: Update translations'
          commit-message: 'Add AI-generated translations'
```

## Best Practices

### 1. Always Add Context

Translations without context are often incorrect:

```typescript
// ❌ No context - "Save" could be noun or verb
const btn = m.save;

// ✅ With context - AI knows it's a verb
/** @desc Button to save the current document */
const btn = m.save;
```

### 2. Review Machine Translations

AI is good but not perfect. Always review:

- Technical terms
- Brand names
- Cultural references
- Humor or idioms

### 3. Use Consistent Terminology

Create a glossary for common terms:

```json
// typeglot.config.json
{
  "ai": {
    "glossary": {
      "checkout": "finalizar compra",
      "cart": "carrito"
    }
  }
}
```
