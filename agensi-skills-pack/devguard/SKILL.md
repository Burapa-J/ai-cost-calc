---
name: devguard
description: "Evidence-first engineering workflow (verified-dev v1.1.0) and token-saving verification gate for AI coding agents. Enforces 6 task playbooks, real-surface runtime verification (.verify/<name>.log), gitleaks/osv-scanner security gates, 35-case LLM evals, cross-model review, and token-positive subagent delegation."
summary: "Evidence-first workflow (verified-dev v1.1.0) and token-saving verification gate with auto-detected .devguard/checks, gitleaks/osv-scanner security gates, and 28k-token subagent economics."
version: 1.1.0
author: Burapa
license: MIT
docs_url: https://github.com/Burapa-J/devguard
tags:
  - code-quality
  - testing
  - agents
  - prompt-engineering
  - devops
  - token-optimization
  - security
  - verification-gate
keywords:
  - devguard
  - verified-dev
  - token-saving
  - verification-gate
  - claude-code
  - cursor
  - gitleaks
  - osv-scanner
use_cases:
  - "Prevent coding agents from calling a task done without real runtime evidence captured in .verify/<name>.log"
  - "Enforce the Token Escalation Ladder (0-token local search -> codegraph/projectmem -> <1,000-line read -> >=30k-token batch subagent)"
  - "Auto-generate .devguard/checks commit/push gates with self-skipping gitleaks secret scans and osv-scanner lockfile CVE checks"
  - "Run 30+ case golden LLM evaluations (devguard eval) and on-demand cross-model reviews (devguard review) before shipping"
---

# devguard v1.1.0 — Evidence-First Engineering & Token-Saving Workflow (`verified-dev`)

An evidence-first working mode and token-saving verification harness for developers running AI coding agents across **Claude Code**, **Cursor**, **VS Code (Copilot)**, **Google Antigravity**, **OpenCode**, **Windsurf**, **Codex CLI**, and **Gemini CLI** across macOS, Linux, and Windows.

Core stance: **You own design, review, and verification. A claim without runtime evidence is a hypothesis, and a successful build is not proof.**

---

## 1. Start Every Task by Routing to One Playbook

1. **Classify the request** and pick **ONE** playbook from Section 5 (`Investigation`, `Bug Fix`, `Feature`, `Refactor`, `Performance`, or `Prompt / LLM Pipeline Change`). Questions, architecture discussions, and "should we do X or Y?" route to **Investigation (read-only)** until implementation is explicitly requested.
2. **Open with a one-sentence restatement** of the goal, key assumptions, and (when shipping a change) the smallest expected change. If multiple interpretations exist or runtime evidence rules out the requested change, surface it and stop rather than picking silently.
3. **Track every step in a task list** (`todo.md` or native task tool). Never delete a step; mark skipped steps with `skip: <one-line reason>`.
4. **Name the data shape before writing logic:** Define types, states, and transitions first. Prefer enums and state machines over scattered booleans, and lookup tables over deep branching.

---

## 2. Core, Architecture & Verification Principles

### Core Engineering
- **Smallest change:** Reuse existing codebase helpers, standard library features, and native platform capabilities before writing new code. Prefer deletion and the minimal diff; introduce no new abstraction without a second real caller.
- **Fix the shared cause, check sibling callers:** Inspect every caller of a function you touch (`codegraph_explore` / `ast-grep` / `grep`) and fix the shared path once so sibling callers are not left broken.
- **Attack the premise:** After two failed fixes sharing one assumption, stop, list every actor involved, and question the assumption.
- **Prototype over debate:** If a question can be answered by running a quick probe (behavior, timing, layout, latency), run it instead of guessing.

### Architecture
- **Guard the boundary:** Parse and validate external data (API responses, LLM output, database records, user files) at the edge into typed models. Trust internal types.
- **Illegal states unrepresentable:** Use tagged unions / enums with associated values and typed IDs over raw strings or optional flags.
- **Idempotent steps:** Sync, migration, billing, and retry loops must converge on the same state if interrupted or rerun.

### Verification
- **Prove it on the real surface:** A clean compile or typecheck is never proof. Run the real artifact.
- **Reproduce before fixing:** An unreproduced bug cannot be proven fixed.
- **Small verifiable units:** End each unit with `devguard check commit` (fast inner loop) and run full `devguard check` before completion or push.
- **Prove the test can fail (Mutation Check):** A new test counts only after it has failed for the right reason—either before the fix, or with the guard temporarily removed (copy code, remove guard, run test, watch it fail, restore guard).
- **Explain the number:** Before reporting any measured metric (speedup, latency, token savings, eval pass rate), state how it was measured, what limits it, and rule out confounding factors.

