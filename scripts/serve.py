import os, sys
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ROOT = Path(__file__).resolve().parents[1] / 'public'
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8783

class CleanUrlHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        # Parse path and query
        parts = self.path.split('?', 1)
        raw_path = parts[0]
        query = ('?' + parts[1]) if len(parts) > 1 else ''

        # 1. 301 Redirect .html requests to clean URLs for SEO
        if raw_path.endswith('.html'):
            clean_path = raw_path[:-5]  # remove .html
            if clean_path in ('/index', 'index'):
                clean_target = '/' + query
            else:
                clean_target = clean_path + query
            self.send_response(301)
            self.send_header('Location', clean_target)
            self.send_header('Cache-Control', 'public, max-age=3600')
            self.end_headers()
            return

        # 2. Internally route clean URLs to corresponding .html files
        clean_name = raw_path.rstrip('/')
        if clean_name and not os.path.splitext(clean_name)[1]:
            candidate = ROOT / (clean_name.lstrip('/') + '.html')
            if candidate.is_file():
                self.path = '/' + clean_name.lstrip('/') + '.html' + query

        return super().do_GET()

if __name__ == '__main__':
    server = ThreadingHTTPServer(('127.0.0.1', PORT), CleanUrlHandler)
    print(f"Serving clean SEO URLs on http://127.0.0.1:{PORT}/ from {ROOT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
