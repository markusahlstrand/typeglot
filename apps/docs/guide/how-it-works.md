# How It Works

TypeGlot has a simple, elegant architecture: **JSON files in → TypeScript functions out**. Here's everything you need to know about the workflow.

## The Two Workflows

### 🧑‍💻 Code-First Workflow

Start writing code, add translations later:

1. **Write your code with translation keys**:

   ```typescript
   /** @desc Welcome message shown to new users */
   const message = m.welcome_new_user({ name: user.name });
   ```

2. **Add the key to your source locale**:

   ```json
   // locales/en.json
   {
     "welcome_new_user": "Welcome, {name}!"
   }
   ```

3. **Run build or dev mode**:

   ```bash
   npx @typeglot/cli build  # One-time build
   # OR
   npx @typeglot/cli dev    # Watch mode
   ```

4. **TypeScript functions are generated**:

   ```typescript
   // Auto-generated in src/generated/i18n/messages.ts
   export function welcome_new_user(params: { name: string }): string {
     return messages['welcome_new_user'] ?? `Welcome, {name}!`;
   }
   ```

5. **Use AI to translate** (optional):
   ```bash
   npx @typeglot/cli translate
   ```
   The AI reads your JSDoc comment and creates context-aware translations in all target locales.

### 🎨 UI-First Workflow

Prefer a visual interface? Use the local dashboard:

1. **Start dev mode**:

   ```bash
   npx @typeglot/cli dev
   ```

2. **Open the dashboard**:
   Navigate to `http://localhost:3333`

3. **Add keys in the UI**:
   - Click "+ Add Key"
   - Enter the key name (e.g., `checkout_button`)
   - Enter the source translation (e.g., "Complete Purchase")
   - Translations are saved to `locales/en.json`

4. **Auto-compilation happens instantly**:
   The watcher sees the JSON change and regenerates TypeScript functions immediately.

5. **Use in your code**:

   ```typescript
   import { m } from './generated/i18n';

   const label = m.checkout_button();
   ```

## The Magic: How Context Works

When you write JSDoc comments, TypeGlot's **AST analyzer** extracts them during the `translate` command:

```typescript
/**
 * @desc Button in checkout flow to finalize purchase
 * @context Appears below cart total, above payment options
 * @example "Complete Your Order", "Finish Checkout"
 * @maxLength 25
 */
const button = m.complete_checkout();
```

### What Happens:

1. **AST Analysis**: TypeGlot uses `ts-morph` to scan your source files
2. **Key Matching**: Finds usages of `m.complete_checkout`
3. **JSDoc Extraction**: Grabs the comment above the usage
4. **Context Building**: Creates a rich prompt for the AI:

   ```
   Translate "Complete Checkout" from English to Spanish.

   Context:
   - Description: Button in checkout flow to finalize purchase
   - Location: Appears below cart total, above payment options
   - Examples: "Complete Your Order", "Finish Checkout"
   - Max length: 25 characters
   - Tone: Action-oriented, creates urgency
   ```

5. **AI Translation**: Your configured AI (GitHub Copilot, Claude, GPT-4) translates with full context
6. **Write to JSON**: Results are saved to `locales/es.json`

## Metadata & Change Tracking

### Does TypeGlot Store Metadata in JSDoc?

**Currently: No.** JSDoc comments are read-only context providers. They don't store:

- Translation approval status
- Change history
- Reviewer information

**Why?** We keep source code clean. Translation metadata lives in:

- **Git history** - who changed what, when, and why (via commit messages)
- **JSON files** - the translations themselves
- **Generated TypeScript** - type-safe functions

### The Git-as-Database Philosophy

TypeGlot treats your repository as the database:

```bash
# See who translated something
git log locales/es.json

# Review translation changes
git diff locales/es.json

# Approve via PR review
# Create PR → Review → Merge = Approved
```

This approach means:

- **PR reviews** = translation approval workflow
- **Git blame** = audit trail
- **Git tags/branches** = versioning

No proprietary metadata format, no custom approval flags—just Git.

## Tree-Shaking & Zero Runtime Overhead

### Function-Based = Tree-Shakeable

Because TypeGlot generates **individual functions**, bundlers can tree-shake unused translations:

```typescript
// You import only what you use
import { m } from './generated/i18n';

const greeting = m.hello();
const farewell = m.goodbye();
// ✨ Only hello() and goodbye() are bundled
// All other 500 translations? Not included.
```

### The Bundle Size Win

Traditional i18n libraries ship the entire translation object:

