# TCO // BENCHMARK.26 — LLM API vs. Dedicated Cloud GPU Break-Even Ledger (EN / TH)

**Live Interactive Calculators (344 Static Pages):**
- **English Cost Ledger:** [https://burapa-j.github.io/ai-cost-calc/en/index.html](https://burapa-j.github.io/ai-cost-calc/en/index.html)
- **ตารางคำนวณต้นทุนภาษาไทย (TH):** [https://burapa-j.github.io/ai-cost-calc/th/index.html](https://burapa-j.github.io/ai-cost-calc/th/index.html)
- **Live Telemetry & Demand Proof Ledger:** [https://burapa-j.github.io/ai-cost-calc/validation-dashboard.html](https://burapa-j.github.io/ai-cost-calc/validation-dashboard.html)
- **XML Sitemap (342 URLs):** [https://burapa-j.github.io/ai-cost-calc/sitemap.xml](https://burapa-j.github.io/ai-cost-calc/sitemap.xml)

---

## Why This Exists

Standard LLM token calculators multiply `input_tokens * price`, ignoring the three structural factors that determine production unit economics in 2026:

1. **Sequential Agent Loop Amplification (`agentSteps`):** Autonomous coding and research agents invoke models 3–10 times per user task, compounding input context tokens at each step.
2. **Prompt Caching Hit Ratios (`cacheHitRate`):** Up to 90% input token discounts on cached prefixes (Anthropic Claude 3.7 Sonnet, Gemini 2.5, DeepSeek V3/R1, OpenAI GPT-4o).
3. **Active GPU Rental Utilization (`activeHoursPerDay`):** Dedicated hourly GPUs (RunPod RTX 4090, L40S, A100 80GB, H100 80GB) bill by wall-clock uptime rather than token volume.

---

## 2026 Reference Break-Even Matrix (35% Cache Hit, 3 Agent Steps/Task, 12h/Day Active GPU)

| Model / Tier | Uncached Input / 1M | Cached Input / 1M | Output / 1M | 1,500 Tasks/Day (Monthly) | 5,000 Tasks/Day (Monthly) | Break-Even vs. RunPod A100 ($1.39/hr) |
|---|---:|---:|---:|---:|---:|---:|
| **Claude 3.7 Sonnet** | $3.00 | $0.30 | $15.00 | $1,896.75 (฿65,438) | $6,322.50 (฿218,126) | **396 tasks/day** |
| **OpenAI GPT-4o** | $2.50 | $1.25 | $10.00 | $1,509.19 (฿52,067) | $5,030.63 (฿173,557) | **498 tasks/day** |
| **Gemini 2.5 Pro** | $1.25 | $0.31 | $10.00 | $1,120.78 (฿38,667) | $3,735.94 (฿128,890) | **670 tasks/day** |
| **OpenAI o3-mini** | $1.10 | $0.55 | $4.40 | $664.04 (฿22,909) | $2,213.48 (฿76,365) | **1,131 tasks/day** |
| **DeepSeek V3 / R1** | $0.55 | $0.14 | $2.19 | $328.91 (฿11,347) | $1,096.35 (฿37,824) | **2,283 tasks/day** |
| **Gemini 2.5 Flash** | $0.15 | $0.0375 | $0.60 | $90.21 (฿3,112) | $300.70 (฿10,374) | **8,321 tasks/day** |

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
npm test          # Run unit, boundary, idempotency, and live HTTP round-trip tests
npm run build     # Generate all 344 static HTML pages, sitemap.xml, and llms.txt into dist/
npm run serve     # Start local preview & telemetry server on http://127.0.0.1:4173
```
