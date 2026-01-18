# Translation Files

TypeGlot uses JSON files to store translations. This guide covers the file format and supported features.

## File Structure

Translation files are stored in the `localesDir` (default: `./locales`):

```
locales/
├── en.json    # Source locale (required)
├── es.json    # Spanish
├── fr.json    # French
├── de.json    # German
└── ja.json    # Japanese
```

The filename (without `.json`) is used as the locale code.

## Basic Format

Translation files are simple JSON objects mapping keys to values:

```json
{
  "hello": "Hello",
  "goodbye": "Goodbye",
  "thank_you": "Thank you"
}
```

## Nested Keys

You can organize translations with nested objects:

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  },
  "auth": {
    "login": "Log in",
    "logout": "Log out",
    "signup": "Sign up"
  }
}
```

These are flattened to dot-notation in the generated code:

```typescript
m.common_save();
m.common_cancel();
m.auth_login();
```

## Parameters (Interpolation)

Use `{paramName}` syntax for dynamic values:

```json
{
  "welcome": "Welcome, {name}!",
  "items_in_cart": "You have {count} items in your cart",
  "greeting": "Hello {firstName} {lastName}"
}
```

Generated TypeScript:

```typescript
export function welcome(params: { name: string }): string;
export function items_in_cart(params: { count: string }): string;
export function greeting(params: { firstName: string; lastName: string }): string;
```

## Pluralization

Use ICU MessageFormat syntax for pluralization:

```json
{
  "items_count": "{count, plural, one {# item} other {# items}}",
  "messages": "{count, plural, =0 {No messages} one {# message} other {# messages}}"
}
```

The `#` symbol is replaced with the count value.

### Plural Categories

| Category | Description        | Example Languages |
| -------- | ------------------ | ----------------- |
| `zero`   | Zero items         | Arabic            |
| `one`    | Singular           | English, Spanish  |
| `two`    | Dual               | Arabic, Hebrew    |
| `few`    | Few items          | Russian, Polish   |
| `many`   | Many items         | Russian, Polish   |
| `other`  | Default (required) | All               |

Example with multiple categories:

```json
{
  "apples": "{count, plural, =0 {No apples} one {One apple} few {{count} apples} many {{count} apples} other {{count} apples}}"
}
```

## Number and Date Formatting

Use ICU format for numbers and dates:

```json
{
  "price": "Price: {amount, number, currency}",
  "date": "Created on {date, date, medium}",
  "percent": "{value, number, percent}"
}
```

## Select (Gender/Variants)

Use select for gender or variant-based text:

```json
{
  "notification": "{gender, select, male {He commented} female {She commented} other {They commented}} on your post"
}
```

## Best Practices

### Use Descriptive Keys

```json
// ❌ Bad
{
  "msg1": "Welcome",
  "btn": "Submit"
}

// ✅ Good
{
  "homepage_welcome_message": "Welcome",
  "contact_form_submit_button": "Submit"
}
```

### Keep Keys Flat When Possible

Deep nesting can make keys unwieldy:

```json
// ❌ Too nested
{
  "pages": {
    "settings": {
      "account": {
        "profile": {
          "name_label": "Name"
        }
      }
    }
  }
}

// ✅ Better
{
  "settings_profile_name_label": "Name"
}
```

### Include Context in Keys

```json
{
  "save_button": "Save", // Generic save
  "save_draft_button": "Save Draft", // Specific context
  "save_settings_button": "Save Settings"
}
```

## File Encoding

Always use UTF-8 encoding for translation files to properly support all languages and special characters.
