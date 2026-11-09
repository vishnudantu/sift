import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { publicState, sourceRegistry } from "../src/data.mjs";
import { appendCorrection, createArtifact, createEvidenceRecord, validateArtifact } from "../src/evidence.mjs";
import { createEvidenceRepository } from "../src/repository.mjs";
import { buildArtifactFromResponse, canFetch, ingestionPolicy, isSafePublicHostname, registerAllowedHost, resetAllowedHostsForTests } from "../src/ingestion.mjs";

const validDigest = createHash("sha256").update("Exact captured source text.", "utf8").digest("hex");

const validArtifact = {
  id: "telangana:abc123",
  sourceId: "telangana-food-safety",
  canonicalUrl: "https://official.example/notices/1",
  retrievedAt: "2026-11-08T12:00:00Z",
  publishedAt: "2026-11-08T11:00:00Z",
  contentType: "text/html",
  sha256: "0c3908eb333c6feb41aafdbf479211f4df1511622a21ce09a00740700eb5acb1",
  rawText: "Exact captured source text.",
  accessDecision: "permitted"
};

test("accepts a complete permitted source artifact", () => {
  assert.equal(validateArtifact(validArtifact).valid, true);
  assert.equal(createArtifact(validArtifact).id, validArtifact.id);
});

test("rejects retained text when its digest does not match", () => {
  assert.equal(validateArtifact({ ...validArtifact, sha256: "a".repeat(64) }).valid, false);
});

test("rejects unsafe canonical artifact URLs", () => {
  assert.equal(validateArtifact({ ...validArtifact, canonicalUrl: "http://official.example/notice" }).valid, false);
  assert.equal(validateArtifact({ ...validArtifact, canonicalUrl: "https://user:secret@official.example/notice" }).valid, false);
  assert.equal(validateArtifact({ ...validArtifact, canonicalUrl: "https://127.0.0.1/notice" }).valid, false);
});
test("creates unpublished records only with exact passage and reviewer decision", () => {
  const { record } = createEvidenceRecord({
    id: "claim-1",
    artifact: validArtifact,
    jurisdiction: "Telangana",
    outlet: { address: { city: "Hyderabad" } },
    classification: "inspection finding",
    exactPassage: "Exact captured source text.",
    sourceLocator: { kind: "paragraph", value: "p-4" },
    verification: { decision: "confirmed", reviewerId: "reviewer-1" }
  });
  assert.equal(record.status, "unpublished");
  assert.equal(record.outlet.address.city, "Hyderabad");
  assert.equal(Object.isFrozen(record), true);
  assert.equal(Object.isFrozen(record.outlet.address), true);
  assert.throws(() => createEvidenceRecord({ id: "x", artifact: validArtifact, exactPassage: "Exact captured source text." }), /jurisdiction/);
  assert.throws(() => createEvidenceRecord({
    id: "claim-2", artifact: validArtifact, jurisdiction: "Telangana", classification: "finding",
    exactPassage: "Fabricated passage", sourceLocator: { kind: "paragraph", value: "p-9" },
    verification: { decision: "confirmed", reviewerId: "reviewer-1" }
  }), /exact passage retained/);
});

test("repository snapshots preserve append-only review lifecycle", () => {
  const repository = createEvidenceRepository();
  const artifact = repository.appendArtifact(validArtifact);
  const beforeRecord = repository.snapshot();
  const record = repository.appendRecord({
    id: "claim-repo-1", artifact, jurisdiction: "Telangana", classification: "inspection finding",
    exactPassage: "Exact captured source text.", sourceLocator: { kind: "paragraph", value: "p-4" },
    verification: { decision: "pending", reviewerId: "intake-1" }
  });
  assert.equal(record.status, "unpublished");
  assert.equal(beforeRecord.records.length, 0);
  assert.throws(() => repository.appendArtifact(validArtifact), /already exists/);
  const published = repository.reviewRecord(record.id, { decision: "approved", reviewerId: "reviewer-2" });
  assert.equal(published.status, "published");
  const corrected = repository.correctRecord(record.id, { id: "corr-1", reason: "Official source correction", reviewerId: "reviewer-2" });
  assert.equal(corrected.status, "corrected");
  assert.equal(repository.snapshot().events.length, 4);
  assert.throws(() => repository.reviewRecord(record.id, { decision: "approved", reviewerId: "reviewer-2" }), /Only unpublished/);
});



