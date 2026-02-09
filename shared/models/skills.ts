import { sql, relations } from "drizzle-orm";
import { pgTable, varchar, text, timestamp, boolean, integer, jsonb, uuid, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  forkedFromId: uuid("forked_from_id"),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  description: text("description"),
  homepage: varchar("homepage"),
  repository: varchar("repository"),
  license: varchar("license", { length: 50 }),
  isPublic: boolean("is_public").default(true),
  isVerified: boolean("is_verified").default(false),
  isArchived: boolean("is_archived").default(false),
  stars: integer("stars").default(0),
  downloads: integer("downloads").default(0),
  forks: integer("forks").default(0),
  weeklyDownloads: integer("weekly_downloads").default(0),
  tags: jsonb("tags").$type<string[]>().default([]),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  dependencies: jsonb("dependencies").$type<{
    skills?: string[];
    bins?: string[];
    env?: string[];
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("skills_owner_slug_idx").on(table.ownerId, table.slug),
  index("skills_name_idx").on(table.name),
  index("skills_forked_from_idx").on(table.forkedFromId),
]);

export const skillVersions = pgTable("skill_versions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  skillId: uuid("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  version: varchar("version", { length: 50 }).notNull(),
  skillMd: text("skill_md").notNull(),
  manifest: jsonb("manifest").$type<Record<string, any>>(),
  readme: text("readme"),
  changelog: text("changelog"),
  fileSize: integer("file_size"),
  sha256: varchar("sha256", { length: 64 }),
  downloads: integer("downloads").default(0),
  isLatest: boolean("is_latest").default(false),
  isYanked: boolean("is_yanked").default(false),
  publishedAt: timestamp("published_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("skill_versions_skill_version_idx").on(table.skillId, table.version),
]);

export const skillFiles = pgTable("skill_files", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  versionId: uuid("version_id").notNull().references(() => skillVersions.id, { onDelete: "cascade" }),
  path: varchar("path", { length: 500 }).notNull(),
  content: text("content"),
  binaryContent: text("binary_content"),
  isBinary: boolean("is_binary").default(false),
  size: integer("size").default(0),
  sha256: varchar("sha256", { length: 64 }),
  mimeType: varchar("mime_type", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("skill_files_version_path_idx").on(table.versionId, table.path),
  index("skill_files_version_idx").on(table.versionId),
]);

export const skillFilesRelations = relations(skillFiles, ({ one }) => ({
  version: one(skillVersions, { fields: [skillFiles.versionId], references: [skillVersions.id] }),
}));

export const skillValidations = pgTable("skill_validations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  versionId: uuid("version_id").notNull().references(() => skillVersions.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  score: integer("score").default(0),
  checks: jsonb("checks").$type<Array<{
    id: string;
    category: string;
    status: "passed" | "failed" | "warning" | "skipped";
    message?: string;
  }>>().default([]),
  logs: text("logs"),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const skillStars = pgTable("skill_stars", {
  skillId: uuid("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("skill_stars_skill_user_idx").on(table.skillId, table.userId),
]);

export const skillsRelations = relations(skills, ({ one, many }) => ({
  owner: one(users, { fields: [skills.ownerId], references: [users.id] }),
  versions: many(skillVersions),
  stars: many(skillStars),
}));

export const skillVersionsRelations = relations(skillVersions, ({ one, many }) => ({
  skill: one(skills, { fields: [skillVersions.skillId], references: [skills.id] }),
  validations: many(skillValidations),
  files: many(skillFiles),
}));

export const skillValidationsRelations = relations(skillValidations, ({ one }) => ({
  version: one(skillVersions, { fields: [skillValidations.versionId], references: [skillVersions.id] }),
}));

export const skillStarsRelations = relations(skillStars, ({ one }) => ({
  skill: one(skills, { fields: [skillStars.skillId], references: [skills.id] }),
  user: one(users, { fields: [skillStars.userId], references: [users.id] }),
}));

export const skillActivities = pgTable("skill_activities", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  skillId: uuid("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 50 }).notNull(),
  details: jsonb("details").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("skill_activities_skill_idx").on(table.skillId),
  index("skill_activities_created_idx").on(table.createdAt),
]);

export const skillActivitiesRelations = relations(skillActivities, ({ one }) => ({
  skill: one(skills, { fields: [skillActivities.skillId], references: [skills.id] }),
  user: one(users, { fields: [skillActivities.userId], references: [users.id] }),
}));

export const skillComments = pgTable("skill_comments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  skillId: uuid("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id"),
  content: text("content").notNull(),
  isEdited: boolean("is_edited").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("skill_comments_skill_idx").on(table.skillId),
  index("skill_comments_parent_idx").on(table.parentId),
]);

export const skillCommentsRelations = relations(skillComments, ({ one }) => ({
  skill: one(skills, { fields: [skillComments.skillId], references: [skills.id] }),
  user: one(users, { fields: [skillComments.userId], references: [users.id] }),
  parent: one(skillComments, { fields: [skillComments.parentId], references: [skillComments.id] }),
}));

// Issues system
export const skillIssues = pgTable("skill_issues", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  skillId: uuid("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  number: integer("number").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  body: text("body"),
  state: varchar("state", { length: 20 }).notNull().default("open"),
  labels: jsonb("labels").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  closedAt: timestamp("closed_at"),
}, (table) => [
  uniqueIndex("skill_issues_skill_number_idx").on(table.skillId, table.number),
  index("skill_issues_skill_idx").on(table.skillId),
  index("skill_issues_author_idx").on(table.authorId),
]);

export const issueComments = pgTable("issue_comments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  issueId: uuid("issue_id").notNull().references(() => skillIssues.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("issue_comments_issue_idx").on(table.issueId),
]);

