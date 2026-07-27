# Graph Report - .  (2026-07-27)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1076 nodes · 1633 edges · 81 communities (54 shown, 27 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 114 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3ef7dfe0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useMasterDataStore
- gray
- BM25
- color
- TabStoring.tsx
- button
- slide_search_core.py
- spacing
- html-token-validator.py
- TestTailwindConfigGenerator
- compilerOptions
- BM25
- design_system.py
- DesignSystemGenerator
- generate-slide.py
- TailwindConfigGenerator
- devDependencies
- routeTree.gen.ts
- main
- fetch-background.py
- dependencies
- BM25
- icon/generate.py
- fontSize
- TestShadcnInstaller
- extract-colors.cjs
- validate-asset.cjs
- scripts/core.py
- .add_components
- validate-tokens.cjs
- ShadcnInstaller
- inject-brand-context.cjs
- embed-tokens.cjs
- primitive
- test_tailwind_config_gen.py
- logo/generate.py
- generate-tokens.cjs
- ._base_config
- sync-brand-to-tokens.cjs
- _run
- radius
- .generate_config_string
- search
- generate_design_system
- detect_domain
- package.json
- shadow
- lg
- xl
- default
- none
- validate_data.py
- test_sync_brand_to_tokens.py
- main
- shadcn_add.py
- .__init__
- .test_list_installed_empty
- .test_get_installed_components_empty
- .test_full_configuration_javascript
- lucide-react
- tailwindcss
- .test_add_components_already_installed
- .test_add_components_subprocess_error
- .test_add_components_npx_not_found
- .test_init_dry_run
- .test_check_shadcn_config_exists
- .test_add_components_no_components
- .test_add_color_palette
- .test_add_plugins_no_duplicates
- .test_recommend_plugins
- .test_recommend_plugins_nextjs
- .test_validate_config_no_content
- .test_init_javascript
- .test_write_config_invalid_path
- .test_add_colors
- konva
- @tanstack/router-plugin
- @tanstack/store
- use-image
- zustand
- vite.config.ts

