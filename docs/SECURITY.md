# Security baseline

- Bind local development to loopback by default.
- Allow only `GET` and `HEAD` in the public server.
- Serve only the page and explicit public assets. Do not expose package, requirement, or source files.
- Resolve static paths with URL decoding, `path.relative`, and an explicit allowlist.
- Require HTTPS, approved source state, and allowlisted DNS hostnames for ingestion.
- Reject localhost, IP literals, credential-bearing source URLs, and hosts that are not allowlisted.
- Revalidate DNS results and every redirect against public address ranges before enabling network fetches. The current boundary does not fetch sources.
- Never trust source URLs, document contents, user correction requests, or AI output.
- Preserve immutable raw artifacts and checksums; append corrections instead of deleting history.
- Require MFA, RBAC, audit logs, and human publication review for Command operations.
- Add dependency, secret, static-analysis, accessibility, and end-to-end gates before release.
