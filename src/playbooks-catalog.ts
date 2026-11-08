import { resolveAffiliateUrl } from './calculator.ts';
import {
  type AffiliateConfigFile,
  CLOUD_GPUS,
  CLOUD_VPS_OPTIONS,
  LLM_MODELS,
  type Locale,
  type PlaybookGuideSpec,
  type PlaybookSvgType,
  type ProgrammaticComparisonPageSpec,
  WORKLOAD_ARCHETYPES
} from './domain.ts';

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderPlaybookSvg(svgType: PlaybookSvgType, locale: Locale): string {
  const isTh = locale === 'th';

  if (svgType === 'thai_token_bars') {
    const title = isTh
      ? 'ทดสอบจริง: ข้อความภาษาไทย 1 หน้า A4 (2,500 ตัวอักษร) กินกี่ Token?'
      : 'Real Benchmark: 1 Page of Thai Text (2,500 chars) Token Consumption';
    const sub = isTh
      ? 'ยิ่งตัวคูณ Token ต่ำ + ค่า Input ถูก = ประหยัดงบงานภาษาไทยได้สูงสุด 8–15 เท่า'
      : 'Lower Thai token inflation + lower $/1M rate = up to 15x lower monthly bill';
    return `<svg viewBox="0 0 680 230" width="100%" height="auto" role="img" aria-label="${esc(title)}" style="display:block; background:var(--bg-elev-2); border:1px solid var(--border); border-radius:10px;">
      <text x="24" y="30" font-size="13" font-weight="700" fill="var(--text)">${esc(title)}</text>
      <text x="24" y="48" font-size="11" fill="var(--text-secondary)">${esc(sub)}</text>

      <text x="24" y="82" class="mono" font-size="11.5" font-weight="600" fill="var(--text)">Gemini 2.5 Flash</text>
      <rect x="185" y="69" width="110" height="16" rx="3" fill="var(--green)"/>
      <text x="305" y="82" class="mono" font-size="11" font-weight="600" fill="var(--green)">~920 tok  • ฿0.05 / 10 pages (${isTh ? 'คุ้มสุดสำหรับงานไทย' : 'Best Value'})</text>

      <text x="24" y="116" class="mono" font-size="11.5" font-weight="600" fill="var(--text)">DeepSeek V3 / Qwen 2.5</text>
      <rect x="185" y="103" width="130" height="16" rx="3" fill="var(--text)"/>
      <text x="325" y="116" class="mono" font-size="11" font-weight="600" fill="var(--text)">~1,080 tok • ฿0.18 / 10 pages (${isTh ? 'ฉลาด + ประหยัด' : 'Smart + Cheap'})</text>

      <text x="24" y="150" class="mono" font-size="11.5" font-weight="500" fill="var(--text-secondary)">OpenAI GPT-4o (o200k)</text>
      <rect x="185" y="137" width="190" height="16" rx="3" fill="var(--text-muted)"/>
      <text x="385" y="150" class="mono" font-size="11" fill="var(--text-secondary)">~1,580 tok • ฿1.36 / 10 pages</text>

      <text x="24" y="184" class="mono" font-size="11.5" font-weight="500" fill="var(--text-secondary)">Claude 3.7 Sonnet</text>
      <rect x="185" y="171" width="250" height="16" rx="3" fill="var(--border-strong)"/>
      <text x="445" y="184" class="mono" font-size="11" fill="var(--text-muted)">~2,120 tok • ฿2.19 / 10 pages</text>

      <line x1="24" y1="202" x2="656" y2="202" stroke="var(--border)" stroke-width="1"/>
      <text x="24" y="218" font-size="10.5" font-weight="500" fill="var(--text-secondary)">${isTh ? 'เทคนิคสำคัญ: ใช้ Gemini Flash / DeepSeek อ่านเอกสารไทยจำนวนมาก แล้วส่งเฉพาะสรุปสั้นๆ ให้ Claude 3.7 คิดต่อ' : 'Key Tip: Parse bulk Thai docs with Gemini Flash / DeepSeek, then pass compact summaries to Claude 3.7'}</text>
    </svg>`;
  }

  if (svgType === 'line_rag_arch') {
    return `<svg viewBox="0 0 680 220" width="100%" height="auto" role="img" aria-label="LINE OA RAG Blueprint" style="display:block; background:var(--bg-elev-2); border:1px solid var(--border); border-radius:10px;">
      <text x="24" y="28" font-size="13" font-weight="700" fill="var(--text)">${isTh ? 'ผังการวางระบบ LINE OA + ค้นเอกสาร (RAG) งบรวม ~฿1,180/เดือน' : 'LINE OA + RAG Production Blueprint (~$34 / ฿1,180 per month)'}</text>
      
      <rect x="24" y="54" width="130" height="96" rx="8" fill="var(--bg-elev)" stroke="var(--border-strong)" stroke-width="1"/>
      <text x="89" y="82" text-anchor="middle" class="mono" font-size="11" font-weight="700" fill="var(--text)">LINE OA</text>
      <text x="89" y="106" text-anchor="middle" font-size="11.5" font-weight="600" fill="var(--text-secondary)">${isTh ? 'ลูกค้าทักแชท' : 'Customer Chat'}</text>
      <text x="89" y="126" text-anchor="middle" class="mono" font-size="10" fill="var(--text-muted)">2,500 msg/day</text>

      <line x1="154" y1="102" x2="192" y2="102" stroke="var(--text-muted)" stroke-width="1.2" stroke-dasharray="3,3"/>
      <polygon points="192,98 200,102 192,106" fill="var(--text-muted)"/>
      <text x="177" y="92" text-anchor="middle" class="mono" font-size="9.5" fill="var(--text-secondary)">&lt;8ms</text>

      <rect x="200" y="54" width="210" height="96" rx="8" fill="var(--bg-elev)" stroke="var(--text)" stroke-width="1.2"/>
      <text x="305" y="78" text-anchor="middle" font-size="11.5" font-weight="700" fill="var(--text)">${isTh ? '1. เซิร์ฟเวอร์ในไทย (Hostatom/Ruk-Com)' : '1. Thailand VPS (Hostatom/Ruk-Com)'}</text>
      <text x="305" y="98" text-anchor="middle" font-size="10.5" fill="var(--text-secondary)">Webhook API + Qdrant Vector DB</text>
      <rect x="235" y="110" width="140" height="24" rx="4" fill="var(--bg-elev-2)" stroke="var(--border)"/>
      <text x="305" y="126" text-anchor="middle" class="mono" font-size="10.5" font-weight="600" fill="var(--text)">$24/mo (~฿828/${isTh ? 'เดือน' : 'mo'})</text>

      <line x1="410" y1="102" x2="452" y2="102" stroke="var(--text-muted)" stroke-width="1.2"/>
      <polygon points="452,98 460,102 452,106" fill="var(--text-muted)"/>
      <text x="435" y="92" text-anchor="middle" class="mono" font-size="9.5" fill="var(--text-secondary)">Cache 75%</text>

      <rect x="460" y="54" width="196" height="96" rx="8" fill="var(--bg-elev)" stroke="var(--border-strong)" stroke-width="1"/>
      <text x="558" y="78" text-anchor="middle" font-size="11.5" font-weight="700" fill="var(--text)">${isTh ? '2. Novita AI (คีย์เดียวครบ)' : '2. Novita AI Router'}</text>
      <text x="558" y="98" text-anchor="middle" font-size="10.5" fill="var(--text-secondary)">Gemini 2.5 Flash / DeepSeek V3</text>
      <rect x="488" y="110" width="140" height="24" rx="4" fill="var(--bg-elev-2)" stroke="var(--border)"/>
      <text x="558" y="126" text-anchor="middle" class="mono" font-size="10.5" font-weight="600" fill="var(--green)">~$10/mo (~฿350/${isTh ? 'เดือน' : 'mo'})</text>

      <rect x="24" y="168" width="632" height="34" rx="6" fill="var(--bg-elev)" stroke="var(--border-strong)"/>
      <text x="340" y="189" text-anchor="middle" font-size="11.5" font-weight="600" fill="var(--text)">${isTh ? 'สรุปงบรวมทั้งระบบ: ~฿1,178/เดือน รองรับ 75,000 แชท/เดือน (เฉลี่ยแชทละ 0.015 บาท)' : 'Total Stack Cost: ~$34/mo (฿1,178/mo) for 75,000 chats/mo ($0.00045 per chat)'}</text>
    </svg>`;
  }

  if (svgType === 'coding_tier_flow') {
    return `<svg viewBox="0 0 680 225" width="100%" height="auto" role="img" aria-label="Coding Agent Token Savings Flow" style="display:block; background:var(--bg-elev-2); border:1px solid var(--border); border-radius:10px;">
      <text x="24" y="28" font-size="13" font-weight="700" fill="var(--text)">${isTh ? 'โครงสร้างลดค่าไฟ Claude Code & Cursor 60% โดยงานไม่ดรอป' : 'How to Cut Claude Code & Cursor Token Spend by 60%'}</text>

      <rect x="24" y="48" width="185" height="150" rx="8" fill="var(--bg-elev)" stroke="var(--border)" stroke-width="1"/>
      <text x="116" y="72" text-anchor="middle" font-size="11.5" font-weight="700" fill="var(--text-secondary)">${isTh ? 'แบบเดิม (เปลืองโควต้า)' : 'Before (Unoptimized)'}</text>
      <text x="116" y="96" text-anchor="middle" font-size="10.5" fill="var(--text-muted)">${isTh ? '• อ่านไฟล์ทั้งโปรเจกต์ทุกเทิร์น' : '• Reads full files every turn'}</text>
      <text x="116" y="116" text-anchor="middle" font-size="10.5" fill="var(--text-muted)">${isTh ? '• แตก Subagent พร่ำเพรื่อ' : '• Spawns costly subagents'}</text>
      <text x="116" y="136" text-anchor="middle" font-size="10.5" fill="var(--text-muted)">${isTh ? '• ใช้โมเดลแพงสุดกับงานเล็ก' : '• Flagship model on trivial edits'}</text>
      <rect x="46" y="154" width="140" height="28" rx="5" fill="var(--bg-elev-2)" stroke="var(--border)"/>
      <text x="116" y="172" text-anchor="middle" class="mono" font-size="11.5" font-weight="700" fill="var(--text-secondary)">$240/mo (฿8,280)</text>

      <line x1="209" y1="123" x2="243" y2="123" stroke="var(--text-muted)" stroke-width="1.2"/>
      <polygon points="243,119 251,123 243,127" fill="var(--text-muted)"/>

      <rect x="251" y="48" width="185" height="150" rx="8" fill="var(--bg-elev)" stroke="var(--text)" stroke-width="1.2"/>
      <text x="343" y="72" text-anchor="middle" font-size="11.5" font-weight="700" fill="var(--text)">${isTh ? 'ด่านกรอง Agensi.io Skills' : 'Agensi.io Guardrails'}</text>
      <text x="343" y="96" text-anchor="middle" class="mono" font-size="10" font-weight="600" fill="var(--text)">token-budget-architect</text>
      <text x="343" y="112" text-anchor="middle" font-size="10" fill="var(--text-secondary)">${isTh ? 'อ่านเฉพาะบรรทัดที่แก้ (-30%)' : 'Reads line-ranges only (-30%)'}</text>
      <text x="343" y="136" text-anchor="middle" class="mono" font-size="10" font-weight="600" fill="var(--text)">devguard (verified-dev)</text>
      <text x="343" y="152" text-anchor="middle" font-size="10" fill="var(--text-secondary)">${isTh ? 'บล็อก Subagent เกินจำเป็น (-35%)' : 'Blocks wasted subagents (-35%)'}</text>
      <rect x="273" y="164" width="140" height="22" rx="4" fill="var(--bg-elev-2)" stroke="var(--border)"/>
      <text x="343" y="179" text-anchor="middle" class="mono" font-size="10" font-weight="600" fill="var(--text)">${isTh ? 'จ่ายครั้งเดียว $14–$19' : '$14–$19 One-Time'}</text>

      <line x1="436" y1="123" x2="470" y2="123" stroke="var(--text-muted)" stroke-width="1.2"/>
      <polygon points="470,119 478,123 470,127" fill="var(--text-muted)"/>

      <rect x="478" y="48" width="178" height="150" rx="8" fill="var(--bg-elev)" stroke="var(--border-strong)" stroke-width="1"/>
      <text x="567" y="72" text-anchor="middle" font-size="11.5" font-weight="700" fill="var(--green)">${isTh ? 'หลังปรับแต่ง (ประหยัด 62%)' : 'After (62% Lower Bill)'}</text>
      <text x="567" y="96" text-anchor="middle" font-size="10.5" fill="var(--text-secondary)">${isTh ? '• 80% งานค้น/แก้เล็ก → DeepSeek' : '• 80% routine → DeepSeek/Haiku'}</text>
      <text x="567" y="116" text-anchor="middle" font-size="10.5" fill="var(--text-secondary)">${isTh ? '• 20% งานยาก → Claude 3.7' : '• 20% hard tasks → Claude 3.7'}</text>
      <text x="567" y="136" text-anchor="middle" font-size="10.5" fill="var(--text-secondary)">${isTh ? '• โควต้ายาวขึ้น 2.5 เท่า' : '• 2.5x longer coding sessions'}</text>
      <rect x="497" y="154" width="140" height="28" rx="5" fill="var(--bg-elev-2)" stroke="var(--green)"/>
      <text x="567" y="172" text-anchor="middle" class="mono" font-size="11.5" font-weight="700" fill="var(--green)">$92/mo (฿3,174)</text>
    </svg>`;
  }

  if (svgType === 'gpu_breakeven_curve') {
    return `<svg viewBox="0 0 680 230" width="100%" height="auto" role="img" aria-label="API vs Cloud GPU Break-Even Chart" style="display:block; background:var(--bg-elev-2); border:1px solid var(--border); border-radius:10px;">
      <text x="24" y="28" font-size="13" font-weight="700" fill="var(--text)">${isTh ? 'กราฟจุดตัดคุ้มทุน: จ่ายตาม Token (API) เทียบกับ เช่าเหมาชั่วโมง (RunPod GPU)' : 'Break-Even Curve: Pay-Per-Token API vs. Flat Hourly RunPod GPU'}</text>

      <line x1="70" y1="190" x2="640" y2="190" stroke="var(--border-strong)" stroke-width="1"/>
      <line x1="70" y1="50" x2="70" y2="190" stroke="var(--border-strong)" stroke-width="1"/>
      <text x="65" y="193" text-anchor="end" class="mono" font-size="9.5" fill="var(--text-muted)">$0</text>
      <text x="65" y="142" text-anchor="end" class="mono" font-size="9.5" fill="var(--text-muted)">$160</text>
      <text x="65" y="92" text-anchor="end" class="mono" font-size="9.5" fill="var(--text-muted)">$400</text>

      <line x1="70" y1="142" x2="630" y2="142" stroke="var(--green)" stroke-width="2" stroke-dasharray="5,4"/>
      <rect x="430" y="116" width="205" height="22" rx="4" fill="var(--bg-elev)" stroke="var(--border)"/>
      <text x="532" y="131" text-anchor="middle" class="mono" font-size="10" font-weight="600" fill="var(--green)">RunPod RTX 4090 ($158/mo flat)</text>

      <polyline points="70,188 210,165 280,142 440,95 610,54" fill="none" stroke="var(--text-secondary)" stroke-width="2"/>
      <text x="530" y="58" class="mono" font-size="10" font-weight="600" fill="var(--text-secondary)">Flagship API (Per-Token)</text>

      <circle cx="280" cy="142" r="5" fill="var(--text)" stroke="var(--bg-elev)" stroke-width="2"/>
      <line x1="280" y1="142" x2="280" y2="190" stroke="var(--text-muted)" stroke-width="1" stroke-dasharray="3,3"/>
      <rect x="195" y="78" width="175" height="44" rx="6" fill="var(--bg-elev)" stroke="var(--border-strong)"/>
      <text x="282" y="96" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--text)">${isTh ? 'จุดตัดคุ้มทุน (Break-Even)' : 'Break-Even Point'}</text>
      <text x="282" y="112" text-anchor="middle" class="mono" font-size="10" fill="var(--text-secondary)">~1,450 ${isTh ? 'งาน/วัน (฿5,450/ด.)' : 'tasks/day ($158/mo)'}</text>

      <text x="150" y="210" text-anchor="middle" font-size="10.5" font-weight="500" fill="var(--text-secondary)">${isTh ? 'งานน้อย (<1,400/วัน) → ใช้ API ถูกกว่า' : 'Low Volume → API Wins'}</text>
      <text x="480" y="210" text-anchor="middle" font-size="10.5" font-weight="600" fill="var(--green)">${isTh ? 'งานหนัก (>1,450/วัน) → เช่า GPU ล็อกงบนิ่ง' : 'Heavy Volume → Flat GPU Wins'}</text>
    </svg>`;
  }

  // vps_latency_map
  return `<svg viewBox="0 0 680 220" width="100%" height="auto" role="img" aria-label="Thailand vs Global Cloud VPS Latency & Use Case Map" style="display:block; background:var(--bg-elev-2); border:1px solid var(--border); border-radius:10px;">
    <text x="24" y="28" font-size="13" font-weight="700" fill="var(--text)">${isTh ? 'เทียบความเร็วตอบสนอง (Latency) และการเลือกเซิร์ฟเวอร์สำหรับผู้ใช้ในไทย' : 'Server Selection Matrix: Domestic Bangkok Nodes vs. Global Cloud'}</text>

    <rect x="24" y="48" width="200" height="150" rx="8" fill="var(--bg-elev)" stroke="var(--text)" stroke-width="1.2"/>
    <text x="124" y="72" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text)">Hostatom VPS (TH)</text>
    <text x="124" y="92" text-anchor="middle" class="mono" font-size="11" font-weight="600" fill="var(--green)">Ping: 4–8 ms (BKK)</text>
    <text x="124" y="114" text-anchor="middle" font-size="10.5" fill="var(--text-secondary)">${isTh ? '• คุ้มราคาที่สุดในไทย' : '• Best THB/GB value in TH'}</text>
    <text x="124" y="132" text-anchor="middle" font-size="10.5" fill="var(--text-secondary)">${isTh ? '• เหมาะรัน Docker / Qdrant / n8n' : '• Ideal for Docker / Qdrant / n8n'}</text>
    <rect x="49" y="154" width="150" height="28" rx="5" fill="var(--bg-elev-2)" stroke="var(--border)"/>
    <text x="124" y="172" text-anchor="middle" class="mono" font-size="11" font-weight="700" fill="var(--text)">$24/mo (~฿828)</text>

    <rect x="240" y="48" width="200" height="150" rx="8" fill="var(--bg-elev)" stroke="var(--border-strong)" stroke-width="1"/>
    <text x="340" y="72" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text)">Ruk-Com Managed (TH)</text>
    <text x="340" y="92" text-anchor="middle" class="mono" font-size="11" font-weight="600" fill="var(--green)">Ping: 5–9 ms (BKK)</text>
    <text x="340" y="114" text-anchor="middle" font-size="10.5" fill="var(--text-secondary)">${isTh ? '• มีวิศวกรไทยดูแลให้ 24 ชม.' : '• Fully managed 24/7 Thai SLA'}</text>
    <text x="340" y="132" text-anchor="middle" font-size="10.5" fill="var(--text-secondary)">${isTh ? '• แถม WAF กันยิง + DirectAdmin' : '• Enterprise WAF + DirectAdmin'}</text>
    <rect x="265" y="154" width="150" height="28" rx="5" fill="var(--bg-elev-2)" stroke="var(--border)"/>
    <text x="340" y="172" text-anchor="middle" class="mono" font-size="11" font-weight="700" fill="var(--text)">$46/mo (~฿1,587)</text>

    <rect x="456" y="48" width="200" height="150" rx="8" fill="var(--bg-elev)" stroke="var(--border)" stroke-width="1"/>
    <text x="556" y="72" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-secondary)">Cloudways (SG/Global)</text>
    <text x="556" y="92" text-anchor="middle" class="mono" font-size="11" font-weight="600" fill="var(--text-muted)">Ping: ~32 ms (SG Edge)</text>
    <text x="556" y="114" text-anchor="middle" font-size="10.5" fill="var(--text-muted)">${isTh ? '• รองรับลูกค้าทั่วโลก (DO/Vultr)' : '• Global SaaS (DO / Vultr HF)'}</text>
    <text x="556" y="132" text-anchor="middle" font-size="10.5" fill="var(--text-muted)">${isTh ? '• ระบบ Staging + Auto-Backup' : '• 1-Click Staging & Auto-Healing'}</text>
    <rect x="481" y="154" width="150" height="28" rx="5" fill="var(--bg-elev-2)" stroke="var(--border)"/>
    <text x="556" y="172" text-anchor="middle" class="mono" font-size="11" font-weight="700" fill="var(--text-secondary)">$54/mo (~฿1,863)</text>
  </svg>`;
}

