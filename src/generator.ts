import fs from 'node:fs';
import path from 'node:path';
import {
  calculateCostComparison,
  resolveAffiliateUrl,
  sanitizeIndexNowKey,
  sanitizeWorkloadInput
} from './calculator.ts';
import {
  type AffiliateConfigFile,
  AGENT_SKILLS_CATALOG,
  CLOUD_GPUS,
  CLOUD_VPS_OPTIONS,
  LLM_MODELS,
  type Locale,
  type ProgrammaticComparisonPageSpec,
  type WorkloadInput
} from './domain.ts';
import { buildProgrammaticPagesCatalog } from './pages-catalog.ts';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderSharedStyles(): string {
  return `
    :root {
      --paper: #FBFBFD;
      --surface: #FFFFFF;
      --surface-alt: #F5F5F7;
      --ink: #1D1D1F;
      --ink-secondary: #515154;
      --ink-muted: #86868B;
      --line: rgba(0, 0, 0, 0.08);
      --line-strong: rgba(0, 0, 0, 0.14);
      --accent: #0066CC;
      --ledger-green: #1D7D3F;
      --mono: "SF Mono", "JetBrains Mono", "Menlo", monospace;
      --sans: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", "Noto Sans Thai", sans-serif;
      --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: var(--sans);
      background: var(--paper);
      color: var(--ink);
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    a { color: var(--accent); text-decoration: none; transition: opacity 0.2s var(--ease-out); }
    a:hover { opacity: 0.78; }
    @keyframes settleIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .nav-glass {
      position: sticky;
      top: 0;
      z-index: 40;
      background: rgba(251, 251, 253, 0.8);
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      border-bottom: 1px solid var(--line);
    }
    .masthead {
      max-width: 1160px;
      margin: 0 auto;
      padding: 0 24px;
      height: 52px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
    }
    .brand-mark {
      font-weight: 600;
      color: var(--ink);
      letter-spacing: -0.01em;
      font-size: 0.9rem;
    }
    .nav-bar {
      display: flex;
      gap: 22px;
      align-items: center;
    }
    .nav-link {
      color: var(--ink-secondary);
      font-size: 0.78rem;
      transition: color 0.2s var(--ease-out);
    }
    .nav-link:hover, .nav-link.active {
      color: var(--ink);
      font-weight: 500;
      opacity: 1;
    }
    .shell {
      max-width: 1160px;
      margin: 0 auto;
      padding: 0 24px 96px;
      animation: settleIn 0.55s var(--ease-out) both;
    }
    .hero-block {
      padding: 56px 0 36px;
    }
    .kicker {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--ink-muted);
      margin-bottom: 10px;
    }
    h1 {
      font-size: clamp(2rem, 3.8vw, 3.1rem);
      font-weight: 600;
      letter-spacing: -0.032em;
      line-height: 1.1;
      margin: 0 0 16px;
      max-width: 24ch;
      color: var(--ink);
    }
    .lead {
      color: var(--ink-secondary);
      font-size: 1.08rem;
      line-height: 1.6;
      max-width: 64ch;
      margin: 0;
      font-weight: 400;
    }
    .benefit-trio {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 28px;
    }
    @media (max-width: 860px) {
      .benefit-trio { grid-template-columns: 1fr; }
    }
    .benefit-tile {
      background: var(--surface-alt);
      border-radius: 18px;
      padding: 22px 24px;
      transition: transform 0.35s var(--ease-out), background 0.35s var(--ease-out);
    }
    .benefit-tile:hover {
      transform: translateY(-2px);
    }
    .benefit-title {
      font-size: 0.94rem;
      font-weight: 600;
      color: var(--ink);
      margin: 0 0 6px;
      letter-spacing: -0.01em;
    }
    .benefit-desc {
      font-size: 0.84rem;
      color: var(--ink-secondary);
      margin: 0;
      line-height: 1.5;
    }
    .ledger-frame {
      display: grid;
      grid-template-columns: 370px 1fr;
      gap: 24px;
      margin-top: 28px;
      align-items: start;
    }
    @media (max-width: 940px) {
      .ledger-frame { grid-template-columns: 1fr; }
    }
    .panel-left {
      position: sticky;
      top: 72px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 20px;
      padding: 26px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.03);
    }
    @media (max-width: 940px) {
      .panel-left { position: static; }
    }
    .panel-right {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .section-tag {
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--ink-muted);
      padding-bottom: 12px;
      border-bottom: 1px solid var(--line);
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .preset-strip {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      background: var(--surface-alt);
      padding: 4px;
      border-radius: 12px;
      margin-bottom: 22px;
    }
    .preset-btn {
      background: transparent;
      border: none;
      border-radius: 9px;
      padding: 8px 6px;
      font-family: var(--sans);
      font-size: 0.74rem;
      font-weight: 500;
      color: var(--ink-secondary);
      cursor: pointer;
      transition: background 0.25s var(--ease-out), color 0.25s var(--ease-out), box-shadow 0.25s var(--ease-out);
    }
    .preset-btn:hover {
      background: var(--surface);
      color: var(--ink);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
    .field-row {
      margin-bottom: 18px;
    }
    .field-top {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 8px;
      gap: 8px;
    }
    .field-label {
      font-size: 0.84rem;
      font-weight: 500;
      color: var(--ink);
    }
    .field-readout {
      font-family: var(--mono);
      font-size: 0.84rem;
      font-weight: 600;
      color: var(--ink);
      font-variant-numeric: tabular-nums;
      background: var(--surface-alt);
      padding: 3px 9px;
      border-radius: 8px;
    }
    input[type="range"] {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 4px;
      background: #E5E5EA;
      border-radius: 999px;
      outline: none;
      cursor: pointer;
    }
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--surface);
      border: 1px solid rgba(0, 0, 0, 0.12);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      transition: transform 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out);
    }
    input[type="range"]::-webkit-slider-thumb:hover {
      transform: scale(1.08);
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
    }
    .verdict-cell {
      padding: 28px 30px;
      border-radius: 20px;
      background: var(--surface);
      border: 1px solid var(--line);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.03);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }
    .verdict-meta { max-width: 60ch; }
    .verdict-title {
      font-size: 1.45rem;
      font-weight: 600;
      letter-spacing: -0.025em;
      margin: 4px 0 8px;
      font-variant-numeric: tabular-nums;
      color: var(--ink);
    }
    .verdict-copy {
      font-size: 0.92rem;
      color: var(--ink-secondary);
      margin: 0;
      line-height: 1.55;
    }
    .btn-primary {
      display: inline-block;
      background: var(--ink);
      color: var(--surface);
      font-size: 0.84rem;
      font-weight: 500;
      padding: 12px 22px;
      border-radius: 999px;
      border: none;
      cursor: pointer;
      white-space: nowrap;
      transition: transform 0.25s var(--ease-out), background 0.25s var(--ease-out), opacity 0.25s var(--ease-out);
    }
    .btn-primary:hover {
      background: #333336;
      color: #fff;
      transform: scale(1.015);
      opacity: 1;
    }
    .btn-outline {
      width: 100%;
      background: var(--surface-alt);
      color: var(--ink);
      font-size: 0.82rem;
      font-weight: 500;
      padding: 11px 16px;
      border-radius: 12px;
      border: 1px solid transparent;
      cursor: pointer;
      transition: background 0.2s var(--ease-out);
    }
    .btn-outline:hover {
      background: #E8E8ED;
    }
    .table-block {
      padding: 26px 28px;
      border-radius: 20px;
      background: var(--surface);
      border: 1px solid var(--line);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
      font-variant-numeric: tabular-nums;
    }
    th {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--ink-muted);
      text-align: left;
      padding: 8px 10px 10px 0;
      border-bottom: 1px solid var(--line-strong);
      font-weight: 600;
    }
    th.num, td.num { text-align: right; }
    td {
      padding: 14px 10px 14px 0;
      border-bottom: 1px solid var(--line);
      vertical-align: middle;
    }
    tr:last-child td { border-bottom: none; }
    .mono-val {
      font-family: var(--mono);
      font-weight: 600;
      color: var(--ink);
    }
    .savings-val {
      font-family: var(--mono);
      font-weight: 600;
      color: var(--ledger-green);
    }
    .sub-val {
      font-size: 0.78rem;
      color: var(--ink-secondary);
      display: block;
      margin-top: 2px;
    }
    .bar-track {
      width: 100%;
      max-width: 140px;
      height: 4px;
      background: var(--surface-alt);
      border-radius: 999px;
      margin-top: 6px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      background: var(--ink);
      border-radius: 999px;
      transition: width 0.45s var(--ease-out);
    }
    .action-link {
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--accent);
      white-space: nowrap;
    }
    .standalone-section {
      margin-top: 24px;
      border-radius: 20px;
      border: 1px solid var(--line);
      background: var(--surface);
      padding: 26px 28px;
    }
    .index-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
      gap: 10px;
      margin-top: 14px;
    }
    .index-cell {
      padding: 12px 14px;
      border-radius: 12px;
      background: var(--surface-alt);
      font-size: 0.82rem;
      color: var(--ink);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      transition: background 0.2s var(--ease-out), transform 0.2s var(--ease-out);
    }
    .index-cell:hover {
      background: #E8E8ED;
      transform: translateY(-1px);
      opacity: 1;
    }
  `;
}

