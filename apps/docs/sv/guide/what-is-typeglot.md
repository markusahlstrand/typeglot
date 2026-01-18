# Vad är TypeGlot?

TypeGlot är en **utvecklarfokuserad, Git-native internationaliseringsverktygskedja (i18n)** designad för att ersätta molnbaserade översättningstjänster. Kärnfilosofin är att översättningar är kod, bör leva i repositoryt och måste vara starkt typade.

## Problemet

Nuvarande i18n-lösningar har flera svagheter:

### Synkroniseringsångest

Molnbaserade tjänster som i18nexus skapar synkroniseringsfriktioner. Du undrar ständigt: "Är mitt lokala tillstånd synkroniserat? Har någon uppdaterat en översättning på distans?"

### Ingen versionskontroll

Översättningar lagrade i externa databaser förlorar Git-fördelarna — ingen historik, inga grenar, ingen kodgranskning för översättningsändringar.

### Magiska strängar

De flesta i18n-bibliotek använder strängnycklar som `t('user.welcome')`. Dessa är:

- Inte typsäkra — stavfel misslyckas tyst vid körning
- Inte autocomplete-vänliga — du måste memorera eller slå upp nyckelnamn
- Parameterblinda — ingen kompileringstidskontroll att du skickar obligatoriska parametrar

### Kontextfri AI-översättning

När du använder AI för att översätta ser den bara den råa texten. Utan kontext kan den översätta "Save" som substantiv (sparbössa) istället för verb (spara dokument).

## Lösningen

TypeGlot adresserar alla dessa problem:

### Git som sanningens källa

Översättnings-JSON-filer lever i ditt repository, versionerade med Git. Inga externa databaser, inga synkproblem. Ändringar går genom pull requests som all annan kod.

```
ditt-projekt/
├── locales/
│   ├── en.json    # Källöversättningar
│   ├── es.json    # Spanska
│   └── fr.json    # Franska
└── src/
    └── generated/
        └── i18n/  # Auto-genererad TypeScript
```

### Stark typning

Kompilatorn genererar TypeScript-funktioner för varje översättningsnyckel:

```typescript
// Auto-genererad från locales/en.json
export function welcome(params: { name: string }): string { ... }
export function items_count(params: { count: number }): string { ... }

// Användning - fullt typad med autocomplete
import { m } from './generated/i18n';

m.welcome({ name: 'World' })  // ✅ Typsäkert
m.welcome({ naam: 'World' })  // ❌ Kompileringsfel: 'naam' finns inte
m.welcome()                   // ❌ Kompileringsfel: obligatorisk parameter saknas
```

### Kontextmedveten AI

TypeGlot extraherar JSDoc-kommentarer från din källkod och skickar dem till AI-modellen:

```typescript
/**
 * @desc Hälsning efter att användarprofilen sparats
 * @context Sida för användarprofilinställningar
 */
const message = m.profile_saved();
```

AI:n vet att detta är ett framgångsmeddelande i en inställningskontext, inte en generisk hälsning.

## Arkitektur

TypeGlot består av flera paket:

| Paket                | Beskrivning                                              |
| -------------------- | -------------------------------------------------------- |
| `@typeglot/core`     | Delad logik för konfiguration, AST-analys, AI-promptar   |
| `@typeglot/compiler` | Genererar TypeScript från JSON-filer                     |
| `@typeglot/cli`      | Kommandoradsgränssnitt (`typeglot init`, `dev`, `build`) |
| `@typeglot/ui`       | Lokal React-baserad instrumentpanel                      |
| VS Code Extension    | Inline-dekorationer och AI-översättningar i editorn      |

## Varför TypeGlot?

- **Inget kontextbyte**: Lämna aldrig editorn
- **Native Git-integration**: Översättningsändringar är normala PRs
- **Kontextuell noggrannhet**: AI förstår din kod, inte bara strängar
- **Ingen leverantörslåsning**: Dina JSON-filer är sanningens källa
