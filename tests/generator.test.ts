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

test('Pre-mortem #3: generateStaticSite is idempotent across reruns and creates bilingual SEO pages + validation kit', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-cost-calc-test-'));
  const distPath = path.join(tmpRoot, 'dist');

  try {
    const firstRun = generateStaticSite(distPath, affiliateConfig, 'https://example.pages.dev');
    const secondRun = generateStaticSite(distPath, affiliateConfig, 'https://example.pages.dev');

    assert.equal(firstRun.totalHtmlPages, 66);
    assert.equal(secondRun.totalHtmlPages, 66);
    assert.equal(firstRun.enComparisonPages, 31);
    assert.equal(firstRun.thComparisonPages, 31);
    assert.equal(firstRun.sitemapUrls, 64);

    const thHome = fs.readFileSync(path.join(distPath, 'th', 'index.html'), 'utf8');
    assert.equal(thHome.includes('application/ld+json'), true);
    assert.equal(thHome.includes('YOUR_RUNPOD_ID'), true);
    assert.equal(thHome.includes('YOUR_CLOUDWAYS_ID'), true);

    const enCompare = fs.readFileSync(
      path.join(distPath, 'en', 'compare', 'claude-3-7-sonnet-vs-runpod-a100-80gb-break-even.html'),
      'utf8'
    );
    assert.equal(enCompare.includes('Claude 3.7 Sonnet API vs RunPod NVIDIA A100 PCIe (80GB)'), true);

    const validationKit = fs.readFileSync(path.join(distPath, 'validation-kit.md'), 'utf8');
    assert.equal(validationKit.includes('Show HN'), true);
    assert.equal(validationKit.includes('https://example.pages.dev/th/index.html'), true);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test('Live HTTP Validation Server serves bilingual pages and records deduplicated telemetry round-trip', async () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-cost-calc-srv-'));
  fs.mkdirSync(path.join(tmpRoot, 'config'), { recursive: true });
  fs.copyFileSync(configPath, path.join(tmpRoot, 'config', 'affiliates.json'));

  const { server, port } = await startValidationServer(0, tmpRoot);
  try {
    const pageRes = await fetch(`http://127.0.0.1:${port}/th/index.html`);
    assert.equal(pageRes.status, 200);
    const html = await pageRes.text();
    assert.equal(html.includes('เครื่องคำนวณต้นทุน AI API'), true);

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
