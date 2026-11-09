import { createHash } from "node:crypto";
import { isIP } from "node:net";

const REQUIRED_ARTIFACT_FIELDS = [
  "id", "sourceId", "canonicalUrl", "retrievedAt", "publishedAt", "contentType", "sha256", "rawText", "accessDecision"
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const SHA256 = /^[a-f0-9]{64}$/i;
const ALLOWED_CONTENT_TYPES = new Set(["text/html", "application/pdf", "text/plain"]);
const ACCESS_DECISIONS = new Set(["permitted", "uncertain", "blocked"]);

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const isIsoDate = (value) => typeof value === "string" && ISO_DATE.test(value) && !Number.isNaN(Date.parse(value));
const isSafeCanonicalUrl = (value) => {
  if (!isNonEmptyString(value)) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password && isIP(parsed.hostname) === 0;
  } catch {
    return false;
  }
};
const immutableCopy = (value, seen = new WeakMap()) => {
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);
  const copy = Array.isArray(value) ? [] : {};
  seen.set(value, copy);
  for (const [key, child] of Object.entries(value)) copy[key] = immutableCopy(child, seen);
  return Object.freeze(copy);
};
const digestText = (text) => createHash("sha256").update(text, "utf8").digest("hex");

export const validateArtifact = (artifact) => {
  const errors = [];
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) return { valid: false, errors: ["artifact must be an object"] };
  for (const field of REQUIRED_ARTIFACT_FIELDS) if (!(field in artifact)) errors.push(`${field} is required`);
  if (!isNonEmptyString(artifact.id)) errors.push("id must be a non-empty string");
  if (!isNonEmptyString(artifact.sourceId)) errors.push("sourceId must be a non-empty string");
  if (!isSafeCanonicalUrl(artifact.canonicalUrl)) errors.push("canonicalUrl must be an HTTPS URL without credentials or an IP literal");
  if (!isIsoDate(artifact.retrievedAt)) errors.push("retrievedAt must be an ISO UTC timestamp");
  if (artifact.publishedAt !== null && !isIsoDate(artifact.publishedAt)) errors.push("publishedAt must be null or an ISO UTC timestamp");
  if (!ALLOWED_CONTENT_TYPES.has(artifact.contentType)) errors.push("contentType is not supported");
  if (!SHA256.test(artifact.sha256 || "")) errors.push("sha256 must be a 64-character hexadecimal digest");
  if (!isNonEmptyString(artifact.rawText)) errors.push("rawText must be retained for evidence review");
  if (SHA256.test(artifact.sha256 || "") && isNonEmptyString(artifact.rawText) && createHash("sha256").update(artifact.rawText, "utf8").digest("hex") !== artifact.sha256.toLowerCase()) errors.push("sha256 does not match retained rawText");
  if (!ACCESS_DECISIONS.has(artifact.accessDecision)) errors.push("accessDecision is invalid");
  if (artifact.accessDecision !== "permitted") errors.push("only permitted artifacts can enter the evidence store");
  return { valid: errors.length === 0, errors };
};

export const createArtifact = (input) => {
  if (!input || typeof input !== "object") throw new TypeError("Artifact input must be an object");
  const artifact = immutableCopy({
    id: input.id, sourceId: input.sourceId, canonicalUrl: input.canonicalUrl,
    retrievedAt: input.retrievedAt, publishedAt: input.publishedAt ?? null,
    contentType: input.contentType, sha256: typeof input.sha256 === "string" ? input.sha256.toLowerCase() : input.sha256,
    rawText: input.rawText, accessDecision: input.accessDecision, metadata: input.metadata || {}
  });
  const result = validateArtifact(artifact);
  if (!result.valid) throw new TypeError(`Invalid evidence artifact: ${result.errors.join("; ")}`);
  return artifact;
};

export const createEvidenceRecord = (input) => {
  if (!input || typeof input !== "object") throw new TypeError("Evidence record input must be an object");
  const artifact = createArtifact(input.artifact);
  if (!isNonEmptyString(input.exactPassage) || !artifact.rawText.includes(input.exactPassage)) throw new TypeError("Evidence record requires an exact passage retained in the artifact");
  const record = {
    id: input.id, artifactId: artifact.id, jurisdiction: input.jurisdiction,
    outlet: input.outlet ? immutableCopy(input.outlet) : null, classification: input.classification,
    exactPassage: input.exactPassage, sourceLocator: immutableCopy(input.sourceLocator),
    verification: immutableCopy(input.verification), status: "unpublished"
  };
  if (!isNonEmptyString(record.id) || !isNonEmptyString(record.jurisdiction) || !isNonEmptyString(record.classification)) throw new TypeError("Evidence record requires id, jurisdiction, and classification");
  if (!record.sourceLocator || !isNonEmptyString(record.sourceLocator.kind) || !isNonEmptyString(record.sourceLocator.value)) throw new TypeError("Evidence record requires a source locator");
  if (!record.verification || !isNonEmptyString(record.verification.decision) || !isNonEmptyString(record.verification.reviewerId)) throw new TypeError("Evidence record requires a verification decision and reviewer");
  return Object.freeze({ record: Object.freeze(record), artifact });
};

export const appendCorrection = (record, correction) => {
  if (!record || record.status !== "published") throw new TypeError("Only published records can receive corrections");
  if (!isNonEmptyString(correction?.id) || !isNonEmptyString(correction?.reason) || !isNonEmptyString(correction?.reviewerId)) throw new TypeError("Correction requires id, reason, and reviewer");
  return Object.freeze({ ...record, status: "corrected", corrections: Object.freeze([...(record.corrections || []), immutableCopy(correction)]) });
};

export const artifactSchema = Object.freeze({ required: Object.freeze([...REQUIRED_ARTIFACT_FIELDS]), contentTypes: Object.freeze([...ALLOWED_CONTENT_TYPES]), accessDecisions: Object.freeze([...ACCESS_DECISIONS]) });
export { immutableCopy };
