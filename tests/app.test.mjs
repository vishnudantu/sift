import { strict as assert } from "node:assert";
import { test } from "node:test";
import { renderPage, searchPublicIndex } from "../src/app.mjs";
import { createAppServer, resolvePublicPath } from "../server.mjs";

test("renders truthful no-data state and source registry", () => {
  const html = renderPage();
  assert.match(html, /That is not evidence that any business is safe/);
  assert.match(html, /Food Safety and Standards Authority of India/);
  assert.match(html, /Telangana Food Safety Department/);
  assert.match(html, /Public status · read only/);
  assert.match(html, /Suggest an <i>evidence lead/);
  assert.match(html, /never becomes an inspection record/);
  assert.match(html, /name="publishedAt" type="date"/);
  assert.match(html, /name="jurisdiction"/);
  assert.match(html, /name="passage"/);
});

test("escapes source registry values before rendering", () => {
  const html = renderPage();
  assert.doesNotMatch(html, /<script>/i);
});

test("searches registered sources without inventing records", () => {
  const result = searchPublicIndex("  TELANGANA  " );
  assert.equal(result.query, "telangana");
  assert.equal(result.sources.length, 1);
  assert.equal(result.sources[0].authority, "Telangana Food Safety Department");
  assert.deepEqual(result.records, []);
  assert.equal(searchPublicIndex("").sources.length, 0);
  assert.equal(searchPublicIndex("unlisted place").sources.length, 0);
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
  assert.equal(page.headers.get("x-frame-options"), "DENY");
  assert.equal(page.headers.get("x-content-type-options"), "nosniff");
  assert.match(page.headers.get("content-security-policy") || "", /default-src 'self'/);
  assert.match(await page.text(), /SIFT India/);
  const search = await fetch(`${base}/api/search?q=telangana`);
  assert.equal(search.status, 200);
  assert.equal(search.headers.get("cache-control"), "no-store");
  assert.equal(search.headers.get("x-frame-options"), "DENY");
  const searchResult = await search.json();
  assert.equal(searchResult.sources[0].authority, "Telangana Food Safety Department");
  assert.deepEqual(searchResult.records, []);
  const oversized = await fetch(`${base}/api/search?q=${"x".repeat(121)}`);
  assert.equal(oversized.status, 400);
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