function selectRelatedSpecs(
  currentSlug: string,
  allPages: ProgrammaticComparisonPageSpec[],
  isHomeHub: boolean
): ProgrammaticComparisonPageSpec[] {
  if (isHomeHub) {
    return allPages;
  }
  const current = allPages.find((p) => p.slug === currentSlug);
  if (!current) {
    return allPages.slice(0, 6);
  }
  const sameCategory = allPages.filter(
    (p) =>
      p.slug !== currentSlug &&
      (p.category === current.category ||
        (current.primaryModelId && p.primaryModelId === current.primaryModelId))
  );
  return sameCategory.slice(0, 6);
}

function renderCalculatorPage(
  locale: Locale,
  pageSlug: string,
  title: string,
  metaDescription: string,
  h1: string,
  presetInput: Partial<WorkloadInput>,
  faqList: Array<{ q: { en: string; th: string }; a: { en: string; th: string } }>,
  allPages: ProgrammaticComparisonPageSpec[],
  affiliateConfig: AffiliateConfigFile,
  isComparisonSubpage: boolean,
  publicBaseUrl: string
): string {
  const initialWorkload = sanitizeWorkloadInput(presetInput);
  const initialCalc = calculateCostComparison(initialWorkload, affiliateConfig, pageSlug);
  const rootPrefix = isComparisonSubpage ? '../..' : '..';
  const alternateLang: Locale = locale === 'en' ? 'th' : 'en';
  const alternatePath = isComparisonSubpage
    ? `${rootPrefix}/${alternateLang}/compare/${pageSlug}.html`
    : `${rootPrefix}/${alternateLang}/index.html`;

  const relatedPages = selectRelatedSpecs(pageSlug, allPages, !isComparisonSubpage);
  const maxInitialApiUsd = Math.max(...initialCalc.apiOptions.map((a) => a.monthlyUsd), 1);

  const flagshipInitial =
    initialCalc.apiOptions.find((a) => a.modelId === 'claude-3-7-sonnet') ??
    initialCalc.apiOptions[initialCalc.apiOptions.length - 1];

  const labels =
    locale === 'th'
      ? {
          kicker: 'TCO // BENCHMARK.26 — เครื่องมือช่วยวางแผนงบ AI ตามการใช้งานจริง',
          subtitle:
            'เทียบให้เห็นชัดๆ ว่างานของคุณควรจ่ายเป็นครั้งตามที่ใช้จริง หรือเช่าเหมาชั่วโมงถึงจะประหยัดที่สุด พร้อมวิธีตั้งค่าให้ใช้งานได้นานขึ้นโดยโควต้าไม่หมดไว และรวมบิลจ่ายที่เดียวจบ',
          b1Title: 'จ่ายที่เดียวจบ ไม่ต้องแยกหลายบิล',
          b1Desc:
            'เช่น แทนที่จะต้องผูกบัตรเติมเงินแยกทั้ง OpenAI, Claude และ Gemini คุณสามารถใช้คีย์เดียวสลับโมเดลตามความยากของงานได้เลย',
          b2Title: 'ทำงานได้นานขึ้นในงบเท่าเดิม',
          b2Desc:
            'เช่น เวลาสั่งแก้โค้ดหรือสรุปเอกสาร หากเปิดใช้ระบบจำข้อความซ้ำ (Cache) และตั้งค่าให้อ่านเฉพาะจุดสำคัญ จะยืดโควต้าใช้งานได้เกือบเท่าตัว',
          b3Title: 'รู้เพดานรายจ่าย ไม่มีบิลช็อกสิ้นเดือน',
          b3Desc:
            'เมื่อทีมเริ่มใช้งานหนักขึ้น ตารางจะบอกจุดตัดทันทีว่าต้องมีงานกี่ครั้งต่อวัน การเปลี่ยนไปเช่าเครื่องรายชั่วโมงถึงจะถูกกว่า',
          workloadTag: 'ปรับตามลักษณะงานจริงของคุณ',
          presetStartup: 'งานทั่วไป / ทีมเล็ก',
          presetAgent: 'สั่งงานต่อเนื่องหลายขั้นตอน',
          presetHigh: 'เปิดระบบบริการลูกค้าทั้งวัน',
          reqLabel: 'จำนวนงานที่สั่งต่อวัน (ครั้ง/วัน)',
          agentLabel: 'ความซับซ้อน (AI ต้องคิดกี่รอบต่อ 1 งาน)',
          inTokLabel: 'ปริมาณข้อมูลที่ส่งเข้าไปต่อรอบ (Input Tokens)',
          outTokLabel: 'ความยาวคำตอบที่ได้รับต่อรอบ (Output Tokens)',
          cacheLabel: 'สัดส่วนข้อมูลเดิมที่ใช้ซ้ำได้ (Prompt Cache %)',
          hoursLabel: 'จำนวนชั่วโมงที่ต้องเปิดระบบต่อวัน',
          shareBtn: 'คัดลอกลิงก์ผลคำนวณนี้ไว้ส่งต่อ',
          winnerTag: 'ทางเลือกที่ประหยัดและสะดวกที่สุดสำหรับคุณ',
          apiTableTag: '1. แบบจ่ายตามที่ใช้จริง (รวมทุกโมเดลในบิลเดียว ไม่ต้องดูแลเครื่อง)',
          gpuTableTag: '2. แบบเช่าเครื่องส่วนตัวรายชั่วโมง (เหมาะกับงานหนัก คุมงบรายเดือนนิ่ง)',
          vpsTableTag: '3. เซิร์ฟเวอร์สำหรับรันหน้าเว็บและระบบหลังบ้าน (มีทีมดูแลให้ครบ)',
          skillsTableTag: '4. ชุดคำสั่งเสริมช่วยให้ AI ประหยัดโควต้าและทำงานจบไวขึ้น (Agensi.io)',
          colModel: 'ตัวเลือก / ประโยชน์ที่ได้รับจริง',
          colMonthly: 'ค่าใช้จ่าย / เดือน',
          colMetric: 'ความคุ้มค่า / จุดตัด',
          colAction: 'รายละเอียด',
          ctaTryApi: 'ดูวิธีรวมบิลที่เดียว',
          ctaRentGpu: 'ดูสเปกเครื่องเช่า',
          ctaHostVps: 'ดูแพ็กเกจเซิร์ฟเวอร์',
          ctaSkill: 'ดูชุดคำสั่งลดโควต้า',
          faqTag: 'คำถามจากการใช้งานจริง',
          directoryTag: isComparisonSubpage
            ? 'เปรียบเทียบเคสอื่นๆ ที่ใกล้เคียงกัน'
            : `รวมหน้าคำนวณแยกตามรูปแบบงานจริง (${allPages.length} รูปแบบ)`
        }
      : {
          kicker: 'TCO // BENCHMARK.26 — PRACTICAL AI COST & QUOTA PLANNER',
          subtitle:
            'See clearly whether pay-as-you-go API billing or hourly dedicated rental costs less for your daily workload—plus practical ways to stretch your quota further and consolidate billing in one place.',
          b1Title: 'One-Stop Billing, Zero Juggling',
          b1Desc:
            'Real example: Instead of maintaining separate credit balances across OpenAI, Anthropic, and Google, route routine tasks to low-cost models and hard tasks to flagship models from a single account.',
          b2Title: 'Work Longer Without Hitting Limits',
          b2Desc:
            'Real example: Reusing cached context and guiding coding agents to read only changed lines stretches your daily token budget significantly further.',
          b3Title: 'Predictable Monthly Ceiling',
          b3Desc:
            'See the exact daily volume where switching from per-token billing to a flat hourly GPU caps your monthly bill with zero surprise overages.',
          workloadTag: 'Match Your Daily Usage',
          presetStartup: 'Solo / Small Team',
          presetAgent: 'Multi-Step Workflows',
          presetHigh: 'All-Day Production',
          reqLabel: 'Tasks per Day',
          agentLabel: 'Steps AI Runs per Task',
          inTokLabel: 'Input Context per Step (Tokens)',
          outTokLabel: 'Output Length per Step (Tokens)',
          cacheLabel: 'Repeated Context Reuse (Cache %)',
          hoursLabel: 'Active System Hours per Day',
          shareBtn: 'Copy Shareable Link for This Scenario',
          winnerTag: 'Most Cost-Effective Choice for Your Workload',
          apiTableTag: '1. Pay-As-You-Go APIs (One-Stop Billing, Zero Maintenance)',
          gpuTableTag: '2. Dedicated Hourly GPUs (Fixed Ceiling for Heavy Workloads)',
          vpsTableTag: '3. Managed Cloud Servers for Web & Backend Systems',
          skillsTableTag: '4. Ready-to-Use Agent Workflows to Stretch Token Quota (Agensi.io)',
          colModel: 'Option / Practical Benefit',
          colMonthly: 'Monthly Cost',
          colMetric: 'Efficiency / Break-Even',
          colAction: 'Details',
          ctaTryApi: 'View Single-Bill Option',
          ctaRentGpu: 'View Hourly GPU',
          ctaHostVps: 'View Managed Server',
          ctaSkill: 'View Workflow Skill',
          faqTag: 'Practical Questions & Examples',
          directoryTag: isComparisonSubpage
            ? 'Related Workload Comparisons'
            : `All Workload & Model Calculators (${allPages.length})`
        };

  const canonicalUrl = isComparisonSubpage
    ? `${publicBaseUrl}/${locale}/compare/${pageSlug}.html`
    : `${publicBaseUrl}/${locale}/index.html`;

  const graphEntities: Array<Record<string, unknown>> = [
    {
      '@type': 'SoftwareApplication',
      name: title,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: canonicalUrl,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description: metaDescription
    }
  ];

  if (faqList.length > 0) {
    graphEntities.push({
      '@type': 'FAQPage',
      mainEntity: faqList.map((item) => ({
        '@type': 'Question',
        name: item.q[locale],
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a[locale]
        }
      }))
    });
  }

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graphEntities
  });

  const gscMeta = affiliateConfig.googleSiteVerification
    ? `\n  <meta name="google-site-verification" content="${escapeHtml(affiliateConfig.googleSiteVerification)}" />`
    : '';

  const compactPrograms = Object.fromEntries(
    Object.entries(affiliateConfig.programs).map(([k, v]) => [
      k,
      { baseUrl: v.baseUrl, paramKey: v.paramKey, affiliateCode: v.affiliateCode }
    ])
  );

  const clientCatalogJson = JSON.stringify({
    models: LLM_MODELS.map(({ summary: _s, ...rest }) => rest),
    gpus: CLOUD_GPUS.map(({ summary: _s, bestForModels: _b, ...rest }) => rest),
    skills: AGENT_SKILLS_CATALOG.map((s) => ({
      ...s,
      tagline: { [locale]: s.tagline[locale] },
      metricNote: { [locale]: s.metricNote[locale] }
    })),
    affiliates: { usdToThbDefault: affiliateConfig.usdToThbDefault, programs: compactPrograms },
    locale,
    pageSlug,
    initialWorkload
  });

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <link rel="alternate" hreflang="${alternateLang}" href="${alternatePath}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(metaDescription)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />${gscMeta}
  <script type="application/ld+json">${jsonLd}</script>
  <style>${renderSharedStyles()}</style>
