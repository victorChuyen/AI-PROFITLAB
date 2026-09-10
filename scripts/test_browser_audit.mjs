import { createRequire } from 'node:module';
const require = createRequire('d:/n8n-selfhost/package.json');
const { chromium } = require('playwright');
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const PUBLIC_DIR = path.resolve('public');
const QA_DIR = path.resolve('qa');
if (!existsSync(QA_DIR)) mkdirSync(QA_DIR, { recursive: true });

// Simple HTTP server for local files
const server = createServer(async (req, res) => {
  if (req.url.startsWith('/api/config')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ enabled: true, priceVnd: 500000, label: 'OPC Starter', accountName: 'TRAN NGOC CHUYEN' }));
    return;
  }
  if (req.url.startsWith('/api/order')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ exists: false }));
    return;
  }

  let reqPath = req.url.split('?')[0].replace(/^\//, '');
  if (!reqPath || reqPath === '') reqPath = 'index.html';
  if (!path.extname(reqPath)) reqPath += '.html';

  const filePath = path.join(PUBLIC_DIR, reqPath);
  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.jpeg': 'image/jpeg',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  console.log(`Local audit server running at http://127.0.0.1:${port}`);

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-gpu', '--no-sandbox']
  });

  const pages = ['index.html', 'starter.html', 'live.html', 'tu-van.html', 'thong-tin.html', 'checkout.html'];
  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
    { name: 'small-mobile', width: 360, height: 740 }
  ];

  let totalIssues = 0;

  for (const pageName of pages) {
    console.log(`\n--- Auditing ${pageName} ---`);
    for (const vp of viewports) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('pageerror', err => consoleErrors.push(err.message));

      await page.goto(`http://127.0.0.1:${port}/${pageName}`, { waitUntil: 'networkidle' });

      // Check for horizontal overflow
      const overflow = await page.evaluate(vpWidth => {
        const root = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(root.scrollWidth, body.scrollWidth);
        const hasOverflow = scrollWidth > vpWidth + 1;
        let offenders = [];
        if (hasOverflow) {
          document.querySelectorAll('*').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.right > vpWidth + 2 || rect.width > vpWidth + 2) {
              offenders.push({
                tag: el.tagName,
                class: el.className.toString().slice(0, 40),
                id: el.id,
                rectRight: rect.right,
                rectWidth: rect.width
              });
            }
          });
        }
        return { hasOverflow, scrollWidth, vpWidth, offenders: offenders.slice(0, 5) };
      }, vp.width);

      if (overflow.hasOverflow) {
        console.log(`  ❌ OVERFLOW on ${vp.name} (${vp.width}px): scrollWidth=${overflow.scrollWidth}px`);
        console.log(`     Offenders:`, overflow.offenders);
        totalIssues++;
      } else {
        console.log(`  ✅ ${vp.name} (${vp.width}px): no overflow`);
      }

      if (consoleErrors.length > 0) {
        console.log(`  ❌ Console errors on ${vp.name}:`, consoleErrors);
        totalIssues++;
      }

      // Save screenshot for home and checkout
      if (vp.name === 'desktop' || vp.name === 'mobile') {
        const screenshotPath = path.join(QA_DIR, `${pageName.replace('.html', '')}-${vp.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
      }

      await page.close();
    }
  }

  await browser.close();
  server.close();
  console.log(`\nAudit complete! Total issues detected: ${totalIssues}`);
});
