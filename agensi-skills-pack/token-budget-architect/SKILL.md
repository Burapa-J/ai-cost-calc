---
name: token-budget-architect
description: Reduces LLM API token consumption and cost in coding agents by enforcing prompt-cache prefix stability, targeted line-range reads, and subagent token economics. Use when working on large repositories, multi-step agent loops, or optimizing API spend.
license: Apache-2.0
compatibility: Claude Code, Cursor, Windsurf, GitHub Copilot, Codex CLI, Antigravity
metadata:
  author: Burapa-J
  version: "1.0.0"
  benchmark_url: "https://burapa-j.github.io/ai-cost-calc/en/index.html"
---

# Token Budget Architect

A deterministic operating protocol for coding agents that cuts monthly input/output token spend by 35–55% without sacrificing code verification quality.

---

## 1. Zero-Token Pre-Read Narrowing Protocol

Never read a source file larger than 250 lines from line 1 to EOF unless rewriting the entire module.

1. **Locate Symbols First:** Run a narrow structural search (`ripgrep` / `grep -n`) to identify exact line numbers of target functions, types, or call sites.
2. **Bounded Window Reads:** Read only a `±40` line window around matched line numbers (`StartLine` / `EndLine`).
3. **Skip Generated & Vendor Artifacts:** Never read `dist/`, `build/`, `node_modules/`, lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `Cargo.lock`), or minified bundles into context.

---

## 2. Prompt-Cache Prefix Stability Rules

Frontier APIs discount cached input tokens by 50% to 90% (Anthropic Claude 3.7 Sonnet: `$0.30/1M` vs `$3.00/1M`; Gemini 2.5: `75%` discount; DeepSeek V3/R1: `74%` discount), but any mutation near the top of the prompt invalidates the entire prefix cache.

1. **Invariant Prefix Ordering:** Keep system instructions, tool schemas, and architectural type definitions strictly static at the beginning of the context.
2. **Append-Only Turn State:** Never inject wall-clock timestamps, random request IDs, or volatile shell output into the system header or early context blocks.
3. **Batch Related Edits:** Group non-overlapping file edits and shell commands into single turns to avoid paying the full prefix-read tax on extra round-trips.

See `references/cache-prefix-matrix.md` for provider-by-provider cache discount thresholds and break-even formulas.

---

## 3. Subagent Spawn Economics Gate

Spawning an autonomous subagent carries a fixed bootstrap overhead of `~25,000–28,000` input tokens per invocation.

| Task Profile | Execution Route | Token Rationale |
|---|---|---|
| Single-file edit (`< 1,000` lines) | **Main Agent Direct** | Avoids 28k subagent bootstrap tax |
| Known `file:line` bug fix or review round | **Main Agent Direct** | Direct edit + local test costs `< 4k` tokens |
| Git operations, build checks, or single-lock test runs | **Main Agent Direct** | Prevents build-lock contention and duplicate logs |
| Bulk exploration across `>= 3,500` lines / `>= 30k` raw tokens | **Single Consolidated Read-Only Subagent** | Compresses 30k+ raw source tokens into a `< 1k` summary |

---

## 4. Output Token & Verification Discipline

1. **Quiet Verification Receipts:** Redirect verbose compiler and test suite output to a log file (`.verify/<name>.log`) and inspect only the exit status and failing assertion lines.
2. **Surgical Diffs over Full Rewrites:** Use targeted block replacements rather than regenerating unchanged functions.
3. **Minimal Prose:** Report changes with file/line references and a single-line verification receipt.
