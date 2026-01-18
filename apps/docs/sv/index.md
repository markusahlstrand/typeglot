---
layout: home

hero:
  name: TypeGlot
  text: Git-Native i18n Verktygskedja
  tagline: Utvecklarvänlig internationalisering med stark typning och AI-drivna översättningar
  image:
    src: /logo.svg
    alt: TypeGlot
  actions:
    - theme: brand
      text: Kom igång
      link: /sv/guide/getting-started
    - theme: alt
      text: Visa på GitHub
      link: https://github.com/typeglot/typeglot

features:
  - icon: 📁
    title: Git som Källa till Sanning
    details: Inga externa databaser eller synkroniseringsoro. Översättningsfiler lever i ditt repository tillsammans med din kod.
  - icon: 🔒
    title: Starkt Typad
    details: Automatiskt genererade TypeScript-funktioner med full typsäkerhet. Inga fler magiska strängar eller saknade parametrar.
  - icon: 🤖
    title: Kontextmedveten AI
    details: JSDoc-kommentarer ger rik kontext till AI-modeller för precisa, nyanserade översättningar.
  - icon: ⚡
    title: Omedelbar Kompilering
    details: Watch-läget kompilerar om vid varje ändring. Se dina översättningar uppdateras i realtid.
  - icon: 🎨
    title: Lokal Dashboard
    details: Visuellt gränssnitt för att hantera översättningar utan att lämna ditt utvecklingsflöde.
  - icon: 💻
    title: VS Code Integration
    details: Inline översättningsförhandsvisning, kodåtgärder och AI-översättning direkt i din editor.
---

## Snabbstart

```bash
# Initiera TypeGlot i ditt projekt
npx typeglot init

# Bygg typsäkra översättningar
npx typeglot build

# Starta utvecklingsläge
npx typeglot dev
```
