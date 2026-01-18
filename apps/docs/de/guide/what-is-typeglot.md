# Was ist TypeGlot?

TypeGlot ist eine **entwicklerorientierte, Git-native Internationalisierungs (i18n) Toolchain**, die entwickelt wurde, um cloudbasierte Übersetzungsdienste zu ersetzen. Die Kernphilosophie ist, dass Übersetzungen Code sind, im Repository leben sollten und stark typisiert sein müssen.

## Das Problem

Aktuelle i18n-Lösungen haben mehrere Schwachstellen:

### Synchronisationsangst

Cloudbasierte Dienste wie i18nexus erzeugen Synchronisierungsfriktionen. Sie fragen sich ständig: "Ist mein lokaler Status synchron? Hat jemand eine Übersetzung remote aktualisiert?"

### Keine Versionskontrolle

In externen Datenbanken gespeicherte Übersetzungen verlieren die Vorteile von Git — keine Historie, keine Branches, kein Code-Review für Übersetzungsänderungen.

### Magische Strings

Die meisten i18n-Bibliotheken verwenden String-Schlüssel wie `t('user.welcome')`. Diese sind:

- Nicht typsicher — Tippfehler scheitern leise zur Laufzeit
- Nicht autocomplete-freundlich — Sie müssen sich Schlüsselnamen merken oder nachschlagen
- Parameterblind — keine Compile-Zeit-Prüfung, dass Sie erforderliche Parameter übergeben

### Kontextfreie KI-Übersetzung

Wenn Sie KI zum Übersetzen verwenden, sieht sie nur den Rohtext. Ohne Kontext könnte sie "Save" als Substantiv (Sparbüchse) statt als Verb (Dokument speichern) übersetzen.

## Die Lösung

TypeGlot adressiert all diese Probleme:

### Git als Quelle der Wahrheit

Übersetzungs-JSON-Dateien leben in Ihrem Repository, versioniert mit Git. Keine externen Datenbanken, keine Sync-Probleme. Änderungen gehen durch Pull Requests wie jeder andere Code.

```
ihr-projekt/
├── locales/
│   ├── en.json    # Quell-Übersetzungen
│   ├── es.json    # Spanisch
│   └── fr.json    # Französisch
└── src/
    └── generated/
        └── i18n/  # Auto-generiertes TypeScript
```

### Starke Typisierung

Der Compiler generiert TypeScript-Funktionen für jeden Übersetzungsschlüssel:

```typescript
// Auto-generiert aus locales/en.json
export function welcome(params: { name: string }): string { ... }
export function items_count(params: { count: number }): string { ... }

// Verwendung - vollständig typisiert mit Autocomplete
import { m } from './generated/i18n';

m.welcome({ name: 'World' })  // ✅ Typsicher
m.welcome({ naam: 'World' })  // ❌ Kompilierungsfehler: 'naam' existiert nicht
m.welcome()                   // ❌ Kompilierungsfehler: erforderlicher Parameter fehlt
```

### Kontextbewusste KI

TypeGlot extrahiert JSDoc-Kommentare aus Ihrem Quellcode und sendet sie an das KI-Modell:

```typescript
/**
 * @desc Begrüßung nach dem Speichern des Benutzerprofils
 * @context Seite für Benutzerprofileinstellungen
 */
const message = m.profile_saved();
```

Die KI weiß, dass dies eine Erfolgsmeldung in einem Einstellungskontext ist, keine generische Begrüßung.

## Architektur

TypeGlot besteht aus mehreren Paketen:

| Paket                | Beschreibung                                                  |
| -------------------- | ------------------------------------------------------------- |
| `@typeglot/core`     | Gemeinsame Logik für Konfiguration, AST-Analyse, KI-Prompts   |
| `@typeglot/compiler` | Generiert TypeScript aus JSON-Dateien                         |
| `@typeglot/cli`      | Kommandozeilenschnittstelle (`typeglot init`, `dev`, `build`) |
| `@typeglot/ui`       | Lokales React-basiertes Dashboard                             |
| VS Code Extension    | Inline-Dekorationen und KI-Übersetzungen im Editor            |

## Warum TypeGlot?

- **Kein Kontextwechsel**: Verlassen Sie niemals den Editor
- **Native Git-Integration**: Übersetzungsänderungen sind normale PRs
- **Kontextuelle Genauigkeit**: KI versteht Ihren Code, nicht nur Strings
- **Kein Vendor Lock-in**: Ihre JSON-Dateien sind die Quelle der Wahrheit