// Pull requests / Skill suggestions
export const skillPullRequests = pgTable("skill_pull_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  skillId: uuid("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  number: integer("number").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  body: text("body"),
  state: varchar("state", { length: 20 }).notNull().default("open"),
  proposedSkillMd: text("proposed_skill_md").notNull(),
  baseVersion: varchar("base_version", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  mergedAt: timestamp("merged_at"),
  closedAt: timestamp("closed_at"),
}, (table) => [
  uniqueIndex("skill_prs_skill_number_idx").on(table.skillId, table.number),
  index("skill_prs_skill_idx").on(table.skillId),
  index("skill_prs_author_idx").on(table.authorId),
]);

export const prComments = pgTable("pr_comments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  prId: uuid("pr_id").notNull().references(() => skillPullRequests.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("pr_comments_pr_idx").on(table.prId),
]);

export const skillIssuesRelations = relations(skillIssues, ({ one, many }) => ({
  skill: one(skills, { fields: [skillIssues.skillId], references: [skills.id] }),
  author: one(users, { fields: [skillIssues.authorId], references: [users.id] }),
  comments: many(issueComments),
}));

export const issueCommentsRelations = relations(issueComments, ({ one }) => ({
  issue: one(skillIssues, { fields: [issueComments.issueId], references: [skillIssues.id] }),
  author: one(users, { fields: [issueComments.authorId], references: [users.id] }),
}));

export const skillPullRequestsRelations = relations(skillPullRequests, ({ one, many }) => ({
  skill: one(skills, { fields: [skillPullRequests.skillId], references: [skills.id] }),
  author: one(users, { fields: [skillPullRequests.authorId], references: [users.id] }),
  comments: many(prComments),
}));

export const prCommentsRelations = relations(prComments, ({ one }) => ({
  pr: one(skillPullRequests, { fields: [prComments.prId], references: [skillPullRequests.id] }),
  author: one(users, { fields: [prComments.authorId], references: [users.id] }),
}));

export type Skill = typeof skills.$inferSelect;
export type SkillActivity = typeof skillActivities.$inferSelect;
export type SkillComment = typeof skillComments.$inferSelect;
export type InsertSkillComment = typeof skillComments.$inferInsert;
export type InsertSkill = typeof skills.$inferInsert;
export type SkillVersion = typeof skillVersions.$inferSelect;
export type InsertSkillVersion = typeof skillVersions.$inferInsert;
export type SkillValidation = typeof skillValidations.$inferSelect;
export type SkillStar = typeof skillStars.$inferSelect;
export type SkillIssue = typeof skillIssues.$inferSelect;
export type InsertSkillIssue = typeof skillIssues.$inferInsert;
export type SkillPullRequest = typeof skillPullRequests.$inferSelect;
export type InsertSkillPullRequest = typeof skillPullRequests.$inferInsert;
export type IssueComment = typeof issueComments.$inferSelect;
export type PrComment = typeof prComments.$inferSelect;
