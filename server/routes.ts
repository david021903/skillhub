import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db.js";
import { skills, skillVersions, skillValidations, skillStars, skillActivities, skillComments, skillIssues, issueComments, skillPullRequests, prComments, users, apiTokens, skillFiles } from "../shared/schema.js";
import { eq, desc, and, ilike, sql, or } from "drizzle-orm";
import { isAuthenticated, getCurrentUser } from "./auth.js";
import multer from "multer";
import matter from "gray-matter";
import crypto from "crypto";
import archiver from "archiver";
import { validateSkillMd } from "./validation.js";
import { skillTemplates, getTemplateById } from "./skill-templates.js";
import { checkDependencies, parseDependenciesFromSkillMd } from "./dependency-checker.js";
import { explainSkill, generateSkill, chatAboutSkill, type ChatMessage } from "./ai-features.js";

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
      const { search, tag, verified, sort = "latest", limit = "20", offset = "0", paginated } = req.query;
      
      const conditions: any[] = [eq(skills.isPublic, true)];
      
      if (search) {
        conditions.push(
          or(
            ilike(skills.name, `%${search}%`),
            ilike(skills.description, `%${search}%`)
          )
        );
      }

      if (verified === "true") {
        conditions.push(eq(skills.isVerified, true));
      }

      const orderBy = sort === "stars" ? desc(skills.stars) 
        : sort === "downloads" ? desc(skills.downloads) 
        : desc(skills.createdAt);
      
      const result = await db.select({
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
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

      // Return paginated response with total count if requested
      if (paginated === "true") {
        const [countResult] = await db.select({ count: sql<number>`count(*)` })
          .from(skills)
          .where(and(...conditions));
        
        res.json({
          skills: result,
          total: Number(countResult.count),
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        });
      } else {
        res.json(result);
      }
    } catch (error) {
      console.error("Error fetching skills:", error);
      res.status(500).json({ message: "Failed to fetch skills" });
    }
  });

  // IMPORTANT: These specific routes must come BEFORE the /:owner/:slug catch-all
  // Forward to the actual handlers defined later
  app.get("/api/skills/trending", async (req: Request, res: Response, next) => next("route"));
  
  // Skill-ID based routes (must come before /:owner/:slug)
  app.get("/api/skills/:skillId/starred", async (req: Request, res: Response) => {
    try {
      const skillId = req.params.skillId as string;
      const userId = (req.session as any)?.userId;
      if (!userId) return res.json({ starred: false });
      
      const existing = await db.select().from(skillStars).where(and(eq(skillStars.skillId, skillId), eq(skillStars.userId, userId))).limit(1);
      res.json({ starred: existing.length > 0 });
    } catch (error) {
      res.json({ starred: false });
    }
  });

  app.get("/api/skills/:skillId/activity", async (req: Request, res: Response) => {
    try {
      const skillId = req.params.skillId as string;
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
      res.json([]);
    }
  });

  app.get("/api/skills/:skillId/comments", async (req: Request, res: Response) => {
    try {
      const skillId = req.params.skillId as string;
      
      const comments = await db.select({
        id: skillComments.id,
        content: skillComments.content,
        parentId: skillComments.parentId,
        isEdited: skillComments.isEdited,
        createdAt: skillComments.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          handle: users.handle,
          profileImageUrl: users.profileImageUrl,
        },
      })
        .from(skillComments)
        .leftJoin(users, eq(skillComments.userId, users.id))
        .where(eq(skillComments.skillId, skillId))
        .orderBy(desc(skillComments.createdAt));
      
      res.json(comments);
    } catch (error) {
      res.json([]);
    }
  });

  app.get("/api/skills/:skillId/pulls", async (req: Request, res: Response) => {
    try {
      const skillId = req.params.skillId as string;
      const { state = "open" } = req.query;
      
      const prs = await db.query.skillPullRequests.findMany({
        where: state === "all" 
          ? eq(skillPullRequests.skillId, skillId)
          : and(eq(skillPullRequests.skillId, skillId), eq(skillPullRequests.state, state as string)),
        with: { author: true },
        orderBy: [desc(skillPullRequests.createdAt)],
      });
      
      res.json(prs);
    } catch (error) {
      res.json([]);
    }
  });

  app.get("/api/skills/:skillId/issues", async (req: Request, res: Response) => {
    try {
      const skillId = req.params.skillId as string;
      const { state = "open" } = req.query;
      
      const issues = await db.query.skillIssues.findMany({
        where: state === "all" 
          ? eq(skillIssues.skillId, skillId)
          : and(eq(skillIssues.skillId, skillId), eq(skillIssues.state, state as string)),
        with: { author: true },
        orderBy: [desc(skillIssues.createdAt)],
      });
      
      res.json(issues);
    } catch (error) {
      res.json([]);
    }
  });

  // Delete skill (owner only)
  app.delete("/api/skills/:skillId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      const skillId = req.params.skillId as string;
      
      const [skill] = await db.select().from(skills).where(eq(skills.id, skillId)).limit(1);
      if (!skill) return res.status(404).json({ message: "Skill not found" });
      if (skill.ownerId !== userId) return res.status(403).json({ message: "Not authorized to delete this skill" });
      
      await db.delete(skills).where(eq(skills.id, skillId));
      res.json({ message: "Skill deleted successfully" });
    } catch (error) {
      console.error("Delete skill error:", error);
      res.status(500).json({ message: "Failed to delete skill" });
    }
  });

  // Validate skill on demand
  app.post("/api/skills/:skillId/validate", async (req: Request, res: Response) => {
    try {
      const skillId = req.params.skillId as string;
      
      const [latestVersion] = await db.select()
        .from(skillVersions)
        .where(and(eq(skillVersions.skillId, skillId), eq(skillVersions.isLatest, true)))
        .limit(1);
      
      if (!latestVersion) {
        return res.status(404).json({ message: "No version found for this skill" });
      }
      
      let manifest: Record<string, any> = {};
      const fmMatch = latestVersion.skillMd.match(/^---\n([\s\S]*?)\n---/);
      if (fmMatch) {
        try {
          const lines = fmMatch[1].split('\n');
          for (const line of lines) {
            const [key, ...rest] = line.split(':');
            if (key && rest.length) manifest[key.trim()] = rest.join(':').trim();
          }
        } catch {}
      }
      
      const validationResult = await validateSkillMd(latestVersion.skillMd, manifest);
      
      await db.delete(skillValidations).where(eq(skillValidations.versionId, latestVersion.id));
      await db.insert(skillValidations).values({
        versionId: latestVersion.id,
        status: validationResult.passed ? "passed" : "failed",
        score: validationResult.score,
        checks: validationResult.checks,
      });
      
      res.json({
        passed: validationResult.passed,
        score: validationResult.score,
        checks: validationResult.checks,
        version: latestVersion.version,
      });
    } catch (error) {
      console.error("Validate skill error:", error);
      res.status(500).json({ message: "Failed to validate skill" });
    }
  });

  app.get("/api/skills/:owner/:slug", async (req: Request, res: Response) => {
    try {
      const owner = req.params.owner as string;
      const slug = req.params.slug as string;
      
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
      const owner = req.params.owner as string;
      const slug = req.params.slug as string;
      const version = req.params.version as string;
      
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

  // File management endpoints
  app.get("/api/skills/:owner/:slug/files", async (req: Request, res: Response) => {
    try {
      const owner = Array.isArray(req.params.owner) ? req.params.owner[0] : req.params.owner;
      const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
      const version = req.query.version as string | undefined;

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
      if (version) {
        versionData = await db.select()
          .from(skillVersions)
          .where(and(eq(skillVersions.skillId, skill[0].id), eq(skillVersions.version, version)))
          .limit(1);
      } else {
        versionData = await db.select()
          .from(skillVersions)
          .where(eq(skillVersions.skillId, skill[0].id))
          .orderBy(desc(skillVersions.publishedAt))
          .limit(1);
      }

      if (!versionData.length) {
        return res.status(404).json({ message: "Version not found" });
      }

      const files = await db.select({
        id: skillFiles.id,
        path: skillFiles.path,
        size: skillFiles.size,
        isBinary: skillFiles.isBinary,
        mimeType: skillFiles.mimeType,
        sha256: skillFiles.sha256,
        createdAt: skillFiles.createdAt,
      })
        .from(skillFiles)
        .where(eq(skillFiles.versionId, versionData[0].id))
        .orderBy(skillFiles.path);

      // Also include SKILL.md from the version itself if no files exist
      const allFiles = files.length > 0 ? files : [{
        id: versionData[0].id,
        path: "SKILL.md",
        size: versionData[0].skillMd?.length || 0,
        isBinary: false,
        mimeType: "text/markdown",
        sha256: null,
        createdAt: versionData[0].createdAt,
      }];

      res.json({ 
        version: versionData[0].version, 
        files: allFiles,
        totalFiles: allFiles.length,
        totalSize: allFiles.reduce((sum, f) => sum + (f.size || 0), 0),
      });
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.get("/api/skills/:owner/:slug/files/*", async (req: Request, res: Response) => {
    try {
      const owner = Array.isArray(req.params.owner) ? req.params.owner[0] : req.params.owner;
      const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
      const filePath = req.params[0];
      const version = req.query.version as string | undefined;

      if (!filePath) {
        return res.status(400).json({ message: "File path required" });
      }

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
      if (version) {
        versionData = await db.select()
          .from(skillVersions)
          .where(and(eq(skillVersions.skillId, skill[0].id), eq(skillVersions.version, version)))
          .limit(1);
      } else {
        versionData = await db.select()
          .from(skillVersions)
          .where(eq(skillVersions.skillId, skill[0].id))
          .orderBy(desc(skillVersions.publishedAt))
          .limit(1);
      }

      if (!versionData.length) {
        return res.status(404).json({ message: "Version not found" });
      }

      // Handle SKILL.md specially - it's stored in the version record
      if (filePath === "SKILL.md" || filePath === "skill.md") {
        return res.json({
          path: "SKILL.md",
          content: versionData[0].skillMd,
          size: versionData[0].skillMd?.length || 0,
          isBinary: false,
          mimeType: "text/markdown",
        });
      }

      const file = await db.select()
        .from(skillFiles)
        .where(and(eq(skillFiles.versionId, versionData[0].id), eq(skillFiles.path, filePath)))
        .limit(1);

      if (!file.length) {
        return res.status(404).json({ message: "File not found" });
      }

      res.json({
        path: file[0].path,
        content: file[0].isBinary ? null : file[0].content,
        binaryContent: file[0].isBinary ? file[0].binaryContent : null,
        size: file[0].size,
        isBinary: file[0].isBinary,
        mimeType: file[0].mimeType,
        sha256: file[0].sha256,
      });
    } catch (error) {
      console.error("Error fetching file:", error);
      res.status(500).json({ message: "Failed to fetch file" });
    }
  });

  app.post("/api/skills/:id/versions/:versionId/files", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      const { id: skillId, versionId } = req.params;
      const { files } = req.body;

      if (!Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ message: "Files array is required" });
      }

      const skill = await db.select()
        .from(skills)
        .where(eq(skills.id, skillId))
        .limit(1);

      if (!skill.length || skill[0].ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const version = await db.select()
        .from(skillVersions)
        .where(and(eq(skillVersions.id, versionId), eq(skillVersions.skillId, skillId)))
        .limit(1);

      if (!version.length) {
        return res.status(404).json({ message: "Version not found" });
      }

      const insertedFiles: any[] = [];
      for (const file of files) {
        if (!file.path || (file.content === undefined && file.binaryContent === undefined)) {
          continue;
        }

        const isBinary = !!file.binaryContent;
        const content = isBinary ? null : file.content;
        const binaryContent = isBinary ? file.binaryContent : null;
        const size = isBinary ? (file.binaryContent?.length || 0) : (file.content?.length || 0);
        const sha256Hash = crypto.createHash("sha256").update(file.content || file.binaryContent || "").digest("hex");

        const [inserted] = await db.insert(skillFiles)
          .values({
            versionId,
            path: file.path,
            content,
            binaryContent,
            isBinary,
            size,
            sha256: sha256Hash,
            mimeType: file.mimeType || getMimeType(file.path),
          })
          .onConflictDoUpdate({
            target: [skillFiles.versionId, skillFiles.path],
            set: { content, binaryContent, isBinary, size, sha256: sha256Hash, mimeType: file.mimeType || getMimeType(file.path) },
          })
          .returning();

        insertedFiles.push(inserted);
      }

      res.json({ message: "Files uploaded", files: insertedFiles });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ message: "Failed to upload files" });
    }
  });

  function getMimeType(path: string): string {
    const ext = path.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      md: "text/markdown",
      txt: "text/plain",
      js: "application/javascript",
      ts: "application/typescript",
      py: "text/x-python",
      json: "application/json",
      yaml: "text/yaml",
      yml: "text/yaml",
      sh: "application/x-sh",
      bash: "application/x-sh",
      html: "text/html",
      css: "text/css",
      svg: "image/svg+xml",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      pdf: "application/pdf",
    };
    return mimeTypes[ext || ""] || "application/octet-stream";
  }

  function isValidFilePath(filePath: string): boolean {
    if (!filePath || typeof filePath !== 'string') return false;
    const normalized = filePath.normalize();
    if (normalized.includes('..') || normalized.startsWith('/') || normalized.includes('\\')) return false;
    if (normalized.startsWith('.') && normalized !== '.gitkeep') return false;
    if (/[<>:"|?*\x00-\x1f]/.test(normalized)) return false;
    return true;
  }

  app.post("/api/skills", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
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
      const userId = (req.session as any)?.userId;
      const { skillId } = req.params;
      const { version, skillMd, readme, changelog, files } = req.body;

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

      // Insert additional files if provided (with path validation)
      if (files && Array.isArray(files)) {
        for (const file of files) {
          if (file.path && file.content && file.path !== "SKILL.md" && isValidFilePath(file.path)) {
            const content = file.content;
            const size = Buffer.byteLength(content, 'utf8');
            if (size > 1024 * 1024) continue; // Skip files > 1MB
            const ext = file.path.split('.').pop()?.toLowerCase() || '';
            const mimeType = getMimeType(ext);
            
            await db.insert(skillFiles)
              .values({
                versionId: newVersion.id,
                path: file.path,
                content,
                size,
                mimeType,
                isBinary: false,
              })
              .onConflictDoUpdate({
                target: [skillFiles.versionId, skillFiles.path],
                set: { content, size, mimeType },
              });
          }
        }
      }

      res.status(201).json(newVersion);
    } catch (error) {
      console.error("Error creating version:", error);
      res.status(500).json({ message: "Failed to create version" });
    }
  });

  app.post("/api/skills/:skillId/star", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
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
      const userId = (req.session as any)?.userId;
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
      const skillId = req.params.skillId as string;
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

  app.get("/api/skills/:skillId/comments", async (req: Request, res: Response) => {
    try {
      const skillId = req.params.skillId as string;
      
      const comments = await db.select({
        id: skillComments.id,
        content: skillComments.content,
        parentId: skillComments.parentId,
        isEdited: skillComments.isEdited,
        createdAt: skillComments.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          handle: users.handle,
          profileImageUrl: users.profileImageUrl,
        },
      })
        .from(skillComments)
        .leftJoin(users, eq(skillComments.userId, users.id))
        .where(eq(skillComments.skillId, skillId))
        .orderBy(desc(skillComments.createdAt));
      
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/skills/:skillId/comments", isAuthenticated, async (req: any, res: Response) => {
    try {
      const skillId = req.params.skillId as string;
      const userId = (req.session as any)?.userId;
      const { content, parentId } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "Comment content is required" });
      }

      if (content.length > 2000) {
        return res.status(400).json({ message: "Comment is too long (max 2000 characters)" });
      }

      const [comment] = await db.insert(skillComments)
        .values({ skillId, userId, content: content.trim(), parentId: parentId || null })
        .returning();

      await db.insert(skillActivities)
        .values({
          skillId,
          userId,
          action: "comment",
          details: { commentId: comment.id },
        });

      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.delete("/api/comments/:commentId", isAuthenticated, async (req: any, res: Response) => {
    try {
      const commentId = req.params.commentId as string;
      const userId = (req.session as any)?.userId;

      const [comment] = await db.select()
        .from(skillComments)
        .where(eq(skillComments.id, commentId))
        .limit(1);

      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      if (comment.userId !== userId) {
        return res.status(403).json({ message: "You can only delete your own comments" });
      }

      await db.delete(skillComments).where(eq(skillComments.id, commentId));

      res.json({ message: "Comment deleted" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  app.get("/api/my-skills", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      
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
      const userId = (req.session as any)?.userId;
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
      const userId = (req.session as any)?.userId;
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
      const userId = (req.session as any)?.userId;
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
      const handle = req.params.handle as string;
      
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
      const userId = (req.session as any)?.userId;
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
      const [downloadSum] = await db.select({ sum: sql<number>`coalesce(sum(downloads), 0)` }).from(skills);
      
      res.json({
        skills: Number(skillCount.count),
        users: Number(userCount.count),
        versions: Number(versionCount.count),
        downloads: Number(downloadSum.sum),
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
      const userId = (req.session as any)?.userId;
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
      const userId = (req.session as any)?.userId;
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
      const userId = (req.session as any)?.userId;
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
      const owner = Array.isArray(req.params.owner) ? req.params.owner[0] : req.params.owner;
      const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
      const { version, skillMd, readme, changelog, files } = req.body;

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

      // Insert additional files if provided (with path validation)
      if (files && Array.isArray(files)) {
        for (const file of files) {
          if (file.path && file.content && file.path !== "SKILL.md" && isValidFilePath(file.path)) {
            const content = file.content;
            const size = Buffer.byteLength(content, 'utf8');
            if (size > 1024 * 1024) continue; // Skip files > 1MB
            const ext = file.path.split('.').pop()?.toLowerCase() || '';
            const mimeType = getMimeType(ext);
            
            await db.insert(skillFiles)
              .values({
                versionId: newVersion.id,
                path: file.path,
                content,
                size,
                mimeType,
                isBinary: false,
              })
              .onConflictDoUpdate({
                target: [skillFiles.versionId, skillFiles.path],
                set: { content, size, mimeType },
              });
          }
        }
      }

      logActivity(skill[0].id, user.id, "publish", { version: newVersion.version });

      res.status(201).json({
        skill: { owner: user.handle, slug: skill[0].slug },
        version: newVersion.version,
        validation: validationResult,
        filesCount: (files?.length || 0) + 1,
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

  // Helper to get user's OpenAI API key
  async function getUserApiKey(req: Request): Promise<string | null> {
    const userId = (req.session as any)?.userId;
    if (!userId) return null;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return user?.openaiApiKey || null;
  }

  // AI-powered Skill Explainer
  app.post("/api/skills/explain", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { skillMd } = req.body;
      if (!skillMd) {
        return res.status(400).json({ message: "SKILL.md content is required" });
      }
      const apiKey = await getUserApiKey(req);
      if (!apiKey) {
        return res.status(400).json({ message: "OpenAI API key required. Add your key in Settings > AI." });
      }
      const explanation = await explainSkill(skillMd, apiKey);
      res.json(explanation);
    } catch (error: any) {
      console.error("Error explaining skill:", error);
      if (error?.status === 401) {
        return res.status(400).json({ message: "Invalid OpenAI API key. Please check your key in Settings > AI." });
      }
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
      const apiKey = await getUserApiKey(req);
      if (!apiKey) {
        return res.status(400).json({ message: "OpenAI API key required. Add your key in Settings > AI." });
      }
      const generated = await generateSkill(prompt, apiKey, { category, complexity });
      res.json(generated);
    } catch (error: any) {
      console.error("Error generating skill:", error);
      if (error?.status === 401) {
        return res.status(400).json({ message: "Invalid OpenAI API key. Please check your key in Settings > AI." });
      }
      res.status(500).json({ message: "Failed to generate skill" });
    }
  });

  // AI-powered Skill Chat (streaming)
  app.post("/api/skills/chat", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { skillMd, message, history } = req.body;
      if (!skillMd || !message) {
        return res.status(400).json({ message: "skillMd and message are required" });
      }
      const apiKey = await getUserApiKey(req);
      if (!apiKey) {
        return res.status(400).json({ message: "OpenAI API key required. Add your key in Settings > AI." });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const chatHistory: ChatMessage[] = history || [];
      const stream = chatAboutSkill(skillMd, message, apiKey, chatHistory);

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error("Error in skill chat:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to process chat" })}\n\n`);
        res.end();
      } else {
        if (error?.status === 401) {
          return res.status(400).json({ message: "Invalid OpenAI API key. Please check your key in Settings > AI." });
        }
        res.status(500).json({ message: "Failed to process chat" });
      }
    }
  });

  app.get("/api/cli/skills/:owner/:slug/install", async (req: Request, res: Response) => {
    try {
      const owner = req.params.owner as string;
      const slug = req.params.slug as string;
      const requestedVersion = req.query.version as string | undefined;
      
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

      // Get additional files for this version
      const versionFiles = await db.select({
        path: skillFiles.path,
        content: skillFiles.content,
        size: skillFiles.size,
        isBinary: skillFiles.isBinary,
      }).from(skillFiles).where(eq(skillFiles.versionId, versionData.id));

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
        files: versionFiles,
      });
    } catch (error) {
      console.error("Error installing skill:", error);
      res.status(500).json({ message: "Failed to install skill" });
    }
  });

  app.get("/api/cli/search", async (req: Request, res: Response) => {
    try {
      const { q, limit = "20" } = req.query;
      
      const conditions: any[] = [eq(skills.isPublic, true)];
      
      if (q) {
        conditions.push(
          or(
            ilike(skills.name, `%${q}%`),
            ilike(skills.description, `%${q}%`)
          )
        );
      }

      const result = await db.select({
        name: skills.name,
        slug: skills.slug,
        description: skills.description,
        stars: skills.stars,
        downloads: skills.downloads,
        owner: users.handle,
      })
      .from(skills)
      .leftJoin(users, eq(skills.ownerId, users.id))
      .where(and(...conditions))
      .orderBy(desc(skills.stars))
      .limit(parseInt(limit as string));

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to search" });
    }
  });

  // Download skill version as file
  app.get("/api/skills/:owner/:slug/download/:version?", async (req: Request, res: Response) => {
    try {
      const owner = req.params.owner as string;
      const slug = req.params.slug as string;
      const version = req.params.version as string | undefined;
      
      const [ownerUser] = await db.select().from(users).where(eq(users.handle, owner)).limit(1);
      if (!ownerUser) return res.status(404).json({ message: "User not found" });
      
      const [skill] = await db.select().from(skills).where(and(eq(skills.ownerId, ownerUser.id), eq(skills.slug, slug))).limit(1);
      if (!skill) return res.status(404).json({ message: "Skill not found" });
      
      let versionData;
      if (version && version !== "latest") {
        [versionData] = await db.select().from(skillVersions).where(and(eq(skillVersions.skillId, skill.id), eq(skillVersions.version, version))).limit(1);
      } else {
        [versionData] = await db.select().from(skillVersions).where(and(eq(skillVersions.skillId, skill.id), eq(skillVersions.isLatest, true))).limit(1);
      }
      
      if (!versionData) return res.status(404).json({ message: "Version not found" });
      
      res.setHeader("Content-Type", "text/markdown");
      res.setHeader("Content-Disposition", `attachment; filename="${skill.slug}-${versionData.version}.md"`);
      res.send(versionData.skillMd);
    } catch (error) {
      res.status(500).json({ message: "Failed to download skill" });
    }
  });

  // Download skill as ZIP with all files
  app.get("/api/skills/:owner/:slug/download-zip/:version?", async (req: Request, res: Response) => {
    try {
      const owner = req.params.owner as string;
      const slug = req.params.slug as string;
      const version = req.params.version as string | undefined;
      
      const [ownerUser] = await db.select().from(users).where(eq(users.handle, owner)).limit(1);
      if (!ownerUser) return res.status(404).json({ message: "User not found" });
      
      const [skill] = await db.select().from(skills).where(and(eq(skills.ownerId, ownerUser.id), eq(skills.slug, slug))).limit(1);
      if (!skill) return res.status(404).json({ message: "Skill not found" });
      
      let versionData;
      if (version && version !== "latest") {
        [versionData] = await db.select().from(skillVersions).where(and(eq(skillVersions.skillId, skill.id), eq(skillVersions.version, version))).limit(1);
      } else {
        [versionData] = await db.select().from(skillVersions).where(and(eq(skillVersions.skillId, skill.id), eq(skillVersions.isLatest, true))).limit(1);
      }
      
      if (!versionData) return res.status(404).json({ message: "Version not found" });
      
      // Get all files for this version
      const files = await db.select().from(skillFiles).where(eq(skillFiles.versionId, versionData.id));
      
      // Increment download count
      await db.update(skillVersions)
        .set({ downloads: sql`COALESCE(downloads, 0) + 1` })
        .where(eq(skillVersions.id, versionData.id));
      await db.update(skills)
        .set({ weeklyDownloads: sql`COALESCE(weekly_downloads, 0) + 1` })
        .where(eq(skills.id, skill.id));
      
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${skill.slug}-${versionData.version}.zip"`);
      
      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.pipe(res);
      
      // Add SKILL.md
      archive.append(versionData.skillMd, { name: "SKILL.md" });
      
      // Add all other files
      for (const file of files) {
        if (file.path !== "SKILL.md" && file.content) {
          archive.append(file.content, { name: file.path });
        }
      }
      
      await archive.finalize();
    } catch (error) {
      console.error("ZIP download error:", error);
      res.status(500).json({ message: "Failed to download skill" });
    }
  });

  // Fork a skill
  app.post("/api/skills/:id/fork", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      const id = req.params.id as string;
      
      const [originalSkill] = await db.select().from(skills).where(eq(skills.id, id)).limit(1);
      if (!originalSkill) return res.status(404).json({ message: "Skill not found" });
      
      const [latestVersion] = await db.select().from(skillVersions).where(and(eq(skillVersions.skillId, originalSkill.id), eq(skillVersions.isLatest, true))).limit(1);
      
      const [existing] = await db.select().from(skills).where(and(eq(skills.ownerId, userId), eq(skills.slug, originalSkill.slug))).limit(1);
      const newSlug = existing ? `${originalSkill.slug}-fork-${Date.now()}` : originalSkill.slug;
      
      const [forkedSkill] = await db.insert(skills).values({
        ownerId: userId,
        forkedFromId: originalSkill.id,
        name: originalSkill.name,
        slug: newSlug,
        description: originalSkill.description,
        license: originalSkill.license,
        tags: originalSkill.tags,
        dependencies: originalSkill.dependencies,
        isPublic: true,
      }).returning();
      
      if (latestVersion) {
        await db.insert(skillVersions).values({
          skillId: forkedSkill.id,
          version: "1.0.0",
          skillMd: latestVersion.skillMd,
          manifest: latestVersion.manifest,
          isLatest: true,
        });
      }
      
      await db.update(skills).set({ forks: sql`${skills.forks} + 1` }).where(eq(skills.id, originalSkill.id));
      logActivity(originalSkill.id, userId, "fork", { forkedToId: forkedSkill.id });
      
      const [ownerUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      res.json({ ...forkedSkill, owner: { handle: ownerUser?.handle } });
    } catch (error) {
      console.error("Fork error:", error);
      res.status(500).json({ message: "Failed to fork skill" });
    }
  });

  // Issues endpoints
  app.get("/api/skills/:id/issues", async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { state = "open" } = req.query;
      
      const issues = await db.query.skillIssues.findMany({
        where: state === "all" 
          ? eq(skillIssues.skillId, id)
          : and(eq(skillIssues.skillId, id), eq(skillIssues.state, state as string)),
        with: { author: true },
        orderBy: [desc(skillIssues.createdAt)],
      });
      
      res.json(issues);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch issues" });
    }
  });

  app.post("/api/skills/:id/issues", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      const id = req.params.id as string;
      const { title, body, labels } = req.body;
      
      if (!title || title.length < 3) return res.status(400).json({ message: "Title must be at least 3 characters" });
      
      const [maxNumber] = await db.select({ max: sql<number>`COALESCE(MAX(number), 0)` }).from(skillIssues).where(eq(skillIssues.skillId, id));
      const number = (maxNumber?.max || 0) + 1;
      
      const [issue] = await db.insert(skillIssues).values({
        skillId: id,
        authorId: userId,
        number,
        title,
        body: body || null,
        labels: labels || [],
      }).returning();
      
      logActivity(id, userId, "issue_opened", { issueNumber: number, title });
      res.json(issue);
    } catch (error) {
      console.error("Create issue error:", error);
      res.status(500).json({ message: "Failed to create issue" });
    }
  });

  app.get("/api/skills/:skillId/issues/:number", async (req: Request, res: Response) => {
    try {
      const skillId = req.params.skillId as string;
      const number = req.params.number as string;
      
      const [issue] = await db.query.skillIssues.findMany({
        where: and(eq(skillIssues.skillId, skillId), eq(skillIssues.number, parseInt(number))),
        with: { author: true, comments: { with: { author: true }, orderBy: [desc(issueComments.createdAt)] } },
        limit: 1,
      });
      
      if (!issue) return res.status(404).json({ message: "Issue not found" });
      res.json(issue);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch issue" });
    }
  });

  app.patch("/api/skills/:skillId/issues/:number", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      const skillId = req.params.skillId as string;
      const number = req.params.number as string;
      const { state, title, body } = req.body;
      
      const [issue] = await db.select().from(skillIssues).where(and(eq(skillIssues.skillId, skillId), eq(skillIssues.number, parseInt(number)))).limit(1);
      if (!issue) return res.status(404).json({ message: "Issue not found" });
      
      const [skill] = await db.select().from(skills).where(eq(skills.id, skillId)).limit(1);
      if (issue.authorId !== userId && skill?.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this issue" });
      }
      
      const updates: any = { updatedAt: new Date() };
      if (state) {
        updates.state = state;
        if (state === "closed") updates.closedAt = new Date();
      }
      if (title) updates.title = title;
      if (body !== undefined) updates.body = body;
      
      const [updated] = await db.update(skillIssues).set(updates).where(eq(skillIssues.id, issue.id)).returning();
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update issue" });
    }
  });

  app.post("/api/skills/:skillId/issues/:number/comments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      const skillId = req.params.skillId as string;
      const number = req.params.number as string;
      const { body } = req.body;
      
      if (!body || body.length < 1) return res.status(400).json({ message: "Comment body required" });
      
      const [issue] = await db.select().from(skillIssues).where(and(eq(skillIssues.skillId, skillId), eq(skillIssues.number, parseInt(number)))).limit(1);
      if (!issue) return res.status(404).json({ message: "Issue not found" });
      
      const [comment] = await db.insert(issueComments).values({
        issueId: issue.id,
        authorId: userId,
        body,
      }).returning();
      
      res.json(comment);
    } catch (error) {
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Pull requests endpoints
  app.get("/api/skills/:id/pulls", async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { state = "open" } = req.query;
      
      const prs = await db.query.skillPullRequests.findMany({
        where: state === "all" 
          ? eq(skillPullRequests.skillId, id)
          : and(eq(skillPullRequests.skillId, id), eq(skillPullRequests.state, state as string)),
        with: { author: true },
        orderBy: [desc(skillPullRequests.createdAt)],
      });
      
      res.json(prs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pull requests" });
    }
  });

  app.post("/api/skills/:id/pulls", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      const id = req.params.id as string;
      const { title, body, proposedSkillMd, baseVersion } = req.body;
      
      if (!title || title.length < 3) return res.status(400).json({ message: "Title must be at least 3 characters" });
      if (!proposedSkillMd) return res.status(400).json({ message: "Proposed SKILL.md content required" });
      
      const [maxNumber] = await db.select({ max: sql<number>`COALESCE(MAX(number), 0)` }).from(skillPullRequests).where(eq(skillPullRequests.skillId, id));
      const number = (maxNumber?.max || 0) + 1;
      
      const [pr] = await db.insert(skillPullRequests).values({
        skillId: id,
        authorId: userId,
        number,
        title,
        body: body || null,
        proposedSkillMd,
        baseVersion: baseVersion || null,
      }).returning();
      
      logActivity(id, userId, "pr_opened", { prNumber: number, title });
      res.json(pr);
    } catch (error) {
      console.error("Create PR error:", error);
      res.status(500).json({ message: "Failed to create pull request" });
    }
  });

  app.get("/api/skills/:skillId/pulls/:number", async (req: Request, res: Response) => {
    try {
      const skillId = req.params.skillId as string;
      const number = req.params.number as string;
      
      const [pr] = await db.query.skillPullRequests.findMany({
        where: and(eq(skillPullRequests.skillId, skillId), eq(skillPullRequests.number, parseInt(number))),
        with: { author: true, comments: { with: { author: true }, orderBy: [desc(prComments.createdAt)] } },
        limit: 1,
      });
      
      if (!pr) return res.status(404).json({ message: "Pull request not found" });
      res.json(pr);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pull request" });
    }
  });

  app.patch("/api/skills/:skillId/pulls/:number", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      const skillId = req.params.skillId as string;
      const number = req.params.number as string;
      const { state, title, body } = req.body;
      
      const [pr] = await db.select().from(skillPullRequests).where(and(eq(skillPullRequests.skillId, skillId), eq(skillPullRequests.number, parseInt(number)))).limit(1);
      if (!pr) return res.status(404).json({ message: "Pull request not found" });
      
      const [skill] = await db.select().from(skills).where(eq(skills.id, skillId)).limit(1);
      if (pr.authorId !== userId && skill?.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updates: any = { updatedAt: new Date() };
      if (state) {
        updates.state = state;
        if (state === "closed") updates.closedAt = new Date();
        if (state === "merged") updates.mergedAt = new Date();
      }
      if (title) updates.title = title;
      if (body !== undefined) updates.body = body;
      
      const [updated] = await db.update(skillPullRequests).set(updates).where(eq(skillPullRequests.id, pr.id)).returning();
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update pull request" });
    }
  });

  // Merge a PR (only skill owner can do this)
  app.post("/api/skills/:skillId/pulls/:number/merge", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      const skillId = req.params.skillId as string;
      const number = req.params.number as string;
      const { newVersion } = req.body;
      
      const [skill] = await db.select().from(skills).where(eq(skills.id, skillId)).limit(1);
      if (!skill || skill.ownerId !== userId) return res.status(403).json({ message: "Only skill owner can merge" });
      
      const [pr] = await db.select().from(skillPullRequests).where(and(eq(skillPullRequests.skillId, skillId), eq(skillPullRequests.number, parseInt(number)))).limit(1);
      if (!pr) return res.status(404).json({ message: "Pull request not found" });
      if (pr.state !== "open") return res.status(400).json({ message: "PR is not open" });
      
      await db.update(skillVersions).set({ isLatest: false }).where(eq(skillVersions.skillId, skillId));
      
      // Parse manifest from SKILL.md frontmatter
      let manifest: Record<string, any> = {};
      const fmMatch = pr.proposedSkillMd.match(/^---\n([\s\S]*?)\n---/);
      if (fmMatch) {
        try {
          const lines = fmMatch[1].split('\n');
          for (const line of lines) {
            const [key, ...rest] = line.split(':');
            if (key && rest.length) manifest[key.trim()] = rest.join(':').trim();
          }
        } catch {}
      }
      const validation = await validateSkillMd(pr.proposedSkillMd, manifest);
      const [newVersionRecord] = await db.insert(skillVersions).values({
        skillId,
        version: newVersion || "1.0.0",
        skillMd: pr.proposedSkillMd,
        isLatest: true,
      }).returning();
      
      await db.insert(skillValidations).values({
        versionId: newVersionRecord.id,
        status: validation.passed ? "passed" : "failed",
        score: validation.score,
        checks: validation.checks,
      });
      
      await db.update(skillPullRequests).set({ state: "merged", mergedAt: new Date(), updatedAt: new Date() }).where(eq(skillPullRequests.id, pr.id));
      
      logActivity(skillId, userId, "pr_merged", { prNumber: parseInt(number), newVersion });
      res.json({ message: "Pull request merged", version: newVersion });
    } catch (error) {
      console.error("Merge PR error:", error);
      res.status(500).json({ message: "Failed to merge pull request" });
    }
  });
}
