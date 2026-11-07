export type Locale = 'en' | 'th';

export type ProviderCategory = 'llm_api' | 'cloud_gpu' | 'cloud_vps';

export type AffiliateId =
  | 'aimlapi'
  | 'runpod'
  | 'cloudways'
  | 'vercel'
  | 'hostatom'
  | 'rukcom';

export interface BilingualText {
  en: string;
  th: string;
}

export interface AffiliateProgram {
  id: AffiliateId;
  name: string;
  category: ProviderCategory;
  commissionLabel: BilingualText;
  estimatedPayoutUsd: number;
  baseUrl: string;
  paramKey: string;
  affiliateCode: string;
}

export interface AffiliateConfigFile {
  usdToThbDefault: number;
  programs: Record<AffiliateId, AffiliateProgram>;
}

export interface LlmModelSpec {
  id: string;
  name: string;
  provider: string;
  inputUsdPer1M: number;
  cachedInputUsdPer1M: number;
  outputUsdPer1M: number;
  contextWindowK: number;
  affiliateId: AffiliateId;
  summary: BilingualText;
}

export interface CloudGpuSpec {
  id: string;
  name: string;
  vramGb: number;
  hourlyUsd: number;
  throughputTokensPerSec: number;
  affiliateId: AffiliateId;
  bestForModels: string;
  summary: BilingualText;
}

export interface CloudVpsSpec {
  id: string;
  name: string;
  region: 'global' | 'thailand';
  vcpu: number;
  ramGb: number;
  monthlyUsd: number;
  affiliateId: AffiliateId;
  summary: BilingualText;
}

export interface WorkloadInput {
  requestsPerDay: number;
  inputTokensPerReq: number;
  outputTokensPerReq: number;
  cacheHitRate: number;
  agentSteps: number;
  activeHoursPerDay: number;
  usdToThbRate: number;
}

export interface ApiCostBreakdown {
  modelId: string;
  name: string;
  provider: string;
  monthlyUsd: number;
  monthlyThb: number;
  costPer1kTasksUsd: number;
  affiliateId: AffiliateId;
  affiliateUrl: string;
}

export interface GpuCostBreakdown {
  gpuId: string;
  name: string;
  vramGb: number;
  instancesNeeded: number;
  monthlyUsd: number;
  monthlyThb: number;
  breakEvenTasksPerDayVsCheapestApi: number;
  breakEvenTasksPerDayVsFlagshipApi: number;
  affiliateId: AffiliateId;
  affiliateUrl: string;
}

export interface VpsCostBreakdown {
  vpsId: string;
  name: string;
  region: 'global' | 'thailand';
  vcpu: number;
  ramGb: number;
  monthlyUsd: number;
  monthlyThb: number;
  affiliateId: AffiliateId;
  affiliateUrl: string;
}

export interface CostComparisonResult {
  input: WorkloadInput;
  effectiveMonthlyAgentCalls: number;
  totalMonthlyInputTokens: number;
  totalMonthlyOutputTokens: number;
  apiOptions: ApiCostBreakdown[];
  gpuOptions: GpuCostBreakdown[];
  vpsOptions: VpsCostBreakdown[];
  recommendedWinner: {
    category: 'llm_api' | 'cloud_gpu';
    id: string;
    name: string;
    monthlyUsd: number;
    monthlyThb: number;
    savingsVsAlternativeUsd: number;
    savingsVsAlternativeThb: number;
    affiliateId: AffiliateId;
    affiliateUrl: string;
    verdict: BilingualText;
  };
}

export type TelemetryEventType =
  | 'page_view'
  | 'calculation_run'
  | 'scenario_shared'
  | 'affiliate_cta_click';

export interface ValidationTelemetryEvent {
  eventId: string;
  sessionId: string;
  timestampIso: string;
  eventType: TelemetryEventType;
  locale: Locale;
  pageSlug: string;
  affiliateId?: AffiliateId;
  estimatedMonthlySpendUsd?: number;
}

export type DemandValidationVerdict =
  | 'INSUFFICIENT_DATA'
  | 'KILL_OR_PIVOT'
  | 'ITERATE_CTA'
  | 'PROVEN_GO_SCALE';

