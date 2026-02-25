import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db.js";
import {
  skills, skillVersions, skillStars, skillActivities, skillComments,
  skillIssues, issueComments, skillPullRequests, prComments, users, skillFiles
} from "../shared/schema.js";
import { eq, desc, and, sql, count, gte, inArray } from "drizzle-orm";
import { isAuthenticated } from "./auth.js";

async function isAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  (req as any).adminUser = user;
  next();
}

export function registerAdminRoutes(app: Express) {

  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [totalUsers] = await db.select({ count: count() }).from(users);
      const [todaySignups] = await db.select({ count: count() }).from(users).where(gte(users.createdAt, todayStart));
      const [weekSkills] = await db.select({ count: count() }).from(skills).where(gte(skills.createdAt, weekAgo));
      const [totalSkills] = await db.select({ count: count() }).from(skills);
      const [totalComments] = await db.select({ count: count() }).from(skillComments);
      const [totalIssues] = await db.select({ count: count() }).from(skillIssues);
      const [totalPRs] = await db.select({ count: count() }).from(skillPullRequests);
      const [todayComments] = await db.select({ count: count() }).from(skillComments).where(gte(skillComments.createdAt, todayStart));

      res.json({
        totalUsers: totalUsers.count,
        todaySignups: todaySignups.count,
        totalSkills: totalSkills.count,
        newSkillsThisWeek: weekSkills.count,
        totalComments: totalComments.count,
        todayComments: todayComments.count,
        totalIssues: totalIssues.count,
        totalPRs: totalPRs.count,
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/activity", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const { type, limit: limitStr = "50", offset: offsetStr = "0" } = req.query;
      const limitNum = Math.min(parseInt(limitStr as string) || 50, 100);
      const offsetNum = parseInt(offsetStr as string) || 0;

      const events: any[] = [];

      const shouldInclude = (t: string) => !type || type === "all" || type === t;

      if (shouldInclude("comments")) {
        const comments = await db.select({
          id: skillComments.id,
          content: skillComments.content,
          createdAt: skillComments.createdAt,
          userId: skillComments.userId,
          skillId: skillComments.skillId,
          userName: users.handle,
          userEmail: users.email,
          skillName: skills.name,
          skillSlug: skills.slug,
          ownerHandle: sql<string>`(SELECT handle FROM users WHERE id = ${skills.ownerId})`,
        })
        .from(skillComments)
        .leftJoin(users, eq(skillComments.userId, users.id))
        .leftJoin(skills, eq(skillComments.skillId, skills.id))
        .orderBy(desc(skillComments.createdAt))
        .limit(limitNum);

        events.push(...comments.map(c => ({
          type: "comment",
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          userId: c.userId,
          userName: c.userName || c.userEmail?.split("@")[0],
          skillId: c.skillId,
          skillName: c.skillName,
          skillSlug: c.skillSlug,
          ownerHandle: c.ownerHandle,
          link: `/skills/${c.ownerHandle}/${c.skillSlug}`,
        })));
      }

      if (shouldInclude("skills")) {
        const newSkills = await db.select({
          id: skills.id,
          name: skills.name,
          slug: skills.slug,
          description: skills.description,
          isPublic: skills.isPublic,
          createdAt: skills.createdAt,
          ownerId: skills.ownerId,
          ownerHandle: users.handle,
          ownerEmail: users.email,
        })
        .from(skills)
        .leftJoin(users, eq(skills.ownerId, users.id))
        .orderBy(desc(skills.createdAt))
        .limit(limitNum);

        events.push(...newSkills.map(s => ({
          type: "skill",
          id: s.id,
          content: s.description || s.name,
          createdAt: s.createdAt,
          userId: s.ownerId,
          userName: s.ownerHandle || s.ownerEmail?.split("@")[0],
          skillId: s.id,
          skillName: s.name,
          skillSlug: s.slug,
          ownerHandle: s.ownerHandle,
          isPublic: s.isPublic,
          link: `/skills/${s.ownerHandle}/${s.slug}`,
        })));
      }

      if (shouldInclude("users")) {
        const newUsers = await db.select({
          id: users.id,
          handle: users.handle,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limitNum);

        events.push(...newUsers.map(u => ({
          type: "user",
          id: u.id,
          content: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
          createdAt: u.createdAt,
          userId: u.id,
          userName: u.handle || u.email?.split("@")[0],
          link: `/users/${u.handle || u.id}`,
        })));
      }

      if (shouldInclude("stars")) {
        const stars = await db.select({
          skillId: skillStars.skillId,
          userId: skillStars.userId,
          createdAt: skillStars.createdAt,
          userName: users.handle,
          userEmail: users.email,
          skillName: skills.name,
          skillSlug: skills.slug,
          ownerHandle: sql<string>`(SELECT handle FROM users WHERE id = ${skills.ownerId})`,
        })
        .from(skillStars)
        .leftJoin(users, eq(skillStars.userId, users.id))
        .leftJoin(skills, eq(skillStars.skillId, skills.id))
        .orderBy(desc(skillStars.createdAt))
        .limit(limitNum);

        events.push(...stars.map(s => ({
          type: "star",
          id: `${s.skillId}-${s.userId}`,
          content: `Starred ${s.skillName}`,
          createdAt: s.createdAt,
          userId: s.userId,
          userName: s.userName || s.userEmail?.split("@")[0],
          skillId: s.skillId,
          skillName: s.skillName,
          skillSlug: s.skillSlug,
          ownerHandle: s.ownerHandle,
          link: `/skills/${s.ownerHandle}/${s.skillSlug}`,
        })));
      }

      if (shouldInclude("issues")) {
        const issues = await db.select({
          id: skillIssues.id,
          title: skillIssues.title,
          state: skillIssues.state,
          number: skillIssues.number,
          createdAt: skillIssues.createdAt,
          authorId: skillIssues.authorId,
          skillId: skillIssues.skillId,
          userName: users.handle,
          userEmail: users.email,
          skillName: skills.name,
          skillSlug: skills.slug,
          ownerHandle: sql<string>`(SELECT handle FROM users WHERE id = ${skills.ownerId})`,
        })
        .from(skillIssues)
        .leftJoin(users, eq(skillIssues.authorId, users.id))
        .leftJoin(skills, eq(skillIssues.skillId, skills.id))
        .orderBy(desc(skillIssues.createdAt))
        .limit(limitNum);

        events.push(...issues.map(i => ({
          type: "issue",
          id: i.id,
          content: i.title,
          createdAt: i.createdAt,
          userId: i.authorId,
          userName: i.userName || i.userEmail?.split("@")[0],
          skillId: i.skillId,
          skillName: i.skillName,
          skillSlug: i.skillSlug,
          ownerHandle: i.ownerHandle,
          state: i.state,
          number: i.number,
          link: `/skills/${i.ownerHandle}/${i.skillSlug}`,
        })));
      }

      if (shouldInclude("prs")) {
        const prs = await db.select({
          id: skillPullRequests.id,
          title: skillPullRequests.title,
          state: skillPullRequests.state,
          number: skillPullRequests.number,
          createdAt: skillPullRequests.createdAt,
          authorId: skillPullRequests.authorId,
          skillId: skillPullRequests.skillId,
          userName: users.handle,
          userEmail: users.email,
          skillName: skills.name,
          skillSlug: skills.slug,
          ownerHandle: sql<string>`(SELECT handle FROM users WHERE id = ${skills.ownerId})`,
        })
        .from(skillPullRequests)
        .leftJoin(users, eq(skillPullRequests.authorId, users.id))
        .leftJoin(skills, eq(skillPullRequests.skillId, skills.id))
        .orderBy(desc(skillPullRequests.createdAt))
        .limit(limitNum);

        events.push(...prs.map(p => ({
          type: "pr",
          id: p.id,
          content: p.title,
          createdAt: p.createdAt,
          userId: p.authorId,
          userName: p.userName || p.userEmail?.split("@")[0],
          skillId: p.skillId,
          skillName: p.skillName,
          skillSlug: p.skillSlug,
          ownerHandle: p.ownerHandle,
          state: p.state,
          number: p.number,
          link: `/skills/${p.ownerHandle}/${p.skillSlug}`,
        })));
      }

      events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json(events.slice(offsetNum, offsetNum + limitNum));
    } catch (error) {
      console.error("Admin activity error:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  app.get("/api/admin/users/:userId", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) return res.status(404).json({ message: "User not found" });

      const userSkills = await db.select({
        id: skills.id, name: skills.name, slug: skills.slug, isPublic: skills.isPublic,
        stars: skills.stars, downloads: skills.downloads, createdAt: skills.createdAt,
      }).from(skills).where(eq(skills.ownerId, userId)).orderBy(desc(skills.createdAt));

      const userComments = await db.select({
        id: skillComments.id, content: skillComments.content, createdAt: skillComments.createdAt,
        skillId: skillComments.skillId, skillName: skills.name, skillSlug: skills.slug,
        ownerHandle: sql<string>`(SELECT handle FROM users WHERE id = ${skills.ownerId})`,
      })
      .from(skillComments)
      .leftJoin(skills, eq(skillComments.skillId, skills.id))
      .where(eq(skillComments.userId, userId))
      .orderBy(desc(skillComments.createdAt))
      .limit(50);

      const [starCount] = await db.select({ count: count() }).from(skillStars).where(eq(skillStars.userId, userId));
      const [issueCount] = await db.select({ count: count() }).from(skillIssues).where(eq(skillIssues.authorId, userId));

      res.json({
        user: {
          id: user.id,
          email: user.email,
          handle: user.handle,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          bio: user.bio,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
        },
        skills: userSkills,
        comments: userComments,
        stats: {
          totalSkills: userSkills.length,
          totalStars: starCount.count,
          totalIssues: issueCount.count,
          totalComments: userComments.length,
        },
      });
    } catch (error) {
      console.error("Admin user detail error:", error);
      res.status(500).json({ message: "Failed to fetch user details" });
    }
  });

  app.delete("/api/admin/comments/:commentId", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const { commentId } = req.params;
      await db.delete(skillComments).where(eq(skillComments.id, commentId));
      res.json({ message: "Comment deleted" });
    } catch (error) {
      console.error("Admin delete comment error:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  app.delete("/api/admin/comments/bulk", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Comment IDs required" });
      }
      await db.delete(skillComments).where(inArray(skillComments.id, ids));
      res.json({ message: `${ids.length} comments deleted` });
    } catch (error) {
      console.error("Admin bulk delete error:", error);
      res.status(500).json({ message: "Failed to delete comments" });
    }
  });

  app.post("/api/admin/skills/:skillId/flag", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const { skillId } = req.params;
      const { action } = req.body;

      if (action === "archive") {
        await db.update(skills).set({ isArchived: true, updatedAt: new Date() }).where(eq(skills.id, skillId));
        res.json({ message: "Skill archived" });
      } else if (action === "unarchive") {
        await db.update(skills).set({ isArchived: false, updatedAt: new Date() }).where(eq(skills.id, skillId));
        res.json({ message: "Skill unarchived" });
      } else if (action === "make_private") {
        await db.update(skills).set({ isPublic: false, updatedAt: new Date() }).where(eq(skills.id, skillId));
        res.json({ message: "Skill set to private" });
      } else if (action === "make_public") {
        await db.update(skills).set({ isPublic: true, updatedAt: new Date() }).where(eq(skills.id, skillId));
        res.json({ message: "Skill set to public" });
      } else if (action === "delete") {
        await db.delete(skills).where(eq(skills.id, skillId));
        res.json({ message: "Skill deleted" });
      } else {
        res.status(400).json({ message: "Invalid action. Use: archive, unarchive, make_private, make_public, delete" });
      }
    } catch (error) {
      console.error("Admin flag skill error:", error);
      res.status(500).json({ message: "Failed to update skill" });
    }
  });

  app.delete("/api/admin/issue-comments/:commentId", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const { commentId } = req.params;
      await db.delete(issueComments).where(eq(issueComments.id, commentId));
      res.json({ message: "Issue comment deleted" });
    } catch (error) {
      console.error("Admin delete issue comment error:", error);
      res.status(500).json({ message: "Failed to delete issue comment" });
    }
  });

  app.delete("/api/admin/pr-comments/:commentId", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const { commentId } = req.params;
      await db.delete(prComments).where(eq(prComments.id, commentId));
      res.json({ message: "PR comment deleted" });
    } catch (error) {
      console.error("Admin delete PR comment error:", error);
      res.status(500).json({ message: "Failed to delete PR comment" });
    }
  });
}
