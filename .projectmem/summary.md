# projectmem - W69-017 Affiliates

_Last updated: 2026-11-10_

## Project purpose
Bilingual (TH/EN) zero-dependency static web application (`TCO // BENCHMARK.26` / `ai-cost.dev`) that calculates real-world LLM API vs. Dedicated Cloud GPU vs. Local Hardware & Thai/Global Cloud VPS unit economics across 353 programmatic SEO and architecture playbook pages, routing high-intent developer and business traffic to verified affiliate partners (`Novita AI`, `RunPod`, `Cloudways`, `Hostatom`, `Ruk-Com`, `Agensi.io`).

## Recent issues
- [DONE] #0004 Comparison subpages (vps_vs_vps, api_vs_gpu) always default to tab-api and API/GPU winner CTA, interactive tools (hybrid router, VPS RAM sizer, rent-vs-buy cards) lack inline affiliate CTAs, CTA labels lack value hooks, and config/affiliates.json overstates Hostatom payout ($25 vs $4.35 / 150... [src/generator.ts, config/affiliates.json, src/calculator.ts] (fixed)
- [DONE] #0003 480 matchup affiliate CTA links in comparison subpages lack onclick telemetry, 10 Playbook guide pages lack unique_sessions/page_views/affiliate_clicks_total tracking and are omitted from cli-seo.ts IndexNow submission, and telemetry fetch lacks keepalive:true + tab/copy interaction logging [src/playbooks-catalog.ts:289-352, src/generator.ts:387-422, src/cli-seo.ts:30-35] (fixed)
- [DONE] #0002 Color palette in src/generator.ts, src/prototype-th.html, and src/playbooks-catalog.ts uses AI-slop indigo/blurple (#6C79F0), multi-colored neon rainbow bars (#3DD68C, #56A8FF, #B98BFF, #F2A33C), diagonal translucent gradients, emojis, and mismatched white SVGs inside dark cards. [src/generator.ts:167-173] (fixed)
- [DONE] #0001 Thai comparison subpages (dist/th/compare/*.html) are 76.1KB (> 65KB budget) and src/generator.ts has not yet rolled out the unified 4-tab + 5-hardware-tool developer-first design from src/prototype-th.html across all 353 pages [src/generator.ts] (fixed)
- [DONE] #legacy_bc6b Legacy issue: feat(affiliates): route closed Vercel affiliate slot to live Cloudways ID 2225344 (0 placeholders left) (fixed)
- [DONE] #legacy_4796 Legacy issue: fix(affiliates): match exact Novita AI query parameter order (?ref=zge5ztg&utm_source=affiliate) (fixed)
- [DONE] #legacy_3c78 Legacy issue: fix(affiliates): replace closed aimlapi affiliate with active Novita AI (200+ Model APIs) program (fixed)

## Decisions
- Use zero-dependency Node.js 22 native TypeScript static site generator (src/generator.ts) with atomic staging directory swap (.tmp-dist-*) to build 353 bilingual HTML pages, inline SVGs, and SEO sitemaps into dist/ [src/generator.ts]
- Unify all 353 generated pages on the developer-first UI design from src/prototype-th.html (Dark/Light theme with --paper:#FBFBFD light token, Hero Line-of-Sight diagram, 4 tabs, 5 hardware-buyer decision tools, and precomputed locale APP_DATA to keep every subpage < 65KB) [src/generator.ts]
- Added 4 interactive reader decision tools across all 343 calculator pages (1: Live Thai Prompt & Token Tax Inspector, 2: RAG Vector DB & Webhook VPS RAM Sizer with 1-line Qdrant+n8n Docker command, 3: Single-Key Hybrid 80/20 Model Router Calculator, 4: 1-Click 6-Line Executive Spec Summary Copy)...
- Route comparison subpages to their category-matching calculator tab by default (vps_vs_vps -> tab-vps, api_vs_gpu -> tab-gpu), embed direct affiliate CTAs inside interactive tool readouts (#hybrid-router-summary, #vps-ram-summary, #buyrent-grid) and workload_usecase spotlight cards, prioritize... [src/generator.ts, src/playbooks-catalog.ts, config/affiliates.json]

## Notes
- feat(seo): add Google Search Console HTML & meta tag verification tokens
- feat(seo): generate plain-text sitemap.txt alongside sitemap.xml for Google Search Console
- New feature: feat: add visual SVG architecture diagrams, live cost curve, and 5 practical AI playbooks [src/domain.ts]
- New feature: feat: add SVG brand logo & favicon, remove public Live Stats page (moved to xamathi.com/admin) [src/generator.ts]
- New feature: feat(prototype): add Claude-designed developer-first prototype page (/th/prototype.html) [src/generator.ts]
- New feature: feat(prototype): add Hero Line-of-Sight diagram and 5 hardware-buyer decision tools [src/prototype-th.html]
- Session pause handoff (31057a7): Live Stats moved to xamathi.com/admin (d2ce43f). Developer-first prototype with Hero Line-of-Sight & 5 hardware-buyer tools (VRAM checker, concurrency, Rent vs Buy payback, vLLM command, Thai VAT 7% VPS table) verified and deployed at /th/prototype.html. Next... [src/prototype-th.html]
- gotcha: UTF-8 Thai text uses 3 bytes per character, causing Thai comparison subpages (dist/th/compare/*.html) to reach 76.1KB and exceed the 65KB budget unless CSS/JS and APP_DATA are minified and deduplicated per locale [src/generator.ts]
- New feature: feat(ui,tools,docs): rollout monochrome ledger UI, 4 buyer decision tools, and updated docs across 353 pages [src/generator.ts]
- Updated agensi-skills-pack/devguard to v1.1.0 (SKILL.md, references/devguard-cli-and-checks.md, templates/checks.template, devguard-logo.png, devguard.zip) and synced live Agensi.io listing (id c3dce39f-e93b-4f0c-97d1-8d4b14e33908, version 1.1.0, security_status=pass). [agensi-skills-pack/devguard/SKILL.md]

## Key files
- `.gitignore`
- `config/affiliates.json`
- `package.json`
- `src/calculator.ts`
- `src/domain.ts`
- `tests/calculator.test.ts`
- `src/cli-build.ts`
- `src/generator.ts`
- `src/pages-catalog.ts`
- `src/server.ts`
- `tests/generator.test.ts`
- `src/cli-affiliate.ts`
- `README.md`
- `src/cli-seo.ts`
- `agensi-skills-pack/AGENSI-PUBLISHING-GUIDE.md`
- `agensi-skills-pack/swiss-minimal-ui-ledger.zip`
- `agensi-skills-pack/swiss-minimal-ui-ledger/SKILL.md`
- `agensi-skills-pack/swiss-minimal-ui-ledger/references/css-tokens-and-grid.md`
- `agensi-skills-pack/token-budget-architect.zip`
- `agensi-skills-pack/token-budget-architect/SKILL.md`

## Open questions
- None logged yet.