```typescript
// ❌ Traditional i18n - entire object included
const translations = {
  hello: 'Hello',
  goodbye: 'Goodbye',
  unused_key_1: '...',
  unused_key_2: '...',
  // ... 500 more unused keys
};

t('hello'); // Bundles ALL 500+ keys 😢
```

TypeGlot generates separate functions:

```typescript
// ✅ TypeGlot - tree-shakeable functions
export function hello(): string {
  return 'Hello';
}
export function goodbye(): string {
  return 'Goodbye';
}
export function unused_key_1(): string {
  return '...';
}
// ... 500 more functions

export const m = { hello, goodbye, unused_key_1 /* ... */ };
```

**Result:** Bundlers (Webpack, Rollup, Vite, esbuild) include only the functions you actually call.

### Real-World Impact

For a typical app using 50 translations out of 500:

- **Traditional i18n**: ~100KB (all 500 translations)
- **TypeGlot**: ~10KB (only 50 functions)

**90% smaller bundle** 🎉

## File Watcher & Hot Reload

In `dev` mode, TypeGlot watches your `locales/` directory:

```bash
npx @typeglot/cli dev
# Watching for changes in ./locales
```

### What Triggers Recompilation?

- ✅ Adding a new key to any locale file
- ✅ Modifying an existing translation
- ✅ Deleting a key
- ✅ Adding a new locale file (e.g., `locales/fr.json`)
- ✅ Changes via UI dashboard
- ✅ Manual edits in your code editor

### What Happens on Change?

1. **File change detected**: `locales/en.json` modified
2. **Parse JSON**: Load and validate all locale files
3. **Generate TypeScript**: Create typed functions
4. **Write to disk**: Update `src/generated/i18n/`
5. **TypeScript compiler picks it up**: Your dev server sees the new types

Total time: **< 100ms** for most projects.

## Production Build

For production, run:

```bash
npx @typeglot/cli build
```

This:

1. **Validates** all locale files (JSON syntax, parameter consistency)
2. **Generates** typed TypeScript functions
3. **Compiles** functions for each locale
4. **Outputs** tree-shakeable modules

Then build your app normally:

```bash
npm run build  # or pnpm/yarn
```

Your bundler will:

- Tree-shake unused translations
- Minify the functions
- Output optimized JavaScript

## The Full Picture

```
┌─────────────────────────────────────────────────────────────┐
│  Developer Workflow                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Code-First:                    UI-First:                   │
│  1. Write JSDoc + code      OR  1. Open dashboard           │
│  2. Add to JSON                 2. Add keys in UI           │
│  3. Run build/dev               3. Auto-saves to JSON       │
│                                                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │  locales/*.json │  ◄─── Source of truth (Git)
         └───────┬────────┘
                 │
                 ▼
         ┌───────────────┐
         │  @typeglot/   │  ◄─── Compiler
         │   compiler    │       • Parses JSON
         └───────┬────────┘       • Extracts params
                 │                • Generates TS
                 ▼
         ┌───────────────┐
         │  generated/   │  ◄─── TypeScript functions
         │    i18n/      │       • Tree-shakeable
         └───────┬────────┘       • Fully typed
                 │                • No runtime overhead
                 ▼
         ┌───────────────┐
         │  Your App     │  ◄─── Import & use
         │  import { m } │       • Type-safe
         └───────────────┘       • Autocomplete
```

## FAQ

### Can I edit JSON files directly?

**Yes!** Edit `locales/*.json` in any editor. TypeGlot's watcher will pick up changes instantly in dev mode.

### Do I need to commit the generated TypeScript?

**No.** Add `src/generated/i18n/` to `.gitignore`. Generate on build.

**Alternatively:** Commit generated files for faster CI builds and clearer diffs.

### Can I use both workflows (code + UI)?

**Absolutely.** They're not mutually exclusive. Add keys in the UI, annotate them with JSDoc in your code. Best of both worlds.

### Does JSDoc affect bundle size?

**No.** JSDoc is stripped during compilation. It only exists in your source code to provide context for AI translation.

### How does tree-shaking work with the `m` object?

Modern bundlers (Webpack 5+, Rollup, Vite, esbuild) trace property access:

```typescript
const x = m.hello(); // Bundler knows you use hello()
const y = m.goodbye(); // And goodbye()
// m.unused_key is never accessed → not bundled
```

The `m` object is just a convenience namespace. Bundlers are smart enough to include only accessed properties.

---

Ready to try it? [Get Started →](/guide/getting-started)
