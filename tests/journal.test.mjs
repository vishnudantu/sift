import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { createJournal, journalGenesisHash, readJournal } from "../src/journal.mjs";

const temporaryJournal = () => {
  const directory = mkdtempSync(join(tmpdir(), "sift-journal-"));
  return { directory, filePath: join(directory, "events.ndjson") };
};

test("journal appends replayable hash-linked events", () => {
  const { directory, filePath } = temporaryJournal();
  try {
    const journal = createJournal(filePath);
    const first = journal.append({ type: "artifact-appended", artifactId: "artifact-1" });
    const second = journal.append({ type: "record-reviewed", recordId: "record-1", decision: "approved" });
    assert.equal(first.sequence, 1);
    assert.equal(first.previousHash, journalGenesisHash);
    assert.equal(second.previousHash, first.hash);
    assert.deepEqual(readJournal(filePath), journal.entries());
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("journal rejects tampered entries during replay", () => {
  const { directory, filePath } = temporaryJournal();
  try {
    const journal = createJournal(filePath);
    journal.append({ type: "artifact-appended", artifactId: "artifact-1" });
    const lines = readFileSync(filePath, "utf8").trim().split("\n");
    const entry = JSON.parse(lines[0]);
    entry.payload.artifactId = "tampered";
    writeFileSync(filePath, `${JSON.stringify(entry)}\n`);
    assert.throws(() => readJournal(filePath), /checksum is invalid/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("journal rejects a broken hash chain", () => {
  const { directory, filePath } = temporaryJournal();
  try {
    const journal = createJournal(filePath);
    journal.append({ type: "artifact-appended", artifactId: "artifact-1" });
    journal.append({ type: "record-appended", recordId: "record-1" });
    const lines = readFileSync(filePath, "utf8").trim().split("\n");
    const second = JSON.parse(lines[1]);
    second.previousHash = journalGenesisHash;
    writeFileSync(filePath, `${lines[0]}\n${JSON.stringify(second)}\n`);
    assert.throws(() => readJournal(filePath), /hash chain is broken|checksum is invalid/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

 test("journal starts empty when its file does not exist", () => {
  const { directory, filePath } = temporaryJournal();
  try {
    assert.deepEqual(readJournal(filePath), []);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

 test("journal rejects non-object payloads", () => {
  const { directory, filePath } = temporaryJournal();
  try {
    assert.throws(() => createJournal(filePath).append(null), /payload must be an object/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
