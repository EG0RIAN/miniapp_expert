#!/usr/bin/env python3
"""
Simple HTTP server with disabled caching for development
"""
import http.server
import socketserver

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Disable caching
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Expires', '0')
        self.send_header('Pragma', 'no-cache')
        super().end_headers()

PORT = 1234

with socketserver.TCPServer(("", PORT), NoCacheHTTPRequestHandler) as httpd:
    print(f"✅ Server running at http://localhost:{PORT}/")
    print(f"📝 Cache disabled for development")
    print(f"🛑 Press Ctrl+C to stop")
    httpd.serve_forever()

