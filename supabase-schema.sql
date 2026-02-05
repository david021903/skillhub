-- SkillHub — Full schema for Supabase
-- Run in Supabase Dashboard > SQL Editor, or via psql against the Supabase connection string.
-- Tables are ordered by dependency so foreign keys resolve correctly.

-- ============================================================
-- 1. Sessions + Users + Auth
-- ============================================================

CREATE TABLE sessions (
  sid       VARCHAR PRIMARY KEY,
  sess      JSONB NOT NULL,
  expire    TIMESTAMP NOT NULL
);
CREATE INDEX idx_session_expire ON sessions (expire);

CREATE TABLE users (
  id                VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email             VARCHAR UNIQUE,
  password_hash     VARCHAR,
  email_verified    BOOLEAN DEFAULT false,
  first_name        VARCHAR,
  last_name         VARCHAR,
  profile_image_url VARCHAR,
  handle            VARCHAR UNIQUE,
  bio               VARCHAR,
  openai_api_key    TEXT,
  is_admin          BOOLEAN DEFAULT false,
  created_at        TIMESTAMP DEFAULT now(),
  updated_at        TIMESTAMP DEFAULT now()
);

CREATE TABLE auth_identities (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider         VARCHAR(50) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  provider_data    JSONB,
  created_at       TIMESTAMP DEFAULT now()
);
CREATE INDEX auth_identities_user_idx     ON auth_identities (user_id);
CREATE INDEX auth_identities_provider_idx ON auth_identities (provider, provider_user_id);

CREATE TABLE password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at    TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX password_reset_tokens_user_idx  ON password_reset_tokens (user_id);
CREATE INDEX password_reset_tokens_token_idx ON password_reset_tokens (token);

CREATE TABLE email_verification_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at    TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX email_verification_tokens_user_idx ON email_verification_tokens (user_id);

CREATE TABLE api_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         VARCHAR(100) NOT NULL,
  token        VARCHAR(255) NOT NULL UNIQUE,
  scopes       JSONB DEFAULT '["read","write"]'::jsonb,
  last_used_at TIMESTAMP,
  expires_at   TIMESTAMP,
  is_revoked   BOOLEAN DEFAULT false,
  created_at   TIMESTAMP DEFAULT now()
);
CREATE INDEX api_tokens_user_idx  ON api_tokens (user_id);
CREATE INDEX api_tokens_token_idx ON api_tokens (token);

-- ============================================================
-- 2. Skills core
-- ============================================================

CREATE TABLE skills (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         VARCHAR NOT NULL REFERENCES users(id),
  forked_from_id   UUID,
  name             VARCHAR(100) NOT NULL,
  slug             VARCHAR(100) NOT NULL,
  description      TEXT,
  homepage         VARCHAR,
  repository       VARCHAR,
  license          VARCHAR(50),
  is_public        BOOLEAN DEFAULT true,
  is_verified      BOOLEAN DEFAULT false,
  is_archived      BOOLEAN DEFAULT false,
  stars            INTEGER DEFAULT 0,
  downloads        INTEGER DEFAULT 0,
  forks            INTEGER DEFAULT 0,
  weekly_downloads INTEGER DEFAULT 0,
  tags             JSONB DEFAULT '[]'::jsonb,
  metadata         JSONB,
  dependencies     JSONB,
  created_at       TIMESTAMP DEFAULT now(),
  updated_at       TIMESTAMP DEFAULT now()
);
CREATE UNIQUE INDEX skills_owner_slug_idx ON skills (owner_id, slug);
CREATE INDEX skills_name_idx             ON skills (name);
CREATE INDEX skills_forked_from_idx      ON skills (forked_from_id);

CREATE TABLE skill_versions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id     UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  version      VARCHAR(50) NOT NULL,
  skill_md     TEXT NOT NULL,
  manifest     JSONB,
  readme       TEXT,
  changelog    TEXT,
  file_size    INTEGER,
  sha256       VARCHAR(64),
  downloads    INTEGER DEFAULT 0,
  is_latest    BOOLEAN DEFAULT false,
  is_yanked    BOOLEAN DEFAULT false,
  published_at TIMESTAMP DEFAULT now(),
  created_at   TIMESTAMP DEFAULT now()
);
CREATE UNIQUE INDEX skill_versions_skill_version_idx ON skill_versions (skill_id, version);

