---
name: cloud-gpu-breakeven-auditor
description: Audit any repository's LLM API usage and calculate the exact daily request and VRAM break-even threshold for switching from pay-per-token APIs (Claude, GPT-4o, Gemini, DeepSeek) to dedicated hourly Cloud GPUs (RunPod RTX 4090, A6000, L40S, A100, H100). Activate when estimating AI infrastructure costs, planning self-hosted vLLM/Ollama migrations, or reducing high-volume agent API bills.
---

# Cloud GPU Break-Even Auditor (`cloud-gpu-breakeven-auditor`)

## Purpose
Determine with mathematical precision whether a codebase should remain on pay-per-token LLM APIs or migrate to dedicated hourly Cloud GPUs (`vLLM` / `TGI` / `SGLang`), based on actual prompt lengths, multi-step agent multipliers, prompt cache hit rates, and active operating hours.

---

## Step 1: Audit Repository LLM Call Sites
1. Locate all SDK and HTTP call sites (`openai`, `@anthropic-ai/sdk`, `@google/genai`, `fetch('/v1/chat/completions')`).
2. For each call site, extract:
   - `model` identifier and current per-1M input/cached-input/output pricing.
   - System prompt + static tool schema token count ($T_{\text{prefix}}$).
   - Dynamic user payload token count ($T_{\text{dynamic}}$) and max/average completion tokens ($T_{\text{out}}$).
   - Multi-step agent loop multiplier ($S \ge 1$) per user task.

---

## Step 2: Compute Monthly Pay-Per-Token Spend ($C_{\text{API}}$)
Given daily requests $R$, agent steps $S$, cache hit rate $h \in [0, 0.95]$:

$$E_{\text{calls/month}} = 30 \times R \times S$$

$$C_{\text{API}} = \frac{E_{\text{calls/month}}}{10^6} \left[ T_{\text{in}} \cdot \left((1 - h) P_{\text{in}} + h P_{\text{cache}}\right) + T_{\text{out}} \cdot P_{\text{out}} \right]$$

---

## Step 3: Size Dedicated GPU VRAM & Throughput ($C_{\text{GPU}}$)
1. **VRAM Sizing Rule (`vLLM` FP16 vs AWQ/FP8):**
   - Model weights VRAM: $\text{VRAM}_{\text{weights}} \approx \text{Params (B)} \times \text{Bytes/Param} \times 1.18$ (18% KV-cache & activation overhead).
   - Check `references/vram-throughput-table.md` for verified throughput ($K_{\text{tok/s}}$) and hourly rates ($H_{\text{USD}}$).
2. **Instance Count ($N_{\text{GPU}}$) for Active Window ($A$ hours/day):**

$$\text{Required tok/s} = \frac{R \times S \times T_{\text{out}}}{A \times 3600}$$

$$N_{\text{GPU}} = \max\left(1, \left\lceil \frac{\text{Required tok/s}}{K_{\text{tok/s}}} \right\rceil\right), \quad C_{\text{GPU}} = 30 \times A \times N_{\text{GPU}} \times H_{\text{USD}}$$

---

## Step 4: Output Decision Ledger
Always output a 4-column Markdown table comparing:
- **Option** (Current API vs Consolidated Router vs Dedicated GPU)
- **Monthly USD / Local Currency**
- **Exact Break-Even Tasks/Day** ($R^* = \lceil C_{\text{GPU}} / (\text{Cost per task}) \rceil$)
- **Recommended Action** (Stay on API, Enable Prompt Caching first, or Migrate to Dedicated GPU)
