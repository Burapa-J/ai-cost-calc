import fs from 'node:fs';
import path from 'node:path';
import { updateAffiliateCode } from './calculator.ts';
import type { AffiliateConfigFile } from './domain.ts';
import { generateStaticSite } from './generator.ts';

const rootDir = path.resolve(import.meta.dirname, '..');
const configPath = path.join(rootDir, 'config', 'affiliates.json');
const distDir = path.join(rootDir, 'dist');

const [, , partnerId, newCode] = process.argv;
const currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8')) as AffiliateConfigFile;

if (!partnerId || !newCode) {
  console.log('Current Affiliate Configuration:');
  for (const [key, prog] of Object.entries(currentConfig.programs)) {
    console.log(`  ${key.padEnd(10)} -> ${prog.affiliateCode} (${prog.baseUrl})`);
  }
  console.log('\nUsage: node src/cli-affiliate.ts <partner_id> <your_affiliate_code>');
  process.exit(0);
}

const updated = updateAffiliateCode(currentConfig, partnerId, newCode);
fs.writeFileSync(configPath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
const summary = generateStaticSite(distDir, updated);
console.log(JSON.stringify({ updatedPartner: partnerId, newCode, build: summary }));
