# Platform Comparison

TypeGlot takes a fundamentally different approach to internationalization. While traditional platforms are powerful cloud services, TypeGlot is a **developer-first, Git-native toolchain** that keeps everything local.

## Quick Comparison

| Feature                   | TypeGlot           | Lokalise     | Crowdin      | Phrase      | Transifex   | Weglot      | Smartling     |
| ------------------------- | ------------------ | ------------ | ------------ | ----------- | ----------- | ----------- | ------------- |
| **Type Safety**           | ✅ Full TypeScript | ❌ No        | ❌ No        | ❌ No       | ❌ No       | ❌ No       | ❌ No         |
| **Git-Native**            | ✅ Yes             | ⚠️ Via sync  | ⚠️ Via sync  | ⚠️ Via sync | ⚠️ Via sync | ❌ No       | ⚠️ Via sync   |
| **Local-First**           | ✅ 100% local      | ❌ Cloud     | ❌ Cloud     | ❌ Cloud    | ❌ Cloud    | ❌ Cloud    | ❌ Cloud      |
| **AI Translation**        | ✅ Your AI         | ✅ Built-in  | ✅ Built-in  | ✅ Built-in | ✅ Built-in | ✅ Built-in | ✅ Built-in   |
| **Context Extraction**    | ✅ JSDoc/TSDoc     | ⚠️ Manual    | ⚠️ Manual    | ⚠️ Limited  | ⚠️ Manual   | ❌ No       | ⚠️ Limited    |
| **VS Code Integration**   | ✅ Native          | ⚠️ Extension | ⚠️ Extension | ❌ No       | ❌ No       | ❌ No       | ❌ No         |
| **Pricing**               | ✅ Free            | 💰 $120+/mo  | 💰 $50+/mo   | 💰 $19+/mo  | 💰 $99+/mo  | 💰 $29+/mo  | 💰 Enterprise |
| **Translation Memory**    | ❌ No              | ✅ Yes       | ✅ Yes       | ✅ Yes      | ✅ Yes      | ✅ Yes      | ✅ Yes        |
| **Collaboration UI**      | ⚠️ Local only      | ✅ Web       | ✅ Web       | ✅ Web      | ✅ Web      | ✅ Web      | ✅ Web        |
| **Professional Services** | ❌ No              | ✅ Yes       | ✅ Yes       | ✅ Yes      | ✅ Yes      | ✅ Yes      | ✅ Yes        |
| **Workflow Management**   | ❌ No              | ✅ Yes       | ✅ Yes       | ✅ Yes      | ✅ Yes      | ✅ Yes      | ✅ Yes        |
| **Integrations**          | ⚠️ Growing         | ✅ 50+       | ✅ 500+      | ✅ 100+     | ✅ 60+      | ✅ 20+      | ✅ 40+        |

## What TypeGlot Does Best

### 🔒 True Type Safety

TypeGlot is the **only** i18n solution that provides compile-time type safety. Every translation key becomes a fully-typed TypeScript function with autocomplete and parameter validation.

```typescript
// Autocomplete shows all available translations
m.welcome({ name: string }); // ✅ Type-checked at compile time
m.items_count({ count: number }); // ✅ Pluralization rules included
```

### 📦 Zero Sync Anxiety

Your translations live in your Git repository. No cloud sync means:

- **No subscription fees** - it's just files in your repo
- **No sync conflicts** - Git is your source of truth
- **No vendor lock-in** - standard JSON and TypeScript files
- **Works offline** - no internet required for development

### 🤖 Context-Aware AI

TypeGlot uses the AI you **already pay for** (GitHub Copilot, Claude, ChatGPT) and gives it the context it needs:

```typescript
/**
 * @desc Shown in the checkout flow when user clicks to finalize purchase.
 * Should be action-oriented and create urgency.
 */
const button = m.checkout_complete_purchase();
```

The JSDoc comment travels with the key, ensuring AI translators understand the exact context, tone, and usage.

### 💻 Developer Experience

Built by developers, for developers:

- **Watch mode** - instant recompilation on changes
- **Local UI** - manage translations without leaving your workflow
- **VS Code integration** - inline previews, quick fixes, AI translation in your editor
- **CLI-first** - automate everything in your CI/CD pipeline

## What TypeGlot Doesn't Have (Yet)

We're honest about our limitations:

### ❌ Translation Memory

TypeGlot doesn't have built-in translation memory or glossaries. We rely on AI models which already have massive linguistic knowledge, but we don't persist learnings across projects.

**Our take:** For 90% of use cases, modern AI with good context beats traditional TM. For large enterprises with highly specialized terminology, established platforms may be better.

### ❌ Professional Translation Services

We don't offer human translation services or connect you with professional translators.

**Alternative:** Use TypeGlot for the technical infrastructure, and hire translators independently to review AI output. Export JSON, send to translators, import back.

### ❌ Non-Developer Collaboration

Our local UI is great, but it requires running a local server. Non-technical team members can't access a web portal to suggest translations.

**Alternative:** For small teams where developers handle translations, this is fine. For larger organizations, you might need a hybrid approach.

### ❌ Extensive Integrations

We don't integrate with Figma, Sketch, marketing automation tools, CMS platforms, etc.

**Our take:** We're focused on the developer experience. If you need deep integrations with business tools, traditional platforms are more mature.

### ❌ Advanced Workflow Management

No approval workflows, reviewer assignments, or translation project management features.

**Alternative:** Use GitHub's PR review system. Translations are code, so use code review workflows.

## Who Should Use TypeGlot?

### ✅ Great Fit

- **Startups & small teams** - need i18n without monthly fees
- **Open source projects** - everything in Git, community-friendly
- **TypeScript projects** - want full type safety
- **Developer-led teams** - devs handle or oversee translations
- **AI enthusiasts** - already pay for GitHub Copilot or similar
- **Privacy-conscious** - no data sent to third-party platforms

### ⚠️ Maybe Not Ideal

- **Large enterprises** - need professional translation services and workflow management
- **Marketing-heavy orgs** - require extensive integrations with business tools
- **Non-technical teams** - translators need web-based collaboration portals
- **Specialized domains** - rely heavily on translation memory for technical jargon

## The Bottom Line

TypeGlot isn't trying to replace enterprise translation platforms. We're building a **better solution for developers** who:

- Value type safety and developer experience
- Want to avoid subscription fees and vendor lock-in
- Trust modern AI over legacy translation memory
- Prefer Git-based workflows

If that's you, [give TypeGlot a try →](/guide/getting-started)
