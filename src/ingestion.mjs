import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { sourceRegistry } from "./data.mjs";
import { createArtifact } from "./evidence.mjs";

const allowedHosts = new Set();
const sourceById = new Map(sourceRegistry.map((source) => [source.id, source]));

export const isSafePublicHostname = (hostname) => {
  if (typeof hostname !== "string") return false;
  const normalized = hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "").replace(/\.$/, "");
  if (normalized === "localhost" || normalized.endsWith(".localhost") || normalized.endsWith(".local")) return false;
  if (isIP(normalized) !== 0 || normalized.length > 253 || !normalized.includes(".")) return false;
  return normalized.split(".").every((label) => label.length > 0 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label));
};

export const registerAllowedHost = (sourceId, hostname) => {
  const source = sourceById.get(sourceId);
  if (!source) throw new Error(`Unknown source: ${sourceId}`);
  if (source.access !== "permitted") throw new Error(`Source is not permitted: ${sourceId}`);
  if (!isSafePublicHostname(hostname)) throw new TypeError("A public DNS hostname is required");
  allowedHosts.add(`${sourceId}:${hostname.toLowerCase()}`);
};

export const canFetch = (sourceId, url) => {
  const source = sourceById.get(sourceId);
  if (!source || source.access !== "permitted") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password && isSafePublicHostname(parsed.hostname) && allowedHosts.has(`${sourceId}:${parsed.hostname.toLowerCase()}`);
  } catch {
    return false;
  }
};

export const buildArtifactFromResponse = async ({ sourceId, url, response, retrievedAt, publishedAt = null, maxBytes = 5_000_000 }) => {
  if (!canFetch(sourceId, url)) throw new Error("Source URL is not allowlisted and permitted");
  if (!response?.ok || !response.body) throw new Error("Source response was not successful or had no body");
  const contentType = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (!["text/html", "text/plain"].includes(contentType)) throw new TypeError("Only bounded HTML or plain text responses are supported");
  const reader = response.body.getReader();
  const chunks = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > maxBytes) {
        await reader.cancel();
        throw new RangeError("Source response exceeded the configured size limit");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
  const rawText = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const source = sourceById.get(sourceId);
  return createArtifact({ id: `${source.id}:${sha256}`, sourceId, canonicalUrl: url, retrievedAt, publishedAt, contentType, sha256, rawText, accessDecision: source.access });
};

export const ingestionPolicy = Object.freeze({ requireHttps: true, requireAllowlistedHost: true, requirePermittedSource: true, rejectsIpLiterals: true, maxBytes: 5_000_000, networkFetchEnabled: false, bypassAccessControls: false, publishAutomatically: false });
export const resetAllowedHostsForTests = () => allowedHosts.clear();
export const sourceConnectorState = () => Object.freeze(sourceRegistry.map((source) => Object.freeze({ id: source.id, access: source.access, permittedHosts: [...allowedHosts].filter((key) => key.startsWith(`${source.id}:`)).map((key) => key.slice(source.id.length + 1)) })));
export { sourceRegistry };
