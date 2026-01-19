# Development Mode

TypeGlot's development mode provides a seamless workflow for managing translations during development with an integrated local dashboard.

## Starting Development Mode

```bash
npx @typeglot/cli dev
```

This single command:

1. Compiles all translation files
2. Watches for changes in `locales/*.json`
3. Automatically recompiles on changes
4. Starts the API server
5. Serves the local dashboard at `http://localhost:3333`

## Local Dashboard

The development mode includes a built-in web dashboard that runs alongside the file watcher and compiler.

### Accessing the Dashboard

Once you run `npx @typeglot/cli dev`, the dashboard is available at:

```
http://localhost:3333
```

The terminal will show:

```
🌐 Starting TypeGlot development mode...

✔ Found 1 project
✔ Configuration loaded

🚀 TypeGlot running at http://localhost:3333
   Dashboard: http://localhost:3333
   API: http://localhost:3333/api

Press Ctrl+C to stop
```

### Change the Port

```bash
npx @typeglot/cli dev --port 4000
```

### Dashboard Features

#### Overview Page (Dashboard)

- **Total Keys**: Number of translation keys defined
- **Languages**: Number of configured locales
- **Missing Translations**: Count of untranslated strings
- **Quick Actions**:
  - Add new translation key
  - Navigate to translations
  - Manage settings
  - AI translation (coming soon)

#### Translations Page

- View all translation keys in a table
- **Edit inline**: Click any translation to edit it directly
- **Filter by locale**: Show only specific languages
- **Search**: Find keys or values instantly
- Real-time updates to JSON files
- Highlight missing translations in red
- Add new translation keys with the "+ Add Key" button

#### Settings Page

- Configure source and target locales
- Set AI provider (OpenAI, Anthropic, Copilot)
- Manage API keys
- Update project configuration

## File Watching

The watcher monitors your locales directory:

```
[typeglot] Watching for changes in ./locales
[typeglot] File changed: en.json
[typeglot] ✓ Compiled 3 files
```

### What Triggers Recompilation

- Adding a new key to any locale file
- Modifying an existing translation (via dashboard or file editor)
- Adding a new locale file
- Deleting a locale file

Changes made through the dashboard are immediately written to your JSON files and trigger recompilation.

### Debouncing

Multiple rapid changes are debounced to prevent excessive recompilation (300ms default).

## Watch Mode Without Dashboard

If you only want file watching and compilation without the dashboard:

```bash
npx @typeglot/cli build --watch
```

## Using in Any Project

You can run TypeGlot in any folder with a `typeglot.config.json`:

```bash
cd /path/to/your/project
npx @typeglot/cli dev
```

No installation required - `npx` will download and run the CLI automatically.

## Monorepo Support

TypeGlot automatically discovers all projects in a monorepo:

```
🌐 Starting TypeGlot development mode...

✔ Found 2 projects

Projects:
  • My App (apps/web) - en → es, fr
  • Documentation (apps/docs) - en → de, sv
```

The dashboard shows all projects and lets you switch between them.

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
3. **Sidebar Integration**: Browse translations without leaving VS Code

The dashboard and VS Code extension work together - changes in either are synced via the file system.

## Terminal Output

Development mode provides helpful terminal output:

```
🌐 Starting TypeGlot development mode...

✔ Found 1 project

Projects:
  • My App (./) - en → es, fr, de

✔ Configuration loaded
[typeglot] Generated: src/generated/i18n/messages.ts (15 keys)
[typeglot] Generated: src/generated/i18n/en.ts (15 keys)
[typeglot] Generated: src/generated/i18n/es.ts (15 keys)
✓ Compiled 3 files
[typeglot] Watching for changes in ./locales

🚀 TypeGlot running at http://localhost:3333
   Dashboard: http://localhost:3333
   API: http://localhost:3333/api

Press Ctrl+C to stop
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
- **Instant UI updates**: Dashboard reflects changes immediately
- **Parallel processing**: Multiple files compiled simultaneously

Typical recompilation time: **50-200ms**

## Workflow Example

A typical development workflow:

1. **Start dev mode**: `npx @typeglot/cli dev`
2. **Open dashboard**: Navigate to `http://localhost:3333`
3. **Add a key**: Click "+ Add Key", enter `login_button` / `Log In`
4. **Use in code**: Import `m.login_button()` in your app
5. **Add translation**: Click the Spanish cell, enter `Iniciar sesión`
6. **See it live**: Changes auto-compile and HMR reloads your app

All edits can be made through the dashboard or by editing JSON files directly - both approaches work seamlessly together.
