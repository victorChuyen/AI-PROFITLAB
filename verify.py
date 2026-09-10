from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import functools,threading,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).parent
OUT=ROOT/'qa';OUT.mkdir(exist_ok=True)
import os, shutil
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
    def copyfile(self, source, outputfile):
        try:
            shutil.copyfileobj(source, outputfile, 64 * 1024)
        except Exception:
            pass
    def do_GET(self):
        url_path = self.path.split('?')[0].rstrip('/')
        if url_path and not os.path.splitext(url_path)[1]:
            candidate = ROOT / 'public' / (url_path.lstrip('/') + '.html')
            if candidate.is_file():
                query = ('?' + self.path.split('?', 1)[1]) if '?' in self.path else ''
                self.path = '/' + url_path.lstrip('/') + '.html' + query
        return super().do_GET()
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT/'public')))
threading.Thread(target=server.serve_forever,daemon=True).start()
results=[]
try:
    with sync_playwright() as pw:
        browser=pw.chromium.launch(channel='chrome',headless=True,args=['--disable-gpu','--disable-dev-shm-usage','--no-sandbox'])
        for width in [1440,390,360]:
            page=browser.new_page(viewport={'width':width,'height':1000})
            for file in ['index.html','starter.html','live.html','tu-van.html','thong-tin.html','checkout.html']:
                errors=[]
                handler=lambda e:errors.append(str(e))
                page.on('pageerror',handler)
                page.goto(f'http://127.0.0.1:{server.server_port}/{file}',wait_until='networkidle')
                for lazy_image in page.locator('img[loading="lazy"]').all():
                    lazy_image.scroll_into_view_if_needed()
                    lazy_image.evaluate('(img) => img.decode()')
                page.evaluate('window.scrollTo(0,0)')
                metrics=page.evaluate('''() => ({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,brokenImages:[...document.images].filter(x=>x.hasAttribute('src')&&(!x.complete||!x.naturalWidth)).map(x=>x.src),badLocalLinks:[...document.querySelectorAll('a[href^="#"]')].filter(x=>!document.getElementById(x.hash.slice(1))).map(x=>x.hash)})''')
                if file=='index.html':
                    page.screenshot(path=str(OUT/f'home-{width}.png'),full_page=True)
                    page.screenshot(path=str(OUT/f'hero-{width}.png'))
                    page.locator('#make-prompt').click()
                    assert 'Hãy nhập' in page.locator('#prompt-status').inner_text()
                    page.locator('#idea').fill('Giúp homestay viết mô tả phòng')
                    page.locator('#make-prompt').click()
                    assert 'homestay' in page.locator('#prompt-result').input_value()
                    if width<760:
                        page.locator('.mobile-menu summary').click()
                        assert page.locator('.mobile-menu nav').is_visible()
                if file=='starter.html':
                    page.screenshot(path=str(OUT/f'starter-{width}.png'),full_page=True)
                    faq=page.locator('.faq summary').first
                    faq.focus();page.keyboard.press('Enter')
                    assert page.locator('.faq details').first.get_attribute('open') is not None
                    assert page.locator('[data-starter]').first.get_attribute('href') in ('/checkout?sku=starter', 'checkout?sku=starter', 'checkout.html?sku=starter')
                    assert '500.000' in page.locator('.price').inner_text()
                if file=='checkout.html':
                    assert '500.000' in page.locator('#checkout-price').inner_text()
                    assert 'chưa mở' in page.locator('#checkout-message').inner_text()
                if file=='tu-van.html':
                    page.locator('#project').fill('Funnel demo')
                    page.locator('#audience').fill('Chủ homestay')
                    page.locator('#goal').fill('Trang bán và bàn giao tài liệu')
                    page.locator('button[type=submit]').click()
                    assert 'Funnel demo' in page.locator('#brief-result').input_value()
                    assert 'Chưa gửi' in page.locator('#brief-status').inner_text()
                results.append({'page':file,'viewport':width,'errors':errors,**metrics})
                page.remove_listener('pageerror',handler)
            page.close()
        browser.close()
finally:server.shutdown()
(OUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
failures=[r for r in results if r['errors'] or r['brokenImages'] or r['badLocalLinks'] or r['scrollWidth']>r['width'] or r['h1']!=1]
print(json.dumps({'pages_checked':len(results),'failures':failures},ensure_ascii=False))
assert not failures