---

## 3. Real-Surface Verification (`agent-verify`) & Done Gate (`.devguard/checks`)

Never trust compressed or truncated terminal output as proof. Capture full verification output into `.verify/<name>.log` and read the log file directly with your file-read tool:

```sh
agent-verify <name> -- <command> [args...]
```

`agent-verify` records the full log, exit code, and exact error line numbers (`errors_at=L...`) for compiler errors, test failures, Python tracebacks/exceptions, and Rust panics.

| Change Surface | Acceptable Evidence |
|---|---|
| Pure logic / domain | Unit & integration test suite (`npm test`, `cargo test`, `pytest`, `go test`) with literal behavioral assertions |
| Web / Desktop / Mobile UI | Build, launch the app/server, drive the changed user flow, verify HTTP 200 / DOM state or before/after screenshot |
| CLI / script | Execute the real command with real input and inspect `.verify/<name>.log` |
| Persistence / DB | Write, then read back from a fresh context or relaunched process; verify deduplication & conflict path |
| Encryption / security | Round-trip encrypt -> persist -> relaunch -> decrypt; verify a wrong key or staged secret fails (`exit=1`) |
| LLM prompt / pipeline / agent rule | Run the 30+ case golden eval set before and after (`devguard eval run` / `devguard eval compare`); report pass rate, per-case regressions, flip rate, cost, and latency deltas |
| Performance | Record baseline measurement first with a repeatable harness; re-measure with the exact same method after |

### Automated Done Gate (`.devguard/checks`)
If a repository contains `.devguard/checks`, every check must pass (`devguard check`) before calling a task done. Never bypass git hooks with `--no-verify`.
- Run `devguard gate init` to auto-detect the repository stack (`package.json`, `Cargo.toml`, `Package.swift`, `*.py`, `*.sh`) and install `pre-commit` and `pre-push` hooks.
- `devguard gate init` automatically layers two self-skipping security gates onto any stack:
  - `commit secrets`: runs `gitleaks` on staged changes (`gitleaks git --staged --redact --no-banner .`) and blocks commits containing secrets.
  - `push deps`: runs `osv-scanner` against dependency lockfiles (`osv-scanner scan source -r .`) and blocks pushes with known CVEs.

---

## 4. Token Escalation Ladder & Subagent Economics (`~28k tokens/turn` Rule)

Spawning a subagent pays roughly `28,000 tokens` of bootstrap overhead per turn. Protect context and token budgets with the **4-Step Token Escalation Ladder** (cheapest first):

1. **Step 1 — 0-Token Local Pre-Filter:** Use `ast-grep` (`ast-grep run -p '<pattern>' -l <lang>`) or targeted `grep`/`find` to narrow candidate files and line numbers.
2. **Step 2 — Code Graph & Project Memory:** Query `codegraph_explore` (symbol source, call paths, blast radius) and `projectmem` (`get_summary`, `get_project_map`, `precheck_file`) before scanning source files.
3. **Step 3 — Inline Targeted File Read (`MAIN_AGENT_DIRECT`):** Read exact line ranges (`< 1,000 lines`) directly in the Main Agent. Keep data modeling, pre-mortem tables, single-file edits (`< 1,000 lines`), git/PR operations, known `file:line` review fixes, and shared-lock builds (`Cargo` `target/`, monorepo builds) inside the Main Agent.
4. **Step 4 — Consolidated Single-Shot Batch Subagent (`CONSOLIDATED_BATCH_SUBAGENT`):** Spawn a read-only fast subagent **only** when raw input is `>= 30,000 tokens` (`>= 3,500 lines` across 2–3 unlocked modules, or `10–25` surviving files after a 0-token local pre-filter).
   - **Claude Code:** `Task` / `Agent` tool (`subagent_type="Explore"`, `model="haiku"`).
   - **Antigravity:** `invoke_subagent(TypeName="research", Model="flash")`, then terminate immediately after return.
   - **VS Code Copilot / Cursor / OpenCode:** `runSubagent` (single-shot read-only).
   - Never exceed `MAX_ACTIVE_SUBAGENTS = 2`, avoid multi-turn subagent ping-pong, and require a compact output contract (`path:line — symbol — note`).

---

## 5. Playbooks

