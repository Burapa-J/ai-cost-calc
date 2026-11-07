import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { DemandValidationStore } from './calculator.ts';
import type { AffiliateConfigFile, ValidationTelemetryEvent } from './domain.ts';
import { generateStaticSite } from './generator.ts';

export function startValidationServer(port = 4173, rootDir = path.resolve(import.meta.dirname, '..')) {
  const configPath = path.join(rootDir, 'config', 'affiliates.json');
  const distDir = path.join(rootDir, 'dist');
  const eventsLogPath = path.join(rootDir, 'telemetry-events.jsonl');

  const affiliateConfig = JSON.parse(fs.readFileSync(configPath, 'utf8')) as AffiliateConfigFile;
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    generateStaticSite(distDir, affiliateConfig, `http://127.0.0.1:${port}`);
  }

  const store = new DemandValidationStore();
  if (fs.existsSync(eventsLogPath)) {
    const lines = fs.readFileSync(eventsLogPath, 'utf8').split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        store.recordEvent(JSON.parse(line) as ValidationTelemetryEvent);
      } catch {}
    }
  }

  const server = http.createServer((req, res) => {
    const urlObj = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);

    if (req.method === 'POST' && urlObj.pathname === '/api/telemetry') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body) as ValidationTelemetryEvent;
          const inserted = store.recordEvent(parsed);
          if (inserted) {
            fs.appendFileSync(eventsLogPath, `${JSON.stringify(parsed)}\n`, 'utf8');
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, inserted }));
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false }));
        }
      });
      return;
    }

    if (req.method === 'GET' && urlObj.pathname === '/api/validation-report') {
      const report = store.evaluateDemand(affiliateConfig);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(report));
      return;
    }

    let relPath = urlObj.pathname === '/' ? '/index.html' : urlObj.pathname;
    if (relPath.endsWith('/')) {
      relPath += 'index.html';
    }
    const safePath = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.join(distDir, safePath);

    if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(fullPath);
    const mime =
      ext === '.html'
        ? 'text/html; charset=utf-8'
        : ext === '.xml'
          ? 'application/xml; charset=utf-8'
          : ext === '.md' || ext === '.txt'
            ? 'text/plain; charset=utf-8'
            : 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': mime });
    res.end(fs.readFileSync(fullPath));
  });

  return new Promise<{ server: http.Server; port: number }>((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const addr = server.address();
      const boundPort = typeof addr === 'object' && addr ? addr.port : port;
      resolve({ server, port: boundPort });
    });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 4173);
  startValidationServer(port).then(({ port: p }) => {
    console.log(`Server listening on http://127.0.0.1:${p}`);
  });
}
