# Architecture baseline

The current slice is a dependency-free Node.js 22 application. `server.mjs` owns the HTTP boundary and serves a server-rendered page from `src/app.mjs`. Static files are served only from an explicit public asset allowlist after normalized path validation.

`src/data.mjs` is an immutable source and public-state boundary. `src/evidence.mjs` defines evidence artifact and claim contracts. Artifacts require a source identifier, canonical URL, retrieval and publication timestamps, content type, SHA-256 digest, retained raw text, and a permitted access decision. Claims require an exact passage, source locator, jurisdiction, classification, and reviewer decision, and remain unpublished until an explicit publication workflow.

`src/journal.mjs` provides an append-only newline-delimited event journal. Each event includes a sequence, previous hash, payload, and SHA-256 checksum. Startup replay fails closed when sequence, payload, checksum, or hash-chain validation fails. `src/repository.mjs` can persist and replay artifact, record, review, and correction events when given a journal path.

`src/ingestion.mjs` is a deliberately incomplete connector boundary. It requires an approved source, HTTPS, an allowlisted DNS hostname, and a successful response. Current sources remain `uncertain`, so no host can be registered in production.

No model provider is wired yet. AI must sit behind a provider-agnostic gateway, receive only registered source content, emit nullable structured fields with source spans, and never publish autonomously.

## Production gaps

The journal is not yet a production persistence layer. It lacks multi-process locking, encryption at rest, remote backup, disaster recovery automation, and authenticated administration. Those controls remain release gates before publication.

The public server does not open the journal or expose repository mutation routes. A future authenticated Command service must own journal writes behind MFA, role checks, audit logging, request validation, and rate limits.

No source hostname, record, safety status, or model output may be inferred from authority names, search results, or absent coverage. A connector remains disabled until its authority URL, terms, access method, host allowlist, and operator approval are documented.