### Playbook A: Investigation (Read-Only)
1. State the exact question.
2. Read the actual implementation source (never extrapolate from `--help`, filenames, or sample configs alone): cover the read path, write path, ID/state lifecycle, and ignore/conflict rules.
3. Answer from evidence. End every factual claim with its source tag: `(read file:line)`, `(ran: <command> -> exit N)`, `(inferred)`, or `(unchecked)`. If an answer changes from an earlier one, name the new evidence that changed it.

### Playbook B: Bug Fix
1. **Reproduce it first** on the same surface. If it won't reproduce, synthesize the trigger or tighten conditions until it fails deterministically.
2. **Bisect the cause:** List hypotheses, run the check that eliminates the most, gather runtime evidence, and revert any edit motivated by a refuted hypothesis.
3. **Confirm the surviving mechanism** with `file:line` and runtime evidence before writing the fix.
4. **Implement the smallest fix** supported by the evidence.
5. **Verify & mutation-check:** Confirm the original reproducer now passes on the same surface and the regression test fails when the fix is removed.
6. **Report:** State what broke, root cause, fix, and a one-line verification receipt (paste verbatim log lines only when something failed or when asked).

### Playbook C: Feature
1. **Explore the affected subsystem** by reading its actual source code (read/write paths, state lifecycle, conflict cases) and cite `file:line`.
2. **Name the data shape:** If more than one design is viable, compare 2–3 options in a compact table and pick one with a concrete reason.
3. **Pre-mortem before writing code:** Assume the feature shipped and broke. Fill out:
   `| what breaks | when it happens | design that prevents it | test that proves it |`
   covering concurrency/multi-device use, partial failure & rerun, upgrade/rollback, and data loss. Any row without a test is an open risk—name it in the report.
4. **Throughput checkpoint (4 lines):** (1) Blocking first steps; (2) Independent workstreams; (3) Shared mutable state; (4) Smallest safe decomposition.
5. **Implement, verify & mutation-check:** Run all pre-mortem tests on the matching surface, mutation-check each new test, and commit in small ordered units (`devguard check commit` -> commit -> next).

### Playbook D: Refactor (Behavior-Preserving)
1. Pin current behavior with tests or a recorded `.verify/baseline.log` run before touching code.
2. Change structure only—never mix behavior changes into a refactor diff.
3. Re-run the exact same checks and verify identical outputs.

### Playbook E: Performance Issue
1. Measure a baseline with a repeatable benchmark or profiler (`measure {}`, high-resolution timestamps).
2. Profile to locate the actual bottleneck; never guess.
3. Apply one change at a time, re-measure with the same method, and keep only measured wins.

### Playbook F: Prompt / LLM Pipeline Change
1. Ensure a stratified **30+ case golden eval set** exists (`.jsonl` with expected outcomes, abstention cases, and adversarial guards). If not, build it first.
2. Run the baseline across every affected provider (`devguard eval run CASES.jsonl --label before`).
3. Change **one variable at a time** (prompt text, model ID, temperature, validator, or pipeline step).
4. Re-run (`devguard eval run CASES.jsonl --label after`) and compare (`devguard eval compare before.json after.json`); ship only if critical regressions = `0`.

### Pause / Resume Protocol
- **Pausing:** Record current state, what is verified, what is unverified, next step, and uncommitted changes in `projectmem` (`add_note`) or a handoff file.
- **Resuming:** Read the project memory record alongside `git status -sb` and `git log -n 5`; trust the repository state over the note if they disagree.

---

## 6. Compatibility with Token-Saving & Cross-Model Tools

- **Verification checks override brevity compressors:** When using shell output compressors (`rtk`, `caveman`, `ponytail`), always capture verification runs to `.verify/<name>.log` via `agent-verify` and read the file directly. Keep the chat report to a compact summary + one-line verification receipt.
- **On-demand cross-model review (`devguard review`):** Run `devguard check` on every code task. Invoke `devguard review --with claude|agy|gemini` when requested by the user (and proactively suggest it in your report for high-risk changes touching persistence/migrations, cross-device CRDT sync, concurrency locks, or security).

## Reference & Template Files Included
- `references/devguard-cli-and-checks.md` — Complete `devguard v1.1.0` CLI command reference, auto-detected `.devguard/checks` rules, `gitleaks`/`osv-scanner` security gates, and verification receipt formats.
- `templates/checks.template` — Drop-in `.devguard/checks` template for TypeScript/Node.js, Rust, Swift, Python, and Shell repositories with staged secret and dependency CVE gates.
