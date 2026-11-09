import { strict as assert } from "node:assert";
import { test } from "node:test";
import { renderPage } from "../src/app.mjs";
import { createAppServer, resolvePublicPath } from "../server.mjs";

test("renders truthful no-data state and source registry", () => {
  const html = renderPage();
  assert.match(html, /That is not evidence that any business is safe/);
  assert.match(html, /Food Safety and Standards Authority of India/);
  assert.match(html, /Telangana Food Safety Department/);
  assert.match(html, /Operator preview · read only/);
});

test("escapes source registry values before rendering", () => {
  const html = renderPage();
  assert.doesNotMatch(html, /<script>/i);
});

test("rejects paths outside the public root", () => {
  assert.equal(resolvePublicPath("/../package.json"), null);
  assert.equal(resolvePublicPath("/%2e%2e/package.json"), null);
});

test("serves server-rendered HTML and static assets", async (t) => {
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const base = `http://127.0.0.1:${address.port}`;
  const page = await fetch(`${base}/`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /SIFT India/);
  const stylesheet = await fetch(`${base}/styles.css`);
  assert.equal(stylesheet.status, 200);
  assert.match(stylesheet.headers.get("content-type") || "", /text\/css/);
  const missing = await fetch(`${base}/not-found`);
  assert.equal(missing.status, 404);
  const packageFile = await fetch(`${base}/package.json`);
  assert.equal(packageFile.status, 404);
  const encodedPackageFile = await fetch(`${base}/%2e%2e/package.json`);
  assert.equal(encodedPackageFile.status, 404);
});

test("only allows read methods", async (t) => {
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const response = await fetch(`http://127.0.0.1:${address.port}/`, { method: "POST" });
  assert.equal(response.status, 405);
});