test("repository replays its durable journal", async () => {
  const { mkdtempSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const directory = mkdtempSync(join(tmpdir(), "sift-repository-"));
  const journalPath = join(directory, "events.ndjson");
  try {
    const first = createEvidenceRepository({ journalPath });
    const artifact = first.appendArtifact(validArtifact);
    const record = first.appendRecord({
      id: "claim-persisted", artifact, jurisdiction: "Telangana", classification: "finding",
      exactPassage: "Exact captured source text.", sourceLocator: { kind: "paragraph", value: "p-4" },
      verification: { decision: "pending", reviewerId: "intake-1" }
    });
    first.reviewRecord(record.id, { decision: "approved", reviewerId: "reviewer-1" });
    const reopened = createEvidenceRepository({ journalPath });
    assert.equal(reopened.snapshot().records[0].status, "published");
    assert.equal(reopened.snapshot().events.length, 3);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("repository requires stored artifact, valid decision, and reviewer identity", () => {
  const repository = createEvidenceRepository();
  assert.throws(() => repository.appendRecord({
    id: "claim-repo-2", artifact: validArtifact, jurisdiction: "Telangana", classification: "finding",
    exactPassage: "Exact captured source text.", sourceLocator: { kind: "paragraph", value: "p-4" },
    verification: { decision: "pending", reviewerId: "intake-1" }
  }), /appended first/);
  const artifact = repository.appendArtifact(validArtifact);
  const record = repository.appendRecord({
    id: "claim-repo-3", artifact, jurisdiction: "Telangana", classification: "finding",
    exactPassage: "Exact captured source text.", sourceLocator: { kind: "paragraph", value: "p-4" },
    verification: { decision: "pending", reviewerId: "intake-1" }
  });
  assert.throws(() => repository.reviewRecord(record.id, { decision: "publish", reviewerId: "reviewer-2" }), /approved or rejected/);
  assert.throws(() => repository.reviewRecord(record.id, { decision: "approved", reviewerId: " " }), /reviewer/);
});


test("deeply freezes exported source and public state boundaries", () => {
  assert.equal(Object.isFrozen(sourceRegistry[0]), true);
  assert.equal(Object.isFrozen(publicState), true);
  assert.equal(Object.isFrozen(publicState.records), true);
  assert.throws(() => { sourceRegistry[0].access = "permitted"; }, TypeError);
  assert.throws(() => { publicState.records.push({ id: "forged" }); }, TypeError);
});

test("appends a correction without altering published record", () => {
  const published = Object.freeze({ id: "claim-1", status: "published", corrections: Object.freeze([]) });
  const corrected = appendCorrection(published, { id: "corr-1", reason: "Official update", reviewerId: "reviewer-1" });
  assert.equal(published.status, "published");
  assert.equal(corrected.status, "corrected");
  assert.equal(corrected.corrections.length, 1);
});

test("blocks ingestion while official source access remains uncertain", async () => {
  resetAllowedHostsForTests();
  assert.equal(canFetch("telangana-food-safety", "https://example.gov.in/notices"), false);
  assert.throws(() => registerAllowedHost("telangana-food-safety", "example.gov.in"), /not permitted/);
  assert.equal(ingestionPolicy.publishAutomatically, false);
  await assert.rejects(() => buildArtifactFromResponse({ sourceId: "telangana-food-safety", url: "https://example.gov.in/notices", response: { ok: true, headers: new Headers({ "content-type": "text/html" }) }, retrievedAt: validArtifact.retrievedAt }), /allowlisted and permitted/);
});

test("rejects private and local host forms independently of source permissions", () => {
  assert.equal(isSafePublicHostname("127.0.0.1"), false);
  assert.equal(isSafePublicHostname("192.168.1.8"), false);
  assert.equal(isSafePublicHostname("[::1]"), false);
  assert.equal(isSafePublicHostname("[fe80::1]"), false);
  assert.equal(isSafePublicHostname("[::ffff:127.0.0.1]"), false);
  assert.equal(isSafePublicHostname("localhost"), false);
  assert.equal(isSafePublicHostname("public.example"), true);
  assert.equal(isSafePublicHostname("bad..example"), false);
  assert.equal(isSafePublicHostname("-bad.example"), false);
  assert.equal(isSafePublicHostname("example."), false);
});

test("requires explicit allowlisted HTTPS host after permission is granted", () => {
  resetAllowedHostsForTests();
  assert.equal(canFetch("fssai-central", "http://fssai.gov.in/data"), false);
  assert.equal(canFetch("fssai-central", "https://fssai.gov.in/data"), false);
  assert.equal(canFetch("fssai-central", "https://127.0.0.1/data"), false);
  assert.equal(canFetch("fssai-central", "https://192.168.1.8/data"), false);
  assert.equal(canFetch("fssai-central", "https://[::1]/data"), false);
  assert.equal(canFetch("fssai-central", "https://[fe80::1]/data"), false);
  assert.throws(() => registerAllowedHost("fssai-central", "localhost"), /not permitted|public hostname/);
});
