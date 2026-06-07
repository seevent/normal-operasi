# AGENTS.md

This document provides an overview of the project structure for AI agents and developers.

## Project Overview

Mobile-first report generator web app for airport security technicians (SSES T2, Soekarno-Hatta Terminal 2). Single-page app with 8 feature tabs that generate formatted WhatsApp messages.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start |
| Frontend | React 19, TanStack Router v1 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| Language | TypeScript 5 (with `@ts-nocheck` in App.tsx) |
| Deployment | Netlify |

## Directory Structure

```
src/
  components/
    App.tsx          # Single monolithic component (~3500 lines) — all logic + UI
  routes/
    __root.tsx       # TanStack Router root — HTML shell, mobile meta tags
    index.tsx        # Single route "/" that renders App
  styles.css         # Tailwind v4 import + global mobile-optimized body styles
```

## Key Decisions

- **Monolithic component**: `App.tsx` contains all 8 tabs, all state, all logic in one file. Preserves full feature parity with original source code.
- **`@ts-nocheck`**: The component uses implicit `any` types (JS-style React). Decorated with `// @ts-nocheck` to avoid rewriting all type annotations.
- **`window.touchDragState`**: A global property used for touch drag-and-drop photo reordering. Declared in `declare global` block in App.tsx.
- **No backend**: All data is ephemeral (React state) or stored in `localStorage` (TIP tab). Pure client-side tool.
- **Canvas API**: Photo collage generation and camera watermark done entirely in-browser.
- **Web Share API**: Reports shared via `navigator.share()` with fallback to clipboard + WhatsApp URL.

## Tab State Mapping

Each tab has its own state slice:
- `formData` → Tab Perbaikan (equipment repair reports)
- `attendanceData` → Tab Kehadiran (shift attendance)
- `briefingData` → Tab Briefing (unit/MOT briefing)
- `storingData` → Tab Storing (equipment storing)
- `toggles` + `expandedAreas` → Tab Checklist (equipment status)
- `kalibrasiGlobal` + `kalibrasiEntries` → Tab Kalibrasi (calibration multi-location)
- `tipDataState` → Tab TIP (monthly performance tracker, persisted to localStorage)
- `camStream` + `camLocation` etc → Tab Cam (camera with watermark)

Shared: `photos`, `collageUrl`, `isCopied`, `isResetting`.

## Development

```bash
npm run dev    # Start dev server on port 3000
npm run build  # Production build
```


## Project Overview

An interactive resume/portfolio application with an AI-powered assistant. Built with TanStack Start and deployed on Netlify.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start |
| Frontend | React 19, TanStack Router v1 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| UI Components | Radix UI + custom components |
| Content | Content Collections (type-safe markdown) |
| AI | TanStack AI with multi-provider support |
| Language | TypeScript 5.7 (strict mode) |
| Deployment | Netlify |

## Directory Structure

```
├── public
│   ├── favicon.ico
│   ├── tanstack-circle-logo.png
│   └── tanstack-word-logo-white.svg  # TanStack wordmark logo (white) used in header/nav.
├── src
│   ├── components
│   │   ├── Calculator.tsx  # iOS-style calculator: digits, operations, evaluate, clear, percent.
│   │   ├── Header.tsx  # Header component.
│   │   └── HeaderNav.tsx  # Navigation sidebar template: mobile menu, Home link, add-on routes; EJS-driven for dynamic route generation.
│   ├── routes
│   │   ├── __root.tsx  # Root layout: HTML shell, styles.
│   │   └── index.tsx  # Home route: renders Calculator component.
│   ├── router.tsx  # TanStack Router setup: creates router from generated routeTree with scroll restoration.
│   └── styles.css  # Global styles: Tailwind import plus base body/code font styling.
├── .gitignore  # Template for .gitignore: node_modules, dist, .env, .netlify, .tanstack, etc.
├── AGENTS.md  # This document provides an overview of the project structure for developers and AI agents working on this codebase.
├── netlify.toml  # Netlify deployment config: build command (vite build), publish directory (dist/client), and dev server settings (port 8888, target 3000).
├── package.json  # Project manifest with TanStack Start, React 19, Vite 7, Tailwind CSS 4, and Netlify plugin dependencies; defines dev and build scripts.
├── pnpm-lock.yaml
├── tsconfig.json  # TypeScript config: ES2022 target, strict mode, @/* path alias for src/*, bundler module resolution.
└── vite.config.ts  # Vite config template: TanStack Start, React, Tailwind, Netlify plugin, and optional add-on integrations; processed by EJS.
```

## Key Concepts

### File-Based Routing (TanStack Router)

Routes are defined by files in `src/routes/`:

- `__root.tsx` - Root layout wrapping all pages
- `index.tsx` - Route for `/`
- `api.*.ts` - Server API endpoints (e.g., `api.resume-chat.ts` → `/api/resume-chat`)

### Component Architecture

**UI Primitives** (`src/components/ui/`):
- Radix UI-based, Tailwind-styled
- Card, Badge, Checkbox, Separator, HoverCard

**Feature Components** (`src/components/`):
- Header, HeaderNav, ResumeAssistant

## Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite plugins: TanStack Start, Netlify, Tailwind, Content Collections |
| `tsconfig.json` | TypeScript config with `@/*` path alias for `src/*` |
| `netlify.toml` | Build command, output directory, dev server settings |
| `content-collections.ts` | Zod schemas for jobs and education frontmatter |
| `styles.css` | Tailwind imports + CSS custom properties (oklch colors) |

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
```

## Conventions

### Naming
- Components: PascalCase
- Utilities/hooks: camelCase
- Routes: kebab-case files

### Styling
- Tailwind CSS utility classes
- `cn()` helper for conditional class merging
- CSS variables for theme tokens in `styles.css`

### TypeScript
- Strict mode enabled
- Import paths use `@/` alias
- Zod for runtime validation
- Type-only imports with `type` keyword

### State Management
- React hooks for local state
- Zustand if you need it for global state
### Calculator Component

iOS-style calculator built with React `useReducer` for state management.

**State pattern:** `display`, `previousValue`, `operation`, `overwrite`

**Actions:** ADD_DIGIT, CHOOSE_OPERATION, EVALUATE, CLEAR, DELETE_DIGIT, PERCENT, TOGGLE_SIGN

No special dependencies beyond base TanStack Start. Pure React + Tailwind CSS.

## Application Name

This starter uses "Application Name" as a placeholder throughout the UI and metadata. Replace it with the user's desired application name in the following locations:

### UI Components
- `src/components/Header.tsx` — app name displayed in the header
- `src/components/HeaderNav.tsx` — app name in the mobile navigation header

### SEO Metadata
- `src/routes/__root.tsx` — the `title` field in the `head()` configuration

Search for all occurrences of "Application Name" in the `src/` directory and replace with the user's application name.