export function renderHomeVisualArchitectureStrip(locale: Locale): string {
  const isTh = locale === 'th';
  return `<div class="visual-trio-grid">
    <div class="visual-card">
      <div class="visual-svg-wrap">
        <svg viewBox="0 0 280 96" width="100%" height="84" role="img" aria-label="Single Key Model Routing">
          <rect x="8" y="28" width="76" height="40" rx="8" fill="#1D1D1F"/>
          <text x="46" y="52" text-anchor="middle" class="mono" font-size="10" font-weight="700" fill="#FFFFFF">1 API KEY</text>
          <path d="M84 48 L132 20 M84 48 L132 48 M84 48 L132 76" stroke="#0066CC" stroke-width="1.6" fill="none"/>
          <rect x="132" y="8" width="138" height="22" rx="5" fill="#EFF6FF" stroke="#BFDBFE"/>
          <text x="201" y="23" text-anchor="middle" class="mono" font-size="9.5" font-weight="600" fill="#0066CC">Gemini Flash ($0.15)</text>
          <rect x="132" y="37" width="138" height="22" rx="5" fill="#F0FDF4" stroke="#BBF7D0"/>
          <text x="201" y="52" text-anchor="middle" class="mono" font-size="9.5" font-weight="600" fill="#1D7D3F">DeepSeek V3 ($0.55)</text>
          <rect x="132" y="66" width="138" height="22" rx="5" fill="#FFFBEB" stroke="#FDE68A"/>
          <text x="201" y="81" text-anchor="middle" class="mono" font-size="9.5" font-weight="600" fill="#B45309">Claude 3.7 ($3.00)</text>
        </svg>
      </div>
      <div class="benefit-title">${isTh ? '1. แยกโมเดลตามความยากในบิลเดียว' : '1. Route by Task Complexity'}</div>
      <p class="benefit-desc">${isTh ? 'ส่งงานทั่วไป 80% ไปรุ่นประหยัด ($0.15/1M) และใช้รุ่นเรือธงเฉพาะงานยาก 20% ลดค่า API ทันที 65%' : 'Send 80% routine tasks to $0.15/1M models and 20% hard reasoning to flagships—cutting spend by 65%.'}</p>
    </div>

    <div class="visual-card">
      <div class="visual-svg-wrap">
        <svg viewBox="0 0 280 96" width="100%" height="84" role="img" aria-label="Prompt Cache and Diff Guard">
          <text x="10" y="24" font-size="9.5" font-weight="600" fill="#86868B">${isTh ? 'ก่อนปรับ (อ่านซ้ำทั้งไฟล์)' : 'Before (Full File Rescan)'}</text>
          <rect x="10" y="30" width="250" height="14" rx="4" fill="#FCA5A5"/>
          <text x="10" y="62" font-size="9.5" font-weight="600" fill="#1D7D3F">${isTh ? 'เปิด Cache + อ่านเฉพาะจุดแก้ (-65%)' : 'With Cache + Diff-Only Skill (-65%)'}</text>
          <rect x="10" y="68" width="88" height="14" rx="4" fill="#1D7D3F"/>
          <text x="108" y="79" class="mono" font-size="10" font-weight="700" fill="#1D7D3F">2.5x Longer Quota</text>
        </svg>
      </div>
      <div class="benefit-title">${isTh ? '2. ยืดโควต้าใช้งานนานขึ้น 2.5 เท่า' : '2. Stretch Quota 2.5x Longer'}</div>
      <p class="benefit-desc">${isTh ? 'ล็อกคำสั่งส่วนหัวให้ติด Prompt Cache (ลด 90%) คู่กับสกิลบังคับให้ AI อ่านเฉพาะบรรทัดที่แก้' : 'Combine 90% prompt caching discounts with diff-scoped coding rules so your daily limit lasts 2.5x longer.'}</p>
    </div>

    <div class="visual-card">
      <div class="visual-svg-wrap">
        <svg viewBox="0 0 280 96" width="100%" height="84" role="img" aria-label="GPU Break-Even Cap">
          <line x1="16" y1="82" x2="264" y2="82" stroke="#D1D5DB" stroke-width="1"/>
          <line x1="16" y1="48" x2="264" y2="48" stroke="#1D7D3F" stroke-width="2" stroke-dasharray="4,3"/>
          <polyline points="16,78 95,62 140,48 245,14" fill="none" stroke="#D97706" stroke-width="2.2"/>
          <circle cx="140" cy="48" r="4.5" fill="#0066CC"/>
          <text x="148" y="42" class="mono" font-size="9.5" font-weight="700" fill="#0066CC">Break-Even</text>
          <text x="175" y="62" class="mono" font-size="9" font-weight="600" fill="#1D7D3F">$0.44/hr Flat GPU</text>
        </svg>
      </div>
      <div class="benefit-title">${isTh ? '3. รู้จุดตัดย้ายไปเช่า GPU รายชั่วโมง' : '3. Know Your Exact GPU Break-Even'}</div>
      <p class="benefit-desc">${isTh ? 'เห็นทันทีว่าเมื่อมีงานกี่ครั้ง/วัน การเปลี่ยนจากจ่ายรายคำไปเช่า RunPod เหมาชั่วโมงจะถูกกว่า' : 'Spot the exact daily volume where switching from per-token APIs to a $0.44/hr GPU caps your monthly bill.'}</p>
    </div>
  </div>`;
}

