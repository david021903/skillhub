export interface Skill {
  id: string;
  owner_id: string;
  forked_from_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  homepage: string | null;
  repository: string | null;
  license: string | null;
  is_public: boolean;
  is_verified: boolean;
  is_archived: boolean;
  stars: number;
  downloads: number;
  forks: number;
  weekly_downloads: number;
  tags: string[];
  metadata: Record<string, any> | null;
  dependencies: { skills?: string[]; bins?: string[]; env?: string[] } | null;
  created_at: string;
  updated_at: string;
}

export type InsertSkill = Omit<Skill, "id" | "created_at" | "updated_at" | "stars" | "downloads" | "forks" | "weekly_downloads" | "is_public" | "is_verified" | "is_archived"> & {
  id?: string;
  is_public?: boolean;
};

export interface SkillVersion {
  id: string;
  skill_id: string;
  version: string;
  skill_md: string;
  manifest: Record<string, any> | null;
  readme: string | null;
  changelog: string | null;
  file_size: number | null;
  sha256: string | null;
  downloads: number;
  is_latest: boolean;
  is_yanked: boolean;
  published_at: string;
  created_at: string;
}

export type InsertSkillVersion = Omit<SkillVersion, "id" | "created_at" | "downloads" | "is_latest" | "is_yanked"> & {
  id?: string;
};

export interface SkillValidation {
  id: string;
  version_id: string;
  status: string;
  score: number;
  checks: Array<{
    id: string;
    category: string;
    status: "passed" | "failed" | "warning" | "skipped";
    message?: string;
  }>;
  logs: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface SkillStar {
  skill_id: string;
  user_id: string;
  created_at: string;
}

export interface SkillActivity {
  id: string;
  skill_id: string;
  user_id: string | null;
  action: string;
  details: Record<string, any> | null;
  created_at: string;
}

export interface SkillComment {
  id: string;
  skill_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export type InsertSkillComment = Omit<SkillComment, "id" | "created_at" | "updated_at" | "is_edited"> & {
  id?: string;
};

export interface SkillIssue {
  id: string;
  skill_id: string;
  author_id: string;
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: string[];
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export type InsertSkillIssue = Omit<SkillIssue, "id" | "created_at" | "updated_at" | "closed_at"> & {
  id?: string;
};

export interface IssueComment {
  id: string;
  issue_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface SkillPullRequest {
  id: string;
  skill_id: string;
  author_id: string;
  number: number;
  title: string;
  body: string | null;
  state: string;
  proposed_skill_md: string;
  base_version: string | null;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  closed_at: string | null;
}

export type InsertSkillPullRequest = Omit<SkillPullRequest, "id" | "created_at" | "updated_at" | "merged_at" | "closed_at"> & {
  id?: string;
};

export interface PrComment {
  id: string;
  pr_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}
