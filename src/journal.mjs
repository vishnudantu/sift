import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { createHash } from "node:crypto";

const GENESIS_HASH = "0".repeat(64);
const HASH_PATTERN = /^[a-f0-9]{64}$/;

const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const canonicalPayload = (payload) => JSON.stringify(payload);
const digestEntry = ({ sequence, previousHash, payload }) => createHash("sha256")
  .update(`${sequence}\n${previousHash}\n${canonicalPayload(payload)}`, "utf8")
  .digest("hex");

const parseLines = (contents) => contents.split("\n").filter(Boolean).map((line, index, lines) => {
  let entry;
  try {
    entry = JSON.parse(line);
  } catch {
    throw new Error(`Journal contains invalid JSON at line ${index + 1}`);
  }
  if (!isRecord(entry) || !Number.isInteger(entry.sequence) || entry.sequence !== index + 1) {
    throw new Error(`Journal sequence is invalid at line ${index + 1}`);
  }
  if (!HASH_PATTERN.test(entry.previousHash) || !HASH_PATTERN.test(entry.hash) || !isRecord(entry.payload)) {
    throw new Error(`Journal entry is malformed at line ${index + 1}`);
  }
  const expectedPrevious = index === 0 ? GENESIS_HASH : JSON.parse(lines[index - 1]).hash;
  if (entry.previousHash !== expectedPrevious) throw new Error(`Journal hash chain is broken at line ${index + 1}`);
  if (entry.hash !== digestEntry(entry)) throw new Error(`Journal checksum is invalid at line ${index + 1}`);
  return Object.freeze({ sequence: entry.sequence, previousHash: entry.previousHash, hash: entry.hash, payload: Object.freeze(entry.payload) });
});

export const readJournal = (filePath) => {
  if (!existsSync(filePath)) return Object.freeze([]);
  const contents = readFileSync(filePath, "utf8");
  return Object.freeze(contents.length === 0 ? [] : parseLines(contents));
};

export const createJournal = (filePath) => {
  if (typeof filePath !== "string" || filePath.trim().length === 0) throw new TypeError("Journal path is required");
  mkdirSync(dirname(filePath), { recursive: true });
  let entries = [...readJournal(filePath)];
  const append = (payload) => {
    if (!isRecord(payload)) throw new TypeError("Journal payload must be an object");
    const previousHash = entries.at(-1)?.hash || GENESIS_HASH;
    const entry = { sequence: entries.length + 1, previousHash, payload: structuredClone(payload) };
    const complete = { ...entry, hash: digestEntry(entry) };
    appendFileSync(filePath, `${JSON.stringify(complete)}\n`, "utf8");
    entries = [...entries, Object.freeze({ ...complete, payload: Object.freeze(complete.payload) })];
    return entries.at(-1);
  };
  return Object.freeze({ append, entries: () => Object.freeze([...entries]), path: filePath });
};

export const journalGenesisHash = GENESIS_HASH;
