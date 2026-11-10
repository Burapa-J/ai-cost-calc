# devguard v1.1.0 CLI, Done Gate (`.devguard/checks`) & Verification Reference

## 1. Cross-Platform Setup (macOS, Linux & Windows)

Full documentation and source repository: `https://github.com/Burapa-J/devguard`

Clone the repository and run the installer to wire `verified-dev`, always-on core rules, `agent-verify`, `devguard` CLI, and opt-in `codegraph`, `projectmem`, and `rtk` components across **Claude Code**, **VS Code (Copilot)**, **Antigravity**, **OpenCode**, **Cursor**, **Codex CLI**, and **Gemini CLI**:

```sh
git clone https://github.com/Burapa-J/devguard.git ~/.local/share/agent-kit/src
~/.local/share/agent-kit/src/install.sh
```

---

## 2. Everyday `devguard v1.1.0` CLI Commands

| Command | Purpose |
|---|---|
| `devguard` | Interactive terminal menu (`Select & Install`, `Doctor & Repair`, `Sync Memory`, `Stats & ROI`, `Update`, `Init All Projects`, `Uninstall`) |
| `devguard status` | Compact overview table of installed rules, skill links, active components, and multi-device sync state |
| `devguard doctor [--fix]` | Audits 8 failure modes (legacy `tokless` blocks, broken symlinks, conflicting plugins, MCP drift, RTK hooks, rules sync, version drift, memory sync) and repairs them automatically with `--fix` |
| `devguard stats [-d\|-p]` | Unified telemetry showing RTK shell token savings, ProjectMem logged fixes, CodeGraph AST node counts, and `.verify/*.log` pass rates |
| `devguard check [commit\|push]` | Runs `.devguard/checks` through `agent-verify` (`commit` for fast inner loop; `all` before completion or push) |
| `devguard gate init` | Auto-detects project stack (`Package.swift`, `Cargo.toml`, `package.json`, `*.py`, `*.sh`), writes `.devguard/checks` with `gitleaks` + `osv-scanner` security gates, and installs `pre-commit` / `pre-push` git hooks |
| `devguard review [--with claude\|agy\|gemini] [--base REF]` | Sends uncommitted changes (or commit range) to a second vendor's model in read-only plan mode and writes findings to `.verify/review-<timestamp>.md` |
| `devguard eval run CASES.jsonl [--with agy\|claude] [--reps N] [--label L]` | Runs golden `.jsonl` agent/prompt evaluation cases (measuring pass rate, source tags, and pushback flip rate) and compares runs via `devguard eval compare before.json after.json` |
| `devguard sync [--check]` | Conflict-free multi-device CRDT merge of `projectmem` events (`root-<sha12>` git root commit matching) |
| `devguard update` / `devguard upgrade` | Pulls the latest `devguard` release, upgrades companion tools (`ast-grep`, `shellcheck`, `osv-scanner`, `gitleaks`), and re-applies agent wiring |

---

## 3. Setting Up `.devguard/checks` (Auto-Detected Stack + Security Gates)

Run `devguard gate init` at the root of any git repository, or copy `templates/checks.template` to `.devguard/checks`:

```txt
# Fast inner-loop checks (run on every git commit and `devguard check commit`)
commit lint:    npm run lint
commit secrets: gitleaks git --staged --redact --no-banner .

# Full verification checks (run before git push and `devguard check`)
push   test:    npm test
push   deps:    osv-scanner scan source -r . --allow-no-lockfiles
```

Each check executes via `agent-verify` and writes full unfiltered output to `.verify/gate-<name>.log`.

---

## 4. Standard One-Line Verification Receipt Format

Every completed engineering task must end with a compact, source-tagged verification receipt:

```markdown
- Gate & Tests: `agent-verify test-pass -- npm test` -> `exit=0` (18/18 passed; log: `.verify/test-pass.log`) (`(read .verify/test-pass.log:1-34)`)
- Mutation Check: `agent-verify mutation-fail -- npm test` -> `exit=1` (1 failed as expected when idempotency guard removed; log: `.verify/mutation-fail.log`) (`(read .verify/mutation-fail.log:1-42)`)
- Done Gate: `devguard check` -> `exit=0` (4/4 checks passed: lint, secrets, test, deps; log: `.verify/gate-test.log`) (`(ran: devguard check -> exit 0)`)
```
