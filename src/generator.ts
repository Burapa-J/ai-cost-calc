import fs from 'node:fs';
import path from 'node:path';
import { calculateCostComparison, sanitizeIndexNowKey, sanitizeWorkloadInput } from './calculator.ts';
import {
  type AffiliateConfigFile,
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
      --paper: #F6F5F0;
      --surface: #FFFFFF;
      --surface-alt: #EFECE4;
      --ink: #141413;
      --ink-secondary: #575651;
      --ink-muted: #85837C;
      --line: #DCD9CF;
      --line-strong: #141413;
      --signal: #C83E1D;
      --ledger-green: #165B33;
      --mono: "JetBrains Mono", "SF Mono", "Menlo", "Consolas", monospace;
      --sans: "Inter", -apple-system, BlinkMacSystemFont, "Noto Sans Thai", "Thonburi", sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: var(--sans);
      background: var(--paper);
      color: var(--ink);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    a { color: var(--ink); text-decoration: none; }
    .shell {
      max-width: 1220px;
      margin: 0 auto;
      padding: 0 20px 80px;
    }
    .masthead {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 0;
      border-bottom: 1.5px solid var(--line-strong);
      font-family: var(--mono);
      font-size: 0.78rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      flex-wrap: wrap;
      gap: 12px;
    }
    .brand-mark {
      font-weight: 700;
      color: var(--ink);
      letter-spacing: 0.06em;
    }
    .nav-bar {
      display: flex;
      gap: 18px;
      align-items: center;
      flex-wrap: wrap;
    }
    .nav-link {
      color: var(--ink-secondary);
      padding: 3px 0;
      border-bottom: 1.5px solid transparent;
    }
    .nav-link:hover, .nav-link.active {
      color: var(--ink);
      border-bottom-color: var(--ink);
    }
    .hero-block {
      padding: 36px 0 28px;
      border-bottom: 1px solid var(--line);
    }
    .kicker {
      font-family: var(--mono);
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.09em;
      color: var(--ink-secondary);
      margin-bottom: 10px;
    }
    h1 {
      font-size: clamp(1.65rem, 3vw, 2.45rem);
      font-weight: 600;
      letter-spacing: -0.03em;
      line-height: 1.15;
      margin: 0 0 12px;
      max-width: 28ch;
    }
    .lead {
      color: var(--ink-secondary);
      font-size: 0.98rem;
      max-width: 68ch;
      margin: 0;
    }
    .ledger-frame {
      display: grid;
      grid-template-columns: 390px 1fr;
      border: 1px solid var(--line-strong);
      background: var(--surface);
      margin-top: 28px;
    }
    @media (max-width: 920px) {
      .ledger-frame { grid-template-columns: 1fr; }
    }
    .panel-left {
      border-right: 1px solid var(--line);
      padding: 24px;
      background: var(--paper);
    }
    @media (max-width: 920px) {
      .panel-left { border-right: none; border-bottom: 1px solid var(--line); }
    }
    .panel-right {
      background: var(--surface);
    }
    .section-tag {
      font-family: var(--mono);
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--ink-secondary);
      padding-bottom: 10px;
      border-bottom: 1px solid var(--line);
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
    }
    .preset-strip {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      border: 1px solid var(--line);
      margin-bottom: 22px;
      background: var(--surface);
    }
    .preset-btn {
      background: transparent;
      border: none;
      border-right: 1px solid var(--line);
      padding: 8px 6px;
      font-family: var(--mono);
      font-size: 0.68rem;
      color: var(--ink-secondary);
      cursor: pointer;
      text-align: center;
      transition: background 0.12s, color 0.12s;
    }
    .preset-btn:last-child { border-right: none; }
    .preset-btn:hover { background: var(--ink); color: var(--surface); }
    .field-row {
      margin-bottom: 18px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--line);
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
      font-size: 0.86rem;
      font-weight: 600;
      color: var(--ink);
      font-variant-numeric: tabular-nums;
      background: var(--surface);
      border: 1px solid var(--line);
      padding: 2px 8px;
    }
    input[type="range"] {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 2px;
      background: var(--line-strong);
      outline: none;
      cursor: pointer;
    }
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 12px;
      height: 12px;
      background: var(--ink);
      border: 1.5px solid var(--surface);
      cursor: pointer;
    }
    .verdict-cell {
      padding: 24px 28px;
      border-bottom: 1px solid var(--line-strong);
      background: var(--surface);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      flex-wrap: wrap;
    }
    .verdict-meta { max-width: 64ch; }
    .verdict-title {
      font-size: 1.35rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      margin: 4px 0 6px;
      font-variant-numeric: tabular-nums;
    }
    .verdict-copy {
      font-size: 0.88rem;
      color: var(--ink-secondary);
      margin: 0;
    }
    .btn-primary {
      display: inline-block;
      background: var(--ink);
      color: var(--surface);
      font-family: var(--mono);
      font-size: 0.76rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 12px 18px;
      border: 1px solid var(--ink);
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.12s, color 0.12s;
    }
    .btn-primary:hover {
      background: var(--signal);
      border-color: var(--signal);
      color: #fff;
    }
    .btn-outline {
      width: 100%;
      background: var(--surface);
      color: var(--ink);
      font-family: var(--mono);
      font-size: 0.74rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 10px 14px;
      border: 1px solid var(--line-strong);
      cursor: pointer;
    }
    .btn-outline:hover {
      background: var(--ink);
      color: var(--surface);
    }
    .table-block {
      padding: 22px 28px;
      border-bottom: 1px solid var(--line);
    }
    .table-block:last-child { border-bottom: none; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.86rem;
      font-variant-numeric: tabular-nums;
    }
    th {
      font-family: var(--mono);
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--ink-muted);
      text-align: left;
      padding: 8px 10px 8px 0;
      border-bottom: 1px solid var(--line-strong);
      font-weight: 500;
    }
    th.num, td.num { text-align: right; }
    td {
      padding: 11px 10px 11px 0;
      border-bottom: 1px solid var(--line);
      vertical-align: middle;
    }
    tr:last-child td { border-bottom: none; }
    .mono-val {
      font-family: var(--mono);
      font-weight: 600;
      color: var(--ink);
    }
    .sub-val {
      font-family: var(--mono);
      font-size: 0.76rem;
      color: var(--ink-secondary);
      display: block;
    }
    .action-link {
      font-family: var(--mono);
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--signal);
      border-bottom: 1px solid currentColor;
      padding-bottom: 1px;
    }
    .action-link:hover { color: var(--ink); }
    .standalone-section {
      margin-top: 32px;
      border: 1px solid var(--line);
      background: var(--surface);
      padding: 24px 28px;
    }
    .index-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      border-top: 1px solid var(--line);
      border-left: 1px solid var(--line);
      margin-top: 14px;
    }
    .index-cell {
      padding: 10px 12px;
      border-right: 1px solid var(--line);
      border-bottom: 1px solid var(--line);
      font-size: 0.8rem;
      color: var(--ink-secondary);
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }
    .index-cell:hover {
      background: var(--surface-alt);
      color: var(--ink);
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
    return allPages.slice(0, 24);
  }
  const sameCategory = allPages.filter(
    (p) =>
      p.slug !== currentSlug &&
      (p.category === current.category ||
        (current.primaryModelId && p.primaryModelId === current.primaryModelId))
  );
  return sameCategory.slice(0, 24);
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

  const labels =
    locale === 'th'
      ? {
          kicker: 'ตารางวิเคราะห์ต้นทุนโครงสร้างพื้นฐาน AI // อัปเดต 2026',
          subtitle:
            'เปรียบเทียบต้นทุนจริงรายเดือนระหว่างการเรียกใช้ LLM API (รวมส่วนลด Prompt Caching และตัวคูณ Agent หลายขั้นตอน) เทียบกับการเช่าเครื่อง Cloud GPU รายชั่วโมง และเซิร์ฟเวอร์ Cloud VPS',
          workloadTag: '01 // ตัวแปรปริมาณงาน (WORKLOAD PARAMETERS)',
          presetStartup: '1.5K งาน/วัน',
          presetAgent: '5K AGENT',
          presetHigh: '25K องค์กร',
          reqLabel: 'จำนวนงานต่อวัน (Tasks / Day)',
          agentLabel: 'จำนวนรอบที่เรียกโมเดลต่อ 1 งาน (Agent Steps)',
          inTokLabel: 'Input Tokens ต่อรอบ (Prompt + Context)',
          outTokLabel: 'Output Tokens ต่อรอบ (Completion)',
          cacheLabel: 'อัตราส่วน Prompt Cache Hit (%)',
          hoursLabel: 'ชั่วโมงเปิดเครื่อง GPU ต่อวัน (Active Hours)',
          shareBtn: 'คัดลอกลิงก์พารามิเตอร์ชุดนี้',
          winnerTag: '02 // ข้อสรุปต้นทุนต่ำสุด (OPTIMAL TCO VERDICT)',
          apiTableTag: '03 // ตารางต้นทุน MANAGED LLM API (เรียงจากถูกสุด)',
          gpuTableTag: '04 // ตารางเช่า DEDICATED CLOUD GPU และจุดคุ้มทุน',
          vpsTableTag: '05 // ตาราง CLOUD VPS สำหรับรันระบบหลังบ้าน (ไทย & สากล)',
          colModel: 'รุ่นโมเดล / สเปกเครื่อง',
          colMonthly: 'รายเดือน (USD / THB)',
          colMetric: 'ต้นทุนต่อหน่วย / จุดคุ้มทุน',
          colAction: 'ผู้ให้บริการ',
          ctaTryApi: 'เปิดดูเรทราคา API',
          ctaRentGpu: 'เช่าเครื่อง GPU',
          ctaHostVps: 'ดูแพ็กเกจ VPS',
          faqTag: '06 // ข้อมูลจำเพาะทางเทคนิค (SPECIFICATION NOTES)',
          directoryTag: isComparisonSubpage
            ? '07 // หน้าคำนวณที่เกี่ยวข้อง (RELATED MODELS)'
            : `07 // ดัชนีหน้าคำนวณทั้งหมด (${allPages.length} MODELS)`
        }
      : {
          kicker: 'INFRASTRUCTURE UNIT ECONOMICS LEDGER // 2026 REVISION',
          subtitle:
            'Model monthly production spend across pay-per-token LLM APIs (incorporating prompt caching & sequential agent steps), dedicated Cloud GPU instances, and managed VPS infrastructure.',
          workloadTag: '01 // WORKLOAD PARAMETERS',
          presetStartup: '1.5K SAAS',
          presetAgent: '5K AGENT',
          presetHigh: '25K SCALE',
          reqLabel: 'Daily User Tasks',
          agentLabel: 'Sequential Agent Steps / Task',
          inTokLabel: 'Input Tokens / Step',
          outTokLabel: 'Output Tokens / Step',
          cacheLabel: 'Prompt Cache Hit Rate (%)',
          hoursLabel: 'Active GPU Hours / Day',
          shareBtn: 'Copy Parameter Permalink',
          winnerTag: '02 // LOWEST TCO VERDICT',
          apiTableTag: '03 // MANAGED LLM API LEDGER',
          gpuTableTag: '04 // DEDICATED CLOUD GPU BREAK-EVEN LEDGER',
          vpsTableTag: '05 // CLOUD VPS & APPLICATION HOSTING LEDGER',
          colModel: 'Model / Hardware Spec',
          colMonthly: 'Monthly Bill (USD / THB)',
          colMetric: 'Unit Cost / Break-Even',
          colAction: 'Provider',
          ctaTryApi: 'Inspect API Tier',
          ctaRentGpu: 'Provision GPU',
          ctaHostVps: 'Inspect VPS',
          faqTag: '06 // SPECIFICATION NOTES',
          directoryTag: isComparisonSubpage
            ? '07 // RELATED COST MODELS'
            : `07 // COMPLETE CALCULATION INDEX (${allPages.length} MODELS)`
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

  const clientCatalogJson = JSON.stringify({
    models: LLM_MODELS.map(({ summary: _s, ...rest }) => rest),
    gpus: CLOUD_GPUS.map(({ summary: _s, bestForModels: _b, ...rest }) => rest),
    affiliates: affiliateConfig,
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
  <div class="shell">
    <header class="masthead">
      <a class="brand-mark" href="${rootPrefix}/${locale}/index.html">TCO // BENCHMARK.26</a>
      <nav class="nav-bar">
        <a class="nav-link" href="${rootPrefix}/${locale}/index.html">INDEX (${allPages.length})</a>
        <a class="nav-link" href="${rootPrefix}/validation-dashboard.html">TELEMETRY</a>
        <span>|</span>
        <a class="nav-link ${locale === 'th' ? 'active' : ''}" href="${locale === 'th' ? '#' : alternatePath}">TH</a>
        <a class="nav-link ${locale === 'en' ? 'active' : ''}" href="${locale === 'en' ? '#' : alternatePath}">EN</a>
      </nav>
    </header>

    <section class="hero-block">
      <div class="kicker">${escapeHtml(labels.kicker)}</div>
      <h1>${escapeHtml(h1)}</h1>
      <p class="lead">${escapeHtml(labels.subtitle)}</p>
    </section>

    <div class="ledger-frame">
      <aside class="panel-left">
        <div class="section-tag">
          <span>${escapeHtml(labels.workloadTag)}</span>
          <span>FX: 34.5 THB</span>
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
                .map(
                  (api) => `<tr>
                    <td><span class="mono-val">${escapeHtml(api.name)}</span><span class="sub-val">${escapeHtml(api.provider)}</span></td>
                    <td class="num"><span class="mono-val">$${api.monthlyUsd.toLocaleString()}</span><span class="sub-val">฿${api.monthlyThb.toLocaleString()}</span></td>
                    <td class="num"><span class="mono-val">$${api.costPer1kTasksUsd}</span><span class="sub-val">per 1k tasks</span></td>
                    <td class="num"><a class="action-link" href="${escapeHtml(api.affiliateUrl)}" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick('${api.affiliateId}', ${api.monthlyUsd})">${escapeHtml(labels.ctaTryApi)}</a></td>
                  </tr>`
                )
                .join('\n')}
            </tbody>
          </table>
        </div>

        <div class="table-block">
          <div class="section-tag">
            <span>${escapeHtml(labels.gpuTableTag)}</span>
            <span>DEDICATED HOURLY</span>
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
                    <td><span class="mono-val">${escapeHtml(gpu.name)}</span><span class="sub-val">${gpu.instancesNeeded}x instance // ${gpu.vramGb}GB VRAM</span></td>
                    <td class="num"><span class="mono-val">$${gpu.monthlyUsd.toLocaleString()}</span><span class="sub-val">฿${gpu.monthlyThb.toLocaleString()}</span></td>
                    <td class="num"><span class="mono-val">${gpu.breakEvenTasksPerDayVsFlagshipApi.toLocaleString()}</span><span class="sub-val">tasks/day break-even</span></td>
                    <td class="num"><a class="action-link" href="${escapeHtml(gpu.affiliateUrl)}" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick('${gpu.affiliateId}', ${gpu.monthlyUsd})">${escapeHtml(labels.ctaRentGpu)}</a></td>
                  </tr>`
                )
                .join('\n')}
            </tbody>
          </table>
        </div>

        <div class="table-block">
          <div class="section-tag">
            <span>${escapeHtml(labels.vpsTableTag)}</span>
            <span>MANAGED / NVME</span>
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
                    <td class="num"><a class="action-link" href="${escapeHtml(vps.affiliateUrl)}" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick('${vps.affiliateId}', ${vps.monthlyUsd})">${escapeHtml(labels.ctaHostVps)}</a></td>
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
            <div class="section-tag"><span>${escapeHtml(labels.faqTag)}</span><span>QA</span></div>
            ${faqList
              .map(
                (item) => `<div style="margin-bottom:14px;">
                  <div style="font-weight:600; font-size:0.9rem;">${escapeHtml(item.q[locale])}</div>
                  <p style="margin:4px 0 0; color:var(--ink-secondary); font-size:0.86rem;">${escapeHtml(item.a[locale])}</p>
                </div>`
              )
              .join('\n')}
          </section>`
        : ''
    }

    <section class="standalone-section">
      <div class="section-tag">
        <span>${escapeHtml(labels.directoryTag)}</span>
        <a href="${rootPrefix}/${locale}/index.html" style="text-decoration:underline;">VIEW ALL ${allPages.length}</a>
      </div>
      <div class="index-grid">
        ${relatedPages
          .map(
            (p, idx) =>
              `<a class="index-cell" href="${rootPrefix}/${locale}/compare/${p.slug}.html">
                <span>${escapeHtml(p.h1[locale])}</span>
                <span style="font-family:var(--mono); font-size:0.7rem; color:var(--ink-muted);">#${String(idx + 1).padStart(2, '0')}</span>
              </a>`
          )
          .join('\n')}
      </div>
    </section>
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
      const u = new URL(prog.baseUrl);
      u.searchParams.set(prog.paramKey || 'ref', prog.affiliateCode || 'ai-cost-calc');
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
        return '<tr><td><span class="mono-val">' + r.name + '</span><span class="sub-val">' + r.provider + '</span></td>' +
          '<td class="num"><span class="mono-val">$' + r.monthlyUsd.toLocaleString() + '</span><span class="sub-val">฿' + r.monthlyThb.toLocaleString() + '</span></td>' +
          '<td class="num"><span class="mono-val">$' + r.per1k + '</span><span class="sub-val">per 1k tasks</span></td>' +
          '<td class="num"><a class="action-link" href="' + r.url + '" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick(\\'' + r.affiliateId + '\\', ' + r.monthlyUsd + ')">${escapeHtml(labels.ctaTryApi)}</a></td></tr>';
      }).join('');

      document.getElementById('gpu-tbody').innerHTML = gpuRows.map(function(g) {
        return '<tr><td><span class="mono-val">' + g.name + '</span><span class="sub-val">' + g.instances + 'x instance // ' + g.vramGb + 'GB VRAM</span></td>' +
          '<td class="num"><span class="mono-val">$' + g.monthlyUsd.toLocaleString() + '</span><span class="sub-val">฿' + g.monthlyThb.toLocaleString() + '</span></td>' +
          '<td class="num"><span class="mono-val">' + g.breakEven.toLocaleString() + '</span><span class="sub-val">tasks/day break-even</span></td>' +
          '<td class="num"><a class="action-link" href="' + g.url + '" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick(\\'' + g.affiliateId + '\\', ' + g.monthlyUsd + ')">${escapeHtml(labels.ctaRentGpu)}</a></td></tr>';
      }).join('');

      const bestGpu = gpuRows[0];
      const winnerNameEl = document.getElementById('winner-name');
      const winnerVerdictEl = document.getElementById('winner-verdict');
      const winnerCtaEl = document.getElementById('winner-cta');

      if (bestGpu.monthlyUsd < flagship.monthlyUsd) {
        const diffUsd = Number((flagship.monthlyUsd - bestGpu.monthlyUsd).toFixed(2));
        const diffThb = Math.round(diffUsd * fx);
        winnerNameEl.textContent = bestGpu.name + ' — $' + bestGpu.monthlyUsd.toLocaleString() + '/mo (฿' + bestGpu.monthlyThb.toLocaleString() + ')';
        winnerVerdictEl.textContent = APP_DATA.locale === 'th'
          ? 'ที่ปริมาณงาน ' + req.toLocaleString() + ' งาน/วัน (คูณ ' + steps + ' ขั้นตอน Agent) การเช่า ' + bestGpu.name + ' ประหยัดได้ถึง ฿' + diffThb.toLocaleString() + '/เดือน เมื่อเทียบกับ ' + flagship.name
          : 'At ' + req.toLocaleString() + ' tasks/day × ' + steps + ' agent steps, renting ' + bestGpu.name + ' saves $' + diffUsd.toLocaleString() + '/mo vs ' + flagship.name + '.';
        winnerCtaEl.href = bestGpu.url;
        winnerCtaEl.textContent = '${escapeHtml(labels.ctaRentGpu)} →';
        winnerCtaEl.onclick = function() { recordAffiliateClick(bestGpu.affiliateId, bestGpu.monthlyUsd); };
      } else {
        const diffUsd = Number((bestGpu.monthlyUsd - flagship.monthlyUsd).toFixed(2));
        const diffThb = Math.round(diffUsd * fx);
        winnerNameEl.textContent = flagship.name + ' — $' + flagship.monthlyUsd.toLocaleString() + '/mo (฿' + flagship.monthlyThb.toLocaleString() + ')';
        winnerVerdictEl.textContent = APP_DATA.locale === 'th'
          ? 'หากปริมาณงานต่ำกว่า ' + bestGpu.breakEven.toLocaleString() + ' งาน/วัน การใช้ API จ่ายตามจริง (' + flagship.name + ') ประหยัดกว่าเช่า GPU รายชั่วโมงถึง ฿' + diffThb.toLocaleString() + '/เดือน'
          : 'Below ' + bestGpu.breakEven.toLocaleString() + ' tasks/day, pay-per-token API (' + flagship.name + ') is cheaper than renting dedicated GPUs by $' + diffUsd.toLocaleString() + '/mo.';
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
      btn.textContent = APP_DATA.locale === 'th' ? 'คัดลอกลิงก์พารามิเตอร์เรียบร้อย' : 'PERMALINK COPIED';
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
  <title>TELEMETRY &amp; DEMAND PROOF LEDGER // 100,000 THB TARGET</title>
  <style>${renderSharedStyles()}</style>
</head>
<body>
  <div class="shell">
    <header class="masthead">
      <a class="brand-mark" href="./th/index.html">TCO // BENCHMARK.26</a>
      <nav class="nav-bar">
        <a class="nav-link" href="./th/index.html">CALCULATOR (TH)</a>
        <a class="nav-link" href="./en/index.html">CALCULATOR (EN)</a>
        <a class="nav-link active" href="./validation-dashboard.html">TELEMETRY</a>
      </nav>
    </header>

    <section class="hero-block">
      <div class="kicker">CENTRALIZED LIVE TELEMETRY // GLOBAL + LOCAL FUNNEL</div>
      <h1>Demand Validation &amp; Revenue Proof Ledger</h1>
      <p class="lead">ระบบวัดผลผู้เข้าชมจริงจากทั่วโลกแบบรวมศูนย์ (Centralized Live Counter) เพื่อพิสูจน์อัตราการคำนวณ (Interaction Rate) และอัตราคลิกลิงก์พาร์ทเนอร์ (Affiliate CTR) ก่อนขยายระบบ</p>
    </section>

    <section class="standalone-section" style="border-color:var(--line-strong);">
      <div class="section-tag">
        <span>01 // VERDICT STATUS</span>
        <span id="telemetry-source">SOURCE: GLOBAL LIVE COUNTER</span>
      </div>
      <div class="verdict-title" id="verdict-code">LOADING...</div>
      <p class="verdict-copy" id="verdict-desc">กำลังดึงสถิติรวมจากผู้เข้าชมทั้งหมด...</p>
    </section>

    <div class="ledger-frame">
      <aside class="panel-left">
        <div class="section-tag"><span>02 // CONTROLS</span><span>TEST HARNESS</span></div>
        <p style="font-size:0.84rem; color:var(--ink-secondary); margin-top:0;">ระบบจะดึงยอดผู้เข้าชมจริงรวมจาก Global Counter โดยอัตโนมัติ หรือสามารถกดจำลองทราฟฟิก 60 คนในเครื่องเพื่อทดสอบสมการตัดสินผลได้</p>
        <button class="btn-primary" style="width:100%; margin-bottom:10px;" type="button" onclick="simulateSmokeTestBatch()">SIMULATE 60 VISITORS (LOCAL)</button>
        <button class="btn-outline" type="button" onclick="clearLocalTelemetry()">SWITCH TO LIVE GLOBAL DATA</button>
      </aside>

      <main class="panel-right">
        <div class="table-block">
          <div class="section-tag"><span>03 // FUNNEL METRICS</span><span>THRESHOLD BENCHMARK</span></div>
          <table>
            <tbody>
              <tr><td>Unique Visitor Sessions</td><td class="num mono-val" id="m-sessions">0</td></tr>
              <tr><td>Total Page Views</td><td class="num mono-val" id="m-views">0</td></tr>
              <tr><td>Active Calculator Runs</td><td class="num mono-val" id="m-calcs">0</td></tr>
              <tr><td>Calculator Interaction Rate (Target &ge; 15.0%)</td><td class="num mono-val" id="m-ir">0.0%</td></tr>
              <tr><td>Outbound Affiliate Clicks</td><td class="num mono-val" id="m-clicks">0</td></tr>
              <tr><td>Affiliate Click-Through Rate (Target &ge; 2.5%)</td><td class="num mono-val" id="m-ctr">0.0%</td></tr>
              <tr><td>Clicks by Partner Program</td><td class="num mono-val" id="m-byprog">-</td></tr>
              <tr><td>Projected Commission (at 8% conversion)</td><td class="num mono-val" id="m-proj">$0 (฿0)</td></tr>
              <tr><td>Monthly Visitors Needed for 100,000 THB/mo</td><td class="num mono-val" id="m-req-vis">12,500</td></tr>
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
            rukcom: localEvents.filter(function(e){return e.affiliateId==='rukcom';}).length
          }
        ));
        return;
      }

      document.getElementById('telemetry-source').textContent = 'SOURCE: GLOBAL LIVE COUNTER';
      const [u, views, calcs, shares, cAiml, cRunpod, cCw, cVercel, cHa, cRuk] = await Promise.all([
        getGlobalKey('unique_sessions'),
        getGlobalKey('page_views'),
        getGlobalKey('calculation_runs'),
        getGlobalKey('scenarios_shared'),
        getGlobalKey('aff_aimlapi'),
        getGlobalKey('aff_runpod'),
        getGlobalKey('aff_cloudways'),
        getGlobalKey('aff_vercel'),
        getGlobalKey('aff_hostatom'),
        getGlobalKey('aff_rukcom')
      ]);

      renderReport(computeFromCounts(u, views, calcs, shares, {
        aimlapi: cAiml,
        runpod: cRunpod,
        cloudways: cCw,
        vercel: cVercel,
        hostatom: cHa,
        rukcom: cRuk
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
      let th = 'เก็บข้อมูลผู้เข้าชมจริงจากทั่วโลกได้ ' + u + '/50 คนแรก แนะนำให้นำลิงก์ไปโพสต์ตามชุดข้อความใน validation-kit.md เพื่อให้ครบ 50 คนแรก';
      if (u >= 50 && ir >= 0.15 && ctr >= 0.025) {
        verdict = 'PROVEN_GO_SCALE';
        th = 'ผ่านเกณฑ์! อัตราการคำนวณ (' + (ir*100).toFixed(1) + '%) และอัตราคลิก Affiliate (' + (ctr*100).toFixed(1) + '%) พิสูจน์แล้วว่ามีคนใช้และคลิกจริง คุ้มค่าที่จะขยายทราฟฟิกสู่ ' + reqVis.toLocaleString() + ' คน/เดือน เพื่อแตะ 100,000 บาท/เดือน';
      } else if (u >= 50 && ir >= 0.15) {
        verdict = 'ITERATE_CTA';
        th = 'ผู้เข้าชมใช้งานเครื่องคำนวณสูง (' + (ir*100).toFixed(1) + '%) แต่อัตราคลิกลิงก์ Affiliate ยังต่ำกว่า 2.5% แนะนำปรับข้อความปุ่มก่อนขยายผล';
      } else if (u >= 50) {
        verdict = 'KILL_OR_PIVOT';
        th = 'อัตราการคำนวณต่ำกว่า 15% แนะนำสลับไปทดสอบโมเดลที่ 2 โดยยังไม่ต้องเสียเงินจดโดเมน';
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
        if (i <= 4) list.push({ eventId: 'aff-' + i, sessionId: sid, eventType: 'affiliate_cta_click', locale: 'th', pageSlug: 'home', affiliateId: i % 2 === 0 ? 'cloudways' : 'runpod' });
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

1. **Cloudways ($50–$125 CPA per sale):** https://www.cloudways.com/en/web-hosting-affiliate-program.php
2. **RunPod (10% Recurring GPU Spend via PartnerStack):** https://www.runpod.io/ (PartnerStack network)
3. **AI/ML API (30% Recurring Lifetime):** https://aimlapi.com/affiliate-program
4. **Vercel (30% Recurring + $5/lead):** https://vercel.com/partners
5. **Hostatom Thailand (Up to 25% Commission):** https://www.hostatom.com/affiliate/
6. **Ruk-Com Cloud Thailand (10–20% Commission):** https://ruk-com.in.th/affiliate/

To update any partner code and rebuild:
\`\`\`bash
node src/cli-affiliate.ts <partner_id> <your_affiliate_code>
\`\`\`

---

## Part 2: Launch Copy for Real-User Smoke Test (First 50–200 Visitors)

### Thai Developer / AI Communities (Facebook / Pantip)
**หัวข้อ:** ทำตารางคำนวณต้นทุน AI API (10 โมเดล) เทียบกับจุดคุ้มทุนเช่า GPU รายชั่วโมง (RunPod) และ Cloud VPS ไทย คิดเป็นเงินบาทให้ใช้ฟรีครับ

**เนื้อหา:**
ทำหน้าตารางคำนวณแบบ Minimal (ไม่มีโฆษณา) สำหรับเทียบต้นทุนจริงเวลาทำระบบ AI ที่มี Prompt Caching หรือ Agent เรียกซ้ำหลายรอบต่อ 1 งาน ว่าจุดไหนใช้ API จ่ายตาม Token คุ้มกว่า และจุดไหนควรเช่า GPU แยก:
${baseUrl}/th/index.html

### Reddit (r/LocalLLaMA / r/SideProject) & Hacker News (Show HN)
**Title:** Show HN: Minimal LLM API vs. Dedicated GPU Break-Even Ledger (2026 pricing, prompt caching, agent loops)

**Body:**
Built a clean, zero-dependency tabular cost calculator covering 10 frontier/open models and 6 dedicated GPU tiers (RTX 4090 to 2x A100 160GB), factoring in prompt cache hit rates and sequential agent loop multipliers:
${baseUrl}/en/index.html
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
  <title>TCO // BENCHMARK.26 — AI &amp; Cloud Unit Economics Ledger</title>
</head>
<body>
  <p><a href="./th/index.html">THAI LEDGER</a> | <a href="./en/index.html">ENGLISH LEDGER</a></p>
</body>
</html>`;
  fs.writeFileSync(path.join(stagingDir, 'index.html'), rootRedirectHtml, 'utf8');

  const locales: Locale[] = ['en', 'th'];
  for (const locale of locales) {
    const homeHtml = renderCalculatorPage(
      locale,
      'home',
      locale === 'th'
        ? 'ตารางคำนวณต้นทุน AI API เทียบกับเช่า Cloud GPU และ VPS (2026)'
        : 'AI API vs. Cloud GPU & VPS Unit Economics Ledger (2026)',
      locale === 'th'
        ? 'คำนวณค่าใช้จ่าย Claude, GPT-4o, Gemini, DeepSeek, Llama, Qwen เทียบกับจุดคุ้มทุนการเช่า GPU RunPod และ Cloud VPS ไทย'
        : 'Precision LLM API vs. dedicated Cloud GPU break-even calculator with prompt caching, multi-step agent loops, and VPS benchmarks.',
      locale === 'th'
        ? 'ตารางคำนวณต้นทุน AI API เทียบกับจุดคุ้มทุน Cloud GPU และ VPS'
        : 'AI API vs. Dedicated GPU Break-Even Ledger',
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

  const llmsTxt = `# TCO // BENCHMARK.26 — AI, Cloud GPU & VPS Cost Ledger (EN / TH)
> Precision break-even calculator covering 10 LLM APIs, 6 dedicated Cloud GPU tiers, 6 Cloud VPS tiers, and 5 production workload archetypes (${totalHtmlPages} bilingual pages).

- English Index: ${publicBaseUrl}/en/index.html
- Thai Index: ${publicBaseUrl}/th/index.html
- Telemetry Ledger: ${publicBaseUrl}/validation-dashboard.html
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
