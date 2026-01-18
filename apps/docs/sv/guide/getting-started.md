# Kom igång

Denna guide hjälper dig att sätta upp TypeGlot i ditt projekt på under 5 minuter.

## Förutsättningar

- Node.js 18 eller högre
- pnpm, npm, eller yarn

## Installation

### Initiera ett nytt projekt

Det snabbaste sättet att komma igång är att använda CLI:

```bash
npx typeglot init
```

Detta skapar:

- `typeglot.config.json` — Konfigurationsfil
- `locales/en.json` — Källöversättningsfil med exempel
- `src/generated/i18n/` — Utdatakatalog för genererad TypeScript

### Manuell installation

Om du föredrar att sätta upp saker manuellt:

```bash
# Installera CLI
npm install -D @typeglot/cli

# Eller med pnpm
pnpm add -D @typeglot/cli
```

Skapa `typeglot.config.json`:

```json
{
  "sourceLocale": "en",
  "targetLocales": ["es", "fr", "de"],
  "localesDir": "./locales",
  "outputDir": "./src/generated/i18n"
}
```

Skapa din källöversättningsfil `locales/en.json`:

```json
{
  "hello": "Hello",
  "welcome": "Welcome, {name}!",
  "items_count": "{count, plural, one {# item} other {# items}}"
}
```

## Kompilera översättningar

Kompilera dina översättningar till TypeScript:

```bash
npx typeglot build
```

Detta genererar typsäkra funktioner i `src/generated/i18n/`:

```typescript
// messages.ts (auto-genererad)
export function hello(): string { ... }
export function welcome(params: { name: string }): string { ... }
export function items_count(params: { count: number }): string { ... }

export const m = { hello, welcome, items_count };
```

## Använda översättningar

Importera och använd de typsäkra funktionerna:

```typescript
import { m } from './generated/i18n';

// Enkelt meddelande
const greeting = m.hello();
// → "Hello"

// Med parametrar
const personalGreeting = m.welcome({ name: 'Alice' });
// → "Welcome, Alice!"

// Med pluralisering
const itemText = m.items_count({ count: 5 });
// → "5 items"
```

## Utvecklingsläge

Starta utvecklingsservern för automatisk omkompilering:

```bash
npx typeglot dev
```

Detta kommer att:

1. Övervaka `locales/*.json` för ändringar
2. Automatiskt kompilera om TypeScript
3. Starta den lokala dashboarden på `http://localhost:3333`

## Lägga till kontext för AI

För att hjälpa AI att generera korrekta översättningar, lägg till JSDoc-kommentarer:

```typescript
/** @desc Hälsning som visas i hero-sektionen på startsidan */
const heroGreeting = m.welcome({ name: userName });

/**
 * @desc Knapp för att lägga till varor i kundvagnen
 * @context E-handel checkout-flöde
 */
const addButton = m.add_to_cart;
```

## Nästa steg

- Lär dig om [Översättningsfiler](/sv/guide/translation-files) och format som stöds
- Förstå [Typsäkerhet](/sv/guide/type-safety) och genererad kod
- Sätt upp [AI-översättning](/sv/guide/ai-translation) för automatiserade översättningar
- Utforska [JSDoc-kontext](/sv/guide/jsdoc-context) för bättre AI-resultat
