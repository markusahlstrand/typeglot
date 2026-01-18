# ¿Qué es TypeGlot?

TypeGlot es una **cadena de herramientas de internacionalización (i18n) nativa de Git, pensada para desarrolladores**, diseñada para reemplazar los servicios de traducción basados en la nube. Su filosofía central es que las traducciones son código, deben vivir en el repositorio y deben estar fuertemente tipadas.

## El Problema

Las soluciones de i18n actuales tienen varios puntos de dolor:

### Ansiedad de Sincronización

Los servicios basados en la nube como i18nexus crean fricción de sincronización. Constantemente te preguntas: "¿Está mi estado local sincronizado? ¿Alguien actualizó una traducción remotamente?"

### Sin Control de Versiones

Las traducciones almacenadas en bases de datos externas pierden los beneficios de Git — sin historial, sin ramas, sin revisión de código para cambios de traducción.

### Cadenas Mágicas

La mayoría de las bibliotecas i18n usan claves de cadena como `t('user.welcome')`. Estas son:

- No type-safe — los errores tipográficos fallan silenciosamente en tiempo de ejecución
- No amigables con autocompletado — tienes que recordar o buscar nombres de claves
- Ciegas a parámetros — sin verificación en tiempo de compilación de que estás pasando los parámetros requeridos

### Traducción AI Sin Contexto

Cuando usas IA para traducir, solo ve el texto sin procesar. Sin contexto, podría traducir "Save" como un sustantivo (alcancía) en lugar de un verbo (guardar documento).

## La Solución

TypeGlot aborda todos estos problemas:

### Git como Fuente de Verdad

Los archivos JSON de traducción viven en tu repositorio, versionados con Git. Sin bases de datos externas, sin problemas de sincronización. Los cambios pasan por pull requests como cualquier otro código.

```
tu-proyecto/
├── locales/
│   ├── en.json    # Traducciones fuente
│   ├── es.json    # Español
│   └── fr.json    # Francés
└── src/
    └── generated/
        └── i18n/  # TypeScript auto-generado
```

### Tipado Fuerte

El compilador genera funciones TypeScript para cada clave de traducción:

```typescript
// Auto-generado desde locales/en.json
export function welcome(params: { name: string }): string { ... }
export function items_count(params: { count: number }): string { ... }

// Uso - completamente tipado con autocompletado
import { m } from './generated/i18n';

m.welcome({ name: 'World' })  // ✅ Type-safe
m.welcome({ naam: 'World' })  // ❌ Error de compilación: 'naam' no existe
m.welcome()                   // ❌ Error de compilación: falta parámetro requerido
```

### IA Consciente del Contexto

TypeGlot extrae comentarios JSDoc de tu código fuente y los envía al modelo de IA:

```typescript
/**
 * @desc Saludo mostrado después de que el usuario guarde su perfil
 * @context Página de configuración de perfil de usuario
 */
const message = m.profile_saved();
```

La IA sabe que esto es un mensaje de éxito en un contexto de configuración, no un saludo genérico.

## Arquitectura

TypeGlot consta de varios paquetes:

| Paquete              | Descripción                                                       |
| -------------------- | ----------------------------------------------------------------- |
| `@typeglot/core`     | Lógica compartida para configuración, análisis AST, prompts de IA |
| `@typeglot/compiler` | Genera TypeScript desde archivos JSON                             |
| `@typeglot/cli`      | Interfaz de línea de comandos (`typeglot init`, `dev`, `build`)   |
| `@typeglot/ui`       | Dashboard local basado en React                                   |
| VS Code Extension    | Decoraciones inline y traducciones con IA en el editor            |

## ¿Por qué TypeGlot?

- **Cero Cambio de Contexto**: Nunca salgas del editor
- **Integración Nativa con Git**: Los cambios de traducción son PRs normales
- **Precisión Contextual**: La IA entiende tu código, no solo cadenas
- **Sin Vendor Lock-in**: Tus archivos JSON son la fuente de verdad