</head>
<body>
  <div class="nav-glass">
    <header class="masthead">
      <a class="brand-mark" href="${rootPrefix}/${locale}/index.html">TCO // BENCHMARK.26</a>
      <nav class="nav-bar">
        <a class="nav-link" href="${rootPrefix}/${locale}/index.html">Models (${allPages.length})</a>
        <a class="nav-link" href="${rootPrefix}/validation-dashboard.html">Live Stats</a>
        <a class="nav-link ${locale === 'th' ? 'active' : ''}" href="${locale === 'th' ? '#' : alternatePath}">ภาษาไทย</a>
        <a class="nav-link ${locale === 'en' ? 'active' : ''}" href="${locale === 'en' ? '#' : alternatePath}">English</a>
      </nav>
    </header>
  </div>

  <div class="shell">
    <section class="hero-block">
      <div class="kicker">${escapeHtml(labels.kicker)}</div>
      <h1>${escapeHtml(h1)}</h1>
      <p class="lead">${escapeHtml(labels.subtitle)}</p>

      <div class="benefit-trio">
        <div class="benefit-tile">
          <div class="benefit-title">${escapeHtml(labels.b1Title)}</div>
          <p class="benefit-desc">${escapeHtml(labels.b1Desc)}</p>
        </div>
        <div class="benefit-tile">
          <div class="benefit-title">${escapeHtml(labels.b2Title)}</div>
          <p class="benefit-desc">${escapeHtml(labels.b2Desc)}</p>
        </div>
        <div class="benefit-tile">
          <div class="benefit-title">${escapeHtml(labels.b3Title)}</div>
          <p class="benefit-desc">${escapeHtml(labels.b3Desc)}</p>
        </div>
      </div>
    </section>

    <div class="ledger-frame">
      <aside class="panel-left">
        <div class="section-tag">
          <span>${escapeHtml(labels.workloadTag)}</span>
          <span>1 USD = 34.5 THB</span>
        </div>

        <div class="preset-strip">
          <button type="button" class="preset-btn" onclick="applyPreset(1500, 2, 2000, 500, 45, 12)">${escapeHtml(labels.presetStartup)}</button>
          <button type="button" class="preset-btn" onclick="applyPreset(5000, 5, 3500, 800, 25, 10)">${escapeHtml(labels.presetAgent)}</button>
          <button type="button" class="preset-btn" onclick="applyPreset(25000, 4, 3000, 600, 30, 24)">${escapeHtml(labels.presetHigh)}</button>
        </div>

        <div class="field-row">
          <div class="field-top">
            <label class="field-label" for="inp-req">${escapeHtml(labels.reqLabel)}</label>
            <span class="field-readout" id="val-req">${initialWorkload.requestsPerDay.toLocaleString()}</span>
          </div>
          <input id="inp-req" type="range" min="50" max="50000" step="50" value="${initialWorkload.requestsPerDay}" />
        </div>

        <div class="field-row">
          <div class="field-top">
            <label class="field-label" for="inp-steps">${escapeHtml(labels.agentLabel)}</label>
            <span class="field-readout" id="val-steps">${initialWorkload.agentSteps}x</span>
          </div>
          <input id="inp-steps" type="range" min="1" max="15" step="1" value="${initialWorkload.agentSteps}" />
        </div>

        <div class="field-row">
          <div class="field-top">
            <label class="field-label" for="inp-intok">${escapeHtml(labels.inTokLabel)}</label>
            <span class="field-readout" id="val-intok">${initialWorkload.inputTokensPerReq.toLocaleString()}</span>
          </div>
          <input id="inp-intok" type="range" min="200" max="20000" step="100" value="${initialWorkload.inputTokensPerReq}" />
        </div>

        <div class="field-row">
          <div class="field-top">
            <label class="field-label" for="inp-outtok">${escapeHtml(labels.outTokLabel)}</label>
            <span class="field-readout" id="val-outtok">${initialWorkload.outputTokensPerReq.toLocaleString()}</span>
          </div>
          <input id="inp-outtok" type="range" min="100" max="4000" step="50" value="${initialWorkload.outputTokensPerReq}" />
        </div>

        <div class="field-row">
          <div class="field-top">
            <label class="field-label" for="inp-cache">${escapeHtml(labels.cacheLabel)}</label>
            <span class="field-readout" id="val-cache">${Math.round(initialWorkload.cacheHitRate * 100)}%</span>
          </div>
          <input id="inp-cache" type="range" min="0" max="90" step="5" value="${Math.round(initialWorkload.cacheHitRate * 100)}" />
        </div>

        <div class="field-row">
          <div class="field-top">
            <label class="field-label" for="inp-hours">${escapeHtml(labels.hoursLabel)}</label>
            <span class="field-readout" id="val-hours">${initialWorkload.activeHoursPerDay}h</span>
          </div>
          <input id="inp-hours" type="range" min="1" max="24" step="1" value="${initialWorkload.activeHoursPerDay}" />
        </div>

        <button type="button" class="btn-outline" id="btn-share" onclick="copyScenarioLink()">${escapeHtml(labels.shareBtn)}</button>
      </aside>

      <main class="panel-right">
        <div class="verdict-cell">
          <div class="verdict-meta">
            <div class="kicker" style="margin-bottom:4px;">${escapeHtml(labels.winnerTag)}</div>
            <div class="verdict-title" id="winner-name">${escapeHtml(initialCalc.recommendedWinner.name)} — $${initialCalc.recommendedWinner.monthlyUsd.toLocaleString()}/mo (฿${initialCalc.recommendedWinner.monthlyThb.toLocaleString()})</div>
            <p class="verdict-copy" id="winner-verdict">${escapeHtml(initialCalc.recommendedWinner.verdict[locale])}</p>
          </div>
          <a id="winner-cta" class="btn-primary" href="${escapeHtml(initialCalc.recommendedWinner.affiliateUrl)}" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick('${initialCalc.recommendedWinner.affiliateId}', ${initialCalc.recommendedWinner.monthlyUsd})">
            ${initialCalc.recommendedWinner.category === 'cloud_gpu' ? escapeHtml(labels.ctaRentGpu) : escapeHtml(labels.ctaTryApi)} →
          </a>
        </div>

        <div class="table-block">
          <div class="section-tag">
            <span>${escapeHtml(labels.apiTableTag)}</span>
            <span>USD / THB</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>${escapeHtml(labels.colModel)}</th>
                <th class="num">${escapeHtml(labels.colMonthly)}</th>
                <th class="num">${escapeHtml(labels.colMetric)}</th>
                <th class="num">${escapeHtml(labels.colAction)}</th>
              </tr>
            </thead>
            <tbody id="api-tbody">
              ${initialCalc.apiOptions
                .map((api) => {
                  const pct = Math.max(4, Math.round((api.monthlyUsd / maxInitialApiUsd) * 100));
                  return `<tr>
                    <td>
                      <span class="mono-val">${escapeHtml(api.name)}</span>
                      <span class="sub-val">${escapeHtml(api.provider)}</span>
                      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
                    </td>
                    <td class="num"><span class="mono-val">$${api.monthlyUsd.toLocaleString()}</span><span class="sub-val">฿${api.monthlyThb.toLocaleString()}</span></td>
                    <td class="num"><span class="mono-val">$${api.costPer1kTasksUsd}</span><span class="sub-val">per 1k tasks</span></td>
                    <td class="num"><a class="action-link" href="${escapeHtml(api.affiliateUrl)}" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick('${api.affiliateId}', ${api.monthlyUsd})">${escapeHtml(labels.ctaTryApi)} →</a></td>
                  </tr>`;
                })
                .join('\n')}
            </tbody>
          </table>
        </div>

        <div class="table-block">
          <div class="section-tag">
            <span>${escapeHtml(labels.gpuTableTag)}</span>
            <span>FLAT HOURLY</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>${escapeHtml(labels.colModel)}</th>
                <th class="num">${escapeHtml(labels.colMonthly)}</th>
                <th class="num">${escapeHtml(labels.colMetric)}</th>
                <th class="num">${escapeHtml(labels.colAction)}</th>
              </tr>
            </thead>
            <tbody id="gpu-tbody">
              ${initialCalc.gpuOptions
                .map(
                  (gpu) => `<tr>
                    <td><span class="mono-val">${escapeHtml(gpu.name)}</span><span class="sub-val">${gpu.instancesNeeded}x machine // ${gpu.vramGb}GB VRAM</span></td>
                    <td class="num"><span class="mono-val">$${gpu.monthlyUsd.toLocaleString()}</span><span class="sub-val">฿${gpu.monthlyThb.toLocaleString()}</span></td>
                    <td class="num"><span class="mono-val">${gpu.breakEvenTasksPerDayVsFlagshipApi.toLocaleString()}</span><span class="sub-val">tasks/day break-even</span></td>
                    <td class="num"><a class="action-link" href="${escapeHtml(gpu.affiliateUrl)}" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick('${gpu.affiliateId}', ${gpu.monthlyUsd})">${escapeHtml(labels.ctaRentGpu)} →</a></td>
                  </tr>`
                )
                .join('\n')}
            </tbody>
          </table>
        </div>

        <div class="table-block">
          <div class="section-tag">
            <span>${escapeHtml(labels.skillsTableTag)}</span>
            <span>WORK LONGER / PAY LESS</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>${escapeHtml(labels.colModel)}</th>
                <th class="num">Est. Savings</th>
                <th class="num">${escapeHtml(labels.colMetric)}</th>
                <th class="num">${escapeHtml(labels.colAction)}</th>
              </tr>
            </thead>
            <tbody id="skills-tbody">
              ${AGENT_SKILLS_CATALOG.map((sk) => {
                const savedUsd = Number((flagshipInitial.monthlyUsd * sk.tokenSavingsFraction).toFixed(2));
                const savedThb = Math.round(savedUsd * initialWorkload.usdToThbRate);
                const agensiUrl = resolveAffiliateUrl(affiliateConfig, sk.affiliateId, `${pageSlug}-${sk.id}`);
                return `<tr>
                  <td><span class="mono-val">${escapeHtml(sk.name)}</span><span class="sub-val">${escapeHtml(sk.tagline[locale])}</span></td>
                  <td class="num"><span class="savings-val">-$${savedUsd.toLocaleString()}/mo</span><span class="sub-val">-฿${savedThb.toLocaleString()}/เดือน</span></td>
                  <td class="num"><span class="mono-val">${sk.priceUsd > 0 ? `$${sk.priceUsd} once` : 'Free / Paid'}</span><span class="sub-val">${escapeHtml(sk.metricNote[locale])}</span></td>
                  <td class="num"><a class="action-link" href="${escapeHtml(agensiUrl)}" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick('${sk.affiliateId}', ${savedUsd})">${escapeHtml(labels.ctaSkill)} →</a></td>
                </tr>`;
              }).join('\n')}
            </tbody>
          </table>
        </div>

        <div class="table-block">
          <div class="section-tag">
            <span>${escapeHtml(labels.vpsTableTag)}</span>
            <span>MANAGED SERVERS</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>${escapeHtml(labels.colModel)}</th>
                <th class="num">${escapeHtml(labels.colMonthly)}</th>
                <th class="num">${escapeHtml(labels.colMetric)}</th>
                <th class="num">${escapeHtml(labels.colAction)}</th>
              </tr>
            </thead>
            <tbody>
              ${initialCalc.vpsOptions
                .map(
                  (vps) => `<tr>
                    <td><span class="mono-val">${escapeHtml(vps.name)}</span></td>
                    <td class="num"><span class="mono-val">$${vps.monthlyUsd.toLocaleString()}</span><span class="sub-val">฿${vps.monthlyThb.toLocaleString()}</span></td>
                    <td class="num"><span class="mono-val">${vps.vcpu} vCPU / ${vps.ramGb}GB</span><span class="sub-val">${vps.region.toUpperCase()}</span></td>
                    <td class="num"><a class="action-link" href="${escapeHtml(vps.affiliateUrl)}" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick('${vps.affiliateId}', ${vps.monthlyUsd})">${escapeHtml(labels.ctaHostVps)} →</a></td>
                  </tr>`
                )
                .join('\n')}
            </tbody>
          </table>
        </div>
      </main>
    </div>

    ${
      faqList.length > 0
        ? `<section class="standalone-section">
            <div class="section-tag"><span>${escapeHtml(labels.faqTag)}</span><span>REAL-WORLD EXAMPLES</span></div>
            ${faqList
              .map(
                (item) => `<div style="margin-bottom:16px;">
                  <div style="font-weight:600; font-size:0.94rem;">${escapeHtml(item.q[locale])}</div>
                  <p style="margin:6px 0 0; color:var(--ink-secondary); font-size:0.88rem;">${escapeHtml(item.a[locale])}</p>
                </div>`
              )
              .join('\n')}
          </section>`
        : ''
    }

    <section class="standalone-section">
      <div class="section-tag">
        <span>${escapeHtml(labels.directoryTag)}</span>
        <a href="${rootPrefix}/${locale}/index.html">View All ${allPages.length} →</a>
      </div>
      <div class="index-grid">
        ${relatedPages
          .map(
            (p) =>
              `<a class="index-cell" href="${rootPrefix}/${locale}/compare/${p.slug}.html">
                <span>${escapeHtml(p.h1[locale])}</span>
                <span style="color:var(--ink-muted);">→</span>
              </a>`
          )
          .join('\n')}
      </div>
    </section>

    <footer id="affiliate-disclosure" style="padding:20px 0 40px; border-top:1px solid var(--hairline); color:var(--ink-muted); font-size:0.78rem; line-height:1.55;">
      ${
        locale === 'th'
          ? 'การเปิดเผยข้อมูลพาร์ทเนอร์ (Affiliate Disclosure): เว็บไซต์นี้มีลิงก์แนะนำบริการคลาวด์, API และชุดคำสั่ง AI (รวมถึง Agensi.io, RunPod, AI/ML API และผู้ให้บริการ VPS) ซึ่งผู้จัดทำอาจได้รับค่าคอมมิชชันเมื่อคุณสมัครหรือสั่งซื้อผ่านลิงก์ดังกล่าว โดยที่คุณไม่เสียค่าใช้จ่ายเพิ่มใดๆ'
          : 'Affiliate Disclosure: Some links on this page (including Agensi.io, RunPod, AI/ML API, and cloud hosting providers) are affiliate links. We may earn a commission at no extra cost to you if you sign up or make a purchase through them.'
      }
    </footer>
  </div>

  <script>
    const APP_DATA = ${clientCatalogJson};
    const STORAGE_KEY = 'ai_cost_calc_telemetry_v1';
    const GLOBAL_NS = 'burapa_ai_cost_calc_live';

    function hitGlobalCounter(key) {
      fetch('https://abacus.jasoncameron.dev/hit/' + GLOBAL_NS + '/' + key, { mode: 'cors' }).catch(function(){});
    }

    function getSessionId() {
      let sid = localStorage.getItem('ai_cost_calc_sid');
      if (!sid) {
        sid = 'sess-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now();
        localStorage.setItem('ai_cost_calc_sid', sid);
        hitGlobalCounter('unique_sessions');
      }
      return sid;
    }

    function sendTelemetry(eventType, extra) {
      const ev = Object.assign({
        eventId: eventType + '-' + getSessionId() + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        sessionId: getSessionId(),
        timestampIso: new Date().toISOString(),
        eventType: eventType,
        locale: APP_DATA.locale,
        pageSlug: APP_DATA.pageSlug
      }, extra || {});

      try {
        const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        list.push(ev);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (_) {}

      if (eventType === 'page_view') hitGlobalCounter('page_views');
      if (eventType === 'calculation_run') hitGlobalCounter('calculation_runs');
      if (eventType === 'scenario_shared') hitGlobalCounter('scenarios_shared');
      if (eventType === 'affiliate_cta_click') {
        hitGlobalCounter('affiliate_clicks_total');
        if (extra && extra.affiliateId) hitGlobalCounter('aff_' + extra.affiliateId);
      }

      fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ev)
      }).catch(function(){});
    }

    function recordAffiliateClick(affiliateId, estimatedMonthlySpendUsd) {
      sendTelemetry('affiliate_cta_click', { affiliateId: affiliateId, estimatedMonthlySpendUsd: estimatedMonthlySpendUsd });
    }

    function buildAffiliateLink(affiliateId, itemSlug) {
      const prog = APP_DATA.affiliates.programs[affiliateId];
      const code = (prog.affiliateCode || 'ai-cost-calc').trim();
      if (affiliateId === 'agensi') {
        const cleanHandle = code.replace(/^https?:\/\/(www\.)?agensi\.io\/r\//i, '').replace(/^agensi\.io\/r\//i, '').replace(/^\/?r\//i, '').replace(/[^a-zA-Z0-9_-]/g, '') || 'YOUR_AGENSI_ID';
        const agUrl = new URL('https://www.agensi.io/r/' + cleanHandle);
        agUrl.searchParams.set('utm_campaign', APP_DATA.pageSlug + '-' + itemSlug);
        return agUrl.toString();
      }
      const u = new URL(prog.baseUrl);
      u.searchParams.set(prog.paramKey || 'ref', code);
      u.searchParams.set('utm_campaign', APP_DATA.pageSlug + '-' + itemSlug);
      return u.toString();
    }

    let hasLoggedCalcInteraction = false;

    function recalculate(fromUserInput) {
      const req = Number(document.getElementById('inp-req').value);
      const steps = Number(document.getElementById('inp-steps').value);
      const inTok = Number(document.getElementById('inp-intok').value);
      const outTok = Number(document.getElementById('inp-outtok').value);
      const cachePct = Number(document.getElementById('inp-cache').value);
      const hours = Number(document.getElementById('inp-hours').value);
      const fx = APP_DATA.affiliates.usdToThbDefault || 34.5;

      document.getElementById('val-req').textContent = req.toLocaleString();
      document.getElementById('val-steps').textContent = steps + 'x';
      document.getElementById('val-intok').textContent = inTok.toLocaleString();
      document.getElementById('val-outtok').textContent = outTok.toLocaleString();
      document.getElementById('val-cache').textContent = cachePct + '%';
      document.getElementById('val-hours').textContent = hours + 'h';

      const cacheHit = cachePct / 100;
      const monthlyCalls = req * steps * 30;
      const inMillions = (monthlyCalls * inTok) / 1000000;
      const outMillions = (monthlyCalls * outTok) / 1000000;

      const apiRows = APP_DATA.models.map(function(m) {
        const blendedIn = (1 - cacheHit) * m.inputUsdPer1M + cacheHit * m.cachedInputUsdPer1M;
        const monthlyUsd = Number((inMillions * blendedIn + outMillions * m.outputUsdPer1M).toFixed(2));
        const monthlyThb = Math.round(monthlyUsd * fx);
        const per1k = Number(((monthlyUsd / (req * 30)) * 1000).toFixed(2));
        const url = buildAffiliateLink(m.affiliateId, m.id);
        return { id: m.id, name: m.name, provider: m.provider, monthlyUsd: monthlyUsd, monthlyThb: monthlyThb, per1k: per1k, affiliateId: m.affiliateId, url: url };
      }).sort(function(a, b) { return a.monthlyUsd - b.monthlyUsd; });

      const maxApiUsd = Math.max.apply(null, apiRows.map(function(r) { return r.monthlyUsd; }).concat([1]));
      const flagship = apiRows.find(function(r) { return r.id === 'claude-3-7-sonnet'; }) || apiRows[apiRows.length - 1];
      const reqTokPerSec = (req * steps * outTok) / Math.max(1, hours * 3600);

      const gpuRows = APP_DATA.gpus.map(function(g) {
        const instances = Math.max(1, Math.ceil(reqTokPerSec / g.throughputTokensPerSec));
        const monthlyUsd = Number((instances * g.hourlyUsd * hours * 30).toFixed(2));
        const monthlyThb = Math.round(monthlyUsd * fx);
        const singleGpuMo = g.hourlyUsd * hours * 30;
        const flagPerTask = flagship.monthlyUsd / (req * 30);
        const breakEven = Math.max(1, Math.ceil(singleGpuMo / Math.max(0.000001, flagPerTask * 30)));
        const url = buildAffiliateLink(g.affiliateId, g.id);
        return { id: g.id, name: g.name, vramGb: g.vramGb, instances: instances, monthlyUsd: monthlyUsd, monthlyThb: monthlyThb, breakEven: breakEven, affiliateId: g.affiliateId, url: url };
      }).sort(function(a, b) { return a.monthlyUsd - b.monthlyUsd; });

      document.getElementById('api-tbody').innerHTML = apiRows.map(function(r) {
        const pct = Math.max(4, Math.round((r.monthlyUsd / maxApiUsd) * 100));
        return '<tr><td><span class="mono-val">' + r.name + '</span><span class="sub-val">' + r.provider + '</span><div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div></td>' +
          '<td class="num"><span class="mono-val">$' + r.monthlyUsd.toLocaleString() + '</span><span class="sub-val">฿' + r.monthlyThb.toLocaleString() + '</span></td>' +
          '<td class="num"><span class="mono-val">$' + r.per1k + '</span><span class="sub-val">per 1k tasks</span></td>' +
          '<td class="num"><a class="action-link" href="' + r.url + '" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick(\\'' + r.affiliateId + '\\', ' + r.monthlyUsd + ')">${escapeHtml(labels.ctaTryApi)} →</a></td></tr>';
      }).join('');

      document.getElementById('gpu-tbody').innerHTML = gpuRows.map(function(g) {
        return '<tr><td><span class="mono-val">' + g.name + '</span><span class="sub-val">' + g.instances + 'x machine // ' + g.vramGb + 'GB VRAM</span></td>' +
          '<td class="num"><span class="mono-val">$' + g.monthlyUsd.toLocaleString() + '</span><span class="sub-val">฿' + g.monthlyThb.toLocaleString() + '</span></td>' +
          '<td class="num"><span class="mono-val">' + g.breakEven.toLocaleString() + '</span><span class="sub-val">tasks/day break-even</span></td>' +
          '<td class="num"><a class="action-link" href="' + g.url + '" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick(\\'' + g.affiliateId + '\\', ' + g.monthlyUsd + ')">${escapeHtml(labels.ctaRentGpu)} →</a></td></tr>';
      }).join('');

      if (APP_DATA.skills && document.getElementById('skills-tbody')) {
        document.getElementById('skills-tbody').innerHTML = APP_DATA.skills.map(function(sk) {
          const savedUsd = Number((flagship.monthlyUsd * sk.tokenSavingsFraction).toFixed(2));
          const savedThb = Math.round(savedUsd * fx);
          const u = buildAffiliateLink(sk.affiliateId, sk.id);
          const priceLabel = sk.priceUsd > 0 ? ('$' + sk.priceUsd + ' once') : 'Free / Paid';
          return '<tr><td><span class="mono-val">' + sk.name + '</span><span class="sub-val">' + sk.tagline[APP_DATA.locale] + '</span></td>' +
            '<td class="num"><span class="savings-val">-$' + savedUsd.toLocaleString() + '/mo</span><span class="sub-val">-฿' + savedThb.toLocaleString() + '/เดือน</span></td>' +
            '<td class="num"><span class="mono-val">' + priceLabel + '</span><span class="sub-val">' + sk.metricNote[APP_DATA.locale] + '</span></td>' +
            '<td class="num"><a class="action-link" href="' + u + '" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick(\\'' + sk.affiliateId + '\\', ' + savedUsd + ')">${escapeHtml(labels.ctaSkill)} →</a></td></tr>';
        }).join('');
      }

      const bestGpu = gpuRows[0];
      const winnerNameEl = document.getElementById('winner-name');
      const winnerVerdictEl = document.getElementById('winner-verdict');
      const winnerCtaEl = document.getElementById('winner-cta');

      if (bestGpu.monthlyUsd < flagship.monthlyUsd) {
        const diffUsd = Number((flagship.monthlyUsd - bestGpu.monthlyUsd).toFixed(2));
        const diffThb = Math.round(diffUsd * fx);
        winnerNameEl.textContent = bestGpu.name + ' — $' + bestGpu.monthlyUsd.toLocaleString() + '/mo (฿' + bestGpu.monthlyThb.toLocaleString() + ')';
        winnerVerdictEl.textContent = APP_DATA.locale === 'th'
          ? 'ที่ปริมาณงาน ' + req.toLocaleString() + ' งาน/วัน การเช่าเหมาชั่วโมง (' + bestGpu.name + ') ช่วยคุมงบรายเดือนให้นิ่งอยู่ที่ ฿' + bestGpu.monthlyThb.toLocaleString() + ' ประหยัดลง ฿' + diffThb.toLocaleString() + '/เดือน เมื่อเทียบกับ ' + flagship.name + ' โดยไม่ต้องกังวลบิลพุ่ง'
          : 'At ' + req.toLocaleString() + ' tasks/day, renting ' + bestGpu.name + ' caps your bill at a predictable $' + bestGpu.monthlyUsd.toLocaleString() + '/mo — saving $' + diffUsd.toLocaleString() + '/mo vs. ' + flagship.name + '.';
        winnerCtaEl.href = bestGpu.url;
        winnerCtaEl.textContent = '${escapeHtml(labels.ctaRentGpu)} →';
        winnerCtaEl.onclick = function() { recordAffiliateClick(bestGpu.affiliateId, bestGpu.monthlyUsd); };
      } else {
        const diffUsd = Number((bestGpu.monthlyUsd - flagship.monthlyUsd).toFixed(2));
        const diffThb = Math.round(diffUsd * fx);
        winnerNameEl.textContent = flagship.name + ' — $' + flagship.monthlyUsd.toLocaleString() + '/mo (฿' + flagship.monthlyThb.toLocaleString() + ')';
        winnerVerdictEl.textContent = APP_DATA.locale === 'th'
          ? 'เมื่อใช้งานไม่ถึง ' + bestGpu.breakEven.toLocaleString() + ' งาน/วัน การจ่ายตามจริงผ่าน API (' + flagship.name + ') ประหยัดกว่าเช่าเครื่องทิ้งไว้ถึง ฿' + diffThb.toLocaleString() + '/เดือน รวมบิลจ่ายที่เดียวจบและไม่ต้องดูแลเซิร์ฟเวอร์เอง'
          : 'Below ' + bestGpu.breakEven.toLocaleString() + ' tasks/day, paying only for what you use via API (' + flagship.name + ') saves $' + diffUsd.toLocaleString() + '/mo with one-stop billing and zero server maintenance.';
        winnerCtaEl.href = flagship.url;
        winnerCtaEl.textContent = '${escapeHtml(labels.ctaTryApi)} →';
        winnerCtaEl.onclick = function() { recordAffiliateClick(flagship.affiliateId, flagship.monthlyUsd); };
      }

      if (fromUserInput && !hasLoggedCalcInteraction) {
        hasLoggedCalcInteraction = true;
        sendTelemetry('calculation_run', { estimatedMonthlySpendUsd: Math.min(bestGpu.monthlyUsd, flagship.monthlyUsd) });
      }
    }

    function applyPreset(req, steps, inTok, outTok, cachePct, hours) {
      document.getElementById('inp-req').value = req;
      document.getElementById('inp-steps').value = steps;
      document.getElementById('inp-intok').value = inTok;
      document.getElementById('inp-outtok').value = outTok;
      document.getElementById('inp-cache').value = cachePct;
      document.getElementById('inp-hours').value = hours;
      recalculate(true);
    }

    function copyScenarioLink() {
      const params = new URLSearchParams();
      params.set('req', document.getElementById('inp-req').value);
      params.set('steps', document.getElementById('inp-steps').value);
      params.set('inTok', document.getElementById('inp-intok').value);
      params.set('outTok', document.getElementById('inp-outtok').value);
      params.set('cache', document.getElementById('inp-cache').value);
      params.set('hours', document.getElementById('inp-hours').value);
      const shareUrl = window.location.origin + window.location.pathname + '?' + params.toString();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).catch(function(){});
      }
      sendTelemetry('scenario_shared', {});
      const btn = document.getElementById('btn-share');
      btn.textContent = APP_DATA.locale === 'th' ? 'คัดลอกลิงก์เรียบร้อยแล้ว' : 'Link Copied';
    }

    ['inp-req', 'inp-steps', 'inp-intok', 'inp-outtok', 'inp-cache', 'inp-hours'].forEach(function(id) {
      document.getElementById(id).addEventListener('input', function() { recalculate(true); });
    });

    (function initFromQuery() {
      const q = new URLSearchParams(window.location.search);
      if (q.has('req')) document.getElementById('inp-req').value = q.get('req');
      if (q.has('steps')) document.getElementById('inp-steps').value = q.get('steps');
      if (q.has('inTok')) document.getElementById('inp-intok').value = q.get('inTok');
      if (q.has('outTok')) document.getElementById('inp-outtok').value = q.get('outTok');
      if (q.has('cache')) document.getElementById('inp-cache').value = q.get('cache');
      if (q.has('hours')) document.getElementById('inp-hours').value = q.get('hours');
      recalculate(false);
      sendTelemetry('page_view', {});
    })();
  </script>
