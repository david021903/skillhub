import { sql, relations } from "drizzle-orm";
import { pgTable, varchar, text, timestamp, boolean, integer, jsonb, uuid, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
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

export type Skill = typeof skills.$inferSelect;
export type SkillActivity = typeof skillActivities.$inferSelect;
export type InsertSkill = typeof skills.$inferInsert;
export type SkillVersion = typeof skillVersions.$inferSelect;
export type InsertSkillVersion = typeof skillVersions.$inferInsert;
export type SkillValidation = typeof skillValidations.$inferSelect;
export type SkillStar = typeof skillStars.$inferSelect;
