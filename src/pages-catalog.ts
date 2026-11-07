import {
  CLOUD_GPUS,
  CLOUD_VPS_OPTIONS,
  LLM_MODELS,
  type ProgrammaticComparisonPageSpec,
  WORKLOAD_ARCHETYPES
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
          en: `${m1.name} vs ${m2.name} — API Token & Caching Cost Ledger (2026)`,
          th: `${m1.name} เทียบกับ ${m2.name} — ตารางคำนวณต้นทุน API และ Prompt Caching (2026)`
        },
        metaDescription: {
          en: `Precision token cost model comparing ${m1.name} ($${m1.inputUsdPer1M}/1M in) and ${m2.name} ($${m2.inputUsdPer1M}/1M in) across cache hit ratios and multi-step agent loops.`,
          th: `คำนวณค่าใช้จ่ายรายเดือนระหว่าง ${m1.name} และ ${m2.name} ตามจำนวน Token จริง พร้อมส่วนลด Prompt Caching และตัวคูณ Agent หลายขั้นตอน`
        },
        h1: {
          en: `${m1.name} vs. ${m2.name}`,
          th: `เปรียบเทียบต้นทุน ${m1.name} กับ ${m2.name}`
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
              en: `How does prompt caching affect ${m1.name} vs ${m2.name} unit economics?`,
              th: `Prompt Caching ส่งผลต่อส่วนต่างราคาระหว่าง ${m1.name} กับ ${m2.name} อย่างไร?`
            },
            a: {
              en: `${m1.name} bills $${m1.inputUsdPer1M}/1M uncached input ($${m1.cachedInputUsdPer1M}/1M cached) and $${m1.outputUsdPer1M}/1M output. ${m2.name} bills $${m2.inputUsdPer1M}/1M uncached input ($${m2.cachedInputUsdPer1M}/1M cached) and $${m2.outputUsdPer1M}/1M output.`,
              th: `${m1.name} คิดราคา Input ปกติ $${m1.inputUsdPer1M}/1M (เมื่อติด Cache เหลือ $${m1.cachedInputUsdPer1M}/1M) และ Output $${m1.outputUsdPer1M}/1M ส่วน ${m2.name} คิด Input $${m2.inputUsdPer1M}/1M (Cache $${m2.cachedInputUsdPer1M}/1M) และ Output $${m2.outputUsdPer1M}/1M`
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
          en: `${model.name} API vs ${gpu.name} — Break-Even Volume Analysis`,
          th: `จุดคุ้มทุน ${model.name} API เทียบกับเช่า ${gpu.name} รายชั่วโมง`
        },
        metaDescription: {
          en: `Find the exact daily request threshold where dedicated ${gpu.name} rental ($${gpu.hourlyUsd}/hr) undercuts ${model.name} per-token billing.`,
          th: `คำนวณจุดตัดความคุ้มค่าระหว่างการจ่าย ${model.name} ตามจำนวน Token กับการเช่าเครื่อง ${gpu.name} ($${gpu.hourlyUsd}/ชม.)`
        },
        h1: {
          en: `${model.name} vs. ${gpu.name}`,
          th: `จุดคุ้มทุน ${model.name} เทียบกับ ${gpu.name}`
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
              en: `When does ${gpu.name} become cheaper than ${model.name} API?`,
              th: `ปริมาณงานระดับใดที่การเช่า ${gpu.name} ถูกกว่าการจ่าย ${model.name} API?`
            },
            a: {
              en: `${gpu.name} runs at a flat $${gpu.hourlyUsd}/hr (${gpu.vramGb}GB VRAM, ~${gpu.throughputTokensPerSec} tok/s). Once multi-step agent calls push daily token spend above the hourly rental line, dedicated GPU instances cap your monthly ceiling.`,
              th: `${gpu.name} มีต้นทุนคงที่ $${gpu.hourlyUsd}/ชั่วโมง (VRAM ${gpu.vramGb}GB ความเร็วประมาณ ${gpu.throughputTokensPerSec} tok/s) เมื่อปริมาณการเรียกซ้ำของ Agent สูงเกินจุดคุ้มทุน การเช่า GPU จะช่วยล็อกงบรายเดือนไม่ให้บานปลาย`
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
          en: `${v1.name} vs ${v2.name} — Infrastructure Cost & Spec Comparison`,
          th: `เปรียบเทียบสเปกและราคา ${v1.name} กับ ${v2.name}`
        },
        metaDescription: {
          en: `Side-by-side infrastructure benchmark comparing ${v1.name} ($${v1.monthlyUsd}/mo) and ${v2.name} ($${v2.monthlyUsd}/mo) for AI backends and web workloads.`,
          th: `เทียบสเปก vCPU, RAM และค่าใช้จ่ายรายเดือนระหว่าง ${v1.name} ($${v1.monthlyUsd}/เดือน) กับ ${v2.name} ($${v2.monthlyUsd}/เดือน)`
        },
        h1: {
          en: `${v1.name} vs. ${v2.name}`,
          th: `เปรียบเทียบ ${v1.name} กับ ${v2.name}`
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
              en: `How do ${v1.name} and ${v2.name} compare on monthly TCO?`,
              th: `ความแตกต่างด้านต้นทุนและภูมิภาคของ ${v1.name} กับ ${v2.name} คืออะไร?`
            },
            a: {
              en: `${v1.name} provides ${v1.vcpu} vCPU / ${v1.ramGb}GB RAM at $${v1.monthlyUsd}/mo (${v1.region}), while ${v2.name} offers ${v2.vcpu} vCPU / ${v2.ramGb}GB RAM at $${v2.monthlyUsd}/mo (${v2.region}).`,
              th: `${v1.name} ให้สเปก ${v1.vcpu} vCPU / ${v1.ramGb}GB RAM ที่ $${v1.monthlyUsd}/เดือน (${v1.region}) ส่วน ${v2.name} ให้สเปก ${v2.vcpu} vCPU / ${v2.ramGb}GB RAM ที่ $${v2.monthlyUsd}/เดือน (${v2.region})`
            }
          }
        ]
      });
    }
  }

  for (const arch of WORKLOAD_ARCHETYPES) {
    for (const model of LLM_MODELS) {
      const slug = `${arch.id}-with-${model.id}-cost-estimator`;
      pages.push({
        slug,
        category: 'workload_usecase',
        archetypeId: arch.id,
        primaryModelId: model.id,
        title: {
          en: `${arch.name.en} Cost Estimator with ${model.name} (2026 TCO)`,
          th: `คำนวณงบ ${arch.name.th} ด้วย ${model.name} (ต้นทุนรายเดือน)`
        },
        metaDescription: {
          en: `Estimate monthly token and GPU break-even costs for running a ${arch.name.en} on ${model.name}.`,
          th: `ประเมินค่าใช้จ่ายรายเดือนและจุดคุ้มทุนสำหรับการรัน${arch.name.th}ด้วยโมเดล ${model.name}`
        },
        h1: {
          en: `${arch.name.en} — ${model.name} Cost Model`,
          th: `${arch.name.th} ด้วย ${model.name}`
        },
        presetWorkload: arch.preset,
        faq: [
          {
            q: {
              en: `What is the typical token profile for a ${arch.name.en} using ${model.name}?`,
              th: `รูปแบบการใช้ Token ของ${arch.name.th}เมื่อใช้ ${model.name} เป็นอย่างไร?`
            },
            a: {
              en: `${arch.summary.en} With ${model.name} ($${model.inputUsdPer1M}/1M input, $${model.outputUsdPer1M}/1M output), adjust daily volume and agent steps above to model your exact bill.`,
              th: `${arch.summary.th} เมื่อรันบน ${model.name} (Input $${model.inputUsdPer1M}/1M, Output $${model.outputUsdPer1M}/1M) คุณสามารถปรับจำนวนงานต่อวันด้านบนเพื่อดูงบประมาณจริงได้ทันที`
            }
          }
        ]
      });
    }
  }

  return pages;
}
