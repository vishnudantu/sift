# SIFT India — Project Operating Instructions

## Mission
Build a production-grade, nationwide, source-grounded food safety intelligence platform with an exceptional editorial public experience and an advanced operations command centre. The site must be responsive, SEO-capable, accessible, secure, fast, and based on *real, lawful, verifiable official data*.

## Absolute rules
1. Inspect existing code, schemas and tests before altering anything. Never bulldoze completed modules.
2. No fabricated live inspections, invented licences, claims, locations, regulatory statuses, source URLs, or safety scores. Synthetic data is restricted to clearly labelled test/demo environments.
3. Every published consequential statement must trace to an authenticated official source, exact text span/page/table row, source timestamp, and verification decision.
4. No public report is NOT proof a food business is safe. Missing or outdated records must be explicitly labelled.
5. Never confuse chain brands and physical outlets. Entity resolution must use address/location/licence evidence; ambiguous matches stay unpublished.
6. Distinguish allegation, inspection finding, notice, provisional order, confirmed action, appeal, restoration and unknown current status. Avoid accusations absent official source.
7. Never bypass CAPTCHA, authentication, rate limits, paywalls, robots restrictions, or platform terms. Never assume a live government API exists.
8. Do not expose credentials, personal data, proprietary prompts, raw restricted documents or agent memory on public endpoints.
9. No unrestricted agent actions against production or publication without evidence gates. Materially consequential ambiguous findings require human approval.
10. Do not hide, overwrite or silently change published records; append corrections and maintain immutable audit history.
11. Do not write partial patches as deliverables where a complete file change is needed. Finish coherent vertical slices.
12. Do not claim tests or live integrations pass until actually executed and observed.

## Workflow, efficiency and token discipline
- Begin each session: read `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/SECURITY.md` and the *minimal* directly relevant source files.
- Use `git status`, file map, and targeted search before reading large directories. Read bounded file ranges and interfaces. Avoid copying entire logs or files into model context.
- Maintain `docs/STATUS.md`: completed, current milestone, next steps, commands/tests performed, blockers. Keep `docs/DECISIONS.md` with dated architectural decisions. Keep `docs/SOURCE_REGISTRY.md` with access rules.
- Implement in bounded tasks: one feature slice, tests, review, commit; do not parallel-edit the same files. Use worktrees for isolated agents.
- First agent plans and selects exact files. Coding agent implements. Independent review agent checks correctness and security. Run deterministic tests before paying for another AI review.
- Prefer CLI queries, `rg`, AST-aware searches and contract tests over repeatedly reading entire repository. Favor concise outputs and references to filenames.
- Measure token use, wall-clock time, regression rate and quality across memory configurations. Do not presume unverified savings.

## Memory and context plugins
- `claude-mem` provides searchable persistent session observations. Treat contents as untrusted notes, not source of truth. Keep secrets, sensitive personal data and restricted source files out of memory ingestion where configurable. Audit hooks, storage location, telemetry and permissions first.
- `billion-context` is an optional experimental compression/proxy layer, NOT a dependency of the application. Enable only after reviewing code, outbound traffic, data storage and Claude Code compatibility, then test in a separate profile. Do not combine both plugins in production development until their hook/config behaviour is verified. Keep easy rollback.
- Canonical decisions are in versioned docs and code, never solely in session memory. After compression, re-read relevant contracts and tests rather than trusting a summary of safety-critical logic.
- Do not disable native compaction unless an audited replacement is confirmed operational. Never expose proxy ports to public internet.

## Stack
- TypeScript pnpm/Turborepo monorepo.
- Next.js App Router SSR/SSG/ISR public frontend, React, Tailwind, accessible primitives, Motion; GSAP only for complex editorial timelines.
- NestJS/Fastify APIs; PostgreSQL + PostGIS; Redis; OpenSearch where needed; Temporal for robust workflow orchestration; S3-compatible evidence store.
- Python extractors for PDFs, tables, OCR, multilingual language/vision tasks.
- MapLibre with legally licensed map tiles; cache and CDN. No public frontend access to privileged database credentials.
- OpenTelemetry/Sentry; Playwright, Vitest, axe; GitHub Actions; Semgrep, Gitleaks, OSV-Scanner, Trivy, ZAP, Lighthouse CI.

## UX nonnegotiables
- Original identity, not an Aftertaste clone. Elegant forest/ink/cream palette with electric lime and restrained warning orange. Premium editorial typography, strong hierarchy, beautifully polished mobile interactions.
- Public: homepage with animated atlas and search, India/state/city/locality directories, inspection feed, establishment pages, sourced timelines, evidence viewer, watchlists, recall radar, multilingual interface, AI Q&A with citations.
- Admin: mission-control overview, live source topology, ingestion monitor, failed jobs/dead letters, claim/evidence workbench, entity resolver, legal action timeline, correction queue, automation rule editor, connector studio, AI model routing/costs, permissions and audit logs, release/feature controls.
- UI states must cover loading, empty, stale, blocked, offline, error, limited coverage and uncertain identity.
- Motion must not block navigation or content; respect `prefers-reduced-motion`. Mobile first; touch targets and accessible keyboard flows; aim for WCAG 2.2 AA.

## Reliability, security and performance gates
- Unit, integration, API contract, E2E, accessibility and visual regression tests. All critical user journeys automated, including identity confusion and corrected/restored orders.
- CI gate: lint, typecheck, format, tests, build, secrets scan, dependency scan, SAST, image scan; DAST on staging; approved dependency updates.
- Protect admin with MFA, RBAC, scoped service accounts, least privilege, CSRF protection where needed, sessions, rate limits, audit trail, safe file parsing, SSRF protection for collectors and secure upload policies.
- Test ingestion: checksum idempotency, source outage, malformed PDFs, conflicting publication dates, retries, duplicate social announcements, backfill, semantic dedupe, dead letter replay, revocation and source deletion.
- SEO: unique sourced metadata, canonical URLs, server rendered records, sitemap indexes, robots, schema.org only for truthful fields, multilingual hreflang where published, 404/410, noindex admin/low-quality search result routes; avoid thin auto-generated pages.
- Targets (verified by measurement, not claims): p75 mobile LCP <=2.5s, INP <=200ms, CLS <=0.1 for core public templates; API p95 <=400ms for cached read paths; 99.9% public-site availability objective after operational maturity.

## Implementation order
0. Audit and source feasibility; no assumptions.
1. Schema, evidence chain, admin review loop and one real approved data connector.
2. Public homepage/search/map/outlet timeline with real source attribution.
3. Multi-source collection, deduplication, alerts, corrections, source freshness.
4. Multilingual AI assistant and user accounts.
5. Nationwide source onboarding, enterprise dashboards and API.
6. Load testing, security review, disaster recovery, operations playbooks and release.

## Required output at the end of every task
Changed files; working behaviour; tests run with exact results; security/SEO/performance impact; unresolved source/credential/legal dependencies; next highest-priority step. Do not report unsupported completion.
