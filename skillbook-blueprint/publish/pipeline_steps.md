# Publish Pipeline Step Specs

1) Load source tree (commit)
2) Run validation in publish mode (must pass all error checks)
3) Compute manifest hash (normalized JSON)
4) Deterministic tarball build (sorted paths + fixed mtimes)
5) Compute sha256 + size
6) Upload to S3: packages/{owner}/{repo}/{version}/{sha}.tgz
7) Optional signing (cosign/sigstore)
8) Index (Meilisearch/OpenSearch)
9) Finalize -> published + webhook publish event

Failure -> rejected (retain logs; artifact not visible)