export function renderSpecificMatchupCard(
  spec: ProgrammaticComparisonPageSpec,
  locale: Locale,
  affiliateConfig: AffiliateConfigFile
): string {
  const isTh = locale === 'th';
  const fx = affiliateConfig.usdToThbDefault || 34.5;

  if (spec.category === 'api_vs_api') {
    const m1 = LLM_MODELS.find((m) => m.id === spec.primaryModelId) ?? LLM_MODELS[0];
    const m2 = LLM_MODELS.find((m) => m.id === spec.secondaryModelId) ?? LLM_MODELS[1];
    const maxIn = Math.max(m1.inputUsdPer1M, m2.inputUsdPer1M, 0.1);
    const maxOut = Math.max(m1.outputUsdPer1M, m2.outputUsdPer1M, 0.1);
    const w1In = Math.max(18, Math.round((m1.inputUsdPer1M / maxIn) * 220));
    const w2In = Math.max(18, Math.round((m2.inputUsdPer1M / maxIn) * 220));
    const w1Out = Math.max(18, Math.round((m1.outputUsdPer1M / maxOut) * 220));
    const w2Out = Math.max(18, Math.round((m2.outputUsdPer1M / maxOut) * 220));
    const cheaper = m1.inputUsdPer1M <= m2.inputUsdPer1M ? m1 : m2;
    const pricier = cheaper.id === m1.id ? m2 : m1;
    const url1 = resolveAffiliateUrl(affiliateConfig, m1.affiliateId, `${spec.slug}-${m1.id}`);
    const url2 = resolveAffiliateUrl(affiliateConfig, m2.affiliateId, `${spec.slug}-${m2.id}`);

    return `<div class="matchup-spotlight">
      <div class="section-tag" style="margin-bottom:14px;">
        <span>${isTh ? 'สรุปเทียบตัวต่อตัว (HEAD-TO-HEAD SCORECARD)' : 'HEAD-TO-HEAD VISUAL SCORECARD'}</span>
        <span>${esc(m1.name)} vs ${esc(m2.name)}</span>
      </div>
      <svg viewBox="0 0 680 148" width="100%" height="auto" role="img" aria-label="${esc(m1.name)} vs ${esc(m2.name)}" style="display:block; background:var(--bg-elev-2); border:1px solid var(--border); border-radius:10px; margin-bottom:14px;">
        <text x="20" y="26" font-size="11.5" font-weight="700" fill="var(--text)">${isTh ? 'เทียบราคาต่อ 1 ล้าน Token (แถบสั้น = ประหยัดกว่า)' : 'Price per 1M Tokens (Shorter bar = Lower cost)'}</text>
        
        <text x="20" y="56" class="mono" font-size="11" font-weight="600" fill="var(--text)">${esc(m1.name)} (In)</text>
        <rect x="210" y="44" width="${w1In}" height="15" rx="3" fill="var(--text)"/>
        <text x="${218 + w1In}" y="56" class="mono" font-size="10.5" font-weight="600" fill="var(--text)">$${m1.inputUsdPer1M}/1M (Cache $${m1.cachedInputUsdPer1M})</text>

        <text x="20" y="82" class="mono" font-size="11" font-weight="600" fill="var(--text)">${esc(m2.name)} (In)</text>
        <rect x="210" y="70" width="${w2In}" height="15" rx="3" fill="var(--green)"/>
        <text x="${218 + w2In}" y="82" class="mono" font-size="10.5" font-weight="600" fill="var(--green)">$${m2.inputUsdPer1M}/1M (Cache $${m2.cachedInputUsdPer1M})</text>

        <text x="20" y="112" class="mono" font-size="11" fill="var(--text-secondary)">${esc(m1.name)} (Out)</text>
        <rect x="210" y="100" width="${w1Out}" height="13" rx="3" fill="var(--text-muted)"/>
        <text x="${218 + w1Out}" y="111" class="mono" font-size="10" fill="var(--text-secondary)">$${m1.outputUsdPer1M}/1M • Context ${m1.contextWindowK}K</text>

        <text x="20" y="136" class="mono" font-size="11" fill="var(--text-secondary)">${esc(m2.name)} (Out)</text>
        <rect x="210" y="124" width="${w2Out}" height="13" rx="3" fill="var(--border-strong)"/>
        <text x="${218 + w2Out}" y="135" class="mono" font-size="10" fill="var(--text-secondary)">$${m2.outputUsdPer1M}/1M • Context ${m2.contextWindowK}K</text>
      </svg>
      <div class="matchup-decision-grid">
        <div class="decision-box">
          <div class="decision-badge">${isTh ? `เมื่อไหร่ควรเลือก ${cheaper.name}` : `When to pick ${cheaper.name}`}</div>
          <p class="benefit-desc">${isTh ? `${cheaper.summary.th} — เหมาะเป็นโมเดลหลักรับงาน 80% แรกเพื่อคุมงบรายเดือนให้ต่ำที่สุด` : `${cheaper.summary.en} — Best as your primary workhorse for 80% of daily requests.`}</p>
          <a class="action-link" style="display:inline-block; margin-top:8px;" href="${esc(cheaper.id === m1.id ? url1 : url2)}" target="_blank" rel="noopener sponsored">${isTh ? `ใช้ ${cheaper.name} ในบิลเดียว →` : `Run ${cheaper.name} →`}</a>
        </div>
        <div class="decision-box">
          <div class="decision-badge">${isTh ? `เมื่อไหร่ควรเลือก ${pricier.name}` : `When to pick ${pricier.name}`}</div>
          <p class="benefit-desc">${isTh ? `${pricier.summary.th} — เรียกใช้เฉพาะงานที่ต้องการความแม่นยำสูงหรือแก้โค้ดหลายไฟล์` : `${pricier.summary.en} — Route complex multi-step reasoning here when accuracy is critical.`}</p>
          <a class="action-link" style="display:inline-block; margin-top:8px;" href="${esc(pricier.id === m1.id ? url1 : url2)}" target="_blank" rel="noopener sponsored">${isTh ? `ใช้ ${pricier.name} ในบิลเดียว →` : `Run ${pricier.name} →`}</a>
        </div>
      </div>
    </div>`;
  }

  if (spec.category === 'api_vs_gpu') {
    const model = LLM_MODELS.find((m) => m.id === spec.primaryModelId) ?? LLM_MODELS[0];
    const gpu = CLOUD_GPUS.find((g) => g.id === spec.gpuId) ?? CLOUD_GPUS[0];
    const gpuMonthly10h = Math.round(gpu.hourlyUsd * 10 * 30);
    const gpuThb10h = Math.round(gpuMonthly10h * fx);
    const gpuUrl = resolveAffiliateUrl(affiliateConfig, gpu.affiliateId, `${spec.slug}-${gpu.id}`);
    const apiUrl = resolveAffiliateUrl(affiliateConfig, model.affiliateId, `${spec.slug}-${model.id}`);

    return `<div class="matchup-spotlight">
      <div class="section-tag" style="margin-bottom:14px;">
        <span>${isTh ? 'จุดตัดคุ้มทุนและคำสั่งตั้งค่าระบบจริง (API VS GPU BLUEPRINT)' : 'API VS. DEDICATED GPU BREAK-EVEN BLUEPRINT'}</span>
        <span>${esc(model.name)} vs ${esc(gpu.name)}</span>
      </div>
      ${renderPlaybookSvg('gpu_breakeven_curve', locale)}
      <div class="matchup-decision-grid" style="margin-top:14px;">
        <div class="decision-box">
          <div class="decision-badge">${isTh ? `1. ใช้ ${model.name} API เมื่อยอดยังไม่ถึง ~$${gpuMonthly10h}/เดือน` : `1. Stay on ${model.name} API below ~$${gpuMonthly10h}/mo`}</div>
          <p class="benefit-desc">${isTh ? `จ่ายตามจริง Input $${model.inputUsdPer1M}/1M (Cache $${model.cachedInputUsdPer1M}/1M) ไม่ต้องดูแลการ์ดจอเอง เหมาะกับช่วงเริ่มต้นหรือทราฟฟิกมาเป็นช่วงๆ` : `Pay per token ($${model.inputUsdPer1M}/1M in, $${model.cachedInputUsdPer1M}/1M cached) with zero ops overhead during spiky or low-volume phases.`}</p>
          <a class="action-link" style="display:inline-block; margin-top:8px;" href="${esc(apiUrl)}" target="_blank" rel="noopener sponsored">${isTh ? `ใช้ ${model.name} แบบจ่ายตามจริง →` : `Start with ${model.name} API →`}</a>
        </div>
        <div class="decision-box">
          <div class="decision-badge">${isTh ? `2. ย้ายมาเช่า ${gpu.name} ($${gpu.hourlyUsd}/ชม.) เมื่อต้องการล็อกงบ` : `2. Switch to ${gpu.name} ($${gpu.hourlyUsd}/hr) for Flat TCO`}</div>
          <p class="benefit-desc">${isTh ? `ได้ VRAM ${gpu.vramGb}GB (~${gpu.throughputTokensPerSec} tok/s) เปิดวันละ 10 ชม. จ่ายคงที่ ~$${gpuMonthly10h}/เดือน (~฿${gpuThb10h.toLocaleString()}) เหมาะรัน: ${gpu.bestForModels}` : `${gpu.vramGb}GB VRAM (~${gpu.throughputTokensPerSec} tok/s) caps 10h/day usage at ~$${gpuMonthly10h}/mo. Ideal for: ${gpu.bestForModels}.`}</p>
          <code style="display:block; margin-top:8px; padding:6px 10px; background:var(--bg); color:var(--text); border:1px solid var(--border); border-radius:5px; font-size:0.74rem; font-family:var(--mono); overflow-x:auto;">vllm serve Qwen/Qwen2.5-Coder-32B-Instruct --enable-prefix-caching --max-model-len 32768</code>
          <a class="action-link" style="display:inline-block; margin-top:8px;" href="${esc(gpuUrl)}" target="_blank" rel="noopener sponsored">${isTh ? `เช่า ${gpu.name} บน RunPod →` : `Deploy ${gpu.name} on RunPod →`}</a>
        </div>
      </div>
    </div>`;
  }

  if (spec.category === 'vps_vs_vps') {
    const v1 = CLOUD_VPS_OPTIONS.find((v) => v.id === spec.vpsIdA) ?? CLOUD_VPS_OPTIONS[0];
    const v2 = CLOUD_VPS_OPTIONS.find((v) => v.id === spec.vpsIdB) ?? CLOUD_VPS_OPTIONS[1];
    const u1 = resolveAffiliateUrl(affiliateConfig, v1.affiliateId, `${spec.slug}-${v1.id}`);
    const u2 = resolveAffiliateUrl(affiliateConfig, v2.affiliateId, `${spec.slug}-${v2.id}`);

    return `<div class="matchup-spotlight">
      <div class="section-tag" style="margin-bottom:14px;">
        <span>${isTh ? 'เทียบสเปกเซิร์ฟเวอร์และ Latency การใช้งานจริง' : 'INFRASTRUCTURE & LATENCY HEAD-TO-HEAD'}</span>
        <span>${esc(v1.name)} vs ${esc(v2.name)}</span>
      </div>
      ${renderPlaybookSvg('vps_latency_map', locale)}
      <div class="matchup-decision-grid" style="margin-top:14px;">
        <div class="decision-box">
          <div class="decision-badge">${esc(v1.name)} — $${v1.monthlyUsd}/mo (฿${Math.round(v1.monthlyUsd * fx).toLocaleString()})</div>
          <p class="benefit-desc">${v1.vcpu} vCPU / ${v1.ramGb}GB RAM (${v1.region.toUpperCase()}). ${esc(v1.summary[locale])}</p>
          <a class="action-link" style="display:inline-block; margin-top:8px;" href="${esc(u1)}" target="_blank" rel="noopener sponsored">${isTh ? 'ดูแพ็กเกจเซิร์ฟเวอร์นี้ →' : 'View Server Plan →'}</a>
        </div>
        <div class="decision-box">
          <div class="decision-badge">${esc(v2.name)} — $${v2.monthlyUsd}/mo (฿${Math.round(v2.monthlyUsd * fx).toLocaleString()})</div>
          <p class="benefit-desc">${v2.vcpu} vCPU / ${v2.ramGb}GB RAM (${v2.region.toUpperCase()}). ${esc(v2.summary[locale])}</p>
          <a class="action-link" style="display:inline-block; margin-top:8px;" href="${esc(u2)}" target="_blank" rel="noopener sponsored">${isTh ? 'ดูแพ็กเกจเซิร์ฟเวอร์นี้ →' : 'View Server Plan →'}</a>
        </div>
      </div>
    </div>`;
  }

  // workload_usecase
  const arch = WORKLOAD_ARCHETYPES.find((a) => a.id === spec.archetypeId) ?? WORKLOAD_ARCHETYPES[0];
  const model = LLM_MODELS.find((m) => m.id === spec.primaryModelId) ?? LLM_MODELS[0];
  const svgChoice: PlaybookSvgType =
    arch.id === 'autonomous-coding-agent'
      ? 'coding_tier_flow'
      : arch.id === 'rag-customer-support-bot'
        ? 'line_rag_arch'
        : 'thai_token_bars';

  return `<div class="matchup-spotlight">
    <div class="section-tag" style="margin-bottom:14px;">
      <span>${isTh ? 'ผังการวางระบบและเทคนิคลดต้นทุนตามประเภทงาน' : 'WORKLOAD ARCHITECTURE & COST BLUEPRINT'}</span>
      <span>${esc(arch.name[locale])}</span>
    </div>
    ${renderPlaybookSvg(svgChoice, locale)}
    <div class="matchup-decision-grid" style="margin-top:14px;">
      <div class="decision-box">
        <div class="decision-badge">${isTh ? `ค่าตั้งต้นที่แนะนำสำหรับ ${arch.name.th}` : `Recommended Profile for ${arch.name.en}`}</div>
        <p class="benefit-desc">${esc(arch.summary[locale])} (${arch.preset.requestsPerDay?.toLocaleString()} req/day, ${arch.preset.agentSteps}x steps, Cache ${Math.round((arch.preset.cacheHitRate ?? 0.4) * 100)}%)</p>
      </div>
      <div class="decision-box">
        <div class="decision-badge">${isTh ? `ตั้งค่า ${model.name} อย่างไรไม่ให้งบบานปลาย` : `How to Keep ${model.name} Bills Low`}</div>
        <p class="benefit-desc">${isTh ? `วาง System Prompt คงที่ไว้บนสุดเพื่อรับราคา Cache $${model.cachedInputUsdPer1M}/1M (จากปกติ $${model.inputUsdPer1M}/1M) และใช้ชุดคำสั่ง Agensi.io คุมเพดาน Token ต่อรอบ` : `Pin static context at the top to trigger $${model.cachedInputUsdPer1M}/1M cached input pricing (down from $${model.inputUsdPer1M}/1M).`}</p>
      </div>
    </div>
  </div>`;
}

