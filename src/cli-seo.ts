import fs from 'node:fs';
import path from 'node:path';
import { sanitizeIndexNowKey } from './calculator.ts';
import type { AffiliateConfigFile } from './domain.ts';
import { generateStaticSite } from './generator.ts';
import { buildProgrammaticPagesCatalog } from './pages-catalog.ts';

const rootDir = path.resolve(import.meta.dirname, '..');
const configPath = path.join(rootDir, 'config', 'affiliates.json');
const distDir = path.join(rootDir, 'dist');
const publicBaseUrl = process.env.PUBLIC_BASE_URL ?? 'https://burapa-j.github.io/ai-cost-calc';

const [, , action, arg] = process.argv;
const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as AffiliateConfigFile;

async function run() {
  if (action === 'set-gsc') {
    const token = (arg || '').trim();
    config.googleSiteVerification = token;
    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
    const summary = generateStaticSite(distDir, config, publicBaseUrl);
    console.log(JSON.stringify({ ok: true, googleSiteVerification: token, build: summary }));
    return;
  }

  const key = sanitizeIndexNowKey(config.indexNowKey);
  const parsedBase = new URL(publicBaseUrl);
  const catalog = buildProgrammaticPagesCatalog();

  const urlList: string[] = [
    `${publicBaseUrl}/th/index.html`,
    `${publicBaseUrl}/en/index.html`,
    ...catalog.map((p) => `${publicBaseUrl}/th/compare/${p.slug}.html`),
    ...catalog.map((p) => `${publicBaseUrl}/en/compare/${p.slug}.html`)
  ];

  const payload = {
    host: parsedBase.hostname,
    key,
    keyLocation: `${publicBaseUrl}/${key}.txt`,
    urlList
  };

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  console.log(
    JSON.stringify({
      endpoint: 'https://api.indexnow.org/indexnow',
      status: res.status,
      submittedUrls: urlList.length,
      keyLocation: payload.keyLocation,
      response: text.slice(0, 200)
    })
  );
}

run();
