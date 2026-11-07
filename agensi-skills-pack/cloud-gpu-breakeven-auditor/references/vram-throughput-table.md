# Verified Cloud GPU VRAM & Throughput Reference (2026)

| GPU Instance | VRAM | Quantization / Precision | Target Open-Weight Models | Sustained `vLLM` Throughput (tok/s) | Typical Hourly Rate (USD) |
|---|---|---|---|---|---|
| NVIDIA RTX 4090 | 24 GB | AWQ / GPTQ 4-bit | Llama-3.3 8B–32B, Qwen-2.5-Coder 32B | ~110 tok/s | $0.44/hr |
| NVIDIA RTX A6000 | 48 GB | AWQ 4-bit / FP16 | Qwen-2.5 32B FP16, Llama-3.3 70B Q4 | ~135 tok/s | $0.49/hr |
| NVIDIA L40S Ada | 48 GB | Native FP8 | 32B–70B FP8 + Vision-Language Models | ~195 tok/s | $0.86/hr |
| NVIDIA A100 PCIe | 80 GB | FP16 / INT8 | Llama-3.3 70B, Qwen-72B high-batch | ~220 tok/s | $1.39/hr |
| NVIDIA H100 SXM | 80 GB | Native FP8 | DeepSeek-R1 Distill 70B, heavy batch | ~520 tok/s | $2.69/hr |
