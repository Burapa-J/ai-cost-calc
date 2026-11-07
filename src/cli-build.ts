import fs from 'node:fs';
import path from 'node:path';
import type { AffiliateConfigFile } from './domain.ts';
import { generateStaticSite } from './generator.ts';

const rootDir = path.resolve(import.meta.dirname, '..');
const configPath = path.join(rootDir, 'config', 'affiliates.json');
const outputDir = path.join(rootDir, 'dist');

const affiliateConfig = JSON.parse(fs.readFileSync(configPath, 'utf8')) as AffiliateConfigFile;
const publicBaseUrl = process.env.PUBLIC_BASE_URL ?? 'https://burapa-j.github.io/ai-cost-calc';
const summary = generateStaticSite(outputDir, affiliateConfig, publicBaseUrl);
console.log(JSON.stringify(summary));
