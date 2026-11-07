export type Locale = 'en' | 'th';

export type ProviderCategory = 'llm_api' | 'cloud_gpu' | 'cloud_vps';

export type AffiliateId =
  | 'aimlapi'
  | 'runpod'
  | 'cloudways'
  | 'vercel'
  | 'hostatom'
  | 'rukcom'
  | 'agensi';

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
  indexNowKey?: string;
  googleSiteVerification?: string;
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

export interface WorkloadArchetypeSpec {
  id: string;
  name: BilingualText;
  preset: Partial<WorkloadInput>;
  summary: BilingualText;
}

export interface AgentSkillSpec {
  id: string;
  name: string;
  priceUsd: number;
  tokenSavingsFraction: number;
  affiliateId: AffiliateId;
  tagline: BilingualText;
  metricNote: BilingualText;
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
  category: 'api_vs_api' | 'api_vs_gpu' | 'vps_vs_vps' | 'workload_usecase';
  title: BilingualText;
  metaDescription: BilingualText;
  h1: BilingualText;
  presetWorkload: Partial<WorkloadInput>;
  primaryModelId?: string;
  secondaryModelId?: string;
  gpuId?: string;
  vpsIdA?: string;
  vpsIdB?: string;
  archetypeId?: string;
  faq: Array<{ q: BilingualText; a: BilingualText }>;
}

