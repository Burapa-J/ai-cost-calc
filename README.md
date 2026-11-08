# TCO // BENCHMARK.26 — Practical AI Cost, GPU VRAM & Architecture Planner (EN / TH)

**Live Interactive Calculators & Architecture Playbooks (353 Static Pages):**
- **ตารางคำนวณงบ AI และจัดสเปกภาษาไทย (TH):** [https://burapa-j.github.io/ai-cost-calc/th/index.html](https://burapa-j.github.io/ai-cost-calc/th/index.html)
- **English AI Cost & Architecture Planner (EN):** [https://burapa-j.github.io/ai-cost-calc/en/index.html](https://burapa-j.github.io/ai-cost-calc/en/index.html)
- **Centralized Telemetry & Admin Command Center:** [https://www.xamathi.com/admin/?project=affiliate](https://www.xamathi.com/admin/?project=affiliate)
- **XML & Plain-Text Sitemaps (352 URLs):** [sitemap.xml](https://burapa-j.github.io/ai-cost-calc/sitemap.xml) · [sitemap.txt](https://burapa-j.github.io/ai-cost-calc/sitemap.txt) · [llms.txt](https://burapa-j.github.io/ai-cost-calc/llms.txt)

---

## Interactive Engineering & Buyer Decision Tools

Every calculator and programmatic comparison page (`343` interactive pages + `10` visual playbooks) includes a monochrome technical ledger UI (`#0D0D0C` dark / `#F6F5F1` light, `< 65KB` per comparison subpage) with **9 interactive tools**:

1. **Interactive Hero Line-of-Sight Architecture Switcher:** Visualizes how daily tasks route across Pay-Per-Token APIs, Self-Hosted Cloud/Local GPUs, or Managed Thai/Global VPS stacks.
2. **Live Thai Prompt & Token Tax Inspector (`#inp-prompt-sample`):** Counts Thai vs. non-Thai characters from any pasted prompt, measures token consumption across Gemini 2.5 Flash / DeepSeek V3 vs. GPT-4o vs. Claude 3.7 Sonnet (`~2.1x` Thai token multiplier), and applies `×15` tokens directly to the input slider.
3. **Single-Key Hybrid 80/20 Model Router Calculator (`#inp-hybrid-router`):** Blends a configurable share (50%–95%, default 80%) of the cheapest workhorse model with flagship reasoning (`Claude 3.7 Sonnet`) on a single Novita AI key and calculates monthly USD/THB savings.
4. **Live SVG Cost-Crossover Chart (`#live-cost-curve-svg`):** Real-time bar comparison between the cheapest API, best-fit RunPod GPU, and flagship API.
5. **Self-Hosted GPU VRAM Sizer (`#inp-selfmodel`, `#inp-conc`):** Calculates exact required VRAM (`Base Weights + KV Cache @ Peak Concurrency + 2GB CUDA Overhead`) across `8B Q4`, `32B Q4`, `70B Q4/AWQ`, and `70B FP16`, plus optional `80GB` Persistent Volume storage (`+$5.60/mo`).
6. **Dynamic 1-Line `vLLM` Deploy Command (`#vllm-command`):** Auto-generates the exact `docker run` command with `--model` and `--tensor-parallel-size` for the selected model.
7. **Buy Local Hardware vs. Rent Cloud GPU Payback Matrix (`#buyrent-grid`):** Compares custom PC RTX 4090 (24GB), Mac mini M4 Pro (64GB Unified), and Mac Studio Ultra (192GB Unified) against RunPod hourly rental, including Thai electricity cost (`฿4.2/kWh`) and payback months.
8. **RAG Vector DB & Webhook VPS RAM Sizer (`#inp-rag-docs`, `#inp-rag-stack`):** Computes total RAM required for Qdrant Vector DB + LINE OA / n8n / FastAPI + OS overhead, flags each Thai (`VAT 7% · ~5ms Ping`) and Global VPS row for RAM fit, and provides a 1-line `docker run` command for Qdrant + n8n.
9. **1-Click 6-Line Executive Spec & Budget Summary (`#btn-copy-summary`):** Copies a concise 6-line specification and monthly budget summary with a shareable scenario URL for pasting into LINE, Slack, or Notion.

---

## 5 Visual AI Architecture & Cost Playbooks (EN / TH)

1. **Thai Tokenizer Cost Benchmark (2026):** [ภาษาไทย](https://burapa-j.github.io/ai-cost-calc/th/guides/thai-tokenizer-cost-benchmark.html) · [English](https://burapa-j.github.io/ai-cost-calc/en/guides/thai-tokenizer-cost-benchmark.html)
2. **LINE OA + RAG Chatbot Under ฿1,200/mo Blueprint:** [ภาษาไทย](https://burapa-j.github.io/ai-cost-calc/th/guides/line-oa-rag-chatbot-blueprint.html) · [English](https://burapa-j.github.io/ai-cost-calc/en/guides/line-oa-rag-chatbot-blueprint.html)
3. **Cut Claude Code & Cursor API Spend by 50–70%:** [ภาษาไทย](https://burapa-j.github.io/ai-cost-calc/th/guides/claude-code-cursor-cost-cut.html) · [English](https://burapa-j.github.io/ai-cost-calc/en/guides/claude-code-cursor-cost-cut.html)
4. **API to RunPod Dedicated GPU (`vLLM`) Migration Playbook:** [ภาษาไทย](https://burapa-j.github.io/ai-cost-calc/th/guides/api-to-runpod-vllm-migration.html) · [English](https://burapa-j.github.io/ai-cost-calc/en/guides/api-to-runpod-vllm-migration.html)
5. **Thai VPS (VAT 7% & ~5ms Ping) vs. Global Cloud Guide:** [ภาษาไทย](https://burapa-j.github.io/ai-cost-calc/th/guides/thai-vps-vs-global-cloud-ai-backend.html) · [English](https://burapa-j.github.io/ai-cost-calc/en/guides/thai-vps-vs-global-cloud-ai-backend.html)

---

## 2026 Reference Break-Even Matrix (35% Cache Hit, 3 Agent Steps/Task, 12h/Day Active GPU)

| Model / Tier | Uncached Input / 1M | Cached Input / 1M | Output / 1M | 1,500 Tasks/Day (Monthly) | 5,000 Tasks/Day (Monthly) | Break-Even vs. RunPod A100 ($1.39/hr) |
|---|---:|---:|---:|---:|---:|---:|
| **Claude 3.7 Sonnet** | $3.00 | $0.30 | $15.00 | $1,908.56 (฿65,845) | $6,361.88 (฿219,485) | **394 tasks/day** |
| **OpenAI GPT-4o** | $2.50 | $1.25 | $10.00 | $1,506.09 (฿51,960) | $5,020.31 (฿173,201) | **499 tasks/day** |
| **Gemini 2.5 Pro** | $1.25 | $0.31 | $10.00 | $1,120.84 (฿38,669) | $3,736.13 (฿128,896) | **670 tasks/day** |
| **OpenAI o3-mini** | $1.10 | $0.55 | $4.40 | $662.68 (฿22,862) | $2,208.94 (฿76,208) | **1,133 tasks/day** |
| **DeepSeek V3 / R1** | $0.55 | $0.14 | $2.19 | $314.58 (฿10,853) | $1,048.61 (฿36,177) | **2,387 tasks/day** |
| **Gemini 2.5 Flash** | $0.15 | $0.0375 | $0.60 | $85.94 (฿2,965) | $286.45 (฿9,883) | **8,735 tasks/day** |
| **Qwen 2.5 Coder 32B** | $0.20 | $0.10 | $0.20 | $71.89 (฿2,480) | $239.63 (฿8,267) | **10,442 tasks/day** |

---

## Popular Direct Comparison Calculators

### API vs. Dedicated GPU Break-Even
- [Claude 3.7 Sonnet vs. RunPod A100 80GB Break-Even](https://burapa-j.github.io/ai-cost-calc/en/compare/claude-3-7-sonnet-vs-runpod-a100-80gb-break-even.html) ([ภาษาไทย](https://burapa-j.github.io/ai-cost-calc/th/compare/claude-3-7-sonnet-vs-runpod-a100-80gb-break-even.html))
- [OpenAI GPT-4o vs. RunPod RTX 4090 Break-Even](https://burapa-j.github.io/ai-cost-calc/en/compare/gpt-4o-vs-runpod-rtx-4090-break-even.html) ([ภาษาไทย](https://burapa-j.github.io/ai-cost-calc/th/compare/gpt-4o-vs-runpod-rtx-4090-break-even.html))
- [DeepSeek V3/R1 vs. RunPod H100 80GB Break-Even](https://burapa-j.github.io/ai-cost-calc/en/compare/deepseek-v3-r1-vs-runpod-h100-80gb-break-even.html) ([ภาษาไทย](https://burapa-j.github.io/ai-cost-calc/th/compare/deepseek-v3-r1-vs-runpod-h100-80gb-break-even.html))

### Production Workload Archetype Estimators
- [Autonomous Coding Agent Cost Model (Claude 3.7 Sonnet)](https://burapa-j.github.io/ai-cost-calc/en/compare/autonomous-coding-agent-with-claude-3-7-sonnet-cost-estimator.html) ([ภาษาไทย](https://burapa-j.github.io/ai-cost-calc/th/compare/autonomous-coding-agent-with-claude-3-7-sonnet-cost-estimator.html))
- [RAG Customer Support Chatbot Cost Model (GPT-4o)](https://burapa-j.github.io/ai-cost-calc/en/compare/rag-customer-support-bot-with-gpt-4o-cost-estimator.html) ([ภาษาไทย](https://burapa-j.github.io/ai-cost-calc/th/compare/rag-customer-support-bot-with-gpt-4o-cost-estimator.html))
- [24/7 AI Call Center & Triage Cost Model (Gemini 2.5 Flash)](https://burapa-j.github.io/ai-cost-calc/en/compare/voice-and-chat-call-center-ai-with-gemini-2-5-flash-cost-estimator.html) ([ภาษาไทย](https://burapa-j.github.io/ai-cost-calc/th/compare/voice-and-chat-call-center-ai-with-gemini-2-5-flash-cost-estimator.html))

### Cloud VPS & Managed Hosting Comparisons (Global & Thailand)
- [Cloudways DigitalOcean vs. Hostatom Cloud VPS Thailand](https://burapa-j.github.io/ai-cost-calc/en/compare/cloudways-do-4gb-vs-hostatom-vps-4gb-hosting-comparison.html) ([ภาษาไทย](https://burapa-j.github.io/ai-cost-calc/th/compare/cloudways-do-4gb-vs-hostatom-vps-4gb-hosting-comparison.html))
- [Cloudways vs. Ruk-Com Managed VPS Thailand](https://burapa-j.github.io/ai-cost-calc/en/compare/cloudways-do-4gb-vs-rukcom-managed-vps-hosting-comparison.html) ([ภาษาไทย](https://burapa-j.github.io/ai-cost-calc/th/compare/cloudways-do-4gb-vs-rukcom-managed-vps-hosting-comparison.html))

---

## Local Build & Verification

Zero external runtime dependencies. Requires Node.js 22+ (native TypeScript execution):

```bash
npm test          # Run unit, boundary, idempotency, sub-65KB size cap, and live HTTP round-trip tests
npm run build     # Generate all 353 static HTML pages, sitemaps, and llms.txt into dist/
npm run serve     # Start local preview & telemetry server on http://127.0.0.1:4173
```
