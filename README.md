# SIFT India

SIFT is an evidence-led food safety intelligence interface. The public experience deliberately distinguishes missing coverage from safety, and every future published claim must carry authority provenance and an evidence passage.

## Run locally

```sh
npm test
npm run lint
npm start
```

The local server binds to `127.0.0.1:4173` by default. Set `PORT` to override it.

## Current vertical slice

- Server-rendered public landing page with responsive editorial UI.
- Honest empty-state language while no official source connector has been verified.
- Read-only Command preview with explicit source registry status.
- Safe static-file path resolution and read-only HTTP methods.
- Immutable evidence artifact and record validation.
- Permission-aware ingestion boundary with HTTPS and server-side request forgery protections.
- Unit and integration tests for rendering, source transparency, path traversal, HTTP serving, evidence validation, and ingestion policy.

This is not a claim of national coverage or verified inspection records. The source registry currently marks the central and Telangana authorities as `uncertain` until lawful access, terms, and an actual publication workflow are verified.

## Evidence gate

Do not add inspection, enforcement, licence, or safety claims without an archived official source artifact, immutable checksum, exact source passage, publication timestamp, jurisdiction, outlet identity decision, and review decision. Absence of a record must remain an explicit unknown state.

## Security gate

Source collection must use allowlisted official hosts and permitted access methods. Do not bypass authentication, CAPTCHAs, robots, or publisher restrictions. Future document parsing must run in isolated workers with bounded size and retries. Administrative publishing requires MFA, role checks, audit logging, and human review.

## Source feasibility status

The current environment did not verify a reachable official Telangana source endpoint. The candidate Telangana hostname did not resolve, and FSSAI probes returned proxy errors. These observations are not treated as proof that the authorities lack online sources. The registry therefore remains `uncertain`, and no connector host is enabled.
EOF

cat > docs/STATUS.md <<'EOF'
# Delivery status

Updated: 2026-11-09

## Complete

- Requirements and concept package audited.
- billion-context compression path verified operational.
- claude-mem task-state tools verified operational.
- Public responsive vertical slice implemented with server-rendered HTML.
- Safe static-file serving and explicit asset allowlist added.
- Evidence artifact and record validation added.
- Ingestion boundary rejects unpermitted sources, non-HTTPS URLs, private hosts, and non-allowlisted hosts.
- Corrections are append-only and published records are never silently mutated.
- Source feasibility probes were run without enabling a connector.

## Current milestone

Milestone 2: evidence chain foundation complete. The application still has no published official inspection records.

## In progress

- Official Telangana source feasibility review.
- Legal access and host approval for a first connector.
- Durable evidence persistence and authenticated Command review workflow.

## Verification

- `npm test`: 12 passed, 0 failed.
- Node syntax checks passed for all source modules.
- Fresh live smoke previously verified: home 200, CSS 200, package.json 404, encoded traversal 404.
- Candidate `foodsafety.telangana.gov.in` did not resolve in this environment.
- FSSAI HTTPS probes returned proxy errors in this environment.

## Not claimed

No official inspection record, national coverage, source API, or safety outcome is currently published by this build.

## Next step

Obtain and review an official source URL and access terms through an environment with reliable network resolution. Do not enable a connector from search results alone.
EOF

cat > docs/ARCHITECTURE.md <<'EOF'
# Architecture baseline

The current slice is a dependency-free Node.js 22 application. `server.mjs` owns the HTTP boundary and serves a server-rendered page from `src/app.mjs`. Static files are served only from an explicit public asset allowlist after normalized path validation.

`src/data.mjs` is an immutable source and public-state boundary. `src/evidence.mjs` defines the evidence artifact and claim contracts. Artifacts require a source identifier, canonical URL, retrieval and publication timestamps, content type, SHA-256 digest, retained raw text, and a permitted access decision. Claims require an exact passage, source locator, jurisdiction, classification, and reviewer decision, and remain unpublished until a later explicit publication workflow.

`src/ingestion.mjs` is a deliberately incomplete connector boundary. It requires an approved source, HTTPS, an allowlisted public hostname, and a successful response. It rejects local, private, link-local, multicast, and IPv4-mapped private IPv6 hosts. It does not bypass access controls and never publishes automatically. Current sources remain `uncertain`, so no host can be registered in production.

No model provider is wired yet. AI must sit behind a provider-agnostic gateway, receive only registered source content, emit nullable structured fields with source spans, and never publish autonomously.
EOF

cat > docs/SECURITY.md <<'EOF'
# Security baseline

