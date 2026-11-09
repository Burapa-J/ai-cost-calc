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
  type PlaybookGuideSpec,
  type ProgrammaticComparisonPageSpec,
  type WorkloadInput
} from './domain.ts';
import { buildProgrammaticPagesCatalog } from './pages-catalog.ts';
import {
  buildPlaybooksCatalog,
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
  <rect width="32" height="32" rx="6" fill="#141413"/>
  <rect x="6" y="18" width="4" height="8" rx="1" fill="#787670"/>
  <rect x="13" y="13" width="4" height="13" rx="1" fill="#A3A19A"/>
  <rect x="20" y="8" width="4" height="18" rx="1" fill="#EDEDEB"/>
</svg>`;
}

function renderBrandLogoMarkup(): string {
  return `<svg class="brand-logo-svg" viewBox="0 0 28 28" width="22" height="22" role="img" aria-label="TCO Benchmark Logo"><rect width="28" height="28" rx="5" fill="var(--text)"/><rect x="5" y="15" width="3.5" height="7.5" rx="1" fill="var(--bg)"/><rect x="10.5" y="11" width="3.5" height="11.5" rx="1" fill="var(--bg)"/><rect x="16" y="6.5" width="3.5" height="16" rx="1" fill="var(--bg)"/></svg><span>TCO // BENCHMARK.26</span>`;
}

const SELF_MODELS_CATALOG = [
  {
    id: '8b-q4',
    label: {
      th: '8B–14B Q4 (Typhoon2 / Qwen 14B)',
      en: '8B–14B Q4 (Typhoon2 / Qwen 14B)'
    },
    baseVramGb: 9,
    kvGbPer1kTok: 0.12,
    vllmModel: 'scb10x/typhoon2-qwen2.5-7b-instruct',
    tp: 1
  },
  {
    id: '32b-q4',
    label: {
      th: '32B Q4 (Qwen 2.5 Coder 32B / R1 32B)',
      en: '32B Q4 (Qwen 2.5 Coder 32B / R1 32B)'
    },
    baseVramGb: 19,
    kvGbPer1kTok: 0.22,
    vllmModel: 'Qwen/Qwen2.5-Coder-32B-Instruct-AWQ',
    tp: 1
  },
  {
    id: '70b-q4',
    label: {
      th: '70B Q4/AWQ (Llama 3.3 70B / Qwen 72B)',
      en: '70B Q4/AWQ (Llama 3.3 70B / Qwen 72B)'
    },
    baseVramGb: 41,
    kvGbPer1kTok: 0.35,
    vllmModel: 'casperhansen/llama-3.3-70b-instruct-awq',
    tp: 2
  },
  {
    id: '70b-fp16',
    label: {
      th: '70B FP16 เต็มความละเอียด (Unquantized)',
      en: '70B FP16 Full Precision (Unquantized)'
    },
    baseVramGb: 140,
    kvGbPer1kTok: 0.7,
    vllmModel: 'meta-llama/Llama-3.3-70B-Instruct',
    tp: 4
  }
] as const;

const BUY_HARDWARE_CATALOG = [
  {
    id: 'diy-rtx-4090',
    name: {
      th: 'ประกอบ PC RTX 4090 (24GB VRAM)',
      en: 'Custom PC RTX 4090 (24GB VRAM)'
    },
    priceThb: 95000,
    hourlyPowerThb: 1.9,
    vramGb: 24,
    warnIfInsufficient: true
  },
  {
    id: 'mac-mini-m4-pro',
    name: {
      th: 'Mac mini M4 Pro (64GB Unified Memory)',
      en: 'Mac mini M4 Pro (64GB Unified Memory)'
    },
    priceThb: 64900,
    hourlyPowerThb: 0.28,
    vramGb: 64,
    warnIfInsufficient: false
  },
  {
    id: 'mac-studio-ultra',
    name: {
      th: 'Mac Studio M2/M3 Ultra (192GB Unified)',
      en: 'Mac Studio M2/M3 Ultra (192GB Unified)'
    },
    priceThb: 159900,
    hourlyPowerThb: 0.5,
    vramGb: 192,
    warnIfInsufficient: false
  }
] as const;

const VPS_SUITABLE_FOR: Record<string, { th: string; en: string; brand: string; managed: boolean }> = {
  'hostatom-vps-4gb': {
    th: 'n8n + Webhook LINE OA + PostgreSQL ขนาดเล็ก',
    en: 'n8n + LINE OA Webhook + Lightweight PostgreSQL',
    brand: 'Hostatom',
    managed: true
  },
  'rukcom-managed-vps': {
    th: 'Docker + FastAPI + Qdrant Vector DB 100k หน้า + Redis',
    en: 'Docker + FastAPI + Qdrant Vector DB 100k docs + Redis',
    brand: 'Ruk-Com',
    managed: true
  },
  'hostatom-enterprise-16gb': {
    th: 'Production Multi-Agent Queue + PostgreSQL + Redis โหลดสูง',
    en: 'Production Multi-Agent Queue + High-Load PostgreSQL/Redis',
    brand: 'Hostatom',
    managed: true
  },
  'cloudways-do-4gb': {
    th: 'Docker + FastAPI เริ่มต้น + Staging Environment',
    en: 'Starter Docker + FastAPI + Staging Environment',
    brand: 'Cloudways',
    managed: false
  },
  'cloudways-vultr-8gb': {
    th: 'Docker + FastAPI + Qdrant Vector DB + Redis โหลดสูง',
    en: 'High-Frequency Docker + FastAPI + Qdrant + Redis',
    brand: 'Cloudways',
    managed: false
  }
};