export interface DemandValidationReport {
  uniqueSessions: number;
  totalPageViews: number;
  calculatorInteractions: number;
  scenariosShared: number;
  affiliateCtaClicks: number;
  interactionRate: number;
  affiliateCtr: number;
  clicksByProgram: Record<AffiliateId, number>;
  projectedMonthlyRevenueUsdAtCurrentCtr: number;
  projectedMonthlyRevenueThbAtCurrentCtr: number;
  requiredMonthlyVisitorsFor100kThb: number;
  verdict: DemandValidationVerdict;
  explanation: BilingualText;
}

export interface ProgrammaticComparisonPageSpec {
  slug: string;
  category: 'api_vs_api' | 'api_vs_gpu' | 'vps_vs_vps';
  title: BilingualText;
  metaDescription: BilingualText;
  h1: BilingualText;
  presetWorkload: Partial<WorkloadInput>;
  primaryModelId?: string;
  secondaryModelId?: string;
  gpuId?: string;
  vpsIdA?: string;
  vpsIdB?: string;
  faq: Array<{ q: BilingualText; a: BilingualText }>;
}

export const LLM_MODELS: LlmModelSpec[] = [
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic (via AI/ML API)',
    inputUsdPer1M: 3.0,
    cachedInputUsdPer1M: 0.3,
    outputUsdPer1M: 15.0,
    contextWindowK: 200,
    affiliateId: 'aimlapi',
    summary: {
      en: 'Top-tier coding & autonomous agent reasoning model with 90% prompt caching discount.',
      th: 'โมเดลอันดับหนึ่งสำหรับเขียนโค้ดและระบบ Agent พร้อมส่วนลด Prompt Caching 90%'
    }
  },
  {
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o',
    provider: 'OpenAI (via AI/ML API)',
    inputUsdPer1M: 2.5,
    cachedInputUsdPer1M: 1.25,
    outputUsdPer1M: 10.0,
    contextWindowK: 128,
    affiliateId: 'aimlapi',
    summary: {
      en: 'Flagship multimodal omni model for general enterprise workloads and fast customer assistants.',
      th: 'โมเดลเรือธงรองรับข้อความ-ภาพ-เสียง เหมาะกับระบบแชทบอทองค์กรและงานทั่วไป'
    }
  },
  {
    id: 'deepseek-v3-r1',
    name: 'DeepSeek V3 / R1 (API)',
    provider: 'DeepSeek / Router',
    inputUsdPer1M: 0.55,
    cachedInputUsdPer1M: 0.14,
    outputUsdPer1M: 2.19,
    contextWindowK: 128,
    affiliateId: 'aimlapi',
    summary: {
      en: 'High-efficiency open-weight frontier model with aggressive token pricing for heavy reasoning.',
      th: 'โมเดล Open-weight ประสิทธิภาพสูง ราคาประหยัดสำหรับงานวิเคราะห์และ Agent หลายขั้นตอน'
    }
  },
  {
    id: 'gemini-2-5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google (via AI/ML API)',
    inputUsdPer1M: 0.15,
    cachedInputUsdPer1M: 0.0375,
    outputUsdPer1M: 0.6,
    contextWindowK: 1000,
    affiliateId: 'aimlapi',
    summary: {
      en: '1M context window ultra-fast model built for high-volume RAG and document pipelines.',
      th: 'รองรับ Context ยาว 1 ล้าน Token ความเร็วสูงและต้นทุนต่ำมากสำหรับสรุปเอกสาร/RAG'
    }
  },
  {
    id: 'gpt-4o-mini',
    name: 'OpenAI GPT-4o mini',
    provider: 'OpenAI (via AI/ML API)',
    inputUsdPer1M: 0.15,
    cachedInputUsdPer1M: 0.075,
    outputUsdPer1M: 0.6,
    contextWindowK: 128,
    affiliateId: 'aimlapi',
    summary: {
      en: 'Budget-friendly workhorse for classification, extraction, and high-frequency subtasks.',
      th: 'โมเดลรุ่นเล็กประหยัดงบ เหมาะกับงานคัดกรองข้อมูล ตอบแชทพื้นฐาน และเรียกใช้งานถี่ๆ'
    }
  }
];

