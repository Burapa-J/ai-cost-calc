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
  LLM_MODELS,
  type Locale,
  type PlaybookGuideSpec,
  type ProgrammaticComparisonPageSpec,
  type WorkloadInput
} from './domain.ts';
import { buildProgrammaticPagesCatalog } from './pages-catalog.ts';
import {
  buildPlaybooksCatalog,
  renderHomeVisualArchitectureStrip,
  renderPlaybookSvg,
  renderSpecificMatchupCard
} from './playbooks-catalog.ts';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderFaviconSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" rx="8" fill="#1D1D1F"/>
  <rect x="6" y="18" width="4" height="8" rx="1.5" fill="#60A5FA"/>
  <rect x="12" y="13" width="4" height="13" rx="1.5" fill="#0066CC"/>
  <rect x="18" y="8" width="4" height="18" rx="1.5" fill="#34D399"/>
  <path d="M5 12 H27" stroke="#FBBF24" stroke-width="2" stroke-linecap="round" stroke-dasharray="2.5 2.5"/>
  <circle cx="18" cy="12" r="3" fill="#10B981" stroke="#1D1D1F" stroke-width="1.2"/>
</svg>`;
}

function renderBrandLogoMarkup(): string {
  return `<svg class="brand-logo-svg" viewBox="0 0 28 28" width="24" height="24" role="img" aria-label="TCO Benchmark Logo"><rect width="28" height="28" rx="7" fill="#1D1D1F"/><rect x="5" y="15" width="3.5" height="7.5" rx="1.2" fill="#60A5FA"/><rect x="10.5" y="11" width="3.5" height="11.5" rx="1.2" fill="#3B82F6"/><rect x="16" y="6.5" width="3.5" height="16" rx="1.2" fill="#34D399"/><path d="M4.5 10.5 H23.5" stroke="#FBBF24" stroke-width="1.7" stroke-linecap="round" stroke-dasharray="2 2"/><circle cx="16" cy="10.5" r="2.6" fill="#10B981" stroke="#1D1D1F" stroke-width="1"/></svg><span>TCO // BENCHMARK.26</span>`;
}

