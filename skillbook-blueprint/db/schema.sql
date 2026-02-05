-- SkillBook Postgres schema (blueprint)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle TEXT UNIQUE NOT NULL CHECK (char_length(handle) BETWEEN 2 AND 39),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL CHECK (char_length(slug) BETWEEN 2 AND 50),
  name TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS org_members (
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner','maintainer','member','viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

CREATE TABLE IF NOT EXISTS repos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('user','org')),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  description TEXT,
  default_branch TEXT NOT NULL DEFAULT 'main',
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  license TEXT,
  topics TEXT[] NOT NULL DEFAULT '{}',
  stars_count BIGINT NOT NULL DEFAULT 0,
  forks_count BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_type, owner_id, name)
);

CREATE INDEX IF NOT EXISTS idx_repos_topics ON repos USING GIN (topics);

CREATE TABLE IF NOT EXISTS repo_forks (
  repo_id UUID REFERENCES repos(id) ON DELETE CASCADE,
  forked_from_repo_id UUID REFERENCES repos(id) ON DELETE SET NULL,
  forked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (repo_id)
);

CREATE TABLE IF NOT EXISTS repo_branches (
  repo_id UUID REFERENCES repos(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  head_commit_sha TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (repo_id, name)
);

CREATE TABLE IF NOT EXISTS repo_commits (
  sha TEXT PRIMARY KEY,
  repo_id UUID NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
  parent_sha TEXT REFERENCES repo_commits(sha),
  author_user_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  tree_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commits_repo_created ON repo_commits(repo_id, created_at DESC);

CREATE TABLE IF NOT EXISTS repo_blobs (
  hash TEXT PRIMARY KEY,
  size_bytes BIGINT NOT NULL,
  content_type TEXT,
  storage TEXT NOT NULL CHECK (storage IN ('db','s3')),
  s3_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS repo_trees (
  tree_hash TEXT PRIMARY KEY,
  repo_id UUID NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
  entries JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pull_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
  number BIGSERIAL,
  title TEXT NOT NULL,
  body TEXT,
  author_user_id UUID REFERENCES users(id),
  base_branch TEXT NOT NULL,
  head_repo_id UUID NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
  head_branch TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('open','closed','merged')),
  merged_commit_sha TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pr_repo_number ON pull_requests(repo_id, number);

CREATE TABLE IF NOT EXISTS pr_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_id UUID NOT NULL REFERENCES pull_requests(id) ON DELETE CASCADE,
  reviewer_user_id UUID REFERENCES users(id),
  state TEXT NOT NULL CHECK (state IN ('approved','changes_requested','commented')),
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS validation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
  pr_id UUID REFERENCES pull_requests(id) ON DELETE CASCADE,
  commit_sha TEXT REFERENCES repo_commits(sha),
  trigger TEXT NOT NULL CHECK (trigger IN ('push','pull_request','manual','publish')),
  status TEXT NOT NULL CHECK (status IN ('queued','running','passed','failed','canceled')),
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS validation_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES validation_runs(id) ON DELETE CASCADE,
  check_id TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('passed','failed','skipped','warning')),
  message TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS published_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  commit_sha TEXT NOT NULL REFERENCES repo_commits(sha),
  manifest_hash TEXT NOT NULL,
  tarball_s3_key TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  sha256 TEXT NOT NULL,
  signature JSONB,
  publisher_user_id UUID REFERENCES users(id),
  state TEXT NOT NULL CHECK (state IN ('draft','validating','publishing','published','rejected','yanked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  UNIQUE (repo_id, version)
);

CREATE TABLE IF NOT EXISTS package_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES published_packages(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS repo_stars (
  repo_id UUID REFERENCES repos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (repo_id, user_id)
);

CREATE TABLE IF NOT EXISTS repo_ratings (
  repo_id UUID REFERENCES repos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (repo_id, user_id)
);

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('user','org','repo')),
  owner_id UUID NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued','sent','failed')),
  http_status INT,
  error TEXT,
  attempt_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);