</body>
</html>`;
}

function renderValidationDashboardHtml(affiliateConfig: AffiliateConfigFile): string {
  const cfgJson = JSON.stringify(affiliateConfig);
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TCO // BENCHMARK.26 — Live Usage &amp; Conversion Telemetry</title>
  <style>${renderSharedStyles()}</style>
</head>
<body>
  <div class="nav-glass">
    <header class="masthead">
      <a class="brand-mark" href="./th/index.html">TCO // BENCHMARK.26</a>
      <nav class="nav-bar">
        <a class="nav-link" href="./th/index.html">ภาษาไทย</a>
        <a class="nav-link" href="./en/index.html">English</a>
        <a class="nav-link active" href="./validation-dashboard.html">Live Stats</a>
      </nav>
    </header>
  </div>

  <div class="shell">
    <section class="hero-block">
      <div class="kicker">CENTRALIZED LIVE TELEMETRY</div>
      <h1>Real-User Demand &amp; Conversion Tracker</h1>
      <p class="lead">หน้าสรุปจำนวนผู้เข้าชมจริง อัตราการเลื่อนคำนวณ และยอดคลิกลิงก์พาร์ทเนอร์จากทั่วโลก เพื่อวัดผลความสนใจของตลาดจริงแบบตรงไปตรงมา</p>
    </section>

    <section class="standalone-section">
      <div class="section-tag">
        <span>สถานะการพิสูจน์ตลาด (Validation Status)</span>
        <span id="telemetry-source">SOURCE: GLOBAL LIVE COUNTER</span>
      </div>
      <div class="verdict-title" id="verdict-code">LOADING...</div>
      <p class="verdict-copy" id="verdict-desc">กำลังดึงข้อมูลล่าสุด...</p>
    </section>

    <div class="ledger-frame">
      <aside class="panel-left">
        <div class="section-tag"><span>โหมดทดสอบ</span><span>SIMULATION</span></div>
        <p style="font-size:0.84rem; color:var(--ink-secondary); margin-top:0;">แสดงผลจากตัวนับออนไลน์รวมศูนย์เป็นค่าเริ่มต้น หรือสามารถกดจำลองผู้เข้าชม 60 คนเพื่อดูการคำนวณเป้าหมายได้</p>
        <button class="btn-primary" style="width:100%; margin-bottom:10px;" type="button" onclick="simulateSmokeTestBatch()">จำลองผู้เข้าชม 60 คน</button>
        <button class="btn-outline" type="button" onclick="clearLocalTelemetry()">สลับกลับไปดูยอดจริงออนไลน์</button>
      </aside>

      <main class="panel-right">
        <div class="table-block">
          <div class="section-tag"><span>ตัวชี้วัดการใช้งานจริง</span><span>LIVE METRICS</span></div>
          <table>
            <tbody>
              <tr><td>จำนวนผู้เข้าชมไม่ซ้ำ (Unique Sessions)</td><td class="num mono-val" id="m-sessions">0</td></tr>
              <tr><td>จำนวนการเปิดหน้าเว็บทั้งหมด (Page Views)</td><td class="num mono-val" id="m-views">0</td></tr>
              <tr><td>จำนวนครั้งที่ผู้ใช้ปรับตัวเลขคำนวณจริง</td><td class="num mono-val" id="m-calcs">0</td></tr>
              <tr><td>สัดส่วนคนที่คำนวณจริง (เป้าหมาย &ge; 15.0%)</td><td class="num mono-val" id="m-ir">0.0%</td></tr>
              <tr><td>จำนวนคลิกลิงก์พาร์ทเนอร์รวมทุกค่าย</td><td class="num mono-val" id="m-clicks">0</td></tr>
              <tr><td>อัตราคลิกลิงก์พาร์ทเนอร์ (เป้าหมาย &ge; 2.5%)</td><td class="num mono-val" id="m-ctr">0.0%</td></tr>
              <tr><td>ยอดคลิกแยกตามผู้ให้บริการ</td><td class="num mono-val" id="m-byprog">-</td></tr>
              <tr><td>รายได้คาดการณ์จากยอดคลิกชุดนี้ (คิดที่ 8% ซื้อจริง)</td><td class="num mono-val" id="m-proj">$0 (฿0)</td></tr>
              <tr><td>จำนวนผู้เข้าชมต่อเดือนที่ต้องใช้เพื่อแตะ 100,000 บาท/เดือน</td><td class="num mono-val" id="m-req-vis">12,500</td></tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  </div>

  <script>
    const AFF_CFG = ${cfgJson};
    const STORAGE_KEY = 'ai_cost_calc_telemetry_v1';
    const GLOBAL_NS = 'burapa_ai_cost_calc_live';

    async function getGlobalKey(key) {
      try {
        const r = await fetch('https://abacus.jasoncameron.dev/get/' + GLOBAL_NS + '/' + key, { mode: 'cors' });
        if (!r.ok) return 0;
        const d = await r.json();
        return Number(d.value || 0);
      } catch (_) {
        return 0;
      }
    }

    async function loadEvents() {
      const localSim = localStorage.getItem('ai_cost_calc_use_sim');
      if (localSim === '1') {
        document.getElementById('telemetry-source').textContent = 'SOURCE: LOCAL 60-VISITOR SIMULATION';
        const localEvents = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        renderReport(computeFromCounts(
          new Set(localEvents.map(function(e){return e.sessionId;})).size,
          localEvents.filter(function(e){return e.eventType==='page_view';}).length,
          localEvents.filter(function(e){return e.eventType==='calculation_run';}).length,
          localEvents.filter(function(e){return e.eventType==='scenario_shared';}).length,
          {
            aimlapi: localEvents.filter(function(e){return e.affiliateId==='aimlapi';}).length,
            runpod: localEvents.filter(function(e){return e.affiliateId==='runpod';}).length,
            cloudways: localEvents.filter(function(e){return e.affiliateId==='cloudways';}).length,
            vercel: localEvents.filter(function(e){return e.affiliateId==='vercel';}).length,
            hostatom: localEvents.filter(function(e){return e.affiliateId==='hostatom';}).length,
            rukcom: localEvents.filter(function(e){return e.affiliateId==='rukcom';}).length,
            agensi: localEvents.filter(function(e){return e.affiliateId==='agensi';}).length
          }
        ));
        return;
      }

      document.getElementById('telemetry-source').textContent = 'SOURCE: GLOBAL LIVE COUNTER';
      const [u, views, calcs, shares, cAiml, cRunpod, cCw, cVercel, cHa, cRuk, cAgensi] = await Promise.all([
        getGlobalKey('unique_sessions'),
        getGlobalKey('page_views'),
        getGlobalKey('calculation_runs'),
        getGlobalKey('scenarios_shared'),
        getGlobalKey('aff_aimlapi'),
        getGlobalKey('aff_runpod'),
        getGlobalKey('aff_cloudways'),
        getGlobalKey('aff_vercel'),
        getGlobalKey('aff_hostatom'),
        getGlobalKey('aff_rukcom'),
        getGlobalKey('aff_agensi')
      ]);

      renderReport(computeFromCounts(u, views, calcs, shares, {
        aimlapi: cAiml,
        runpod: cRunpod,
        cloudways: cCw,
        vercel: cVercel,
        hostatom: cHa,
        rukcom: cRuk,
        agensi: cAgensi
      }));
    }

    function computeFromCounts(u, views, calcs, shares, byProg) {
      const clicks = Object.keys(byProg).reduce(function(acc, k) { return acc + (byProg[k] || 0); }, 0);
      const denom = Math.max(1, u);
      const ir = calcs / denom;
      const ctr = clicks / denom;

      let commissionUsd = 0;
      Object.keys(byProg).forEach(function(k) {
        const payout = (AFF_CFG.programs[k] && AFF_CFG.programs[k].estimatedPayoutUsd) || 40;
        commissionUsd += byProg[k] * 0.08 * payout;
      });
      const projThb = Math.round(commissionUsd * (AFF_CFG.usdToThbDefault || 34.5));
      const revPerVis = u > 0 ? projThb / u : 0;
      const reqVis = revPerVis > 0 ? Math.ceil(100000 / revPerVis) : 12500;

      let verdict = 'INSUFFICIENT_DATA';
      let th = 'เก็บข้อมูลผู้เข้าชมจริงจากทั่วโลกได้ ' + u + '/50 คนแรก แนะนำให้นำลิงก์ไปแชร์ในกลุ่มผู้ใช้งานจริงเพื่อให้ครบ 50 คนแรก';
      if (u >= 50 && ir >= 0.15 && ctr >= 0.025) {
        verdict = 'PROVEN_GO_SCALE';
        th = 'ผ่านเกณฑ์! อัตราการคำนวณ (' + (ir*100).toFixed(1) + '%) และอัตราคลิก (' + (ctr*100).toFixed(1) + '%) ยืนยันว่ามีคนใช้งานจริง คุ้มค่าที่จะขยายผลสู่ ' + reqVis.toLocaleString() + ' คน/เดือน';
      } else if (u >= 50 && ir >= 0.15) {
        verdict = 'ITERATE_CTA';
        th = 'ผู้เข้าชมใช้งานเครื่องคำนวณสูง (' + (ir*100).toFixed(1) + '%) แต่อัตราคลิกลิงก์ยังต่ำกว่า 2.5%';
      } else if (u >= 50) {
        verdict = 'KILL_OR_PIVOT';
        th = 'อัตราการคำนวณต่ำกว่า 15%';
      }

      return {
        uniqueSessions: u,
        totalPageViews: views,
        calculatorInteractions: calcs,
        scenariosShared: shares,
        affiliateCtaClicks: clicks,
        interactionRate: ir,
        affiliateCtr: ctr,
        clicksByProgram: byProg,
        projectedMonthlyRevenueUsdAtCurrentCtr: Number(commissionUsd.toFixed(2)),
        projectedMonthlyRevenueThbAtCurrentCtr: projThb,
        requiredMonthlyVisitorsFor100kThb: reqVis,
        verdict: verdict,
        explanation: { th: th, en: th }
      };
    }

    function renderReport(r) {
      document.getElementById('verdict-code').textContent = r.verdict;
      document.getElementById('verdict-desc').textContent = r.explanation.th;
      document.getElementById('m-sessions').textContent = r.uniqueSessions.toLocaleString();
      document.getElementById('m-views').textContent = r.totalPageViews.toLocaleString();
      document.getElementById('m-calcs').textContent = r.calculatorInteractions.toLocaleString();
      document.getElementById('m-ir').textContent = (r.interactionRate * 100).toFixed(1) + '%';
      document.getElementById('m-clicks').textContent = r.affiliateCtaClicks.toLocaleString();
      document.getElementById('m-ctr').textContent = (r.affiliateCtr * 100).toFixed(1) + '%';
      document.getElementById('m-byprog').textContent = JSON.stringify(r.clicksByProgram);
      document.getElementById('m-proj').textContent = '$' + r.projectedMonthlyRevenueUsdAtCurrentCtr + ' (฿' + r.projectedMonthlyRevenueThbAtCurrentCtr.toLocaleString() + ')';
      document.getElementById('m-req-vis').textContent = r.requiredMonthlyVisitorsFor100kThb.toLocaleString();
    }

    function simulateSmokeTestBatch() {
      const list = [];
      for (let i = 1; i <= 60; i++) {
        const sid = 'sim-sess-' + i;
        list.push({ eventId: 'pv-' + i, sessionId: sid, eventType: 'page_view', locale: 'th', pageSlug: 'home' });
        if (i <= 24) list.push({ eventId: 'calc-' + i, sessionId: sid, eventType: 'calculation_run', locale: 'th', pageSlug: 'home' });
        if (i <= 4) list.push({ eventId: 'aff-' + i, sessionId: sid, eventType: 'affiliate_cta_click', locale: 'th', pageSlug: 'home', affiliateId: i % 2 === 0 ? 'agensi' : 'runpod' });
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      localStorage.setItem('ai_cost_calc_use_sim', '1');
      loadEvents();
    }

    function clearLocalTelemetry() {
      localStorage.removeItem('ai_cost_calc_use_sim');
      loadEvents();
    }

    loadEvents();
  </script>
</body>
</html>`;
}

