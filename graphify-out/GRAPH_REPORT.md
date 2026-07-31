# Graph Report - .  (2026-07-31)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1182 nodes · 1804 edges · 94 communities (61 shown, 33 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 120 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ffd54d6f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- TabInitialReport.tsx
- server.cjs
- gray
- BM25
- color
- button
- useMasterDataStore
- slide_search_core.py
- spacing
- locationRules.ts
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
- fetch-background.py
- dependencies
- BM25
- icon/generate.py
- fontSize
- TestShadcnInstaller
- main
- extract-colors.cjs
- validate-asset.cjs
- scripts/core.py
- .add_components
- validate-tokens.cjs
- ShadcnInstaller
- ._generate_javascript
- inject-brand-context.cjs
- embed-tokens.cjs
- primitive
- test_tailwind_config_gen.py
- logo/generate.py
- generate-tokens.cjs
- ._base_config
- helper.js
- sync-brand-to-tokens.cjs
- _run
- render-graphs.js
- radius
- search
- generate_design_system
- stop-server.sh
- detect_domain
- package.json
- shadow
- lg
- default
- none
- md
- validate_data.py
- start-server.sh
- test_sync_brand_to_tokens.py
- main
- shadcn_add.py
- .__init__
- .test_get_installed_components_empty
- .test_list_installed_empty
- .test_full_configuration_javascript
- tailwindcss
- @tailwindcss/vite
- review-package
- sdd-workspace
- task-brief
- find-polluter.sh
- .test_add_components_subprocess_error
- .test_add_components_npx_not_found
- .test_add_components_already_installed
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
- html2canvas
- konva
- react-konva
- vite-tsconfig-paths
- xlsx
- zustand
- vite.config.ts

## God Nodes (most connected - your core abstractions)
1. `TailwindConfigGenerator` - 57 edges
2. `TestTailwindConfigGenerator` - 35 edges
3. `ShadcnInstaller` - 33 edges
4. `TestShadcnInstaller` - 26 edges
5. `useMasterDataStore` - 19 edges
6. `DesignSystemGenerator` - 18 edges
7. `compilerOptions` - 18 edges
8. `color` - 15 edges
9. `handleRequest()` - 14 edges
10. `gray` - 12 edges

## Surprising Connections (you probably didn't know these)
- `TabTip()` --references--> `react`  [EXTRACTED]
  src/components/features/TabTip.tsx → package.json
- `ScheduleUploader()` --references--> `xlsx`  [EXTRACTED]
  src/components/features/ScheduleUploader.tsx → package.json
- `TestDomainDetection` --uses--> `BM25`  [INFERRED]
  .agents/skills/ui-ux-pro-max/scripts/tests/test_core.py → .agents/skills/design/scripts/cip/core.py
- `TestPersistence` --uses--> `BM25`  [INFERRED]
  .agents/skills/ui-ux-pro-max/scripts/tests/test_core.py → .agents/skills/design/scripts/cip/core.py
- `TestReasoningMatch` --uses--> `BM25`  [INFERRED]
  .agents/skills/ui-ux-pro-max/scripts/tests/test_core.py → .agents/skills/design/scripts/cip/core.py

## Import Cycles
- None detected.

## Communities (94 total, 33 thin omitted)

### Community 0 - "TabInitialReport.tsx"
Cohesion: 0.07
Nodes (56): react, react, formatNamaPersonel(), TabInitialReport(), TabKegiatan(), formatNamaPersonel(), TabPerbaikan(), MONTHS (+48 more)

### Community 1 - "server.cjs"
Cohesion: 0.06
Nodes (55): bootstrapPage(), brandMarkup(), broadcast(), browserLauncherForPlatform(), chmodOwnerOnly(), clients, companionUrl(), computeAcceptKey() (+47 more)

