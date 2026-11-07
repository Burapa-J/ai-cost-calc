import {
  type AffiliateConfigFile,
  type AffiliateId,
  type ApiCostBreakdown,
  CLOUD_GPUS,
  CLOUD_VPS_OPTIONS,
  type CostComparisonResult,
  type DemandValidationReport,
  type DemandValidationVerdict,
  type GpuCostBreakdown,
  LLM_MODELS,
  type ValidationTelemetryEvent,
  type VpsCostBreakdown,
  type WorkloadInput
} from './domain.ts';

const DAYS_PER_MONTH = 30;

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, num));
}

export function sanitizeWorkloadInput(raw: Partial<WorkloadInput>): WorkloadInput {
  return {
    requestsPerDay: Math.round(clampNumber(raw.requestsPerDay, 1, 10_000_000, 1_500)),
    inputTokensPerReq: Math.round(clampNumber(raw.inputTokensPerReq, 1, 2_000_000, 2_500)),
    outputTokensPerReq: Math.round(clampNumber(raw.outputTokensPerReq, 1, 200_000, 600)),
    cacheHitRate: Number(clampNumber(raw.cacheHitRate, 0, 0.95, 0.35).toFixed(2)),
    agentSteps: Math.round(clampNumber(raw.agentSteps, 1, 50, 3)),
    activeHoursPerDay: Number(clampNumber(raw.activeHoursPerDay, 0.5, 24, 12).toFixed(1)),
    usdToThbRate: Number(clampNumber(raw.usdToThbRate, 20, 60, 34.5).toFixed(2))
  };
}

export function resolveAffiliateUrl(
  config: AffiliateConfigFile,
  affiliateId: AffiliateId,
  subIdSlug?: string
): string {
  const program = config.programs[affiliateId];
  if (!program || !program.baseUrl) {
    throw new Error(`Unknown or unconfigured affiliate program: ${String(affiliateId)}`);
  }
  const url = new URL(program.baseUrl);
  const code = (program.affiliateCode || '').trim() || 'ai-cost-calc';
  url.searchParams.set(program.paramKey || 'ref', code);
  if (subIdSlug) {
    url.searchParams.set('utm_campaign', subIdSlug.replace(/[^a-zA-Z0-9_-]/g, ''));
  }
  return url.toString();
}

export function updateAffiliateCode(
  config: AffiliateConfigFile,
  affiliateId: string,
  newCode: string
): AffiliateConfigFile {
  const trimmedCode = (newCode || '').trim();
  if (!trimmedCode) {
    throw new Error('Affiliate code must not be empty');
  }
  if (!(affiliateId in config.programs)) {
    throw new Error(`Unknown affiliate program ID: ${affiliateId}`);
  }
  const typedId = affiliateId as AffiliateId;
  return {
    ...config,
    programs: {
      ...config.programs,
      [typedId]: {
        ...config.programs[typedId],
        affiliateCode: trimmedCode
      }
    }
  };
}

const DEFAULT_INDEXNOW_KEY = 'a8f4c2e91b6d40789e3c5a12f08d6b4e';

export function sanitizeIndexNowKey(rawKey?: string): string {
  const candidate = (rawKey || '').trim();
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(candidate)) {
    return DEFAULT_INDEXNOW_KEY;
  }
  return candidate;
}

export interface SkillFrontmatterValidationResult {
  valid: boolean;
  name?: string;
  description?: string;
  error?: string;
}