function renderValidationKitMarkdown(baseUrl: string, pageCount: number): string {
  return `# Zero-Cost Demand Validation & Affiliate Onboarding Kit

- Total Generated Static Pages (EN + TH): **${pageCount} pages**
- Live Centralized Telemetry Ledger: \`${baseUrl}/validation-dashboard.html\`

---

## Part 1: Direct Affiliate Signup Links (Update in \`config/affiliates.json\`)

1. **Agensi.io (90% Self-Referred Skill Sales + 20% 6-Month Affiliate):** https://agensi.io/ (Dashboard -> Affiliate)
2. **Cloudways ($50–$125 CPA per sale):** https://www.cloudways.com/en/partners/cloud-affiliate-program.php
3. **RunPod (10% Recurring GPU Spend via PartnerStack):** https://www.runpod.io/console/user/referrals
4. **AI/ML API (30% Recurring Lifetime):** https://aimlapi.com/affiliate
5. **Ruk-Com Cloud Thailand (33% First-Cycle Commission):** https://ruk-com.in.th/
6. **Hostatom Thailand (150–500 THB CPA):** https://www.hostatom.com/

To update any partner code and rebuild:
\`\`\`bash
node src/cli-affiliate.ts <partner_id> <your_affiliate_code>
\`\`\`
`;
}

