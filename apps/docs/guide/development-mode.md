# Development Mode

TypeGlot's development mode provides a seamless workflow for managing translations during development.

## Starting Development Mode

```bash
npx typeglot dev
```

This command:

1. Compiles all translation files
2. Watches for changes in `locales/*.json`
3. Automatically recompiles on changes
4. Launches the local dashboard at `http://localhost:3333`

## File Watching

The watcher monitors your locales directory:

```
[typeglot] Watching for changes in ./locales
[typeglot] File changed: en.json
[typeglot] ✓ Compiled 3 files
```

### What Triggers Recompilation

- Adding a new key to any locale file
- Modifying an existing translation
- Adding a new locale file
- Deleting a locale file

### Debouncing

Multiple rapid changes are debounced to prevent excessive recompilation:

```json
// typeglot.config.json
{
  "dev": {
    "debounce": 300 // ms
  }
}
```

## Local Dashboard

The dashboard provides a visual interface for managing translations.

### Dashboard URL

By default: `http://localhost:3333`

Change the port:

```bash
npx typeglot dev --port 4000
```

### Disable Dashboard

Run without the UI:

```bash
npx typeglot dev --no-ui
```

### Dashboard Features

#### Overview Page

- Total translation keys
- Number of configured locales
- Missing translation count
- Quick actions

#### Translations Table

- View all keys and their translations
- Filter by locale
- Search by key or value
- Edit translations inline
- Highlight missing translations

#### Settings

- Configure source/target locales
- Set AI provider
- Manage API keys

## Watch Mode Without Dashboard

If you only want file watching and compilation:

```bash
npx typeglot build --watch
```

## Integration with Other Tools

### Vite

TypeGlot works seamlessly with Vite's HMR:

```typescript
// vite.config.ts
export default defineConfig({
  // Your Vite config
});

// When typeglot recompiles, Vite detects the change
// and hot-reloads your app automatically
```

### webpack

For webpack, ensure generated files are watched:

```javascript
// webpack.config.js
module.exports = {
  watchOptions: {
    ignored: /node_modules/,
    // Don't ignore generated i18n files
  },
};
```

### Next.js

Next.js automatically picks up changes to generated files in development mode.

## VS Code Integration

The VS Code extension enhances development mode:

1. **Inline Previews**: See translations directly in your code
2. **Code Actions**: Quick fixes for missing translations
3. **Dashboard Link**: Open dashboard from command palette

### Commands

- `TypeGlot: Open Translation Dashboard` — Opens `localhost:3333`
- `TypeGlot: Refresh Translation Decorations` — Update inline previews

## Terminal Output

Development mode provides helpful terminal output:

```
🌐 Starting TypeGlot development mode...

✓ Configuration loaded
✓ Initial compilation complete (15 keys)
✓ Watching for changes in ./locales

📊 Development UI available at http://localhost:3333

Press Ctrl+C to stop
```

### Verbose Mode

For more detailed output:

```bash
npx typeglot dev --verbose
```

```
[typeglot] Loading configuration from ./typeglot.config.json
[typeglot] Source locale: en
[typeglot] Target locales: es, fr, de
[typeglot] Compiling locales/en.json...
[typeglot] Generated: src/generated/i18n/messages.ts (15 keys)
[typeglot] Generated: src/generated/i18n/en.ts (15 keys)
[typeglot] Generated: src/generated/i18n/es.ts (15 keys)
[typeglot] Generated: src/generated/i18n/fr.ts (15 keys)
[typeglot] Generated: src/generated/i18n/index.ts
```

## Error Handling

### Invalid JSON

If a locale file has invalid JSON:

```
[typeglot] ✗ Error in locales/es.json
  Unexpected token at line 5, column 12

  Waiting for file to be fixed...
```

TypeGlot continues watching and recompiles when the file is fixed.

### Missing Source Locale

```
[typeglot] ✗ Source locale file not found: locales/en.json
  Create this file to start using TypeGlot
```

## Performance

Development mode is optimized for fast feedback:

- **Incremental compilation**: Only recompiles changed files
- **In-memory caching**: Parsed AST is cached
- **Parallel processing**: Multiple files compiled simultaneously

Typical recompilation time: **50-200ms**

## Configuration

Full development mode options:

```json
// typeglot.config.json
{
  "dev": {
    "port": 3333,
    "open": true, // Auto-open browser
    "debounce": 300, // Debounce time in ms
    "verbose": false
  }
}
```