export function validateSkillMarkdown(
  expectedFolderName: string,
  markdownContent: string
): SkillFrontmatterValidationResult {
  const match = markdownContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/);
  if (!match) {
    return { valid: false, error: 'Missing YAML frontmatter block or markdown body' };
  }
  const frontmatter = match[1];
  const body = match[2].trim();
  if (!body) {
    return { valid: false, error: 'Markdown body must not be empty' };
  }

  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
  if (!nameMatch || !descMatch) {
    return { valid: false, error: 'Missing required name or description field in frontmatter' };
  }

  const name = nameMatch[1].trim().replace(/^["']|["']$/g, '');
  const description = descMatch[1].trim().replace(/^["']|["']$/g, '');

  if (
    name.length < 1 ||
    name.length > 64 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) ||
    name !== expectedFolderName
  ) {
    return {
      valid: false,
      name,
      description,
      error: `Invalid skill name "${name}" (must match folder "${expectedFolderName}" and be lowercase a-z0-9-)`
    };
  }

  if (description.length < 10 || description.length > 1024) {
    return {
      valid: false,
      name,
      description,
      error: 'Skill description must be between 10 and 1024 characters'
    };
  }

  return { valid: true, name, description };
}

export function calculateCostComparison(
  rawInput: Partial<WorkloadInput>,
  affiliateConfig: AffiliateConfigFile,
  pageSlug = 'home'
): CostComparisonResult {
  const input = sanitizeWorkloadInput(rawInput);

  const effectiveDailyCalls = input.requestsPerDay * input.agentSteps;
  const effectiveMonthlyAgentCalls = effectiveDailyCalls * DAYS_PER_MONTH;

  const totalMonthlyInputTokens = effectiveMonthlyAgentCalls * input.inputTokensPerReq;
  const totalMonthlyOutputTokens = effectiveMonthlyAgentCalls * input.outputTokensPerReq;

  const uncachedInputFraction = 1 - input.cacheHitRate;
  const cachedInputFraction = input.cacheHitRate;

  const apiOptions: ApiCostBreakdown[] = LLM_MODELS.map((model) => {
    const inputMillions = totalMonthlyInputTokens / 1_000_000;
    const outputMillions = totalMonthlyOutputTokens / 1_000_000;

    const blendedInputUsdPer1M =
      uncachedInputFraction * model.inputUsdPer1M +
      cachedInputFraction * model.cachedInputUsdPer1M;

    const monthlyUsd = Number(
      (inputMillions * blendedInputUsdPer1M + outputMillions * model.outputUsdPer1M).toFixed(2)
    );
    const monthlyThb = Number((monthlyUsd * input.usdToThbRate).toFixed(0));
    const monthlyTasks = input.requestsPerDay * DAYS_PER_MONTH;
    const costPer1kTasksUsd = Number(((monthlyUsd / monthlyTasks) * 1000).toFixed(2));

    return {
      modelId: model.id,
      name: model.name,
      provider: model.provider,
      monthlyUsd,
      monthlyThb,
      costPer1kTasksUsd,
      affiliateId: model.affiliateId,
      affiliateUrl: resolveAffiliateUrl(affiliateConfig, model.affiliateId, `${pageSlug}-${model.id}`)
    };
  }).sort((a, b) => a.monthlyUsd - b.monthlyUsd);

  const cheapestApi = apiOptions[0];
  const flagshipApi =
    apiOptions.find((m) => m.modelId === 'claude-3-7-sonnet') ?? apiOptions[apiOptions.length - 1];

  const activeSecondsPerDay = input.activeHoursPerDay * 3600;
  const dailyOutputTokens = effectiveDailyCalls * input.outputTokensPerReq;
  const requiredTokensPerSec = dailyOutputTokens / Math.max(1, activeSecondsPerDay);

  const gpuOptions: GpuCostBreakdown[] = CLOUD_GPUS.map((gpu) => {
    const instancesNeeded = Math.max(1, Math.ceil(requiredTokensPerSec / gpu.throughputTokensPerSec));
    const monthlyHours = input.activeHoursPerDay * DAYS_PER_MONTH;
    const monthlyUsd = Number((instancesNeeded * gpu.hourlyUsd * monthlyHours).toFixed(2));
    const monthlyThb = Number((monthlyUsd * input.usdToThbRate).toFixed(0));

    const singleGpuMonthlyUsd = gpu.hourlyUsd * monthlyHours;
    const cheapestApiCostPerTask = cheapestApi.monthlyUsd / (input.requestsPerDay * DAYS_PER_MONTH);
    const flagshipApiCostPerTask = flagshipApi.monthlyUsd / (input.requestsPerDay * DAYS_PER_MONTH);

    const breakEvenTasksPerDayVsCheapestApi = Math.max(
      1,
      Math.ceil(singleGpuMonthlyUsd / Math.max(0.000001, cheapestApiCostPerTask * DAYS_PER_MONTH))
    );
    const breakEvenTasksPerDayVsFlagshipApi = Math.max(
      1,
      Math.ceil(singleGpuMonthlyUsd / Math.max(0.000001, flagshipApiCostPerTask * DAYS_PER_MONTH))
    );

    return {
      gpuId: gpu.id,
      name: gpu.name,
      vramGb: gpu.vramGb,
      instancesNeeded,
      monthlyUsd,
      monthlyThb,
      breakEvenTasksPerDayVsCheapestApi,
      breakEvenTasksPerDayVsFlagshipApi,
      affiliateId: gpu.affiliateId,
      affiliateUrl: resolveAffiliateUrl(affiliateConfig, gpu.affiliateId, `${pageSlug}-${gpu.id}`)
    };
  }).sort((a, b) => a.monthlyUsd - b.monthlyUsd);

  const vpsOptions: VpsCostBreakdown[] = CLOUD_VPS_OPTIONS.map((vps) => ({
    vpsId: vps.id,
    name: vps.name,
    region: vps.region,
    vcpu: vps.vcpu,
    ramGb: vps.ramGb,
    monthlyUsd: vps.monthlyUsd,
    monthlyThb: Number((vps.monthlyUsd * input.usdToThbRate).toFixed(0)),
    affiliateId: vps.affiliateId,
    affiliateUrl: resolveAffiliateUrl(affiliateConfig, vps.affiliateId, `${pageSlug}-${vps.id}`)
  }));

  const bestGpu = gpuOptions[0];
  const gpuBeatsFlagshipApi = bestGpu.monthlyUsd < flagshipApi.monthlyUsd;

  if (gpuBeatsFlagshipApi) {
    const savingsUsd = Number((flagshipApi.monthlyUsd - bestGpu.monthlyUsd).toFixed(2));
    const savingsThb = Number((savingsUsd * input.usdToThbRate).toFixed(0));
    return {
      input,
      effectiveMonthlyAgentCalls,
      totalMonthlyInputTokens,
      totalMonthlyOutputTokens,
      apiOptions,
      gpuOptions,
      vpsOptions,
      recommendedWinner: {
        category: 'cloud_gpu',
        id: bestGpu.gpuId,
        name: bestGpu.name,
        monthlyUsd: bestGpu.monthlyUsd,
        monthlyThb: bestGpu.monthlyThb,
        savingsVsAlternativeUsd: savingsUsd,
        savingsVsAlternativeThb: savingsThb,
        affiliateId: bestGpu.affiliateId,
        affiliateUrl: bestGpu.affiliateUrl,
        verdict: {
          en: `At ${input.requestsPerDay.toLocaleString()} tasks/day, renting a dedicated GPU (${bestGpu.name}) caps your bill at a predictable $${bestGpu.monthlyUsd.toLocaleString()}/mo — saving $${savingsUsd.toLocaleString()}/mo compared to per-token billing on ${flagshipApi.name} with no surprise overages.`,
          th: `ที่ปริมาณงาน ${input.requestsPerDay.toLocaleString()} งาน/วัน การเช่าเหมาชั่วโมง (${bestGpu.name}) ช่วยคุมงบรายเดือนให้นิ่งอยู่ที่ ฿${bestGpu.monthlyThb.toLocaleString()} ประหยัดลง ฿${savingsThb.toLocaleString()}/เดือน เมื่อเทียบกับ ${flagshipApi.name} และทำงานต่อเนื่องได้โดยไม่ต้องกังวลว่าบิลจะพุ่งตามจำนวนรอบ`
        }
      }
    };
  }

  const savingsUsd = Number((bestGpu.monthlyUsd - flagshipApi.monthlyUsd).toFixed(2));
  const savingsThb = Number((savingsUsd * input.usdToThbRate).toFixed(0));
  return {
    input,
    effectiveMonthlyAgentCalls,
    totalMonthlyInputTokens,
    totalMonthlyOutputTokens,
    apiOptions,
    gpuOptions,
    vpsOptions,
    recommendedWinner: {
      category: 'llm_api',
      id: flagshipApi.modelId,
      name: flagshipApi.name,
      monthlyUsd: flagshipApi.monthlyUsd,
      monthlyThb: flagshipApi.monthlyThb,
      savingsVsAlternativeUsd: savingsUsd,
      savingsVsAlternativeThb: savingsThb,
      affiliateId: flagshipApi.affiliateId,
      affiliateUrl: flagshipApi.affiliateUrl,
      verdict: {
        en: `Below ${bestGpu.breakEvenTasksPerDayVsFlagshipApi.toLocaleString()} tasks/day, paying only for what you use via API (${flagshipApi.name}) saves $${savingsUsd.toLocaleString()}/mo vs. renting a GPU, with one-stop billing and zero server maintenance.`,
        th: `เมื่อใช้งานไม่ถึง ${bestGpu.breakEvenTasksPerDayVsFlagshipApi.toLocaleString()} งาน/วัน การจ่ายตามจริงผ่าน API (${flagshipApi.name}) ช่วยประหยัดเงินได้ ฿${savingsThb.toLocaleString()}/เดือน ไม่เสียค่าเช่าเครื่องทิ้งไว้ตอนไม่มีคนใช้ และรวมบิลจ่ายที่เดียวจบโดยไม่ต้องดูแลเซิร์ฟเวอร์เอง`
      }
    }
  };
}

export class DemandValidationStore {
  private seenEventIds = new Set<string>();
  private events: ValidationTelemetryEvent[] = [];

  public recordEvent(event: ValidationTelemetryEvent): boolean {
    if (!event.eventId || this.seenEventIds.has(event.eventId)) {
      return false;
    }
    this.seenEventIds.add(event.eventId);
    this.events.push(event);
    return true;
  }

  public getAllEvents(): readonly ValidationTelemetryEvent[] {
    return this.events;
  }

  public evaluateDemand(
    affiliateConfig: AffiliateConfigFile,
    assumedAffiliateConversionRate = 0.08
  ): DemandValidationReport {
    const uniqueSessionSet = new Set<string>();
    let totalPageViews = 0;
    let calculatorInteractions = 0;
    let scenariosShared = 0;
    let affiliateCtaClicks = 0;

    const clicksByProgram: Record<AffiliateId, number> = {
      aimlapi: 0,
      runpod: 0,
      cloudways: 0,
      vercel: 0,
      hostatom: 0,
      rukcom: 0,
      agensi: 0
    };

    for (const ev of this.events) {
      if (ev.sessionId) {
        uniqueSessionSet.add(ev.sessionId);
      }
      if (ev.eventType === 'page_view') {
        totalPageViews += 1;
      } else if (ev.eventType === 'calculation_run') {
        calculatorInteractions += 1;
      } else if (ev.eventType === 'scenario_shared') {
        scenariosShared += 1;
      } else if (ev.eventType === 'affiliate_cta_click') {
        affiliateCtaClicks += 1;
        if (ev.affiliateId && ev.affiliateId in clicksByProgram) {
          clicksByProgram[ev.affiliateId] += 1;
        }
      }
    }

    const uniqueSessions = uniqueSessionSet.size;
    const denominator = Math.max(1, uniqueSessions);
    const interactionRate = Number((calculatorInteractions / denominator).toFixed(4));
    const affiliateCtr = Number((affiliateCtaClicks / denominator).toFixed(4));

    let expectedCommissionSumUsd = 0;
    for (const [progId, count] of Object.entries(clicksByProgram) as Array<[AffiliateId, number]>) {
      const payout = affiliateConfig.programs[progId]?.estimatedPayoutUsd ?? 40;
      expectedCommissionSumUsd += count * assumedAffiliateConversionRate * payout;
    }

    const projectedMonthlyRevenueUsdAtCurrentCtr = Number(expectedCommissionSumUsd.toFixed(2));
    const projectedMonthlyRevenueThbAtCurrentCtr = Number(
      (projectedMonthlyRevenueUsdAtCurrentCtr * affiliateConfig.usdToThbDefault).toFixed(0)
    );

    const revenuePerVisitorThb =
      uniqueSessions > 0 ? projectedMonthlyRevenueThbAtCurrentCtr / uniqueSessions : 0;
    const requiredMonthlyVisitorsFor100kThb =
      revenuePerVisitorThb > 0 ? Math.ceil(100_000 / revenuePerVisitorThb) : 12_500;

    let verdict: DemandValidationVerdict;
    let explanation: { en: string; th: string };

    if (uniqueSessions < 50) {
      verdict = 'INSUFFICIENT_DATA';
      explanation = {
        en: `Collected ${uniqueSessions}/50 minimum unique sessions. Share the calculator link in 2–3 developer communities to complete the smoke test.`,
        th: `เก็บข้อมูลผู้ใช้จริงได้ ${uniqueSessions}/50 คนแรก แนะนำให้นำลิงก์เครื่องคำนวณไปโพสต์ในกลุ่มนักพัฒนาอีก 2–3 แห่งเพื่อสรุปผล`
      };
    } else if (interactionRate >= 0.15 && affiliateCtr >= 0.025) {
      verdict = 'PROVEN_GO_SCALE';
      explanation = {
        en: `Demand Proven! Interaction rate (${(interactionRate * 100).toFixed(1)}%) and Affiliate CTR (${(affiliateCtr * 100).toFixed(1)}%) beat benchmark thresholds. Ready to register custom domain & scale to ${requiredMonthlyVisitorsFor100kThb.toLocaleString()} monthly visitors for 100,000 THB/mo.`,
        th: `พิสูจน์แล้วว่ามีคนใช้งานและคลิกจริง! อัตราการคำนวณ (${(interactionRate * 100).toFixed(1)}%) และอัตราคลิกลิงก์ Affiliate (${(affiliateCtr * 100).toFixed(1)}%) ผ่านเกณฑ์มาตรฐาน คุ้มค่าที่จะจดโดเมนจริงและขยายทราฟฟิกสู่ ${requiredMonthlyVisitorsFor100kThb.toLocaleString()} คน/เดือน เพื่อทำรายได้ 100,000 บาท/เดือน`
      };
    } else if (interactionRate >= 0.15 && affiliateCtr < 0.025) {
      verdict = 'ITERATE_CTA';
      explanation = {
        en: `Users love the calculator (${(interactionRate * 100).toFixed(1)}% interaction), but Affiliate CTR (${(affiliateCtr * 100).toFixed(1)}%) is below 2.5%. Highlight free credits/coupons on CTA buttons before scaling.`,
        th: `คนชอบใช้เครื่องคำนวณจริง (${(interactionRate * 100).toFixed(1)}%) แต่อัตราคลิกลิงก์ Affiliate (${(affiliateCtr * 100).toFixed(1)}%) ยังต่ำกว่า 2.5% ควรปรับข้อความปุ่มเป็น "รับเครดิตฟรี / ส่วนลด" ก่อนขยายระบบ`
      };
    } else {
      verdict = 'KILL_OR_PIVOT';
      explanation = {
        en: `Low calculator interaction (${(interactionRate * 100).toFixed(1)}%). Pivot to Model 2 (Thai Credit Card & Refinance Calculator) before spending money on a domain.`,
        th: `อัตราการใช้งานเครื่องคำนวณยังต่ำ (${(interactionRate * 100).toFixed(1)}%) แนะนำให้สลับไปทดสอบโมเดลที่ 2 (คำนวณรีไฟแนนซ์/บัตรเครดิตไทย) โดยยังไม่ต้องเสียเงินจดโดเมน`
      };
    }

    return {
      uniqueSessions,
      totalPageViews,
      calculatorInteractions,
      scenariosShared,
      affiliateCtaClicks,
      interactionRate,
      affiliateCtr,
      clicksByProgram,
      projectedMonthlyRevenueUsdAtCurrentCtr,
      projectedMonthlyRevenueThbAtCurrentCtr,
      requiredMonthlyVisitorsFor100kThb,
      verdict,
      explanation
    };
  }
}
