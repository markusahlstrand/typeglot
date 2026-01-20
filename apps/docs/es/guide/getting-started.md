# Primeros Pasos

Esta guía te ayudará a configurar TypeGlot en tu proyecto en menos de 5 minutos.

## Requisitos Previos

- Node.js 18 o superior
- pnpm, npm, o yarn

## Instalación

### Inicializar un Nuevo Proyecto

La forma más rápida de comenzar es usando el CLI:

```bash
npx @typeglot/cli init
```

Esto crea:

- `typeglot.config.json` — Archivo de configuración
- `locales/en.json` — Archivo de traducción fuente con ejemplos
- `src/generated/i18n/` — Directorio de salida para TypeScript generado

### Instalación Manual

Si prefieres configurar las cosas manualmente:

```bash
# Instalar el CLI
npm install -D @typeglot/cli

# O con pnpm
pnpm add -D @typeglot/cli
```

Crear `typeglot.config.json`:

```json
{
  "sourceLocale": "en",
  "targetLocales": ["es", "fr", "de"],
  "localesDir": "./locales",
  "outputDir": "./src/generated/i18n"
}
```

Crear tu archivo de traducción fuente `locales/en.json`:

```json
{
  "hello": "Hello",
  "welcome": "Welcome, {name}!",
  "items_count": "{count, plural, one {# item} other {# items}}"
}
```

## Compilar Traducciones

Compila tus traducciones a TypeScript:

```bash
npx @typeglot/cli build
```

Esto genera funciones tipadas en `src/generated/i18n/`:

```typescript
// messages.ts (auto-generado)
export function hello(): string { ... }
export function welcome(params: { name: string }): string { ... }
export function items_count(params: { count: number }): string { ... }

export const m = { hello, welcome, items_count };
```

## Usar Traducciones

Importa y usa las funciones tipadas:

```typescript
import { m } from './generated/i18n';

// Mensaje simple
const greeting = m.hello();
// → "Hello"

// Con parámetros
const personalGreeting = m.welcome({ name: 'Alice' });
// → "Welcome, Alice!"

// Con pluralización
const itemText = m.items_count({ count: 5 });
// → "5 items"
```

## Modo Desarrollo

Inicia el servidor de desarrollo para recompilación automática:

```bash
npx @typeglot/cli dev
```

Esto hará:

1. Vigilar cambios en `locales/*.json`
2. Recompilar TypeScript automáticamente
3. Lanzar el panel de control local en `http://localhost:3333`

## Agregar Contexto para IA

Para ayudar a la IA a generar traducciones precisas, añade comentarios JSDoc:

```typescript
/** @desc Saludo mostrado en la sección hero de la página principal */
const heroGreeting = m.welcome({ name: userName });

/**
 * @desc Botón para agregar artículos al carrito de compras
 * @context Flujo de checkout de e-commerce
 */
const addButton = m.add_to_cart;
```

## Próximos Pasos

- Aprende sobre [Archivos de Traducción](/guide/translation-files) y formatos soportados
- Entiende [Seguridad de Tipos](/guide/type-safety) y código generado
- Configura [Traducción con IA](/guide/ai-translation) para traducciones automatizadas
- Explora [Contexto JSDoc](/guide/jsdoc-context) para mejores resultados de IA
