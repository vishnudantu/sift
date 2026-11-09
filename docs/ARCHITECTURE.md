# Architecture baseline

The current slice is a dependency-free Node.js 22 application. `server.mjs` owns the HTTP boundary and serves a server-rendered page from `src/app.mjs`. Static files are served only from an explicit public asset allowlist after normalized path validation.

`src/data.mjs` is an immutable source and public-state boundary. `src/evidence.mjs` defines the evidence artifact and claim contracts. Artifacts require a source identifier, canonical URL, retrieval and publication timestamps, content type, SHA-256 digest, retained raw text, and a permitted access decision. Claims require an exact passage, source locator, jurisdiction, classification, and reviewer decision, and remain unpublished until a later explicit publication workflow.

`src/ingestion.mjs` is a deliberately incomplete connector boundary. It requires an approved source, HTTPS, an allowlisted DNS hostname, and a successful response. It rejects IP literals and local hostnames because DNS resolution and redirect revalidation are not yet part of the connector implementation. Current sources remain `uncertain`, so no host can be registered in production.

No model provider is wired yet. AI must sit behind a provider-agnostic gateway, receive only registered source content, emit nullable structured fields with source spans, and never publish autonomously.
