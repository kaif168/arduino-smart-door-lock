#!/usr/bin/env python3
"""
Zero-Dependency Python Backend Server for Smart Door Lock & Security Dashboard
Provides:
1. Static web server serving HTML/CSS/JS files on port 8080.
2. REST API endpoints for Arduino ESP32 & Web Front-end synchronization.
"""

import http.server
import socketserver
import json
import os
import sys
import urllib.parse
from datetime import datetime

# Set encoding for standard output
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# In-memory IoT System State
system_state = {
    "isLocked": True,
    "mode": "standard",
    "lastUpdated": datetime.now().isoformat(),
    "updatedBy": "System Init"
}

logs_db = [
    {"id": "log-1", "timestamp": datetime.now().isoformat(), "user": "Dr. Mohammad Kaif", "method": "PIN Keypad", "status": "Granted", "note": "Door unlocked via keypad"},
    {"id": "log-2", "timestamp": datetime.now().isoformat(), "user": "Unknown", "method": "PIN Keypad", "status": "Denied", "note": "Invalid PIN entry attempt"},
]

class SmartLockRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS for ESP32 and external callers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == '/api/status':
            self.send_json_response(200, system_state)
        elif parsed_path.path == '/api/logs':
            self.send_json_response(200, logs_db)
        else:
            super().do_GET()

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)

        try:
            body = json.loads(post_data.decode('utf-8')) if post_data else {}
        except Exception:
            body = {}

        if parsed_path.path == '/api/door':
            action = body.get('action', '')
            user = body.get('user', 'REST API')

            if action == 'lock':
                system_state['isLocked'] = True
                system_state['lastUpdated'] = datetime.now().isoformat()
                system_state['updatedBy'] = user
                logs_db.insert(0, {
                    "id": f"log-{int(datetime.now().timestamp())}",
                    "timestamp": datetime.now().isoformat(),
                    "user": user,
                    "method": "REST API",
                    "status": "Granted",
                    "note": "Door locked via REST API"
                })
                self.send_json_response(200, {"success": True, "state": "LOCKED"})
            elif action == 'unlock':
                system_state['isLocked'] = False
                system_state['lastUpdated'] = datetime.now().isoformat()
                system_state['updatedBy'] = user
                logs_db.insert(0, {
                    "id": f"log-{int(datetime.now().timestamp())}",
                    "timestamp": datetime.now().isoformat(),
                    "user": user,
                    "method": "REST API",
                    "status": "Granted",
                    "note": "Door unlocked via REST API"
                })
                self.send_json_response(200, {"success": True, "state": "UNLOCKED"})
            else:
                self.send_json_response(400, {"error": "Invalid action. Use 'lock' or 'unlock'."})
        elif parsed_path.path == '/api/v1/door/log':
            # Endpoint hit by Arduino ESP32 HTTP POST
            logs_db.insert(0, {
                "id": f"log-{int(datetime.now().timestamp())}",
                "timestamp": datetime.now().isoformat(),
                "user": body.get("user", "ESP32 Device"),
                "method": "Arduino ESP32",
                "status": body.get("status", "Granted"),
                "note": "Telemetry log received from physical hardware"
            })
            self.send_json_response(200, {"status": "received"})
        else:
            self.send_json_response(404, {"error": "API route not found"})

    def send_json_response(self, code, data):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

if __name__ == '__main__':
    print("==========================================================================")
    print(f"[*] Smart Door Lock Web Server Running at: http://localhost:{PORT}")
    print(f"[*] API Endpoints available: http://localhost:{PORT}/api/status & /api/door")
    print("==========================================================================")
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), SmartLockRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
