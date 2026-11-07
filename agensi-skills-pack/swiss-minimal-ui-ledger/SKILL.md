---
name: swiss-minimal-ui-ledger
description: Designs clean Swiss editorial and financial-ledger web interfaces without AI-generated cliches. Use when building dashboards, calculators, SaaS apps, landing pages, or refactoring generic dark-neon UI.
license: Apache-2.0
compatibility: Claude Code, Cursor, v0, Lovable, Bolt, Windsurf, GitHub Copilot, Antigravity
metadata:
  author: Burapa-J
  version: "1.0.0"
  live_demo: "https://burapa-j.github.io/ai-cost-calc/en/index.html"
---

# Swiss Minimal UI Ledger (Anti-Slop Design System)

A strict visual and structural specification that eliminates generic AI-generated UI patterns ("AI slop") in favor of Swiss editorial typography, exposed `1px` architectural hairlines, and high-density tabular data layouts.

---

## 1. Forbidden AI-Slop Patterns (Hard Reject)

When generating or refactoring any HTML, CSS, Tailwind, React, Vue, or SwiftUI interface, the following patterns are strictly prohibited:

1. **Zero Decorative Emojis:** Never place emojis (`🚀`, `⚡`, `✨`, `📊`, `🔥`, `💡`, `✅`) in navigation bars, section headers, buttons, feature cards, or table cells. Use uppercase monospace index tags (`01 //`, `02 //`) or typographic symbols (`→`, `—`, `//`).
2. **Zero Neon Dark-Mode Gradients:** Never use `linear-gradient` backgrounds combining purple (`#8b5cf6`), cyan (`#38bdf8`), and emerald (`#10b981`) on dark navy (`#0f172a`) canvases.
3. **Zero Floating Pill Cards & Heavy Drop Shadows:** Replace `border-radius: 16px` floating cards and `box-shadow: 0 20px 25px` with connected `0px` architectural grid cells separated by `1px solid` structural borders.
4. **Zero Marketing Fluff Copy:** Replace vague hero slogans (*"Supercharge your workflow with next-gen AI"*) with concrete functional specifications and unit metrics.

---

## 2. Architectural Paper & Ink Color Tokens

Default to a warm editorial paper surface with high-contrast carbon ink and a single international signal accent:

```css
:root {
  --paper: #F6F5F0;         /* Primary page canvas */
  --surface: #FFFFFF;       /* Active data / ledger surface */
  --surface-alt: #EFECE4;   /* Hover / secondary cell fill */
  --ink: #141413;           /* Primary typography & structural borders */
  --ink-secondary: #575651; /* Supporting body copy */
  --ink-muted: #85837C;     /* Column headers & metadata tags */
  --line: #DCD9CF;          /* Internal 1px cell hairlines */
  --line-strong: #141413;   /* Outer frame & primary rules */
  --signal: #C83E1D;        /* International Vermilion primary accent */
  --ledger-green: #165B33;  /* Positive delta / savings indicator */
}
```

See `references/css-tokens-and-grid.md` for complete drop-in CSS layout primitives.

---

## 3. Typography & Numeric Discipline

1. **Three-Tier Font Hierarchy:**
   - **Display / Headings:** Tightly tracked grotesque sans-serif (`letter-spacing: -0.03em; font-weight: 600; line-height: 1.15`).
   - **Section Kicker & Metadata:** Uppercase monospace (`font-family: "JetBrains Mono", "SF Mono", monospace; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase`).
   - **Data & Currency Cells:** Right-aligned tabular numerals (`font-variant-numeric: tabular-nums; text-align: right; font-family: var(--mono)`).
2. **Exposed Ledger Framing:**
   - Place interactive controls in a fixed left specification column (`360px–400px`) and live tabular outputs in the right ledger column inside a shared `1px solid var(--line-strong)` frame.
   - Use square or `2px` range thumbs on a `2px` solid track.