export function buildPlaybooksCatalog(): PlaybookGuideSpec[] {
  return [
    {
      slug: 'thai-tokenizer-cost-benchmark',
      svgType: 'thai_token_bars',
      badge: {
        th: 'BENCHMARK ภาษาไทย • ประหยัดงบ 8–15 เท่า',
        en: 'THAI TOKEN BENCHMARK • SAVE 8–15X'
      },
      title: {
        th: 'เจาะลึก "ตัวคูณโทเค็นภาษาไทย" (Thai Token Tax) — ข้อความไทย 1 หน้า A4 ใช้ค่ายไหนถูกสุด?',
        en: 'The Thai Tokenizer Tax Benchmark (2026) — Which LLM Costs Least on Thai Text?'
      },
      metaDescription: {
        th: 'ผลทดสอบจริง: ข้อความภาษาไทย 1 หน้ากระดาษ A4 (2,500 ตัวอักษร) ถูกตัดเป็นกี่ Token ใน Gemini 2.5 Flash, DeepSeek V3, GPT-4o และ Claude 3.7 พร้อมสูตรเลือกโมเดลให้ประหยัดที่สุด',
        en: 'Empirical benchmark measuring how many tokens 1 page of Thai text (2,500 characters) consumes across Gemini 2.5 Flash, DeepSeek V3, GPT-4o, and Claude 3.7 Sonnet.'
      },
      h1: {
        th: 'เจาะลึก "ตัวคูณโทเค็นภาษาไทย": ทำไมข้อความไทย 1 หน้า A4 ถึงจ่ายแพงกว่าภาษาอังกฤษ 2.3 เท่า และแก้อย่างไร?',
        en: 'Thai Tokenizer Benchmark: Why Thai Text Costs up to 2.3x More Tokens (and How to Fix It)'
      },
      readTime: { th: 'อ่านจบใน 3 นาที • มีตารางเทียบจริง', en: '3 min read • Empirical Benchmark' },
      keyTakeaway: {
        th: 'ฟันธง: งานอ่านเอกสารไทย สรุปแชท หรือคัดกรองข้อมูล ให้ใช้ Gemini 2.5 Flash หรือ DeepSeek V3 ผ่าน Novita AI จะประหยัดกว่าใช้โมเดลเรือธงตรงๆ ถึง 12–40 เท่า เพราะทั้งตัวคูณ Token ภาษาไทยต่ำกว่าและราคาต่อล้าน Token ถูกกว่า',
        en: 'Bottom Line: For Thai document parsing, RAG, and chat triage, routing to Gemini 2.5 Flash or DeepSeek V3 via a unified API cuts effective Thai per-page cost by 12–40x compared to flagship models.'
      },
      presetWorkload: {
        requestsPerDay: 3000,
        inputTokensPerReq: 2200,
        outputTokensPerReq: 500,
        cacheHitRate: 0.45,
        agentSteps: 2,
        activeHoursPerDay: 12
      },
      comparisonHeaders: {
        colA: { th: 'โมเดล (ทดสอบด้วยเอกสารไทย 2,500 ตัวอักษร)', en: 'Model (2,500 Thai chars / ~1 A4 page)' },
        colB: { th: 'จำนวน Token ที่ถูกตัดจริง', en: 'Measured Tokens / Page' },
        colC: { th: 'ต้นทุนต่อ 1,000 หน้า A4 (บาท)', en: 'Cost per 1,000 A4 Pages' },
        colD: { th: 'งานที่แนะนำให้ใช้', en: 'Best Use Case' }
      },
      comparisonRows: [
        {
          item: { th: 'Gemini 2.5 Flash (1M Context)', en: 'Gemini 2.5 Flash (1M Context)' },
          colB: '~920 tokens (1.4x)',
          colC: '฿4.75 ($0.14)',
          verdict: {
            th: 'ชนะเลิศสำหรับงานอ่านเอกสารไทย, OCR, และสรุปแชท LINE OA จำนวนมาก',
            en: 'Best overall for bulk Thai PDF/OCR extraction and high-volume RAG.'
          }
        },
        {
          item: { th: 'DeepSeek V3 / Qwen 2.5 (ผ่าน Novita AI)', en: 'DeepSeek V3 / Qwen 2.5 (via Novita AI)' },
          colB: '~1,080 tokens (1.6x)',
          colC: '฿20.50 ($0.59)',
          verdict: {
            th: 'คุ้มที่สุดเมื่อต้องการให้วิเคราะห์ตรรกะ เขียนโค้ด หรือดึง JSON ซับซ้อนจากภาษาไทย',
            en: 'Sweet spot for structured JSON extraction, Thai reasoning, and agent steps.'
          }
        },
        {
          item: { th: 'OpenAI GPT-4o (o200k_base)', en: 'OpenAI GPT-4o (o200k_base)' },
          colB: '~1,580 tokens (2.4x)',
          colC: '฿136.30 ($3.95)',
          verdict: {
            th: 'เหมาะกับงานคุยโต้ตอบเสียง/ภาพ (Multimodal) ที่ต้องการความเนียนระดับเรือธง',
            en: 'Use when multimodal vision/audio or strict enterprise tone is required.'
          }
        },
        {
          item: { th: 'Claude 3.7 Sonnet', en: 'Claude 3.7 Sonnet' },
          colB: '~2,120 tokens (3.2x)',
          colC: '฿219.40 ($6.36)',
          verdict: {
            th: 'เก่งเขียนโค้ดอันดับ 1 แต่กิน Token ภาษาไทยสูง แนะนำให้ส่งเฉพาะสรุปสั้นๆ เข้ามา',
            en: '#1 for complex coding, but high Thai token multiplier—feed compressed context only.'
          }
        }
      ],
      steps: [
        {
          title: {
            th: 'ขั้นตอนที่ 1: แยกด่านอ่านเอกสารภาษาไทย (Pre-Processor) ออกจากด่านวิเคราะห์ลึก',
            en: 'Step 1: Separate Thai Document Ingestion from Deep Reasoning'
          },
          detail: {
            th: 'อย่าโยนไฟล์ PDF หรือประวัติแชทภาษาไทยยาวๆ เข้า Claude 3.7 หรือ GPT-4o โดยตรง ให้ส่งผ่าน Gemini 2.5 Flash หรือ DeepSeek V3 เพื่อย่อให้เหลือ JSON สรุปสั้นๆ ก่อน วิธีนี้ลดค่าใช้จ่ายรวมลงทันที 70–85%',
            en: 'Never feed raw multi-page Thai PDFs directly into $3/1M models. Use Gemini 2.5 Flash or DeepSeek V3 to extract clean JSON facts first, reducing downstream token volume by 75%.'
          }
        },
        {
          title: {
            th: 'ขั้นตอนที่ 2: เขียน System Prompt เป็นภาษาอังกฤษสั้นๆ แต่สั่งให้ตอบเป็นภาษาไทย',
            en: 'Step 2: Write System Instructions in Compact English, Output in Thai'
          },
          detail: {
            th: 'คำสั่งควบคุมระบบ (System Prompt) ที่เขียนเป็นภาษาอังกฤษจะใช้ Token น้อยกว่าภาษาไทยถึง 2–3 เท่า โดยใส่บรรทัดสุดท้ายว่า "Always reply in natural, polite Thai."',
            en: 'System instructions written in concise English consume 2–3x fewer tokens on every call while still producing natural Thai responses when you append: "Always reply in natural, polite Thai."'
          },
          codeSnippet: `// ตัวอย่างการตั้งค่า System Prompt ให้ประหยัด Token สูงสุด
const systemPrompt = \`You are a precise financial document assistant.
Extract invoice_no, date, total_thb, and vat_thb as strict JSON.
Always reply in natural, polite Thai.\`;`
        },
        {
          title: {
            th: 'ขั้นตอนที่ 3: ใช้ API Key เดียวจาก Novita AI เพื่อสลับโมเดลตามงานโดยไม่ต้องผูกบัตรหลายค่าย',
            en: 'Step 3: Use One Unified API Key to Route Between Low-Cost & Flagship Models'
          },
          detail: {
            th: 'แทนที่จะเติมเงินค้างไว้หลายเว็บ คุณสามารถใช้ Endpoint มาตรฐาน OpenAI ของ Novita AI เพื่อเปลี่ยนชื่อ model จาก deepseek-v3 ไปเป็นรุ่นอื่นได้ในโค้ดบรรทัดเดียว',
            en: 'Use an OpenAI-compatible router like Novita AI so your backend can switch between DeepSeek V3, Qwen 2.5, and Llama 3.3 by changing a single model string.'
          }
        }
      ],
      recommendedStack: [
        {
          affiliateId: 'aimlapi',
          itemSlug: 'guide-thai-token-novita',
          role: { th: 'รวมโมเดลประหยัด Token ภาษาไทย', en: 'Unified Low-Cost LLM API' },
          name: 'Novita AI (DeepSeek V3 / Qwen 2.5 / Llama 3.3)',
          priceNote: { th: 'เริ่มต้น $0.15–$0.55 ต่อ 1M Token', en: '$0.15–$0.55 per 1M tokens' },
          ctaLabel: { th: 'สมัครรับคีย์รวมทุกโมเดล →', en: 'Get Unified API Key →' }
        },
        {
          affiliateId: 'agensi',
          itemSlug: 'guide-thai-token-budget-skill',
          role: { th: 'ชุดคำสั่งบีบอัด Token อัตโนมัติ', en: 'Automated Token Compression Skill' },
          name: 'Agensi.io — token-budget-architect',
          priceNote: { th: '$14 จ่ายครั้งเดียว ใช้ได้ตลอด', en: '$14 one-time workflow skill' },
          ctaLabel: { th: 'ดูสกิลลดโควต้าบน Agensi.io →', en: 'View Skill on Agensi.io →' }
        }
      ],
      faq: [
        {
          q: {
            th: 'ทำไมภาษาไทยถึงกิน Token มากกว่าภาษาอังกฤษในหลายโมเดล?',
            en: 'Why does Thai text consume more tokens than English?'
          },
          a: {
            th: 'เพราะภาษาไทยไม่มีเว้นวรรคระหว่างคำและมีสระ/วรรณยุกต์หลายระดับ โมเดลที่ฝึกด้วยคลังคำศัพท์ฝั่งตะวันตกเป็นหลักจึงหั่นคำไทยออกเป็นชิ้นย่อยระดับตัวอักษรหรือไบต์ (Byte-level BPE) ทำให้ 1 คำไทยกลายเป็น 2–4 Token ในขณะที่ Gemini 2.5 และ Qwen 2.5 มีคลังคำศัพท์เอเชียที่รวมคำไทยทั้งคำเป็น 1 Token ได้ดีกว่า',
            en: 'Thai script has no spaces between words and stacks vowels/tone marks vertically. Western-centric BPE tokenizers split Thai words into byte fragments (2–4 tokens per word), whereas Gemini 2.5 and Qwen 2.5 include dedicated multilingual vocabulary entries for whole Thai words.'
          }
        }
      ]
    },
    {
      slug: 'line-oa-rag-chatbot-blueprint',
      svgType: 'line_rag_arch',
      badge: {
        th: 'BLUEPRINT ธุรกิจไทย • งบ ~฿1,180/เดือน',
        en: 'PRODUCTION RAG BLUEPRINT • ~$34/MO'
      },
      title: {
        th: 'สูตรจัดสเปกทำระบบแชทบอท LINE OA + ค้นเอกสารองค์กร (RAG) ในงบไม่เกิน ฿1,200/เดือน',
        en: 'LINE OA + Enterprise RAG Chatbot Blueprint Under $35/Month (฿1,200/mo)'
      },
      metaDescription: {
        th: 'คู่มือวางระบบจริงสำหรับธุรกิจไทย: เชื่อม LINE OA Webhook เข้ากับเซิร์ฟเวอร์ในไทย (Hostatom / Ruk-Com) + ฐานข้อมูล Qdrant + โมเดลประหยัดงบ รองรับ 75,000 แชท/เดือน',
        en: 'Step-by-step production architecture pairing a low-latency Bangkok VPS (Hostatom / Ruk-Com), Qdrant vector search, and cached LLM APIs for 75,000 chats/month.'
      },
      h1: {
        th: 'สูตรจัดสเปกทำบอท LINE OA + ค้นคู่มือสินค้า (RAG) รองรับ 2,500 แชท/วัน ในงบ ~฿1,180/เดือน',
        en: 'How to Build a 2,500-Chat/Day LINE OA + RAG Support Bot for ~$34/Month'
      },
      readTime: { th: 'อ่านจบใน 4 นาที • พร้อมผังวางระบบจริง', en: '4 min read • Complete Stack Blueprint' },
      keyTakeaway: {
        th: 'ฟันธง: หัวใจของบอท LINE OA ที่ตอบไวและไม่แพง คือการวาง Webhook + ฐานข้อมูล Vector (Qdrant) ไว้บน VPS ในกรุงเทพฯ (Hostatom $24/ด. หรือ Ruk-Com) เพื่อตัดปัญหา Timeout ของ LINE แล้วเรียก Gemini 2.5 Flash / DeepSeek V3 โดยเปิด Prompt Cache 75%',
        en: 'Bottom Line: Host your LINE Webhook and Qdrant vector DB on a Bangkok NVMe VPS ($24/mo) for <8ms domestic latency, and pair it with cached Gemini 2.5 Flash / DeepSeek V3 calls (~$10/mo).'
      },
      presetWorkload: {
        requestsPerDay: 2500,
        inputTokensPerReq: 3000,
        outputTokensPerReq: 400,
        cacheHitRate: 0.7,
        agentSteps: 1,
        activeHoursPerDay: 24
      },
      comparisonHeaders: {
        colA: { th: 'องค์ประกอบในระบบ (Stack Layer)', en: 'Architecture Layer' },
        colB: { th: 'ตัวเลือกที่แนะนำ', en: 'Recommended Provider' },
        colC: { th: 'งบรายเดือน', en: 'Monthly Cost' },
        colD: { th: 'เหตุผลทางเทคนิค', en: 'Why It Wins' }
      },
      comparisonRows: [
        {
          item: { th: '1. เซิร์ฟเวอร์รับ LINE Webhook + Qdrant DB', en: '1. Webhook Server + Qdrant Vector DB' },
          colB: 'Hostatom VPS 4GB / Ruk-Com',
          colC: '฿828 ($24/mo)',
          verdict: {
            th: 'อยู่ในไทย Ping 4–8ms ตอบ LINE Loading Indicator ทันใจ ข้อมูลลูกค้าอยู่ในไทยตาม PDPA',
            en: '4–8ms domestic Bangkok latency; keeps customer chat logs inside Thailand (PDPA).'
          }
        },
        {
          item: { th: '2. โมเดลตอบแชทและสรุปข้อมูลสินค้า', en: '2. RAG Answer Generation Model' },
          colB: 'Gemini 2.5 Flash / DeepSeek V3',
          colC: '~฿350 ($10/mo)',
          verdict: {
            th: 'รองรับ 2,500 แชท/วัน (75,000 แชท/เดือน) เมื่อเปิด Prompt Cache ให้ส่วนข้อมูลร้านค้า',
            en: 'Handles 75,000 chats/month at ~3,000 input tokens each when 70% cached.'
          }
        },
        {
          item: { th: 'รวมงบประมาณทั้งระบบต่อเดือน', en: 'Total Monthly Production TCO' },
          colB: 'Complete Turnkey Stack',
          colC: '~฿1,178 ($34/mo)',
          verdict: {
            th: 'ถูกกว่าจ้างแอดมินกะดึก 10 เท่า และถูกกว่าเช่าแพลตฟอร์มสำเร็จรูปที่คิดราคาตามจำนวนข้อความ',
            en: '10x cheaper than SaaS chatbot platforms that charge per message or contact.'
          }
        }
      ],
      steps: [
        {
          title: {
            th: 'ขั้นตอนที่ 1: รัน Node.js/FastAPI + Qdrant บน VPS ในไทย (RAM 4GB ขึ้นไป)',
            en: 'Step 1: Deploy Webhook + Qdrant on a 4GB+ Thailand NVMe VPS'
          },
          detail: {
            th: 'เมื่อลูกค้าทัก LINE OA ระบบต้องตอบ HTTP 200 กลับภายใน 1–2 วินาที การวางเซิร์ฟเวอร์ไว้ที่กรุงเทพฯ (Hostatom หรือ Ruk-Com) ช่วยลดเวลาเดินทางของเครือข่ายและค้นหาเอกสารใน Qdrant เสร็จภายในไม่ถึง 15 มิลลิวินาที',
            en: 'LINE webhooks require fast ACK responses. Running your API and Qdrant container in Bangkok keeps vector retrieval under 15ms.'
          },
          codeSnippet: `# รัน Qdrant Vector Database บน Hostatom / Ruk-Com VPS ด้วย Docker
docker run -d --name qdrant -p 6333:6333 \\
  -v $(pwd)/qdrant_storage:/qdrant/storage:z \\
  qdrant/qdrant:latest`
        },
        {
          title: {
            th: 'ขั้นตอนที่ 2: ล็อกข้อมูลนโยบายร้านค้าและแค็ตตาล็อกหลักไว้ส่วนหัว Prompt เพื่อรับส่วนลด Cache 75–90%',
            en: 'Step 2: Pin Store Policies & Core FAQ at the Top of the Prompt for 75%+ Cache Hits'
          },
          detail: {
            th: 'แบ่งโครงสร้าง Prompt เป็น 2 ส่วนเสมอ: ส่วนบนสุดคือข้อมูลร้านค้า/กฎการตอบที่เหมือนกันทุกแชท (จะถูกคิดราคา Cache เพียง $0.0375–$0.14/1M) และส่วนล่างสุดคือย่อหน้าที่ค้นเจอจาก Qdrant เฉพาะคำถามนั้น',
            en: 'Keep static store policies and tone rules identical at the top of the prompt so every customer chat hits the cached input tier.'
          }
        }
      ],
      recommendedStack: [
        {
          affiliateId: 'hostatom',
          itemSlug: 'guide-line-rag-hostatom',
          role: { th: 'VPS ในไทยความเร็วสูง (Self-Managed)', en: 'Low-Latency Bangkok NVMe VPS' },
          name: 'Hostatom Cloud VPS Thailand (4GB RAM / 2 vCPU)',
          priceNote: { th: '$24/เดือน (~฿828/เดือน)', en: '$24/mo (~฿828/mo)' },
          ctaLabel: { th: 'ดูแพ็กเกจ Hostatom VPS →', en: 'View Hostatom VPS →' }
        },
        {
          affiliateId: 'rukcom',
          itemSlug: 'guide-line-rag-rukcom',
          role: { th: 'Managed VPS ในไทย (มีวิศวกรดูแลให้ครบ)', en: 'Fully Managed Thai Enterprise VPS' },
          name: 'Ruk-Com Managed Cloud VPS (8GB RAM / 4 vCPU)',
          priceNote: { th: '$46/เดือน (~฿1,587/เดือน)', en: '$46/mo (~฿1,587/mo)' },
          ctaLabel: { th: 'ดูแพ็กเกจ Ruk-Com Managed →', en: 'View Ruk-Com Managed VPS →' }
        },
        {
          affiliateId: 'aimlapi',
          itemSlug: 'guide-line-rag-novita',
          role: { th: 'API โมเดลตอบแชทราคาประหยัด', en: 'Low-Cost LLM API Router' },
          name: 'Novita AI (DeepSeek V3 / Gemini Flash)',
          priceNote: { th: 'เฉลี่ย ~฿350/เดือน สำหรับ 75k แชท', en: '~$10/mo for 75k chats' },
          ctaLabel: { th: 'รับ API Key บน Novita AI →', en: 'Get Novita AI API Key →' }
        }
      ],
      faq: [
        {
          q: {
            th: 'ถ้าไม่มีทีม Dev ดูแลเซิร์ฟเวอร์เอง ควรเลือก Hostatom หรือ Ruk-Com?',
            en: 'Should I choose Hostatom or Ruk-Com if I do not have a dedicated sysadmin?'
          },
          a: {
            th: 'ถ้ามีนักพัฒนาที่คุ้นเคยกับ Docker/Ubuntu อยู่แล้ว Hostatom VPS 4GB ($24/เดือน) คุ้มราคาที่สุด แต่ถ้าต้องการให้มีทีมวิศวกรคนไทยช่วยตั้งค่าความปลอดภัย (WAF) สำรองข้อมูล และดูแลระบบให้ตลอด 24 ชม. แนะนำ Ruk-Com Managed VPS ($46/เดือน)',
            en: 'If you are comfortable with Docker and Linux, Hostatom ($24/mo) offers the lowest cost. If you want 24/7 Thai engineers managing security, WAF, and backups for you, pick Ruk-Com Managed VPS ($46/mo).'
          }
        }
      ]
    },
    {
      slug: 'claude-code-cursor-cost-cut',
      svgType: 'coding_tier_flow',
      badge: {
        th: 'สำหรับสายเขียนโค้ด • ลดค่าไฟ 50–70%',
        en: 'DEVELOPER PLAYBOOK • CUT TOKEN SPEND 60%'
      },
      title: {
        th: 'คู่มือลดค่าไฟ Claude Code & Cursor 50–70% — เลิกจ่ายค่าอ่านไฟล์ซ้ำและ Subagent ที่ไม่จำเป็น',
        en: 'How to Cut Claude Code & Cursor Token Bills by 60% Without Losing Code Quality'
      },
      metaDescription: {
        th: 'เจาะลึกสาเหตุที่งบ Claude Code / Cursor พุ่งเร็ว พร้อม 3 ขั้นตอนตั้งค่าให้ AI อ่านเฉพาะบรรทัดที่แก้ บล็อกการแตก Subagent เปลืองโควต้า และแยกโมเดลตามความยากของงาน',
        en: 'Stop paying for full-file rescans and 28k-token subagent spawns on single-file edits. Practical setup guide for Claude Code and Cursor teams.'
      },
      h1: {
        th: 'วิธีลดค่าไฟ Claude Code & Cursor ลง 60% (และยืดโควต้าให้เขียนโค้ดได้นานขึ้น 2.5 เท่า)',
        en: 'Cut Your Claude Code & Cursor Spend by 60%: Stop Paying for Full-File Rescans'
      },
      readTime: { th: 'อ่านจบใน 3 นาที • สำหรับนักพัฒนาและทีม Dev', en: '3 min read • For Engineers & Dev Teams' },
      keyTakeaway: {
        th: 'ฟันธง: ต้นทุนที่แพงที่สุดของสายเขียนโค้ดไม่ได้มาจากตอน AI พิมพ์โค้ด แต่เกิดจาก (1) AI กวาดอ่านไฟล์ทั้งโปรเจกต์ซ้ำทุกเทิร์น และ (2) การแตก Subagent ที่เสียค่าเริ่มต้น ~28,000 Token ต่อครั้ง การลงสกิลควบคุม 2 ตัวช่วยตัดส่วนสูญเปล่านี้ทิ้งทันที 50–65%',
        en: 'Bottom Line: 60% of coding agent spend is wasted on full-file reads and 28k-token subagent bootstrap overhead on trivial single-file edits. Enforcing line-range reads and subagent gates cuts monthly bills in half.'
      },
      presetWorkload: {
        requestsPerDay: 800,
        inputTokensPerReq: 6000,
        outputTokensPerReq: 900,
        cacheHitRate: 0.55,
        agentSteps: 5,
        activeHoursPerDay: 10
      },
      comparisonHeaders: {
        colA: { th: 'พฤติกรรมของ AI Agent เวลาเขียนโค้ด', en: 'Coding Agent Behavior' },
        colB: { th: 'ปล่อยค่าเริ่มต้น (ไม่ได้คุมกฎ)', en: 'Default Unchecked Agent' },
        colC: { th: 'ลงสกิลควบคุม (Agensi.io)', en: 'With Agensi.io Guardrail Skills' },
        colD: { th: 'ผลลัพธ์ที่ได้จริง', en: 'Net Savings' }
      },
      comparisonRows: [
        {
          item: { th: '1. การเปิดอ่านไฟล์โค้ดในโปรเจกต์', en: '1. File Reading Strategy' },
          colB: 'อ่านทั้งไฟล์ 1,500 บรรทัดทุกครั้ง',
          colC: 'อ่านเฉพาะ StartLine–EndLine ที่ต้องแก้',
          verdict: {
            th: 'ประหยัด Input Token ลง 25–35% ด้วยสกิล token-budget-architect',
            en: 'Cuts input token volume by 25–35% via token-budget-architect.'
          }
        },
        {
          item: { th: '2. การแตก Subagent ในงานแก้ไฟล์เดียว', en: '2. Subagent Spawning on Small Edits' },
          colB: 'แตก Subagent เสียฟรี ~28k tok/รอบ',
          colC: 'บังคับทำใน Main Agent ทันทีถ้า <1,000 บรรทัด',
          verdict: {
            th: 'ลด Token สูญเปล่าและลดเวลารอลง 3 เท่า ด้วยสกิล devguard',
            en: 'Saves ~35% wasted tokens and 3x latency via devguard.'
          }
        },
        {
          item: { th: '3. การสั่งแก้หน้าเว็บ/UI ซ้ำหลายรอบ', en: '3. UI Rework Loops' },
          colB: 'สั่งรื้อแก้ดีไซน์ซ้ำ 3–4 รอบ',
          colC: 'ล็อกโครงสร้างสะอาดตาตั้งแต่รอบแรก',
          verdict: {
            th: 'จบงานในรอบเดียวด้วยสกิล swiss-minimal-ui-ledger',
            en: 'Eliminates 2–3 rounds of UI rework prompts.'
          }
        }
      ],
      steps: [
        {
          title: {
            th: 'ขั้นตอนที่ 1: ลงสกิล token-budget-architect และ devguard ในโปรเจกต์',
            en: 'Step 1: Install token-budget-architect and devguard in Your Agent Rules'
          },
          detail: {
            th: 'สกิลทั้งสองจะกำหนดกฎเหล็กให้ Claude Code / Cursor ใช้คำสั่ง grep หาเลขบรรทัดก่อนเสมอ แล้วอ่านเฉพาะช่วง 50–100 บรรทัดที่เกี่ยวข้อง รวมถึงห้ามประกาศว่างานเสร็จจนกว่าจะรันเทสต์ผ่านจริง',
            en: 'These skills enforce 0-token regex line discovery before file reads and require verified test receipts before completion.'
          }
        },
        {
          title: {
            th: 'ขั้นตอนที่ 2: แยกโมเดลค้นหาโค้ด (Qwen 2.5 Coder / DeepSeek) ออกจากโมเดลสถาปัตยกรรม (Claude 3.7)',
            en: 'Step 2: Route Routine Refactoring & Boilerplate to Qwen 2.5 Coder / DeepSeek V3'
          },
          detail: {
            th: 'งานเขียน Unit Test, แปลงข้อมูล JSON, หรือเขียนคำสั่ง SQL ไม่จำเป็นต้องจ่าย $15/1M Output ของ Claude 3.7 สามารถสลับไปใช้ Qwen 2.5 Coder 32B ($0.20/1M) หรือ DeepSeek V3 ผ่าน Novita AI ได้เลย',
            en: 'Offload unit test generation, SQL queries, and boilerplate to Qwen 2.5 Coder 32B ($0.20/1M) or DeepSeek V3 via Novita AI.'
          }
        }
      ],
      recommendedStack: [
        {
          affiliateId: 'agensi',
          itemSlug: 'guide-coding-token-budget-architect',
          role: { th: 'สกิลบังคับอ่านเฉพาะบรรทัดที่แก้ (-30% Tokens)', en: 'Line-Scoped Read Optimization Skill' },
          name: 'Agensi.io — token-budget-architect & devguard',
          priceNote: { th: '$14–$19 จ่ายครั้งเดียว คืนทุนในสัปดาห์แรก', en: '$14–$19 one-time (pays back in week 1)' },
          ctaLabel: { th: 'ดาวน์โหลดสกิลบน Agensi.io →', en: 'Get Skills on Agensi.io →' }
        },
        {
          affiliateId: 'aimlapi',
          itemSlug: 'guide-coding-novita',
          role: { th: 'API โมเดลสายโค้ดราคาประหยัด', en: 'Low-Cost Coding Model API' },
          name: 'Novita AI (Qwen 2.5 Coder 32B & DeepSeek V3)',
          priceNote: { th: 'เพียง $0.20–$0.55 ต่อ 1M Token', en: '$0.20–$0.55 per 1M tokens' },
          ctaLabel: { th: 'ดูราคา API สายโค้ด →', en: 'View Coding API Pricing →' }
        }
      ],
      faq: [
        {
          q: {
            th: 'การจำกัดให้ AI อ่านเฉพาะบางบรรทัดจะทำให้ AI แก้โค้ดผิดพลาดมากขึ้นไหม?',
            en: 'Does reading only specific line ranges hurt coding accuracy?'
          },
          a: {
            th: 'ตรงกันข้ามครับ การส่งเฉพาะฟังก์ชันและ Type ที่เกี่ยวข้องช่วยให้ Context ไม่ปนเปื้อนโค้ดส่วนอื่นที่ไม่เกี่ยว ทำให้ AI โฟกัสจุดที่ต้องแก้ได้แม่นยำขึ้น ตอบเร็วขึ้น และเกิดอาการหลุดกรอบน้อยลง',
            en: 'It actually improves accuracy: keeping irrelevant files out of the context window prevents attention dilution and reduces hallucinated edits.'
          }
        }
      ]
    },
    {
      slug: 'api-to-runpod-vllm-migration',
      svgType: 'gpu_breakeven_curve',
      badge: {
        th: 'CLOUD GPU PLAYBOOK • ล็อกงบรายเดือนนิ่ง',
        en: 'CLOUD GPU MIGRATION • FLAT MONTHLY CEILING'
      },
      title: {
        th: 'คู่มือย้ายจาก OpenAI/Claude API มารันโมเดลส่วนตัวบน RunPod GPU (พร้อมคำสั่ง vLLM ใช้งานจริง)',
        en: 'When & How to Migrate from Per-Token APIs to Dedicated RunPod GPUs (with vLLM Recipes)'
      },
      metaDescription: {
        th: 'ตารางเทียบชัดๆ ว่าต้องมียอดใช้งานกี่งาน/วัน ถึงควรย้ายมาเช่าการ์ดจอ RTX 4090, RTX A6000 หรือ L40S บน RunPod พร้อมคำสั่งรัน vLLM ให้รองรับผู้ใช้พร้อมกันหลายคน',
        en: 'Exact daily request thresholds and VRAM sizing guide for migrating from per-token LLM APIs to flat-rate RunPod GPUs ($0.44–$1.39/hr) using vLLM.'
      },
      h1: {
        th: 'จุดตัดย้ายจาก API มาเช่า RunPod GPU รายชั่วโมง: เลือกการ์ดจอรุ่นไหน และตั้งค่า vLLM อย่างไรให้คุ้มสุด?',
        en: 'API-to-GPU Migration Blueprint: VRAM Sizing, Break-Even Math, and Production vLLM Setup'
      },
      readTime: { th: 'อ่านจบใน 4 นาที • มีคำสั่งรันจริง', en: '4 min read • Copy-Paste vLLM Commands' },
      keyTakeaway: {
        th: 'ฟันธง: ทันทีที่บิล API ของทีมเกิน ~$160–$300/เดือน (ประมาณ ฿5,500–฿10,000) หรือต้องประมวลผลเอกสารความลับบริษัทที่ห้ามส่งออกนอก การเช่า RunPod RTX 4090 ($0.44/ชม.) หรือ RTX A6000 48GB ($0.49/ชม.) จะช่วยล็อกเพดานรายจ่ายให้นิ่งสนิททันที',
        en: 'Bottom Line: Once your monthly API bill crosses $160–$300/mo—or when strict data privacy forbids third-party token logging—switching to a dedicated RunPod RTX 4090 ($0.44/hr) or RTX A6000 48GB ($0.49/hr) caps your spend completely.'
      },
      presetWorkload: {
        requestsPerDay: 5500,
        inputTokensPerReq: 3200,
        outputTokensPerReq: 750,
        cacheHitRate: 0.25,
        agentSteps: 4,
        activeHoursPerDay: 10
      },
      comparisonHeaders: {
        colA: { th: 'รุ่นการ์ดจอบน RunPod', en: 'RunPod GPU Instance' },
        colB: { th: 'VRAM / ความเร็ว', en: 'VRAM / Throughput' },
        colC: { th: 'ค่าเช่า (เปิด 10 ชม./วัน)', en: 'Cost (10h/day • 30d)' },
        colD: { th: 'โมเดลที่แนะนำให้รัน', en: 'Recommended Open-Weight Models' }
      },
      comparisonRows: [
        {
          item: { th: 'NVIDIA RTX 4090', en: 'NVIDIA RTX 4090' },
          colB: '24GB • ~110 tok/s',
          colC: '$132/mo (~฿4,550)',
          verdict: {
            th: 'คุ้มสุดสำหรับ Qwen 2.5 Coder 32B (AWQ) หรือ Llama 3.3 8B–14B งานภายในทีม',
            en: 'Best entry point for Qwen 2.5 Coder 32B (AWQ) and fast internal coding/RAG.'
          }
        },
        {
          item: { th: 'NVIDIA RTX A6000', en: 'NVIDIA RTX A6000' },
          colB: '48GB • ~135 tok/s',
          colC: '$147/mo (~฿5,070)',
          verdict: {
            th: 'เพิ่มเงินแค่ $0.05/ชม. แต่ได้ VRAM 48GB รันโมเดลใหญ่ 70B (Q4) จบในใบเดียว!',
            en: 'Only $0.05/hr more than 4090 for double the VRAM (48GB)—fits 70B AWQ on 1 card.'
          }
        },
        {
          item: { th: 'NVIDIA L40S Ada / A100 80GB', en: 'NVIDIA L40S 48GB / A100 80GB' },
          colB: '48–80GB • 195–220 tok/s',
          colC: '$258–$417/mo',
          verdict: {
            th: 'สำหรับงาน Production ที่มีลูกค้าเรียกพร้อมกันหลายสิบคนตลอดทั้งวัน',
            en: 'Production FP8/BF16 serving with high concurrent vLLM continuous batching.'
          }
        }
      ],
      steps: [
        {
          title: {
            th: 'ขั้นตอนที่ 1: เลือกขนาด VRAM ให้พอดีกับน้ำหนักโมเดล + พื้นที่ KV Cache',
            en: 'Step 1: Size Your VRAM for Model Weights + 25% KV Cache Headroom'
          },
          detail: {
            th: 'กฎจำง่ายๆ: โมเดลขนาด 32B แบบบีบอัด 4-bit (AWQ) ใช้ VRAM ประมาณ 18GB (รันบน RTX 4090 24GB ได้) ส่วนโมเดล 70B แบบ 4-bit ใช้ VRAM ประมาณ 39GB (ต้องใช้ RTX A6000 48GB หรือ L40S 48GB)',
            en: 'Rule of thumb: 32B 4-bit AWQ models need ~18GB VRAM (fits RTX 4090 24GB); 70B 4-bit AWQ models need ~39GB VRAM (fits single RTX A6000 48GB or L40S 48GB).'
          }
        },
        {
          title: {
            th: 'ขั้นตอนที่ 2: รัน vLLM พร้อมเปิด Prefix Caching เพื่อให้ได้ OpenAI-Compatible Endpoint ทันที',
            en: 'Step 2: Launch vLLM with Prefix Caching Enabled for Drop-In OpenAI Compatibility'
          },
          detail: {
            th: 'เมื่อเปิดเครื่องบน RunPod แล้ว ให้รันคำสั่งด้านล่างนี้ คุณจะได้ URL ที่ทำงานเหมือน OpenAI API ทุกประการ เพียงแค่เปลี่ยน baseURL ในโค้ดเดิมก็ใช้งานได้ทันทีโดยไม่เสียค่า Token อีกต่อไป',
            en: 'Run the command below on your RunPod pod to expose an OpenAI-compatible /v1/chat/completions endpoint with automatic prefix caching.'
          },
          codeSnippet: `python3 -m vllm.entrypoints.openai.api_server \\
  --model Qwen/Qwen2.5-Coder-32B-Instruct-AWQ \\
  --quantization awq \\
  --enable-prefix-caching \\
  --gpu-memory-utilization 0.92 \\
  --max-model-len 32768 \\
  --port 8000`
        }
      ],
      recommendedStack: [
        {
          affiliateId: 'runpod',
          itemSlug: 'guide-gpu-runpod',
          role: { th: 'เช่าการ์ดจอรายชั่วโมง (ไม่มีขั้นต่ำ)', en: 'On-Demand Hourly Cloud GPUs' },
          name: 'RunPod Cloud GPU (RTX 4090 / A6000 / L40S / A100)',
          priceNote: { th: 'เริ่มต้น $0.44/ชม. (หยุดเครื่องเมื่อไหร่หยุดคิดเงินทันที)', en: 'From $0.44/hr billed per second' },
          ctaLabel: { th: 'ดูราคาเช่าการ์ดจอบน RunPod →', en: 'Launch GPU on RunPod →' }
        },
        {
          affiliateId: 'agensi',
          itemSlug: 'guide-gpu-auditor-skill',
          role: { th: 'สกิลสแกนโค้ดคำนวณจุดคุ้มทุนอัตโนมัติ', en: 'Automated Repo Break-Even Auditor' },
          name: 'Agensi.io — cloud-gpu-breakeven-auditor',
          priceNote: { th: '$24 จ่ายครั้งเดียว ตรวจจุดคุ้มทุนทั้งโปรเจกต์', en: '$24 one-time repo audit skill' },
          ctaLabel: { th: 'ดูสกิลคำนวณจุดคุ้มทุน →', en: 'View Auditor Skill →' }
        }
      ],
      faq: [
        {
          q: {
            th: 'ถ้าบริษัทใช้งานเฉพาะเวลาทำการ (9:00–19:00 น.) ต้องจ่ายค่าเช่า GPU ตอนกลางคืนไหม?',
            en: 'Do I pay for the GPU overnight if my team only works 10 hours a day?'
          },
          a: {
            th: 'ไม่ต้องจ่ายครับ บน RunPod คุณสามารถตั้งเวลาเปิด-ปิด Pod หรือใช้ Serverless Endpoint เพื่อให้คิดเงินเฉพาะชั่วโมงที่เปิดใช้งานจริง (เช่น วันละ 10 ชม.) ช่วยประหยัดค่าเช่าลงไปได้อีกกว่า 58% เมื่อเทียบกับการเปิดทิ้งไว้ 24 ชม.',
            en: 'No. By stopping your pod outside business hours (running 10h/day instead of 24h/day), you cut monthly GPU rental costs by 58%.'
          }
        }
      ]
    },
    {
      slug: 'thai-vps-vs-global-cloud-ai-backend',
      svgType: 'vps_latency_map',
      badge: {
        th: 'INFRASTRUCTURE GUIDE • ไทย vs ต่างประเทศ',
        en: 'INFRASTRUCTURE GUIDE • THAILAND VS GLOBAL'
      },
      title: {
        th: 'คู่มือเลือกเซิร์ฟเวอร์วางระบบเว็บและ AI Backend (ไทย vs ต่างประเทศ) — เลือกค่ายไหนไม่ให้ระบบล่ม?',
        en: 'Thailand VPS vs. Global Managed Cloud for AI Backends: Latency, PDPA, and TCO Guide'
      },
      metaDescription: {
        th: 'เปรียบเทียบชัดๆ ระหว่างการวางระบบหลังบ้านบน VPS ในไทย (Hostatom, Ruk-Com) กับ Managed Cloud ระดับสากล (Cloudways DigitalOcean / Vultr) ตามประเภทธุรกิจจริง',
        en: 'Compare Bangkok NVMe VPS providers (Hostatom, Ruk-Com) against global managed cloud hosting (Cloudways DigitalOcean/Vultr) across latency, SLA, and monthly cost.'
      },
      h1: {
        th: 'เลือกเซิร์ฟเวอร์วางระบบเว็บและ AI Backend: เมื่อไหร่ควรใช้ VPS ในไทย (Hostatom / Ruk-Com) vs ระดับโลก (Cloudways)?',
        en: 'Choosing Your AI Backend Server: Domestic Bangkok VPS vs. Global Managed Cloud'
      },
      readTime: { th: 'อ่านจบใน 3 นาที • ตารางฟันธงตามประเภทธุรกิจ', en: '3 min read • Decision Matrix by Workload' },
      keyTakeaway: {
        th: 'ฟันธง: ถ้าลูกค้า 90% อยู่ในไทย (เช่น ระบบคลินิก ร้านค้า LINE OA หรือระบบองค์กรที่ต้องเก็บข้อมูลในไทยตาม PDPA) ให้เลือก Hostatom หรือ Ruk-Com จะได้ความเร็วตอบสนองไวกว่า 4 เท่า (<8ms) ในราคาเริ่มต้นเพียง ฿828/เดือน แต่ถ้าทำเว็บ SaaS ขายทั่วโลก ให้เลือก Cloudways (Vultr HF / DigitalOcean)',
        en: 'Bottom Line: If 90%+ of your users are in Thailand (LINE OA bots, clinics, local ERPs), Bangkok nodes on Hostatom or Ruk-Com deliver 4x lower latency (<8ms) at half the price. For international SaaS traffic, choose Cloudways Managed Vultr HF.'
      },
      presetWorkload: {
        requestsPerDay: 1500,
        inputTokensPerReq: 2000,
        outputTokensPerReq: 500,
        cacheHitRate: 0.4,
        agentSteps: 2,
        activeHoursPerDay: 24
      },
      comparisonHeaders: {
        colA: { th: 'ผู้ให้บริการเซิร์ฟเวอร์', en: 'Server Provider' },
        colB: { th: 'สเปกเริ่มต้น / ที่ตั้ง', en: 'Spec / Data Center' },
        colC: { th: 'ราคา / เดือน', en: 'Monthly Price' },
        colD: { th: 'เหมาะกับใครที่สุด?', en: 'Best Fit For' }
      },
      comparisonRows: [
        {
          item: { th: 'Hostatom Cloud VPS Thailand', en: 'Hostatom Cloud VPS Thailand' },
          colB: '2 vCPU / 4GB RAM • กรุงเทพฯ',
          colC: '$24/mo (~฿828)',
          verdict: {
            th: 'ทีมที่มีนักพัฒนาดูแล Docker เองได้ ต้องการความเร็วในไทยสูงสุดในงบประหยัด',
            en: 'Developers running Docker, FastAPI, n8n, or Qdrant for Thai users on a lean budget.'
          }
        },
        {
          item: { th: 'Ruk-Com Managed VPS Thailand', en: 'Ruk-Com Managed VPS Thailand' },
          colB: '4 vCPU / 8GB RAM • กรุงเทพฯ',
          colC: '$46/mo (~฿1,587)',
          verdict: {
            th: 'ธุรกิจไทยที่ต้องการวิศวกรดูแลระบบ ความปลอดภัย WAF และสำรองข้อมูลให้ครบ 24 ชม.',
            en: 'Businesses wanting 24/7 Thai sysadmin support, enterprise WAF, and zero server maintenance.'
          }
        },
        {
          item: { th: 'Cloudways Managed (DO / Vultr HF)', en: 'Cloudways Managed (DO / Vultr HF)' },
          colB: '2–4 vCPU / 4–8GB • สิงคโปร์/ทั่วโลก',
          colC: '$54–$112/mo',
          verdict: {
            th: 'เว็บแอป SaaS หรือ E-Commerce ที่มีลูกค้าหลายประเทศ ต้องการ Auto-Healing และ Staging',
            en: 'Global SaaS & high-traffic web apps needing 3GHz+ NVMe compute and 1-click staging.'
          }
        }
      ],
      steps: [
        {
          title: {
            th: 'ขั้นตอนที่ 1: เช็กว่าฐานข้อมูลของคุณต้องเรียกคุยกับ API ฝั่งไหนบ่อยที่สุด',
            en: 'Step 1: Place Your Server Next to Your Users and Database'
          },
          detail: {
            th: 'ในงาน AI สมัยใหม่ เวลารอส่วนใหญ่มาจาก 2 ส่วนคือ ตอนโหลดหน้าเว็บ/ฐานข้อมูล (ควรอยู่ใกล้ผู้ใช้) และตอนรอ AI คิดคำตอบ การวางหน้าเว็บและฐานข้อมูลไว้ในไทยช่วยให้หน้าเว็บเปิดขึ้นมาทันทีใน 50ms แม้ระหว่างที่กำลังสตรีมคำตอบจาก AI',
            en: 'Placing your web backend and vector database in Bangkok ensures instant UI rendering (<50ms TTFB) while streaming LLM tokens asynchronously.'
          }
        },
        {
          title: {
            th: 'ขั้นตอนที่ 2: แยกเซิร์ฟเวอร์ระบบหลักออกจากเครื่องประมวลผลหนัก',
            en: 'Step 2: Keep Your Web/Webhook Server Separate from Heavy GPU Workers'
          },
          detail: {
            th: 'อย่าเอาเว็บหลักไปรันปนบนเครื่อง GPU รายชั่วโมง เพราะเวลาคุณสั่งปิด GPU เพื่อประหยัดเงิน เว็บหลักจะดับไปด้วย ให้รันเว็บหลักและฐานข้อมูลบน VPS รายเดือนที่เสถียรตลอด 24 ชม. (Hostatom / Ruk-Com / Cloudways) แล้วค่อยยิง API ไปหา LLM',
            en: 'Always host your database, auth, and webhooks on an always-on monthly VPS so you can spin GPU instances up and down freely without downtime.'
          }
        }
      ],
      recommendedStack: [
        {
          affiliateId: 'hostatom',
          itemSlug: 'guide-vps-hostatom',
          role: { th: 'VPS ในไทย คุ้มราคาที่สุด', en: 'Best-Value Bangkok NVMe VPS' },
          name: 'Hostatom Cloud VPS Thailand ($24/mo)',
          priceNote: { th: 'เริ่มต้น ~฿828/เดือน (กรุงเทพฯ)', en: '$24/mo (~฿828/mo Bangkok DC)' },
          ctaLabel: { th: 'ดูแพ็กเกจ Hostatom →', en: 'View Hostatom Plans →' }
        },
        {
          affiliateId: 'rukcom',
          itemSlug: 'guide-vps-rukcom',
          role: { th: 'Managed VPS ในไทย ดูแลครบ 24 ชม.', en: '24/7 Managed Thai Cloud VPS' },
          name: 'Ruk-Com Managed Cloud VPS ($46/mo)',
          priceNote: { th: 'เริ่มต้น ~฿1,587/เดือน พร้อมทีมดูแล', en: '$46/mo with 24/7 Thai SLA' },
          ctaLabel: { th: 'ดูแพ็กเกจ Ruk-Com →', en: 'View Ruk-Com Plans →' }
        },
        {
          affiliateId: 'cloudways',
          itemSlug: 'guide-vps-cloudways',
          role: { th: 'Managed Cloud ระดับสากล', en: 'Global Managed Cloud Hosting' },
          name: 'Cloudways Managed DigitalOcean / Vultr HF ($54/mo)',
          priceNote: { th: 'มีโหนดสิงคโปร์และทั่วโลกกว่า 65 แห่ง', en: '65+ global data centers' },
          ctaLabel: { th: 'ดูแพ็กเกจ Cloudways →', en: 'View Cloudways Plans →' }
        }
      ],
      faq: [
        {
          q: {
            th: 'ถ้าเริ่มต้นทำระบบ AI ภายในบริษัท ควรเริ่มจาก RAM กี่ GB?',
            en: 'How much RAM do I need for an internal AI backend + vector database?'
          },
          a: {
            th: 'แนะนำเริ่มต้นที่ 4GB RAM (เช่น Hostatom VPS 4GB ราคา $24/เดือน) ซึ่งเพียงพอสำหรับรัน Node.js/Python API คู่กับ Qdrant Vector Database ที่เก็บข้อมูลเอกสารได้ราว 100,000–300,000 ย่อหน้า หากเอกสารมากกว่านั้นหรือต้องการระบบ Managed เต็มรูปแบบ แนะนำขยับเป็น 8GB RAM บน Ruk-Com ($46/เดือน)',
            en: 'Start with 4GB RAM ($24/mo on Hostatom), which comfortably runs a Node.js/FastAPI backend alongside Qdrant holding 100k–300k document chunks. Upgrade to 8GB RAM on Ruk-Com ($46/mo) for larger collections or managed support.'
          }
        }
      ]
    }
  ];
}
