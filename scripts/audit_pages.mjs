import fs from 'node:fs';
import path from 'node:path';

const dir = 'public';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

console.log('=== AUDITING PUBLIC HTML PAGES ===\n');

for (const f of files) {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  console.log(`--- [${f}] ---`);
  
  // H1 check
  const h1s = [...content.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' '));
  console.log(`  H1 count: ${h1s.length}`);
  if (h1s.length !== 1) {
    console.log(`  ❌ Issue: Page should have exactly 1 H1, found: ${h1s.length} (${JSON.stringify(h1s)})`);
  } else {
    console.log(`  ✅ H1: "${h1s[0]}"`);
  }
  
  // Title & Canonical
  const title = content.match(/<title>([^<]*)<\/title>/i)?.[1] || 'MISSING';
  const canonical = content.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i)?.[1] || 'MISSING';
  console.log(`  Title: "${title}"`);
  console.log(`  Canonical: "${canonical}"`);
  
  // Images check
  const imgs = [...content.matchAll(/<img\s+([^>]+)>/gi)];
  let brokenImg = 0;
  let missingAlt = 0;
  for (const m of imgs) {
    const src = m[1].match(/src=["']([^"']+)["']/i)?.[1];
    const alt = m[1].match(/alt=["']([^"']*)["']/i)?.[1];
    if (alt === undefined) {
      missingAlt++;
    }
    if (src && !src.startsWith('http') && !src.startsWith('data:')) {
      const cleanSrc = src.split('?')[0];
      const localPath = path.join(dir, cleanSrc);
      if (!fs.existsSync(localPath)) {
        console.log(`  ❌ Missing image file: ${src}`);
        brokenImg++;
      }
    }
  }
  if (brokenImg === 0) console.log(`  ✅ Images: all ${imgs.length} exist locally.`);
  if (missingAlt > 0) console.log(`  ⚠️ Warning: ${missingAlt} images missing alt attribute.`);
  
  // Links check
  const links = [...content.matchAll(/<a\s+([^>]+)>/gi)];
  let deadLinks = [];
  for (const m of links) {
    const href = m[1].match(/href=["']([^"']*)["']/i)?.[1];
    if (!href) deadLinks.push('Empty href');
    else if (href.startsWith('#') && href.length > 1) {
      const targetId = href.slice(1);
      if (!content.includes(`id="${targetId}"`) && !content.includes(`id='${targetId}'`)) {
        deadLinks.push(`Broken anchor: ${href}`);
      }
    }
  }
  if (deadLinks.length > 0) {
    console.log(`  ⚠️ Dead links: ${JSON.stringify(deadLinks)}`);
  } else {
    console.log(`  ✅ Anchors: all valid.`);
  }
  console.log('');
}
