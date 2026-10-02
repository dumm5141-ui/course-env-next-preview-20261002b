from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import sys


ROOT = Path.cwd()


def source_is_implemented() -> bool:
    page = (ROOT / "app" / "page.tsx").read_text(encoding="utf-8")
    counter = (ROOT / "app" / "counter.tsx").read_text(encoding="utf-8")
    has_client_directive = "'use client'" in counter or '"use client"' in counter
    has_state = "useState" in counter
    has_button = "button" in counter or "Button" in counter
    return has_client_directive and has_state and has_button and "Counter" in page


def render_page() -> str:
    if not source_is_implemented():
        return """<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Next.js Counter</title></head>
<body><main><h1>Next.js Counter</h1><p>Add the Counter component below.</p></main></body>
</html>"""

    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Next.js Counter</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; background: #fff; color: #111827; }
    main { max-width: 600px; margin: 2rem auto; text-align: center; }
    h1 { font-size: 2.25rem; margin-bottom: 1.5rem; }
    .counter-container { margin-top: 3rem; padding: 2.5rem; border-radius: 12px; border: 1px solid #e5e7eb; background: #f9fafb; }
    h2 { font-size: 1.75rem; margin-bottom: 1.5rem; }
    button { padding: .75rem 1.75rem; font-size: 1rem; font-weight: 600; border-radius: 8px; border: 1px solid #2563eb; background: #2563eb; color: #fff; cursor: pointer; }
  </style>
</head>
<body>
  <main>
    <h1>Next.js Counter</h1>
    <div class="counter-container">
      <h2 id="counter-heading">Count: <span id="count-value">0</span></h2>
      <button id="increment-button" type="button">Increment</button>
    </div>
  </main>
  <script>
    let count = 0;
    const value = document.getElementById("count-value");
    const button = document.getElementById("increment-button");
    button.addEventListener("click", () => { count += 1; value.textContent = String(count); });
  </script>
</body>
</html>"""


class PreviewHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path.split("?", 1)[0] == "/favicon.ico":
            self.send_response(204)
            self.end_headers()
            return
        if self.path.split("?", 1)[0] != "/":
            self.send_error(404, "Not found")
            return
        body = render_page().encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, _format: str, *_args: object) -> None:
        return


if __name__ == "__main__":
    if "--test" in sys.argv:
        rendered = render_page()
        if "Next.js Counter" not in rendered or "Increment" not in rendered:
            raise SystemExit("standalone preview self-test did not render the counter page")
        print("Standalone Next.js preview self-test passed", flush=True)
        raise SystemExit(0)
    port = int(os.environ.get("PORT", "3000"))
    server = ThreadingHTTPServer(("0.0.0.0", port), PreviewHandler)
    print("   ▲ Next.js starter preview", flush=True)
    print(f"   - Network:        http://0.0.0.0:{port}", flush=True)
    print(" ✓ Ready in standalone mode", flush=True)
    server.serve_forever()