## God Nodes (most connected - your core abstractions)
1. `TailwindConfigGenerator` - 57 edges
2. `TestTailwindConfigGenerator` - 35 edges
3. `ShadcnInstaller` - 33 edges
4. `useMasterDataStore` - 28 edges
5. `TestShadcnInstaller` - 26 edges
6. `useAppStore` - 19 edges
7. `compilerOptions` - 18 edges
8. `DesignSystemGenerator` - 18 edges
9. `color` - 15 edges
10. `TabStoring()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `TabStoring()` --references--> `react`  [EXTRACTED]
  src/components/features/TabStoring.tsx → package.json
- `TabKehadiran()` --references--> `react`  [EXTRACTED]
  src/components/features/TabKehadiran.tsx → package.json
- `TabTip()` --references--> `react`  [EXTRACTED]
  src/components/features/TabTip.tsx → package.json
- `ScheduleUploader()` --references--> `xlsx`  [EXTRACTED]
  src/components/features/ScheduleUploader.tsx → package.json
- `TestDomainDetection` --uses--> `BM25`  [INFERRED]
  .agents/skills/ui-ux-pro-max/scripts/tests/test_core.py → .agents/skills/design/scripts/cip/core.py

## Import Cycles
- None detected.

## Communities (81 total, 27 thin omitted)

### Community 0 - "useMasterDataStore"
Cohesion: 0.05
Nodes (58): react, xlsx, react, ALL_TABS, App(), TabItem, TOTAL_PAGES, AssetManager() (+50 more)

### Community 1 - "gray"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 2 - "BM25"
Cohesion: 0.06
Nodes (42): BM25, detect_domain(), get_cip_brief(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection (+34 more)

### Community 3 - "color"
Cohesion: 0.04
Nodes (48): $type, $value, background, destructive, destructive-foreground, foreground, muted, muted-foreground (+40 more)

### Community 4 - "TabStoring.tsx"
Cohesion: 0.09
Nodes (34): MONTHS, TabShiftReport(), TabStoring(), LiveCollagePreview(), LiveCollagePreviewProps, MonitorSearchIcon(), drawTextOnCanvas(), drawTextOverlay() (+26 more)

### Community 5 - "button"
Cohesion: 0.06
Nodes (45): $type, $value, $type, $value, bg, fg, font-size, hover-bg (+37 more)

### Community 6 - "slide_search_core.py"
Cohesion: 0.08
Nodes (36): format_context(), format_result(), main(), Format a single search result for display, Format contextual recommendations for display., BM25, calculate_pattern_break(), detect_domain() (+28 more)

### Community 7 - "spacing"
Cohesion: 0.06
Nodes (34): $type, $value, $type, $value, $type, $value, $type, $value (+26 more)

### Community 8 - "html-token-validator.py"
Cohesion: 0.14
Nodes (24): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+16 more)

### Community 9 - "TestTailwindConfigGenerator"
Cohesion: 0.07
Nodes (14): Test adding colors multiple times., Test adding custom spacing., Test adding custom breakpoints., Test TailwindConfigGenerator class., Test generating TypeScript configuration., Test initialization with default settings., Test writing configuration to file., Test that written config contains expected content. (+6 more)

### Community 10 - "compilerOptions"
Cohesion: 0.08
Nodes (25): DOM, DOM.Iterable, ES2022, **/*.ts, **/*.tsx, vite/client, compilerOptions, allowImportingTsExtensions (+17 more)

### Community 11 - "BM25"
Cohesion: 0.11
Nodes (19): BM25, detect_domain(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection, Search across all domains and combine results (+11 more)

### Community 12 - "design_system.py"
Cohesion: 0.11
Nodes (22): ansi_ljust(), _detect_page_type(), format_ascii_box(), format_master_md(), format_page_override_md(), _generate_intelligent_overrides(), hex_to_ansi(), persist_design_system() (+14 more)

### Community 13 - "DesignSystemGenerator"
Cohesion: 0.13
Nodes (12): DesignSystemGenerator, Find matching reasoning rule for a category., Apply reasoning rules to search results., Select best matching result based on priority keywords., Extract results list from search result dict., Generate complete design system recommendation.          variance/motion/densi, Bucket a 1-10 dial value into its tier config. Returns None if value is None., Generates design system recommendations from aggregated searches. (+4 more)

### Community 14 - "generate-slide.py"
Cohesion: 0.15
Nodes (19): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+11 more)

### Community 15 - "TailwindConfigGenerator"
Cohesion: 0.10
Nodes (11): Generate Tailwind CSS configuration files., Add full color palette (50-950 shades) for a base color.          Args:, TailwindConfigGenerator, Test adding custom fonts., Test generating JavaScript configuration., Test generating config with custom colors., Test generating config with plugins., Test validating valid configuration. (+3 more)

### Community 16 - "devDependencies"
Cohesion: 0.10
Nodes (20): @netlify/vite-plugin-tanstack-start, @tailwindcss/vite, devDependencies, @netlify/vite-plugin-tanstack-start, rimraf, @tailwindcss/vite, @types/node, @types/react (+12 more)

### Community 17 - "routeTree.gen.ts"
Cohesion: 0.14
Nodes (14): getRouter(), Route, Route, FileRoutesByFullPath, FileRoutesById, FileRoutesByPath, FileRoutesByTo, FileRouteTypes (+6 more)

### Community 18 - "main"
Cohesion: 0.13
Nodes (8): main(), Add custom font families.          Args:             fonts: Dict of font_type, Add custom spacing values.          Args:             spacing: Dict of name:, Add custom breakpoints.          Args:             breakpoints: Dict of name:, Add plugin requirements.          Args:             plugins: List of plugin n, Get plugin recommendations based on configuration.          Returns:, Validate configuration.          Returns:             Tuple of (valid, messag, Add custom colors to theme.          Args:             colors: Dict of color_

### Community 19 - "fetch-background.py"
Cohesion: 0.17
Nodes (17): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+9 more)

### Community 20 - "dependencies"
Cohesion: 0.12
Nodes (18): html2canvas, html2pdf.js, dependencies, html2canvas, html2pdf.js, react-dom, react-konva, @supabase/supabase-js (+10 more)

### Community 21 - "BM25"
Cohesion: 0.15
Nodes (9): BM25, _normalize(), Apply synonym substitution before tokenizing., BM25 ranking algorithm for text search, Lowercase, normalize synonyms, split, remove punctuation, filter stopwords, Build BM25 index from documents, Score all documents against query, All indexed terms, for suggestion/typo-recovery purposes. (+1 more)

### Community 22 - "icon/generate.py"
Cohesion: 0.20
Nodes (15): apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon(), generate_sizes(), load_env(), main() (+7 more)

### Community 23 - "fontSize"
Cohesion: 0.12
Nodes (16): $type, $value, $type, $value, $type, $value, $type, $value (+8 more)

### Community 24 - "TestShadcnInstaller"
Cohesion: 0.14
Nodes (8): Test adding components in dry run mode., Test successful component addition., Test ShadcnInstaller class., Test adding all components without config., Create temporary project structure., Test initialization with default project root., Test getting installed components without config., TestShadcnInstaller

### Community 25 - "extract-colors.cjs"
Cohesion: 0.22
Nodes (11): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+3 more)

### Community 26 - "validate-asset.cjs"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 27 - "scripts/core.py"
Cohesion: 0.21
Nodes (12): _domain_keywords(), _get_bm25(), _load_csv(), _load_product_keywords(), Load CSV and return list of dicts, with mtime-based caching., Fitted BM25 index for this file+columns, with mtime-based caching., Core search function using BM25. Returns (results, bm25_or_none)., Nearest known vocabulary terms for a query that returned 0 hits,     so the cal (+4 more)

### Community 28 - ".add_components"
Cohesion: 0.22
Nodes (7): main(), Add all available shadcn/ui components.          Args:             overwrite:, List installed components.          Returns:             Tuple of (success, m, Check if shadcn is initialized in project.          Returns:             True, Get list of already installed components.          Returns:             List, Read shadcn version from project package.json; fall back to a pinned default., Add shadcn/ui components.          Args:             components: List of comp

### Community 29 - "validate-tokens.cjs"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 30 - "ShadcnInstaller"
Cohesion: 0.17
Nodes (7): Handle shadcn/ui component installation., ShadcnInstaller, Test adding components without shadcn config., Test adding components with overwrite flag., Test successful addition of all components., Test initialization with custom project root., Test checking for non-existent shadcn config.

### Community 31 - "inject-brand-context.cjs"
Cohesion: 0.31
Nodes (10): extractColorsFromTable(), extractCoreAttributes(), extractHexColors(), extractImageStyle(), extractTypography(), extractVoice(), fs, generatePromptAddition() (+2 more)

### Community 32 - "embed-tokens.cjs"
Cohesion: 0.20
Nodes (9): args, extractTokens(), fs, minimal, MINIMAL_TOKENS, path, projectRoot, tokensPath (+1 more)

### Community 33 - "primitive"
Cohesion: 0.18
Nodes (11): fast, normal, slow, $type, $value, $type, $value, primitive (+3 more)

### Community 34 - "test_tailwind_config_gen.py"
Cohesion: 0.20
Nodes (7): Tests for tailwind_config_gen.py, Reduce a generated TS/JS config to a bare assignable object so it can be     ha, Regression guard for the missing-comma bug between the ``theme`` block and, The property preceding ``plugins`` must end with a comma (pure-Python         c, The emitted config parses as valid JS via ``node --check``., _strip_to_object(), TestGeneratedConfigIsValidJs

### Community 35 - "logo/generate.py"
Cohesion: 0.29
Nodes (9): enhance_prompt(), generate_batch(), generate_logo(), load_env(), main(), Enhance the logo prompt with style and industry modifiers, Generate a logo using Gemini models with image generation      Args:, Generate multiple logo variants with different styles (+1 more)

### Community 36 - "generate-tokens.cjs"
Cohesion: 0.36
Nodes (9): flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path, resolveReference() (+1 more)

### Community 37 - "._base_config"
Cohesion: 0.22
Nodes (6): Path, Initialize generator.          Args:             typescript: If True, generat, Determine default output path., Create base configuration structure., Get default content paths for framework., Any

### Community 38 - "sync-brand-to-tokens.cjs"
Cohesion: 0.33
Nodes (8): adjustBrightness(), { execFileSync }, extractColorsFromMarkdown(), fs, generateColorScale(), main(), path, updateDesignTokens()

### Community 39 - "_run"
Cohesion: 0.28
Nodes (8): Path, Regression tests for validate-tokens.cjs.  The validator used to skip any line, A hardcoded hex on the same line as a var() token is still a violation., A line that references only tokens produces no false positives., _run(), test_flags_hardcoded_hex_sharing_line_with_token(), test_token_only_line_reports_no_violation(), CompletedProcess

### Community 40 - "radius"
Cohesion: 0.29
Nodes (8): $type, $value, $type, $value, radius, full, md, md

### Community 41 - ".generate_config_string"
Cohesion: 0.20
Nodes (6): Generate configuration file content.          Returns:             Configurat, Generate TypeScript configuration., Generate JavaScript configuration., Format plugins array for config.          Validates each plugin name against a, Add indentation to JSON string., Write configuration to file.          Returns:             Tuple of (success,

### Community 42 - "search"
Cohesion: 0.36
Nodes (4): Main search function with auto-domain detection, search(), Known query -> expected top-domain sanity checks (not exact-row pinning,     si, TestSearchDomains

### Community 43 - "generate_design_system"
Cohesion: 0.29
Nodes (5): format_markdown(), generate_design_system(), Format design system as markdown., Main entry point for design system generation.      Args:         query: Sear, TestPersistence

### Community 44 - "detect_domain"
Cohesion: 0.43
Nodes (3): detect_domain(), Auto-detect the most relevant domain from query.      Matches are weighted by, TestDomainDetection

### Community 45 - "package.json"
Cohesion: 0.29
Nodes (6): name, private, scripts, build, dev, type

### Community 46 - "shadow"
Cohesion: 0.47
Nodes (6): sm, shadow, sm, sm, $type, $value

### Community 47 - "lg"
Cohesion: 0.60
Nodes (5): lg, $type, $value, lg, lg

### Community 48 - "xl"
Cohesion: 0.67
Nodes (4): xl, xl, $type, $value

### Community 49 - "default"
Cohesion: 0.67
Nodes (4): $type, $value, default, default

### Community 50 - "none"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

### Community 51 - "validate_data.py"
Cohesion: 0.83
Nodes (3): _check_file(), main(), _read_rows()

### Community 59 - "lucide-react"
Cohesion: 0.67
Nodes (3): lucide-react, lucide-react, lucide-react

### Community 60 - "tailwindcss"
Cohesion: 0.67
Nodes (3): tailwindcss, tailwindcss, tailwindcss

## Knowledge Gaps
- **193 isolated node(s):** `name`, `private`, `type`, `dev`, `build` (+188 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `primitive` connect `primitive` to `gray`, `color`, `spacing`, `radius`, `shadow`, `fontSize`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `color` connect `gray` to `primitive`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `useMasterDataStore`, `konva`, `@tanstack/router-plugin`, `package.json`, `@tanstack/store`, `use-image`, `devDependencies`, `zustand`, `lucide-react`, `tailwindcss`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 36 inferred relationships involving `TailwindConfigGenerator` (e.g. with `TestGeneratedConfigIsValidJs` and `.test_node_check_parses_generated_config()`) actually correct?**
  _`TailwindConfigGenerator` has 36 INFERRED edges - model-reasoned connections that need verification._
- **Are the 23 inferred relationships involving `ShadcnInstaller` (e.g. with `TestShadcnInstaller` and `.test_add_all_components_dry_run()`) actually correct?**
  _`ShadcnInstaller` has 23 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `type` to the rest of the system?**
  _193 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useMasterDataStore` be split into smaller, more focused modules?**
  _Cohesion score 0.05054945054945055 - nodes in this community are weakly interconnected._