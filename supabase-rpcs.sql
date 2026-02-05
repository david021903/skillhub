-- SkillHub — RPC functions for Supabase
-- Run in Supabase Dashboard > SQL Editor after creating the tables (supabase-schema.sql).

-- ============================================================
-- 1. Atomic counter increments
-- ============================================================

CREATE OR REPLACE FUNCTION increment_skill_downloads(p_skill_id uuid)
RETURNS void AS $$
  UPDATE skills
  SET downloads = COALESCE(downloads, 0) + 1,
      weekly_downloads = COALESCE(weekly_downloads, 0) + 1
  WHERE id = p_skill_id;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_version_downloads(p_version_id uuid)
RETURNS void AS $$
  UPDATE skill_versions
  SET downloads = COALESCE(downloads, 0) + 1
  WHERE id = p_version_id;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_skill_stars(p_skill_id uuid)
RETURNS void AS $$
  UPDATE skills
  SET stars = COALESCE(stars, 0) + 1
  WHERE id = p_skill_id;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_skill_stars(p_skill_id uuid)
RETURNS void AS $$
  UPDATE skills
  SET stars = GREATEST(COALESCE(stars, 0) - 1, 0)
  WHERE id = p_skill_id;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_skill_forks(p_skill_id uuid)
RETURNS void AS $$
  UPDATE skills
  SET forks = COALESCE(forks, 0) + 1
  WHERE id = p_skill_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- 2. Total downloads aggregate
-- ============================================================

CREATE OR REPLACE FUNCTION total_skill_downloads()
RETURNS bigint AS $$
  SELECT COALESCE(SUM(downloads), 0) FROM skills;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 3. Skills list with validation score (for browse + trending)
-- ============================================================

CREATE OR REPLACE VIEW skills_with_score AS
SELECT
  s.*,
  u.id          AS owner_user_id,
  u.first_name  AS owner_first_name,
  u.last_name   AS owner_last_name,
  u.handle      AS owner_handle,
  u.profile_image_url AS owner_profile_image_url,
  (
    SELECT sv.score
    FROM skill_validations sv
    JOIN skill_versions svv ON sv.version_id = svv.id
    WHERE svv.skill_id = s.id
    ORDER BY svv.published_at DESC NULLS LAST
    LIMIT 1
  ) AS validation_score
FROM skills s
LEFT JOIN users u ON s.owner_id = u.id;

-- ============================================================
-- 4. Trending sort (weighted score)
-- ============================================================

CREATE OR REPLACE VIEW skills_trending AS
SELECT *,
  (COALESCE(weekly_downloads, 0) * 3 + COALESCE(stars, 0) * 2 + COALESCE(downloads, 0)) AS trending_score
FROM skills_with_score;
