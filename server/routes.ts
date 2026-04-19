import type { Express, Request, Response, NextFunction } from "express";
import { supabase } from "./db.js";
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
  const { data: tokenRecord } = await supabase
    .from('api_tokens')
    .select('*')
    .eq('token', token)
    .eq('is_revoked', false)
    .maybeSingle();
  
  if (!tokenRecord) {
    return res.status(401).json({ message: "Invalid or revoked token" });
  }
  
  if (tokenRecord.expires_at && new Date(tokenRecord.expires_at) < new Date()) {
    return res.status(401).json({ message: "Token expired" });
  }
  
  await supabase
    .from('api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', tokenRecord.id);
  
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', tokenRecord.user_id)
    .maybeSingle();

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
    await supabase.from('skill_activities').insert({
      skill_id: skillId,
      user_id: userId,
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
      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);

      let query = supabase
        .from('skills_with_score')
        .select('*', paginated === "true" ? { count: 'exact' } : {})
        .eq('is_public', true);

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      if (verified === "true") {
        query = query.eq('is_verified', true);
      }

      if (sort === "stars") {
        query = query.order('stars', { ascending: false });
      } else if (sort === "downloads") {
        query = query.order('downloads', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      query = query.range(offsetNum, offsetNum + limitNum - 1);

      const { data, count } = await query;

      const result = (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        isVerified: s.is_verified,
        stars: s.stars,
        downloads: s.downloads,
        tags: s.tags,
        createdAt: s.created_at,
        validationScore: s.validation_score,
        owner: {
          id: s.owner_user_id,
          firstName: s.owner_first_name,
          lastName: s.owner_last_name,
          handle: s.owner_handle,
          profileImageUrl: s.owner_profile_image_url,
        },
      }));

      if (paginated === "true") {
        res.json({
          skills: result,
          total: count || 0,
          limit: limitNum,
          offset: offsetNum,
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
      
      const { data: existing } = await supabase
        .from('skill_stars')
        .select('id')
        .eq('skill_id', skillId)
        .eq('user_id', userId)
        .maybeSingle();

      res.json({ starred: !!existing });
    } catch (error) {
      res.json({ starred: false });
    }
  });

  app.get("/api/skills/:skillId/activity", async (req: Request, res: Response) => {
    try {
      const skillId = req.params.skillId as string;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const { data: activities } = await supabase
        .from('skill_activities')
        .select('id, action, details, created_at, user:users!user_id(first_name, last_name, handle, profile_image_url)')
        .eq('skill_id', skillId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      res.json(activities || []);
    } catch (error) {
      res.json([]);
    }
  });

  app.get("/api/skills/:skillId/comments", async (req: Request, res: Response) => {
    try {
      const skillId = req.params.skillId as string;
      
      const { data: comments } = await supabase
        .from('skill_comments')
        .select('id, content, parent_id, is_edited, created_at, user:users!user_id(id, first_name, last_name, handle, profile_image_url)')
        .eq('skill_id', skillId)
        .order('created_at', { ascending: false });
      
      res.json(comments || []);
    } catch (error) {
      res.json([]);
    }
  });

  app.get("/api/skills/:skillId/pulls", async (req: Request, res: Response) => {
    try {
      const skillId = req.params.skillId as string;
      const { state = "open" } = req.query;
      
      let query = supabase
        .from('skill_pull_requests')
        .select('*, author:users!author_id(*)')
        .eq('skill_id', skillId);

      if (state !== "all") {
        query = query.eq('state', state as string);
      }

      const { data: prs } = await query.order('created_at', { ascending: false });
      
      res.json(prs || []);
    } catch (error) {
      res.json([]);
    }
  });

  app.get("/api/skills/:skillId/issues", async (req: Request, res: Response) => {
    try {
      const skillId = req.params.skillId as string;
      const { state = "open" } = req.query;
      
      let query = supabase
        .from('skill_issues')
        .select('*, author:users!author_id(*)')
        .eq('skill_id', skillId);

      if (state !== "all") {
        query = query.eq('state', state as string);
      }

      const { data: issues } = await query.order('created_at', { ascending: false });
      
      res.json(issues || []);
    } catch (error) {
      res.json([]);
    }
  });

  // Delete skill (owner only)
  app.delete("/api/skills/:skillId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      const skillId = req.params.skillId as string;
      
      const { data: skill } = await supabase
        .from('skills')
        .select('*')
        .eq('id', skillId)
        .maybeSingle();

      if (!skill) return res.status(404).json({ message: "Skill not found" });
      if (skill.owner_id !== userId) return res.status(403).json({ message: "Not authorized to delete this skill" });
      
      await supabase.from('skills').delete().eq('id', skillId);
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
      
      const { data: latestVersion } = await supabase
        .from('skill_versions')
        .select('*')
        .eq('skill_id', skillId)
        .eq('is_latest', true)
        .maybeSingle();
      
      if (!latestVersion) {
        return res.status(404).json({ message: "No version found for this skill" });
      }
      
      let manifest: Record<string, any> = {};
      const fmMatch = latestVersion.skill_md.match(/^---\n([\s\S]*?)\n---/);
      if (fmMatch) {
        try {
          const lines = fmMatch[1].split('\n');
          for (const line of lines) {
            const [key, ...rest] = line.split(':');
            if (key && rest.length) manifest[key.trim()] = rest.join(':').trim();
          }
        } catch {}
      }
      
      const validationResult = await validateSkillMd(latestVersion.skill_md, manifest);
      
      await supabase.from('skill_validations').delete().eq('version_id', latestVersion.id);
      await supabase.from('skill_validations').insert({
        version_id: latestVersion.id,
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
      
      const { data: ownerUser } = await supabase
        .from('users')
        .select('*')
        .or(`handle.eq.${owner},id.eq.${owner}`)
        .limit(1)
        .maybeSingle();
      
      if (!ownerUser) {
        return res.status(404).json({ message: "Skill not found" });
      }

      const { data: skill } = await supabase
        .from('skills')
        .select('*, owner:users!owner_id(id, first_name, last_name, handle, profile_image_url)')
        .eq('owner_id', ownerUser.id)
        .eq('slug', slug)
        .maybeSingle();

      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }

      const { data: versions } = await supabase
        .from('skill_versions')
        .select('*, validations:skill_validations(*)')
        .eq('skill_id', skill.id)
        .order('published_at', { ascending: false });

      const versionsWithValidations = (versions || []).map((v: any) => {
        const sorted = (v.validations || []).sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        return { ...v, validations: sorted.slice(0, 1) };
      });

      res.json({ ...skill, versions: versionsWithValidations });
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
      
      const { data: ownerUser } = await supabase
        .from('users')
        .select('*')
        .or(`handle.eq.${owner},id.eq.${owner}`)
        .limit(1)
        .maybeSingle();
      
      if (!ownerUser) {
        return res.status(404).json({ message: "Version not found" });
      }

      const { data: skill } = await supabase
        .from('skills')
        .select('*')
        .eq('owner_id', ownerUser.id)
        .eq('slug', slug)
        .maybeSingle();

      if (!skill) {
        return res.status(404).json({ message: "Version not found" });
      }

      const { data: versionData } = await supabase
        .from('skill_versions')
        .select('*, validations:skill_validations(*)')
        .eq('skill_id', skill.id)
        .eq('version', version)
        .maybeSingle();

      if (!versionData) {
        return res.status(404).json({ message: "Version not found" });
      }

      const sortedValidations = (versionData.validations || []).sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const { validations, ...rest } = versionData;
      res.json({ ...rest, validation: sortedValidations[0] || null });
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

      const { data: ownerUser } = await supabase
        .from('users')
        .select('*')
        .or(`handle.eq.${owner},id.eq.${owner}`)
        .limit(1)
        .maybeSingle();

      if (!ownerUser) {
        return res.status(404).json({ message: "Skill not found" });
      }

      const { data: skill } = await supabase
        .from('skills')
        .select('*')
        .eq('owner_id', ownerUser.id)
        .eq('slug', slug)
        .maybeSingle();

      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }

      let versionData;
      if (version) {
        const { data } = await supabase
          .from('skill_versions')
          .select('*')
          .eq('skill_id', skill.id)
          .eq('version', version)
          .maybeSingle();
        versionData = data;
      } else {
        const { data } = await supabase
          .from('skill_versions')
          .select('*')
          .eq('skill_id', skill.id)
          .order('published_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        versionData = data;
      }

      if (!versionData) {
        return res.status(404).json({ message: "Version not found" });
      }

      const { data: files } = await supabase
        .from('skill_files')
        .select('id, path, size, is_binary, mime_type, sha256, created_at')
        .eq('version_id', versionData.id)
        .order('path');

      const allFiles = (files && files.length > 0) ? files : [{
        id: versionData.id,
        path: "SKILL.md",
        size: versionData.skill_md?.length || 0,
        is_binary: false,
        mime_type: "text/markdown",
        sha256: null,
        created_at: versionData.created_at,
      }];

      res.json({ 
        version: versionData.version, 
        files: allFiles,
        totalFiles: allFiles.length,
        totalSize: allFiles.reduce((sum: number, f: any) => sum + (f.size || 0), 0),
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

      const { data: ownerUser } = await supabase
        .from('users')
        .select('*')
        .or(`handle.eq.${owner},id.eq.${owner}`)
        .limit(1)
        .maybeSingle();

      if (!ownerUser) {
        return res.status(404).json({ message: "Skill not found" });
      }

      const { data: skill } = await supabase
        .from('skills')
        .select('*')
        .eq('owner_id', ownerUser.id)
        .eq('slug', slug)
        .maybeSingle();

      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }

      let versionData;
      if (version) {
        const { data } = await supabase
          .from('skill_versions')
          .select('*')
          .eq('skill_id', skill.id)
          .eq('version', version)
          .maybeSingle();
        versionData = data;
      } else {
        const { data } = await supabase
          .from('skill_versions')
          .select('*')
          .eq('skill_id', skill.id)
          .order('published_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        versionData = data;
      }

      if (!versionData) {
        return res.status(404).json({ message: "Version not found" });
      }

      if (filePath === "SKILL.md" || filePath === "skill.md") {
        return res.json({
          path: "SKILL.md",
          content: versionData.skill_md,
          size: versionData.skill_md?.length || 0,
          isBinary: false,
          mimeType: "text/markdown",
        });
      }

      const { data: file } = await supabase
        .from('skill_files')
        .select('*')
        .eq('version_id', versionData.id)
        .eq('path', filePath)
        .maybeSingle();

      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      res.json({
        path: file.path,
        content: file.is_binary ? null : file.content,
        binaryContent: file.is_binary ? file.binary_content : null,
        size: file.size,
        isBinary: file.is_binary,
        mimeType: file.mime_type,
        sha256: file.sha256,
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

      const { data: skill } = await supabase
        .from('skills')
        .select('*')
        .eq('id', skillId)
        .maybeSingle();

      if (!skill || skill.owner_id !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const { data: versionRecord } = await supabase
        .from('skill_versions')
        .select('*')
        .eq('id', versionId)
        .eq('skill_id', skillId)
        .maybeSingle();

      if (!versionRecord) {
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

        const { data: inserted } = await supabase
          .from('skill_files')
          .upsert({
            version_id: versionId,
            path: file.path,
            content,
            binary_content: binaryContent,
            is_binary: isBinary,
            size,
            sha256: sha256Hash,
            mime_type: file.mimeType || getMimeType(file.path),
          }, { onConflict: 'version_id,path' })
          .select()
          .single();

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

      const { data: existing } = await supabase
        .from('skills')
        .select('id')
        .eq('owner_id', userId)
        .eq('slug', slug)
        .maybeSingle();

      if (existing) {
        return res.status(409).json({ message: "A skill with this slug already exists" });
      }

      const { data: skill } = await supabase
        .from('skills')
        .insert({ owner_id: userId, name, slug, description, is_public: isPublic, tags })
        .select()
        .single();

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

      const { data: skill } = await supabase
        .from('skills')
        .select('*')
        .eq('id', skillId)
        .eq('owner_id', userId)
        .maybeSingle();

      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }

      if (!version || !skillMd) {
        return res.status(400).json({ message: "Version and SKILL.md content are required" });
      }

      const { data: existingVersion } = await supabase
        .from('skill_versions')
        .select('id')
        .eq('skill_id', skillId)
        .eq('version', version)
        .maybeSingle();

      if (existingVersion) {
        return res.status(409).json({ message: "This version already exists" });
      }

      const parsed = matter(skillMd);
      const manifest = parsed.data as Record<string, any>;

      await supabase
        .from('skill_versions')
        .update({ is_latest: false })
        .eq('skill_id', skillId);

      const { data: newVersion } = await supabase
        .from('skill_versions')
        .insert({
          skill_id: skillId,
          version,
          skill_md: skillMd,
          manifest,
          readme,
          changelog,
          is_latest: true,
        })
        .select()
        .single();

      if (manifest.name) {
        await supabase
          .from('skills')
          .update({ name: manifest.name, description: manifest.description, updated_at: new Date().toISOString() })
          .eq('id', skillId);
      }

      const validationResult = await validateSkillMd(skillMd, manifest);
      
      await supabase.from('skill_validations').insert({
        version_id: newVersion.id,
        status: validationResult.passed ? "passed" : "failed",
        score: validationResult.score,
        checks: validationResult.checks,
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
      });

      if (files && Array.isArray(files)) {
        for (const file of files) {
          if (file.path && file.content && file.path !== "SKILL.md" && isValidFilePath(file.path)) {
            const content = file.content;
            const size = Buffer.byteLength(content, 'utf8');
            if (size > 1024 * 1024) continue;
            const ext = file.path.split('.').pop()?.toLowerCase() || '';
            const mimeType = getMimeType(ext);
            
            await supabase
              .from('skill_files')
              .upsert({
                version_id: newVersion.id,
                path: file.path,
                content,
                size,
                mime_type: mimeType,
                is_binary: false,
              }, { onConflict: 'version_id,path' });
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

      const { data: existing } = await supabase
        .from('skill_stars')
        .select('id')
        .eq('skill_id', skillId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        await supabase.from('skill_stars').delete().eq('skill_id', skillId).eq('user_id', userId);
        await supabase.rpc('decrement_skill_stars', { p_skill_id: skillId });
        logActivity(skillId, userId, "unstar");
        return res.json({ starred: false });
      }

      await supabase.from('skill_stars').insert({ skill_id: skillId, user_id: userId });
      await supabase.rpc('increment_skill_stars', { p_skill_id: skillId });
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
      
      const { data } = await supabase
        .from('skills_trending')
        .select('*')
        .eq('is_public', true)
        .eq('is_archived', false)
        .order('trending_score', { ascending: false })
        .limit(limit);

      const result = (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        isVerified: s.is_verified,
        stars: s.stars,
        downloads: s.downloads,
        weeklyDownloads: s.weekly_downloads,
        tags: s.tags,
        license: s.license,
        createdAt: s.created_at,
        validationScore: s.validation_score,
        owner: {
          id: s.owner_user_id,
          firstName: s.owner_first_name,
          lastName: s.owner_last_name,
          handle: s.owner_handle,
          profileImageUrl: s.owner_profile_image_url,
        },
      }));

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

      const { data: existing } = await supabase
        .from('skill_stars')
        .select('id')
        .eq('skill_id', skillId)
        .eq('user_id', userId)
        .maybeSingle();

      res.json({ starred: !!existing });
    } catch (error) {
      res.status(500).json({ message: "Failed to check star status" });
    }
  });

  app.get("/api/skills/:skillId/activity", async (req: Request, res: Response) => {
    try {
      const skillId = req.params.skillId as string;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const { data: activities } = await supabase
        .from('skill_activities')
        .select('id, action, details, created_at, user:users!user_id(first_name, last_name, handle, profile_image_url)')
        .eq('skill_id', skillId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      res.json(activities || []);
    } catch (error) {
      console.error("Error fetching skill activity:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  app.get("/api/skills/:skillId/comments", async (req: Request, res: Response) => {
    try {
      const skillId = req.params.skillId as string;
      
      const { data: comments } = await supabase
        .from('skill_comments')
        .select('id, content, parent_id, is_edited, created_at, user:users!user_id(id, first_name, last_name, handle, profile_image_url)')
        .eq('skill_id', skillId)
        .order('created_at', { ascending: false });
      
      res.json(comments || []);
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

      const { data: comment } = await supabase
        .from('skill_comments')
        .insert({ skill_id: skillId, user_id: userId, content: content.trim(), parent_id: parentId || null })
        .select()
        .single();

      await supabase.from('skill_activities').insert({
        skill_id: skillId,
        user_id: userId,
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

      const { data: comment } = await supabase
        .from('skill_comments')
        .select('*')
        .eq('id', commentId)
        .maybeSingle();

      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      if (comment.user_id !== userId) {
        return res.status(403).json({ message: "You can only delete your own comments" });
      }

      await supabase.from('skill_comments').delete().eq('id', commentId);

      res.json({ message: "Comment deleted" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  app.get("/api/my-skills", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      
      const { data: result } = await supabase
        .from('skills')
        .select('*')
        .eq('owner_id', userId)
        .order('updated_at', { ascending: false });

      res.json(result || []);
    } catch (error) {
      console.error("Error fetching user skills:", error);
      res.status(500).json({ message: "Failed to fetch skills" });
    }
  });

  app.get("/api/my-stars", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const { data: starred } = await supabase
        .from('skill_stars')
        .select('created_at, skill:skills!skill_id(id, name, slug, description, stars, downloads, owner_id, is_public, created_at, updated_at, owner:users!owner_id(id, handle))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      const result = (starred || []).map((s: any) => ({
        id: s.skill.id,
        name: s.skill.name,
        slug: s.skill.slug,
        description: s.skill.description,
        stars: s.skill.stars,
        downloads: s.skill.downloads,
        ownerId: s.skill.owner_id,
        isPublic: s.skill.is_public,
        createdAt: s.skill.created_at,
        updatedAt: s.skill.updated_at,
        owner: { id: s.skill.owner_id, handle: s.skill.owner?.handle },
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

      const { data: skill } = await supabase
        .from('skills')
        .select('id')
        .eq('id', skillId)
        .eq('owner_id', userId)
        .maybeSingle();

      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }

      const { data: updated } = await supabase
        .from('skills')
        .update({ name, description, is_public: isPublic, tags, homepage, updated_at: new Date().toISOString() })
        .eq('id', skillId)
        .select()
        .single();

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

      const { data: skill } = await supabase
        .from('skills')
        .select('id')
        .eq('id', skillId)
        .eq('owner_id', userId)
        .maybeSingle();

      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }

      await supabase.from('skills').delete().eq('id', skillId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting skill:", error);
      res.status(500).json({ message: "Failed to delete skill" });
    }
  });

  app.get("/api/users/:handle", async (req: Request, res: Response) => {
    try {
      const handle = req.params.handle as string;
      
      const { data: user } = await supabase
        .from('users')
        .select('id, handle, first_name, last_name, profile_image_url, bio, created_at')
        .or(`handle.eq.${handle},id.eq.${handle}`)
        .limit(1)
        .maybeSingle();

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { data: userSkills } = await supabase
        .from('skills')
        .select('*')
        .eq('owner_id', user.id)
        .eq('is_public', true)
        .order('stars', { ascending: false });

      res.json({ ...user, skills: userSkills || [] });
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

        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('handle', handle)
          .neq('id', userId)
          .maybeSingle();
        
        if (existing) {
          return res.status(409).json({ message: "Handle already taken" });
        }
      }

      if (bio && bio.length > 500) {
        return res.status(400).json({ message: "Bio must be 500 characters or less" });
      }

      const { data: updated } = await supabase
        .from('users')
        .update({ handle, bio, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      res.json(updated);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get("/api/stats", async (_req: Request, res: Response) => {
    try {
      const { count: skillCount } = await supabase.from('skills').select('*', { count: 'exact', head: true });
      const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: versionCount } = await supabase.from('skill_versions').select('*', { count: 'exact', head: true });
      const { data: dlData } = await supabase.from('skills').select('downloads');
      const downloadSum = (dlData || []).reduce((sum: number, s: any) => sum + (s.downloads || 0), 0);
      
      res.json({
        skills: skillCount || 0,
        users: userCount || 0,
        versions: versionCount || 0,
        downloads: downloadSum,
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
      const { data: tokens } = await supabase
        .from('api_tokens')
        .select('id, name, scopes, last_used_at, expires_at, created_at')
        .eq('user_id', userId)
        .eq('is_revoked', false)
        .order('created_at', { ascending: false });

      res.json(tokens || []);
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
      const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString() : null;

      const { data: created } = await supabase
        .from('api_tokens')
        .insert({ user_id: userId, name, token, scopes, expires_at: expiresAt })
        .select()
        .single();

      res.status(201).json({
        id: created.id,
        name: created.name,
        token: created.token,
        scopes: created.scopes,
        expiresAt: created.expires_at,
        createdAt: created.created_at,
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

      const { data: token } = await supabase
        .from('api_tokens')
        .select('id')
        .eq('id', tokenId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!token) {
        return res.status(404).json({ message: "Token not found" });
      }

      await supabase
        .from('api_tokens')
        .update({ is_revoked: true })
        .eq('id', tokenId);

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
      firstName: user.first_name,
      lastName: user.last_name,
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

      const { data: existing } = await supabase
        .from('skills')
        .select('id')
        .eq('owner_id', user.id)
        .eq('slug', slug)
        .maybeSingle();

      if (existing) {
        return res.status(409).json({ message: "A skill with this slug already exists" });
      }

      const { data: skill } = await supabase
        .from('skills')
        .insert({ owner_id: user.id, name, slug, description, is_public: isPublic, tags })
        .select()
        .single();

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

      const { data: existingSkill } = await supabase
        .from('skills')
        .select('*')
        .eq('owner_id', user.id)
        .eq('slug', slug)
        .maybeSingle();

      let skill = existingSkill;

      if (!skill) {
        const parsed = matter(skillMd);
        const manifest = parsed.data as Record<string, any>;
        const { data: newSkill } = await supabase
          .from('skills')
          .insert({
            owner_id: user.id,
            name: manifest.name || slug,
            slug,
            description: manifest.description || "",
            is_public: true,
            tags: manifest.tags || [],
          })
          .select()
          .single();
        skill = newSkill;
      }

      if (!version || !skillMd) {
        return res.status(400).json({ message: "Version and SKILL.md content are required" });
      }

      const { data: existingVersion } = await supabase
        .from('skill_versions')
        .select('id')
        .eq('skill_id', skill.id)
        .eq('version', version)
        .maybeSingle();

      if (existingVersion) {
        return res.status(409).json({ message: "This version already exists" });
      }

      const parsed = matter(skillMd);
      const manifest = parsed.data as Record<string, any>;

      await supabase
        .from('skill_versions')
        .update({ is_latest: false })
        .eq('skill_id', skill.id);

      const { data: newVersion } = await supabase
        .from('skill_versions')
        .insert({
          skill_id: skill.id,
          version,
          skill_md: skillMd,
          manifest,
          readme,
          changelog,
          is_latest: true,
        })
        .select()
        .single();

      if (manifest.name) {
        await supabase
          .from('skills')
          .update({ name: manifest.name, description: manifest.description, updated_at: new Date().toISOString() })
          .eq('id', skill.id);
      }

      const validationResult = await validateSkillMd(skillMd, manifest);
      
      await supabase.from('skill_validations').insert({
        version_id: newVersion.id,
        status: validationResult.passed ? "passed" : "failed",
        score: validationResult.score,
        checks: validationResult.checks,
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
      });

      if (files && Array.isArray(files)) {
        for (const file of files) {
          if (file.path && file.content && file.path !== "SKILL.md" && isValidFilePath(file.path)) {
            const content = file.content;
            const size = Buffer.byteLength(content, 'utf8');
            if (size > 1024 * 1024) continue;
            const ext = file.path.split('.').pop()?.toLowerCase() || '';
            const mimeType = getMimeType(ext);
            
            await supabase
              .from('skill_files')
              .upsert({
                version_id: newVersion.id,
                path: file.path,
                content,
                size,
                mime_type: mimeType,
                is_binary: false,
              }, { onConflict: 'version_id,path' });
          }
        }
      }

      logActivity(skill.id, user.id, "publish", { version: newVersion.version });

      res.status(201).json({
        skill: { owner: user.handle, slug: skill.slug },
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

  async function getUserApiKey(req: Request): Promise<string | null> {
    const userId = (req.session as any)?.userId;
    if (!userId) return null;
    const { data: user } = await supabase
      .from('users')
      .select('openai_api_key')
      .eq('id', userId)
      .maybeSingle();
    return user?.openai_api_key || null;
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
      
      const { data: ownerUser } = await supabase
        .from('users')
        .select('*')
        .or(`handle.eq.${owner},id.eq.${owner}`)
        .limit(1)
        .maybeSingle();
      
      if (!ownerUser) {
        return res.status(404).json({ message: "Skill not found" });
      }

      const { data: skill } = await supabase
        .from('skills')
        .select('*')
        .eq('owner_id', ownerUser.id)
        .eq('slug', slug)
        .maybeSingle();

      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }

      let versionData;
      if (requestedVersion && requestedVersion !== "latest") {
        const { data } = await supabase
          .from('skill_versions')
          .select('*')
          .eq('skill_id', skill.id)
          .eq('version', requestedVersion as string)
          .maybeSingle();
        versionData = data;
      } else {
        const { data } = await supabase
          .from('skill_versions')
          .select('*')
          .eq('skill_id', skill.id)
          .eq('is_latest', true)
          .maybeSingle();
        versionData = data;
      }

      if (!versionData) {
        return res.status(404).json({ message: "Version not found" });
      }

      await supabase.rpc('increment_skill_downloads', { p_skill_id: skill.id });
      await supabase.rpc('increment_version_downloads', { p_version_id: versionData.id });

      logActivity(skill.id, null, "install", { version: versionData.version });

      const { data: versionFiles } = await supabase
        .from('skill_files')
        .select('path, content, size, is_binary')
        .eq('version_id', versionData.id);

      res.json({
        skill: {
          name: skill.name,
          slug: skill.slug,
          owner: ownerUser.handle,
        },
        version: versionData.version,
        skillMd: versionData.skill_md,
        manifest: versionData.manifest,
        readme: versionData.readme,
        files: versionFiles || [],
      });
    } catch (error) {
      console.error("Error installing skill:", error);
      res.status(500).json({ message: "Failed to install skill" });
    }
  });

  app.get("/api/cli/search", async (req: Request, res: Response) => {
    try {
      const { q, limit = "20" } = req.query;
      
      let query = supabase
        .from('skills')
        .select('name, slug, description, stars, downloads, owner:users!owner_id(handle)')
        .eq('is_public', true);
      
      if (q) {
        query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
      }

      const { data: result } = await query
        .order('stars', { ascending: false })
        .limit(parseInt(limit as string));

      res.json(result || []);
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
      
      const { data: ownerUser } = await supabase
        .from('users')
        .select('*')
        .eq('handle', owner)
        .maybeSingle();
      if (!ownerUser) return res.status(404).json({ message: "User not found" });
      
      const { data: skill } = await supabase
        .from('skills')
        .select('*')
        .eq('owner_id', ownerUser.id)
        .eq('slug', slug)
        .maybeSingle();
      if (!skill) return res.status(404).json({ message: "Skill not found" });
      
      let versionData;
      if (version && version !== "latest") {
        const { data } = await supabase
          .from('skill_versions')
          .select('*')
          .eq('skill_id', skill.id)
          .eq('version', version)
          .maybeSingle();
        versionData = data;
      } else {
        const { data } = await supabase
          .from('skill_versions')
          .select('*')
          .eq('skill_id', skill.id)
          .eq('is_latest', true)
          .maybeSingle();
        versionData = data;
      }
      
      if (!versionData) return res.status(404).json({ message: "Version not found" });
      
      await supabase.rpc('increment_skill_downloads', { p_skill_id: skill.id });
      logActivity(skill.id, null, "download", { version: versionData.version, format: "md" });

      res.setHeader("Content-Type", "text/markdown");
      res.setHeader("Content-Disposition", `attachment; filename="${skill.slug}-${versionData.version}.md"`);
      res.send(versionData.skill_md);
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
      
      const { data: ownerUser } = await supabase
        .from('users')
        .select('*')
        .eq('handle', owner)
        .maybeSingle();
      if (!ownerUser) return res.status(404).json({ message: "User not found" });
      
      const { data: skill } = await supabase
        .from('skills')
        .select('*')
        .eq('owner_id', ownerUser.id)
        .eq('slug', slug)
        .maybeSingle();
      if (!skill) return res.status(404).json({ message: "Skill not found" });
      
      let versionData;
      if (version && version !== "latest") {
        const { data } = await supabase
          .from('skill_versions')
          .select('*')
          .eq('skill_id', skill.id)
          .eq('version', version)
          .maybeSingle();
        versionData = data;
      } else {
        const { data } = await supabase
          .from('skill_versions')
          .select('*')
          .eq('skill_id', skill.id)
          .eq('is_latest', true)
          .maybeSingle();
        versionData = data;
      }
      
      if (!versionData) return res.status(404).json({ message: "Version not found" });
      
      const { data: files } = await supabase
        .from('skill_files')
        .select('*')
        .eq('version_id', versionData.id);
      
      await supabase.rpc('increment_version_downloads', { p_version_id: versionData.id });
      await supabase.rpc('increment_skill_downloads', { p_skill_id: skill.id });
      logActivity(skill.id, null, "download", { version: versionData.version, format: "zip" });
      
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${skill.slug}-${versionData.version}.zip"`);
      
      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.pipe(res);
      
      archive.append(versionData.skill_md, { name: "SKILL.md" });
      
      for (const file of (files || [])) {
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
      
      const { data: originalSkill } = await supabase
        .from('skills')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!originalSkill) return res.status(404).json({ message: "Skill not found" });
      
      const { data: latestVersion } = await supabase
        .from('skill_versions')
        .select('*')
        .eq('skill_id', originalSkill.id)
        .eq('is_latest', true)
        .maybeSingle();
      
      const { data: existingFork } = await supabase
        .from('skills')
        .select('id')
        .eq('owner_id', userId)
        .eq('slug', originalSkill.slug)
        .maybeSingle();

      const newSlug = existingFork ? `${originalSkill.slug}-fork-${Date.now()}` : originalSkill.slug;
      
      const { data: forkedSkill } = await supabase
        .from('skills')
        .insert({
          owner_id: userId,
          forked_from_id: originalSkill.id,
          name: originalSkill.name,
          slug: newSlug,
          description: originalSkill.description,
          license: originalSkill.license,
          tags: originalSkill.tags,
          dependencies: originalSkill.dependencies,
          is_public: true,
        })
        .select()
        .single();
      
      if (latestVersion) {
        await supabase.from('skill_versions').insert({
          skill_id: forkedSkill.id,
          version: "1.0.0",
          skill_md: latestVersion.skill_md,
          manifest: latestVersion.manifest,
          is_latest: true,
        });
      }
      
      await supabase.rpc('increment_skill_forks', { p_skill_id: originalSkill.id });
      logActivity(originalSkill.id, userId, "fork", { forkedToId: forkedSkill.id });
      
      const { data: ownerUser } = await supabase
        .from('users')
        .select('handle')
        .eq('id', userId)
        .maybeSingle();

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
      
      let query = supabase
        .from('skill_issues')
        .select('*, author:users!author_id(*)')
        .eq('skill_id', id);

      if (state !== "all") {
        query = query.eq('state', state as string);
      }

      const { data: issues } = await query.order('created_at', { ascending: false });
      
      res.json(issues || []);
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
      
      const { data: maxIssue } = await supabase
        .from('skill_issues')
        .select('number')
        .eq('skill_id', id)
        .order('number', { ascending: false })
        .limit(1)
        .maybeSingle();
      const number = (maxIssue?.number || 0) + 1;
      
      const { data: issue } = await supabase
        .from('skill_issues')
        .insert({
          skill_id: id,
          author_id: userId,
          number,
          title,
          body: body || null,
          labels: labels || [],
        })
        .select()
        .single();
      
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
      
      const { data: issue } = await supabase
        .from('skill_issues')
        .select('*, author:users!author_id(*), comments:issue_comments(*, author:users!author_id(*))')
        .eq('skill_id', skillId)
        .eq('number', parseInt(number))
        .maybeSingle();
      
      if (!issue) return res.status(404).json({ message: "Issue not found" });

      if (issue.comments) {
        issue.comments.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }

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
      
      const { data: issue } = await supabase
        .from('skill_issues')
        .select('*')
        .eq('skill_id', skillId)
        .eq('number', parseInt(number))
        .maybeSingle();
      if (!issue) return res.status(404).json({ message: "Issue not found" });
      
      const { data: skill } = await supabase
        .from('skills')
        .select('owner_id')
        .eq('id', skillId)
        .maybeSingle();
      if (issue.author_id !== userId && skill?.owner_id !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this issue" });
      }
      
      const updates: any = { updated_at: new Date().toISOString() };
      if (state) {
        updates.state = state;
        if (state === "closed") updates.closed_at = new Date().toISOString();
      }
      if (title) updates.title = title;
      if (body !== undefined) updates.body = body;
      
      const { data: updated } = await supabase
        .from('skill_issues')
        .update(updates)
        .eq('id', issue.id)
        .select()
        .single();
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
      
      const { data: issue } = await supabase
        .from('skill_issues')
        .select('id')
        .eq('skill_id', skillId)
        .eq('number', parseInt(number))
        .maybeSingle();
      if (!issue) return res.status(404).json({ message: "Issue not found" });
      
      const { data: comment } = await supabase
        .from('issue_comments')
        .insert({
          issue_id: issue.id,
          author_id: userId,
          body,
        })
        .select()
        .single();
      
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
      
      let query = supabase
        .from('skill_pull_requests')
        .select('*, author:users!author_id(*)')
        .eq('skill_id', id);

      if (state !== "all") {
        query = query.eq('state', state as string);
      }

      const { data: prs } = await query.order('created_at', { ascending: false });
      
      res.json(prs || []);
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
      
      const { data: maxPr } = await supabase
        .from('skill_pull_requests')
        .select('number')
        .eq('skill_id', id)
        .order('number', { ascending: false })
        .limit(1)
        .maybeSingle();
      const number = (maxPr?.number || 0) + 1;
      
      const { data: pr } = await supabase
        .from('skill_pull_requests')
        .insert({
          skill_id: id,
          author_id: userId,
          number,
          title,
          body: body || null,
          proposed_skill_md: proposedSkillMd,
          base_version: baseVersion || null,
        })
        .select()
        .single();
      
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
      
      const { data: pr } = await supabase
        .from('skill_pull_requests')
        .select('*, author:users!author_id(*), comments:pr_comments(*, author:users!author_id(*))')
        .eq('skill_id', skillId)
        .eq('number', parseInt(number))
        .maybeSingle();
      
      if (!pr) return res.status(404).json({ message: "Pull request not found" });

      if (pr.comments) {
        pr.comments.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }

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
      
      const { data: pr } = await supabase
        .from('skill_pull_requests')
        .select('*')
        .eq('skill_id', skillId)
        .eq('number', parseInt(number))
        .maybeSingle();
      if (!pr) return res.status(404).json({ message: "Pull request not found" });
      
      const { data: skill } = await supabase
        .from('skills')
        .select('owner_id')
        .eq('id', skillId)
        .maybeSingle();
      if (pr.author_id !== userId && skill?.owner_id !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updates: any = { updated_at: new Date().toISOString() };
      if (state) {
        updates.state = state;
        if (state === "closed") updates.closed_at = new Date().toISOString();
        if (state === "merged") updates.merged_at = new Date().toISOString();
      }
      if (title) updates.title = title;
      if (body !== undefined) updates.body = body;
      
      const { data: updated } = await supabase
        .from('skill_pull_requests')
        .update(updates)
        .eq('id', pr.id)
        .select()
        .single();
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
      
      const { data: skill } = await supabase
        .from('skills')
        .select('*')
        .eq('id', skillId)
        .maybeSingle();
      if (!skill || skill.owner_id !== userId) return res.status(403).json({ message: "Only skill owner can merge" });
      
      const { data: pr } = await supabase
        .from('skill_pull_requests')
        .select('*')
        .eq('skill_id', skillId)
        .eq('number', parseInt(number))
        .maybeSingle();
      if (!pr) return res.status(404).json({ message: "Pull request not found" });
      if (pr.state !== "open") return res.status(400).json({ message: "PR is not open" });
      
      await supabase
        .from('skill_versions')
        .update({ is_latest: false })
        .eq('skill_id', skillId);
      
      let manifest: Record<string, any> = {};
      const fmMatch = pr.proposed_skill_md.match(/^---\n([\s\S]*?)\n---/);
      if (fmMatch) {
        try {
          const lines = fmMatch[1].split('\n');
          for (const line of lines) {
            const [key, ...rest] = line.split(':');
            if (key && rest.length) manifest[key.trim()] = rest.join(':').trim();
          }
        } catch {}
      }
      const validation = await validateSkillMd(pr.proposed_skill_md, manifest);

      const { data: newVersionRecord } = await supabase
        .from('skill_versions')
        .insert({
          skill_id: skillId,
          version: newVersion || "1.0.0",
          skill_md: pr.proposed_skill_md,
          is_latest: true,
        })
        .select()
        .single();
      
      await supabase.from('skill_validations').insert({
        version_id: newVersionRecord.id,
        status: validation.passed ? "passed" : "failed",
        score: validation.score,
        checks: validation.checks,
      });
      
      await supabase
        .from('skill_pull_requests')
        .update({ state: "merged", merged_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', pr.id);
      
      logActivity(skillId, userId, "pr_merged", { prNumber: parseInt(number), newVersion });
      res.json({ message: "Pull request merged", version: newVersion });
    } catch (error) {
      console.error("Merge PR error:", error);
      res.status(500).json({ message: "Failed to merge pull request" });
    }
  });
}
