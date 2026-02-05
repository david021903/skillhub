# SkillBook (OpenClaw Skills Registry) — Full Blueprint Repo

This repo is **spec-only**: it contains the database schema (DDL), OpenAPI, webhook payload contracts,
validation runner contracts, publish state machine, search index documents, CLI behavior spec, a skill.md template,
JSON Schemas, and a 100+ rule validation checklist + machine-readable ruleset.

**Goal:** a GitHub-like experience for skills:
- Repos, forks, branches, commits
- PRs with CI validation
- Versions + immutable published artifacts
- Search, ratings, verification, and provenance

## Contents
- `db/` — Postgres schema + migrations
- `api/` — OpenAPI 3.1 spec + examples
- `schemas/` — JSON Schemas for skill manifests, webhook payloads, runner jobs
- `validation/` — 100+ checks list + machine-readable ruleset
- `cli/` — CLI contract (commands, flags, config files, exit codes)
- `publish/` — Publish flow state machine + pipeline step specs
- `search/` — Meilisearch/OpenSearch document schemas
- `infra/` — minimal Terraform layout + docker compose for local dev
- `examples/` — example skill repo content (skill.md, manifest, payload examples)

## Not a working implementation
This is a blueprint for engineers to build from. It’s intentionally explicit.

## License
MIT (for this blueprint).
