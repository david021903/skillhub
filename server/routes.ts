import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { skills, skillVersions, skillValidations, skillStars, skillActivities, users, apiTokens } from "@shared/schema";
import { eq, desc, and, ilike, sql, or } from "drizzle-orm";
import { isAuthenticated } from "./replit_integrations/auth";
import multer from "multer";
import matter from "gray-matter";
import crypto from "crypto";
import { validateSkillMd } from "./validation";
import { skillTemplates, getTemplateById } from "./skill-templates";
import { checkDependencies, parseDependenciesFromSkillMd } from "./dependency-checker";
import { explainSkill, generateSkill, chatAboutSkill, type ChatMessage } from "./ai-features";

function generateToken(): string {
  return `sb_${crypto.randomBytes(32).toString("hex")}`;
}

async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid authorization header" });
  }
  
  const token = authHeader.slice(7);
  const [tokenRecord] = await db.select()
    .from(apiTokens)
    .where(and(eq(apiTokens.token, token), eq(apiTokens.isRevoked, false)))
    .limit(1);
  
  if (!tokenRecord) {
    return res.status(401).json({ message: "Invalid or revoked token" });
  }
  
  if (tokenRecord.expiresAt && new Date(tokenRecord.expiresAt) < new Date()) {
    return res.status(401).json({ message: "Token expired" });
  }
  
  await db.update(apiTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiTokens.id, tokenRecord.id));
  
  const [user] = await db.select().from(users).where(eq(users.id, tokenRecord.userId)).limit(1);
  (req as any).tokenUser = user;
  (req as any).tokenScopes = tokenRecord.scopes;
  next();
}

function requireScope(scope: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const scopes = (req as any).tokenScopes as string[] | null;
    if (!scopes || !scopes.includes(scope)) {
      return res.status(403).json({ 
        message: `Insufficient permissions. Required scope: ${scope}`,
        required_scope: scope,
        your_scopes: scopes || []
      });
    }
    next();
  };
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