export const LLM_MODELS: LlmModelSpec[] = [
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'Unified LLM API',
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
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Unified LLM API',
    inputUsdPer1M: 0.8,
    cachedInputUsdPer1M: 0.08,
    outputUsdPer1M: 4.0,
    contextWindowK: 200,
    affiliateId: 'aimlapi',
    summary: {
      en: 'Low-latency Anthropic model ideal for fast sub-agents, routing, and real-time chat.',
      th: 'โมเดลความเร็วสูงจาก Anthropic เหมาะสำหรับ Sub-agent คัดกรองงานและแชทบอทแบบเรียลไทม์'
    }
  },
  {
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o',
    provider: 'Unified LLM API',
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
    id: 'gpt-4o-mini',
    name: 'OpenAI GPT-4o mini',
    provider: 'Unified LLM API',
    inputUsdPer1M: 0.15,
    cachedInputUsdPer1M: 0.075,
    outputUsdPer1M: 0.6,
    contextWindowK: 128,
    affiliateId: 'aimlapi',
    summary: {
      en: 'Budget-friendly workhorse for classification, extraction, and high-frequency subtasks.',
      th: 'โมเดลรุ่นเล็กประหยัดงบ เหมาะกับงานคัดกรองข้อมูล ตอบแชทพื้นฐาน และเรียกใช้งานถี่ๆ'
    }
  },
  {
    id: 'o3-mini',
    name: 'OpenAI o3-mini (Reasoning)',
    provider: 'Unified LLM API',
    inputUsdPer1M: 1.1,
    cachedInputUsdPer1M: 0.55,
    outputUsdPer1M: 4.4,
    contextWindowK: 200,
    affiliateId: 'aimlapi',
    summary: {
      en: 'STEM, math, and structured code reasoning model with 50% cached input discount.',
      th: 'โมเดลสายคิดวิเคราะห์ตรรกะ คณิตศาสตร์ และเขียนโค้ดซับซ้อนในราคาคุ้มค่า'
    }
  },
  {
    id: 'gemini-2-5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Unified LLM API',
    inputUsdPer1M: 1.25,
    cachedInputUsdPer1M: 0.31,
    outputUsdPer1M: 10.0,
    contextWindowK: 2000,
    affiliateId: 'aimlapi',
    summary: {
      en: '2M context window flagship reasoning model for massive repository analysis and complex docs.',
      th: 'รองรับ Context กว้างถึง 2 ล้าน Token เหมาะกับวิเคราะห์โค้ดทั้งโปรเจกต์และเอกสารขนาดใหญ่'
    }
  },
  {
    id: 'gemini-2-5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Unified LLM API',
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
    id: 'deepseek-v3-r1',
    name: 'DeepSeek V3 / R1 (API)',
    provider: 'Novita AI / Unified API',
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
    id: 'llama-3-3-70b-api',
    name: 'Llama 3.3 70B Instruct (API)',
    provider: 'Meta / Unified Router',
    inputUsdPer1M: 0.4,
    cachedInputUsdPer1M: 0.2,
    outputUsdPer1M: 0.6,
    contextWindowK: 128,
    affiliateId: 'aimlapi',
    summary: {
      en: 'Industry-standard 70B open model with predictable low output token cost.',
      th: 'โมเดล 70B มาตรฐานยอดนิยม ค่า Output Token ต่ำมาก เหมาะกับงานสร้างเนื้อหาจำนวนมาก'
    }
  },
  {
    id: 'qwen-2-5-coder-32b-api',
    name: 'Qwen 2.5 Coder 32B (API)',
    provider: 'Alibaba Cloud / Router',
    inputUsdPer1M: 0.2,
    cachedInputUsdPer1M: 0.1,
    outputUsdPer1M: 0.2,
    contextWindowK: 128,
    affiliateId: 'aimlapi',
    summary: {
      en: 'Specialized 32B coding & SQL generation model at ultra-low per-token pricing.',
      th: 'โมเดลเฉพาะทางสำหรับเขียนโค้ดและสร้างคำสั่ง SQL ในราคาประหยัดที่สุด'
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
    id: 'runpod-rtx-a6000-48gb',
    name: 'RunPod NVIDIA RTX A6000 (48GB)',
    vramGb: 48,
    hourlyUsd: 0.49,
    throughputTokensPerSec: 135,
    affiliateId: 'runpod',
    bestForModels: 'Qwen-2.5 32B FP16, Llama-3.3 70B (Q4)',
    summary: {
      en: 'Sweet-spot 48GB VRAM workstation GPU capable of holding 70B AWQ/GPTQ models on a single card.',
      th: 'VRAM 48GB ในราคาประหยัด รันโมเดล 70B แบบบีบอัด (Q4) ได้ในการ์ดใบเดียว'
    }
  },
  {
    id: 'runpod-l40s-48gb',
    name: 'RunPod NVIDIA L40S (48GB Ada)',
    vramGb: 48,
    hourlyUsd: 0.86,
    throughputTokensPerSec: 195,
    affiliateId: 'runpod',
    bestForModels: 'Fast FP8 32B–70B inference & multimodal vision-language models',
    summary: {
      en: 'Ada Lovelace data-center GPU with native FP8 tensor cores for fast mid-size LLM serving.',
      th: 'การ์ดจอ Data Center สถาปัตยกรรม Ada รองรับ FP8 เร็วแรงสำหรับงาน Production'
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
  },
  {
    id: 'runpod-2x-a100-160gb',
    name: 'RunPod 2x NVIDIA A100 Cluster (160GB VRAM)',
    vramGb: 160,
    hourlyUsd: 2.78,
    throughputTokensPerSec: 410,
    affiliateId: 'runpod',
    bestForModels: 'Unquantized 70B FP16 + Long-Context 128k KV Cache',
    summary: {
      en: '160GB combined VRAM cluster for full-precision 70B+ models with huge concurrent KV cache.',
      th: 'คลัสเตอร์ VRAM รวม 160GB สำหรับรันโมเดล 70B แบบเต็มความละเอียดพร้อม Context ยาวพิเศษ'
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
    id: 'cloudways-vultr-8gb',
    name: 'Cloudways Managed Vultr High Frequency (8GB RAM / 4 vCPU)',
    region: 'global',
    vcpu: 4,
    ramGb: 8,
    monthlyUsd: 112,
    affiliateId: 'cloudways',
    summary: {
      en: '3GHz+ NVMe High-Frequency compute engineered for high-traffic SaaS backends and API gateways.',
      th: 'เซิร์ฟเวอร์ความถี่สูง NVMe สำหรับระบบ SaaS และ API Gateway ที่ต้องการความเร็วตอบสนองสูงสุด'
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
  },
  {
    id: 'hostatom-enterprise-16gb',
    name: 'Hostatom Dedicated Cloud Thailand (16GB RAM / 8 vCPU)',
    region: 'thailand',
    vcpu: 8,
    ramGb: 16,
    monthlyUsd: 88,
    affiliateId: 'hostatom',
    summary: {
      en: 'Dedicated Thai cloud resources for heavy vector databases (Qdrant/pgvector) and enterprise ERP.',
      th: 'คลาวด์ส่วนตัวสเปกสูงในไทย เหมาะสำหรับรัน Vector Database (RAG) และระบบองค์กรขนาดใหญ่'
    }
  }
];

export const WORKLOAD_ARCHETYPES: WorkloadArchetypeSpec[] = [
  {
    id: 'rag-customer-support-bot',
    name: {
      en: 'RAG Customer Support Chatbot',
      th: 'ระบบแชทบอทตอบลูกค้าอัตโนมัติ (RAG Knowledge Base)'
    },
    preset: {
      requestsPerDay: 2500,
      inputTokensPerReq: 3500,
      outputTokensPerReq: 450,
      cacheHitRate: 0.6,
      agentSteps: 2,
      activeHoursPerDay: 16
    },
    summary: {
      en: 'High input-to-output token ratio from knowledge base retrieval with strong system-prompt caching.',
      th: 'เน้นส่งข้อมูลเอกสารอ้างอิง (Input สูง) แต่ประหยัดงบได้มากด้วยการใช้ Prompt Caching'
    }
  },
  {
    id: 'autonomous-coding-agent',
    name: {
      en: 'Multi-Step Autonomous Coding Agent',
      th: 'ระบบ AI Agent เขียนและตรวจโค้ดอัตโนมัติหลายขั้นตอน'
    },
    preset: {
      requestsPerDay: 4000,
      inputTokensPerReq: 4500,
      outputTokensPerReq: 900,
      cacheHitRate: 0.45,
      agentSteps: 6,
      activeHoursPerDay: 12
    },
    summary: {
      en: '6 sequential agent loop steps per user task; prime candidate for dedicated GPU break-even.',
      th: 'เรียกโมเดลซ้ำ 6 รอบต่อ 1 คำสั่ง ทำให้โวลุ่ม Token พุ่งไวและมักคุ้มทุนเมื่อเช่า GPU รายชั่วโมง'
    }
  },
  {
    id: 'document-ocr-extraction-pipeline',
    name: {
      en: 'PDF & Invoice Data Extraction Pipeline',
      th: 'ระบบสกัดข้อมูลใบแจ้งหนี้และเอกสาร PDF อัตโนมัติ'
    },
    preset: {
      requestsPerDay: 6000,
      inputTokensPerReq: 2800,
      outputTokensPerReq: 350,
      cacheHitRate: 0.2,
      agentSteps: 1,
      activeHoursPerDay: 8
    },
    summary: {
      en: 'Batch back-office document processing running 8 active hours per day.',
      th: 'ประมวลผลเอกสารหลังบ้านเป็นรอบๆ (ประมาณ 8 ชม./วัน) เน้นความแม่นยำในการดึง JSON'
    }
  },
  {
    id: 'ecommerce-product-copy-generator',
    name: {
      en: 'E-Commerce SEO & Product Catalog Generator',
      th: 'ระบบสร้างคำบรรยายสินค้าและบทความ SEO สำหรับร้านค้าออนไลน์'
    },
    preset: {
      requestsPerDay: 1200,
      inputTokensPerReq: 1200,
      outputTokensPerReq: 1100,
      cacheHitRate: 0.5,
      agentSteps: 2,
      activeHoursPerDay: 10
    },
    summary: {
      en: 'Output-heavy content generation workflow for Shopee, Lazada, TikTok Shop, and Shopify sellers.',
      th: 'เน้นสร้างข้อความยาว (Output Token สูง) สำหรับแม่ค้าออนไลน์และเอเจนซี่การตลาด'
    }
  },
  {
    id: 'voice-and-chat-call-center-ai',
    name: {
      en: '24/7 AI Call Center & Omnichannel Triage',
      th: 'ระบบ AI คอลเซ็นเตอร์และคัดกรองแชทลูกค้าตลอด 24 ชั่วโมง'
    },
    preset: {
      requestsPerDay: 12000,
      inputTokensPerReq: 1800,
      outputTokensPerReq: 300,
      cacheHitRate: 0.55,
      agentSteps: 3,
      activeHoursPerDay: 24
    },
    summary: {
      en: 'Always-on 24/7 high-concurrency customer triage requiring low latency and predictable monthly bills.',
      th: 'เปิดระบบตลอด 24 ชม. รองรับลูกค้าจำนวนมาก เน้นความเร็วตอบกลับและคุมงบรายเดือนไม่ให้บานปลาย'
    }
  }
];

export const AGENT_SKILLS_CATALOG: AgentSkillSpec[] = [
  {
    id: 'devguard',
    name: 'devguard',
    priceUsd: 19,
    tokenSavingsFraction: 0.35,
    affiliateId: 'agensi',
    tagline: {
      en: 'Evidence-first workflow (verified-dev) and token-saving verification gate. Prevents unverified agent claims and stops wasted subagent tokens on small edits.',
      th: 'ป้องกัน AI มั่วงานและลดโควต้าที่เสียเปล่า: บังคับให้ตรวจผลรันจริงก่อนแจ้งว่างานเสร็จ และห้ามแตก Subagent เปลือง Token ในงานแก้ไฟล์เดียว'
    },
    metricNote: {
      en: 'Cuts ~35% wasted rework & subagent tokens',
      th: 'ลด Token จากการสั่งแก้ซ้ำและ Subagent ~35%'
    }
  },
  {
    id: 'token-budget-architect',
    name: 'token-budget-architect',
    priceUsd: 14,
    tokenSavingsFraction: 0.3,
    affiliateId: 'agensi',
    tagline: {
      en: 'Work longer without hitting quota limits. Guides Claude Code & Cursor to read only the lines being edited instead of scanning entire files on every turn.',
      th: 'ทำงานได้นานขึ้นโดยโควต้าไม่หมดไว: ตั้งกฎให้ AI เปิดอ่านเฉพาะบรรทัดที่ต้องแก้แทนการกวาดอ่านทั้งไฟล์ทุกครั้ง ช่วยยืดเวลาใช้งานในงบเท่าเดิม'
    },
    metricNote: {
      en: 'Saves ~25–35% tokens on typical edits',
      th: 'ลด Token ที่เสียเปล่าได้ราว 25–35%'
    }
  },
  {
    id: 'swiss-minimal-ui-ledger',
    name: 'swiss-minimal-ui-ledger',
    priceUsd: 19,
    tokenSavingsFraction: 0.2,
    affiliateId: 'agensi',
    tagline: {
      en: 'Get clean, readable layouts on the first pass instead of spending 3–4 extra prompts asking AI to remove clutter and fix spacing.',
      th: 'ไม่ต้องเสียเวลาและเปลืองโควต้าสั่งรื้อหน้าเว็บซ้ำๆ: กำหนดโครงสร้างที่สะอาดตาตั้งแต่รอบแรก เหมาะกับหน้าสรุปข้อมูลและระบบหลังบ้าน'
    },
    metricNote: {
      en: 'Avoids 2–3 rounds of rework prompts',
      th: 'ลดการสั่งแก้หน้าเว็บซ้ำ 2–3 รอบ'
    }
  },
  {
    id: 'cloud-gpu-breakeven-auditor',
    name: 'cloud-gpu-breakeven-auditor',
    priceUsd: 24,
    tokenSavingsFraction: 0.25,
    affiliateId: 'agensi',
    tagline: {
      en: 'Audits your repo LLM calls and calculates the exact daily request & VRAM threshold where hourly Cloud GPUs cost less than API billing.',
      th: 'รู้จุดคุ้มทุนชัดเจนก่อนย้ายเซิร์ฟเวอร์: สั่ง AI ตรวจโค้ดในโปรเจกต์เพื่อคำนวณว่าต้องมีงานกี่ครั้งต่อวัน การเช่า GPU รายชั่วโมงถึงจะถูกกว่าจ่ายรายคำ'
    },
    metricNote: {
      en: 'Exact API vs GPU break-even audit',
      th: 'คำนวณจุดสลับ API เป็น GPU ตามงานจริง'
    }
  }
];