export const CLOUD_GPUS: CloudGpuSpec[] = [
  {
    id: 'runpod-rtx-4090',
    name: 'RunPod NVIDIA RTX 4090 (24GB)',
    vramGb: 24,
    hourlyUsd: 0.44,
    throughputTokensPerSec: 110,
    affiliateId: 'runpod',
    bestForModels: 'Llama-3.3 8B–32B (Q4), Qwen-2.5-Coder 32B',
    summary: {
      en: 'Lowest-cost dedicated GPU for 8B–32B quantized open-weight models and coding assistants.',
      th: 'การ์ดจอยอดนิยมราคาประหยัดที่สุดสำหรับการรันโมเดล 8B–32B แบบส่วนตัว'
    }
  },
  {
    id: 'runpod-a100-80gb',
    name: 'RunPod NVIDIA A100 PCIe (80GB)',
    vramGb: 80,
    hourlyUsd: 1.39,
    throughputTokensPerSec: 220,
    affiliateId: 'runpod',
    bestForModels: 'Llama-3.3 70B, Qwen-72B, vLLM high-concurrency batching',
    summary: {
      en: 'Enterprise 80GB VRAM workhorse for 70B parameter models with continuous vLLM batching.',
      th: 'VRAM 80GB สำหรับรันโมเดลระดับ 70B พารามิเตอร์ รองรับผู้ใช้พร้อมกันหลายรายด้วย vLLM'
    }
  },
  {
    id: 'runpod-h100-80gb',
    name: 'RunPod NVIDIA H100 SXM (80GB)',
    vramGb: 80,
    hourlyUsd: 2.69,
    throughputTokensPerSec: 520,
    affiliateId: 'runpod',
    bestForModels: 'DeepSeek-R1 Distill 70B, High-throughput FP8 production inference',
    summary: {
      en: 'Flagship FP8 inference accelerator delivering 500+ tok/s for heavy production workloads.',
      th: 'ความเร็วระดับสูงสุด รองรับ FP8 สำหรับระบบ Production ที่มีทราฟฟิกหนาแน่นตลอด 24 ชม.'
    }
  }
];

export const CLOUD_VPS_OPTIONS: CloudVpsSpec[] = [
  {
    id: 'cloudways-do-4gb',
    name: 'Cloudways Managed DigitalOcean (4GB RAM / 2 vCPU)',
    region: 'global',
    vcpu: 2,
    ramGb: 4,
    monthlyUsd: 54,
    affiliateId: 'cloudways',
    summary: {
      en: 'Managed global cloud hosting with Singapore/Asia edge routing, automated backups, and 24/7 support.',
      th: 'Managed Cloud ระดับสากล มีโหนดสิงคโปร์ใกล้ไทย ดูแลระบบและสำรองข้อมูลอัตโนมัติ 24 ชม.'
    }
  },
  {
    id: 'vercel-pro-team',
    name: 'Vercel Pro (Frontend + Serverless AI SDK)',
    region: 'global',
    vcpu: 2,
    ramGb: 4,
    monthlyUsd: 20,
    affiliateId: 'vercel',
    summary: {
      en: 'Zero-config edge deployment for Next.js, AI SDK streaming, and global CDN caching.',
      th: 'แพลตฟอร์มขึ้นระบบเว็บและ AI App อัตโนมัติ ความเร็วสูงผ่าน Edge CDN ทั่วโลก'
    }
  },
  {
    id: 'hostatom-vps-4gb',
    name: 'Hostatom Cloud VPS Thailand (4GB RAM / 2 vCPU)',
    region: 'thailand',
    vcpu: 2,
    ramGb: 4,
    monthlyUsd: 24,
    affiliateId: 'hostatom',
    summary: {
      en: 'Low-latency Bangkok data center NVMe VPS with Thai-language technical support.',
      th: 'เซิร์ฟเวอร์ NVMe ในไทย (กรุงเทพฯ) Latency ต่ำมากสำหรับผู้ใช้ในไทย พร้อมซัพพอร์ตภาษาไทย'
    }
  },
  {
    id: 'rukcom-managed-vps',
    name: 'Ruk-Com Managed Cloud VPS Thailand (8GB RAM / 4 vCPU)',
    region: 'thailand',
    vcpu: 4,
    ramGb: 8,
    monthlyUsd: 46,
    affiliateId: 'rukcom',
    summary: {
      en: 'Fully managed Thai enterprise VPS with DirectAdmin, WAF security, and local SLA.',
      th: 'Managed VPS สเปกสูงในไทย มีทีมวิศวกรดูแลครบวงจร เหมาะกับเว็บธุรกิจและระบบหลังบ้าน AI'
    }
  }
];