export interface BuildOutputSummary {
  outputDir: string;
  totalHtmlPages: number;
  enComparisonPages: number;
  thComparisonPages: number;
  sitemapUrls: number;
}

export function generateStaticSite(
  outputDir: string,
  affiliateConfig: AffiliateConfigFile,
  publicBaseUrl = 'https://burapa-j.github.io/ai-cost-calc'
): BuildOutputSummary {
  const parentDir = path.dirname(outputDir);
  fs.mkdirSync(parentDir, { recursive: true });
  const stagingDir = path.join(parentDir, `.tmp-dist-${process.pid}-${Date.now()}`);

  fs.mkdirSync(path.join(stagingDir, 'en', 'compare'), { recursive: true });
  fs.mkdirSync(path.join(stagingDir, 'th', 'compare'), { recursive: true });
  fs.writeFileSync(path.join(stagingDir, '.nojekyll'), '', 'utf8');

  const catalog = buildProgrammaticPagesCatalog();
  const sitemapUrls: string[] = [];

  const rootRedirectHtml = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0; url=./th/index.html" />
  <title>TCO // BENCHMARK.26 — Practical AI Cost &amp; Quota Planner</title>
</head>
<body>
  <p><a href="./th/index.html">ภาษาไทย</a> | <a href="./en/index.html">English</a></p>
</body>
</html>`;
  fs.writeFileSync(path.join(stagingDir, 'index.html'), rootRedirectHtml, 'utf8');

  const locales: Locale[] = ['en', 'th'];
  for (const locale of locales) {
    const homeHtml = renderCalculatorPage(
      locale,
      'home',
      locale === 'th'
        ? 'วางแผนค่าใช้จ่าย AI ให้ประหยัดที่สุด — เทียบจ่ายตามจริง vs เหมาชั่วโมง (2026)'
        : 'Practical AI Cost & Quota Planner — Pay-As-You-Go vs. Hourly GPU (2026)',
      locale === 'th'
        ? 'เทียบชัดๆ ว่างานของคุณควรจ่ายตามที่ใช้จริงรวมในบิลเดียว หรือเช่าเหมาชั่วโมงถึงจะประหยัดกว่า พร้อมวิธีตั้งค่าให้ใช้งานได้นานขึ้นโดยโควต้าไม่หมดไว'
        : 'See clearly whether pay-as-you-go single-bill APIs or flat hourly GPUs cost less for your daily workload, plus practical ways to stretch your token quota.',
      locale === 'th'
        ? 'จ่ายน้อยลง ทำงานได้นานขึ้น และรวมทุกค่ายจบในที่เดียว'
        : 'Pay less. Work longer. Consolidate in one place.',
      {
        requestsPerDay: 1500,
        inputTokensPerReq: 2500,
        outputTokensPerReq: 600,
        cacheHitRate: 0.35,
        agentSteps: 3,
        activeHoursPerDay: 12
      },
      [],
      catalog,
      affiliateConfig,
      false,
      publicBaseUrl
    );
    fs.writeFileSync(path.join(stagingDir, locale, 'index.html'), homeHtml, 'utf8');
    sitemapUrls.push(`${publicBaseUrl}/${locale}/index.html`);

    for (const spec of catalog) {
      const subHtml = renderCalculatorPage(
        locale,
        spec.slug,
        spec.title[locale],
        spec.metaDescription[locale],
        spec.h1[locale],
        spec.presetWorkload,
        spec.faq,
        catalog,
        affiliateConfig,
        true,
        publicBaseUrl
      );
      fs.writeFileSync(
        path.join(stagingDir, locale, 'compare', `${spec.slug}.html`),
        subHtml,
        'utf8'
      );
      sitemapUrls.push(`${publicBaseUrl}/${locale}/compare/${spec.slug}.html`);
    }
  }

  fs.writeFileSync(
    path.join(stagingDir, 'validation-dashboard.html'),
    renderValidationDashboardHtml(affiliateConfig),
    'utf8'
  );

  const totalHtmlPages = 1 + 1 + locales.length * (1 + catalog.length);

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((u) => `  <url><loc>${escapeHtml(u)}</loc></url>`).join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(stagingDir, 'sitemap.xml'), sitemapXml, 'utf8');

  fs.writeFileSync(
    path.join(stagingDir, 'robots.txt'),
    `User-agent: *\nAllow: /\nSitemap: ${publicBaseUrl}/sitemap.xml\n`,
    'utf8'
  );

  const llmsTxt = `# TCO // BENCHMARK.26 — Practical AI Cost & Quota Planner (EN / TH)
> Compare single-bill pay-as-you-go LLM APIs, flat-rate hourly GPUs, managed servers, and token-saving Agent Skills (${totalHtmlPages} bilingual pages).

- English Planner: ${publicBaseUrl}/en/index.html
- Thai Planner: ${publicBaseUrl}/th/index.html
- Live Stats: ${publicBaseUrl}/validation-dashboard.html
- Sitemap (${sitemapUrls.length} URLs): ${publicBaseUrl}/sitemap.xml
`;
  fs.writeFileSync(path.join(stagingDir, 'llms.txt'), llmsTxt, 'utf8');

  const indexNowKey = sanitizeIndexNowKey(affiliateConfig.indexNowKey);
  fs.writeFileSync(path.join(stagingDir, `${indexNowKey}.txt`), indexNowKey, 'utf8');

  fs.writeFileSync(
    path.join(stagingDir, 'validation-kit.md'),
    renderValidationKitMarkdown(publicBaseUrl, totalHtmlPages),
    'utf8'
  );

  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  fs.renameSync(stagingDir, outputDir);

  return {
    outputDir,
    totalHtmlPages,
    enComparisonPages: catalog.length,
    thComparisonPages: catalog.length,
    sitemapUrls: sitemapUrls.length
  };
}
