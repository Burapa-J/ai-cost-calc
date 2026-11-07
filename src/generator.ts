import fs from 'node:fs';
import path from 'node:path';
import { calculateCostComparison, sanitizeWorkloadInput } from './calculator.ts';
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
      --bg: #0b1020;
      --card: #131b33;
      --card-border: #253259;
      --text: #f1f5f9;
      --muted: #94a3b8;
      --accent: #38bdf8;
      --emerald: #10b981;
      --amber: #f59e0b;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Thai", sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .container { max-width: 1140px; margin: 0 auto; padding: 24px 16px 64px; }
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .brand { font-weight: 800; font-size: 1.2rem; color: #fff; letter-spacing: -0.02em; }
    .nav-links { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .pill {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 999px;
      background: var(--card);
      border: 1px solid var(--card-border);
      color: var(--text);
      font-size: 0.875rem;
      font-weight: 600;
    }
    .pill.active { background: var(--accent); color: #0f172a; border-color: var(--accent); }
    h1 { font-size: 1.9rem; margin: 0 0 8px; line-height: 1.25; }
    .subtitle { color: var(--muted); margin-bottom: 24px; font-size: 1.02rem; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1.25fr; gap: 20px; }
    @media (max-width: 860px) { .grid-2 { grid-template-columns: 1fr; } }
    .card {
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .control-group { margin-bottom: 16px; }
    .control-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.92rem;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .control-val { color: var(--accent); font-family: monospace; font-size: 1rem; }
    input[type="range"] { width: 100%; accent-color: var(--accent); cursor: pointer; }
    .winner-banner {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.16), rgba(56, 189, 248, 0.12));
      border: 1px solid var(--emerald);
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 18px;
    }
    .winner-badge {
      display: inline-block;
      background: var(--emerald);
      color: #052e16;
      font-weight: 800;
      font-size: 0.76rem;
      padding: 3px 10px;
      border-radius: 99px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .cta-btn {
      display: inline-block;
      background: var(--emerald);
      color: #042f2e;
      font-weight: 800;
      padding: 10px 18px;
      border-radius: 8px;
      margin-top: 10px;
      border: none;
      cursor: pointer;
      text-decoration: none;
    }
    .cta-btn:hover { filter: brightness(1.1); text-decoration: none; }
    .cta-secondary {
      background: transparent;
      color: var(--accent);
      border: 1px solid var(--accent);
      padding: 8px 14px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    table { width: 100%; border-collapse: collapse; font-size: 0.92rem; margin-top: 10px; }
    th, td {
      text-align: left;
      padding: 10px 8px;
      border-bottom: 1px solid var(--card-border);
    }
    th { color: var(--muted); font-weight: 600; font-size: 0.82rem; text-transform: uppercase; }
    .price-usd { font-weight: 700; color: #fff; font-family: monospace; }
    .price-thb { color: var(--amber); font-family: monospace; font-size: 0.86rem; }
    .seo-links {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 10px;
      margin-top: 12px;
    }
    .seo-link-card {
      display: block;
      padding: 10px 12px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      font-size: 0.88rem;
    }
    .preset-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .preset-btn {
      background: rgba(56, 189, 248, 0.12);
      color: var(--accent);
      border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 0.82rem;
      cursor: pointer;
    }
  `;
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
  isComparisonSubpage: boolean
): string {
  const initialWorkload = sanitizeWorkloadInput(presetInput);
  const initialCalc = calculateCostComparison(initialWorkload, affiliateConfig, pageSlug);
  const rootPrefix = isComparisonSubpage ? '../..' : '..';
  const alternateLang: Locale = locale === 'en' ? 'th' : 'en';
  const alternatePath = isComparisonSubpage
    ? `${rootPrefix}/${alternateLang}/compare/${pageSlug}.html`
    : `${rootPrefix}/${alternateLang}/index.html`;

  const labels =
    locale === 'th'
      ? {
          subtitle:
            'คำนวณต้นทุนจริง AI API (พร้อมส่วนลด Prompt Caching & Agent หลายขั้นตอน) เทียบกับการเช่า Cloud GPU และ Cloud VPS ไทย/สากล',
          workloadTitle: '1. ปรับปริมาณงานของคุณ (Interactive Workload)',
          presetStartup: 'แชทบอทธุรกิจ (1,500 งาน/วัน)',
          presetAgent: 'ระบบ AI Agent หลายขั้นตอน (5,000 งาน/วัน)',
          presetHigh: 'สเกลองค์กร (25,000 งาน/วัน)',
          reqLabel: 'จำนวนงานต่อวัน (Tasks / Day)',
          agentLabel: 'จำนวนรอบที่ Agent เรียกโมเดลต่อ 1 งาน (Agent Steps)',
          inTokLabel: 'Input Tokens ต่อรอบ (Prompt + RAG Context)',
          outTokLabel: 'Output Tokens ต่อรอบ (Response)',
          cacheLabel: 'สัดส่วน Prompt Caching Hit (%)',
          hoursLabel: 'ชั่วโมงที่เปิดเครื่อง GPU ต่อวัน (Active GPU Hours/Day)',
          shareBtn: 'คัดลอกลิงก์ผลคำนวณนี้ (Share Scenario)',
          winnerTitle: 'คำแนะนำที่คุ้มที่สุดสำหรับปริมาณงานนี้',
          apiTableTitle: '2. ตารางเปรียบเทียบค่าใช้จ่าย LLM API รายเดือน',
          gpuTableTitle: '3. ตารางเช่า Cloud GPU (RunPod) และจุดคุ้มทุน (Break-Even)',
          vpsTableTitle: '4. ตาราง Cloud VPS & โฮสติ้งสำหรับระบบเว็บ/AI (ไทย & สากล)',
          colModel: 'ผู้ให้บริการ / โมเดล',
          colMonthly: 'ค่าใช้จ่าย / เดือน',
          colMetric: 'ต้นทุน / จุดคุ้มทุน',
          colAction: 'ลิงก์รับสิทธิ์ / ทดลองใช้',
          ctaTryApi: 'รับเครดิต Router 200+ โมเดล →',
          ctaRentGpu: 'เช่า GPU รายชั่วโมง →',
          ctaHostVps: 'ดูโปรโมชั่นเซิร์ฟเวอร์ →',
          faqTitle: 'คำถามที่พบบ่อย (FAQ)',
          directoryTitle: 'หน้าเปรียบเทียบและคำนวณเจาะลึก (Programmatic Calculators)'
        }
      : {
          subtitle:
            'Compare real monthly LLM API bills (factoring in Prompt Caching & Multi-Step Agent Loops) against Cloud GPU rental and Managed VPS hosting.',
          workloadTitle: '1. Configure Your AI Workload',
          presetStartup: 'SaaS Chatbot (1,500 tasks/day)',
          presetAgent: 'Autonomous Coding Agent (5,000 tasks/day)',
          presetHigh: 'Enterprise Production (25,000 tasks/day)',
          reqLabel: 'User Tasks / Day',
          agentLabel: 'Agent Loop Steps per Task',
          inTokLabel: 'Input Tokens per Step (Prompt + Context)',
          outTokLabel: 'Output Tokens per Step',
          cacheLabel: 'Prompt Cache Hit Ratio (%)',
          hoursLabel: 'Active GPU Rental Hours / Day',
          shareBtn: 'Copy Shareable Scenario Link',
          winnerTitle: 'Lowest TCO Recommendation',
          apiTableTitle: '2. Managed LLM API Monthly Cost Breakdown',
          gpuTableTitle: '3. Dedicated Cloud GPU Rental & Break-Even Volume',
          vpsTableTitle: '4. Managed Cloud VPS & AI App Hosting (Global & Thailand)',
          colModel: 'Provider / Spec',
          colMonthly: 'Monthly Cost (USD / THB)',
          colMetric: 'Unit Metric / Break-Even',
          colAction: 'Official Offer',
          ctaTryApi: 'Try Unified API →',
          ctaRentGpu: 'Deploy Cloud GPU →',
          ctaHostVps: 'View Hosting Deal →',
          faqTitle: 'Frequently Asked Questions',
          directoryTitle: 'All Interactive Comparison Calculators'
        };

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: title,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: metaDescription
  });

  const clientCatalogJson = JSON.stringify({
    models: LLM_MODELS,
    gpus: CLOUD_GPUS,
    vps: CLOUD_VPS_OPTIONS,
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
  <link rel="alternate" hreflang="${alternateLang}" href="${alternatePath}" />
  <script type="application/ld+json">${jsonLd}</script>
  <style>${renderSharedStyles()}</style>
</head>
<body>
  <div class="container">
    <header class="topbar">
      <a class="brand" href="${rootPrefix}/${locale}/index.html">⚡ AI &amp; Cloud ROI Calculator</a>
      <nav class="nav-links">
        <a class="pill ${locale === 'th' ? 'active' : ''}" href="${locale === 'th' ? '#' : alternatePath}" data-track="lang-switch">🇹🇭 ภาษาไทย</a>
        <a class="pill ${locale === 'en' ? 'active' : ''}" href="${locale === 'en' ? '#' : alternatePath}" data-track="lang-switch">🇺🇸 English</a>
        <a class="pill" href="${rootPrefix}/validation-dashboard.html">📊 Demand Proof Dashboard</a>
      </nav>
    </header>

    <h1>${escapeHtml(h1)}</h1>
    <p class="subtitle">${escapeHtml(labels.subtitle)}</p>

    <div class="grid-2">
      <section class="card">
        <h2 style="margin-top:0; font-size:1.2rem;">${escapeHtml(labels.workloadTitle)}</h2>
        <div class="preset-bar">
          <button type="button" class="preset-btn" onclick="applyPreset(1500, 2, 2000, 500, 45, 12)">${escapeHtml(labels.presetStartup)}</button>
          <button type="button" class="preset-btn" onclick="applyPreset(5000, 5, 3500, 800, 25, 10)">${escapeHtml(labels.presetAgent)}</button>
          <button type="button" class="preset-btn" onclick="applyPreset(25000, 4, 3000, 600, 30, 24)">${escapeHtml(labels.presetHigh)}</button>
        </div>

        <div class="control-group">
          <div class="control-header">
            <label for="inp-req">${escapeHtml(labels.reqLabel)}</label>
            <span class="control-val" id="val-req">${initialWorkload.requestsPerDay.toLocaleString()}</span>
          </div>
          <input id="inp-req" type="range" min="50" max="50000" step="50" value="${initialWorkload.requestsPerDay}" />
        </div>

        <div class="control-group">
          <div class="control-header">
            <label for="inp-steps">${escapeHtml(labels.agentLabel)}</label>
            <span class="control-val" id="val-steps">${initialWorkload.agentSteps}x</span>
          </div>
          <input id="inp-steps" type="range" min="1" max="15" step="1" value="${initialWorkload.agentSteps}" />
        </div>

        <div class="control-group">
          <div class="control-header">
            <label for="inp-intok">${escapeHtml(labels.inTokLabel)}</label>
            <span class="control-val" id="val-intok">${initialWorkload.inputTokensPerReq.toLocaleString()}</span>
          </div>
          <input id="inp-intok" type="range" min="200" max="20000" step="100" value="${initialWorkload.inputTokensPerReq}" />
        </div>

        <div class="control-group">
          <div class="control-header">
            <label for="inp-outtok">${escapeHtml(labels.outTokLabel)}</label>
            <span class="control-val" id="val-outtok">${initialWorkload.outputTokensPerReq.toLocaleString()}</span>
          </div>
          <input id="inp-outtok" type="range" min="100" max="4000" step="50" value="${initialWorkload.outputTokensPerReq}" />
        </div>

        <div class="control-group">
          <div class="control-header">
            <label for="inp-cache">${escapeHtml(labels.cacheLabel)}</label>
            <span class="control-val" id="val-cache">${Math.round(initialWorkload.cacheHitRate * 100)}%</span>
          </div>
          <input id="inp-cache" type="range" min="0" max="90" step="5" value="${Math.round(initialWorkload.cacheHitRate * 100)}" />
        </div>

        <div class="control-group">
          <div class="control-header">
            <label for="inp-hours">${escapeHtml(labels.hoursLabel)}</label>
            <span class="control-val" id="val-hours">${initialWorkload.activeHoursPerDay}h</span>
          </div>
          <input id="inp-hours" type="range" min="1" max="24" step="1" value="${initialWorkload.activeHoursPerDay}" />
        </div>

        <button type="button" class="cta-secondary" id="btn-share" onclick="copyScenarioLink()">🔗 ${escapeHtml(labels.shareBtn)}</button>
      </section>

      <section>
        <div class="winner-banner" id="winner-box">
          <span class="winner-badge">${escapeHtml(labels.winnerTitle)}</span>
          <h3 id="winner-name" style="margin:4px 0; font-size:1.35rem;">${escapeHtml(initialCalc.recommendedWinner.name)} — $${initialCalc.recommendedWinner.monthlyUsd.toLocaleString()}/mo (฿${initialCalc.recommendedWinner.monthlyThb.toLocaleString()})</h3>
          <p id="winner-verdict" style="margin:6px 0; color:#e2e8f0;">${escapeHtml(initialCalc.recommendedWinner.verdict[locale])}</p>
          <a id="winner-cta" class="cta-btn" href="${escapeHtml(initialCalc.recommendedWinner.affiliateUrl)}" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick('${initialCalc.recommendedWinner.affiliateId}', ${initialCalc.recommendedWinner.monthlyUsd})">
            ${initialCalc.recommendedWinner.category === 'cloud_gpu' ? escapeHtml(labels.ctaRentGpu) : escapeHtml(labels.ctaTryApi)}
          </a>
        </div>

        <div class="card">
          <h3 style="margin-top:0;">${escapeHtml(labels.apiTableTitle)}</h3>
          <table>
            <thead>
              <tr>
                <th>${escapeHtml(labels.colModel)}</th>
                <th>${escapeHtml(labels.colMonthly)}</th>
                <th>${escapeHtml(labels.colMetric)}</th>
                <th>${escapeHtml(labels.colAction)}</th>
              </tr>
            </thead>
            <tbody id="api-tbody">
              ${initialCalc.apiOptions
                .map(
                  (api) => `<tr>
                    <td><strong>${escapeHtml(api.name)}</strong><br/><small style="color:var(--muted)">${escapeHtml(api.provider)}</small></td>
                    <td><span class="price-usd">$${api.monthlyUsd.toLocaleString()}</span><br/><span class="price-thb">฿${api.monthlyThb.toLocaleString()}</span></td>
                    <td>$${api.costPer1kTasksUsd}/1k tasks</td>
                    <td><a href="${escapeHtml(api.affiliateUrl)}" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick('${api.affiliateId}', ${api.monthlyUsd})">${escapeHtml(labels.ctaTryApi)}</a></td>
                  </tr>`
                )
                .join('\n')}
            </tbody>
          </table>
        </div>

        <div class="card">
          <h3 style="margin-top:0;">${escapeHtml(labels.gpuTableTitle)}</h3>
          <table>
            <thead>
              <tr>
                <th>${escapeHtml(labels.colModel)}</th>
                <th>${escapeHtml(labels.colMonthly)}</th>
                <th>${escapeHtml(labels.colMetric)}</th>
                <th>${escapeHtml(labels.colAction)}</th>
              </tr>
            </thead>
            <tbody id="gpu-tbody">
              ${initialCalc.gpuOptions
                .map(
                  (gpu) => `<tr>
                    <td><strong>${escapeHtml(gpu.name)}</strong><br/><small style="color:var(--muted)">${gpu.instancesNeeded}x instance (${gpu.vramGb}GB VRAM)</small></td>
                    <td><span class="price-usd">$${gpu.monthlyUsd.toLocaleString()}</span><br/><span class="price-thb">฿${gpu.monthlyThb.toLocaleString()}</span></td>
                    <td>Break-even: ${gpu.breakEvenTasksPerDayVsFlagshipApi.toLocaleString()} tasks/day</td>
                    <td><a href="${escapeHtml(gpu.affiliateUrl)}" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick('${gpu.affiliateId}', ${gpu.monthlyUsd})">${escapeHtml(labels.ctaRentGpu)}</a></td>
                  </tr>`
                )
                .join('\n')}
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <section class="card">
      <h3 style="margin-top:0;">${escapeHtml(labels.vpsTableTitle)}</h3>
      <table>
        <thead>
          <tr>
            <th>${escapeHtml(labels.colModel)}</th>
            <th>${escapeHtml(labels.colMonthly)}</th>
            <th>${escapeHtml(labels.colMetric)}</th>
            <th>${escapeHtml(labels.colAction)}</th>
          </tr>
        </thead>
        <tbody>
          ${initialCalc.vpsOptions
            .map(
              (vps) => `<tr>
                <td><strong>${escapeHtml(vps.name)}</strong></td>
                <td><span class="price-usd">$${vps.monthlyUsd.toLocaleString()}/mo</span><br/><span class="price-thb">฿${vps.monthlyThb.toLocaleString()}/เดือน</span></td>
                <td>${vps.vcpu} vCPU / ${vps.ramGb}GB RAM (${vps.region.toUpperCase()})</td>
                <td><a href="${escapeHtml(vps.affiliateUrl)}" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick('${vps.affiliateId}', ${vps.monthlyUsd})">${escapeHtml(labels.ctaHostVps)}</a></td>
              </tr>`
            )
            .join('\n')}
        </tbody>
      </table>
    </section>

    ${
      faqList.length > 0
        ? `<section class="card">
            <h3 style="margin-top:0;">${escapeHtml(labels.faqTitle)}</h3>
            ${faqList
              .map(
                (item) => `<div style="margin-bottom:14px;">
                  <strong>Q: ${escapeHtml(item.q[locale])}</strong>
                  <p style="margin:4px 0 0; color:var(--muted);">${escapeHtml(item.a[locale])}</p>
                </div>`
              )
              .join('\n')}
          </section>`
        : ''
    }

    <section class="card">
      <h3 style="margin-top:0;">${escapeHtml(labels.directoryTitle)} (${allPages.length})</h3>
      <div class="seo-links">
        ${allPages
          .map(
            (p) =>
              `<a class="seo-link-card" href="${rootPrefix}/${locale}/compare/${p.slug}.html">${escapeHtml(p.h1[locale])}</a>`
          )
          .join('\n')}
      </div>
    </section>
  </div>

  <script>
    const APP_DATA = ${clientCatalogJson};
    const STORAGE_KEY = 'ai_cost_calc_telemetry_v1';

    function getSessionId() {
      let sid = localStorage.getItem('ai_cost_calc_sid');
      if (!sid) {
        sid = 'sess-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now();
        localStorage.setItem('ai_cost_calc_sid', sid);
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
        return '<tr><td><strong>' + r.name + '</strong><br/><small style="color:var(--muted)">' + r.provider + '</small></td>' +
          '<td><span class="price-usd">$' + r.monthlyUsd.toLocaleString() + '</span><br/><span class="price-thb">฿' + r.monthlyThb.toLocaleString() + '</span></td>' +
          '<td>$' + r.per1k + '/1k tasks</td>' +
          '<td><a href="' + r.url + '" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick(\\'' + r.affiliateId + '\\', ' + r.monthlyUsd + ')">${escapeHtml(labels.ctaTryApi)}</a></td></tr>';
      }).join('');

      document.getElementById('gpu-tbody').innerHTML = gpuRows.map(function(g) {
        return '<tr><td><strong>' + g.name + '</strong><br/><small style="color:var(--muted)">' + g.instances + 'x instance (' + g.vramGb + 'GB VRAM)</small></td>' +
          '<td><span class="price-usd">$' + g.monthlyUsd.toLocaleString() + '</span><br/><span class="price-thb">฿' + g.monthlyThb.toLocaleString() + '</span></td>' +
          '<td>Break-even: ' + g.breakEven.toLocaleString() + ' tasks/day</td>' +
          '<td><a href="' + g.url + '" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick(\\'' + g.affiliateId + '\\', ' + g.monthlyUsd + ')">${escapeHtml(labels.ctaRentGpu)}</a></td></tr>';
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
        winnerCtaEl.textContent = '${escapeHtml(labels.ctaRentGpu)}';
        winnerCtaEl.onclick = function() { recordAffiliateClick(bestGpu.affiliateId, bestGpu.monthlyUsd); };
      } else {
        const diffUsd = Number((bestGpu.monthlyUsd - flagship.monthlyUsd).toFixed(2));
        const diffThb = Math.round(diffUsd * fx);
        winnerNameEl.textContent = flagship.name + ' — $' + flagship.monthlyUsd.toLocaleString() + '/mo (฿' + flagship.monthlyThb.toLocaleString() + ')';
        winnerVerdictEl.textContent = APP_DATA.locale === 'th'
          ? 'หากปริมาณงานต่ำกว่า ' + bestGpu.breakEven.toLocaleString() + ' งาน/วัน การใช้ API จ่ายตามจริง (' + flagship.name + ') ประหยัดกว่าเช่า GPU รายชั่วโมงถึง ฿' + diffThb.toLocaleString() + '/เดือน'
          : 'Below ' + bestGpu.breakEven.toLocaleString() + ' tasks/day, pay-per-token API (' + flagship.name + ') is cheaper than renting dedicated GPUs by $' + diffUsd.toLocaleString() + '/mo.';
        winnerCtaEl.href = flagship.url;
        winnerCtaEl.textContent = '${escapeHtml(labels.ctaTryApi)}';
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
      btn.textContent = APP_DATA.locale === 'th' ? '✅ คัดลอกลิงก์แล้ว!' : '✅ Scenario Link Copied!';
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
  <title>Demand Validation &amp; Revenue Proof Dashboard (100,000 THB/mo Tracker)</title>
  <style>${renderSharedStyles()}</style>
</head>
<body>
  <div class="container">
    <header class="topbar">
      <a class="brand" href="./th/index.html">⚡ AI &amp; Cloud ROI Calculator</a>
      <nav class="nav-links">
        <a class="pill" href="./th/index.html">🇹🇭 หน้าเครื่องคำนวณ (TH)</a>
        <a class="pill" href="./en/index.html">🇺🇸 Calculator (EN)</a>
        <a class="pill active" href="./validation-dashboard.html">📊 Demand Proof Dashboard</a>
      </nav>
    </header>

    <h1>📊 ระบบพิสูจน์ความต้องการตลาดจริง (Demand Validation Dashboard)</h1>
    <p class="subtitle">วัดผลการใช้งานจริงจากผู้เข้าชม (Visitors → การเลื่อนสไลเดอร์คำนวณ → การคลิกลิงก์ Affiliate) เพื่อตัดสินใจแบบมีหลักฐานก่อนจดโดเมนหรือสร้างแอป iOS</p>

    <div class="winner-banner" id="verdict-banner">
      <span class="winner-badge" id="verdict-code">LOADING...</span>
      <h2 id="verdict-title" style="margin:6px 0;">กำลังประมวลผลข้อมูล Telemetry...</h2>
      <p id="verdict-desc" style="margin:4px 0;"></p>
    </div>

    <div class="grid-2">
      <div class="card">
        <h3 style="margin-top:0;">ตัวชี้วัดหลัก (Real-User Funnel Metrics)</h3>
        <table>
          <tbody>
            <tr><td>จำนวนผู้เข้าชมไม่ซ้ำ (Unique Sessions)</td><td class="price-usd" id="m-sessions">0</td></tr>
            <tr><td>จำนวนการเปิดหน้าเว็บทั้งหมด (Page Views)</td><td class="price-usd" id="m-views">0</td></tr>
            <tr><td>จำนวนครั้งที่ผู้ใช้ปรับตัวเลขคำนวณจริง (Calculator Interactions)</td><td class="price-usd" id="m-calcs">0</td></tr>
            <tr><td>อัตราส่วนคนที่ใช้งานเครื่องคิดเลขจริง (Interaction Rate — เกณฑ์ &ge; 15%)</td><td class="price-thb" id="m-ir">0%</td></tr>
            <tr><td>จำนวนคลิกลิงก์รับค่าคอม Affiliate (Affiliate CTA Clicks)</td><td class="price-usd" id="m-clicks">0</td></tr>
            <tr><td>อัตราคลิกลิงก์ทำเงิน (Affiliate CTR — เกณฑ์ &ge; 2.5%)</td><td class="price-thb" id="m-ctr">0%</td></tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3 style="margin-top:0;">สมการสู่รายได้ 100,000 บาท/เดือน (Unit Economics)</h3>
        <table>
          <tbody>
            <tr><td>คลิกแยกตามพาร์ทเนอร์ (RunPod / AI-ML API / Cloudways / VPS ไทย)</td><td id="m-byprog">-</td></tr>
            <tr><td>รายได้คาดการณ์จากทราฟฟิกชุดนี้ (สมมติ Conversion 8% ของคลิก)</td><td class="price-usd" id="m-proj">$0 (฿0)</td></tr>
            <tr><td>จำนวนผู้เข้าชมต่อเดือนที่ต้องใช้เพื่อแตะ <strong>100,000 บาท/เดือน</strong></td><td class="price-thb" id="m-req-vis">12,500 คน/เดือน</td></tr>
          </tbody>
        </table>
        <div style="margin-top:16px; display:flex; gap:10px; flex-wrap:wrap;">
          <button class="cta-btn" type="button" onclick="simulateSmokeTestBatch()">🧪 จำลองทราฟฟิกทดสอบ 60 คน (Test Thresholds)</button>
          <button class="cta-secondary" type="button" onclick="clearLocalTelemetry()">ล้างข้อมูลจำลอง</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const AFF_CFG = ${cfgJson};
    const STORAGE_KEY = 'ai_cost_calc_telemetry_v1';

    async function loadEvents() {
      try {
        const res = await fetch('/api/validation-report');
        if (res.ok) {
          const serverReport = await res.json();
          if (serverReport && serverReport.totalPageViews > 0) {
            renderReport(serverReport);
            return;
          }
        }
      } catch (_) {}

      const localEvents = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      renderReport(computeClientReport(localEvents));
    }

    function computeClientReport(events) {
      const sessions = new Set();
      let views = 0, calcs = 0, shares = 0, clicks = 0;
      const byProg = { aimlapi: 0, runpod: 0, cloudways: 0, vercel: 0, hostatom: 0, rukcom: 0 };

      events.forEach(function(e) {
        if (e.sessionId) sessions.add(e.sessionId);
        if (e.eventType === 'page_view') views++;
        if (e.eventType === 'calculation_run') calcs++;
        if (e.eventType === 'scenario_shared') shares++;
        if (e.eventType === 'affiliate_cta_click') {
          clicks++;
          if (e.affiliateId && byProg[e.affiliateId] !== undefined) byProg[e.affiliateId]++;
        }
      });

      const u = sessions.size;
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
      let th = 'เก็บข้อมูลผู้ใช้จริงได้ ' + u + '/50 คนแรก แนะนำให้นำลิงก์เครื่องคำนวณไปโพสต์ในกลุ่มนักพัฒนา 2–3 แห่งเพื่อสรุปผล';
      if (u >= 50 && ir >= 0.15 && ctr >= 0.025) {
        verdict = 'PROVEN_GO_SCALE';
        th = 'พิสูจน์แล้วว่ามีคนใช้งานและคลิกจริง! อัตราการคำนวณ (' + (ir*100).toFixed(1) + '%) และอัตราคลิก Affiliate (' + (ctr*100).toFixed(1) + '%) ผ่านเกณฑ์ คุ้มค่าที่จะจดโดเมนและขยายผลสู่ 100,000 บาท/เดือน';
      } else if (u >= 50 && ir >= 0.15) {
        verdict = 'ITERATE_CTA';
        th = 'คนชอบใช้เครื่องคิดเลข (' + (ir*100).toFixed(1) + '%) แต่คลิกลิงก์ Affiliate ยังต่ำกว่า 2.5% แนะนำปรับปุ่มเป็นคูปองเครดิตฟรีก่อนขยายผล';
      } else if (u >= 50) {
        verdict = 'KILL_OR_PIVOT';
        th = 'อัตราการคำนวณต่ำกว่าเกณฑ์ แนะนำสลับไปทดสอบโมเดลที่ 2 โดยยังไม่ต้องเสียเงินจดโดเมน';
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
      document.getElementById('verdict-title').textContent =
        r.verdict === 'PROVEN_GO_SCALE' ? '✅ ผ่านเกณฑ์! พิสูจน์แล้วว่ามีคนใช้และคลิกลิงก์ทำเงินจริง' :
        r.verdict === 'INSUFFICIENT_DATA' ? '⏳ รอเก็บทราฟฟิกทดสอบให้ครบ 50 คนแรก' : '⚠️ ต้องปรับปรุงก่อนขยายผล';
      document.getElementById('verdict-desc').textContent = r.explanation.th;
      document.getElementById('m-sessions').textContent = r.uniqueSessions.toLocaleString();
      document.getElementById('m-views').textContent = r.totalPageViews.toLocaleString();
      document.getElementById('m-calcs').textContent = r.calculatorInteractions.toLocaleString();
      document.getElementById('m-ir').textContent = (r.interactionRate * 100).toFixed(1) + '%';
      document.getElementById('m-clicks').textContent = r.affiliateCtaClicks.toLocaleString();
      document.getElementById('m-ctr').textContent = (r.affiliateCtr * 100).toFixed(1) + '%';
      document.getElementById('m-byprog').textContent = JSON.stringify(r.clicksByProgram);
      document.getElementById('m-proj').textContent = '$' + r.projectedMonthlyRevenueUsdAtCurrentCtr + ' (฿' + r.projectedMonthlyRevenueThbAtCurrentCtr.toLocaleString() + ')';
      document.getElementById('m-req-vis').textContent = r.requiredMonthlyVisitorsFor100kThb.toLocaleString() + ' คน/เดือน';
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
      loadEvents();
    }

    function clearLocalTelemetry() {
      localStorage.removeItem(STORAGE_KEY);
      loadEvents();
    }

    loadEvents();
  </script>
</body>
</html>`;
}

function renderValidationKitMarkdown(baseUrl: string, pageCount: number): string {
  return `# ชุดพิสูจน์ตลาดจริง 48 ชั่วโมง (Zero-Cost Demand Validation Kit)

เป้าหมาย: พิสูจน์ว่ามีคนเข้ามาคำนวณจริง (` + '`Interaction Rate >= 15%`' + `) และกดคลิกลิงก์ผู้ให้บริการจริง (` + '`Affiliate CTR >= 2.5%`' + `) โดยใช้ทุน **$0** ก่อนตัดสินใจจดโดเมนหรือทำแอป iOS

- จำนวนหน้าเว็บที่ระบบสร้างอัตโนมัติ (EN + TH): **${pageCount} หน้า**
- หน้าตรวจสอบผลลัพธ์แบบเรียลไทม์: \`${baseUrl}/validation-dashboard.html\`

---

## 1. โพสต์สำหรับกลุ่มนักพัฒนาไทย / AI / Cloud (Facebook Groups / Pantip / Dev Community)

**หัวข้อ:** ทำเว็บคำนวณราคา AI API (Claude / GPT-4o / Gemini / DeepSeek) เทียบกับเช่า GPU RunPod + Cloud VPS ไทย คิดเป็นเงินบาทให้ใช้ฟรีครับ

**เนื้อหา:**
ช่วงนี้เห็นหลายคนลังเลว่าทำโปรเจกต์ AI หรือระบบ Agent ที่เรียกโมเดลหลายๆ รอบต่อ 1 งาน ควรจ่ายเป็น Token (API) เปิด Prompt Caching หรือเช่าการ์ดจอแยก (เช่น RTX 4090 / A100 บน RunPod) ตอนไหนถึงจะคุ้มกว่ากัน?

ผมเลยทำเครื่องคิดเลขหน้าเดียวที่ปรับตัวแปรพวก:
- จำนวนงาน/วัน + จำนวนรอบ Agent Step
- สัดส่วน Prompt Caching (%)
- ชั่วโมงเปิดใช้งาน GPU จริงต่อวัน
แล้วคำนวณจุดคุ้มทุน (Break-even) ออกมาเป็นเงินบาทและดอลลาร์ให้ทันที (กดคัดลอกลิงก์ผลคำนวณส่งให้ทีมดูต่อได้ด้วยครับ)

ลองไปเลื่อนปรับตัวเลขเล่นกันได้ที่นี่ครับ (ใช้ฟรี ไม่มีโฆษณา):
👉 ${baseUrl}/th/index.html

---

## 2. โพสต์สำหรับ Reddit (r/LocalLLaMA / r/SideProject) & Hacker News (Show HN)

**Title:** Show HN: Interactive LLM API vs. Cloud GPU Break-Even Calculator (with Prompt Caching & Agent Loop multiplier)

**Body:**
Most LLM token calculators only multiply \`input_tokens * price\`, ignoring the two variables that actually swing production bills in 2026:
1. **Multi-step autonomous agent loops** (1 user prompt triggering 3–10 sequential LLM calls).
2. **Prompt caching hit rates** vs. **active GPU utilization hours/day** on rented GPUs (RunPod RTX 4090 / A100 / H100).

I built a lightweight, zero-dependency static calculator where you can slide daily tasks, agent steps, cache hit ratio, and active GPU hours to see the exact daily task volume where renting a dedicated GPU beats managed APIs (and share a deep-linked scenario URL).

Live calculator: ${baseUrl}/en/index.html
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
  <title>AI, Cloud GPU &amp; SaaS Cost Calculator Hub (TH / EN)</title>
</head>
<body>
  <p><a href="./th/index.html">เข้าสู่หน้าภาษาไทย (TH)</a> | <a href="./en/index.html">Enter English Version (EN)</a></p>
</body>
</html>`;
  fs.writeFileSync(path.join(stagingDir, 'index.html'), rootRedirectHtml, 'utf8');

  const locales: Locale[] = ['en', 'th'];
  for (const locale of locales) {
    const homeHtml = renderCalculatorPage(
      locale,
      'home',
      locale === 'th'
        ? 'คำนวณราคา AI API vs เช่า Cloud GPU & VPS ไทย (2026) — เครื่องมือคำนวณจุดคุ้มทุน'
        : 'AI API vs Cloud GPU & SaaS Hosting Cost Calculator (2026 Break-Even Tool)',
      locale === 'th'
        ? 'คำนวณค่าใช้จ่าย Claude, GPT-4o, Gemini, DeepSeek API เทียบกับเช่า GPU RunPod และ Cloud VPS ไทย พร้อมคำนวณส่วนลด Prompt Caching และ Agent Loop'
        : 'Interactive LLM API vs Cloud GPU rental break-even calculator with Prompt Caching, Multi-Step Agent Loops, and Managed Cloud VPS comparisons.',
      locale === 'th'
        ? 'เครื่องคำนวณต้นทุน AI API vs Cloud GPU & โฮสติ้ง (คิดเป็นเงินบาท & USD)'
        : 'AI API vs. Cloud GPU & Cloud Hosting True Break-Even Calculator',
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
      false
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
        true
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

  const llmsTxt = `# AI, Cloud GPU & SaaS Cost Calculator Hub (EN / TH)
> Interactive break-even calculator for LLM APIs (Claude 3.7 Sonnet, GPT-4o, Gemini 2.5 Flash, DeepSeek R1/V3), Cloud GPUs (RunPod RTX 4090, A100, H100), and Cloud VPS hosting (Cloudways, Vercel, Hostatom, Ruk-Com).

- English Calculator: ${publicBaseUrl}/en/index.html
- Thai Calculator: ${publicBaseUrl}/th/index.html
- Sitemap (${sitemapUrls.length} URLs): ${publicBaseUrl}/sitemap.xml
`;
  fs.writeFileSync(path.join(stagingDir, 'llms.txt'), llmsTxt, 'utf8');

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
