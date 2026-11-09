import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { renderPage, searchPublicIndex } from "./src/app.mjs";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml" };
const publicAssets = new Set(["app.js", "styles.css"]);
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
};

export const resolvePublicPath = (requestedPath) => {
  const cleanPath = requestedPath.split("?")[0];
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(cleanPath);
  } catch {
    return null;
  }
  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^[/\\]+/, "");
  const candidate = resolve(root, relativePath);
  const fromRoot = relative(root, candidate);
  const outsideRoot = fromRoot === ".." || fromRoot.startsWith(`..${sep}`);
  return outsideRoot ? null : candidate;
};

export const createAppServer = () => createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method not allowed");
    return;
  }
  const pathname = new URL(request.url || "/", "http://127.0.0.1").pathname;
  if (pathname === "/api/search") {
    const query = new URL(request.url || "/", "http://127.0.0.1").searchParams.get("q") || "";
    if (query.length > 120) {
      response.writeHead(400, { ...securityHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      response.end(JSON.stringify({ error: "Search query must be 120 characters or fewer." }));
      return;
    }
    response.writeHead(200, { ...securityHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end(JSON.stringify(searchPublicIndex(query)));
    return;
  }
  if (pathname === "/") {
    const body = renderPage();
    response.writeHead(200, { ...securityHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    response.end(request.method === "HEAD" ? undefined : body);
    return;
  }
  const path = resolvePublicPath(pathname);
  if (!path) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }
  if (!publicAssets.has(pathname.replace(/^\/+/, ""))) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  try {
    const body = await readFile(path);
    response.writeHead(200, { ...securityHeaders, "Content-Type": types[extname(path)] || "application/octet-stream", "Cache-Control": "no-store" });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createAppServer().listen(port, "127.0.0.1", () => process.stderr.write(`SIFT running at http://127.0.0.1:${port}\n`));
}
