import type { Express, Request, Response, NextFunction } from "express";
import { supabase } from "./db.js";
import { isAuthenticated } from "./auth.js";

async function isAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (!user || !user.is_admin) {
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

      const [
        { count: totalUsersCount },
        { count: todaySignupsCount },
        { count: weekSkillsCount },
        { count: totalSkillsCount },
        { count: totalCommentsCount },
        { count: totalIssuesCount },
        { count: totalPRsCount },
        { count: todayCommentsCount },
        { data: totalDownloadsVal },
        { count: todayInstallsCount },
        { count: weekInstallsCount },
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart.toISOString()),
        supabase.from('skills').select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString()),
        supabase.from('skills').select('*', { count: 'exact', head: true }),
        supabase.from('skill_comments').select('*', { count: 'exact', head: true }),
        supabase.from('skill_issues').select('*', { count: 'exact', head: true }),
        supabase.from('skill_pull_requests').select('*', { count: 'exact', head: true }),
        supabase.from('skill_comments').select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart.toISOString()),
        supabase.rpc('total_skill_downloads'),
        supabase.from('skill_activities').select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart.toISOString())
          .or('action.eq.install,action.eq.download'),
        supabase.from('skill_activities').select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString())
          .or('action.eq.install,action.eq.download'),
      ]);

      res.json({
        totalUsers: totalUsersCount ?? 0,
        todaySignups: todaySignupsCount ?? 0,
        totalSkills: totalSkillsCount ?? 0,
        newSkillsThisWeek: weekSkillsCount ?? 0,
        totalComments: totalCommentsCount ?? 0,
        todayComments: todayCommentsCount ?? 0,
        totalIssues: totalIssuesCount ?? 0,
        totalPRs: totalPRsCount ?? 0,
        totalDownloads: Number(totalDownloadsVal ?? 0),
        todayInstalls: todayInstallsCount ?? 0,
        weekInstalls: weekInstallsCount ?? 0,
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
        const { data: comments } = await supabase
          .from('skill_comments')
          .select('id, content, created_at, user_id, skill_id, user:users!user_id(handle, email), skill:skills!skill_id(name, slug, owner:users!owner_id(handle))')
          .order('created_at', { ascending: false })
          .limit(limitNum);

        events.push(...(comments || []).map((c: any) => ({
          type: "comment",
          id: c.id,
          content: c.content,
          createdAt: c.created_at,
          userId: c.user_id,
          userName: c.user?.handle || c.user?.email?.split("@")[0],
          skillId: c.skill_id,
          skillName: c.skill?.name,
          skillSlug: c.skill?.slug,
          ownerHandle: c.skill?.owner?.handle,
          link: `/skills/${c.skill?.owner?.handle}/${c.skill?.slug}`,
        })));
      }

      if (shouldInclude("skills")) {
        const { data: newSkills } = await supabase
          .from('skills')
          .select('id, name, slug, description, is_public, created_at, owner_id, owner:users!owner_id(handle, email)')
          .order('created_at', { ascending: false })
          .limit(limitNum);

        events.push(...(newSkills || []).map((s: any) => ({
          type: "skill",
          id: s.id,
          content: s.description || s.name,
          createdAt: s.created_at,
          userId: s.owner_id,
          userName: s.owner?.handle || s.owner?.email?.split("@")[0],
          skillId: s.id,
          skillName: s.name,
          skillSlug: s.slug,
          ownerHandle: s.owner?.handle,
          isPublic: s.is_public,
          link: `/skills/${s.owner?.handle}/${s.slug}`,
        })));
      }

      if (shouldInclude("users")) {
        const { data: newUsers } = await supabase
          .from('users')
          .select('id, handle, email, first_name, last_name, created_at')
          .order('created_at', { ascending: false })
          .limit(limitNum);

        events.push(...(newUsers || []).map((u: any) => ({
          type: "user",
          id: u.id,
          content: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email,
          createdAt: u.created_at,
          userId: u.id,
          userName: u.handle || u.email?.split("@")[0],
          link: `/users/${u.handle || u.id}`,
        })));
      }

      if (shouldInclude("stars")) {
        const { data: stars } = await supabase
          .from('skill_stars')
          .select('skill_id, user_id, created_at, user:users!user_id(handle, email), skill:skills!skill_id(name, slug, owner:users!owner_id(handle))')
          .order('created_at', { ascending: false })
          .limit(limitNum);

        events.push(...(stars || []).map((s: any) => ({
          type: "star",
          id: `${s.skill_id}-${s.user_id}`,
          content: `Starred ${s.skill?.name}`,
          createdAt: s.created_at,
          userId: s.user_id,
          userName: s.user?.handle || s.user?.email?.split("@")[0],
          skillId: s.skill_id,
          skillName: s.skill?.name,
          skillSlug: s.skill?.slug,
          ownerHandle: s.skill?.owner?.handle,
          link: `/skills/${s.skill?.owner?.handle}/${s.skill?.slug}`,
        })));
      }

      if (shouldInclude("issues")) {
        const { data: issues } = await supabase
          .from('skill_issues')
          .select('id, title, state, number, created_at, author_id, skill_id, user:users!author_id(handle, email), skill:skills!skill_id(name, slug, owner:users!owner_id(handle))')
          .order('created_at', { ascending: false })
          .limit(limitNum);

        events.push(...(issues || []).map((i: any) => ({
          type: "issue",
          id: i.id,
          content: i.title,
          createdAt: i.created_at,
          userId: i.author_id,
          userName: i.user?.handle || i.user?.email?.split("@")[0],
          skillId: i.skill_id,
          skillName: i.skill?.name,
          skillSlug: i.skill?.slug,
          ownerHandle: i.skill?.owner?.handle,
          state: i.state,
          number: i.number,
          link: `/skills/${i.skill?.owner?.handle}/${i.skill?.slug}`,
        })));
      }

      if (shouldInclude("installs")) {
        const { data: installs } = await supabase
          .from('skill_activities')
          .select('id, action, details, created_at, user_id, skill_id, user:users!user_id(handle, email), skill:skills!skill_id(name, slug, owner:users!owner_id(handle))')
          .or('action.eq.install,action.eq.download')
          .order('created_at', { ascending: false })
          .limit(limitNum);

        events.push(...(installs || []).map((i: any) => ({
          type: "install",
          id: i.id,
          content: `${i.action === "install" ? "Installed" : "Downloaded"} ${i.skill?.name || "skill"}${i.details?.version ? ` v${i.details.version}` : ""}${i.details?.format ? ` (${i.details.format})` : ""}`,
          createdAt: i.created_at,
          userId: i.user_id,
          userName: i.user?.handle || i.user?.email?.split("@")[0] || "Anonymous",
          skillId: i.skill_id,
          skillName: i.skill?.name,
          skillSlug: i.skill?.slug,
          ownerHandle: i.skill?.owner?.handle,
          link: `/skills/${i.skill?.owner?.handle}/${i.skill?.slug}`,
        })));
      }

      if (shouldInclude("prs")) {
        const { data: prs } = await supabase
          .from('skill_pull_requests')
          .select('id, title, state, number, created_at, author_id, skill_id, user:users!author_id(handle, email), skill:skills!skill_id(name, slug, owner:users!owner_id(handle))')
          .order('created_at', { ascending: false })
          .limit(limitNum);

        events.push(...(prs || []).map((p: any) => ({
          type: "pr",
          id: p.id,
          content: p.title,
          createdAt: p.created_at,
          userId: p.author_id,
          userName: p.user?.handle || p.user?.email?.split("@")[0],
          skillId: p.skill_id,
          skillName: p.skill?.name,
          skillSlug: p.skill?.slug,
          ownerHandle: p.skill?.owner?.handle,
          state: p.state,
          number: p.number,
          link: `/skills/${p.skill?.owner?.handle}/${p.skill?.slug}`,
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
      const userId = String(req.params.userId);
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (!user) return res.status(404).json({ message: "User not found" });

      const { data: userSkills } = await supabase
        .from('skills')
        .select('id, name, slug, is_public, stars, downloads, created_at')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      const { data: userComments } = await supabase
        .from('skill_comments')
        .select('id, content, created_at, skill_id, skill:skills!skill_id(name, slug, owner:users!owner_id(handle))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      const { count: starCount } = await supabase
        .from('skill_stars')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: issueCount } = await supabase
        .from('skill_issues')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId);

      const skills = (userSkills || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        isPublic: s.is_public,
        stars: s.stars,
        downloads: s.downloads,
        createdAt: s.created_at,
      }));

      const comments = (userComments || []).map((c: any) => ({
        id: c.id,
        content: c.content,
        createdAt: c.created_at,
        skillId: c.skill_id,
        skillName: c.skill?.name,
        skillSlug: c.skill?.slug,
        ownerHandle: c.skill?.owner?.handle,
      }));

      res.json({
        user: {
          id: user.id,
          email: user.email,
          handle: user.handle,
          firstName: user.first_name,
          lastName: user.last_name,
          profileImageUrl: user.profile_image_url,
          bio: user.bio,
          isAdmin: user.is_admin,
          createdAt: user.created_at,
        },
        skills,
        comments,
        stats: {
          totalSkills: skills.length,
          totalStars: starCount ?? 0,
          totalIssues: issueCount ?? 0,
          totalComments: comments.length,
        },
      });
    } catch (error) {
      console.error("Admin user detail error:", error);
      res.status(500).json({ message: "Failed to fetch user details" });
    }
  });

  app.delete("/api/admin/comments/:commentId", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const commentId = String(req.params.commentId);
      await supabase.from('skill_comments').delete().eq('id', commentId);
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
      await supabase.from('skill_comments').delete().in('id', ids);
      res.json({ message: `${ids.length} comments deleted` });
    } catch (error) {
      console.error("Admin bulk delete error:", error);
      res.status(500).json({ message: "Failed to delete comments" });
    }
  });

  app.post("/api/admin/skills/:skillId/flag", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const skillId = String(req.params.skillId);
      const { action } = req.body;
      const updatedAt = new Date().toISOString();

      if (action === "archive") {
        await supabase.from('skills').update({ is_archived: true, updated_at: updatedAt }).eq('id', skillId);
        res.json({ message: "Skill archived" });
      } else if (action === "unarchive") {
        await supabase.from('skills').update({ is_archived: false, updated_at: updatedAt }).eq('id', skillId);
        res.json({ message: "Skill unarchived" });
      } else if (action === "make_private") {
        await supabase.from('skills').update({ is_public: false, updated_at: updatedAt }).eq('id', skillId);
        res.json({ message: "Skill set to private" });
      } else if (action === "make_public") {
        await supabase.from('skills').update({ is_public: true, updated_at: updatedAt }).eq('id', skillId);
        res.json({ message: "Skill set to public" });
      } else if (action === "delete") {
        await supabase.from('skills').delete().eq('id', skillId);
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
      const commentId = String(req.params.commentId);
      await supabase.from('issue_comments').delete().eq('id', commentId);
      res.json({ message: "Issue comment deleted" });
    } catch (error) {
      console.error("Admin delete issue comment error:", error);
      res.status(500).json({ message: "Failed to delete issue comment" });
    }
  });

  app.delete("/api/admin/pr-comments/:commentId", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const commentId = String(req.params.commentId);
      await supabase.from('pr_comments').delete().eq('id', commentId);
      res.json({ message: "PR comment deleted" });
    } catch (error) {
      console.error("Admin delete PR comment error:", error);
      res.status(500).json({ message: "Failed to delete PR comment" });
    }
  });
}
