# SIFT India — Claude Code toolchain and safety setup

## Verified project links (review installation instructions and releases before deploying)
- claude-mem: https://github.com/thedotmack/claude-mem
- billion-context: https://github.com/ranxianglei/billion-context
- Playwright: https://github.com/microsoft/playwright
- axe-core: https://github.com/dequelabs/axe-core
- Semgrep: https://github.com/semgrep/semgrep
- Gitleaks: https://github.com/gitleaks/gitleaks
- Trivy: https://github.com/aquasecurity/trivy
- OSV-Scanner: https://github.com/google/osv-scanner
- OWASP ZAP: https://github.com/zaproxy/zaproxy
- Lighthouse CI: https://github.com/GoogleChrome/lighthouse-ci
- Renovate: https://github.com/renovatebot/renovate
- GitHub CodeQL: https://github.com/github/codeql

## Windows 11 using PowerShell / Claude Code
Install a supported Node.js LTS, Git, pnpm and Docker Desktop first. Use a dedicated project directory, e.g. `C:\projects\sift-india`. Check existing versions and configuration before installing plugins.

Inside Claude Code, the claude-mem repository documents:
```
/plugin marketplace add thedotmack/claude-mem
/plugin install claude-mem
```
Restart Claude Code and verify the plugin operates in a non-sensitive test project. Review its hooks, local storage, potential remote services and retention settings first.

The billion-context repository documents Claude Code plugin mode:
```
/plugin marketplace add ranxianglei/billion-context
/plugin install billion-context@billion-context
/billion-context:bili-setup
```
Alternatively the project documents `npm install -g billion-context` followed by its CLI integration. **Do not enable yet**: run a separated pilot after reviewing `ANTHROPIC_BASE_URL`, API key handling, local proxy binding, logging, possible conflicts with native compaction and claude-mem, and rollback. The repository warns against exposing unauthenticated proxy endpoints to untrusted networks. The advertised fivefold token reduction is an author claim, not a guaranteed result.

## Controlled rollout of agent plugins
1. Establish baseline Claude Code with no new plugins. Measure tokens, response quality, completion success, compaction failures and tests on 3 representative tasks.
2. Enable claude-mem only; repeat the tasks and inspect stored metadata for secrets and unintended collection.
3. Add billion-context in a **separate profile**, repeat tasks and verify the requests really pass through the proxy, with no context regressions.
4. Test combined mode on non-sensitive work only after verifying both hooks, startup, crash recovery, and no duplicate memory injection or context conflicts.
5. Maintain a one-command rollback and never let a third-party proxy expose a publicly accessible management port.

## Automated quality gates
- Every PR: format, lint, typecheck, unit tests, integration tests, critical Playwright flows, Semgrep, Gitleaks, OSV and dependency review.
- Preview deployment: axe scans, visual snapshots, Lighthouse CI, metadata/robots checks and API contract tests.
- Nightly: full browser matrix, crawl-and-index tests, ingestion replay/chaos fixtures, database backup restore sampling and Trivy scan.
- Weekly / before major release: ZAP against **authorised staging only**, dependency review, threat model revalidation, backup restore drill and privileged access review.
- Release blocked by critical/high exploitable findings or broken record accuracy tests; exceptions need named approval with written mitigation and deadline.

## Mandatory privacy and supply-chain rules
- Do not automatically install tools solely because they appear in a recommendation list. Validate maintainer, license, last release, hooks, CI scripts, binary signatures/checksums where available.
- Pin exact dependency and GitHub Action commit SHA; require branch protections and code reviews.
- Never send government restricted documents, confidential business records or secrets into third-party model memory without explicit policy approval.
- Keep official-source crawling polite, permitted, instrumented, and bounded. Do not bypass access controls.
- The product must function without either claude-mem or billion-context; both are developer productivity tools, not runtime requirements.

## Definition of robust
Reliability is measured, not declared. Require automated tests for absence of duplicate events, cross-branch attribution, stale source status, change/retraction propagation, permission boundaries, SSRF defence, caching consistency, alert idempotency, recovery after job crashes, and backup restoration. Core Web Vitals and uptime should be monitored in production, not only assessed locally.