### Community 2 - "gray"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 3 - "BM25"
Cohesion: 0.06
Nodes (42): BM25, detect_domain(), get_cip_brief(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection (+34 more)

### Community 4 - "color"
Cohesion: 0.04
Nodes (48): $type, $value, background, destructive, destructive-foreground, foreground, muted, muted-foreground (+40 more)

### Community 5 - "button"
Cohesion: 0.06
Nodes (45): $type, $value, $type, $value, bg, fg, font-size, hover-bg (+37 more)

### Community 6 - "useMasterDataStore"
Cohesion: 0.08
Nodes (20): AssetManager(), TabType, AssetMasterLokasi(), AssetMasterPeralatan(), ChecklistDataEditor(), ScheduleUploader(), SparepartManager(), TabBriefing() (+12 more)

### Community 7 - "slide_search_core.py"
Cohesion: 0.08
Nodes (36): format_context(), format_result(), main(), Format a single search result for display, Format contextual recommendations for display., BM25, calculate_pattern_break(), detect_domain() (+28 more)

### Community 8 - "spacing"
Cohesion: 0.06
Nodes (34): $type, $value, $type, $value, $type, $value, $type, $value (+26 more)

### Community 9 - "locationRules.ts"
Cohesion: 0.17
Nodes (21): ALL_TABS, App(), TabItem, TOTAL_PAGES, TabChecklist(), TabKalibrasi(), TabStoring(), ChecklistShiftDataValue (+13 more)

### Community 10 - "html-token-validator.py"
Cohesion: 0.14
Nodes (24): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+16 more)

### Community 11 - "TestTailwindConfigGenerator"
Cohesion: 0.07
Nodes (14): Test adding colors multiple times., Test adding custom spacing., Test adding custom breakpoints., Test TailwindConfigGenerator class., Test generating TypeScript configuration., Test initialization with default settings., Test writing configuration to file., Test that written config contains expected content. (+6 more)

### Community 12 - "compilerOptions"
Cohesion: 0.08
Nodes (25): DOM, DOM.Iterable, ES2022, **/*.ts, **/*.tsx, vite/client, compilerOptions, allowImportingTsExtensions (+17 more)

### Community 13 - "BM25"
Cohesion: 0.11
Nodes (19): BM25, detect_domain(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection, Search across all domains and combine results (+11 more)

### Community 14 - "design_system.py"
Cohesion: 0.11
Nodes (22): ansi_ljust(), _detect_page_type(), format_ascii_box(), format_master_md(), format_page_override_md(), _generate_intelligent_overrides(), hex_to_ansi(), persist_design_system() (+14 more)

### Community 15 - "DesignSystemGenerator"
Cohesion: 0.13
Nodes (12): DesignSystemGenerator, Find matching reasoning rule for a category., Apply reasoning rules to search results., Select best matching result based on priority keywords., Extract results list from search result dict., Generate complete design system recommendation.          variance/motion/densi, Bucket a 1-10 dial value into its tier config. Returns None if value is None., Generates design system recommendations from aggregated searches. (+4 more)

### Community 16 - "generate-slide.py"
Cohesion: 0.15
Nodes (19): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+11 more)

### Community 17 - "TailwindConfigGenerator"
Cohesion: 0.10
Nodes (11): Generate Tailwind CSS configuration files., Add full color palette (50-950 shades) for a base color.          Args:, TailwindConfigGenerator, Test adding custom fonts., Test generating JavaScript configuration., Test generating config with custom colors., Test generating config with plugins., Test validating valid configuration. (+3 more)

### Community 18 - "devDependencies"
Cohesion: 0.10
Nodes (20): lucide-react, @netlify/vite-plugin-tanstack-start, lucide-react, devDependencies, lucide-react, @netlify/vite-plugin-tanstack-start, rimraf, @types/node (+12 more)

### Community 19 - "routeTree.gen.ts"
Cohesion: 0.14
Nodes (14): getRouter(), Route, Route, FileRoutesByFullPath, FileRoutesById, FileRoutesByPath, FileRoutesByTo, FileRouteTypes (+6 more)

### Community 20 - "fetch-background.py"
Cohesion: 0.17
Nodes (17): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+9 more)

### Community 21 - "dependencies"
Cohesion: 0.12
Nodes (18): html2pdf.js, dependencies, html2pdf.js, react-dom, @supabase/supabase-js, @tanstack/react-router, @tanstack/react-start, @tanstack/react-store (+10 more)

### Community 22 - "BM25"
Cohesion: 0.15
Nodes (9): BM25, _normalize(), Apply synonym substitution before tokenizing., BM25 ranking algorithm for text search, Lowercase, normalize synonyms, split, remove punctuation, filter stopwords, Build BM25 index from documents, Score all documents against query, All indexed terms, for suggestion/typo-recovery purposes. (+1 more)

