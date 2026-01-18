# @typeglot/ui

The UI package provides a local React-based dashboard for managing translations.

## Overview

The TypeGlot Dashboard is a local development tool that provides:

- Visual overview of all translation keys
- Side-by-side comparison of translations across locales
- Inline editing of translation values
- Quick search and filtering
- Configuration management

## Starting the Dashboard

The dashboard is typically started via the CLI:

```bash
npx typeglot dev
```

Or run it standalone:

```bash
cd packages/ui
pnpm dev
```

The dashboard opens at `http://localhost:3333`.

## Features

### Dashboard Overview

The main dashboard shows:

- **Total Keys** — Number of translation keys defined
- **Languages** — Number of configured locales
- **Missing** — Count of untranslated strings

Quick actions provide shortcuts to common tasks.

### Translations Table

The translations page displays all keys in a table:

| Key       | en               | es                   | fr                 | Actions |
| --------- | ---------------- | -------------------- | ------------------ | ------- |
| `hello`   | Hello            | Hola                 | Bonjour            | Edit    |
| `welcome` | Welcome, {name}! | ¡Bienvenido, {name}! | Bienvenue, {name}! | Edit    |

Features:

- **Search** — Filter by key name or value
- **Locale Filter** — Show specific locale or all
- **Missing Indicator** — Highlights untranslated strings
- **Inline Editing** — Click to edit values

### Settings Page

Configure TypeGlot options:

- **Source Locale** — Primary language
- **Locales Directory** — Path to JSON files
- **Output Directory** — Generated TypeScript location
- **AI Provider** — Translation service configuration
- **Target Locales** — Languages to translate to

## Tech Stack

- **React 18** — UI framework
- **Vite** — Build tool and dev server
- **React Router** — Client-side routing
- **Tailwind CSS** — Styling

## Project Structure

```
packages/ui/
├── src/
│   ├── main.tsx           # Entry point
│   ├── App.tsx            # Root component with routing
│   ├── index.css          # Global styles
│   ├── components/
│   │   └── Layout.tsx     # App shell with navigation
│   └── pages/
│       ├── Dashboard.tsx  # Overview page
│       ├── Translations.tsx # Translation table
│       └── Settings.tsx   # Configuration page
├── public/
│   └── favicon.svg
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

## Development

### Running Locally

```bash
cd packages/ui
pnpm install
pnpm dev
```

### Building for Production

```bash
pnpm build
```

Output is in the `dist/` directory.

### Preview Production Build

```bash
pnpm preview
```

## Configuration

### Vite Config

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3333,
  },
});
```

### Tailwind Config

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#0ea5e9',
          600: '#0284c7',
        },
      },
    },
  },
};
```

## API Integration

The dashboard communicates with the local file system through the CLI's dev server. When running via `typeglot dev`, the CLI provides:

- File system access for reading/writing locale files
- WebSocket connection for real-time updates
- Configuration loading

## Customization

### Theme Colors

Edit `tailwind.config.js` to customize the color scheme:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        50: '#f0f9ff',
        // ... your colors
      },
    },
  },
},
```

### Port

Change the default port in `vite.config.ts` or via CLI:

```bash
npx typeglot dev --port 4000
```

## Dependencies

- `react` — UI library
- `react-dom` — React DOM renderer
- `react-router-dom` — Routing
- `@typeglot/core` — Shared types (dev)