function renderSharedStyles(isCompareSubpage = false): string {
  const heroLosStyles = isCompareSubpage
    ? ''
    : `.hero-los{position:relative;overflow:hidden;display:grid;grid-template-columns:255px minmax(0,1fr);align-items:center;gap:20px;min-height:172px;padding:18px 22px;margin-bottom:18px;border:1px solid var(--border);border-radius:10px;background:var(--bg-elev)}.hero-los-copy{position:relative;z-index:2;display:flex;flex-direction:column;justify-content:center;min-width:0}.hero-los-eyebrow{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px}.hero-los-title{font-size:18px;font-weight:800;line-height:1.26;margin:0 0 6px;color:var(--text)}.hero-los-sub{font-size:12px;line-height:1.45;color:var(--text-secondary);margin:0}.hero-los-visual{position:relative;z-index:2;min-width:0;display:grid;grid-template-columns:156px minmax(64px,1fr) minmax(260px,340px);align-items:center}.hero-los-lines{width:100%;height:136px;display:block;overflow:visible}.hero-path{fill:none;stroke:var(--border-strong);stroke-width:1.4;stroke-linecap:round}.hero-flow{fill:var(--text-secondary)}.hero-source{width:156px;padding:10px 12px;border-radius:8px;background:var(--bg-elev-2);border:1px solid var(--border-strong)}.hero-source-tag{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);display:block;margin-bottom:3px}.hero-source-val{font-family:var(--mono);font-size:11px;font-weight:700;color:var(--text);display:block;line-height:1.35}.hero-source-sub{font-size:10px;color:var(--text-muted);display:block;margin-top:2px}.hero-nodes-stack{display:flex;flex-direction:column;gap:7px;min-width:0}.hero-node{width:100%;display:flex;align-items:center;gap:9px;padding:7px 10px;border-radius:8px;background:var(--bg-elev-2);border:1px solid var(--border);cursor:pointer;text-align:left;font:inherit;color:inherit;min-width:0}.hero-node.active,.hero-node:hover{border-color:var(--text);background:var(--accent-soft)}.hero-node-icon{width:28px;height:28px;border-radius:6px;background:var(--bg-elev);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0}.hero-node-copy{display:flex;flex-direction:column;min-width:0;flex:1}.hero-node-title{font-size:11.5px;font-weight:700;color:var(--text);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.hero-node-sub{font-size:10px;color:var(--text-muted);line-height:1.3;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.hero-bars{display:flex;align-items:flex-end;gap:2px;height:14px}.hero-bars span{display:block;width:3px;border-radius:1px;background:var(--text)}.hero-gauge{width:18px;height:8px;border:1.2px solid var(--text-secondary);border-radius:2px;overflow:hidden;background:var(--bg-elev-2)}.hero-gauge-fill{display:block;height:100%;background:var(--text)}.hero-rack{display:flex;flex-direction:column;gap:2px;position:relative}.hero-rack span{display:block;width:16px;height:2.5px;border-radius:1px;background:var(--text-secondary)}@media (max-width:960px){.hero-los{grid-template-columns:minmax(0,1fr)}.hero-los-visual{grid-template-columns:minmax(0,1fr);gap:10px}.hero-los-lines{display:none}.hero-source{width:100%}}.playbook-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;margin-top:12px}.playbook-card{display:flex;flex-direction:column;justify-content:space-between;background:var(--bg-elev);border:1px solid var(--border);border-radius:10px;padding:18px;color:var(--text)}.playbook-card:hover{border-color:var(--text)}.playbook-badge{display:inline-block;font-family:var(--mono);font-size:10px;font-weight:700;color:var(--text-secondary);background:var(--bg-elev-2);border:1px solid var(--border);padding:2px 7px;border-radius:4px;margin-bottom:8px;width:fit-content}.playbook-title{font-size:14.5px;font-weight:700;color:var(--text);margin:0 0 6px;line-height:1.38}.playbook-takeaway{font-size:12.5px;color:var(--text-secondary);margin:0 0 12px;line-height:1.48}.guide-takeaway{background:var(--bg-elev-2);border:1px solid var(--border-strong);border-left:3px solid var(--green);border-radius:8px;padding:14px 18px;margin:16px 0 20px;font-size:14px;color:var(--text);font-weight:500}.guide-step{background:var(--bg-elev-2);border:1px solid var(--border);border-radius:10px;padding:16px 20px;margin-bottom:12px}.guide-step-title{font-size:15px;font-weight:700;color:var(--text);margin:0 0 6px}.guide-code{background:#111110;color:#EDEDEB;padding:12px 14px;border-radius:8px;font-family:var(--mono);font-size:12px;overflow-x:auto;margin:10px 0 0;line-height:1.5;border:1px solid var(--border)}.stack-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-top:12px}.stack-card{background:var(--bg-elev-2);border:1px solid var(--border);border-radius:10px;padding:16px;display:flex;flex-direction:column;justify-content:space-between;gap:10px}`;

  return `:root{--paper: #FBFBFD;--mono:"SF Mono","JetBrains Mono",ui-monospace,monospace;--sans:-apple-system,BlinkMacSystemFont,"Inter","Noto Sans Thai",sans-serif}:root,:root[data-theme="dark"]{--bg:#0D0D0C;--bg-elev:#141413;--bg-elev-2:#1C1C1A;--border:#262623;--border-strong:#3A3935;--text:#EDEDEB;--text-secondary:#A3A19A;--text-muted:#6E6D67;--accent:#EDEDEB;--accent-strong:#EDEDEB;--accent-soft:rgba(237,237,235,.06);--btn-bg:#EDEDEB;--btn-fg:#0D0D0C;--green:#4E9F76;--green-soft:rgba(78,159,118,.12);--amber:#C48B3F}:root[data-theme="light"]{--bg:#F6F5F1;--bg-elev:#FFFFFF;--bg-elev-2:#EEECE6;--border:#DFDDD6;--border-strong:#C5C2B8;--text:#141413;--text-secondary:#4D4C48;--text-muted:#787670;--accent:#141413;--accent-strong:#141413;--accent-soft:rgba(20,20,19,.05);--btn-bg:#141413;--btn-fg:#FFFFFF;--green:#1F6F4A;--green-soft:rgba(31,111,74,.09);--amber:#946016}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:var(--sans);font-size:14.5px;line-height:1.5;-webkit-font-smoothing:antialiased}svg text{font-family:var(--sans)}.mono,svg .mono{font-family:var(--mono)}a{color:inherit;text-decoration:none}.nav-glass{position:sticky;top:0;z-index:40;background:var(--bg);border-bottom:1px solid var(--border);backdrop-filter: saturate(180%) blur(20px)}.masthead{max-width:1180px;margin:0 auto;padding:10px 24px;display:flex;align-items:center;justify-content:space-between;gap:12px}.brand-mark{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:14px;color:var(--text)}.brand-logo-svg{flex-shrink:0;display:block}.nav-bar{display:flex;align-items:center;gap:18px;flex-wrap:wrap}.nav-link{font-size:13px;font-weight:500;color:var(--text-secondary);padding:4px 2px;border-bottom:2px solid #0000}.nav-link:hover,.nav-link.active{color:var(--text);border-bottom-color:var(--text)}.theme-btn{width:28px;height:28px;border-radius:6px;border:1px solid var(--border-strong);background:var(--bg-elev-2);color:var(--text);font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:var(--mono)}.statusbar{padding:6px 24px;font-size:12px;color:var(--text-muted);border-bottom:1px solid var(--border);background:var(--bg-elev);text-align:center}.statusbar .mono{color:var(--text-secondary)}.shell{max-width:1180px;margin:0 auto;padding:22px 24px 64px}.hero-block{margin-bottom:18px}.kicker{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px}h1{font-size:clamp(1.55rem,2.8vw,2.15rem);font-weight:800;letter-spacing:-.02em;line-height:1.2;margin:0 0 8px;color:var(--text)}.lead,.benefit-desc{color:var(--text-secondary);font-size:13.5px;line-height:1.5;max-width:72ch;margin:0}.matchup-spotlight{margin-top:14px;background:var(--bg-elev);border:1px solid var(--border);border-radius:10px;padding:18px 20px}.matchup-decision-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}@media (max-width:780px){.matchup-decision-grid{grid-template-columns:1fr}}.decision-box{background:var(--bg-elev-2);border:1px solid var(--border);border-radius:8px;padding:12px 14px}.decision-badge{font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px}.ledger-frame{display:grid;grid-template-columns:305px minmax(0,1fr);gap:20px;align-items:start}@media (max-width:900px){.ledger-frame{grid-template-columns:1fr}}.panel-left,.panel-right{background:var(--bg-elev);border:1px solid var(--border);border-radius:10px;padding:18px;min-width:0}.panel-left{position:sticky;top:74px}@media (max-width:900px){.panel-left{position:static}}.section-tag{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:10px;display:flex;justify-content:space-between;align-items:center}.preset-strip{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px}.preset-chip{font-size:11.5px;font-weight:600;padding:5px 9px;border-radius:6px;border:1px solid var(--border);background:var(--bg-elev-2);color:var(--text-secondary);cursor:pointer;font-family:inherit}.preset-chip:hover,.preset-chip.active{background:var(--btn-bg);color:var(--btn-fg);border-color:var(--btn-bg)}.field-row{margin-bottom:14px}.field-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px;gap:6px}.field-label{font-size:12px;color:var(--text-secondary);font-weight:500}.field-readout{font-family:var(--mono);font-size:12px;font-weight:700;color:var(--text)}input[type=range]{width:100%;height:3px;border-radius:2px;background:var(--border-strong);accent-color:var(--text);cursor:pointer;appearance:none;-webkit-appearance:none}input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:13px;height:13px;border-radius:50%;background:var(--text);border:2px solid var(--bg-elev)}select,.tool-input{width:100%;padding:7px 9px;border-radius:6px;border:1px solid var(--border-strong);background:var(--bg-elev);color:var(--text);font-size:12px;font-family:inherit}.tool-inline-row{display:flex;gap:8px;align-items:center}.tool-grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:6px}@media (max-width:720px){.tool-grid-2{grid-template-columns:1fr}}.sub-section-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin:14px 0 8px;padding-top:12px;border-top:1px solid var(--border)}.btn-outline{width:100%;padding:9px 12px;border-radius:6px;border:1px solid var(--border-strong);background:var(--bg-elev-2);color:var(--text);font-size:12px;font-weight:600;cursor:pointer;margin-top:4px}.btn-primary{display:inline-block;background:var(--btn-bg);color:var(--btn-fg);font-size:12.5px;font-weight:700;padding:8px 15px;border-radius:6px;white-space:nowrap}.verdict-cell{background:var(--bg-elev-2);border:1px solid var(--border-strong);border-left:3px solid var(--text);border-radius:8px;padding:15px 17px;margin-bottom:14px}.verdict-top{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;margin-bottom:10px}.verdict-title{font-size:15.5px;font-weight:800;color:var(--text);margin:2px 0 5px;font-family:var(--mono)}.verdict-copy{font-size:13px;color:var(--text-secondary);margin:0;line-height:1.5}.live-chart-box{background:var(--bg-elev);border:1px solid var(--border);border-radius:6px;padding:10px 12px}.tabs{display:flex;gap:4px;border-bottom:1px solid var(--border);margin-bottom:12px;flex-wrap:wrap}.tab-btn{font-size:12.5px;font-weight:600;padding:8px 11px;color:var(--text-muted);border:none;background:none;cursor:pointer;border-bottom:2px solid #0000;margin-bottom:-1px;font-family:inherit}.tab-btn.active{color:var(--text);border-bottom-color:var(--text)}.tab-panel{display:none}.tab-panel.active{display:block}.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted);padding:7px 8px;border-bottom:1px solid var(--border)}th.num,td.num{text-align:right}td{padding:9px 8px;border-bottom:1px solid var(--border);vertical-align:middle}tr:last-child td{border-bottom:none}.mono-val{display:block;font-family:var(--mono);font-size:12.5px;font-weight:600;color:var(--text)}.savings-val{display:block;font-family:var(--mono);font-size:12.5px;font-weight:700;color:var(--green)}.sub-val{display:block;font-size:11px;color:var(--text-muted);margin-top:2px}.bar-track{height:3px;border-radius:1.5px;background:var(--bg-elev-2);margin-top:5px;width:130px;overflow:hidden}.bar-fill{height:100%;background:var(--text-secondary)}.provider-link,.action-link{font-size:12px;font-weight:700;color:var(--text);text-decoration:underline;text-underline-offset:3px;text-decoration-color:var(--border-strong);white-space:nowrap}.vram-bar{background:var(--bg-elev-2);border:1px solid var(--border);border-left:3px solid var(--text-secondary);border-radius:6px;padding:11px 14px;margin-bottom:12px}.checkbox-row{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-secondary);margin-bottom:12px;cursor:pointer}.checkbox-row input{accent-color:var(--text);width:14px;height:14px;cursor:pointer}.badge-pill{display:inline-block;font-family:var(--mono);font-size:10.5px;font-weight:600;padding:2px 7px;border-radius:4px;white-space:nowrap;border:1px solid #0000}.badge-green{background:var(--green-soft);color:var(--green);border-color:rgba(78,159,118,.22)}.badge-amber{background:var(--bg-elev-2);color:var(--text-secondary);border-color:var(--border-strong)}.code-box{display:flex;align-items:center;gap:8px;background:var(--bg-elev-2);border:1px solid var(--border);border-radius:6px;padding:8px 11px}.code-box code{flex:1;font-size:11.5px;overflow-x:auto;white-space:nowrap;color:var(--text);font-family:var(--mono)}.btn-copy{flex-shrink:0;font-size:11px;font-weight:700;padding:5px 9px;border-radius:5px;border:1px solid var(--border-strong);background:var(--bg-elev);color:var(--text);cursor:pointer}.buyrent-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px}@media (max-width:860px){.buyrent-grid{grid-template-columns:1fr}}.buyrent-card{border:1px solid var(--border);border-radius:8px;padding:12px;background:var(--bg-elev-2)}.buyrent-title{font-size:12px;font-weight:700;margin-bottom:6px;color:var(--text)}.buyrent-stat{font-size:11px;color:var(--text-secondary);margin-bottom:3px}.buyrent-stat .mono{font-weight:700;color:var(--text)}.buyrent-payback{font-size:13.5px;font-weight:800;color:var(--green);margin-top:6px;font-family:var(--mono)}.buyrent-warn{font-size:10.5px;color:var(--amber);margin-top:5px;font-weight:600;font-family:var(--mono)}.standalone-section{margin-top:24px;border-radius:10px;border:1px solid var(--border);background:var(--bg-elev);padding:20px}.guide-list{display:flex;flex-direction:column;border:1px solid var(--border);border-radius:8px;overflow:hidden}.guide-row{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--border);background:var(--bg-elev)}.guide-row:last-child{border-bottom:none}.guide-badge{font-family:var(--mono);font-size:9.5px;font-weight:700;text-transform:uppercase;color:var(--text-secondary);background:var(--bg-elev-2);border:1px solid var(--border);padding:2px 6px;border-radius:4px;white-space:nowrap}.guide-body{flex:1;min-width:0}.guide-title{font-size:13px;font-weight:600;display:block;color:var(--text)}.guide-arrow{color:var(--text-secondary);font-weight:700}.index-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px;margin-top:10px}.index-cell{padding:10px 12px;border-radius:6px;background:var(--bg-elev-2);border:1px solid var(--border);font-size:12px;color:var(--text);display:flex;justify-content:space-between;align-items:center;gap:6px}${heroLosStyles}`;
}

function selectRelatedSpecs(
  currentSlug: string,
  allPages: ProgrammaticComparisonPageSpec[],
  isHomeHub: boolean
): ProgrammaticComparisonPageSpec[] {
  if (isHomeHub) {
    return allPages.slice(0, 24);
  }
  const current = allPages.find((p) => p.slug === currentSlug);
  if (!current) {
    return allPages.slice(0, 3);
  }
  const sameCategory = allPages.filter(
    (p) =>
      p.slug !== currentSlug &&
      (p.category === current.category ||
        (current.primaryModelId && p.primaryModelId === current.primaryModelId))
  );
  return sameCategory.slice(0, 3);
}