### Community 23 - "icon/generate.py"
Cohesion: 0.20
Nodes (15): apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon(), generate_sizes(), load_env(), main() (+7 more)

### Community 24 - "fontSize"
Cohesion: 0.12
Nodes (16): $type, $value, $type, $value, $type, $value, $type, $value (+8 more)

### Community 25 - "TestShadcnInstaller"
Cohesion: 0.14
Nodes (8): Test adding components in dry run mode., Test successful component addition., Test ShadcnInstaller class., Test adding all components without config., Create temporary project structure., Test initialization with default project root., Test getting installed components without config., TestShadcnInstaller

### Community 26 - "main"
Cohesion: 0.11
Nodes (10): main(), Add custom font families.          Args:             fonts: Dict of font_type, Add custom spacing values.          Args:             spacing: Dict of name:, Add custom breakpoints.          Args:             breakpoints: Dict of name:, Add plugin requirements.          Args:             plugins: List of plugin n, Get plugin recommendations based on configuration.          Returns:, Generate configuration file content.          Returns:             Configurat, Write configuration to file.          Returns:             Tuple of (success, (+2 more)

### Community 27 - "extract-colors.cjs"
Cohesion: 0.22
Nodes (11): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+3 more)

### Community 28 - "validate-asset.cjs"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 29 - "scripts/core.py"
Cohesion: 0.21
Nodes (12): _domain_keywords(), _get_bm25(), _load_csv(), _load_product_keywords(), Load CSV and return list of dicts, with mtime-based caching., Fitted BM25 index for this file+columns, with mtime-based caching., Core search function using BM25. Returns (results, bm25_or_none)., Nearest known vocabulary terms for a query that returned 0 hits,     so the cal (+4 more)

