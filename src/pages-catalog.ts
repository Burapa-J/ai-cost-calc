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
      const cheaper = m1.inputUsdPer1M <= m2.inputUsdPer1M ? m1 : m2;
      const pricier = cheaper.id === m1.id ? m2 : m1;
      const ratio = Number((pricier.inputUsdPer1M / Math.max(0.01, cheaper.inputUsdPer1M)).toFixed(1));

      pages.push({
        slug,
        category: 'api_vs_api',
        primaryModelId: m1.id,
        secondaryModelId: m2.id,
        title: {
          en: `${m1.name} vs ${m2.name} — API Token & Caching Cost Ledger (2026)`,
          th: `${m1.name} เทียบกับ ${m2.name} — ตารางคำนวณต้นทุน API และงานที่เหมาะใช้จริง (2026)`
        },
        metaDescription: {
          en: `Side-by-side unit economics comparing ${m1.name} ($${m1.inputUsdPer1M}/1M in) and ${m2.name} ($${m2.inputUsdPer1M}/1M in) with visual price bars, prompt caching math, and decision rules.`,
          th: `เทียบชัดๆ ระหว่าง ${m1.name} และ ${m2.name} พร้อมกราฟส่วนต่างราคา ส่วนลด Prompt Caching และคำแนะนำว่างานแบบไหนควรเลือกใช้รุ่นใดให้ประหยัดที่สุด`
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
              en: `When should I pick ${cheaper.name} over ${pricier.name}?`,
              th: `งานแบบไหนควรเลือก ${cheaper.name} แทนที่จะจ่ายแพงกว่าใช้ ${pricier.name}?`
            },
            a: {
              en: `${cheaper.name} is ${ratio}x lower on input tokens ($${cheaper.inputUsdPer1M}/1M vs $${pricier.inputUsdPer1M}/1M). Route 75–85% of routine tasks—classification, RAG summarization, and first-pass drafts—to ${cheaper.name}, and reserve ${pricier.name} only for complex multi-file coding or deep edge-case reasoning.`,
              th: `${cheaper.name} มีต้นทุน Input ถูกกว่าประมาณ ${ratio} เท่า ($${cheaper.inputUsdPer1M}/1M เทียบกับ $${pricier.inputUsdPer1M}/1M) แนะนำให้ส่งงานทั่วไป 75–85% เช่น สรุปเอกสาร ตอบแชทลูกค้า หรือคัดกรองข้อมูลไปที่ ${cheaper.name} แล้วเก็บ ${pricier.name} ไว้เฉพาะขั้นตอนแก้โค้ดซับซ้อนหรือวิเคราะห์ตรรกะเชิงลึก`
            }
          },
          {
            q: {
              en: `How does prompt caching change the ${m1.name} vs ${m2.name} bill?`,
              th: `การเปิด Prompt Caching ช่วยลดบิลของ ${m1.name} และ ${m2.name} ลงได้แค่ไหน?`
            },
            a: {
              en: `When your system prompt or RAG documents repeat across requests, ${m1.name} drops input pricing from $${m1.inputUsdPer1M}/1M to $${m1.cachedInputUsdPer1M}/1M, while ${m2.name} drops from $${m2.inputUsdPer1M}/1M to $${m2.cachedInputUsdPer1M}/1M. Placing static instructions at the top of the prompt unlocks this discount automatically.`,
              th: `หากระบบของคุณส่งคำสั่งตั้งต้น (System Prompt) หรือเอกสารอ้างอิงชุดเดิมซ้ำๆ ${m1.name} จะลดค่า Input จาก $${m1.inputUsdPer1M}/1M เหลือเพียง $${m1.cachedInputUsdPer1M}/1M ส่วน ${m2.name} ลดจาก $${m2.inputUsdPer1M}/1M เหลือ $${m2.cachedInputUsdPer1M}/1M เทคนิคคือจัดวางเนื้อหาคงที่ไว้ส่วนบนสุดของ Prompt เสมอ`
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
          en: `Find the exact daily request threshold where dedicated ${gpu.name} rental ($${gpu.hourlyUsd}/hr) undercuts ${model.name} per-token billing, with vLLM deployment commands.`,
          th: `คำนวณจุดตัดความคุ้มค่าระหว่างการจ่าย ${model.name} ตามจำนวน Token กับการเช่าเครื่อง ${gpu.name} ($${gpu.hourlyUsd}/ชม.) พร้อมสเปก VRAM และคำสั่งรัน vLLM`
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
              en: `When does renting ${gpu.name} beat paying per-token for ${model.name}?`,
              th: `ต้องมีปริมาณงานแค่ไหน การเช่า ${gpu.name} ถึงจะถูกกว่าจ่าย ${model.name} รายคำ?`
            },
            a: {
              en: `${gpu.name} costs a flat $${gpu.hourlyUsd}/hr (${gpu.vramGb}GB VRAM, ~${gpu.throughputTokensPerSec} tok/s) regardless of how many tokens you generate. Once your daily multi-step agent volume pushes monthly API spend above ~$${Math.round(gpu.hourlyUsd * 10 * 30)}/mo (at 10 active hours/day), switching to ${gpu.name} caps your bill completely.`,
              th: `${gpu.name} คิดค่าเช่าคงที่ $${gpu.hourlyUsd}/ชั่วโมง (VRAM ${gpu.vramGb}GB ความเร็ว ~${gpu.throughputTokensPerSec} tok/s) ไม่ว่าจะรันกี่ล้าน Token ก็ตาม ทันทีที่ยอดเรียก API รายเดือนของคุณทะลุประมาณ $${Math.round(gpu.hourlyUsd * 10 * 30)}/เดือน (คิดที่เปิดระบบวันละ 10 ชม.) การย้ายมาเช่า ${gpu.name} จะช่วยล็อกเพดานรายจ่ายทันที`
            }
          },
          {
            q: {
              en: `What open-weight models fit into ${gpu.name}'s ${gpu.vramGb}GB VRAM?`,
              th: `การ์ดจอ ${gpu.name} (${gpu.vramGb}GB VRAM) เหมาะสำหรับรันโมเดลตัวไหนแทน ${model.name}?`
            },
            a: {
              en: `Optimal open-weight replacements on ${gpu.name}: ${gpu.bestForModels}. Deploy with vLLM continuous batching (--enable-prefix-caching) to serve multiple concurrent workers at full throughput.`,
              th: `โมเดลที่แนะนำให้รันบน ${gpu.name} ได้แก่: ${gpu.bestForModels} โดยแนะนำให้รันผ่าน vLLM พร้อมเปิดพารามิเตอร์ --enable-prefix-caching เพื่อรองรับผู้ใช้งานพร้อมกันหลายรายด้วยความเร็วสูงสุด`
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
          en: `Side-by-side infrastructure benchmark comparing ${v1.name} ($${v1.monthlyUsd}/mo) and ${v2.name} ($${v2.monthlyUsd}/mo) for AI backends, LINE OA webhooks, and vector databases.`,
          th: `เทียบสเปก vCPU, RAM, Latency และค่าใช้จ่ายรายเดือนระหว่าง ${v1.name} ($${v1.monthlyUsd}/เดือน) กับ ${v2.name} ($${v2.monthlyUsd}/เดือน) สำหรับวางระบบเว็บและ AI Backend`
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
              en: `Should I choose ${v1.name} or ${v2.name} for an AI backend or RAG server?`,
              th: `ระหว่าง ${v1.name} กับ ${v2.name} ควรเลือกตัวไหนสำหรับรันระบบหลังบ้าน AI หรือ LINE OA?`
            },
            a: {
              en: `${v1.name} provides ${v1.vcpu} vCPU / ${v1.ramGb}GB RAM at $${v1.monthlyUsd}/mo (${v1.region} region), while ${v2.name} offers ${v2.vcpu} vCPU / ${v2.ramGb}GB RAM at $${v2.monthlyUsd}/mo (${v2.region} region). Pick Thailand-based nodes (<10ms domestic ping) for Thai LINE OA webhooks and PDPA data residency, or Global nodes for international SaaS traffic.`,
              th: `${v1.name} ให้สเปก ${v1.vcpu} vCPU / ${v1.ramGb}GB RAM ที่ $${v1.monthlyUsd}/เดือน (โซน ${v1.region === 'thailand' ? 'ประเทศไทย' : 'Global'}) ส่วน ${v2.name} ให้สเปก ${v2.vcpu} vCPU / ${v2.ramGb}GB RAM ที่ $${v2.monthlyUsd}/เดือน (โซน ${v2.region === 'thailand' ? 'ประเทศไทย' : 'Global'}) หากทำระบบรับ Webhook ของ LINE OA หรือต้องการเก็บฐานข้อมูลลูกค้าในไทยตามเกณฑ์ PDPA แนะนำเลือกเซิร์ฟเวอร์โซนไทยจะได้ Latency ต่ำกว่า 10ms`
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
          en: `${arch.name.en} Cost Estimator with ${model.name} (2026 Blueprint)`,
          th: `คำนวณงบและสูตรจัดสเปก ${arch.name.th} ด้วย ${model.name}`
        },
        metaDescription: {
          en: `Estimate monthly token and GPU break-even costs for running a ${arch.name.en} on ${model.name}, with architecture diagrams and cost-cutting tips.`,
          th: `ประเมินค่าใช้จ่ายรายเดือน จุดคุ้มทุน และผังการวางระบบสำหรับ${arch.name.th}ด้วยโมเดล ${model.name}`
        },
        h1: {
          en: `${arch.name.en} — ${model.name} Blueprint`,
          th: `${arch.name.th} ด้วย ${model.name}`
        },
        presetWorkload: arch.preset,
        faq: [
          {
            q: {
              en: `How do I optimize ${arch.name.en} costs when running on ${model.name}?`,
              th: `จะตั้งค่า${arch.name.th}บน ${model.name} อย่างไรให้ประหยัดงบที่สุด?`
            },
            a: {
              en: `${arch.summary.en} With ${model.name} ($${model.inputUsdPer1M}/1M input, $${model.cachedInputUsdPer1M}/1M cached, $${model.outputUsdPer1M}/1M output), pin static instructions at the start of every request to hit ${Math.round((arch.preset.cacheHitRate ?? 0.4) * 100)}%+ cache reuse and cap max_tokens to prevent runaway output billing.`,
              th: `${arch.summary.th} เมื่อใช้ ${model.name} (Input ปกติ $${model.inputUsdPer1M}/1M, เมื่อติด Cache เหลือ $${model.cachedInputUsdPer1M}/1M) แนะนำให้ล็อกคำสั่งระบบไว้ส่วนหัวเพื่อให้ติด Cache เกิน ${Math.round((arch.preset.cacheHitRate ?? 0.4) * 100)}% และกำหนดเพดาน max_tokens ทุกครั้งเพื่อป้องกันค่า Output บานปลาย`
            }
          }
        ]
      });
    }
  }

  return pages;
}
