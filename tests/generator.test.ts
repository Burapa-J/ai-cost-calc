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

test('Pre-mortem #3: generateStaticSite is idempotent across reruns and creates 344 minimal un-slop bilingual SEO pages + global counter', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-cost-calc-test-'));
  const distPath = path.join(tmpRoot, 'dist');

  try {
    const firstRun = generateStaticSite(distPath, affiliateConfig, 'https://burapa-j.github.io/ai-cost-calc');
    const secondRun = generateStaticSite(distPath, affiliateConfig, 'https://burapa-j.github.io/ai-cost-calc');

    assert.equal(firstRun.totalHtmlPages, 344);
    assert.equal(secondRun.totalHtmlPages, 344);
    assert.equal(firstRun.enComparisonPages, 170);
    assert.equal(firstRun.thComparisonPages, 170);
    assert.equal(firstRun.sitemapUrls, 342);

    const thHome = fs.readFileSync(path.join(distPath, 'th', 'index.html'), 'utf8');
    assert.equal(thHome.includes('TCO // BENCHMARK.26'), true);
    assert.equal(thHome.includes('--paper: #F6F5F0'), true);
    assert.equal(thHome.includes('https://abacus.jasoncameron.dev/hit/'), true);
    assert.equal(thHome.includes('burapa_ai_cost_calc_live'), true);
    assert.equal(thHome.includes('⚡'), false);

    const enSubpagePath = path.join(
      distPath,
      'en',
      'compare',
      'claude-3-7-sonnet-vs-runpod-a100-80gb-break-even.html'
    );
    const enCompare = fs.readFileSync(enSubpagePath, 'utf8');
    assert.equal(enCompare.includes('Claude 3.7 Sonnet vs. RunPod NVIDIA A100 PCIe (80GB)'), true);
    assert.equal(Buffer.byteLength(enCompare, 'utf8') < 65_000, true);

    const workloadPage = fs.readFileSync(
      path.join(distPath, 'th', 'compare', 'autonomous-coding-agent-with-claude-3-7-sonnet-cost-estimator.html'),
      'utf8'
    );
    assert.equal(workloadPage.includes('ระบบ AI Agent เขียนและตรวจโค้ดอัตโนมัติหลายขั้นตอน ด้วย Claude 3.7 Sonnet'), true);
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
