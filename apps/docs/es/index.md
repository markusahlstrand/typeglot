---
layout: home

hero:
  name: TypeGlot
  text: i18n Nativo de Git
  tagline: Internacionalización pensada para desarrolladores con tipado fuerte y traducciones impulsadas por IA
  image:
    src: /logo.svg
    alt: TypeGlot
  actions:
    - theme: brand
      text: Comenzar
      link: /es/guide/getting-started
    - theme: alt
      text: Ver en GitHub
      link: https://github.com/markusahlstrand/typeglot

features:
  - icon: 📁
    title: Git como Fuente de Verdad
    details: Sin bases de datos externas ni ansiedad de sincronización. Los archivos de traducción viven en tu repositorio junto a tu código.
  - icon: 🔒
    title: Fuertemente Tipado
    details: Funciones TypeScript generadas automáticamente con total seguridad de tipos. No más cadenas mágicas ni parámetros faltantes.
  - icon: 🤖
    title: IA Consciente del Contexto
    details: Los comentarios JSDoc proporcionan contexto rico a los modelos de IA para traducciones precisas y matizadas.
  - icon: ⚡
    title: Compilación Instantánea
    details: El modo watch recompila en cada cambio. Ve tus traducciones actualizarse en tiempo real.
  - icon: 🎨
    title: Panel de Control Local
    details: Interfaz visual para gestionar traducciones sin salir de tu flujo de desarrollo.
  - icon: 💻
    title: Integración con VS Code
    details: Vista previa de traducciones inline, acciones de código y traducción con IA directamente en tu editor.
---

## Inicio Rápido

```bash
# Inicializar TypeGlot en tu proyecto
npx typeglot init

# Compilar traducciones tipadas
npx typeglot build

# Iniciar modo desarrollo
npx typeglot dev
```
