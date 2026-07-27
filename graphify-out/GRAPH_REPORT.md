# Graph Report - C:\Users\Yuli Syarif\normal-operasi  (2026-07-21)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 243 nodes · 594 edges · 19 communities (12 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f135d174`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- TabStoring.tsx
- App.tsx
- compilerOptions
- useMasterDataStore.ts
- devDependencies
- routeTree.gen.ts
- dependencies
- shareToWhatsApp
- waGenerator.ts
- package.json
- tailwindcss
- lucide-react
- html2canvas
- konva
- @supabase/supabase-js
- vite-tsconfig-paths
- xlsx
- zustand
- vite.config.ts

## God Nodes (most connected - your core abstractions)
1. `useMasterDataStore` - 24 edges
2. `shareToWhatsApp()` - 20 edges
3. `useAppStore` - 19 edges
4. `compilerOptions` - 18 edges
5. `processPhotosToCollage()` - 17 edges
6. `supabase` - 15 edges
7. `TabKalibrasi()` - 14 edges
8. `TabStoring()` - 14 edges
9. `TabInitialReport()` - 13 edges
10. `TabPerbaikan()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `TabKehadiran()` --references--> `react`  [EXTRACTED]
  src/components/features/TabKehadiran.tsx → package.json
- `TabTip()` --references--> `react`  [EXTRACTED]
  src/components/features/TabTip.tsx → package.json
- `ScheduleUploader()` --references--> `xlsx`  [EXTRACTED]
  src/components/features/ScheduleUploader.tsx → package.json
- `TabBriefing()` --references--> `react`  [EXTRACTED]
  src/components/features/TabBriefing.tsx → package.json
- `TabInitialReport()` --references--> `react`  [EXTRACTED]
  src/components/features/TabInitialReport.tsx → package.json

## Import Cycles
- None detected.

## Communities (19 total, 7 thin omitted)

### Community 0 - "TabStoring.tsx"
Cohesion: 0.15
Nodes (34): react, react, TabBriefing(), formatNamaPersonel(), TabInitialReport(), TabKalibrasi(), TabKegiatan(), formatNamaPersonel() (+26 more)

### Community 1 - "App.tsx"
Cohesion: 0.14
Nodes (18): App(), AssetManager(), TabType, AssetMasterLokasi(), AssetMasterPeralatan(), ScheduleUploader(), TabChecklist(), LocalDataEditor() (+10 more)

### Community 2 - "compilerOptions"
Cohesion: 0.08
Nodes (25): DOM, DOM.Iterable, ES2022, **/*.ts, **/*.tsx, vite/client, compilerOptions, allowImportingTsExtensions (+17 more)

### Community 3 - "useMasterDataStore.ts"
Cohesion: 0.16
Nodes (14): ChecklistDataEditor(), TabKehadiran(), DEFAULT_CHECKLIST_DATA, DEFAULT_DATA_API_T2, DEFAULT_DATA_OM_IAS_T2, DEFAULT_STORING_EQUIPMENTS, DEFAULT_STORING_LOC_AC, DEFAULT_STORING_LOC_DEFAULT (+6 more)

### Community 4 - "devDependencies"
Cohesion: 0.10
Nodes (20): @netlify/vite-plugin-tanstack-start, @tailwindcss/vite, devDependencies, @netlify/vite-plugin-tanstack-start, rimraf, @tailwindcss/vite, @types/node, @types/react (+12 more)

### Community 5 - "routeTree.gen.ts"
Cohesion: 0.14
Nodes (14): getRouter(), Route, Route, FileRoutesByFullPath, FileRoutesById, FileRoutesByPath, FileRoutesByTo, FileRouteTypes (+6 more)

### Community 6 - "dependencies"
Cohesion: 0.12
Nodes (18): html2pdf.js, dependencies, html2pdf.js, react-dom, react-konva, @tanstack/react-router, @tanstack/react-start, @tanstack/react-store (+10 more)

### Community 7 - "shareToWhatsApp"
Cohesion: 0.25
Nodes (12): MONTHS, TabShiftReport(), TIP_MONTHS, fallbackShare(), shareToWhatsApp(), deleteSheetReport(), determineShift(), fileToBase64() (+4 more)

### Community 8 - "waGenerator.ts"
Cohesion: 0.35
Nodes (10): checkNeedsStoringSupervisorAvsec(), formatTanggalIndo(), formatACLokasiList(), formatPersonnelList(), generateWA_Briefing(), generateWA_Checklist(), generateWA_Kalibrasi(), generateWA_Kegiatan() (+2 more)

### Community 9 - "package.json"
Cohesion: 0.29
Nodes (6): name, private, scripts, build, dev, type

### Community 10 - "tailwindcss"
Cohesion: 0.67
Nodes (3): tailwindcss, tailwindcss, tailwindcss

### Community 11 - "lucide-react"
Cohesion: 0.67
Nodes (3): lucide-react, lucide-react, lucide-react

## Knowledge Gaps
- **64 isolated node(s):** `name`, `private`, `type`, `dev`, `build` (+59 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `TabStoring.tsx`, `devDependencies`, `package.json`, `tailwindcss`, `lucide-react`, `html2canvas`, `konva`, `@supabase/supabase-js`, `vite-tsconfig-paths`, `xlsx`, `zustand`?**
  _High betweenness centrality (0.363) - this node is a cross-community bridge._
- **Why does `react` connect `TabStoring.tsx` to `App.tsx`, `useMasterDataStore.ts`, `dependencies`?**
  _High betweenness centrality (0.293) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`, `tailwindcss`, `lucide-react`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **What connects `name`, `private`, `type` to the rest of the system?**
  _64 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TabStoring.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.149822695035461 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13903743315508021 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._