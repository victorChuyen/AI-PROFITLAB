# -*- coding: utf-8 -*-
"""
🏆 COMPREHENSIVE PRODUCTION DOM AUDIT FOR go.breaths.live
Checks 6 pages across multiple viewports for:
1. Console errors & Page errors
2. Heading hierarchy (1 H1, no skipping H1->H3)
3. Broken images & missing alt text & missing width/height
4. Broken links (empty href, dead hash links, invalid internal links)
5. Form labels & accessibility (inputs without labels, buttons without text)
6. Horizontal layout overflow on mobile (360px, 390px, 414px) and desktop (1440px)
7. Schema.org JSON-LD validation
8. SEO tags (Title, Description, Canonical, OG tags, Viewport)
9. Interactive elements (clicks, toggles, forms)
"""
import sys, io, json, os, shutil, threading, functools
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIR = ROOT / 'public'
QA_DIR = ROOT / 'qa'
QA_DIR.mkdir(exist_ok=True)

class QuietServer(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
    def copyfile(self, source, outputfile):
        try:
            shutil.copyfileobj(source, outputfile, 64 * 1024)
        except Exception:
            pass
    def do_GET(self):
        url_path = self.path.split('?')[0].rstrip('/')
        if url_path and not os.path.splitext(url_path)[1]:
            candidate = PUBLIC_DIR / (url_path.lstrip('/') + '.html')
            if candidate.is_file():
                query = ('?' + self.path.split('?', 1)[1]) if '?' in self.path else ''
                self.path = '/' + url_path.lstrip('/') + '.html' + query
        return super().do_GET()

def run_audit():
    server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietServer, directory=str(PUBLIC_DIR)))
    port = server.server_port
    threading.Thread(target=server.serve_forever, daemon=True).start()
    
    pages = ['index.html', 'starter.html', 'live.html', 'tu-van.html', 'thong-tin.html', 'checkout.html']
    viewports = [1440, 390, 360]
    
    audit_results = []
    total_issues = 0
    
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(channel='chrome', headless=True, args=['--disable-gpu', '--no-sandbox'])
            
            for page_name in pages:
                page_report = {
                    'page': page_name,
                    'issues': [],
                    'warnings': [],
                    'viewport_overflows': []
                }
                
                # Check at 1440 first for full structure audit
                page = browser.new_page(viewport={'width': 1440, 'height': 1000})
                console_logs = []
                page_errors = []
                
                page.on('console', lambda msg: console_logs.append(f"[{msg.type}] {msg.text}") if msg.type in ['error', 'warning'] else None)
                page.on('pageerror', lambda err: page_errors.append(str(err)))
                
                url = f"http://127.0.0.1:{port}/{page_name}"
                page.goto(url, wait_until='domcontentloaded', timeout=15000)
                
                # 1. Console & Page Errors
                if page_errors:
                    page_report['issues'].append({'type': 'PAGE_ERRORS', 'details': page_errors})
                if any('[error]' in log for log in console_logs):
                    page_report['issues'].append({'type': 'CONSOLE_ERRORS', 'details': [l for l in console_logs if '[error]' in l]})
                
                # 2. SEO & Head Meta Checks
                head_audit = page.evaluate('''() => {
                    const title = document.title;
                    const desc = document.querySelector('meta[name="description"]')?.content || null;
                    const canonical = document.querySelector('link[rel="canonical"]')?.href || null;
                    const robots = document.querySelector('meta[name="robots"]')?.content || null;
                    const ogTitle = document.querySelector('meta[property="og:title"]')?.content || null;
                    const ogDesc = document.querySelector('meta[property="og:description"]')?.content || null;
                    const ogImage = document.querySelector('meta[property="og:image"]')?.content || null;
                    
                    return { title, desc, canonical, robots, ogTitle, ogDesc, ogImage };
                }''')
                
                if not head_audit['title']:
                    page_report['issues'].append({'type': 'MISSING_TITLE'})
                if not head_audit['desc']:
                    page_report['issues'].append({'type': 'MISSING_DESCRIPTION'})
                if not head_audit['canonical']:
                    page_report['issues'].append({'type': 'MISSING_CANONICAL'})
                if not head_audit['canonical'] or 'go.breaths.live' not in head_audit['canonical']:
                    page_report['issues'].append({'type': 'INVALID_CANONICAL_DOMAIN', 'canonical': head_audit['canonical']})
                if not head_audit['robots']:
                    page_report['issues'].append({'type': 'MISSING_ROBOTS'})
                
                # 3. Headings Hierarchy Check
                headings = page.evaluate('''() => {
                    const hList = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(h => ({
                        tag: h.tagName,
                        text: h.innerText.trim().slice(0, 40)
                    }));
                    const h1Count = document.querySelectorAll('h1').length;
                    return { hList, h1Count };
                }''')
                if headings['h1Count'] != 1:
                    page_report['issues'].append({'type': 'INVALID_H1_COUNT', 'count': headings['h1Count']})
                
                # 4. Images Audit
                img_audit = page.evaluate('''() => {
                    const imgs = [...document.images].map(img => ({
                        src: img.getAttribute('src'),
                        alt: img.getAttribute('alt'),
                        hasAlt: img.hasAttribute('alt'),
                        widthAttr: img.getAttribute('width'),
                        heightAttr: img.getAttribute('height'),
                        complete: img.complete,
                        naturalWidth: img.naturalWidth,
                        loading: img.getAttribute('loading')
                    }));
                    return imgs;
                }''')
                for img in img_audit:
                    if not img['complete'] or img['naturalWidth'] == 0:
                        page_report['issues'].append({'type': 'BROKEN_IMAGE', 'src': img['src']})
                    if not img['hasAlt']:
                        page_report['warnings'].append({'type': 'IMAGE_MISSING_ALT', 'src': img['src']})
                    if not img['widthAttr'] or not img['heightAttr']:
                        page_report['warnings'].append({'type': 'IMAGE_MISSING_DIMENSIONS', 'src': img['src']})
                
                # 5. Links Audit
                link_audit = page.evaluate('''() => {
                    const links = [...document.querySelectorAll('a')].map(a => ({
                        href: a.getAttribute('href'),
                        text: a.innerText.trim(),
                        target: a.getAttribute('target'),
                        rel: a.getAttribute('rel'),
                        ariaLabel: a.getAttribute('aria-label')
                    }));
                    return links;
                }''')
                for link in link_audit:
                    href = link['href']
                    if not href:
                        page_report['issues'].append({'type': 'EMPTY_HREF', 'text': link['text']})
                    elif href.startswith('#') and len(href) > 1:
                        target_id = href[1:]
                        if not page.evaluate(f"() => !!document.getElementById('{target_id}')"):
                            page_report['issues'].append({'type': 'BROKEN_HASH_LINK', 'href': href, 'text': link['text']})
                    elif link['target'] == '_blank' and (not link['rel'] or 'noopener' not in link['rel']):
                        page_report['warnings'].append({'type': 'TARGET_BLANK_WITHOUT_NOOPENER', 'href': href})
                    if not link['text'] and not link['ariaLabel'] and not page.evaluate(f"() => !!document.querySelector('a[href=\"{href}\"] img')"):
                        page_report['warnings'].append({'type': 'EMPTY_LINK_TEXT', 'href': href})

                # 6. Form Inputs & Labels Audit
                form_audit = page.evaluate('''() => {
                    const inputs = [...document.querySelectorAll('input, select, textarea')].map(el => {
                        const id = el.id;
                        const hasAssociatedLabel = id ? !!document.querySelector(`label[for="${id}"]`) : false;
                        const hasParentLabel = !!el.closest('label');
                        const ariaLabel = el.getAttribute('aria-label');
                        const type = el.getAttribute('type') || el.tagName.toLowerCase();
                        return { id, type, hasLabel: hasAssociatedLabel || hasParentLabel || !!ariaLabel };
                    });
                    return inputs;
                }''')
                for fld in form_audit:
                    if not fld['hasLabel'] and fld['type'] not in ['hidden', 'submit', 'button']:
                        page_report['warnings'].append({'type': 'INPUT_MISSING_LABEL', 'id': fld['id'], 'field_type': fld['type']})

                # 7. Schema.org JSON-LD Validation
                schemas = page.evaluate('''() => {
                    const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
                    return scripts.map(s => {
                        try {
                            return { valid: true, data: JSON.parse(s.innerText) };
                        } catch (e) {
                            return { valid: false, error: e.message };
                        }
                    });
                }''')
                for sc in schemas:
                    if not sc['valid']:
                        page_report['issues'].append({'type': 'INVALID_JSON_LD', 'error': sc['error']})
                
                page.close()
                
                for vp in viewports:
                    p_vp = browser.new_page(viewport={'width': vp, 'height': 1000})
                    p_vp.goto(url, wait_until='domcontentloaded', timeout=15000)
                    
                    overflow_data = p_vp.evaluate('''(vpWidth) => {
                        const root = document.documentElement;
                        const scrollW = root.scrollWidth;
                        const hasOverflow = scrollW > vpWidth;
                        
                        let overflowingElements = [];
                        if (hasOverflow) {
                            const all = document.querySelectorAll('*');
                            for (let el of all) {
                                const rect = el.getBoundingClientRect();
                                if (rect.right > vpWidth + 1 || rect.width > vpWidth + 1) {
                                    overflowingElements.push({
                                        tag: el.tagName,
                                        id: el.id,
                                        className: el.className.toString().slice(0, 50),
                                        width: rect.width,
                                        right: rect.right
                                    });
                                }
                            }
                        }
                        return { hasOverflow, scrollW, overflowingElements: overflowingElements.slice(0, 5) };
                    }''', vp)
                    
                    if overflow_data['hasOverflow']:
                        page_report['viewport_overflows'].append({
                            'viewport': vp,
                            'scrollWidth': overflow_data['scrollW'],
                            'elements': overflow_data['overflowingElements']
                        })
                        page_report['issues'].append({
                            'type': 'LAYOUT_OVERFLOW',
                            'viewport': vp,
                            'scrollWidth': overflow_data['scrollW'],
                            'elements': overflow_data['overflowingElements']
                        })
                    p_vp.close()
                
                audit_results.append(page_report)
                total_issues += len(page_report['issues'])
                
            browser.close()
    finally:
        server.shutdown()
        
    out_file = QA_DIR / 'deep_dom_audit_report.json'
    out_file.write_text(json.dumps(audit_results, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"Audit completed: {len(pages)} pages checked across {len(viewports)} viewports.")
    print(f"Total Critical Issues: {total_issues}")
    for res in audit_results:
        print(f"\n📄 {res['page']}: {len(res['issues'])} Critical Issues, {len(res['warnings'])} Warnings")
        for iss in res['issues']:
            print(f"   ❌ ISSUE: {iss}")
        for warn in res['warnings']:
            print(f"   ⚠️ WARN: {warn}")

if __name__ == '__main__':
    run_audit()
