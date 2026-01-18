# JSDoc Context

TypeGlot's killer feature is extracting JSDoc comments from your source code to provide context for AI translations. This guide covers how to write effective context annotations.

## Why Context Matters

Consider the English word "Save":

- **As a verb**: "Save this document" → Spanish: "Guardar"
- **As a noun**: "A big save by the goalkeeper" → Spanish: "Parada"
- **As a discount**: "Save 20% today" → Spanish: "Ahorra"

Without context, AI has to guess. With TypeGlot, you tell it exactly what you mean.

## Basic Usage

Add JSDoc comments directly above where you use a translation key:

```typescript
/** @desc Button to save the current document */
const saveButton = m.save;
```

The `@desc` tag tells the AI: "This is a button for saving documents."

## Supported Tags

### @desc (Description)

The primary tag for describing what the text means:

```typescript
/** @desc Welcome message shown to new users after signup */
const welcome = m.welcome_message;
```

### @context

Describes where or when the text appears:

```typescript
/**
 * @desc Add to cart button
 * @context Product detail page, below the price
 */
const addToCart = m.add_to_cart;
```

### @example

Provides examples or references:

```typescript
/**
 * @desc Error message for invalid email
 * @example "Please enter a valid email address"
 */
const emailError = m.invalid_email;
```

### @maxLength

Specifies character limits (useful for UI constraints):

```typescript
/**
 * @desc Navigation menu item
 * @maxLength 15
 */
const menuItem = m.dashboard;
```

## Combining Tags

Use multiple tags for rich context:

```typescript
/**
 * @desc Call-to-action for starting free trial
 * @context Hero section on pricing page
 * @example "Start your free trial"
 * @maxLength 25
 */
const ctaButton = m.start_free_trial;
```

## Placement Rules

### Direct Annotation

The JSDoc must be directly above the usage:

```typescript
// ✅ Correct - JSDoc directly above
/** @desc Login button */
const loginBtn = m.login;

// ❌ Wrong - JSDoc separated by blank line
/** @desc Login button */

const loginBtn = m.login;

// ❌ Wrong - JSDoc on wrong line
const loginBtn = /** @desc Login button */ m.login;
```

### Variable Declarations

Works with all variable declaration styles:

```typescript
/** @desc Username label */
const label = m.username;

/** @desc Password placeholder */
let placeholder = m.enter_password;
```

### In JSX/TSX

```tsx
function LoginForm() {
  return (
    <form>
      {/** @desc Form title */}
      <h1>{m.login_title}</h1>

      <label>
        {/** @desc Username field label */}
        {m.username_label}
      </label>

      {/** @desc Submit button text */}
      <button type="submit">{m.login_button}</button>
    </form>
  );
}
```

### With Function Arguments

```typescript
function showNotification(message: string) { ... }

/** @desc Success message after saving */
showNotification(m.save_success);
```

## AST Analysis

TypeGlot uses `ts-morph` to parse your TypeScript/JavaScript files and extract JSDoc comments. It looks for:

1. **Property access patterns**: `m.key_name`
2. **Function call patterns**: `t('key_name')`

Then it traverses the AST upward to find associated JSDoc comments.

## Scanning Source Files

Configure which files to scan in `typeglot.config.json`:

```json
{
  "include": ["src/**/*.{ts,tsx,js,jsx}"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

## Context in the AI Prompt

When you run `typeglot translate`, the extracted context is included in the prompt:

```
## Context from Developer
Description: Call-to-action for starting free trial
Usage Context: Hero section on pricing page
Example: "Start your free trial"
Maximum Length: 25 characters

## Text to Translate
Key: start_free_trial
Source (en): Start Free Trial
```

## Best Practices

### 1. Be Specific

```typescript
// ❌ Too vague
/** @desc A button */
const btn = m.submit;

// ✅ Specific and helpful
/** @desc Form submission button on contact page */
const btn = m.submit;
```

### 2. Describe the UI Element

```typescript
/**
 * @desc Tooltip shown when hovering over the help icon
 * @context Appears next to complex form fields
 */
const tooltip = m.help_tooltip;
```

### 3. Note Formality Level

```typescript
/**
 * @desc Legal disclaimer text
 * @context Footer of checkout page, must be formal
 */
const disclaimer = m.legal_disclaimer;
```

### 4. Mention Variables

```typescript
/**
 * @desc Greeting with user's first name
 * The {name} parameter will be the user's display name
 */
const greeting = m.hello_user({ name });
```

### 5. Include Cultural Notes

```typescript
/**
 * @desc Holiday greeting
 * @context Banner for US Thanksgiving promotion
 * Note: May not be applicable in all regions
 */
const holidayBanner = m.thanksgiving_sale;
```

## Troubleshooting

### Context Not Detected

If your JSDoc isn't being picked up:

1. Ensure the comment is directly above the usage
2. Check that the file matches `include` patterns
3. Run `typeglot build --verbose` to see what's being scanned

### Multiple Usages

If a key is used multiple times with different contexts, TypeGlot uses the first one found. Consider adding context to the most representative usage.
