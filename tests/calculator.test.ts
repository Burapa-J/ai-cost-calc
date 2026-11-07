import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  calculateCostComparison,
  DemandValidationStore,
  resolveAffiliateUrl,
  sanitizeWorkloadInput,
  updateAffiliateCode
} from '../src/calculator.ts';
import type { AffiliateConfigFile } from '../src/domain.ts';

const configPath = path.resolve(import.meta.dirname, '../config/affiliates.json');
const affiliateConfig = JSON.parse(fs.readFileSync(configPath, 'utf8')) as AffiliateConfigFile;

test('Pre-mortem #1: sanitizeWorkloadInput clamps negative, NaN, and out-of-range values to safe bounds', () => {
  const sanitized = sanitizeWorkloadInput({
    requestsPerDay: -999,
    inputTokensPerReq: Number.NaN,
    outputTokensPerReq: Number.POSITIVE_INFINITY,
    cacheHitRate: 5.5,
    agentSteps: 0,
    activeHoursPerDay: -4,
    usdToThbRate: -10
  });

  assert.equal(sanitized.requestsPerDay, 1);
  assert.equal(sanitized.inputTokensPerReq, 2500);
  assert.equal(sanitized.outputTokensPerReq, 600);
  assert.equal(sanitized.cacheHitRate, 0.95);
  assert.equal(sanitized.agentSteps, 1);
  assert.equal(sanitized.activeHoursPerDay, 0.5);
  assert.equal(sanitized.usdToThbRate, 20);

  const result = calculateCostComparison(sanitized, affiliateConfig, 'edge-test');
  for (const api of result.apiOptions) {
    assert.equal(Number.isFinite(api.monthlyUsd), true);
    assert.equal(api.monthlyUsd >= 0, true);
  }
  for (const gpu of result.gpuOptions) {
    assert.equal(Number.isFinite(gpu.monthlyUsd), true);
    assert.equal(gpu.monthlyUsd > 0, true);
  }
});

test('Low workload recommends pay-per-token API while heavy agent loop workload recommends Cloud GPU', () => {
  const lowTraffic = calculateCostComparison(
    {
      requestsPerDay: 150,
      inputTokensPerReq: 1500,
      outputTokensPerReq: 400,
      cacheHitRate: 0.5,
      agentSteps: 1,
      activeHoursPerDay: 12,
      usdToThbRate: 34.5
    },
    affiliateConfig,
    'low-traffic'
  );

  assert.equal(lowTraffic.recommendedWinner.category, 'llm_api');
  assert.equal(lowTraffic.recommendedWinner.affiliateId, 'aimlapi');

  const heavyAgentTraffic = calculateCostComparison(
    {
      requestsPerDay: 6000,
      inputTokensPerReq: 4000,
      outputTokensPerReq: 800,
      cacheHitRate: 0.1,
      agentSteps: 6,
      activeHoursPerDay: 8,
      usdToThbRate: 34.5
    },
    affiliateConfig,
    'heavy-agent'
  );

  assert.equal(heavyAgentTraffic.recommendedWinner.category, 'cloud_gpu');
  assert.equal(heavyAgentTraffic.recommendedWinner.affiliateId, 'runpod');
  assert.equal(heavyAgentTraffic.recommendedWinner.savingsVsAlternativeThb > 10_000, true);
});

test('Pre-mortem #4: resolveAffiliateUrl injects partner parameter and campaign tag cleanly', () => {
  const url = resolveAffiliateUrl(affiliateConfig, 'cloudways', 'claude-vs-gpt4o');
  const parsed = new URL(url);
  assert.equal(parsed.hostname, 'www.cloudways.com');
  assert.equal(parsed.searchParams.get('id'), 'YOUR_CLOUDWAYS_ID');
  assert.equal(parsed.searchParams.get('utm_campaign'), 'claude-vs-gpt4o');

  const updatedCfg = updateAffiliateCode(affiliateConfig, 'cloudways', 'CW_998877');
  assert.equal(updatedCfg.programs.cloudways.affiliateCode, 'CW_998877');
  assert.throws(() => updateAffiliateCode(affiliateConfig, 'invalid_partner', '123'));
  assert.throws(() => updateAffiliateCode(affiliateConfig, 'cloudways', '   '));
});

test('Pre-mortem #2: DemandValidationStore deduplicates repeated eventId and computes PROVEN_GO_SCALE verdict', () => {
  const store = new DemandValidationStore();

  const firstInsert = store.recordEvent({
    eventId: 'evt-dup-1',
    sessionId: 'sess-1',
    timestampIso: '2026-11-07T07:00:00Z',
    eventType: 'affiliate_cta_click',
    locale: 'th',
    pageSlug: 'home',
    affiliateId: 'cloudways'
  });
  const duplicateInsert = store.recordEvent({
    eventId: 'evt-dup-1',
    sessionId: 'sess-1',
    timestampIso: '2026-11-07T07:00:01Z',
    eventType: 'affiliate_cta_click',
    locale: 'th',
    pageSlug: 'home',
    affiliateId: 'cloudways'
  });

  assert.equal(firstInsert, true);
  assert.equal(duplicateInsert, false);

  for (let i = 1; i <= 60; i++) {
    const sid = `sess-${i}`;
    store.recordEvent({
      eventId: `pv-${i}`,
      sessionId: sid,
      timestampIso: '2026-11-07T07:01:00Z',
      eventType: 'page_view',
      locale: i % 2 === 0 ? 'th' : 'en',
      pageSlug: 'home'
    });
    if (i <= 20) {
      store.recordEvent({
        eventId: `calc-${i}`,
        sessionId: sid,
        timestampIso: '2026-11-07T07:02:00Z',
        eventType: 'calculation_run',
        locale: 'th',
        pageSlug: 'home'
      });
    }
    if (i >= 2 && i <= 4) {
      store.recordEvent({
        eventId: `aff-${i}`,
        sessionId: sid,
        timestampIso: '2026-11-07T07:03:00Z',
        eventType: 'affiliate_cta_click',
        locale: 'en',
        pageSlug: 'home',
        affiliateId: 'runpod'
      });
    }
  }

  const report = store.evaluateDemand(affiliateConfig, 0.08);
  assert.equal(report.uniqueSessions, 60);
  assert.equal(report.affiliateCtaClicks, 4);
  assert.equal(report.clicksByProgram.cloudways, 1);
  assert.equal(report.clicksByProgram.runpod, 3);
  assert.equal(report.verdict, 'PROVEN_GO_SCALE');
  assert.equal(report.requiredMonthlyVisitorsFor100kThb > 0, true);
});
