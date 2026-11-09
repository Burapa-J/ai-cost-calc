import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import type { AffiliateConfigFile } from '../src/domain.ts';
import { generateStaticSite } from '../src/generator.ts';
import { startValidationServer } from '../src/server.ts';

const configPath = path.resolve(import.meta.dirname, '../config/affiliates.json');
const affiliateConfig = JSON.parse(fs.readFileSync(configPath, 'utf8')) as AffiliateConfigFile;

test('Pre-mortem #3: generateStaticSite is idempotent across reruns and creates 353 visual zero-fluff bilingual SEO & Playbook pages with brand logo and no public Live Stats', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-cost-calc-test-'));
  const distPath = path.join(tmpRoot, 'dist');

  try {
    const firstRun = generateStaticSite(distPath, affiliateConfig, 'https://burapa-j.github.io/ai-cost-calc');
    const secondRun = generateStaticSite(distPath, affiliateConfig, 'https://burapa-j.github.io/ai-cost-calc');

    assert.equal(firstRun.totalHtmlPages, 353);
    assert.equal(secondRun.totalHtmlPages, 353);
    assert.equal(firstRun.enComparisonPages, 170);
    assert.equal(firstRun.thComparisonPages, 170);
    assert.equal(firstRun.playbookPages, 10);
    assert.equal(firstRun.sitemapUrls, 352);

    assert.equal(fs.existsSync(path.join(distPath, 'favicon.svg')), true);
    assert.equal(fs.existsSync(path.join(distPath, 'validation-dashboard.html')), false);

    const thHome = fs.readFileSync(path.join(distPath, 'th', 'index.html'), 'utf8');
    assert.equal(thHome.includes('TCO // BENCHMARK.26'), true);
    assert.equal(thHome.includes('class="brand-logo-svg"'), true);
    assert.equal(thHome.includes('favicon.svg'), true);
    assert.equal(thHome.includes('Live Stats'), false);
    assert.equal(thHome.includes('--paper: #FBFBFD'), true);
    assert.equal(thHome.includes('backdrop-filter: saturate(180%) blur(20px)'), true);
    assert.equal(thHome.includes('BURAPA'), true);
    assert.equal(thHome.includes('https://www.agensi.io/r/BURAPA'), true);
    assert.equal(thHome.includes('id="affiliate-disclosure"'), true);
    assert.equal(thHome.includes('จ่ายที่เดียวจบ ไม่ต้องแยกหลายบิล'), true);
    assert.equal(thHome.includes('id="live-cost-curve-svg"'), true);
    assert.equal(thHome.includes('id="playbooks"'), true);
    assert.equal(thHome.includes('https://abacus.jasoncameron.dev/hit/'), true);
    assert.equal(thHome.includes('burapa_ai_cost_calc_live'), true);
    assert.equal(
      thHome.includes('<link rel="canonical" href="https://burapa-j.github.io/ai-cost-calc/th/index.html" />'),
      true
    );
    assert.equal(thHome.includes('⚡'), false);
    assert.equal(thHome.includes('#6C79F0'), false);
    assert.equal(thHome.includes('#8690FF'), false);
    assert.equal(thHome.includes('#3DD68C'), false);
    assert.equal(thHome.includes('#56A8FF'), false);
    assert.equal(thHome.includes('#B98BFF'), false);
    assert.equal(thHome.includes('#F2A33C'), false);
    assert.equal(thHome.includes('linear-gradient'), false);
    assert.equal(thHome.includes('✅'), false);
    assert.equal(thHome.includes('⚠️'), false);
    assert.equal(thHome.includes('🌙'), false);
    assert.equal(thHome.includes('id="inp-prompt-sample"'), true);
    assert.equal(thHome.includes('id="btn-apply-tokens"'), true);
    assert.equal(thHome.includes('id="token-tax-readout"'), true);
    assert.equal(thHome.includes('id="inp-hybrid-router"'), true);
    assert.equal(thHome.includes('id="inp-router-pct"'), true);
    assert.equal(thHome.includes('id="hybrid-router-summary"'), true);
    assert.equal(thHome.includes('id="inp-rag-docs"'), true);
    assert.equal(thHome.includes('id="inp-rag-stack"'), true);
    assert.equal(thHome.includes('id="vps-ram-summary"'), true);
    assert.equal(thHome.includes('id="vps-docker-command"'), true);
    assert.equal(thHome.includes('id="btn-copy-summary"'), true);

    const keyFileContent = fs.readFileSync(
      path.join(distPath, 'a8f4c2e91b6d40789e3c5a12f08d6b4e.txt'),
      'utf8'
    );
    assert.equal(keyFileContent, 'a8f4c2e91b6d40789e3c5a12f08d6b4e');

    const enSubpagePath = path.join(
      distPath,
      'en',
      'compare',
      'claude-3-7-sonnet-vs-runpod-a100-80gb-break-even.html'
    );
    const enCompare = fs.readFileSync(enSubpagePath, 'utf8');
    assert.equal(enCompare.includes('Claude 3.7 Sonnet vs. RunPod NVIDIA A100 PCIe (80GB)'), true);
    assert.equal(enCompare.includes('class="matchup-spotlight"'), true);
    assert.equal(enCompare.includes("onclick=\"recordAffiliateClick('aimlapi'"), true);
    assert.equal(enCompare.includes("onclick=\"recordAffiliateClick('runpod'"), true);
    assert.equal(enCompare.includes('keepalive:true'), true);
    assert.equal(enCompare.includes('<svg'), true);
    assert.equal(enCompare.includes('id="inp-prompt-sample"'), true);
    assert.equal(enCompare.includes('id="inp-hybrid-router"'), true);
    assert.equal(enCompare.includes('id="inp-rag-docs"'), true);
    assert.equal(enCompare.includes('id="btn-copy-summary"'), true);
    assert.equal(Buffer.byteLength(enCompare, 'utf8') < 65_000, true);

    const workloadPage = fs.readFileSync(
      path.join(distPath, 'th', 'compare', 'autonomous-coding-agent-with-claude-3-7-sonnet-cost-estimator.html'),
      'utf8'
    );
    assert.equal(workloadPage.includes('ระบบ AI Agent เขียนและตรวจโค้ดอัตโนมัติหลายขั้นตอน ด้วย Claude 3.7 Sonnet'), true);
    assert.equal(workloadPage.includes('class="matchup-spotlight"'), true);
    assert.equal(workloadPage.includes('data-theme="dark"'), true);
    assert.equal(workloadPage.includes('id="theme-toggle"'), true);
    assert.equal(workloadPage.includes('id="inp-selfmodel"'), true);
    assert.equal(workloadPage.includes('id="inp-conc"'), true);
    assert.equal(workloadPage.includes('id="inp-volume"'), true);
    assert.equal(workloadPage.includes('id="vllm-command"'), true);
    assert.equal(workloadPage.includes('id="buyrent-grid"'), true);
    assert.equal(workloadPage.includes('id="inp-prompt-sample"'), true);
    assert.equal(workloadPage.includes('id="inp-hybrid-router"'), true);
    assert.equal(workloadPage.includes('id="inp-rag-docs"'), true);
    assert.equal(workloadPage.includes('id="btn-copy-summary"'), true);
    assert.equal(Buffer.byteLength(workloadPage, 'utf8') < 65_000, true);

    const largestThCompare = fs.readFileSync(
      path.join(distPath, 'th', 'compare', 'autonomous-coding-agent-with-llama-3-3-70b-api-cost-estimator.html'),
      'utf8'
    );
    assert.equal(Buffer.byteLength(largestThCompare, 'utf8') < 65_000, true);

    const thGuidePath = path.join(
      distPath,
      'th',
      'guides',
      'line-oa-rag-chatbot-blueprint.html'
    );
    const thGuide = fs.readFileSync(thGuidePath, 'utf8');
    assert.equal(thGuide.includes('LINE OA'), true);
    assert.equal(thGuide.includes('<svg'), true);
    assert.equal(thGuide.includes('Hostatom'), true);
    assert.equal(thGuide.includes('Ruk-Com'), true);
    assert.equal(thGuide.includes('unique_sessions'), true);
    assert.equal(thGuide.includes('page_views'), true);
    assert.equal(thGuide.includes('affiliate_clicks_total'), true);
    assert.equal(thGuide.includes("onclick=\"recordAffiliateClick('hostatom'"), true);
    assert.equal(Buffer.byteLength(thGuide, 'utf8') < 65_000, true);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test('Live HTTP Validation Server serves minimal bilingual pages and records deduplicated telemetry round-trip', async () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-cost-calc-srv-'));
  fs.mkdirSync(path.join(tmpRoot, 'config'), { recursive: true });
  fs.copyFileSync(configPath, path.join(tmpRoot, 'config', 'affiliates.json'));

  const { server, port } = await startValidationServer(0, tmpRoot);
  try {
    const pageRes = await fetch(`http://127.0.0.1:${port}/th/index.html`);
    assert.equal(pageRes.status, 200);
    const html = await pageRes.text();
    assert.equal(html.includes('TCO // BENCHMARK.26'), true);

    const postRes = await fetch(`http://127.0.0.1:${port}/api/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: 'live-evt-1',
        sessionId: 'live-sess-1',
        timestampIso: '2026-11-07T07:05:00Z',
        eventType: 'affiliate_cta_click',
        locale: 'th',
        pageSlug: 'home',
        affiliateId: 'runpod',
        estimatedMonthlySpendUsd: 350
      })
    });
    assert.equal(postRes.status, 200);

    const reportRes = await fetch(`http://127.0.0.1:${port}/api/validation-report`);
    assert.equal(reportRes.status, 200);
    const report = (await reportRes.json()) as { uniqueSessions: number; affiliateCtaClicks: number };
    assert.equal(report.uniqueSessions, 1);
    assert.equal(report.affiliateCtaClicks, 1);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
