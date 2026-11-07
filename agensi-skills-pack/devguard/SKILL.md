---
name: devguard
description: Evidence-first engineering workflow (verified-dev) and token-saving verification gate for AI coding agents. Enforces task routing by playbook, real-surface runtime verification captured to .verify/<name>.log, pre-mortem failure analysis, mutation-checked tests, and token-positive subagent delegation across Claude Code, Cursor, Copilot, and Gemini CLI.
---

# devguard — Evidence-First Engineering & Token-Saving Workflow (`devguard`)

An evidence-first working mode and token-saving verification harness designed for developers running AI coding agents (`Claude Code`, `Cursor`, `GitHub Copilot`, `Windsurf`, `Codex CLI`, `Gemini CLI`). Core principle: **a claim without runtime evidence is a hypothesis, and a successful build is not proof.**

---

## 1. Start Every Task by Routing to One Playbook

1. **Classify the request** into one of the 5 playbooks below (`Investigation`, `Bug Fix`, `Feature`, `Refactor`, or `Performance`). Questions, design discussions, and "should we do X or Y?" stay read-only (`Investigation`) until implementation is requested.
2. **Open with a one-sentence restatement** of the goal, key assumptions, and the smallest expected change.
3. **Define the data shape before writing logic:** Name types, states, and transitions first. Prefer enums and state machines over scattered booleans, and tables over deep branching.

---

## 2. Core Engineering Principles

- **Smallest change:** Reuse existing codebase helpers and standard library features before writing new code. No new abstraction without a second real caller.
- **Fix the shared cause, check sibling callers:** Inspect every caller of a function you touch (`grep` / AST search) and fix the shared path once so sibling callers are not left broken.
- **Guard the boundary:** Parse and validate external data (API responses, LLM output, database records, user input) at the edge into typed models.
- **Prove the test can fail (Mutation Check):** A new test counts only after it has failed for the right reason—either before the fix, or with the guard temporarily removed.

---

## 3. Real-Surface Verification (`agent-verify` & `.verify/<name>.log`)

Never trust compressed or truncated terminal summaries as proof. Capture full verification output into `.verify/<name>.log` and inspect the log directly:

```sh
mkdir -p .verify && <command> > .verify/<name>.log 2>&1; echo "exit=$?"
```

| Change Surface | Required Proof |
|---|---|
| Pure logic / domain | Unit & integration test suite with literal behavioral assertions |
| Web / UI | Render the page/app, drive the changed user flow, verify HTTP 200 & DOM output |
| CLI / script | Execute the real command with real input and inspect `.verify/<name>.log` |
| Persistence / DB | Write, then read back from a fresh context; verify deduplication & conflict path |
| Performance | Measure baseline before touching code; re-measure with the exact same harness after |

If a repository defines `.devguard/checks`, every check in `.devguard/checks` must pass before calling the task done. Never bypass git hooks with `--no-verify`.

---

## 4. Token- & Time-Positive Subagent Delegation (`~28k tokens/turn` Bootstrap Rule)

Spawning a subagent incurs roughly `28,000 tokens` of bootstrap context per turn. Protect your token quota with strict break-even thresholds:

- **Run Directly in Main Agent (`MAIN_AGENT_DIRECT`):**
  - Single-file edits (`< 1,000 lines`), git operations, review-fix rounds where `file:line` is already known, and test runs sharing one build lock (e.g., `Cargo` `target/`).
- **Delegate via Consolidated Single-Shot Subagent (`CONSOLIDATED_BATCH_SUBAGENT`):**
  - Delegate only when reading `>= 30,000 raw tokens` (`>= 3,500 lines` across 2–3 large unlocked modules, or `>= 10–25` files after a 0-token local `grep` pre-filter).
  - Cap active subagents at `<= 2` and terminate them immediately upon completion.

---

## 5. Playbooks

### Playbook A: Investigation (Read-Only)
1. State the exact question.
2. Read the actual implementation source covering the read path, write path, state lifecycle, and conflict rules.
3. Answer from evidence. End every factual claim with its source: `(read file:line)`, `(ran: <command> → exit N)`, `(inferred)`, or `(unchecked)`.

### Playbook B: Bug Fix
1. **Reproduce first** on the matching surface. An unreproduced bug cannot be proven fixed.
2. **Bisect the cause:** List hypotheses, run the check that eliminates the most, and revert any edit motivated by a refuted hypothesis.
3. **Implement the smallest fix** supported by runtime evidence.
4. **Verify & report:** Run the original reproducer, capture to `.verify/<name>.log`, and report root cause + one-line verification receipt.

### Playbook C: Feature
1. Read affected modules and cite `file:line`.
2. Name the data model and compare viable designs if more than one exists.
3. **Pre-mortem table before writing code:** Fill out `| what breaks | when it happens | design that prevents it | test that proves it |` covering edge cases, partial failure/rerun, and data integrity.
4. Implement, run the pre-mortem tests, mutation-check each new test, and commit in small verifiable units.
