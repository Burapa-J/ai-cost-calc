# Project Map - W69-017 Affiliates

Status: active (`ai-cost-calc` bilingual static TCO & hardware-buyer planner).

## Project purpose
Bilingual (TH/EN) zero-dependency static web application (`TCO // BENCHMARK.26` / `ai-cost.dev`) that calculates real-world LLM API vs. Dedicated Cloud GPU vs. Local Hardware & Thai/Global Cloud VPS unit economics across 353 programmatic SEO and architecture playbook pages, routing high-intent developer and business traffic to verified affiliate partners (`Novita AI`, `RunPod`, `Cloudways`, `Hostatom`, `Ruk-Com`, `Agensi.io`).

## Stack
- Tags: typescript, nodejs, static-site-generator, seo, affiliate
- Runtime: Node.js 22+ native TypeScript execution (`node --test`, `node src/cli-build.ts`, zero external runtime npm packages)

## Structure
- `config/` — runtime & partner configuration
  - `config/affiliates.json` — USD/THB default exchange rate (`34.5`), IndexNow key, Google Search Console verification token, and 7 active affiliate partner configs (`aimlapi`/Novita AI, `runpod`, `cloudways`, `vercel`, `hostatom`, `rukcom`, `agensi`)
- `src/` — core domain, calculator engine, static site generator, and CLIs
  - `src/domain.ts` — typed data models (`AffiliateConfigFile`, `LlmModelSpec`, `CloudGpuSpec`, `CloudVpsSpec`, `PlaybookGuideSpec`, `ProgrammaticComparisonPageSpec`) and pricing catalogs (`LLM_MODELS`, `CLOUD_GPUS`, `CLOUD_VPS_OPTIONS`, `AGENT_SKILLS_CATALOG`, `WORKLOAD_ARCHETYPES`)
  - `src/calculator.ts` — pure unit-economics engine (`sanitizeWorkloadInput`, `calculateCostComparison`, `resolveAffiliateUrl`, `updateAffiliateCode`, `DemandValidationStore`)
  - `src/pages-catalog.ts` — `buildProgrammaticPagesCatalog()` generating 170 comparison specs (`api_vs_api`, `api_vs_gpu`, `vps_vs_vps`, `workload_usecase`) for 340 bilingual subpages
  - `src/playbooks-catalog.ts` — `buildPlaybooksCatalog()`, `renderPlaybookSvg()`, and `renderSpecificMatchupCard()` for 5 bilingual production AI playbooks (`10` guide pages) and head-to-head SVG cards
  - `src/generator.ts` — `generateStaticSite()` atomic static site builder outputting 353 HTML pages (`index.html`, `th/index.html`, `en/index.html`, `th/prototype.html`, 340 `compare/*.html`, 10 `guides/*.html`), `favicon.svg`, `sitemap.xml`, `sitemap.txt`, `llms.txt` into `dist/`
  - `src/prototype-th.html` — reference developer-first UI design with Dark/Light theme, Hero Line-of-Sight SVG banner, 4 tabs (`API`, `GPU`, `VPS`, `Guides`), and 5 hardware-buyer decision tools (VRAM fit, concurrency tok/s, Rent vs Buy local hardware payback, Persistent Volume + vLLM command, Thai VAT 7% VPS matrix)
  - `src/cli-build.ts` — CLI entry point for `npm run build`
  - `src/cli-affiliate.ts` — CLI to inspect or update partner codes in `config/affiliates.json` and rebuild `dist/`
  - `src/cli-seo.ts` — CLI to set Google Search Console token (`set-gsc`) or submit 342+ URLs to IndexNow
  - `src/server.ts` — `startValidationServer()` local preview & `/api/telemetry` JSONL server (`http://127.0.0.1:4173`)
- `tests/` — automated test suite (`node:test`)
  - `tests/calculator.test.ts` — unit & boundary tests for input clamping, API vs GPU break-even math, affiliate URL construction, and telemetry deduplication
  - `tests/generator.test.ts` — idempotency, SEO tags, `< 65KB` page budget, SVG/affiliate integrity, and live HTTP server round-trip tests
- `agensi-skills-pack/` — 4 packaged AI agent skills published on Agensi.io (`cloud-gpu-breakeven-auditor`, `devguard`, `swiss-minimal-ui-ledger`, `token-budget-architect`)

## Relationships
- `src/cli-build.ts` reads `config/affiliates.json` and calls `src/generator.ts#generateStaticSite`
- `src/generator.ts` imports `src/calculator.ts`, `src/domain.ts`, `src/pages-catalog.ts`, and `src/playbooks-catalog.ts` to render all 353 HTML pages into `dist/`
- `src/pages-catalog.ts` and `src/playbooks-catalog.ts` read model/GPU/VPS specs from `src/domain.ts`
- `src/server.ts` serves static files from `dist/` and records `/api/telemetry` events via `src/calculator.ts#DemandValidationStore`
- `tests/calculator.test.ts` and `tests/generator.test.ts` verify `src/calculator.ts`, `src/generator.ts`, and `src/server.ts`

## Entry points
- `npm run build` → `node src/cli-build.ts`
- `npm run test` → `node --test tests/*.test.ts`
- `npm run serve` → `node src/server.ts`
