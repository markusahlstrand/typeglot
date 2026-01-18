# Erste Schritte

Diese Anleitung hilft Ihnen, TypeGlot in weniger als 5 Minuten in Ihrem Projekt einzurichten.

## Voraussetzungen

- Node.js 18 oder höher
- pnpm, npm oder yarn

## Installation

### Neues Projekt initialisieren

Der schnellste Weg zum Einstieg ist die Verwendung des CLI:

```bash
npx typeglot init
```

Dies erstellt:

- `typeglot.config.json` — Konfigurationsdatei
- `locales/en.json` — Quell-Übersetzungsdatei mit Beispielen
- `src/generated/i18n/` — Ausgabeverzeichnis für generiertes TypeScript

### Manuelle Installation

Wenn Sie die Dinge lieber manuell einrichten:

```bash
# CLI installieren
npm install -D @typeglot/cli

# Oder mit pnpm
pnpm add -D @typeglot/cli
```

Erstellen Sie `typeglot.config.json`:

```json
{
  "sourceLocale": "en",
  "targetLocales": ["es", "fr", "de"],
  "localesDir": "./locales",
  "outputDir": "./src/generated/i18n"
}
```

Erstellen Sie Ihre Quell-Übersetzungsdatei `locales/en.json`:

```json
{
  "hello": "Hello",
  "welcome": "Welcome, {name}!",
  "items_count": "{count, plural, one {# item} other {# items}}"
}
```

## Übersetzungen kompilieren

Kompilieren Sie Ihre Übersetzungen zu TypeScript:

```bash
npx typeglot build
```

Dies generiert typisierte Funktionen in `src/generated/i18n/`:

```typescript
// messages.ts (auto-generiert)
export function hello(): string { ... }
export function welcome(params: { name: string }): string { ... }
export function items_count(params: { count: number }): string { ... }

export const m = { hello, welcome, items_count };
```

## Übersetzungen verwenden

Importieren und verwenden Sie die typisierten Funktionen:

```typescript
import { m } from './generated/i18n';

// Einfache Nachricht
const greeting = m.hello();
// → "Hello"

// Mit Parametern
const personalGreeting = m.welcome({ name: 'Alice' });
// → "Welcome, Alice!"

// Mit Pluralisierung
const itemText = m.items_count({ count: 5 });
// → "5 items"
```

## Entwicklungsmodus

Starten Sie den Entwicklungsserver für automatische Neukompilierung:

```bash
npx typeglot dev
```

Dies wird:

1. `locales/*.json` auf Änderungen überwachen
2. TypeScript automatisch neu kompilieren
3. Das lokale Dashboard unter `http://localhost:3333` starten

## Kontext für KI hinzufügen

Um der KI zu helfen, präzise Übersetzungen zu generieren, fügen Sie JSDoc-Kommentare hinzu:

```typescript
/** @desc Begrüßung im Hero-Bereich der Startseite */
const heroGreeting = m.welcome({ name: userName });

/**
 * @desc Schaltfläche zum Hinzufügen von Artikeln zum Warenkorb
 * @context E-Commerce Checkout-Prozess
 */
const addButton = m.add_to_cart;
```

## Nächste Schritte

- Erfahren Sie mehr über [Übersetzungsdateien](/de/guide/translation-files) und unterstützte Formate
- Verstehen Sie [Typsicherheit](/de/guide/type-safety) und generierten Code
- Richten Sie [KI-Übersetzung](/de/guide/ai-translation) für automatisierte Übersetzungen ein
- Erkunden Sie [JSDoc-Kontext](/de/guide/jsdoc-context) für bessere KI-Ergebnisse