function renderSharedStyles(isCompareSubpage = false): string {
  const extraStyles = isCompareSubpage
    ? ''
    : `
    .visual-trio-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 24px;
    }
    @media (max-width: 860px) {
      .visual-trio-grid { grid-template-columns: 1fr; }
    }
    .visual-card {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 18px 20px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.02);
      transition: transform 0.3s var(--ease-out);
    }
    .visual-card:hover {
      transform: translateY(-2px);
    }
    .visual-svg-wrap {
      background: #F8FAFC;
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 12px;
      padding: 6px 8px;
      margin-bottom: 12px;
    }
    .playbook-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
      gap: 16px;
      margin-top: 14px;
    }
    .playbook-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 20px 22px;
      color: var(--ink);
      transition: transform 0.25s var(--ease-out), border-color 0.25s var(--ease-out), box-shadow 0.25s var(--ease-out);
    }
    .playbook-card:hover {
      transform: translateY(-3px);
      border-color: var(--accent);
      box-shadow: 0 10px 28px rgba(0, 102, 204, 0.08);
      opacity: 1;
    }
    .playbook-badge {
      display: inline-block;
      font-family: var(--mono);
      font-size: 0.68rem;
      font-weight: 600;
      color: var(--accent);
      background: #EFF6FF;
      padding: 3px 9px;
      border-radius: 999px;
      margin-bottom: 10px;
      width: fit-content;
    }
    .playbook-title {
      font-size: 1.02rem;
      font-weight: 600;
      color: var(--ink);
      margin: 0 0 8px;
      line-height: 1.38;
    }
    .playbook-takeaway {
      font-size: 0.83rem;
      color: var(--ink-secondary);
      margin: 0 0 14px;
      line-height: 1.5;
    }
    .guide-takeaway {
      background: #F0FDF4;
      border: 1px solid #86EFAC;
      border-radius: 16px;
      padding: 18px 22px;
      margin: 20px 0 24px;
      font-size: 0.95rem;
      color: #14532D;
      font-weight: 500;
    }
    .guide-step {
      background: var(--surface-alt);
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 14px;
    }
    .guide-step-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--ink);
      margin: 0 0 6px;
    }
    .guide-code {
      background: #1D1D1F;
      color: #F5F5F7;
      padding: 14px 16px;
      border-radius: 10px;
      font-family: var(--mono);
      font-size: 0.78rem;
      overflow-x: auto;
      margin: 12px 0 0;
      line-height: 1.5;
    }
    .stack-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 14px;
      margin-top: 14px;
    }
    .stack-card {
      background: var(--surface-alt);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 10px;
    }`;
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
      display: inline-flex;
      align-items: center;
      gap: 9px;
      font-weight: 600;
      color: var(--ink);
      letter-spacing: -0.01em;
      font-size: 0.9rem;
    }
    .brand-logo-svg {
      flex-shrink: 0;
      display: block;
    }
    .nav-bar {
      display: flex;
      gap: 20px;
      align-items: center;
      flex-wrap: wrap;
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
      padding: 44px 0 26px;
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
      font-size: clamp(1.9rem, 3.5vw, 2.85rem);
      font-weight: 600;
      letter-spacing: -0.032em;
      line-height: 1.12;
      margin: 0 0 14px;
      max-width: 28ch;
      color: var(--ink);
    }
    .lead {
      color: var(--ink-secondary);
      font-size: 1.04rem;
      line-height: 1.58;
      max-width: 66ch;
      margin: 0;
      font-weight: 400;
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
    .matchup-spotlight {
      margin-top: 22px;
      background: var(--surface);
      border: 1px solid var(--line-strong);
      border-radius: 20px;
      padding: 24px 26px;
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.03);
    }
    .matchup-decision-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }
    @media (max-width: 780px) {
      .matchup-decision-grid { grid-template-columns: 1fr; }
    }
    .decision-box {
      background: var(--surface-alt);
      border-radius: 14px;
      padding: 16px 18px;
    }
    .decision-badge {
      font-size: 0.86rem;
      font-weight: 600;
      color: var(--ink);
      margin-bottom: 6px;
    }
    .ledger-frame {
      display: grid;
      grid-template-columns: 370px 1fr;
      gap: 24px;
      margin-top: 24px;
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
      padding: 26px 28px;
      border-radius: 20px;
      background: var(--surface);
      border: 1px solid var(--line);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.03);
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .verdict-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }
    .verdict-meta { max-width: 60ch; }
    .verdict-title {
      font-size: 1.42rem;
      font-weight: 600;
      letter-spacing: -0.025em;
      margin: 4px 0 8px;
      font-variant-numeric: tabular-nums;
      color: var(--ink);
    }
    .verdict-copy {
      font-size: 0.9rem;
      color: var(--ink-secondary);
      margin: 0;
      line-height: 1.55;
    }
    .live-chart-box {
      background: #F8FAFC;
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 14px;
      padding: 14px 16px;
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
    ${extraStyles}
  `
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,])\s*/g, '$1')
    .trim();
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

function renderPlaybookCardsSection(
  locale: Locale,
  playbooks: PlaybookGuideSpec[],
  guidesPrefix: string,
  includeSvgPreview = true
): string {
  const isTh = locale === 'th';
  if (!includeSvgPreview) {
    return `<section class="standalone-section" id="playbooks"><div class="section-tag"><span>${isTh ? 'คู่มือจัดสเปกตามงานจริง (AI PLAYBOOKS)' : 'PRACTICAL AI PLAYBOOKS'}</span><a href="../index.html#playbooks">${isTh ? 'ดูครบ 5 คู่มือ →' : 'All 5 Guides →'}</a></div><div class="index-grid">${playbooks
      .map(
        (pb) =>
          `<a class="index-cell" href="${guidesPrefix}/${pb.slug}.html"><span>${escapeHtml(pb.title[locale])}</span><span style="color:var(--accent);">→</span></a>`
      )
      .join('')}</div></section>`;
  }
  return `<section class="standalone-section" id="playbooks">
    <div class="section-tag">
      <span>${isTh ? 'คู่มือจัดสเปกและสูตรลดต้นทุนตามงานจริง (PRACTICAL AI PLAYBOOKS)' : 'PRACTICAL AI ARCHITECTURE & COST PLAYBOOKS'}</span>
      <span>${isTh ? 'เนื้อล้วน • มีภาพผังระบบ & ตัวเลขจริง' : 'ZERO FLUFF • VISUAL BLUEPRINTS'}</span>
    </div>
    <div class="playbook-grid">
      ${playbooks
        .map(
          (pb) => `<a class="playbook-card" href="${guidesPrefix}/${pb.slug}.html">
            <div>
              <span class="playbook-badge">${escapeHtml(pb.badge[locale])}</span>
              <div style="margin:6px 0 12px; border-radius:10px; overflow:hidden;">
                ${renderPlaybookSvg(pb.svgType, locale)}
              </div>
              <h3 class="playbook-title">${escapeHtml(pb.title[locale])}</h3>
              <p class="playbook-takeaway">${escapeHtml(pb.keyTakeaway[locale])}</p>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; font-weight:600; color:var(--accent); border-top:1px solid var(--line); padding-top:10px;">
              <span>${escapeHtml(pb.readTime[locale])}</span>
              <span>${isTh ? 'อ่านคู่มือและดูสูตรจัดสเปก →' : 'Read Blueprint →'}</span>
            </div>
          </a>`
        )
        .join('\n')}
    </div>
  </section>`;
}

function renderPlaybookGuidePage(
  locale: Locale,
  guide: PlaybookGuideSpec,
  allPlaybooks: PlaybookGuideSpec[],
  allPages: ProgrammaticComparisonPageSpec[],
  affiliateConfig: AffiliateConfigFile,
  publicBaseUrl: string
): string {
  const isTh = locale === 'th';
  const rootPrefix = '../..';
  const alternateLang: Locale = locale === 'en' ? 'th' : 'en';
  const alternatePath = `${rootPrefix}/${alternateLang}/guides/${guide.slug}.html`;
  const canonicalUrl = `${publicBaseUrl}/${locale}/guides/${guide.slug}.html`;

  const w = sanitizeWorkloadInput(guide.presetWorkload);
  const calcQuery = `req=${w.requestsPerDay}&steps=${w.agentSteps}&inTok=${w.inputTokensPerReq}&outTok=${w.outputTokensPerReq}&cache=${Math.round(w.cacheHitRate * 100)}&hours=${w.activeHoursPerDay}`;
  const calculatorLink = `../index.html?${calcQuery}`;

  const gscMeta = affiliateConfig.googleSiteVerification
    ? `\n  <meta name="google-site-verification" content="${escapeHtml(affiliateConfig.googleSiteVerification)}" />`
    : '';

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        headline: guide.h1[locale],
        description: guide.metaDescription[locale],
        url: canonicalUrl
      },
      {
        '@type': 'FAQPage',
        mainEntity: guide.faq.map((item) => ({
          '@type': 'Question',
          name: item.q[locale],
          acceptedAnswer: { '@type': 'Answer', text: item.a[locale] }
        }))
      }
    ]
  });

  const otherPlaybooks = allPlaybooks.filter((p) => p.slug !== guide.slug);

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(guide.title[locale])}</title>
  <meta name="description" content="${escapeHtml(guide.metaDescription[locale])}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <link rel="alternate" hreflang="${alternateLang}" href="${alternatePath}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(guide.title[locale])}" />
  <meta property="og:description" content="${escapeHtml(guide.metaDescription[locale])}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />${gscMeta}
  <link rel="icon" type="image/svg+xml" href="${rootPrefix}/favicon.svg" />
  <script type="application/ld+json">${jsonLd}</script>
  <style>${renderSharedStyles(false)}</style>
</head>
<body>
  <div class="nav-glass">
    <header class="masthead">
      <a class="brand-mark" href="${rootPrefix}/${locale}/index.html">${renderBrandLogoMarkup()}</a>
      <nav class="nav-bar">
        <a class="nav-link" href="${rootPrefix}/${locale}/index.html">${isTh ? 'เครื่องคำนวณงบ AI' : 'Calculator'} (${allPages.length})</a>
        <a class="nav-link active" href="${rootPrefix}/${locale}/index.html#playbooks">${isTh ? 'คู่มือจัดสเปก (5)' : 'Playbooks (5)'}</a>
        <a class="nav-link ${locale === 'th' ? 'active' : ''}" href="${locale === 'th' ? '#' : alternatePath}">ภาษาไทย</a>
        <a class="nav-link ${locale === 'en' ? 'active' : ''}" href="${locale === 'en' ? '#' : alternatePath}">English</a>
      </nav>
    </header>
  </div>

  <div class="shell">
    <section class="hero-block">
      <div class="kicker">${escapeHtml(guide.badge[locale])} • ${escapeHtml(guide.readTime[locale])}</div>
      <h1 style="max-width:32ch;">${escapeHtml(guide.h1[locale])}</h1>
      <div class="guide-takeaway">
        ${escapeHtml(guide.keyTakeaway[locale])}
      </div>
      <div style="margin: 22px 0;">
        ${renderPlaybookSvg(guide.svgType, locale)}
      </div>
      <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center; margin-top:18px;">
        <a class="btn-primary" href="${calculatorLink}">
          ${isTh ? 'โหลดสเปกนี้เข้าเครื่องคำนวณเพื่อปรับตัวเลขจริง →' : 'Load This Scenario in Interactive Calculator →'}
        </a>
        <a class="action-link" href="${rootPrefix}/${locale}/index.html#playbooks" style="padding:10px 14px;">
          ${isTh ? '← ดูคู่มือจัดสเปกทั้งหมด 5 เรื่อง' : '← All 5 Architecture Playbooks'}
        </a>
      </div>
    </section>

    <section class="table-block">
      <div class="section-tag">
        <span>${isTh ? 'ตารางเปรียบเทียบตัวเลขจริง' : 'EMPIRICAL BENCHMARK & COST MATRIX'}</span>
        <span>2026 VERIFIED DATA</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>${escapeHtml(guide.comparisonHeaders.colA[locale])}</th>
            <th class="num">${escapeHtml(guide.comparisonHeaders.colB[locale])}</th>
            <th class="num">${escapeHtml(guide.comparisonHeaders.colC[locale])}</th>
            <th>${escapeHtml(guide.comparisonHeaders.colD[locale])}</th>
          </tr>
        </thead>
        <tbody>
          ${guide.comparisonRows
            .map(
              (r) => `<tr>
                <td><span class="mono-val">${escapeHtml(r.item[locale])}</span></td>
                <td class="num"><span class="mono-val">${escapeHtml(r.colB)}</span></td>
                <td class="num"><span class="savings-val">${escapeHtml(r.colC)}</span></td>
                <td style="padding-left:18px; color:var(--ink-secondary); font-size:0.84rem;">${escapeHtml(r.verdict[locale])}</td>
              </tr>`
            )
            .join('\n')}
        </tbody>
      </table>
    </section>

    <section class="standalone-section">
      <div class="section-tag">
        <span>${isTh ? 'ขั้นตอนการตั้งค่าใช้งานจริง (STEP-BY-STEP RECIPE)' : 'ACTIONABLE IMPLEMENTATION STEPS'}</span>
        <span>COPY &amp; DEPLOY</span>
      </div>
      ${guide.steps
        .map(
          (st) => `<div class="guide-step">
            <h2 class="guide-step-title">${escapeHtml(st.title[locale])}</h2>
            <p class="benefit-desc">${escapeHtml(st.detail[locale])}</p>
            ${st.codeSnippet ? `<pre class="guide-code"><code>${escapeHtml(st.codeSnippet)}</code></pre>` : ''}
          </div>`
        )
        .join('\n')}
    </section>

    <section class="standalone-section">
      <div class="section-tag">
        <span>${isTh ? 'ชุดเครื่องมือและผู้ให้บริการที่แนะนำสำหรับสูตรนี้' : 'RECOMMENDED PRODUCTION STACK FOR THIS PLAYBOOK'}</span>
        <span>VERIFIED PARTNERS</span>
      </div>
      <div class="stack-grid">
        ${guide.recommendedStack
          .map((item) => {
            const affUrl = resolveAffiliateUrl(affiliateConfig, item.affiliateId, `${guide.slug}-${item.itemSlug}`);
            return `<div class="stack-card">
              <div>
                <div class="kicker" style="margin-bottom:4px;">${escapeHtml(item.role[locale])}</div>
                <div class="mono-val" style="font-size:0.95rem; margin-bottom:6px;">${escapeHtml(item.name)}</div>
                <div class="sub-val" style="color:var(--ledger-green); font-weight:600;">${escapeHtml(item.priceNote[locale])}</div>
              </div>
              <a class="btn-primary" style="text-align:center; width:100%;" href="${escapeHtml(affUrl)}" target="_blank" rel="noopener sponsored" onclick="fetch('https://abacus.jasoncameron.dev/hit/burapa_ai_cost_calc_live/aff_${item.affiliateId}',{mode:'cors'}).catch(function(){});">
                ${escapeHtml(item.ctaLabel[locale])}
              </a>
            </div>`;
          })
          .join('\n')}
      </div>
    </section>

    <section class="standalone-section">
      <div class="section-tag"><span>${isTh ? 'คำถามที่พบบ่อย' : 'FREQUENTLY ASKED QUESTIONS'}</span><span>FAQ</span></div>
      ${guide.faq
        .map(
          (f) => `<div style="margin-bottom:14px;">
            <div style="font-weight:600; font-size:0.94rem;">${escapeHtml(f.q[locale])}</div>
            <p style="margin:6px 0 0; color:var(--ink-secondary); font-size:0.88rem;">${escapeHtml(f.a[locale])}</p>
          </div>`
        )
        .join('\n')}
    </section>

    ${renderPlaybookCardsSection(locale, otherPlaybooks, '.')}

    <footer id="affiliate-disclosure" style="padding:20px 0 40px; border-top:1px solid var(--line); color:var(--ink-muted); font-size:0.78rem; line-height:1.55; margin-top:24px;">
      ${
        isTh
          ? 'การเปิดเผยข้อมูลพาร์ทเนอร์ (Affiliate Disclosure): เว็บไซต์นี้มีลิงก์แนะนำบริการคลาวด์, API และชุดคำสั่ง AI (รวมถึง Agensi.io, RunPod, Novita AI และผู้ให้บริการ VPS) ซึ่งผู้จัดทำอาจได้รับค่าคอมมิชชันเมื่อคุณสมัครหรือสั่งซื้อผ่านลิงก์ดังกล่าว โดยที่คุณไม่เสียค่าใช้จ่ายเพิ่มใดๆ'
          : 'Affiliate Disclosure: Some links on this page (including Agensi.io, RunPod, Novita AI, and cloud hosting providers) are affiliate links. We may earn a commission at no extra cost to you if you sign up or make a purchase through them.'
      }
    </footer>
  </div>
</body>
</html>`.replace(/\n[ \t]+/g, '\n');
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
  allPlaybooks: PlaybookGuideSpec[],
  affiliateConfig: AffiliateConfigFile,
  isComparisonSubpage: boolean,
  publicBaseUrl: string,
  currentSpec?: ProgrammaticComparisonPageSpec
): string {
  const initialWorkload = sanitizeWorkloadInput(presetInput);
  const initialCalc = calculateCostComparison(initialWorkload, affiliateConfig, pageSlug);
  const rootPrefix = isComparisonSubpage ? '../..' : '..';
  const guidesPrefix = isComparisonSubpage ? '../guides' : './guides';
  const alternateLang: Locale = locale === 'en' ? 'th' : 'en';
  const alternatePath = isComparisonSubpage
    ? `${rootPrefix}/${alternateLang}/compare/${pageSlug}.html`
    : `${rootPrefix}/${alternateLang}/index.html`;

  const relatedPages = selectRelatedSpecs(pageSlug, allPages, !isComparisonSubpage);
  const maxInitialApiUsd = Math.max(...initialCalc.apiOptions.map((a) => a.monthlyUsd), 1);

  const cheapestInitial = initialCalc.apiOptions[0];
  const flagshipInitial =
    initialCalc.apiOptions.find((a) => a.modelId === 'claude-3-7-sonnet') ??
    initialCalc.apiOptions[initialCalc.apiOptions.length - 1];
  const bestGpuInitial = initialCalc.gpuOptions[0];
  const chartMaxInitial = Math.max(
    cheapestInitial.monthlyUsd,
    flagshipInitial.monthlyUsd,
    bestGpuInitial.monthlyUsd,
    1
  );
  const wCheapInit = Math.max(12, Math.round((cheapestInitial.monthlyUsd / chartMaxInitial) * 240));
  const wFlagInit = Math.max(12, Math.round((flagshipInitial.monthlyUsd / chartMaxInitial) * 240));
  const wGpuInit = Math.max(12, Math.round((bestGpuInitial.monthlyUsd / chartMaxInitial) * 240));

  const labels =
    locale === 'th'
      ? {
          kicker: 'TCO // BENCHMARK.26 — เครื่องมือคำนวณงบและจัดสเปก AI ตามงานจริง',
          subtitle:
            'เทียบให้เห็นด้วยภาพและตัวเลขจริงว่างานของคุณควรจ่ายตาม Token (รวมทุกโมเดลในบิลเดียว) หรือเช่า GPU เหมาชั่วโมง พร้อมคู่มือจัดสเปกเฉพาะทางที่คัดเฉพาะเนื้อๆ ไปใช้งานได้ทันที',
          b1Title: 'จ่ายที่เดียวจบ ไม่ต้องแยกหลายบิล',
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
          winnerTag: 'คำตอบฟันธงที่ประหยัดและคุ้มค่าที่สุดสำหรับคุณ',
          liveChartTitle: 'กราฟเปรียบเทียบรายจ่ายต่อเดือนแบบเรียลไทม์ (ขยับปุ่มด้านซ้ายเพื่อดูจุดตัด)',
          apiTableTag: '1. แบบจ่ายตามที่ใช้จริง (รวมทุกโมเดลในบิลเดียว ไม่ต้องดูแลเครื่อง)',
          gpuTableTag: '2. แบบเช่าเครื่องส่วนตัวรายชั่วโมง (เหมาะกับงานหนัก ล็อกงบรายเดือนนิ่ง)',
          vpsTableTag: '3. เซิร์ฟเวอร์สำหรับรันหน้าเว็บและระบบหลังบ้าน (ไทย & ต่างประเทศ)',
          skillsTableTag: '4. ชุดคำสั่งเสริมช่วยให้ AI ประหยัดโควต้าและทำงานจบไวขึ้น (Agensi.io)',
          colModel: 'ตัวเลือก / ประโยชน์ที่ได้รับจริง',
          colMonthly: 'ค่าใช้จ่าย / เดือน',
          colMetric: 'ความคุ้มค่า / จุดตัด',
          colAction: 'รายละเอียด',
          ctaTryApi: 'ดูวิธีรวมบิลที่เดียว',
          ctaRentGpu: 'ดูสเปกเครื่องเช่า',
          ctaHostVps: 'ดูแพ็กเกจเซิร์ฟเวอร์',
          ctaSkill: 'ดูชุดคำสั่งลดโควต้า',
          faqTag: 'คำถามและเทคนิคจากการใช้งานจริง',
          directoryTag: isComparisonSubpage
            ? 'เปรียบเทียบเคสอื่นๆ ที่ใกล้เคียงกัน'
            : `รวมหน้าคำนวณแยกตามรูปแบบงานจริง (${allPages.length} รูปแบบ)`
        }
      : {
          kicker: 'TCO // BENCHMARK.26 — VISUAL AI COST & ARCHITECTURE PLANNER',
          subtitle:
            'See visually whether pay-as-you-go APIs or flat hourly GPUs cost less for your workload—complete with zero-fluff architecture blueprints and token-saving recipes.',
          b1Title: 'One-Stop Billing, Zero Juggling',
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
          liveChartTitle: 'Real-Time Monthly Cost Comparison (Drag Sliders to See Crossover)',
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
          faqTag: 'Practical Questions & Recipes',
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

  const heroVisualContent =
    isComparisonSubpage && currentSpec
      ? renderSpecificMatchupCard(currentSpec, locale, affiliateConfig)
      : renderHomeVisualArchitectureStrip(locale);

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
  <link rel="icon" type="image/svg+xml" href="${rootPrefix}/favicon.svg" />
  <script type="application/ld+json">${jsonLd}</script>
  <style>${renderSharedStyles(isComparisonSubpage)}</style>
</head>
<body>
  <div class="nav-glass">
    <header class="masthead">
      <a class="brand-mark" href="${rootPrefix}/${locale}/index.html">${renderBrandLogoMarkup()}</a>
      <nav class="nav-bar">
        <a class="nav-link" href="${rootPrefix}/${locale}/index.html">${locale === 'th' ? 'คำนวณงบ' : 'Models'} (${allPages.length})</a>
        <a class="nav-link" href="#playbooks">${locale === 'th' ? 'คู่มือจัดสเปก (5)' : 'Playbooks (5)'}</a>
        <a class="nav-link ${locale === 'th' ? 'active' : ''}" href="${locale === 'th' ? '#' : alternatePath}">ภาษาไทย</a>
        <a class="nav-link ${locale === 'en' ? 'active' : ''}" href="${locale === 'en' ? '#' : alternatePath}">English</a>
      </nav>
    </header>
  </div>

  <div class="shell">
    <section class="hero-block">
      <div class="kicker">${escapeHtml(labels.kicker)} • ${escapeHtml(labels.b1Title)}</div>
      <h1>${escapeHtml(h1)}</h1>
      <p class="lead">${escapeHtml(labels.subtitle)}</p>
      ${heroVisualContent}
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
          <div class="verdict-top">
            <div class="verdict-meta">
              <div class="kicker" style="margin-bottom:4px;">${escapeHtml(labels.winnerTag)}</div>
              <div class="verdict-title" id="winner-name">${escapeHtml(initialCalc.recommendedWinner.name)} — $${initialCalc.recommendedWinner.monthlyUsd.toLocaleString()}/mo (฿${initialCalc.recommendedWinner.monthlyThb.toLocaleString()})</div>
              <p class="verdict-copy" id="winner-verdict">${escapeHtml(initialCalc.recommendedWinner.verdict[locale])}</p>
            </div>
            <a id="winner-cta" class="btn-primary" href="${escapeHtml(initialCalc.recommendedWinner.affiliateUrl)}" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick('${initialCalc.recommendedWinner.affiliateId}', ${initialCalc.recommendedWinner.monthlyUsd})">
              ${initialCalc.recommendedWinner.category === 'cloud_gpu' ? escapeHtml(labels.ctaRentGpu) : escapeHtml(labels.ctaTryApi)} →
            </a>
          </div>

          <div class="live-chart-box">
            <div style="font-size:0.74rem; font-weight:600; color:var(--ink-muted); margin-bottom:8px; text-transform:uppercase; letter-spacing:0.04em;">${escapeHtml(labels.liveChartTitle)}</div>
            <svg id="live-cost-curve-svg" viewBox="0 0 650 112" width="100%" height="auto" role="img" aria-label="Live Monthly Cost Visual Comparison">
              <text id="svg-lbl-cheap" x="8" y="26" font-family="SF Mono, monospace" font-size="10.5" font-weight="600" fill="#1D7D3F">1. ${escapeHtml(cheapestInitial.name)}</text>
              <rect id="svg-bar-cheap" x="225" y="13" width="${wCheapInit}" height="16" rx="4" fill="#1D7D3F"/>
              <text id="svg-val-cheap" x="${233 + wCheapInit}" y="26" font-family="SF Mono, monospace" font-size="11" font-weight="700" fill="#1D7D3F">$${cheapestInitial.monthlyUsd.toLocaleString()} (฿${cheapestInitial.monthlyThb.toLocaleString()})</text>

              <text id="svg-lbl-gpu" x="8" y="60" font-family="SF Mono, monospace" font-size="10.5" font-weight="600" fill="#0066CC">2. ${escapeHtml(bestGpuInitial.name.replace('RunPod NVIDIA ', 'RunPod '))}</text>
              <rect id="svg-bar-gpu" x="225" y="47" width="${wGpuInit}" height="16" rx="4" fill="#0066CC"/>
              <text id="svg-val-gpu" x="${233 + wGpuInit}" y="60" font-family="SF Mono, monospace" font-size="11" font-weight="700" fill="#0066CC">$${bestGpuInitial.monthlyUsd.toLocaleString()} (฿${bestGpuInitial.monthlyThb.toLocaleString()})</text>

              <text id="svg-lbl-flag" x="8" y="94" font-family="SF Mono, monospace" font-size="10.5" font-weight="600" fill="#B45309">3. ${escapeHtml(flagshipInitial.name)} (API)</text>
              <rect id="svg-bar-flag" x="225" y="81" width="${wFlagInit}" height="16" rx="4" fill="#D97706"/>
              <text id="svg-val-flag" x="${233 + wFlagInit}" y="94" font-family="SF Mono, monospace" font-size="11" font-weight="700" fill="#B45309">$${flagshipInitial.monthlyUsd.toLocaleString()} (฿${flagshipInitial.monthlyThb.toLocaleString()})</text>
            </svg>
          </div>
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

    ${renderPlaybookCardsSection(locale, allPlaybooks, guidesPrefix, !isComparisonSubpage)}

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

    <footer id="affiliate-disclosure" style="padding:20px 0 40px; border-top:1px solid var(--line); color:var(--ink-muted); font-size:0.78rem; line-height:1.55;">
      ${
        locale === 'th'
          ? 'การเปิดเผยข้อมูลพาร์ทเนอร์ (Affiliate Disclosure): เว็บไซต์นี้มีลิงก์แนะนำบริการคลาวด์, API และชุดคำสั่ง AI (รวมถึง Agensi.io, RunPod, Novita AI และผู้ให้บริการ VPS) ซึ่งผู้จัดทำอาจได้รับค่าคอมมิชชันเมื่อคุณสมัครหรือสั่งซื้อผ่านลิงก์ดังกล่าว โดยที่คุณไม่เสียค่าใช้จ่ายเพิ่มใดๆ'
          : 'Affiliate Disclosure: Some links on this page (including Agensi.io, RunPod, Novita AI, and cloud hosting providers) are affiliate links. We may earn a commission at no extra cost to you if you sign up or make a purchase through them.'
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
        const cleanHandle = code.replace(/^https?:\\/\\/(www\\.)?agensi\\.io\\/r\\//i, '').replace(/^agensi\\.io\\/r\\//i, '').replace(/^\\/?r\\//i, '').replace(/[^a-zA-Z0-9_-]/g, '') || 'YOUR_AGENSI_ID';
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
      const cheapest = apiRows[0];
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
      const chartMax = Math.max(cheapest.monthlyUsd, flagship.monthlyUsd, bestGpu.monthlyUsd, 1);
      const wCheap = Math.max(12, Math.round((cheapest.monthlyUsd / chartMax) * 240));
      const wGpu = Math.max(12, Math.round((bestGpu.monthlyUsd / chartMax) * 240));
      const wFlag = Math.max(12, Math.round((flagship.monthlyUsd / chartMax) * 240));

      const barCheap = document.getElementById('svg-bar-cheap');
      const valCheap = document.getElementById('svg-val-cheap');
      const barGpu = document.getElementById('svg-bar-gpu');
      const valGpu = document.getElementById('svg-val-gpu');
      const barFlag = document.getElementById('svg-bar-flag');
      const valFlag = document.getElementById('svg-val-flag');

      if (barCheap && valCheap) {
        document.getElementById('svg-lbl-cheap').textContent = '1. ' + cheapest.name;
        barCheap.setAttribute('width', String(wCheap));
        valCheap.setAttribute('x', String(233 + wCheap));
        valCheap.textContent = '$' + cheapest.monthlyUsd.toLocaleString() + ' (฿' + cheapest.monthlyThb.toLocaleString() + ')';
      }
      if (barGpu && valGpu) {
        document.getElementById('svg-lbl-gpu').textContent = '2. ' + bestGpu.name.replace('RunPod NVIDIA ', 'RunPod ');
        barGpu.setAttribute('width', String(wGpu));
        valGpu.setAttribute('x', String(233 + wGpu));
        valGpu.textContent = '$' + bestGpu.monthlyUsd.toLocaleString() + ' (฿' + bestGpu.monthlyThb.toLocaleString() + ')';
      }
      if (barFlag && valFlag) {
        document.getElementById('svg-lbl-flag').textContent = '3. ' + flagship.name + ' (API)';
        barFlag.setAttribute('width', String(wFlag));
        valFlag.setAttribute('x', String(233 + wFlag));
        valFlag.textContent = '$' + flagship.monthlyUsd.toLocaleString() + ' (฿' + flagship.monthlyThb.toLocaleString() + ')';
      }

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
</html>`
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .replace(/>\n+</g, '><');
}

function renderValidationKitMarkdown(baseUrl: string, pageCount: number): string {
  return `# Zero-Cost Demand Validation & Affiliate Onboarding Kit

- Total Generated Static Pages (EN + TH): **${pageCount} pages**
- Centralized Admin Command Center & Live Telemetry: \`https://www.xamathi.com/admin/?project=affiliate\`
- Public Website: \`${baseUrl}/\`

---

## Part 1: Direct Affiliate Signup Links (Update in \`config/affiliates.json\`)

1. **Agensi.io (90% Self-Referred Skill Sales + 20% 6-Month Affiliate — LIVE):** https://www.agensi.io/r/BURAPA
2. **Novita AI (10% Commission for 180 Days on 200+ Model APIs & Agent Sandbox):** https://novita.ai/affiliate-new
3. **Apify (20%–30% Recurring Commission on AI Agent & Scraping Cloud):** https://affiliate.apify.com/
4. **Cloudways ($50–$125 CPA per sale):** https://www.cloudways.com/en/partners/cloud-affiliate-program.php
5. **RunPod (10% Recurring GPU Spend via PartnerStack):** https://www.runpod.io/console/user/referrals
6. **Ruk-Com Cloud Thailand (33% First-Cycle Commission):** https://ruk-com.in.th/
7. **Hostatom Thailand (150–500 THB CPA):** https://www.hostatom.com/

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
  playbookPages: number;
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
  fs.mkdirSync(path.join(stagingDir, 'en', 'guides'), { recursive: true });
  fs.mkdirSync(path.join(stagingDir, 'th', 'guides'), { recursive: true });
  fs.writeFileSync(path.join(stagingDir, '.nojekyll'), '', 'utf8');
  fs.writeFileSync(path.join(stagingDir, 'favicon.svg'), renderFaviconSvg(), 'utf8');

  const catalog = buildProgrammaticPagesCatalog();
  const playbooks = buildPlaybooksCatalog();
  const sitemapUrls: string[] = [];

  const rootGscMeta = affiliateConfig.googleSiteVerification
    ? `\n  <meta name="google-site-verification" content="${escapeHtml(affiliateConfig.googleSiteVerification)}" />`
    : '';

  const rootRedirectHtml = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />${rootGscMeta}
  <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
  <meta http-equiv="refresh" content="0; url=./th/index.html" />
  <title>TCO // BENCHMARK.26 — Practical AI Cost &amp; Quota Planner</title>
</head>
<body>
  <p><a href="./th/index.html">ภาษาไทย</a> | <a href="./en/index.html">English</a></p>
</body>
</html>`;
  fs.writeFileSync(path.join(stagingDir, 'index.html'), rootRedirectHtml, 'utf8');
  fs.writeFileSync(
    path.join(stagingDir, 'google1cb6059c0c3279a4.html'),
    'google-site-verification: google1cb6059c0c3279a4.html',
    'utf8'
  );

  const locales: Locale[] = ['en', 'th'];
  for (const locale of locales) {
    const homeHtml = renderCalculatorPage(
      locale,
      'home',
      locale === 'th'
        ? 'วางแผนค่าใช้จ่าย AI และสูตรจัดสเปกตามงานจริง — เทียบ API vs. GPU (2026)'
        : 'Practical AI Cost & Architecture Planner — API vs. Hourly GPU (2026)',
      locale === 'th'
        ? 'เทียบด้วยภาพและตัวเลขจริงว่างานของคุณควรจ่ายตามที่ใช้จริงในบิลเดียว หรือเช่า GPU เหมาชั่วโมง พร้อม 5 คู่มือจัดสเปก AI สำหรับธุรกิจไทยและนักพัฒนา'
        : 'Visual benchmark and interactive calculator comparing single-bill LLM APIs vs. flat hourly GPUs, plus 5 actionable architecture playbooks.',
      locale === 'th'
        ? 'คำนวณงบ AI ตามงานจริง พร้อมผังจัดสเปกที่คัดแต่เนื้อๆ'
        : 'Zero-Fluff AI Cost Calculator & Architecture Playbooks',
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
      playbooks,
      affiliateConfig,
      false,
      publicBaseUrl
    );
    fs.writeFileSync(path.join(stagingDir, locale, 'index.html'), homeHtml, 'utf8');
    sitemapUrls.push(`${publicBaseUrl}/${locale}/index.html`);

    for (const guide of playbooks) {
      const guideHtml = renderPlaybookGuidePage(
        locale,
        guide,
        playbooks,
        catalog,
        affiliateConfig,
        publicBaseUrl
      );
      fs.writeFileSync(
        path.join(stagingDir, locale, 'guides', `${guide.slug}.html`),
        guideHtml,
        'utf8'
      );
      sitemapUrls.push(`${publicBaseUrl}/${locale}/guides/${guide.slug}.html`);
    }

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
        playbooks,
        affiliateConfig,
        true,
        publicBaseUrl,
        spec
      );
      fs.writeFileSync(
        path.join(stagingDir, locale, 'compare', `${spec.slug}.html`),
        subHtml,
        'utf8'
      );
      sitemapUrls.push(`${publicBaseUrl}/${locale}/compare/${spec.slug}.html`);
    }
  }

  const totalHtmlPages = 1 + locales.length * (1 + catalog.length + playbooks.length);

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((u) => `  <url><loc>${escapeHtml(u)}</loc></url>`).join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(stagingDir, 'sitemap.xml'), sitemapXml, 'utf8');
  fs.writeFileSync(path.join(stagingDir, 'sitemap.txt'), `${sitemapUrls.join('\n')}\n`, 'utf8');

  fs.writeFileSync(
    path.join(stagingDir, 'robots.txt'),
    `User-agent: *\nAllow: /\nSitemap: ${publicBaseUrl}/sitemap.xml\n`,
    'utf8'
  );

  const llmsTxt = `# TCO // BENCHMARK.26 — Practical AI Cost & Architecture Planner (EN / TH)
> Visual interactive calculator and 5 production AI architecture playbooks comparing single-bill LLM APIs, flat-rate hourly GPUs, managed servers, and token-saving Agent Skills (${totalHtmlPages} bilingual pages).

- English Planner: ${publicBaseUrl}/en/index.html
- Thai Planner: ${publicBaseUrl}/th/index.html
- Thai Tokenizer Benchmark Guide: ${publicBaseUrl}/th/guides/thai-tokenizer-cost-benchmark.html
- LINE OA + RAG Blueprint Guide: ${publicBaseUrl}/th/guides/line-oa-rag-chatbot-blueprint.html
- Claude Code & Cursor 60% Cost Cut Guide: ${publicBaseUrl}/th/guides/claude-code-cursor-cost-cut.html
- API to RunPod vLLM Migration Guide: ${publicBaseUrl}/th/guides/api-to-runpod-vllm-migration.html
- Thai VPS vs Global Cloud Guide: ${publicBaseUrl}/th/guides/thai-vps-vs-global-cloud-ai-backend.html
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

  const prototypeSourcePath = path.resolve(import.meta.dirname, 'prototype-th.html');
  if (fs.existsSync(prototypeSourcePath)) {
    fs.copyFileSync(prototypeSourcePath, path.join(stagingDir, 'th', 'prototype.html'));
  }

  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  fs.renameSync(stagingDir, outputDir);

  return {
    outputDir,
    totalHtmlPages,
    enComparisonPages: catalog.length,
    thComparisonPages: catalog.length,
    playbookPages: locales.length * playbooks.length,
    sitemapUrls: sitemapUrls.length
  };
}