CREATE TABLE skill_files (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id     UUID NOT NULL REFERENCES skill_versions(id) ON DELETE CASCADE,
  path           VARCHAR(500) NOT NULL,
  content        TEXT,
  binary_content TEXT,
  is_binary      BOOLEAN DEFAULT false,
  size           INTEGER DEFAULT 0,
  sha256         VARCHAR(64),
  mime_type      VARCHAR(100),
  created_at     TIMESTAMP DEFAULT now()
);
CREATE UNIQUE INDEX skill_files_version_path_idx ON skill_files (version_id, path);
CREATE INDEX skill_files_version_idx             ON skill_files (version_id);

CREATE TABLE skill_validations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id  UUID NOT NULL REFERENCES skill_versions(id) ON DELETE CASCADE,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending',
  score       INTEGER DEFAULT 0,
  checks      JSONB DEFAULT '[]'::jsonb,
  logs        TEXT,
  started_at  TIMESTAMP,
  finished_at TIMESTAMP,
  created_at  TIMESTAMP DEFAULT now()
);

CREATE TABLE skill_stars (
  skill_id   UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  user_id    VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now()
);
CREATE UNIQUE INDEX skill_stars_skill_user_idx ON skill_stars (skill_id, user_id);

-- ============================================================
-- 3. Activity, comments, issues, pull requests
-- ============================================================

CREATE TABLE skill_activities (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id   UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  user_id    VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  action     VARCHAR(50) NOT NULL,
  details    JSONB,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX skill_activities_skill_idx   ON skill_activities (skill_id);
CREATE INDEX skill_activities_created_idx ON skill_activities (created_at);

CREATE TABLE skill_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id   UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  user_id    VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id  UUID,
  content    TEXT NOT NULL,
  is_edited  BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX skill_comments_skill_idx  ON skill_comments (skill_id);
CREATE INDEX skill_comments_parent_idx ON skill_comments (parent_id);

CREATE TABLE skill_issues (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id   UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  author_id  VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  number     INTEGER NOT NULL,
  title      VARCHAR(256) NOT NULL,
  body       TEXT,
  state      VARCHAR(20) NOT NULL DEFAULT 'open',
  labels     JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  closed_at  TIMESTAMP
);
CREATE UNIQUE INDEX skill_issues_skill_number_idx ON skill_issues (skill_id, number);
CREATE INDEX skill_issues_skill_idx               ON skill_issues (skill_id);
CREATE INDEX skill_issues_author_idx              ON skill_issues (author_id);

CREATE TABLE issue_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id   UUID NOT NULL REFERENCES skill_issues(id) ON DELETE CASCADE,
  author_id  VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX issue_comments_issue_idx ON issue_comments (issue_id);

CREATE TABLE skill_pull_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id          UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  author_id         VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  number            INTEGER NOT NULL,
  title             VARCHAR(256) NOT NULL,
  body              TEXT,
  state             VARCHAR(20) NOT NULL DEFAULT 'open',
  proposed_skill_md TEXT NOT NULL,
  base_version      VARCHAR(50),
  created_at        TIMESTAMP DEFAULT now(),
  updated_at        TIMESTAMP DEFAULT now(),
  merged_at         TIMESTAMP,
  closed_at         TIMESTAMP
);
CREATE UNIQUE INDEX skill_prs_skill_number_idx ON skill_pull_requests (skill_id, number);
CREATE INDEX skill_prs_skill_idx               ON skill_pull_requests (skill_id);
CREATE INDEX skill_prs_author_idx              ON skill_pull_requests (author_id);

CREATE TABLE pr_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_id      UUID NOT NULL REFERENCES skill_pull_requests(id) ON DELETE CASCADE,
  author_id  VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX pr_comments_pr_idx ON pr_comments (pr_id);

-- ============================================================
-- 4. Chat / conversations
-- ============================================================

CREATE TABLE conversations (
  id         SERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
  id              SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,
  content         TEXT NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