async function logActivity(skillId: string, userId: string | null, action: string, details?: Record<string, any>) {
  try {
    await db.insert(skillActivities).values({
      skillId,
      userId,
      action,
      details,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export function registerRoutes(app: Express) {
  app.get("/api/skills", async (req: Request, res: Response) => {
    try {
      const { search, tag, verified, sort = "latest", limit = "20", offset = "0" } = req.query;
      
      let query = db.select({
        id: skills.id,
        name: skills.name,
        slug: skills.slug,
        description: skills.description,
        isVerified: skills.isVerified,
        stars: skills.stars,
        downloads: skills.downloads,
        tags: skills.tags,
        createdAt: skills.createdAt,
        owner: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          handle: users.handle,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(skills)
      .leftJoin(users, eq(skills.ownerId, users.id))
      .where(eq(skills.isPublic, true));

      if (search) {
        query = query.where(
          or(
            ilike(skills.name, `%${search}%`),
            ilike(skills.description, `%${search}%`)
          )
        ) as any;
      }

      if (verified === "true") {
        query = query.where(eq(skills.isVerified, true)) as any;
      }

      const orderBy = sort === "stars" ? desc(skills.stars) 
        : sort === "downloads" ? desc(skills.downloads) 
        : desc(skills.createdAt);
      
      const result = await query
        .orderBy(orderBy)
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      res.json(result);
    } catch (error) {
      console.error("Error fetching skills:", error);
      res.status(500).json({ message: "Failed to fetch skills" });
    }
  });

  app.get("/api/skills/:owner/:slug", async (req: Request, res: Response) => {
    try {
      const { owner, slug } = req.params;
      
      const ownerUser = await db.select().from(users).where(
        or(eq(users.handle, owner), eq(users.id, owner))
      ).limit(1);
      
      if (!ownerUser.length) {
        return res.status(404).json({ message: "Skill not found" });
      }

      const skill = await db.select({
        id: skills.id,
        name: skills.name,
        slug: skills.slug,
        description: skills.description,
        homepage: skills.homepage,
        repository: skills.repository,
        license: skills.license,
        isPublic: skills.isPublic,
        isVerified: skills.isVerified,
        isArchived: skills.isArchived,
        stars: skills.stars,
        downloads: skills.downloads,
        forks: skills.forks,
        weeklyDownloads: skills.weeklyDownloads,
        tags: skills.tags,
        metadata: skills.metadata,
        dependencies: skills.dependencies,
        createdAt: skills.createdAt,
        updatedAt: skills.updatedAt,
        owner: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          handle: users.handle,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(skills)
      .leftJoin(users, eq(skills.ownerId, users.id))
      .where(and(eq(skills.ownerId, ownerUser[0].id), eq(skills.slug, slug)))
      .limit(1);

      if (!skill.length) {
        return res.status(404).json({ message: "Skill not found" });
      }

      const versions = await db.select()
        .from(skillVersions)
        .where(eq(skillVersions.skillId, skill[0].id))
        .orderBy(desc(skillVersions.publishedAt));

      const versionsWithValidations = await Promise.all(
        versions.map(async (version) => {
          const validations = await db.select()
            .from(skillValidations)
            .where(eq(skillValidations.versionId, version.id))
            .orderBy(desc(skillValidations.createdAt))
            .limit(1);
          return { ...version, validations };
        })
      );

      res.json({ ...skill[0], versions: versionsWithValidations });
    } catch (error) {
      console.error("Error fetching skill:", error);
      res.status(500).json({ message: "Failed to fetch skill" });
    }
  });

  app.get("/api/skills/:owner/:slug/versions/:version", async (req: Request, res: Response) => {
    try {
      const { owner, slug, version } = req.params;
      
      const ownerUser = await db.select().from(users).where(
        or(eq(users.handle, owner), eq(users.id, owner))
      ).limit(1);
      
      if (!ownerUser.length) {
        return res.status(404).json({ message: "Version not found" });
      }

      const skill = await db.select()
        .from(skills)
        .where(and(eq(skills.ownerId, ownerUser[0].id), eq(skills.slug, slug)))
        .limit(1);

      if (!skill.length) {
        return res.status(404).json({ message: "Version not found" });
      }

      const versionData = await db.select()
        .from(skillVersions)
        .where(and(eq(skillVersions.skillId, skill[0].id), eq(skillVersions.version, version)))
        .limit(1);

      if (!versionData.length) {
        return res.status(404).json({ message: "Version not found" });
      }

      const validation = await db.select()
        .from(skillValidations)
        .where(eq(skillValidations.versionId, versionData[0].id))
        .orderBy(desc(skillValidations.createdAt))
        .limit(1);

      res.json({ ...versionData[0], validation: validation[0] || null });
    } catch (error) {
      console.error("Error fetching version:", error);
      res.status(500).json({ message: "Failed to fetch version" });
    }
  });

  app.post("/api/skills", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { name, slug, description, isPublic = true, tags = [] } = req.body;

      if (!name || !slug) {
        return res.status(400).json({ message: "Name and slug are required" });
      }

      if (name.length > 100) {
        return res.status(400).json({ message: "Name must be 100 characters or less" });
      }

      const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugPattern.test(slug) || slug.length > 50) {
        return res.status(400).json({ message: "Slug must be lowercase letters, numbers, and hyphens only (max 50 chars)" });
      }

      if (description && description.length > 500) {
        return res.status(400).json({ message: "Description must be 500 characters or less" });
      }

      const existing = await db.select()
        .from(skills)
        .where(and(eq(skills.ownerId, userId), eq(skills.slug, slug)))
        .limit(1);

      if (existing.length) {
        return res.status(409).json({ message: "A skill with this slug already exists" });
      }

      const [skill] = await db.insert(skills)
        .values({ ownerId: userId, name, slug, description, isPublic, tags })
        .returning();

      res.status(201).json(skill);
    } catch (error) {
      console.error("Error creating skill:", error);
      res.status(500).json({ message: "Failed to create skill" });
    }
  });

  app.post("/api/skills/:skillId/versions", isAuthenticated, upload.single("file"), async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { skillId } = req.params;
      const { version, skillMd, readme, changelog } = req.body;

      const skill = await db.select()
        .from(skills)
        .where(and(eq(skills.id, skillId), eq(skills.ownerId, userId)))
        .limit(1);

      if (!skill.length) {
        return res.status(404).json({ message: "Skill not found" });
      }

      if (!version || !skillMd) {
        return res.status(400).json({ message: "Version and SKILL.md content are required" });
      }

      const existingVersion = await db.select()
        .from(skillVersions)
        .where(and(eq(skillVersions.skillId, skillId), eq(skillVersions.version, version)))
        .limit(1);

      if (existingVersion.length) {
        return res.status(409).json({ message: "This version already exists" });
      }

      const parsed = matter(skillMd);
      const manifest = parsed.data as Record<string, any>;

      await db.update(skillVersions)
        .set({ isLatest: false })
        .where(eq(skillVersions.skillId, skillId));

      const [newVersion] = await db.insert(skillVersions)
        .values({
          skillId,
          version,
          skillMd,
          manifest,
          readme,
          changelog,
          isLatest: true,
        })
        .returning();

      if (manifest.name) {
        await db.update(skills)
          .set({ name: manifest.name, description: manifest.description, updatedAt: new Date() })
          .where(eq(skills.id, skillId));
      }

      const validationResult = await validateSkillMd(skillMd, manifest);
      
      await db.insert(skillValidations).values({
        versionId: newVersion.id,
        status: validationResult.passed ? "passed" : "failed",
        score: validationResult.score,
        checks: validationResult.checks,
        startedAt: new Date(),
        finishedAt: new Date(),
      });

      res.status(201).json(newVersion);
    } catch (error) {
      console.error("Error creating version:", error);
      res.status(500).json({ message: "Failed to create version" });
    }
  });

  app.post("/api/skills/:skillId/star", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { skillId } = req.params;

      const existing = await db.select()
        .from(skillStars)
        .where(and(eq(skillStars.skillId, skillId), eq(skillStars.userId, userId)))
        .limit(1);

      if (existing.length) {
        await db.delete(skillStars)
          .where(and(eq(skillStars.skillId, skillId), eq(skillStars.userId, userId)));
        await db.update(skills)
          .set({ stars: sql`${skills.stars} - 1` })
          .where(eq(skills.id, skillId));
        logActivity(skillId, userId, "unstar");
        return res.json({ starred: false });
      }

      await db.insert(skillStars).values({ skillId, userId });
      await db.update(skills)
        .set({ stars: sql`${skills.stars} + 1` })
        .where(eq(skills.id, skillId));
      logActivity(skillId, userId, "star");

      res.json({ starred: true });
    } catch (error) {
      console.error("Error toggling star:", error);
      res.status(500).json({ message: "Failed to toggle star" });
    }
  });

  app.get("/api/skills/trending", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await db.select({
        id: skills.id,
        name: skills.name,
        slug: skills.slug,
        description: skills.description,
        isVerified: skills.isVerified,
        stars: skills.stars,
        downloads: skills.downloads,
        weeklyDownloads: skills.weeklyDownloads,
        tags: skills.tags,
        license: skills.license,
        createdAt: skills.createdAt,
        owner: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          handle: users.handle,
          profileImageUrl: users.profileImageUrl,
        },
      })
        .from(skills)
        .leftJoin(users, eq(skills.ownerId, users.id))
        .where(and(eq(skills.isPublic, true), eq(skills.isArchived, false)))
        .orderBy(desc(sql`(${skills.weeklyDownloads} * 3 + ${skills.stars} * 2 + ${skills.downloads})`))
        .limit(limit);

      res.json(result);
    } catch (error) {
      console.error("Error fetching trending skills:", error);
      res.status(500).json({ message: "Failed to fetch trending skills" });
    }
  });

  app.get("/api/skills/:skillId/starred", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { skillId } = req.params;

      const existing = await db.select()
        .from(skillStars)
        .where(and(eq(skillStars.skillId, skillId), eq(skillStars.userId, userId)))
        .limit(1);

      res.json({ starred: existing.length > 0 });
    } catch (error) {
      res.status(500).json({ message: "Failed to check star status" });
    }
  });

  app.get("/api/skills/:skillId/activity", async (req: Request, res: Response) => {
    try {
      const { skillId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const activities = await db.select({
        id: skillActivities.id,
        action: skillActivities.action,
        details: skillActivities.details,
        createdAt: skillActivities.createdAt,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          handle: users.handle,
          profileImageUrl: users.profileImageUrl,
        },
      })
        .from(skillActivities)
        .leftJoin(users, eq(skillActivities.userId, users.id))
        .where(eq(skillActivities.skillId, skillId))
        .orderBy(desc(skillActivities.createdAt))
        .limit(limit);
      
      res.json(activities);
    } catch (error) {
      console.error("Error fetching skill activity:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  app.get("/api/my-skills", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      const result = await db.select()
        .from(skills)
        .where(eq(skills.ownerId, userId))
        .orderBy(desc(skills.updatedAt));

      res.json(result);
    } catch (error) {
      console.error("Error fetching user skills:", error);
      res.status(500).json({ message: "Failed to fetch skills" });
    }
  });

  app.get("/api/my-stars", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const starred = await db.select({
        id: skills.id,
        name: skills.name,
        slug: skills.slug,
        description: skills.description,
        stars: skills.stars,
        downloads: skills.downloads,
        ownerId: skills.ownerId,
        isPublic: skills.isPublic,
        createdAt: skills.createdAt,
        updatedAt: skills.updatedAt,
        ownerHandle: users.handle,
      })
        .from(skillStars)
        .innerJoin(skills, eq(skillStars.skillId, skills.id))
        .innerJoin(users, eq(skills.ownerId, users.id))
        .where(eq(skillStars.userId, userId))
        .orderBy(desc(skillStars.createdAt))
        .limit(limit);

      const result = starred.map(skill => ({
        id: skill.id,
        name: skill.name,
        slug: skill.slug,
        description: skill.description,
        stars: skill.stars,
        downloads: skill.downloads,
        ownerId: skill.ownerId,
        isPublic: skill.isPublic,
        createdAt: skill.createdAt,
        updatedAt: skill.updatedAt,
        owner: { id: skill.ownerId, handle: skill.ownerHandle },
      }));

      res.json(result);
    } catch (error) {
      console.error("Error fetching starred skills:", error);
      res.status(500).json({ message: "Failed to fetch starred skills" });
    }
  });

  app.put("/api/skills/:skillId", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { skillId } = req.params;
      const { name, description, isPublic, tags, homepage } = req.body;

      const skill = await db.select()
        .from(skills)
        .where(and(eq(skills.id, skillId), eq(skills.ownerId, userId)))
        .limit(1);

      if (!skill.length) {
        return res.status(404).json({ message: "Skill not found" });
      }

      const [updated] = await db.update(skills)
        .set({ name, description, isPublic, tags, homepage, updatedAt: new Date() })
        .where(eq(skills.id, skillId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error updating skill:", error);
      res.status(500).json({ message: "Failed to update skill" });
    }
  });

  app.delete("/api/skills/:skillId", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { skillId } = req.params;

      const skill = await db.select()
        .from(skills)
        .where(and(eq(skills.id, skillId), eq(skills.ownerId, userId)))
        .limit(1);

      if (!skill.length) {
        return res.status(404).json({ message: "Skill not found" });
      }

      await db.delete(skills).where(eq(skills.id, skillId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting skill:", error);
      res.status(500).json({ message: "Failed to delete skill" });
    }
  });

  app.get("/api/users/:handle", async (req: Request, res: Response) => {
    try {
      const { handle } = req.params;
      
      const user = await db.select({
        id: users.id,
        handle: users.handle,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        bio: users.bio,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(or(eq(users.handle, handle), eq(users.id, handle)))
      .limit(1);

      if (!user.length) {
        return res.status(404).json({ message: "User not found" });
      }

      const userSkills = await db.select()
        .from(skills)
        .where(and(eq(skills.ownerId, user[0].id), eq(skills.isPublic, true)))
        .orderBy(desc(skills.stars));

      res.json({ ...user[0], skills: userSkills });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/profile", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { handle, bio } = req.body;

      if (handle) {
        const handlePattern = /^[a-zA-Z0-9_-]+$/;
        if (!handlePattern.test(handle) || handle.length < 3 || handle.length > 30) {
          return res.status(400).json({ message: "Handle must be 3-30 characters, letters, numbers, underscores, or hyphens only" });
        }

        const existing = await db.select()
          .from(users)
          .where(and(eq(users.handle, handle), sql`${users.id} != ${userId}`))
          .limit(1);
        
        if (existing.length) {
          return res.status(409).json({ message: "Handle already taken" });
        }
      }

      if (bio && bio.length > 500) {
        return res.status(400).json({ message: "Bio must be 500 characters or less" });
      }

      const [updated] = await db.update(users)
        .set({ handle, bio, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get("/api/stats", async (_req: Request, res: Response) => {
    try {
      const [skillCount] = await db.select({ count: sql<number>`count(*)` }).from(skills);
      const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
      const [versionCount] = await db.select({ count: sql<number>`count(*)` }).from(skillVersions);
      
      res.json({
        skills: Number(skillCount.count),
        users: Number(userCount.count),
        versions: Number(versionCount.count),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // =====================
  // API Token Management (for CLI)
  // =====================

  app.get("/api/tokens", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const tokens = await db.select({
        id: apiTokens.id,
        name: apiTokens.name,
        scopes: apiTokens.scopes,
        lastUsedAt: apiTokens.lastUsedAt,
        expiresAt: apiTokens.expiresAt,
        createdAt: apiTokens.createdAt,
      })
      .from(apiTokens)
      .where(and(eq(apiTokens.userId, userId), eq(apiTokens.isRevoked, false)))
      .orderBy(desc(apiTokens.createdAt));

      res.json(tokens);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tokens" });
    }
  });

  app.post("/api/tokens", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { name, scopes = ["read", "write"], expiresIn } = req.body;

      if (!name || name.length > 100) {
        return res.status(400).json({ message: "Token name is required (max 100 chars)" });
      }

      const token = generateToken();
      const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000) : null;

      const [created] = await db.insert(apiTokens)
        .values({ userId, name, token, scopes, expiresAt })
        .returning();

      res.status(201).json({
        id: created.id,
        name: created.name,
        token: created.token,
        scopes: created.scopes,
        expiresAt: created.expiresAt,
        createdAt: created.createdAt,
        note: "Store this token securely. You won't be able to see it again.",
      });
    } catch (error) {
      console.error("Error creating token:", error);
      res.status(500).json({ message: "Failed to create token" });
    }
  });

  app.delete("/api/tokens/:tokenId", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { tokenId } = req.params;

      const [token] = await db.select()
        .from(apiTokens)
        .where(and(eq(apiTokens.id, tokenId), eq(apiTokens.userId, userId)))
        .limit(1);

      if (!token) {
        return res.status(404).json({ message: "Token not found" });
      }

      await db.update(apiTokens)
        .set({ isRevoked: true })
        .where(eq(apiTokens.id, tokenId));

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to revoke token" });
    }
  });

  // =====================
  // CLI API Endpoints (Token Auth)
  // =====================

  app.get("/api/cli/whoami", authenticateToken, async (req: any, res: Response) => {
    const user = req.tokenUser;
    res.json({
      id: user.id,
      handle: user.handle,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });
  });

  app.post("/api/cli/skills", authenticateToken, requireScope("write"), async (req: any, res: Response) => {
    try {
      const user = req.tokenUser;
      const { name, slug, description, isPublic = true, tags = [] } = req.body;

      if (!name || !slug) {
        return res.status(400).json({ message: "Name and slug are required" });
      }

      const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugPattern.test(slug) || slug.length > 50) {
        return res.status(400).json({ message: "Slug must be lowercase letters, numbers, and hyphens only (max 50 chars)" });
      }

      const existing = await db.select()
        .from(skills)
        .where(and(eq(skills.ownerId, user.id), eq(skills.slug, slug)))
        .limit(1);

      if (existing.length) {
        return res.status(409).json({ message: "A skill with this slug already exists" });
      }

      const [skill] = await db.insert(skills)
        .values({ ownerId: user.id, name, slug, description, isPublic, tags })
        .returning();

      res.status(201).json(skill);
    } catch (error) {
      console.error("Error creating skill via CLI:", error);
      res.status(500).json({ message: "Failed to create skill" });
    }
  });

  app.post("/api/cli/skills/:owner/:slug/publish", authenticateToken, requireScope("write"), async (req: any, res: Response) => {
    try {
      const user = req.tokenUser;
      const { owner, slug } = req.params;
      const { version, skillMd, readme, changelog } = req.body;

      if (user.handle !== owner && user.id !== owner) {
        return res.status(403).json({ message: "You can only publish to your own skills" });
      }

      let skill = await db.select()
        .from(skills)
        .where(and(eq(skills.ownerId, user.id), eq(skills.slug, slug)))
        .limit(1);

      if (!skill.length) {
        const parsed = matter(skillMd);
        const manifest = parsed.data as Record<string, any>;
        const [newSkill] = await db.insert(skills)
          .values({
            ownerId: user.id,
            name: manifest.name || slug,
            slug,
            description: manifest.description || "",
            isPublic: true,
            tags: manifest.tags || [],
          })
          .returning();
        skill = [newSkill];
      }

      if (!version || !skillMd) {
        return res.status(400).json({ message: "Version and SKILL.md content are required" });
      }

      const existingVersion = await db.select()
        .from(skillVersions)
        .where(and(eq(skillVersions.skillId, skill[0].id), eq(skillVersions.version, version)))
        .limit(1);

      if (existingVersion.length) {
        return res.status(409).json({ message: "This version already exists" });
      }

      const parsed = matter(skillMd);
      const manifest = parsed.data as Record<string, any>;

      await db.update(skillVersions)
        .set({ isLatest: false })
        .where(eq(skillVersions.skillId, skill[0].id));

      const [newVersion] = await db.insert(skillVersions)
        .values({
          skillId: skill[0].id,
          version,
          skillMd,
          manifest,
          readme,
          changelog,
          isLatest: true,
        })
        .returning();

      if (manifest.name) {
        await db.update(skills)
          .set({ name: manifest.name, description: manifest.description, updatedAt: new Date() })
          .where(eq(skills.id, skill[0].id));
      }

      const validationResult = await validateSkillMd(skillMd, manifest);
      
      await db.insert(skillValidations).values({
        versionId: newVersion.id,
        status: validationResult.passed ? "passed" : "failed",
        score: validationResult.score,
        checks: validationResult.checks,
        startedAt: new Date(),
        finishedAt: new Date(),
      });

      logActivity(skill[0].id, user.id, "publish", { version: newVersion.version });

      res.status(201).json({
        skill: { owner: user.handle, slug: skill[0].slug },
        version: newVersion.version,
        validation: validationResult,
      });
    } catch (error) {
      console.error("Error publishing via CLI:", error);
      res.status(500).json({ message: "Failed to publish" });
    }
  });

  app.post("/api/cli/validate", async (req: Request, res: Response) => {
    try {
      const { skillMd } = req.body;

      if (!skillMd) {
        return res.status(400).json({ message: "SKILL.md content is required" });
      }

      const parsed = matter(skillMd);
      const manifest = parsed.data as Record<string, any>;
      const validationResult = await validateSkillMd(skillMd, manifest);

      res.json(validationResult);
    } catch (error) {
      console.error("Error validating:", error);
      res.status(500).json({ message: "Failed to validate" });
    }
  });

  app.post("/api/check-dependencies", async (req: Request, res: Response) => {
    try {
      const { skillMd, installedSkills } = req.body;

      if (!skillMd) {
        return res.status(400).json({ message: "SKILL.md content is required" });
      }

      const dependencies = parseDependenciesFromSkillMd(skillMd);
      const report = await checkDependencies(dependencies, installedSkills || []);

      res.json(report);
    } catch (error) {
      console.error("Error checking dependencies:", error);
      res.status(500).json({ message: "Failed to check dependencies" });
    }
  });

  app.post("/api/cli/check-dependencies", authenticateToken, requireScope("read"), async (req: Request, res: Response) => {
    try {
      const { skillMd, installedSkills } = req.body;

      if (!skillMd) {
        return res.status(400).json({ message: "SKILL.md content is required" });
      }

      const dependencies = parseDependenciesFromSkillMd(skillMd);
      const report = await checkDependencies(dependencies, installedSkills || []);

      res.json(report);
    } catch (error) {
      console.error("Error checking dependencies:", error);
      res.status(500).json({ message: "Failed to check dependencies" });
    }
  });

  app.get("/api/templates", async (req: Request, res: Response) => {
    res.json(skillTemplates.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      icon: t.icon,
      category: t.category,
      tags: t.tags,
    })));
  });

  app.get("/api/templates/:id", async (req: Request, res: Response) => {
    const templateId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const template = getTemplateById(templateId);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    res.json(template);
  });

  // AI-powered Skill Explainer
  app.post("/api/skills/explain", async (req: Request, res: Response) => {
    try {
      const { skillMd } = req.body;
      if (!skillMd) {
        return res.status(400).json({ message: "SKILL.md content is required" });
      }
      const explanation = await explainSkill(skillMd);
      res.json(explanation);
    } catch (error) {
      console.error("Error explaining skill:", error);
      res.status(500).json({ message: "Failed to explain skill" });
    }
  });

  // AI-powered Skill Generator
  app.post("/api/skills/generate", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { prompt, category, complexity } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      const generated = await generateSkill(prompt, { category, complexity });
      res.json(generated);
    } catch (error) {
      console.error("Error generating skill:", error);
      res.status(500).json({ message: "Failed to generate skill" });
    }
  });

  // AI-powered Skill Chat (streaming)
  app.post("/api/skills/chat", async (req: Request, res: Response) => {
    try {
      const { skillMd, message, history } = req.body;
      if (!skillMd || !message) {
        return res.status(400).json({ message: "skillMd and message are required" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const chatHistory: ChatMessage[] = history || [];
      const stream = chatAboutSkill(skillMd, message, chatHistory);

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error in skill chat:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to process chat" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: "Failed to process chat" });
      }
    }
  });

  app.get("/api/cli/skills/:owner/:slug/install", async (req: Request, res: Response) => {
    try {
      const { owner, slug } = req.params;
      const { version: requestedVersion } = req.query;
      
      const ownerUser = await db.select().from(users).where(
        or(eq(users.handle, owner), eq(users.id, owner))
      ).limit(1);
      
      if (!ownerUser.length) {
        return res.status(404).json({ message: "Skill not found" });
      }

      const skill = await db.select()
        .from(skills)
        .where(and(eq(skills.ownerId, ownerUser[0].id), eq(skills.slug, slug)))
        .limit(1);

      if (!skill.length) {
        return res.status(404).json({ message: "Skill not found" });
      }

      let versionData;
      if (requestedVersion && requestedVersion !== "latest") {
        [versionData] = await db.select()
          .from(skillVersions)
          .where(and(eq(skillVersions.skillId, skill[0].id), eq(skillVersions.version, requestedVersion as string)))
          .limit(1);
      } else {
        [versionData] = await db.select()
          .from(skillVersions)
          .where(and(eq(skillVersions.skillId, skill[0].id), eq(skillVersions.isLatest, true)))
          .limit(1);
      }

      if (!versionData) {
        return res.status(404).json({ message: "Version not found" });
      }

      await db.update(skills)
        .set({ downloads: sql`${skills.downloads} + 1`, weeklyDownloads: sql`${skills.weeklyDownloads} + 1` })
        .where(eq(skills.id, skill[0].id));

      await db.update(skillVersions)
        .set({ downloads: sql`${skillVersions.downloads} + 1` })
        .where(eq(skillVersions.id, versionData.id));

      logActivity(skill[0].id, null, "install", { version: versionData.version });

      res.json({
        skill: {
          name: skill[0].name,
          slug: skill[0].slug,
          owner: ownerUser[0].handle,
        },
        version: versionData.version,
        skillMd: versionData.skillMd,
        manifest: versionData.manifest,
        readme: versionData.readme,
      });
    } catch (error) {
      console.error("Error installing skill:", error);
      res.status(500).json({ message: "Failed to install skill" });
    }
  });

  app.get("/api/cli/search", async (req: Request, res: Response) => {
    try {
      const { q, limit = "20" } = req.query;
      
      let query = db.select({
        name: skills.name,
        slug: skills.slug,
        description: skills.description,
        stars: skills.stars,
        downloads: skills.downloads,
        owner: users.handle,
      })
      .from(skills)
      .leftJoin(users, eq(skills.ownerId, users.id))
      .where(eq(skills.isPublic, true));

      if (q) {
        query = query.where(
          or(
            ilike(skills.name, `%${q}%`),
            ilike(skills.description, `%${q}%`)
          )
        ) as any;
      }

      const result = await query
        .orderBy(desc(skills.stars))
        .limit(parseInt(limit as string));

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to search" });
    }
  });
}