- Bind local development to loopback by default.
- Allow only `GET` and `HEAD` in the public server.
- Serve only the page and explicit public assets. Do not expose package, requirement, or source files.
- Resolve static paths with URL decoding, `path.relative`, and an explicit allowlist.
- Require HTTPS, approved source state, and allowlisted public hosts for ingestion.
- Reject localhost, loopback, link-local, private, multicast, IPv4-mapped private IPv6, and credential-bearing source URLs.
- Never trust source URLs, document contents, user correction requests, or AI output.
- Preserve immutable raw artifacts and checksums; append corrections instead of deleting history.
- Require MFA, RBAC, audit logs, and human publication review for Command operations.
- Add dependency, secret, static-analysis, accessibility, and end-to-end gates before release.
EOF

cat > docs/SOURCE_REGISTRY.md <<'EOF'
# Source registry

This registry intentionally contains no assumed endpoints. `uncertain` means feasibility and lawful access are not yet established.

| Authority | Jurisdiction | Access | Method | Status |
|---|---|---|---|---|
| Food Safety and Standards Authority of India | India | uncertain | Official publication review | No restaurant-level public API assumed |
| Telangana Food Safety Department | Telangana | uncertain | Official notices and publications review | Lawful structured source not verified |

Before activation, record the canonical authority URL, allowed method, terms/robots decision, jurisdiction, fetch schedule, parser version, last successful check, and operator approval. Never treat a search result, social post, or unverified mirror as an official source.

The connector boundary remains disabled until a source row changes to `permitted` through a reviewed, documented decision. No endpoint is inferred from an authority name.
EOF

cat > docs/DECISIONS.md <<'EOF'
# Decisions

## Dependency-free first slice

The initial slice uses Node.js built-ins so the evidence and security boundaries can be tested without an unreviewed dependency tree. A framework can be introduced when the persistence and API contracts are defined.

## No fabricated source data

The source registry stores authorities and unknown access state, not guessed URLs, endpoints, records, or inspection outcomes. This keeps the interface truthful while feasibility work proceeds.

## Server-render the public page

The public page is rendered at `/` so the core statement and coverage state remain visible without client JavaScript. Client JavaScript is limited to progressive search feedback.

## Gate ingestion before persistence

Evidence artifacts cannot be created unless their access decision is `permitted`. Connector URLs require HTTPS and an explicitly allowlisted public hostname. This prevents an attractive parser implementation from becoming an unauthorized collector or server-side request forgery primitive.
EOF

cat > docs/DATA_MODEL.md <<'EOF'
# Evidence data model

## Artifact

An artifact is an immutable capture of source material. It requires an identifier, registered source, canonical URL, retrieval timestamp, optional publication timestamp, supported content type, SHA-256 digest, retained raw text, and a permitted access decision. Metadata is copied into a frozen object.

## Evidence record

A record references one artifact and carries jurisdiction, optional outlet identity, classification, exact passage, source locator, and reviewer decision. New records are always `unpublished` until a separate authenticated publication workflow approves them.

## Correction

A correction references a published record and appends a correction identifier, reason, and reviewer. The original record remains unchanged and its history is retained.
EOF

cat > docs/TEST_PLAN.md <<'EOF'
# Test plan

Current tests cover page rendering, truthful empty-state text, source registry presence, HTML escaping smoke behavior, traversal rejection, server-rendered HTML, static content types, private-file exposure, missing files, method restrictions, artifact field validation, timestamp and digest validation, exact passage and reviewer requirements, append-only corrections, HTTPS enforcement, host allowlisting, private-network rejection, IPv4-mapped IPv6 rejection, and blocked uncertain sources.

Before a release, add source-ingestion contract tests, checksum and replay tests, schema validation, authentication and authorization tests, parser isolation tests, Playwright critical flows, axe accessibility checks, Lighthouse budgets, dependency scanning, secret scanning, and failure simulations.
EOF

cat > docs/DESIGN_SYSTEM.md <<'EOF'
# Design system

Palette: ink `#101B18`, botanical `#203A2F`, parchment `#F6F3E9`, chartreuse `#D3FA79`, terracotta `#DA8A59`.

Typography uses an editorial serif for display and a practical system sans for interface text. Motion is restrained and disabled through `prefers-reduced-motion`. Public states must name uncertainty plainly and avoid pseudo-safety scoring.
EOF

node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync('package.json','utf8')); p.scripts.lint='node --check src/*.mjs && node --check server.mjs'; fs.writeFileSync('package.json', JSON.stringify(p)+'\\n');"

npm test && npm run lint
