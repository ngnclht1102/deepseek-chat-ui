import http.server
import socketserver
import requests
from urllib.parse import urlparse, parse_qs
import logging
import json

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# Configuration
DEEPSEEK_API_BASE_URL = "https://api.deepseek.com"
DEEPSEEK_API_KEY = "zzzz"  # Replace with your actual API key
ANDROID_SERVER_PORT = 2000
TIMEOUT_SECONDS = 60  # Increased timeout to 60 seconds

class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.forward_request()

    def do_POST(self):
        self.forward_request()

    def do_PUT(self):
        self.forward_request()

    def do_DELETE(self):
        self.forward_request()

    def forward_request(self):
        try:
            # Log incoming request details
            logging.debug(f"Incoming request: {self.command} {self.path}")
            logging.debug(f"Raw headers: {self.headers}")

            # Parse the incoming request
            parsed_url = urlparse(self.path)
            deepseek_url = DEEPSEEK_API_BASE_URL + parsed_url.path
            query_params = parse_qs(parsed_url.query)

            # Prepare headers
            headers = {
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
                "Referer": "https://www.24h.com.vn/"
            }

            # Prepare body
            if self.command in ["POST", "PUT"]:
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length) if content_length > 0 else None
                logging.debug(f"Raw body: {body}")

                # Validate JSON body
                if body:
                    try:
                        json_body = json.loads(body.decode('utf-8'))
                        logging.debug(f"Parsed JSON body: {json_body}")
                    except json.JSONDecodeError as e:
                        logging.error(f"Invalid JSON body: {str(e)}")
                        self.send_error(400, "Invalid JSON body")
                        return
                else:
                    json_body = None
            else:
                json_body = None

            # Forward the request to Deepseek API with streaming
            logging.debug(f"Forwarding request to Deepseek API: {deepseek_url}")
            with requests.request(
                method=self.command,
                url=deepseek_url,
                params=query_params,
                headers=headers,
                json=json_body,
                timeout=TIMEOUT_SECONDS,
                stream=True  # Enable streaming
            ) as response:
                # Log the response status from Deepseek API
                logging.debug(f"Deepseek API response: {response.status_code}")

                # Send the response status and headers to the client
                self.send_response(response.status_code)
                for key, value in response.headers.items():
                    if key.lower() == "content-type":
                        self.send_header(key, value)
                self.end_headers()

                # Stream the response content in chunks
                for chunk in response.iter_content(chunk_size=8192):  # Adjust chunk_size as needed
                    if chunk:
                        self.wfile.write(chunk)
                        self.wfile.flush()  # Ensure data is sent immediately

        except requests.exceptions.Timeout:
            logging.error("Request to Deepseek API timed out")
            self.send_error(504, "Gateway Timeout: The request to the upstream server timed out")
        except Exception as e:
            logging.error(f"Error processing request: {str(e)}")
            self.send_error(500, str(e))

# Start the server
with socketserver.TCPServer(("", ANDROID_SERVER_PORT), ProxyHandler) as httpd:
    logging.info(f"Android Python server running on port {ANDROID_SERVER_PORT}")
    httpd.serve_forever()