# Provider Prompt-Cache & Break-Even Reference (2026)

## 1. Cached vs. Uncached Input Token Pricing (USD per 1M Tokens)

| Model | Uncached Input | Cached Input | Cache Discount | Output |
|---|---:|---:|---:|---:|
| **Claude 3.7 Sonnet** | $3.00 | $0.30 | **90%** | $15.00 |
| **Claude 3.5 Haiku** | $0.80 | $0.08 | **90%** | $4.00 |
| **OpenAI GPT-4o** | $2.50 | $1.25 | **50%** | $10.00 |
| **OpenAI o3-mini** | $1.10 | $0.55 | **50%** | $4.40 |
| **Gemini 2.5 Pro** | $1.25 | $0.31 | **75%** | $10.00 |
| **Gemini 2.5 Flash** | $0.15 | $0.0375 | **75%** | $0.60 |
| **DeepSeek V3 / R1** | $0.55 | $0.14 | **75%** | $2.19 |

## 2. Blended Input Cost Formula

$$\text{Blended Input Cost per 1M} = (1 - r_{\text{cache}}) \cdot P_{\text{uncached}} + r_{\text{cache}} \cdot P_{\text{cached}}$$

Interactive calculator: https://burapa-j.github.io/ai-cost-calc/en/index.html