### Community 30 - ".add_components"
Cohesion: 0.22
Nodes (7): main(), Add all available shadcn/ui components.          Args:             overwrite:, List installed components.          Returns:             Tuple of (success, m, Check if shadcn is initialized in project.          Returns:             True, Get list of already installed components.          Returns:             List, Read shadcn version from project package.json; fall back to a pinned default., Add shadcn/ui components.          Args:             components: List of comp

### Community 31 - "validate-tokens.cjs"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 32 - "ShadcnInstaller"
Cohesion: 0.17
Nodes (7): Handle shadcn/ui component installation., ShadcnInstaller, Test adding components without shadcn config., Test adding components with overwrite flag., Test successful addition of all components., Test initialization with custom project root., Test checking for non-existent shadcn config.

### Community 33 - "._generate_javascript"
Cohesion: 0.29
Nodes (4): Generate TypeScript configuration., Generate JavaScript configuration., Format plugins array for config.          Validates each plugin name against a, Add indentation to JSON string.

### Community 34 - "inject-brand-context.cjs"
Cohesion: 0.31
Nodes (10): extractColorsFromTable(), extractCoreAttributes(), extractHexColors(), extractImageStyle(), extractTypography(), extractVoice(), fs, generatePromptAddition() (+2 more)

### Community 35 - "embed-tokens.cjs"
Cohesion: 0.20
Nodes (9): args, extractTokens(), fs, minimal, MINIMAL_TOKENS, path, projectRoot, tokensPath (+1 more)

### Community 36 - "primitive"
Cohesion: 0.18
Nodes (11): fast, normal, slow, $type, $value, $type, $value, primitive (+3 more)

### Community 37 - "test_tailwind_config_gen.py"
Cohesion: 0.20
Nodes (7): Tests for tailwind_config_gen.py, Reduce a generated TS/JS config to a bare assignable object so it can be     ha, Regression guard for the missing-comma bug between the ``theme`` block and, The property preceding ``plugins`` must end with a comma (pure-Python         c, The emitted config parses as valid JS via ``node --check``., _strip_to_object(), TestGeneratedConfigIsValidJs

### Community 38 - "logo/generate.py"
Cohesion: 0.29
Nodes (9): enhance_prompt(), generate_batch(), generate_logo(), load_env(), main(), Enhance the logo prompt with style and industry modifiers, Generate a logo using Gemini models with image generation      Args:, Generate multiple logo variants with different styles (+1 more)

### Community 39 - "generate-tokens.cjs"
Cohesion: 0.36
Nodes (9): flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path, resolveReference() (+1 more)

### Community 40 - "._base_config"
Cohesion: 0.22
Nodes (6): Path, Initialize generator.          Args:             typescript: If True, generat, Determine default output path., Create base configuration structure., Get default content paths for framework., Any

### Community 41 - "helper.js"
Cohesion: 0.42
Nodes (7): connect(), nextReconnectDelay(), reloadAfterRecovery(), sessionKey(), setStatus(), showTombstone(), websocketUrl()

### Community 42 - "sync-brand-to-tokens.cjs"
Cohesion: 0.33
Nodes (8): adjustBrightness(), { execFileSync }, extractColorsFromMarkdown(), fs, generateColorScale(), main(), path, updateDesignTokens()

### Community 43 - "_run"
Cohesion: 0.28
Nodes (8): Path, Regression tests for validate-tokens.cjs.  The validator used to skip any line, A hardcoded hex on the same line as a var() token is still a violation., A line that references only tokens produces no false positives., _run(), test_flags_hardcoded_hex_sharing_line_with_token(), test_token_only_line_reports_no_violation(), CompletedProcess

### Community 44 - "render-graphs.js"
Cohesion: 0.33
Nodes (8): combineGraphs(), { execSync }, extractDotBlocks(), extractGraphBody(), fs, main(), path, renderToSvg()

### Community 45 - "radius"
Cohesion: 0.29
Nodes (8): xl, $type, $value, radius, full, xl, $type, $value

### Community 46 - "search"
Cohesion: 0.36
Nodes (4): Main search function with auto-domain detection, search(), Known query -> expected top-domain sanity checks (not exact-row pinning,     si, TestSearchDomains

### Community 47 - "generate_design_system"
Cohesion: 0.29
Nodes (5): format_markdown(), generate_design_system(), Format design system as markdown., Main entry point for design system generation.      Args:         query: Sear, TestPersistence

### Community 48 - "stop-server.sh"
Cohesion: 0.43
Nodes (4): command_has_server_id(), is_brainstorm_server(), mark_stopped(), stop-server.sh script

### Community 49 - "detect_domain"
Cohesion: 0.43
Nodes (3): detect_domain(), Auto-detect the most relevant domain from query.      Matches are weighted by, TestDomainDetection

### Community 50 - "package.json"
Cohesion: 0.29
Nodes (6): name, private, scripts, build, dev, type

### Community 51 - "shadow"
Cohesion: 0.47
Nodes (6): sm, shadow, sm, sm, $type, $value

### Community 52 - "lg"
Cohesion: 0.60
Nodes (5): lg, $type, $value, lg, lg

### Community 53 - "default"
Cohesion: 0.67
Nodes (4): $type, $value, default, default

### Community 54 - "none"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

### Community 55 - "md"
Cohesion: 0.67
Nodes (4): $type, $value, md, md

### Community 57 - "validate_data.py"
Cohesion: 0.83
Nodes (3): _check_file(), main(), _read_rows()

### Community 66 - "tailwindcss"
Cohesion: 0.67
Nodes (3): tailwindcss, tailwindcss, tailwindcss

### Community 67 - "@tailwindcss/vite"
Cohesion: 0.67
Nodes (3): @tailwindcss/vite, @tailwindcss/vite, @tailwindcss/vite

## Knowledge Gaps
- **219 isolated node(s):** `crypto`, `http`, `fs`, `path`, `OPCODES` (+214 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `primitive` connect `primitive` to `gray`, `color`, `spacing`, `radius`, `shadow`, `fontSize`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `color` connect `color` to `button`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `color` connect `gray` to `primitive`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Are the 36 inferred relationships involving `TailwindConfigGenerator` (e.g. with `TestGeneratedConfigIsValidJs` and `.test_node_check_parses_generated_config()`) actually correct?**
  _`TailwindConfigGenerator` has 36 INFERRED edges - model-reasoned connections that need verification._
- **Are the 23 inferred relationships involving `ShadcnInstaller` (e.g. with `TestShadcnInstaller` and `.test_add_all_components_dry_run()`) actually correct?**
  _`ShadcnInstaller` has 23 INFERRED edges - model-reasoned connections that need verification._
- **What connects `crypto`, `http`, `fs` to the rest of the system?**
  _219 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TabInitialReport.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07494824016563147 - nodes in this community are weakly interconnected._