function renderPlaybookCardsSection(
  locale: Locale,
  playbooks: PlaybookGuideSpec[],
  guidesPrefix: string,
  includeSvgPreview = true
): string {
  const isTh = locale === 'th';
  if (!includeSvgPreview) {
    return `<section class="standalone-section" id="playbooks"><div class="section-tag"><span>${isTh ? 'คู่มือจัดสเปกตามงานจริง (5 บทความ)' : 'PRACTICAL AI PLAYBOOKS (5 GUIDES)'}</span><a href="../index.html#playbooks" class="provider-link">${isTh ? 'ดูครบ 5 คู่มือ →' : 'All 5 Guides →'}</a></div><div class="guide-list">${playbooks
      .map(
        (pb) =>
          `<a class="guide-row" href="${guidesPrefix}/${pb.slug}.html"><span class="guide-badge">${escapeHtml(pb.badge[locale])}</span><span class="guide-body"><span class="guide-title">${escapeHtml(pb.title[locale])}</span></span><span class="guide-arrow">→</span></a>`
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
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; font-weight:700; color:var(--accent-strong); border-top:1px solid var(--border); padding-top:10px;">
              <span>${escapeHtml(pb.readTime[locale])}</span>
              <span>${isTh ? 'อ่านคู่มือ →' : 'Read Blueprint →'}</span>
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
  publicBaseUrl: string,
  sharedHomeCss: string
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
<html lang="${locale}" data-theme="dark">
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
  <style>${sharedHomeCss}</style>
</head>
<body>
  <div class="nav-glass">
    <header class="masthead">
      <a class="brand-mark" href="${rootPrefix}/${locale}/index.html">${renderBrandLogoMarkup()}</a>
      <nav class="nav-bar">
        <a class="nav-link" href="${rootPrefix}/${locale}/index.html">${isTh ? 'เครื่องคำนวณงบ AI' : 'Calculator'} (${allPages.length})</a>
        <a class="nav-link active" href="${rootPrefix}/${locale}/index.html#playbooks">${isTh ? 'คู่มือจัดสเปก (5)' : 'Playbooks (5)'}</a>
        <button type="button" class="theme-btn" id="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">◐</button>
        <a class="nav-link ${locale === 'th' ? 'active' : ''}" href="${locale === 'th' ? '#' : alternatePath}">ภาษาไทย</a>
        <a class="nav-link ${locale === 'en' ? 'active' : ''}" href="${locale === 'en' ? '#' : alternatePath}">English</a>
      </nav>
    </header>
  </div>

  <div class="shell">
    <section class="hero-block">
      <div class="kicker">${escapeHtml(guide.badge[locale])} • ${escapeHtml(guide.readTime[locale])}</div>
      <h1>${escapeHtml(guide.h1[locale])}</h1>
      <div class="guide-takeaway">${escapeHtml(guide.keyTakeaway[locale])}</div>
      <div style="margin: 18px 0;">${renderPlaybookSvg(guide.svgType, locale)}</div>
      <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center; margin-top:14px;">
        <a class="btn-primary" href="${calculatorLink}">${isTh ? 'โหลดสเปกนี้เข้าเครื่องคำนวณเพื่อปรับตัวเลขจริง →' : 'Load This Scenario in Interactive Calculator →'}</a>
        <a class="action-link" href="${rootPrefix}/${locale}/index.html#playbooks">${isTh ? '← ดูคู่มือจัดสเปกทั้งหมด 5 เรื่อง' : '← All 5 Architecture Playbooks'}</a>
      </div>
    </section>

    <section class="standalone-section">
      <div class="section-tag">
        <span>${isTh ? 'ตารางเปรียบเทียบตัวเลขจริง' : 'EMPIRICAL BENCHMARK & COST MATRIX'}</span>
        <span>2026 VERIFIED DATA</span>
      </div>
      <div class="table-wrap">
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
                <td style="padding-left:14px; color:var(--text-secondary); font-size:12.5px;">${escapeHtml(r.verdict[locale])}</td>
              </tr>`
            )
            .join('\n')}
        </tbody>
      </table>
      </div>
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
                <div class="mono-val" style="font-size:14px; margin-bottom:4px;">${escapeHtml(item.name)}</div>
                <div class="sub-val" style="color:var(--green); font-weight:600;">${escapeHtml(item.priceNote[locale])}</div>
              </div>
              <a class="btn-primary" style="text-align:center; width:100%;" href="${escapeHtml(affUrl)}" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick('${item.affiliateId}',0)">
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
          (f) => `<div style="margin-bottom:12px;">
            <div style="font-weight:600; font-size:13.5px;">${escapeHtml(f.q[locale])}</div>
            <p style="margin:4px 0 0; color:var(--text-secondary); font-size:12.5px;">${escapeHtml(f.a[locale])}</p>
          </div>`
        )
        .join('\n')}
    </section>

    ${renderPlaybookCardsSection(locale, otherPlaybooks, '.', false)}

    <footer id="affiliate-disclosure" style="padding:18px 0 32px; border-top:1px solid var(--border); color:var(--text-muted); font-size:11.5px; line-height:1.55; margin-top:24px;">
      ${
        isTh
          ? 'การเปิดเผยข้อมูลพาร์ทเนอร์ (Affiliate Disclosure): เว็บไซต์นี้มีลิงก์แนะนำบริการคลาวด์, API และชุดคำสั่ง AI (รวมถึง Agensi.io, RunPod, Novita AI และผู้ให้บริการ VPS) ซึ่งผู้จัดทำอาจได้รับค่าคอมมิชชันเมื่อคุณสมัครหรือสั่งซื้อผ่านลิงก์ดังกล่าว โดยที่คุณไม่เสียค่าใช้จ่ายเพิ่มใดๆ'
          : 'Affiliate Disclosure: Some links on this page (including Agensi.io, RunPod, Novita AI, and cloud hosting providers) are affiliate links. We may earn a commission at no extra cost to you if you sign up or make a purchase through them.'
      }
    </footer>
  </div>
  <script>
    var STORAGE_KEY='ai_cost_calc_telemetry_v1',GLOBAL_NS='burapa_ai_cost_calc_live',PAGE_LOCALE='${locale}',PAGE_SLUG='guide-${guide.slug}';
    function hitGlobalCounter(k){fetch('https://abacus.jasoncameron.dev/hit/'+GLOBAL_NS+'/'+k,{mode:'cors',keepalive:true}).catch(function(){});}
    function getSessionId(){var s=localStorage.getItem('ai_cost_calc_sid');if(!s){s='sess-'+Math.random().toString(36).slice(2,10)+'-'+Date.now();localStorage.setItem('ai_cost_calc_sid',s);hitGlobalCounter('unique_sessions');}return s;}
    function sendTelemetry(t,x){var e=Object.assign({eventId:t+'-'+getSessionId()+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),sessionId:getSessionId(),timestampIso:new Date().toISOString(),eventType:t,locale:PAGE_LOCALE,pageSlug:PAGE_SLUG},x||{});try{var l=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');l.push(e);localStorage.setItem(STORAGE_KEY,JSON.stringify(l));}catch(_){}if(t==='page_view')hitGlobalCounter('page_views');if(t==='affiliate_cta_click'){hitGlobalCounter('affiliate_clicks_total');if(x&&x.affiliateId)hitGlobalCounter('aff_'+x.affiliateId);}fetch('/api/telemetry',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify(e)}).catch(function(){});}
    function recordAffiliateClick(id,usd){sendTelemetry('affiliate_cta_click',{affiliateId:id,estimatedMonthlySpendUsd:usd||0});}
    function toggleTheme(){var r=document.documentElement,n=r.getAttribute('data-theme')==='dark'?'light':'dark';r.setAttribute('data-theme',n);try{localStorage.setItem('ai_cost_calc_theme',n);}catch(_){}}
    try{var st=localStorage.getItem('ai_cost_calc_theme');if(st){document.documentElement.setAttribute('data-theme',st);}}catch(_){}
    sendTelemetry('page_view',{});
  </script>
</body>
</html>`.replace(/\n[ \t]+/g, '\n');
}

function buildPrecomputedClientDataByLocale(affiliateConfig: AffiliateConfigFile): Record<Locale, string> {
  const compactPrograms = Object.fromEntries(
    Object.entries(affiliateConfig.programs)
      .filter(([k]) => k !== 'apify')
      .map(([k, v]) => [
        k,
        { baseUrl: v.baseUrl, paramKey: v.paramKey, affiliateCode: v.affiliateCode }
      ])
  );

  const models = LLM_MODELS.map((m) => ({
    id: m.id,
    name: m.name,
    prov: m.provider,
    inP: m.inputUsdPer1M,
    cInP: m.cachedInputUsdPer1M,
    outP: m.outputUsdPer1M,
    ctx: m.contextWindowK
  }));

  const gpus = CLOUD_GPUS.map((g) => ({
    id: g.id,
    name: g.name,
    vram: g.vramGb,
    hr: g.hourlyUsd,
    tps: g.throughputTokensPerSec
  }));

  const buildForLocale = (locale: Locale) =>
    JSON.stringify({
      fx: affiliateConfig.usdToThbDefault,
      volUsd: 5.6,
      models,
      gpus,
      selfModels: SELF_MODELS_CATALOG.map((sm) => ({
        id: sm.id,
        label: sm.label[locale],
        base: sm.baseVramGb,
        kv: sm.kvGbPer1kTok,
        vllm: sm.vllmModel,
        tp: sm.tp
      })),
      buyHardware: BUY_HARDWARE_CATALOG.map((hw) => ({
        id: hw.id,
        name: hw.name[locale],
        thb: hw.priceThb,
        pwr: hw.hourlyPowerThb,
        vram: hw.vramGb,
        warn: hw.warnIfInsufficient
      })),
      vps: CLOUD_VPS_OPTIONS.map((v) => {
        const meta = VPS_SUITABLE_FOR[v.id] ?? {
          th: 'Docker + AI Webhook Backend',
          en: 'Docker + AI Webhook Backend',
          brand: 'Cloud VPS',
          managed: true
        };
        return {
          id: v.id,
          name: v.name,
          thReg: v.region === 'thailand' ? 1 : 0,
          vcpu: v.vcpu,
          ram: v.ramGb,
          usd: v.monthlyUsd,
          aff: v.affiliateId,
          fit: meta[locale],
          brand: meta.brand,
          mgd: meta.managed ? 1 : 0
        };
      }),
      skills: AGENT_SKILLS_CATALOG.map((s) => ({
        id: s.id,
        name: s.name,
        p: s.priceUsd,
        f: s.tokenSavingsFraction,
        tag: s.tagline[locale],
        note: s.metricNote[locale]
      })),
      affiliates: compactPrograms,
      presets: [
        { req: 1500, steps: 2, inTok: 2000, outTok: 500, cache: 45, hours: 12 },
        { req: 2500, steps: 1, inTok: 3000, outTok: 400, cache: 70, hours: 24 },
        { req: 5000, steps: 5, inTok: 3500, outTok: 800, cache: 25, hours: 10 },
        { req: 25000, steps: 4, inTok: 3000, outTok: 600, cache: 30, hours: 24 }
      ]
    });

  return {
    en: buildForLocale('en'),
    th: buildForLocale('th')
  };
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
  sharedCss: string,
  precomputedCatalogJson: string,
  currentSpec?: ProgrammaticComparisonPageSpec
): string {
  const isTh = locale === 'th';
  const initialWorkload = sanitizeWorkloadInput(presetInput);
  const initialCalc = calculateCostComparison(initialWorkload, affiliateConfig, pageSlug);
  const rootPrefix = isComparisonSubpage ? '../..' : '..';
  const guidesPrefix = isComparisonSubpage ? '../guides' : './guides';
  const alternateLang: Locale = locale === 'en' ? 'th' : 'en';
  const alternatePath = isComparisonSubpage
    ? `${rootPrefix}/${alternateLang}/compare/${pageSlug}.html`
    : `${rootPrefix}/${alternateLang}/index.html`;

  const relatedPages = selectRelatedSpecs(pageSlug, allPages, !isComparisonSubpage);

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

  const defaultSelfModel = SELF_MODELS_CATALOG[1];
  const defaultConc = 5;
  const initKvGb = ((initialWorkload.inputTokensPerReq + initialWorkload.outputTokensPerReq) / 1000) * defaultSelfModel.kvGbPer1kTok * defaultConc;
  const initReqVramGb = defaultSelfModel.baseVramGb + initKvGb + 2.0;

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

  if (!isComparisonSubpage && faqList.length > 0) {
    graphEntities.push({
      '@type': 'FAQPage',
      mainEntity: faqList.map((item) => ({
        '@type': 'Question',
        name: item.q[locale],
        acceptedAnswer: { '@type': 'Answer', text: item.a[locale] }
      }))
    });
  }

  const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': graphEntities });
  const gscMeta = affiliateConfig.googleSiteVerification
    ? `\n  <meta name="google-site-verification" content="${escapeHtml(affiliateConfig.googleSiteVerification)}" />`
    : '';

  const heroSectionHtml =
    isComparisonSubpage && currentSpec
      ? `<section class="hero-block">
          <div class="kicker">TCO // BENCHMARK.26 • ${isTh ? 'จ่ายที่เดียวจบ ไม่ต้องแยกหลายบิล' : 'One-Stop Billing, Zero Juggling'}</div>
          <h1>${escapeHtml(h1)}</h1>
          <p class="lead">${escapeHtml(metaDescription)}</p>
          ${renderSpecificMatchupCard(currentSpec, locale, affiliateConfig)}
        </section>`
      : `<div class="hero-los" id="hero-los">
          <div class="hero-los-copy">
            <div class="hero-los-eyebrow">TCO // BENCHMARK.26 · ${isTh ? 'จ่ายที่เดียวจบ ไม่ต้องแยกหลายบิล' : 'One-Stop Billing, Zero Juggling'}</div>
            <h1 class="hero-los-title">${escapeHtml(h1)}</h1>
            <p class="hero-los-sub">${
              isTh
                ? 'เทียบด้วยภาพและตัวเลขจริงว่างานของคุณควรจ่ายตาม Token เช่า GPU รายชั่วโมง หรือตั้งเครื่องเอง — เลือกเส้นทางด้านขวาแล้วดูจุดคุ้มทุนทันที'
                : 'See visually whether pay-per-token APIs, flat hourly GPUs, or local hardware cost less—pick a path on the right to inspect live numbers.'
            }</p>
          </div>
          <div class="hero-los-visual">
            <div class="hero-source">
              <span class="hero-source-tag">${isTh ? 'โจทย์งานของคุณ (Live)' : 'Your Workload (Live)'}</span>
              <span class="hero-source-val" id="hero-source-val">${initialWorkload.requestsPerDay.toLocaleString()} ${isTh ? 'งาน/วัน' : 'tasks/d'} · ${initialWorkload.activeHoursPerDay}h</span>
              <span class="hero-source-sub" id="hero-source-sub">32B Q4 · ${isTh ? 'พร้อมกัน 5 คน' : '5 concurrent'}</span>
            </div>
            <svg class="hero-los-lines" viewBox="0 0 260 140" aria-hidden="true">
              <path d="M2,70 C110,70 120,22 258,22" class="hero-path" stroke-dasharray="4 3"></path>
              <path d="M2,70 L258,70" class="hero-path"></path>
              <path d="M2,70 C110,70 120,118 258,118" class="hero-path" stroke-dasharray="4 3"></path>
              <circle cx="2" cy="70" r="3.5" fill="var(--text)"></circle>
              <circle r="3" class="hero-flow"><animateMotion dur="2.8s" repeatCount="indefinite" path="M2,70 C110,70 120,22 258,22"></animateMotion></circle>
              <circle r="3" class="hero-flow"><animateMotion dur="2.4s" repeatCount="indefinite" path="M2,70 L258,70"></animateMotion></circle>
              <circle r="3" class="hero-flow"><animateMotion dur="3.1s" repeatCount="indefinite" path="M2,70 C110,70 120,118 258,118"></animateMotion></circle>
            </svg>
            <div class="hero-nodes-stack">
              <button type="button" class="hero-node active" data-tab="api" onclick="activateHeroPath(0,'api')">
                <span class="hero-node-icon"><span class="hero-bars"><span style="height:13px;"></span><span style="height:10px;opacity:.75;"></span><span style="height:6px;opacity:.5;"></span></span></span>
                <span class="hero-node-copy">
                  <span class="hero-node-title">${isTh ? '1. จ่ายตาม Token (API)' : '1. Pay-Per-Token (API)'}</span>
                  <span class="hero-node-sub">${isTh ? '10 โมเดล · Cache ลดสูงสุด 90% · บิลเดียวจบ' : '10 Models · Up to 90% Cache Discount'}</span>
                </span>
              </button>
              <button type="button" class="hero-node" data-tab="gpu" onclick="activateHeroPath(3,'gpu')">
                <span class="hero-node-icon"><span class="hero-gauge"><span class="hero-gauge-fill" style="width:65%;"></span></span></span>
                <span class="hero-node-copy">
                  <span class="hero-node-title">${isTh ? '2. เช่า GPU / ซื้อเครื่องตั้งเอง' : '2. Rent Cloud GPU / Buy Local'}</span>
                  <span class="hero-node-sub">${isTh ? 'เช็ก VRAM 24–160GB · จุดคุ้มทุน RunPod vs PC/Mac' : '24–160GB VRAM Fit · RunPod vs PC/Mac Payback'}</span>
                </span>
              </button>
              <button type="button" class="hero-node" data-tab="vps" onclick="activateHeroPath(1,'vps')">
                <span class="hero-node-icon"><span class="hero-rack"><span></span><span></span><span></span></span></span>
                <span class="hero-node-copy">
                  <span class="hero-node-title">${isTh ? '3. เซิร์ฟเวอร์ LINE OA / n8n / RAG' : '3. Managed VPS for RAG / n8n'}</span>
                  <span class="hero-node-sub">${isTh ? 'VPS ไทย Ping ~5ms · ใบกำกับภาษี VAT 7%' : 'Thai VPS ~5ms Ping & Global Managed Cloud'}</span>
                </span>
              </button>
            </div>
          </div>
        </div>`;

  return `<!DOCTYPE html>
<html lang="${locale}" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <link rel="alternate" hreflang="${alternateLang}" href="${alternatePath}" />${
    isComparisonSubpage
      ? ''
      : `\n  <meta property="og:type" content="website" />\n  <meta property="og:title" content="${escapeHtml(title)}" />\n  <meta property="og:description" content="${escapeHtml(metaDescription)}" />\n  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`
  }${gscMeta}
  <link rel="icon" type="image/svg+xml" href="${rootPrefix}/favicon.svg" />
  <script type="application/ld+json">${jsonLd}</script>
  <style>${sharedCss}</style>
</head>
<body>
  <div class="nav-glass">
    <header class="masthead">
      <a class="brand-mark" href="${rootPrefix}/${locale}/index.html">${renderBrandLogoMarkup()}</a>
      <nav class="nav-bar">
        <a class="nav-link active" href="${rootPrefix}/${locale}/index.html">${isTh ? 'คำนวณงบ' : 'Models'} (${allPages.length})</a>
        <a class="nav-link" href="#playbooks">${isTh ? 'คู่มือจัดสเปก (5)' : 'Playbooks (5)'}</a>
        <button type="button" class="theme-btn" id="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">◐</button>
        <a class="nav-link ${locale === 'th' ? 'active' : ''}" href="${locale === 'th' ? '#' : alternatePath}">ภาษาไทย</a>
        <a class="nav-link ${locale === 'en' ? 'active' : ''}" href="${locale === 'en' ? '#' : alternatePath}">English</a>
      </nav>
    </header>
  </div>
  <div class="statusbar">
    ${isTh ? 'อัปเดตราคาล่าสุด: <span class="mono">พ.ย. 2026</span> · อัตราแลกเปลี่ยน <span class="mono">1 USD = 34.5 THB</span> · จ่ายที่เดียวจบ ไม่ต้องแยกหลายบิล' : 'Updated: <span class="mono">Nov 2026</span> · Exchange Rate <span class="mono">1 USD = 34.5 THB</span> · One-Stop Billing, Zero Juggling'}
  </div>

  <div class="shell" id="calculator">
    ${heroSectionHtml}

    <div class="ledger-frame">
      <aside class="panel-left">
        <div class="section-tag">
          <span>${isTh ? 'ปรับตามลักษณะงานจริงของคุณ' : 'Match Your Daily Workload'}</span>
          <span>1 USD = 34.5 THB</span>
        </div>

        <div class="preset-strip" id="preset-strip">
          <button type="button" class="preset-chip" onclick="applyPreset(0)">${isTh ? 'แชทบอททั่วไป' : 'General Chat'}</button>
          <button type="button" class="preset-chip" onclick="applyPreset(1)">${isTh ? 'LINE OA + RAG' : 'RAG / Docs'}</button>
          <button type="button" class="preset-chip" onclick="applyPreset(2)">${isTh ? 'Agent หลายขั้นตอน' : 'Multi-Step Agent'}</button>
          <button type="button" class="preset-chip" onclick="applyPreset(3)">${isTh ? 'ประมวลผลหนัก 24 ชม.' : '24/7 Heavy'}</button>
        </div>

        <div class="field-row">
          <div class="field-top">
            <label class="field-label" for="inp-req">${isTh ? 'งานต่อวัน (ครั้ง/วัน)' : 'Tasks per Day'}</label>
            <span class="field-readout" id="val-req">${initialWorkload.requestsPerDay.toLocaleString()}</span>
          </div>
          <input id="inp-req" type="range" min="50" max="50000" step="50" value="${initialWorkload.requestsPerDay}" />
        </div>

        <div class="field-row">
          <div class="field-top">
            <label class="field-label" for="inp-steps">${isTh ? 'รอบคิดต่อ 1 งาน (Steps)' : 'Agent Steps per Task'}</label>
            <span class="field-readout" id="val-steps">${initialWorkload.agentSteps}x</span>
          </div>
          <input id="inp-steps" type="range" min="1" max="15" step="1" value="${initialWorkload.agentSteps}" />
        </div>

        <div class="field-row">
          <div class="field-top">
            <label class="field-label" for="inp-intok">${isTh ? 'Input Tokens ต่อรอบ' : 'Input Tokens / Step'}</label>
            <span class="field-readout" id="val-intok">${initialWorkload.inputTokensPerReq.toLocaleString()}</span>
          </div>
          <input id="inp-intok" type="range" min="200" max="20000" step="100" value="${initialWorkload.inputTokensPerReq}" />
        </div>

        <div class="field-row">
          <div class="field-top">
            <label class="field-label" for="inp-outtok">${isTh ? 'Output Tokens ต่อรอบ' : 'Output Tokens / Step'}</label>
            <span class="field-readout" id="val-outtok">${initialWorkload.outputTokensPerReq.toLocaleString()}</span>
          </div>
          <input id="inp-outtok" type="range" min="100" max="4000" step="50" value="${initialWorkload.outputTokensPerReq}" />
        </div>

        <div class="field-row">
          <div class="field-top">
            <label class="field-label" for="inp-cache">${isTh ? 'Cache Hit Rate (%)' : 'Prompt Cache Hit (%)'}</label>
            <span class="field-readout" id="val-cache">${Math.round(initialWorkload.cacheHitRate * 100)}%</span>
          </div>
          <input id="inp-cache" type="range" min="0" max="90" step="5" value="${Math.round(initialWorkload.cacheHitRate * 100)}" />
        </div>

        <div class="field-row">
          <div class="field-top">
            <label class="field-label" for="inp-hours">${isTh ? 'ชั่วโมงเปิดระบบต่อวัน' : 'Active Hours / Day'}</label>
            <span class="field-readout" id="val-hours">${initialWorkload.activeHoursPerDay}h</span>
          </div>
          <input id="inp-hours" type="range" min="1" max="24" step="1" value="${initialWorkload.activeHoursPerDay}" />
        </div>

        <div class="sub-section-label">${isTh ? 'ถ้าจะรันโมเดลเอง (Self-Hosted GPU)' : 'Self-Hosted GPU Sizing'}</div>

        <div class="field-row">
          <div class="field-top">
            <label class="field-label" for="inp-selfmodel">${isTh ? 'ขนาดโมเดลที่จะรันเอง' : 'Self-Hosted Model Size'}</label>
          </div>
          <select id="inp-selfmodel">
            ${SELF_MODELS_CATALOG.map(
              (sm) => `<option value="${sm.id}"${sm.id === '32b-q4' ? ' selected' : ''}>${escapeHtml(sm.label[locale])}</option>`
            ).join('')}
          </select>
        </div>

        <div class="field-row">
          <div class="field-top">
            <label class="field-label" for="inp-conc">${isTh ? 'คนใช้งานพร้อมกันช่วงพีค (คน)' : 'Peak Concurrent Users'}</label>
            <span class="field-readout" id="val-conc">${defaultConc}</span>
          </div>
          <input id="inp-conc" type="range" min="1" max="50" step="1" value="${defaultConc}" />
        </div>

        <button type="button" class="btn-outline" id="btn-share" onclick="copyScenarioLink()">${isTh ? 'คัดลอกลิงก์ผลคำนวณนี้' : 'Copy Shareable Scenario Link'}</button>
        <button type="button" class="btn-outline" id="btn-copy-summary" onclick="copyExecSummary()">${isTh ? 'คัดลอกสรุปงบส่ง LINE / Slack' : 'Copy 6-Line Spec Summary'}</button>
      </aside>

      <main class="panel-right">
        <div class="verdict-cell">
          <div class="verdict-top">
            <div>
              <div class="kicker">${isTh ? 'คำตอบฟันธงที่คุ้มค่าที่สุดสำหรับคุณ' : 'Most Cost-Effective Choice'}</div>
              <div class="verdict-title" id="winner-name">${escapeHtml(initialCalc.recommendedWinner.name)} — $${initialCalc.recommendedWinner.monthlyUsd.toLocaleString()}/mo (฿${initialCalc.recommendedWinner.monthlyThb.toLocaleString()})</div>
              <p class="verdict-copy" id="winner-verdict">${escapeHtml(initialCalc.recommendedWinner.verdict[locale])}</p>
            </div>
            <a id="winner-cta" class="btn-primary" href="${escapeHtml(initialCalc.recommendedWinner.affiliateUrl)}" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick('${initialCalc.recommendedWinner.affiliateId}', ${initialCalc.recommendedWinner.monthlyUsd})">
              ${initialCalc.recommendedWinner.category === 'cloud_gpu' ? 'RunPod GPU ↗' : 'Novita AI ↗'}
            </a>
          </div>

          <div class="live-chart-box">
            <svg id="live-cost-curve-svg" viewBox="0 0 650 104" width="100%" height="auto" role="img" aria-label="Live Monthly Cost Comparison">
              <text id="svg-lbl-cheap" x="8" y="24" class="mono" font-size="10.5" font-weight="600" fill="var(--text)">1. ${escapeHtml(cheapestInitial.name)}</text>
              <rect id="svg-bar-cheap" x="225" y="12" width="${wCheapInit}" height="14" rx="2" fill="var(--green)"/>
              <text id="svg-val-cheap" x="${233 + wCheapInit}" y="24" class="mono" font-size="11" font-weight="700" fill="var(--green)">$${cheapestInitial.monthlyUsd.toLocaleString()} (฿${cheapestInitial.monthlyThb.toLocaleString()})</text>

              <text id="svg-lbl-gpu" x="8" y="56" class="mono" font-size="10.5" font-weight="600" fill="var(--text)">2. ${escapeHtml(bestGpuInitial.name.replace('RunPod NVIDIA ', 'RunPod '))}</text>
              <rect id="svg-bar-gpu" x="225" y="44" width="${wGpuInit}" height="14" rx="2" fill="var(--text)"/>
              <text id="svg-val-gpu" x="${233 + wGpuInit}" y="56" class="mono" font-size="11" font-weight="700" fill="var(--text)">$${bestGpuInitial.monthlyUsd.toLocaleString()} (฿${bestGpuInitial.monthlyThb.toLocaleString()})</text>

              <text id="svg-lbl-flag" x="8" y="88" class="mono" font-size="10.5" font-weight="500" fill="var(--text-secondary)">3. ${escapeHtml(flagshipInitial.name)} (API)</text>
              <rect id="svg-bar-flag" x="225" y="76" width="${wFlagInit}" height="14" rx="2" fill="var(--border-strong)"/>
              <text id="svg-val-flag" x="${233 + wFlagInit}" y="88" class="mono" font-size="11" font-weight="600" fill="var(--text-secondary)">$${flagshipInitial.monthlyUsd.toLocaleString()} (฿${flagshipInitial.monthlyThb.toLocaleString()})</text>
            </svg>
          </div>
        </div>

        <div class="tabs">
          <button type="button" class="tab-btn active" data-tab="api" onclick="switchTab('api')">${isTh ? `API จ่ายตามจริง (${LLM_MODELS.length})` : `Pay-As-You-Go APIs (${LLM_MODELS.length})`}</button>
          <button type="button" class="tab-btn" data-tab="gpu" onclick="switchTab('gpu')">${isTh ? `เช่า GPU & ซื้อเครื่อง (${CLOUD_GPUS.length})` : `Hourly GPU & Local HW (${CLOUD_GPUS.length})`}</button>
          <button type="button" class="tab-btn" data-tab="vps" onclick="switchTab('vps')">${isTh ? `VPS ไทย & Global (${CLOUD_VPS_OPTIONS.length})` : `Cloud VPS (${CLOUD_VPS_OPTIONS.length})`}</button>
          <button type="button" class="tab-btn" data-tab="guides" onclick="switchTab('guides')">${isTh ? 'Skills ลด Token & คู่มือ (5)' : 'Token Skills & Playbooks (5)'}</button>
        </div>

        <div class="tab-panel active" id="tab-api">
          <div class="vram-bar" id="token-inspector-box">
            <div class="kicker">${isTh ? 'วางข้อความจริงเพื่อนับ Thai Token Tax & ส่งค่าเข้าสไลเดอร์' : 'Paste Sample Prompt to Measure Thai Token Tax'}</div>
            <div class="tool-inline-row">
              <input type="text" id="inp-prompt-sample" class="tool-input" value="${isTh ? 'สรุปเงื่อนไขใบเสนอราคาและตรวจสอบยอดสั่งซื้อหมายเลข #TH-2026 สำหรับลูกค้าองค์กร' : 'Summarize quotation terms and verify purchase order #TH-2026 for enterprise support.'}" aria-label="Prompt sample" />
              <button type="button" class="btn-copy" id="btn-apply-tokens" onclick="applyPromptTokens()">${isTh ? 'ส่งค่า ×15 เข้า Input' : 'Apply ×15 to Input'}</button>
            </div>
            <div id="token-tax-readout" class="sub-val" style="margin-top:6px;"></div>
          </div>

          <div class="vram-bar" id="hybrid-router-box">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
              <label class="checkbox-row" style="margin:0;" for="inp-hybrid-router">
                <input type="checkbox" id="inp-hybrid-router" checked />
                <span>${isTh ? 'โหมดผสม 2 โมเดลในคีย์เดียว (Smart Router: งานทั่วไป + งานยาก)' : 'Single-Key Hybrid Router (Blend cheap model + flagship)'}</span>
              </label>
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="sub-val" style="margin:0;">${isTh ? 'สัดส่วนรุ่นประหยัด:' : 'Workhorse share:'}</span>
                <input id="inp-router-pct" type="range" min="50" max="95" step="5" value="80" style="width:84px;" />
                <span class="field-readout" id="val-router-pct">80%</span>
              </div>
            </div>
            <div id="hybrid-router-summary" style="margin-top:6px;font-size:12px;"></div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>${isTh ? 'โมเดล' : 'Model'}</th>
                  <th class="num">${isTh ? 'เรต In/Out (1M)' : 'In/Out (1M)'}</th>
                  <th class="num">${isTh ? 'ต่อ 1k งาน' : 'Per 1k Tasks'}</th>
                  <th class="num">${isTh ? 'รวม/เดือน' : 'Monthly'}</th>
                  <th class="num">${isTh ? 'ใช้งาน' : 'Access'}</th>
                </tr>
              </thead>
              <tbody id="api-tbody"></tbody>
            </table>
          </div>
        </div>

        <div class="tab-panel" id="tab-gpu">
          <div class="vram-bar" id="vram-summary">
            <div class="kicker">${isTh ? 'สรุป VRAM ที่ต้องใช้จริงตามโมเดลที่เลือก' : 'Required VRAM for Selected Model'}</div>
            <div id="vram-summary-text">${isTh ? 'โมเดลที่เลือก:' : 'Model:'} <span class="mono">${escapeHtml(defaultSelfModel.label[locale])}</span> • VRAM: <span class="mono">${initReqVramGb.toFixed(1)} GB</span></div>
          </div>

          <label class="checkbox-row" for="inp-volume">
            <input type="checkbox" id="inp-volume" checked />
            <span>${isTh ? 'รวมค่าฝากไฟล์โมเดลตอนปิดเครื่อง (Persistent Volume 80GB = +$5.60/เดือน)' : 'Include 80GB Persistent Volume Storage (+$5.60/mo)'}</span>
          </label>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>RunPod GPU</th>
                  <th class="num">${isTh ? 'สถานะ VRAM' : 'VRAM Fit'}</th>
                  <th class="num">${isTh ? 'รองรับพร้อมกัน' : 'Concurrency'}</th>
                  <th class="num">${isTh ? 'รวม/เดือน (คุ้มทุน)' : 'Monthly (Break-Even)'}</th>
                  <th class="num">Rent</th>
                </tr>
              </thead>
              <tbody id="gpu-tbody"></tbody>
            </table>
          </div>

          <div style="margin-top:14px;">
            <div class="field-label" style="margin-bottom:5px;">${isTh ? 'คำสั่งรัน vLLM (ปรับตามโมเดลอัตโนมัติ)' : 'One-Line vLLM Deploy Command'}</div>
            <div class="code-box">
              <code id="vllm-command">docker run --gpus all -p 8000:8000 vllm/vllm-openai:latest --model ${defaultSelfModel.vllmModel} --tensor-parallel-size ${defaultSelfModel.tp} --max-model-len 8192</code>
              <button type="button" class="btn-copy" id="btn-copy-vllm" onclick="copyVllmCommand()">${isTh ? 'คัดลอก' : 'Copy'}</button>
            </div>
          </div>

          <div style="margin-top:18px;">
            <div class="section-tag"><span>${isTh ? 'เช่า Cloud GPU (RunPod) vs ซื้อเครื่องตั้งเอง (Rent vs Buy Payback)' : 'Rent Cloud GPU vs Buy Local Hardware Payback'}</span></div>
            <div class="buyrent-grid" id="buyrent-grid"></div>
          </div>
        </div>

        <div class="tab-panel" id="tab-vps">
          <div class="vram-bar" id="vps-sizer-box">
            <div class="kicker">${isTh ? 'คำนวณขนาด RAM สำหรับระบบ RAG (Qdrant) + LINE OA / n8n' : 'RAG Vector DB & Webhook VPS RAM Sizer'}</div>
            <div class="tool-grid-2">
              <div>
                <label class="field-label" for="inp-rag-docs">${isTh ? 'จำนวนเอกสารใน Vector DB' : 'Vector DB Document Volume'}</label>
                <select id="inp-rag-docs">
                  <option value="0.8">${isTh ? '1,000–10,000 หน้า (~0.8 GB)' : '1k–10k pages (~0.8 GB)'}</option>
                  <option value="2.4" selected>${isTh ? '10,000–50,000 หน้า (~2.4 GB)' : '10k–50k pages (~2.4 GB)'}</option>
                  <option value="6.5">${isTh ? '50,000–200,000 หน้า (~6.5 GB)' : '50k–200k pages (~6.5 GB)'}</option>
                </select>
              </div>
              <div>
                <label class="field-label" for="inp-rag-stack">${isTh ? 'ระบบที่รันร่วมกันบน VPS' : 'Co-Hosted Stack'}</label>
                <select id="inp-rag-stack">
                  <option value="1.4" selected>LINE OA Webhook + n8n + PostgreSQL (1.4 GB)</option>
                  <option value="2.4">FastAPI + Qdrant + Redis Cache (2.4 GB)</option>
                  <option value="4.8">Multi-Agent Queue + Worker Cluster (4.8 GB)</option>
                </select>
              </div>
            </div>
            <div id="vps-ram-summary" style="margin-top:8px;font-size:12px;"></div>
            <div class="code-box" style="margin-top:8px;">
              <code id="vps-docker-command">docker run -d --name qdrant -p 6333:6333 qdrant/qdrant:latest &amp;&amp; docker run -d --name n8n -p 5678:5678 n8nio/n8n:latest</code>
              <button type="button" class="btn-copy" id="btn-copy-vps" onclick="copyVpsCommand()">${isTh ? 'คัดลอก' : 'Copy'}</button>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>${isTh ? 'แพ็กเกจ & สเปก' : 'VPS Plan & Specs'}</th>
                  <th>${isTh ? 'เหมาะรันระบบอะไร' : 'Best Stack Fit'}</th>
                  <th>${isTh ? 'ภาษี & Latency' : 'Tax & Latency'}</th>
                  <th class="num">${isTh ? 'รวม/เดือน' : 'Monthly'}</th>
                  <th class="num">Host</th>
                </tr>
              </thead>
              <tbody id="vps-tbody"></tbody>
            </table>
          </div>
        </div>

        <div class="tab-panel" id="tab-guides">
          <div class="table-wrap" style="margin-bottom:16px;">
            <table>
              <thead>
                <tr>
                  <th>${isTh ? 'ชุดคำสั่งเสริมลดโควต้า (Agensi.io)' : 'Token-Saving Agent Skills (Agensi.io)'}</th>
                  <th class="num">${isTh ? 'ประหยัด/เดือน' : 'Est. Savings'}</th>
                  <th class="num">${isTh ? 'ความคุ้มค่า' : 'Efficiency'}</th>
                  <th class="num">Skill</th>
                </tr>
              </thead>
              <tbody id="skills-tbody"></tbody>
            </table>
          </div>
          <div class="guide-list"${isComparisonSubpage ? ' id="playbooks"' : ''}>
            ${allPlaybooks
              .map(
                (pb) =>
                  `<a class="guide-row" href="${guidesPrefix}/${pb.slug}.html"><span class="guide-badge">${isComparisonSubpage ? 'PLAYBOOK' : escapeHtml(pb.badge[locale])}</span><span class="guide-body"><span class="guide-title">${escapeHtml(pb.title[locale])}</span></span><span class="guide-arrow">→</span></a>`
              )
              .join('')}
          </div>
        </div>
      </main>
    </div>

    ${isComparisonSubpage ? '' : renderPlaybookCardsSection(locale, allPlaybooks, guidesPrefix, true)}

    ${
      faqList.length > 0
        ? `<section class="standalone-section">
            <div class="section-tag"><span>${isTh ? 'คำถามและเทคนิคจากการใช้งานจริง' : 'Practical Questions & Recipes'}</span><span>FAQ</span></div>
            ${faqList
              .map(
                (item) => `<div style="margin-bottom:12px;">
                  <div style="font-weight:600; font-size:13.5px;">${escapeHtml(item.q[locale])}</div>
                  <p style="margin:4px 0 0; color:var(--text-secondary); font-size:12.5px;">${escapeHtml(item.a[locale])}</p>
                </div>`
              )
              .join('')}
          </section>`
        : ''
    }

    <section class="standalone-section">
      <div class="section-tag">
        <span>${isComparisonSubpage ? (isTh ? 'เปรียบเทียบเคสอื่นๆ ที่ใกล้เคียงกัน' : 'Related Comparisons') : isTh ? `เคสเปรียบเทียบยอดนิยม (จากทั้งหมด ${allPages.length} หน้า)` : `Popular Comparisons (of ${allPages.length} Pages)`}</span>
        <a href="${rootPrefix}/${locale}/index.html" class="provider-link">View All ${allPages.length} →</a>
      </div>
      <div class="index-grid">
        ${relatedPages
          .map(
            (p) =>
              `<a class="index-cell" href="${rootPrefix}/${locale}/compare/${p.slug}.html"><span>${escapeHtml(p.h1[locale])}</span><span style="color:var(--accent-strong);">→</span></a>`
          )
          .join('')}
      </div>
    </section>

    <footer id="affiliate-disclosure" style="padding:18px 0 32px; border-top:1px solid var(--border); color:var(--text-muted); font-size:11.5px; line-height:1.55; margin-top:24px;">
      ${
        isTh
          ? 'การเปิดเผยข้อมูลพาร์ทเนอร์ (Affiliate Disclosure): เว็บไซต์นี้มีลิงก์แนะนำบริการคลาวด์, API และชุดคำสั่ง AI (รวมถึง Agensi.io, RunPod, Novita AI และผู้ให้บริการ VPS) ซึ่งผู้จัดทำอาจได้รับค่าคอมมิชชันเมื่อคุณสมัครหรือสั่งซื้อผ่านลิงก์ดังกล่าว โดยที่คุณไม่เสียค่าใช้จ่ายเพิ่มใดๆ'
          : 'Affiliate Disclosure: Some links on this page (including Agensi.io, RunPod, Novita AI, and cloud hosting providers) are affiliate links. We may earn a commission at no extra cost to you if you sign up or make a purchase through them.'
      }
    </footer>
  </div>

  <script>
const APP_DATA=Object.assign(${precomputedCatalogJson},{locale:'${locale}',pageSlug:'${pageSlug}'});
const STORAGE_KEY='ai_cost_calc_telemetry_v1',GLOBAL_NS='burapa_ai_cost_calc_live',SLIDERS=[['req','inp-req'],['steps','inp-steps'],['inTok','inp-intok'],['outTok','inp-outtok'],['cache','inp-cache'],['hours','inp-hours']];
const $=function(id){return document.getElementById(id);};
function fmt(n){return n.toLocaleString();}
function hitGlobalCounter(k){fetch('https://abacus.jasoncameron.dev/hit/'+GLOBAL_NS+'/'+k,{mode:'cors',keepalive:true}).catch(function(){});}
function getSessionId(){let s=localStorage.getItem('ai_cost_calc_sid');if(!s){s='sess-'+Math.random().toString(36).slice(2,10)+'-'+Date.now();localStorage.setItem('ai_cost_calc_sid',s);hitGlobalCounter('unique_sessions');}return s;}
function sendTelemetry(t,x){const e=Object.assign({eventId:t+'-'+getSessionId()+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),sessionId:getSessionId(),timestampIso:new Date().toISOString(),eventType:t,locale:APP_DATA.locale,pageSlug:APP_DATA.pageSlug},x||{});try{const l=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');l.push(e);localStorage.setItem(STORAGE_KEY,JSON.stringify(l));}catch(_){}if(t==='page_view')hitGlobalCounter('page_views');if(t==='calculation_run')hitGlobalCounter('calculation_runs');if(t==='scenario_shared')hitGlobalCounter('scenarios_shared');if(t==='affiliate_cta_click'){hitGlobalCounter('affiliate_clicks_total');if(x&&x.affiliateId)hitGlobalCounter('aff_'+x.affiliateId);}fetch('/api/telemetry',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify(e)}).catch(function(){});}
function recordAffiliateClick(id,usd){sendTelemetry('affiliate_cta_click',{affiliateId:id,estimatedMonthlySpendUsd:usd});}
function buildAffiliateLink(id,slug){const p=APP_DATA.affiliates[id],c=(p.affiliateCode||'ai-cost-calc').trim();if(id==='agensi'){const h=c.replace(/^https?:\\/\\/(www\\.)?agensi\\.io\\/r\\//i,'').replace(/^agensi\\.io\\/r\\//i,'').replace(/^\\/?r\\//i,'').replace(/[^a-zA-Z0-9_-]/g,'')||'BURAPA',u=new URL('https://www.agensi.io/r/'+h);u.searchParams.set('utm_campaign',APP_DATA.pageSlug+'-'+slug);return u.toString();}const u=new URL(p.baseUrl);u.searchParams.set(p.paramKey||'ref',c);if(id==='aimlapi')u.searchParams.set('utm_source','affiliate');u.searchParams.set('utm_campaign',APP_DATA.pageSlug+'-'+slug);return u.toString();}
let hasLoggedCalcInteraction=false,lastSummaryText='';
function logCalc(u){if(!hasLoggedCalcInteraction){hasLoggedCalcInteraction=true;sendTelemetry('calculation_run',{estimatedMonthlySpendUsd:u||0});}}
function findSelfModel(id){return APP_DATA.selfModels.find(function(x){return x.id===id;})||APP_DATA.selfModels[1];}
function measurePromptSample(){
const txt=(($('inp-prompt-sample')&&$('inp-prompt-sample').value)||'').trim()||'sample',th=((txt.match(/[\u0E00-\u0E7F]/g))||[]).length,ot=Math.max(0,txt.length-th),tPct=Math.round((th/Math.max(1,txt.length))*100),tFast=Math.max(1,Math.ceil(th*0.42+ot*0.25)),tGpt=Math.max(1,Math.ceil(th*0.68+ot*0.25)),tClaude=Math.max(1,Math.ceil(th*0.92+ot*0.28)),mult=(tClaude/tFast).toFixed(1);
if($('token-tax-readout'))$('token-tax-readout').innerHTML='${isTh ? 'สัดส่วนไทย ' : 'Thai '}<span class="mono">'+tPct+'%</span> · Gemini/DeepSeek: <span class="mono" style="color:var(--green);">~'+tFast+' tok</span> · GPT-4o: <span class="mono">~'+tGpt+' tok</span> · Claude 3.7: <span class="mono">~'+tClaude+' tok ('+mult+'x)</span>';
return tClaude;
}
function applyPromptTokens(){const t=measurePromptSample(),scaled=Math.min(20000,Math.max(200,Math.round((t*15)/100)*100));$('inp-intok').value=String(scaled);recalculate(true);}
function recalculate(fromUser){
const req=Number($('inp-req').value),steps=Number($('inp-steps').value),inTok=Number($('inp-intok').value),outTok=Number($('inp-outtok').value),cachePct=Number($('inp-cache').value),hours=Number($('inp-hours').value),selfModel=findSelfModel($('inp-selfmodel').value),conc=Number($('inp-conc').value),incVol=$('inp-volume').checked,fx=APP_DATA.fx||34.5;
$('val-req').textContent=fmt(req);$('val-steps').textContent=steps+'x';$('val-intok').textContent=fmt(inTok);$('val-outtok').textContent=fmt(outTok);$('val-cache').textContent=cachePct+'%';$('val-hours').textContent=hours+'h';$('val-conc').textContent=String(conc);
measurePromptSample();${
    isComparisonSubpage
      ? ''
      : `\nconst hVal=$('hero-source-val'),hSub=$('hero-source-sub');if(hVal)hVal.textContent=fmt(req)+'${isTh ? ' งาน/วัน · ' : ' tasks/d · '}'+hours+'h';if(hSub)hSub.textContent=selfModel.id.toUpperCase()+' · ${isTh ? 'พร้อมกัน ' : ''}'+conc+'${isTh ? ' คน' : ' concurrent'}';`
  }
const cacheHit=cachePct/100,mCalls=req*steps*30,inM=(mCalls*inTok)/1e6,outM=(mCalls*outTok)/1e6;
const apiRows=APP_DATA.models.map(function(m){const bIn=(1-cacheHit)*m.inP+cacheHit*m.cInP,mUsd=Number((inM*bIn+outM*m.outP).toFixed(2)),mThb=Math.round(mUsd*fx),per1k=Number(((mUsd/(req*30))*1000).toFixed(2));return Object.assign({},m,{monthlyUsd:mUsd,monthlyThb:mThb,per1k:per1k,url:buildAffiliateLink('aimlapi',m.id)});}).sort(function(a,b){return a.monthlyUsd-b.monthlyUsd;});
const maxApi=Math.max.apply(null,apiRows.map(function(r){return r.monthlyUsd;}).concat([1])),cheapest=apiRows[0],flagship=apiRows.find(function(r){return r.id==='claude-3-7-sonnet';})||apiRows[apiRows.length-1],flagPerTask=flagship.monthlyUsd/(req*30),reqTokSec=(req*steps*outTok)/Math.max(1,hours*3600),kvGb=((inTok+outTok)/1000)*selfModel.kv*conc,reqVram=selfModel.base+kvGb+2,volUsd=incVol?APP_DATA.volUsd:0;
const rPct=Number(($('inp-router-pct')&&$('inp-router-pct').value)||80),useHyb=!$('inp-hybrid-router')||$('inp-hybrid-router').checked,hybUsd=Number(((rPct/100)*cheapest.monthlyUsd+((100-rPct)/100)*flagship.monthlyUsd).toFixed(2)),hybThb=Math.round(hybUsd*fx),hybSavUsd=Number(Math.max(0,flagship.monthlyUsd-hybUsd).toFixed(2)),hybSavPct=Math.round((hybSavUsd/Math.max(0.01,flagship.monthlyUsd))*100);
if($('val-router-pct'))$('val-router-pct').textContent=rPct+'%';
if($('hybrid-router-summary'))$('hybrid-router-summary').innerHTML=useHyb?('<span class="mono">'+rPct+'% '+cheapest.name+' + '+(100-rPct)+'% '+flagship.name+' = <strong>$'+fmt(hybUsd)+'/mo (฿'+fmt(hybThb)+')</strong></span> · <span style="color:var(--green);font-weight:600;">${isTh ? 'ประหยัดลง ' : 'Saves '}'+hybSavPct+'% (-฿'+fmt(Math.round(hybSavUsd*fx))+'/mo)</span>'):'${isTh ? 'ปิดโหมดผสมโมเดล (จ่ายเรตโมเดลเดี่ยว 100%)' : 'Hybrid routing disabled (100% single model)'}';
const gpuRows=APP_DATA.gpus.map(function(g){const tInst=Math.max(1,Math.ceil(reqTokSec/g.tps)),vInst=Math.max(1,Math.ceil(reqVram/g.vram)),inst=Math.max(tInst,vInst),mUsd=Number((inst*g.hr*hours*30+volUsd).toFixed(2)),mThb=Math.round(mUsd*fx),be=Math.max(1,Math.ceil((g.hr*hours*30)/Math.max(1e-6,flagPerTask*30))),fits=reqVram<=g.vram,badge=fits?'${isTh ? '1 เครื่องพอ (เหลือ ' : 'Fits 1x ('}'+(g.vram-reqVram).toFixed(1)+'GB)':'${isTh ? 'ต้องใช้ ' : 'Needs '}'+vInst+'x',maxC=Math.max(1,Math.floor((inst*g.tps)/18)),perU=Math.round((inst*g.tps)/conc);return Object.assign({},g,{instances:inst,monthlyUsd:mUsd,monthlyThb:mThb,breakEven:be,fits:fits,badge:badge,maxConc:maxC,perUser:perU,url:buildAffiliateLink('runpod',g.id)});}).sort(function(a,b){return a.monthlyUsd-b.monthlyUsd;});
$('api-tbody').innerHTML=apiRows.map(function(r){const pct=Math.max(4,Math.round((r.monthlyUsd/maxApi)*100));return '<tr><td><span class="mono-val">'+r.name+'</span><span class="sub-val">'+r.prov+' • '+r.ctx+'K</span><div class="bar-track"><div class="bar-fill" style="width:'+pct+'%"></div></div></td><td class="num"><span class="mono-val">$'+r.inP+' / $'+r.outP+'</span><span class="sub-val">Cache $'+r.cInP+'</span></td><td class="num"><span class="mono-val">$'+r.per1k+'</span><span class="sub-val">/1k tasks</span></td><td class="num"><span class="mono-val">$'+fmt(r.monthlyUsd)+'</span><span class="sub-val">฿'+fmt(r.monthlyThb)+'</span></td><td class="num"><a class="provider-link" href="'+r.url+'" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick(\\'aimlapi\\','+r.monthlyUsd+')">Novita AI ↗</a></td></tr>';}).join('');
$('gpu-tbody').innerHTML=gpuRows.map(function(g){return '<tr><td><span class="mono-val">'+g.name.replace('RunPod NVIDIA ','')+'</span><span class="sub-val">'+g.instances+'x • '+g.vram+'GB VRAM • '+g.tps+' tok/s</span></td><td class="num"><span class="badge-pill '+(g.fits?'badge-green':'badge-amber')+'">'+g.badge+'</span></td><td class="num"><span class="mono-val">'+g.maxConc+'${isTh ? ' คน' : ' users'}</span><span class="sub-val">'+g.perUser+' tok/s/user</span></td><td class="num"><span class="mono-val">$'+fmt(g.monthlyUsd)+' (฿'+fmt(g.monthlyThb)+')</span><span class="sub-val">${isTh ? 'คุ้มทุน ' : 'Break-even '}'+fmt(g.breakEven)+'/d</span></td><td class="num"><a class="provider-link" href="'+g.url+'" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick(\\'runpod\\','+g.monthlyUsd+')">RunPod ↗</a></td></tr>';}).join('');
$('vram-summary-text').innerHTML='${isTh ? 'โมเดลที่เลือก: ' : 'Model: '}<span class="mono">'+selfModel.label+'</span> • VRAM: <span class="mono">'+reqVram.toFixed(1)+' GB</span> <span style="color:var(--text-muted);font-size:11.5px;">(Base '+selfModel.base+'GB + KV '+kvGb.toFixed(1)+'GB @ '+conc+'u + 2GB CUDA)</span>';
$('vllm-command').textContent='docker run --gpus all -p 8000:8000 vllm/vllm-openai:latest --model '+selfModel.vllm+' --tensor-parallel-size '+selfModel.tp+' --max-model-len 8192';
const docRam=Number(($('inp-rag-docs')&&$('inp-rag-docs').value)||2.4),stkRam=Number(($('inp-rag-stack')&&$('inp-rag-stack').value)||1.4),reqRam=docRam+stkRam+0.6,recTier=reqRam<=3.8?4:(reqRam<=7.6?8:16);
if($('vps-ram-summary'))$('vps-ram-summary').innerHTML='${isTh ? 'RAM ที่ต้องใช้จริง: ' : 'Required RAM: '}<span class="mono">'+reqRam.toFixed(1)+' GB</span> (Vector DB '+docRam+'GB + Stack '+stkRam+'GB + OS) → <span class="mono" style="color:var(--green);font-weight:700;">${isTh ? 'แนะนำแพ็กเกจ ' : 'Recommended: '}'+recTier+'GB+ RAM</span>';
if(APP_DATA.vps&&$('vps-tbody')){$('vps-tbody').innerHTML=APP_DATA.vps.map(function(v){const ok=v.ram>=reqRam,fitTxt=ok?('${isTh ? 'RAM พอ (' : 'Fits ('}'+(v.ram-reqRam).toFixed(1)+'GB)'):'${isTh ? 'ต้องใช้ ' : 'Needs '}'+recTier+'GB+',bdg=v.thReg?'<span class="badge-pill badge-green">${isTh ? 'ใบกำกับภาษี VAT 7% · Ping ~5ms' : 'Thai VAT 7% · ~5ms Ping'}</span>':'<span class="badge-pill badge-amber">${isTh ? 'อินวอยซ์ตปท. · Ping ~32ms (SG)' : 'Global Invoice · ~32ms (SG)'}</span>',u=buildAffiliateLink(v.aff,v.id);return '<tr data-ram="'+v.ram+'"><td><span class="mono-val">'+v.name+'</span><span class="sub-val">'+v.vcpu+' vCPU / '+v.ram+'GB • '+(v.mgd?'Managed':'Self-Managed')+' · <span class="vps-ram-fit mono" style="color:var(--'+(ok?'green':'amber')+');">'+fitTxt+'</span></span></td><td><span class="sub-val" style="color:var(--text-secondary);">'+v.fit+'</span></td><td>'+bdg+'</td><td class="num"><span class="mono-val">$'+v.usd+'</span><span class="sub-val">฿'+fmt(Math.round(v.usd*fx))+'/mo</span></td><td class="num"><a class="provider-link" href="'+u+'" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick(\\''+v.aff+'\\','+v.usd+')">'+v.brand+' ↗</a></td></tr>';}).join('');}
const fitG=APP_DATA.gpus.filter(function(g){return g.vram>=reqVram;}),bestFit=(fitG.length?fitG:APP_DATA.gpus.slice().sort(function(a,b){return b.vram-a.vram;})).slice().sort(function(a,b){return a.hr-b.hr;})[0],cloudThb=Math.round(bestFit.hr*hours*30*fx);
$('buyrent-grid').innerHTML=APP_DATA.buyHardware.map(function(hw){const pwr=Math.round(hw.pwr*hours*30),sav=cloudThb-pwr,pb=sav>0?(fmt(Math.ceil(hw.thb/sav))+'${isTh ? ' เดือน' : ' mos'}'):'${isTh ? 'เช่าคุ้มกว่า' : 'Rent is cheaper'}',warn=(hw.warn&&reqVram>hw.vram)?'<div class="buyrent-warn">VRAM '+hw.vram+'GB &lt; '+reqVram.toFixed(1)+'GB</div>':'';return '<div class="buyrent-card"><div class="buyrent-title">'+hw.name+'</div><div class="buyrent-stat">${isTh ? 'ราคาเครื่อง: ' : 'Hardware: '}<span class="mono">฿'+fmt(hw.thb)+'</span></div><div class="buyrent-stat">${isTh ? 'ค่าไฟ/ด.: ' : 'Power/mo: '}<span class="mono">฿'+fmt(pwr)+'</span></div><div class="buyrent-stat">vs '+bestFit.name.replace('RunPod NVIDIA ','RunPod ')+': <span class="mono">฿'+fmt(cloudThb)+'/mo</span></div><div class="buyrent-payback">${isTh ? 'คืนทุนใน ' : 'Payback: '}'+pb+'</div>'+warn+'</div>';}).join('');
if(APP_DATA.skills&&$('skills-tbody')){$('skills-tbody').innerHTML=APP_DATA.skills.map(function(sk){const sUsd=Number((flagship.monthlyUsd*sk.f).toFixed(2)),sThb=Math.round(sUsd*fx),u=buildAffiliateLink('agensi',sk.id);return '<tr><td><span class="mono-val">'+sk.name+'</span><span class="sub-val">'+sk.tag+'</span></td><td class="num"><span class="savings-val">-$'+fmt(sUsd)+'/mo</span><span class="sub-val">-฿'+fmt(sThb)+'</span></td><td class="num"><span class="mono-val">'+(sk.p>0?'$'+sk.p+' once':'Free / Paid')+'</span><span class="sub-val">'+sk.note+'</span></td><td class="num"><a class="provider-link" href="'+u+'" target="_blank" rel="noopener sponsored" onclick="recordAffiliateClick(\\'agensi\\','+sUsd+')">Agensi.io ↗</a></td></tr>';}).join('');}
const bestGpu=gpuRows[0],cMax=Math.max(cheapest.monthlyUsd,flagship.monthlyUsd,bestGpu.monthlyUsd,1),wC=Math.max(12,Math.round((cheapest.monthlyUsd/cMax)*240)),wG=Math.max(12,Math.round((bestGpu.monthlyUsd/cMax)*240)),wF=Math.max(12,Math.round((flagship.monthlyUsd/cMax)*240));
$('svg-lbl-cheap').textContent='1. '+cheapest.name;$('svg-bar-cheap').setAttribute('width',String(wC));$('svg-val-cheap').setAttribute('x',String(233+wC));$('svg-val-cheap').textContent='$'+fmt(cheapest.monthlyUsd)+' (฿'+fmt(cheapest.monthlyThb)+')';
$('svg-lbl-gpu').textContent='2. '+bestGpu.name.replace('RunPod NVIDIA ','RunPod ');$('svg-bar-gpu').setAttribute('width',String(wG));$('svg-val-gpu').setAttribute('x',String(233+wG));$('svg-val-gpu').textContent='$'+fmt(bestGpu.monthlyUsd)+' (฿'+fmt(bestGpu.monthlyThb)+')';
$('svg-lbl-flag').textContent='3. '+flagship.name+' (API)';$('svg-bar-flag').setAttribute('width',String(wF));$('svg-val-flag').setAttribute('x',String(233+wF));$('svg-val-flag').textContent='$'+fmt(flagship.monthlyUsd)+' (฿'+fmt(flagship.monthlyThb)+')';
const wName=$('winner-name'),wVerd=$('winner-verdict'),wCta=$('winner-cta');
if(bestGpu.monthlyUsd<flagship.monthlyUsd){const dUsd=Number((flagship.monthlyUsd-bestGpu.monthlyUsd).toFixed(2)),dThb=Math.round(dUsd*fx);wName.textContent=bestGpu.name+' — $'+fmt(bestGpu.monthlyUsd)+'/mo (฿'+fmt(bestGpu.monthlyThb)+')';wVerd.textContent='${isTh ? 'ที่ปริมาณงาน ' : 'At '}'+fmt(req)+'${isTh ? ' งาน/วัน การเช่าเหมาชั่วโมง (' : ' tasks/day, renting '}'+bestGpu.name+'${isTh ? ') ล็อกงบรายเดือนอยู่ที่ ฿' : ' caps your bill at ฿'}'+fmt(bestGpu.monthlyThb)+'${isTh ? ' ประหยัดกว่า ' : ' — saving ฿'}'+fmt(dThb)+'/mo vs '+flagship.name;wCta.href=bestGpu.url;wCta.textContent='RunPod GPU ↗';wCta.onclick=function(){recordAffiliateClick('runpod',bestGpu.monthlyUsd);};}else{const dUsd=Number((bestGpu.monthlyUsd-flagship.monthlyUsd).toFixed(2)),dThb=Math.round(dUsd*fx);wName.textContent=flagship.name+' — $'+fmt(flagship.monthlyUsd)+'/mo (฿'+fmt(flagship.monthlyThb)+')';wVerd.textContent='${isTh ? 'เมื่อใช้งานไม่ถึง ' : 'Below '}'+fmt(bestGpu.breakEven)+'${isTh ? ' งาน/วัน การจ่ายตามจริงผ่าน API (' : ' tasks/day, pay-per-token API ('}'+flagship.name+'${isTh ? ') ประหยัดกว่าเช่าเครื่องถึง ฿' : ') saves ฿'}'+fmt(dThb)+'/mo';wCta.href=flagship.url;wCta.textContent='Novita AI ↗';wCta.onclick=function(){recordAffiliateClick('aimlapi',flagship.monthlyUsd);};}
lastSummaryText='[TCO // BENCHMARK.26]\\n• Workload: '+fmt(req)+'/d, '+steps+'x steps, In '+fmt(inTok)+'/Out '+fmt(outTok)+' tok, Cache '+cachePct+'%, '+hours+'h/d\\n• Best API: '+cheapest.name+' — $'+fmt(cheapest.monthlyUsd)+'/mo (฿'+fmt(cheapest.monthlyThb)+')\\n• Hybrid '+rPct+'/'+(100-rPct)+' Router: $'+fmt(hybUsd)+'/mo (฿'+fmt(hybThb)+')\\n• Dedicated GPU: '+bestGpu.name+' — $'+fmt(bestGpu.monthlyUsd)+'/mo (VRAM '+reqVram.toFixed(1)+'GB)\\n• RAG VPS RAM: '+reqRam.toFixed(1)+'GB ('+recTier+'GB+ plan)';
if(fromUser)logCalc(Math.min(bestGpu.monthlyUsd,flagship.monthlyUsd));
}
function applyPreset(idx){const p=APP_DATA.presets[idx];if(!p)return;SLIDERS.forEach(function(k){$(k[1]).value=p[k[0]];});document.querySelectorAll('.preset-chip').forEach(function(c,i){c.classList.toggle('active',i===idx);});recalculate(true);}
function switchTab(name,initCall){document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-tab')===name);});document.querySelectorAll('.tab-panel').forEach(function(p){p.classList.toggle('active',p.id==='tab-'+name);});if(!initCall)logCalc(0);${
    isComparisonSubpage
      ? ''
      : `document.querySelectorAll('.hero-node').forEach(function(n){n.classList.toggle('active',n.getAttribute('data-tab')===name);});`
  }}${isComparisonSubpage ? '' : `\nfunction activateHeroPath(idx,tab){applyPreset(idx);switchTab(tab);}`}
function cpTxt(txt,btn,lbl){if(navigator.clipboard)navigator.clipboard.writeText(txt).catch(function(){});$(btn).textContent=lbl;}
function copyVllmCommand(){cpTxt($('vllm-command').textContent,'btn-copy-vllm','${isTh ? 'คัดลอกแล้ว' : 'Copied'}');logCalc(0);sendTelemetry('scenario_shared',{});}
function copyVpsCommand(){cpTxt($('vps-docker-command').textContent,'btn-copy-vps','${isTh ? 'คัดลอกแล้ว' : 'Copied'}');logCalc(0);sendTelemetry('scenario_shared',{});}
function buildShareUrl(){const p=new URLSearchParams();SLIDERS.forEach(function(k){p.set(k[0],$(k[1]).value);});p.set('selfModel',$('inp-selfmodel').value);p.set('conc',$('inp-conc').value);p.set('volume',$('inp-volume').checked?'1':'0');return window.location.origin+window.location.pathname+'?'+p.toString();}
function copyScenarioLink(){cpTxt(buildShareUrl(),'btn-share','${isTh ? 'คัดลอกลิงก์เรียบร้อยแล้ว' : 'Link Copied'}');sendTelemetry('scenario_shared',{});}
function copyExecSummary(){cpTxt(lastSummaryText+'\\n• Link: '+buildShareUrl(),'btn-copy-summary','${isTh ? 'คัดลอกสรุปงบแล้ว' : 'Summary Copied'}');sendTelemetry('scenario_shared',{});}
function toggleTheme(){const r=document.documentElement,n=r.getAttribute('data-theme')==='dark'?'light':'dark';r.setAttribute('data-theme',n);try{localStorage.setItem('ai_cost_calc_theme',n);}catch(_){}}
(function init(){
try{const st=localStorage.getItem('ai_cost_calc_theme');if(st){document.documentElement.setAttribute('data-theme',st);}}catch(_){}
const q=new URLSearchParams(window.location.search);
SLIDERS.forEach(function(k){if(q.has(k[0]))$(k[1]).value=q.get(k[0]);});if(q.has('selfModel'))$('inp-selfmodel').value=q.get('selfModel');if(q.has('conc'))$('inp-conc').value=q.get('conc');if(q.has('volume'))$('inp-volume').checked=q.get('volume')==='1';if(q.has('tab'))switchTab(q.get('tab'),true);
['inp-req','inp-steps','inp-intok','inp-outtok','inp-cache','inp-hours','inp-conc','inp-router-pct','inp-prompt-sample'].forEach(function(id){if($(id))$(id).addEventListener('input',function(){recalculate(true);});});
['inp-selfmodel','inp-volume','inp-hybrid-router','inp-rag-docs','inp-rag-stack'].forEach(function(id){if($(id))$(id).addEventListener('change',function(){recalculate(true);});});
recalculate(false);sendTelemetry('page_view',{});
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

- Total Generated Static Pages (EN + TH): **${pageCount} pages** (352 sitemap URLs + root redirect)
- Centralized Admin Command Center & Live Telemetry: \`https://www.xamathi.com/admin/?project=affiliate\`
- Public Website: \`${baseUrl}/\`
- Built-in Interactive Buyer Decision Tools: **9 client-side tools** (Workload Planner, Thai Token Tax Inspector, Hybrid 80/20 Router Calculator, GPU VRAM & Burn-Rate Checker, Ready-to-Deploy vLLM Command Generator, RAG Vector DB & VPS RAM Sizer, 1-Click 6-Line Executive Summary Copy, Affiliate Skill ROI Estimator, and 5 Architecture Playbooks)

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

  const sharedHomeCss = renderSharedStyles(false);
  const sharedSubpageCss = renderSharedStyles(true);
  const precomputedCatalogByLocale = buildPrecomputedClientDataByLocale(affiliateConfig);

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
      publicBaseUrl,
      sharedHomeCss,
      precomputedCatalogByLocale[locale]
    );
    fs.writeFileSync(path.join(stagingDir, locale, 'index.html'), homeHtml, 'utf8');
    if (locale === 'th') {
      fs.writeFileSync(path.join(stagingDir, 'th', 'prototype.html'), homeHtml, 'utf8');
    }
    sitemapUrls.push(`${publicBaseUrl}/${locale}/index.html`);

    for (const guide of playbooks) {
      const guideHtml = renderPlaybookGuidePage(
        locale,
        guide,
        playbooks,
        catalog,
        affiliateConfig,
        publicBaseUrl,
        sharedHomeCss
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
        sharedSubpageCss,
        precomputedCatalogByLocale[locale],
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
> Visual interactive calculator, 9 client-side engineering tools (Workload TCO Planner, Thai Token Tax Inspector, Hybrid 80/20 Model Router, GPU VRAM & Idle Burn-Rate Checker, vLLM Launch Command Generator, RAG Vector DB & VPS RAM Sizer, 1-Click 6-Line Executive Spec Summary, Affiliate Skill ROI Calculator, and 5 Production AI Architecture Playbooks) across ${totalHtmlPages} bilingual pages.

- English Planner: ${publicBaseUrl}/en/index.html
- Thai Planner: ${publicBaseUrl}/th/index.html
- Thai Tokenizer Benchmark Guide: ${publicBaseUrl}/th/guides/thai-tokenizer-cost-benchmark.html
- LINE OA + RAG Blueprint Guide: ${publicBaseUrl}/th/guides/line-oa-rag-chatbot-blueprint.html
- Claude Code & Cursor 60% Cost Cut Guide: ${publicBaseUrl}/th/guides/claude-code-cursor-cost-cut.html
- API to RunPod vLLM Migration Guide: ${publicBaseUrl}/th/guides/api-to-runpod-vllm-migration.html
- Thai VPS vs Global Cloud Guide: ${publicBaseUrl}/th/guides/thai-vps-vs-global-cloud-ai-backend.html
- Validation & Onboarding Kit: ${publicBaseUrl}/validation-kit.md
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
    playbookPages: locales.length * playbooks.length,
    sitemapUrls: sitemapUrls.length
  };
}
