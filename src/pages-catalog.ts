import {
  CLOUD_GPUS,
  CLOUD_VPS_OPTIONS,
  LLM_MODELS,
  type ProgrammaticComparisonPageSpec
} from './domain.ts';

export function buildProgrammaticPagesCatalog(): ProgrammaticComparisonPageSpec[] {
  const pages: ProgrammaticComparisonPageSpec[] = [];

  for (let i = 0; i < LLM_MODELS.length; i++) {
    for (let j = i + 1; j < LLM_MODELS.length; j++) {
      const m1 = LLM_MODELS[i];
      const m2 = LLM_MODELS[j];
      const slug = `${m1.id}-vs-${m2.id}-cost-calculator`;

      pages.push({
        slug,
        category: 'api_vs_api',
        primaryModelId: m1.id,
        secondaryModelId: m2.id,
        title: {
          en: `${m1.name} vs ${m2.name} API Cost Calculator (2026 Token & Caching Pricing)`,
          th: `คำนวณและเปรียบเทียบราคา ${m1.name} vs ${m2.name} (อัปเดต 2026 คิดเป็นเงินบาท)`
        },
        metaDescription: {
          en: `Interactive ${m1.name} vs ${m2.name} pricing calculator. Compare monthly token bills with prompt caching, multi-step agent loops, and GPU break-even thresholds.`,
          th: `เครื่องมือคำนวณค่าใช้จ่าย ${m1.name} เทียบกับ ${m2.name} ตามจำนวน Token จริง พร้อมส่วนลด Prompt Caching และจุดคุ้มทุนเทียบกับการเช่า Cloud GPU`
        },
        h1: {
          en: `${m1.name} vs ${m2.name}: Real Monthly API Cost & Break-Even Calculator`,
          th: `เปรียบเทียบราคา ${m1.name} vs ${m2.name}: คำนวณต้นทุนจริงรายเดือน (USD & THB)`
        },
        presetWorkload: {
          requestsPerDay: 2000,
          inputTokensPerReq: 2500,
          outputTokensPerReq: 600,
          cacheHitRate: 0.4,
          agentSteps: 3,
          activeHoursPerDay: 12
        },
        faq: [
          {
            q: {
              en: `Is ${m1.name} cheaper than ${m2.name} when prompt caching is enabled?`,
              th: `${m1.name} ถูกกว่า ${m2.name} หรือไม่เมื่อเปิดใช้ Prompt Caching?`
            },
            a: {
              en: `${m1.name} charges $${m1.inputUsdPer1M}/1M input ($${m1.cachedInputUsdPer1M}/1M cached) and $${m1.outputUsdPer1M}/1M output, whereas ${m2.name} charges $${m2.inputUsdPer1M}/1M input ($${m2.cachedInputUsdPer1M}/1M cached) and $${m2.outputUsdPer1M}/1M output. Use the slider above to test your exact cache hit ratio.`,
              th: `${m1.name} คิดค่า Input $${m1.inputUsdPer1M}/1M (เมื่อใช้ Cache เหลือ $${m1.cachedInputUsdPer1M}/1M) และ Output $${m1.outputUsdPer1M}/1M ส่วน ${m2.name} คิด Input $${m2.inputUsdPer1M}/1M (Cache $${m2.cachedInputUsdPer1M}/1M) และ Output $${m2.outputUsdPer1M}/1M คุณสามารถเลื่อนสไลเดอร์ด้านบนเพื่อดูผลต่างเป็นเงินบาทได้ทันที`
            }
          }
        ]
      });
    }
  }

  for (const model of LLM_MODELS) {
    for (const gpu of CLOUD_GPUS) {
      const slug = `${model.id}-vs-${gpu.id}-break-even`;
      pages.push({
        slug,
        category: 'api_vs_gpu',
        primaryModelId: model.id,
        gpuId: gpu.id,
        title: {
          en: `${model.name} API vs ${gpu.name} Break-Even Calculator (API vs Self-Hosted GPU)`,
          th: `คำนวณจุดคุ้มทุน ${model.name} API vs เช่า ${gpu.name} (จ่ายตาม Token หรือเช่า GPU คุ้มกว่า?)`
        },
        metaDescription: {
          en: `Calculate the exact daily request & token volume where renting ${gpu.name} ($${gpu.hourlyUsd}/hr) beats paying per token for ${model.name}.`,
          th: `คำนวณจุดคุ้มทุนแบบเรียลไทม์ว่าต้องมีงานกี่ครั้งต่อวัน การเช่า ${gpu.name} ($${gpu.hourlyUsd}/ชม.) จึงจะประหยัดกว่าใช้ ${model.name} API`
        },
        h1: {
          en: `${model.name} API vs ${gpu.name}: True Break-Even Calculator`,
          th: `${model.name} API เทียบกับเช่า ${gpu.name}: คำนวณจุดคุ้มทุนรายเดือน`
        },
        presetWorkload: {
          requestsPerDay: 4500,
          inputTokensPerReq: 3000,
          outputTokensPerReq: 700,
          cacheHitRate: 0.25,
          agentSteps: 4,
          activeHoursPerDay: 10
        },
        faq: [
          {
            q: {
              en: `At what volume does ${gpu.name} beat ${model.name} API?`,
              th: `ต้องใช้งานเยอะแค่ไหน การเช่า ${gpu.name} จึงจะถูกกว่า ${model.name} API?`
            },
            a: {
              en: `${gpu.name} costs $${gpu.hourlyUsd}/hour with ${gpu.vramGb}GB VRAM (~${gpu.throughputTokensPerSec} tok/s). When multi-step agents multiply token calls, dedicated GPU rental caps your hourly spend with zero runaway token risk.`,
              th: `${gpu.name} มีราคาเช่า $${gpu.hourlyUsd}/ชั่วโมง (VRAM ${gpu.vramGb}GB ความเร็ว ~${gpu.throughputTokensPerSec} tok/s) หากระบบของคุณเป็น Agent ที่เรียกซ้ำหลายรอบต่อ 1 งาน การเช่า GPU จะช่วยล็อกเพดานค่าใช้จ่ายไม่ให้บานปลาย`
            }
          }
        ]
      });
    }
  }

  for (let i = 0; i < CLOUD_VPS_OPTIONS.length; i++) {
    for (let j = i + 1; j < CLOUD_VPS_OPTIONS.length; j++) {
      const v1 = CLOUD_VPS_OPTIONS[i];
      const v2 = CLOUD_VPS_OPTIONS[j];
      const slug = `${v1.id}-vs-${v2.id}-hosting-comparison`;
      pages.push({
        slug,
        category: 'vps_vs_vps',
        vpsIdA: v1.id,
        vpsIdB: v2.id,
        title: {
          en: `${v1.name} vs ${v2.name}: Cloud VPS & AI App Hosting Cost Comparison`,
          th: `เปรียบเทียบ ${v1.name} vs ${v2.name}: เลือก Cloud VPS ไหนคุ้มสุดสำหรับเว็บและระบบ AI`
        },
        metaDescription: {
          en: `Compare ${v1.name} ($${v1.monthlyUsd}/mo) and ${v2.name} ($${v2.monthlyUsd}/mo) for hosting AI web apps, APIs, and SaaS backends in Thailand & globally.`,
          th: `เทียบสเปกและราคา ${v1.name} ($${v1.monthlyUsd}/เดือน) กับ ${v2.name} ($${v2.monthlyUsd}/เดือน) สำหรับรันเว็บไซต์ ระบบหลังบ้าน และ AI Agent`
        },
        h1: {
          en: `${v1.name} vs ${v2.name}: Monthly TCO & Specs Comparison`,
          th: `เปรียบเทียบ ${v1.name} vs ${v2.name}: สเปก ราคา และความคุ้มค่ารายเดือน`
        },
        presetWorkload: {
          requestsPerDay: 1000,
          inputTokensPerReq: 2000,
          outputTokensPerReq: 500,
          cacheHitRate: 0.35,
          agentSteps: 2,
          activeHoursPerDay: 12
        },
        faq: [
          {
            q: {
              en: `Should I choose ${v1.name} or ${v2.name} for an AI SaaS application?`,
              th: `ควรเลือก ${v1.name} หรือ ${v2.name} สำหรับรันระบบเว็บและ AI SaaS?`
            },
            a: {
              en: `${v1.name} provides ${v1.vcpu} vCPU / ${v1.ramGb}GB RAM at $${v1.monthlyUsd}/mo (${v1.region} region), while ${v2.name} offers ${v2.vcpu} vCPU / ${v2.ramGb}GB RAM at $${v2.monthlyUsd}/mo (${v2.region} region).`,
              th: `${v1.name} ให้สเปก ${v1.vcpu} vCPU / ${v1.ramGb}GB RAM ในราคา $${v1.monthlyUsd}/เดือน ส่วน ${v2.name} ให้สเปก ${v2.vcpu} vCPU / ${v2.ramGb}GB RAM ในราคา $${v2.monthlyUsd}/เดือน`
            }
          }
        ]
      });
    }
  }

  return pages;
}
