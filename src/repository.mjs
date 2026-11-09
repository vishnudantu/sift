import { appendCorrection, createArtifact, createEvidenceRecord, immutableCopy } from "./evidence.mjs";
import { createJournal } from "./journal.mjs";

const REVIEW_DECISIONS = new Set(["approved", "rejected"]);
const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

const freezeSnapshot = (state) => Object.freeze({
  artifacts: Object.freeze([...state.artifacts.values()]),
  records: Object.freeze([...state.records.values()]),
  events: Object.freeze(state.events)
});

const replayJournal = (journal) => {
  const state = { artifacts: new Map(), records: new Map(), events: [] };
  for (const { payload } of journal.entries()) {
    if (payload.type === "artifact-appended") {
      const artifact = createArtifact(payload.artifact);
      if (state.artifacts.has(artifact.id)) throw new Error(`Duplicate artifact in journal: ${artifact.id}`);
      state.artifacts.set(artifact.id, artifact);
    } else if (payload.type === "record-appended") {
      const artifact = state.artifacts.get(payload.record.artifactId);
      if (!artifact) throw new Error(`Record references missing artifact: ${payload.record.id}`);
      const result = createEvidenceRecord({ ...payload.record, artifact });
      if (state.records.has(result.record.id)) throw new Error(`Duplicate record in journal: ${result.record.id}`);
      state.records.set(result.record.id, result.record);
    } else if (payload.type === "record-reviewed") {
      const record = state.records.get(payload.recordId);
      if (!record || record.status !== "unpublished" || !REVIEW_DECISIONS.has(payload.decision) || !isNonEmptyString(payload.reviewerId)) throw new Error(`Invalid review in journal: ${payload.recordId}`);
      state.records.set(payload.recordId, Object.freeze({
        ...record,
        status: payload.decision === "approved" ? "published" : "rejected",
        verification: immutableCopy({ ...record.verification, decision: payload.decision, reviewerId: payload.reviewerId, note: payload.note || null })
      }));
    } else if (payload.type === "record-corrected") {
      const record = state.records.get(payload.recordId);
      if (!record || record.status !== "published") throw new Error(`Invalid correction in journal: ${payload.recordId}`);
      state.records.set(payload.recordId, appendCorrection(record, payload.correction));
    } else {
      throw new Error(`Unsupported journal event: ${payload.type}`);
    }
    state.events.push(immutableCopy(payload));
  }
  return state;
};

export const createEvidenceRepository = ({ journalPath } = {}) => {
  const journal = journalPath ? createJournal(journalPath) : null;
  let state = journal ? replayJournal(journal) : { artifacts: new Map(), records: new Map(), events: [] };

  const commit = (nextState, event) => {
    journal?.append(event);
    state = {
      artifacts: nextState.artifacts,
      records: nextState.records,
      events: Object.freeze([...state.events, immutableCopy(event)])
    };
  };

  const snapshot = () => freezeSnapshot(state);

  const appendArtifact = (input) => {
    const artifact = createArtifact(input);
    if (state.artifacts.has(artifact.id)) throw new Error(`Artifact already exists: ${artifact.id}`);
    const artifacts = new Map(state.artifacts);
    artifacts.set(artifact.id, artifact);
    commit({ artifacts, records: new Map(state.records) }, { type: "artifact-appended", artifact });
    return artifact;
  };

  const appendRecord = (input) => {
    const result = createEvidenceRecord(input);
    const storedArtifact = state.artifacts.get(result.artifact.id);
    if (!storedArtifact) throw new Error(`Artifact must be appended first: ${result.artifact.id}`);
    if (storedArtifact.sha256 !== result.artifact.sha256) throw new Error("Record artifact does not match the stored artifact");
    if (state.records.has(result.record.id)) throw new Error(`Evidence record already exists: ${result.record.id}`);
    const record = Object.freeze({ ...result.record, artifactId: storedArtifact.id });
    const records = new Map(state.records);
    records.set(record.id, record);
    commit({ artifacts: new Map(state.artifacts), records }, { type: "record-appended", record });
    return record;
  };

  const reviewRecord = (recordId, input) => {
    const record = state.records.get(recordId);
    if (!record) throw new Error(`Evidence record not found: ${recordId}`);
    if (record.status !== "unpublished") throw new Error("Only unpublished records can be reviewed");
    if (!REVIEW_DECISIONS.has(input?.decision)) throw new TypeError("Review decision must be approved or rejected");
    if (!isNonEmptyString(input.reviewerId)) throw new TypeError("Review requires a reviewer");
    const reviewed = Object.freeze({
      ...record,
      status: input.decision === "approved" ? "published" : "rejected",
      verification: immutableCopy({ ...record.verification, decision: input.decision, reviewerId: input.reviewerId, note: input.note || null })
    });
    const records = new Map(state.records);
    records.set(recordId, reviewed);
    commit({ artifacts: new Map(state.artifacts), records }, { type: "record-reviewed", recordId, decision: input.decision, reviewerId: input.reviewerId, note: input.note || null });
    return reviewed;
  };

  const correctRecord = (recordId, correction) => {
    const record = state.records.get(recordId);
    if (!record) throw new Error(`Evidence record not found: ${recordId}`);
    const corrected = appendCorrection(record, correction);
    const records = new Map(state.records);
    records.set(recordId, corrected);
    commit({ artifacts: new Map(state.artifacts), records }, { type: "record-corrected", recordId, correction: immutableCopy(correction) });
    return corrected;
  };

  return Object.freeze({ appendArtifact, appendRecord, reviewRecord, correctRecord, snapshot });
};

export const reviewDecisions = Object.freeze([...REVIEW_DECISIONS]);
export { replayJournal };
