---
layout: home

hero:
  name: TypeGlot
  text: Git-Native i18n Toolchain
  tagline: Entwicklerorientierte Internationalisierung mit starker Typisierung und KI-gestützten Übersetzungen
  image:
    src: /logo.svg
    alt: TypeGlot
  actions:
    - theme: brand
      text: Loslegen
      link: /de/guide/getting-started
    - theme: alt
      text: Auf GitHub ansehen
      link: https://github.com/markusahlstrand/typeglot

features:
  - icon: 📁
    title: Git als Quelle der Wahrheit
    details: Keine externen Datenbanken oder Synchronisationssorgen. Übersetzungsdateien leben in Ihrem Repository neben Ihrem Code.
  - icon: 🔒
    title: Stark Typisiert
    details: Automatisch generierte TypeScript-Funktionen mit vollständiger Typsicherheit. Keine magischen Strings oder fehlenden Parameter mehr.
  - icon: 🤖
    title: Kontextbewusste KI
    details: JSDoc-Kommentare liefern umfangreichen Kontext für KI-Modelle für präzise, nuancierte Übersetzungen.
  - icon: ⚡
    title: Sofortige Kompilierung
    details: Der Watch-Modus kompiliert bei jeder Änderung neu. Sehen Sie Ihre Übersetzungen in Echtzeit aktualisieren.
  - icon: 🎨
    title: Lokales Dashboard
    details: Visuelle Oberfläche zur Verwaltung von Übersetzungen ohne Ihren Entwicklungsworkflow zu verlassen.
  - icon: 💻
    title: VS Code Integration
    details: Inline-Übersetzungsvorschau, Code-Aktionen und KI-Übersetzung direkt in Ihrem Editor.
---

## Schnellstart

```bash
# TypeGlot in Ihrem Projekt initialisieren
npx typeglot init

# Typisierte Übersetzungen kompilieren
npx typeglot build

# Entwicklungsmodus starten
npx typeglot dev
```
