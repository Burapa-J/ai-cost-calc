# คู่มือวางขายแพ็กเกจ SKILL.md บน Agensi.io/sell และรับรหัส Affiliate (ตามคำแนะนำของ Joeri Brons)

ไฟล์ ZIP ทั้ง **3 ชิ้น** ถูกจัดโครงสร้างใหม่ให้มีไฟล์ **`SKILL.md` อยู่ชั้นนอกสุด (Root of the ZIP)** ตามที่ระบบอัปโหลดของ `https://www.agensi.io/sell` กำหนดทุกประการ และปรับราคาให้อยู่ในช่วงขายดี `$10–$30` สำหรับ Single-Purpose Skill เรียบร้อยแล้วครับ:
1. `agensi-skills-pack/token-budget-architect.zip` (`SKILL.md` อยู่ที่ Root ของ ZIP) — ราคาแนะนำ **`$14`**
2. `agensi-skills-pack/swiss-minimal-ui-ledger.zip` (`SKILL.md` อยู่ที่ Root ของ ZIP) — ราคาแนะนำ **`$19`**
3. `agensi-skills-pack/cloud-gpu-breakeven-auditor.zip` (`SKILL.md` อยู่ที่ Root ของ ZIP) — ราคาแนะนำ **`$24`**

---

## ขั้นตอนที่ 1 (สำคัญที่สุด): ผูกบัญชีรับเงิน (Payout Method) ก่อนแชร์ลิงก์หรือวางขาย
> **ทำไมต้องทำเป็นอันดับแรก:** Joeri แจ้งชัดเจนว่า **ค่าคอมมิชชัน Affiliate 20% จะเริ่มนับก็ต่อเมื่อตั้งค่า Payout Method เรียบร้อยแล้วเท่านั้น** และการวางขายสกิลแบบมีราคา (`Paid Skill`) ต้องผูกช่องทางรับเงินก่อนจึงจะอนุมัติขึ้นหน้าเว็บได้

1. เข้าไปที่ **https://www.agensi.io** แล้วล็อกอินเข้า **Dashboard → Affiliate** (และ **Creator Settings / Payouts**)
2. เลือกผูกช่องทางรับเงิน (**Stripe** เข้าบัญชีธนาคาร หรือรับเป็นเหรียญ **USDC บนเครือข่าย Solana ผ่าน Zoneless** ซึ่งโอนไวภายใน 72 ชม. หลังขายได้ ขั้นต่ำเพียง `$3.50`)
3. ลิงก์ Affiliate ของคุณ (`https://www.agensi.io/r/BURAPA`) ถูกผูกเข้ากับหน้าเว็บทั้ง **353 หน้า** เรียบร้อยแล้ว พร้อมข้อความ `Affiliate Disclosure` ตามกฎ `Agensi.io/affiliates` ที่ส่วนท้ายของทุกหน้า

---

## ขั้นตอนที่ 2: อัปโหลดไฟล์ ZIP ขึ้นขายที่ https://www.agensi.io/sell

### สินค้าชิ้นที่ 1: `token-budget-architect` (เน้นยืดโควต้าใช้งาน & ลดค่าไฟ API 35–55%)
- **ไฟล์ที่ใช้อัปโหลด:** `agensi-skills-pack/token-budget-architect.zip`
- **ราคาแนะนำ (One-time Price):** **`$14`** (รับส่วนแบ่ง 70% = `$9.80` ต่อการขาย หรือ **90% = `$12.60`** เมื่อลูกค้าซื้อผ่านลิงก์ Affiliate ของคุณเอง)
- **Title / Name:** `token-budget-architect`
- **Description (ก๊อปปี้ไปวางได้เลย):**
  ```markdown
  Work longer on the same Claude Code, Cursor, or Codex quota and cut monthly LLM API bills by 35–55%.

  ### What This Single-Purpose Skill Does
  - **Locks Prompt-Cache Prefixes:** Keeps system instructions and tool schemas static so 85%+ of multi-turn coding sessions read from discounted cached tokens instead of burning fresh quota.
  - **Enforces 0-Token Pre-Read Filtering:** Guides your coding agent to locate exact symbol line ranges with local search before reading files—preventing a 50-file refactor from re-sending 180k tokens on every turn.
  - **Subagent Spawn Gate:** Calculates exact token break-even before spawning background subagents.
  ```

---

### สินค้าชิ้นที่ 2: `swiss-minimal-ui-ledger` (เน้นสั่ง AI สร้างหน้าเว็บ Minimalist สไตล์ Apple ตั้งแต่รอบแรก)
- **ไฟล์ที่ใช้อัปโหลด:** `agensi-skills-pack/swiss-minimal-ui-ledger.zip`
- **ราคาแนะนำ (One-time Price):** **`$19`** (รับส่วนแบ่ง 70% = `$13.30` ต่อการขาย หรือ **90% = `$17.10`** เมื่อลูกค้าซื้อผ่านลิงก์ของคุณเอง)
- **Title / Name:** `swiss-minimal-ui-ledger`
- **Description (ก๊อปปี้ไปวางได้เลย):**
  ```markdown
  Stop wasting 3–4 prompts fixing generic AI purple gradients, neon glow cards, and misaligned financial tables.

  ### What This Single-Purpose Skill Does
  - **Apple-Inspired Minimalist Palette:** Enforces a clean `#FBFBFD` architectural paper surface, frosted glass sticky header (`backdrop-filter: saturate(180%) blur(20px)`), and crisp `1px` hairlines.
  - **Tabular-Nums Financial Alignment:** Automatically formats pricing calculators, SaaS dashboards, and telemetry tables with strict right-aligned `tabular-nums` numbers and smooth `cubic-bezier(0.22, 1, 0.36, 1)` comparison bars.
  - **Zero AI Slop:** Bans decorative emojis, neon gradients, and fake glassmorphism out of the box.
  ```

---

### สินค้าชิ้นที่ 3: `cloud-gpu-breakeven-auditor` (เน้นตรวจโค้ดเพื่อหาจุดคุ้มทุนสลับจาก API ไปเช่า Cloud GPU)
- **ไฟล์ที่ใช้อัปโหลด:** `agensi-skills-pack/cloud-gpu-breakeven-auditor.zip`
- **ราคาแนะนำ (One-time Price):** **`$24`** (รับส่วนแบ่ง 70% = `$16.80` ต่อการขาย หรือ **90% = `$21.60`** เมื่อลูกค้าซื้อผ่านลิงก์ของคุณเอง)
- **Title / Name:** `cloud-gpu-breakeven-auditor`
- **Description (ก๊อปปี้ไปวางได้เลย):**
  ```markdown
  Audit any repository's LLM SDK calls and compute the exact daily request and VRAM break-even point between pay-per-token APIs and dedicated hourly Cloud GPUs.

  ### What This Single-Purpose Skill Does
  - **Scans Real Repo Call Sites:** Extracts prompt lengths, cache hit ratios, and multi-step agent multipliers across OpenAI, Anthropic, Gemini, and DeepSeek SDK calls.
  - **Sizes Dedicated GPU VRAM & Throughput:** Calculates exact `vLLM` instance counts and monthly costs across RTX 4090, A6000, L40S, A100, and H100 GPUs.
  - **Outputs a Clear Decision Ledger:** Shows the exact daily request threshold where switching from pay-per-token API billing to dedicated GPU rental saves money.
  ```
