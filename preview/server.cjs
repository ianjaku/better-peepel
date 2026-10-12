const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { panelHTML } = require("../tests/fixtures.cjs");
const root = path.resolve(__dirname, "..");
const assets = new Map([
  ["/extension/balances.js", "extension/balances.js"],
  ["/extension/summary.js", "extension/summary.js"],
  ["/extension/content.js", "extension/content.js"],
  ["/preview.js", "preview/preview.js"],
  ["/preview.css", "preview/preview.css"]
]);
const port = Number(process.env.PEEPEL_PREVIEW_PORT || 4173);

http.createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  if (["/", "/leave", "/app"].includes(url.pathname)) {
    const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8").replace("<!-- PEEPEL_PANEL -->", panelHTML());
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(html);
    return;
  }
  const file = assets.get(url.pathname);
  if (!file) { res.writeHead(404); res.end("Not found"); return; }
  res.writeHead(200, { "Content-Type": file.endsWith(".css") ? "text/css" : "text/javascript", "Cache-Control": "no-store" });
  fs.createReadStream(path.join(root, file)).pipe(res);
}).listen(port, "127.0.0.1", () => console.log(`Preview: http://127.0.0.1:${port}/leave`));
