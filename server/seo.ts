import type { Express, Request, Response } from "express";
import { supabase } from "./db.js";
import * as fs from "fs";
import * as path from "path";

const SITE_URL = "https://skillhub.space";

export async function getBrowsePreRendered(): Promise<string> {
  try {
    const { data: allSkills } = await supabase
      .from("skills")
      .select("name, slug, description, downloads, owner:users!owner_id(handle)")
      .eq("is_public", true)
      .order("downloads", { ascending: false })
      .limit(50);

    if (!allSkills) return fallbackBrowse();
    const totalCount = allSkills.length;
    const skillListHtml = allSkills.map((s: any) =>
      `<li><a href="/skills/${(s.owner as any)?.handle || "unknown"}/${s.slug}">${escapeHtml(s.name)}</a><p>${escapeHtml(s.description || "No description available")}</p></li>`
    ).join("");
    return `<article>
<h1>Browse OpenClaw Agent Skills</h1>
<p>Welcome to the SkillHub skills registry. Browse over 1,000 verified and community-contributed OpenClaw agent skills. Each skill extends your AI agent's capabilities with new instructions, tools, and workflows. Skills are published in the open SKILL.md format and can be installed with a single command using the shsc CLI tool.</p>
<p>SkillHub is the central registry for OpenClaw skills — similar to npm for JavaScript or PyPI for Python, but purpose-built for AI agent skill packages. You can search by name, filter by category, sort by popularity or recent updates, and discover trending skills used by the community.</p>
<section>
<h2>Featured Skills (${totalCount} shown)</h2>
<p>The following skills are sorted by download count. Click any skill to view its full documentation, version history, validation score, and installation instructions.</p>
<ul>${skillListHtml}</ul>
</section>
<section>
<h2>How to Install Skills</h2>
<p>Install any skill with a single command: <code>shsc install owner/skill-name</code>. Skills are downloaded to your local <code>.local/skills</code> directory and automatically available to your OpenClaw agent. You can also browse and install skills directly from this web interface.</p>
</section>
<section>
<h2>Publishing Your Own Skills</h2>
<p>Create a SKILL.md file with YAML frontmatter and markdown instructions, then publish it to SkillHub using the CLI (<code>shsc publish</code>) or the web upload form. All published skills go through an automated validation pipeline that checks for security issues, proper formatting, and best practices.</p>
</section>
</article>`;
  } catch {
    return fallbackBrowse();
  }
}

function fallbackBrowse(): string {
  return `<article><h1>Browse OpenClaw Agent Skills</h1><p>Welcome to the SkillHub skills registry. Browse over 1,000 verified OpenClaw agent skills. Each skill extends your AI agent's capabilities with new instructions, tools, and workflows. Search by name, filter by category, and install with a single command.</p></article>`;
}

export async function getSkillPreRendered(owner: string, slug: string): Promise<string> {
  try {
    const { data: skill } = await supabase
      .from("skills")
      .select("id, name, description, downloads")
      .eq("slug", slug)
      .eq("is_public", true)
      .maybeSingle();

    if (!skill) return "";

    const { data: versions } = await supabase
      .from("skill_versions")
      .select("version")
      .eq("skill_id", skill.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const versionList = (versions || []).map((v: any) => v.version).join(", ");
    return `<article>
<h1>${escapeHtml(skill.name)}</h1>
<p>${escapeHtml(skill.description || "An OpenClaw agent skill available on SkillHub.")}</p>
<section>
<h2>About this Skill</h2>
<p>This skill is published by ${escapeHtml(owner)} on SkillHub, the OpenClaw skills registry. It can be installed with a single command and extends your AI agent with new capabilities, instructions, and workflows.</p>
<p>Downloads: ${skill.downloads || 0}${versionList ? `. Available versions: ${escapeHtml(versionList)}` : ""}</p>
</section>
<section>
<h2>Installation</h2>
<p>Install this skill using the shsc CLI: <code>shsc install ${escapeHtml(owner)}/${escapeHtml(slug)}</code></p>
<p>Or download it directly from this page using the ZIP download button.</p>
</section>
<nav><a href="/browse">Browse more skills</a> | <a href="/skills/${escapeHtml(owner)}">View ${escapeHtml(owner)}'s profile</a></nav>
</article>`;
  } catch {
    return "";
  }
}

export async function getUserPreRendered(handle: string): Promise<{ content: string; title: string; description: string } | null> {
  try {
    const { data: user } = await supabase
      .from("users")
      .select("id, handle, bio")
      .eq("handle", handle)
      .maybeSingle();

    if (!user) return null;

    const { data: userSkills } = await supabase
      .from("skills")
      .select("name, slug")
      .eq("owner_id", user.id)
      .eq("is_public", true)
      .limit(20);

    const skillLinks = (userSkills || []).map((s: any) =>
      `<li><a href="/skills/${escapeHtml(handle)}/${s.slug}">${escapeHtml(s.name)}</a></li>`
    ).join("");
    const userHandle = user.handle || handle;
    const userBio = user.bio || "";
    const title = `${escapeHtml(userHandle)} - SkillHub`;
    const description = userBio ? escapeHtml(userBio) : `${escapeHtml(userHandle)}'s profile on SkillHub — OpenClaw skills registry`;
    const content = `<h1>${escapeHtml(userHandle)}</h1>${userBio ? `<p>${escapeHtml(userBio)}</p>` : ""}<h2>Skills</h2><ul>${skillLinks || "<li>No public skills yet</li>"}</ul>`;
    return { content, title, description };
  } catch {
    return null;
  }
}

export const docsPreRendered: Record<string, { title: string; description: string; content: string }> = {
  "/docs": {
    title: "Documentation - SkillHub",
    description: "SkillHub documentation — learn how to discover, create, publish, and install OpenClaw agent skills.",
    content: `<h1>SkillHub Documentation</h1><p>Learn how to discover, create, publish, and install OpenClaw agent skills.</p><nav><a href="/docs/quick-start">Quick Start</a> | <a href="/docs/skill-format">SKILL.md Format</a> | <a href="/docs/cli">CLI Reference</a> | <a href="/docs/api/overview">API Tokens</a></nav>`,
  },
  "/docs/quick-start": {
    title: "Quick Start - SkillHub Docs",
    description: "Get started with SkillHub in minutes. Install the CLI, browse skills, and publish your first skill.",
    content: `<h1>Quick Start</h1><p>Get started with SkillHub in minutes. Install the shsc CLI, browse and install skills, and publish your first OpenClaw skill.</p>`,
  },
  "/docs/account": {
    title: "Account Setup - SkillHub Docs",
    description: "Create your SkillHub account, set up your profile, and manage authentication settings.",
    content: `<h1>Account Setup</h1><p>Create your SkillHub account, set up your profile, and manage authentication settings.</p>`,
  },
  "/docs/skill-format": {
    title: "SKILL.md Format - SkillHub Docs",
    description: "Learn the SKILL.md format — YAML frontmatter, markdown body, and metadata for OpenClaw agent skills.",
    content: `<h1>SKILL.md Format</h1><p>Skills use markdown with YAML frontmatter. Learn how to structure your SKILL.md file.</p>`,
  },
  "/docs/skill-format/frontmatter": {
    title: "Frontmatter Reference - SkillHub Docs",
    description: "Complete YAML frontmatter reference for SKILL.md files — name, description, metadata, and requirements.",
    content: `<h1>Frontmatter Reference</h1><p>Complete YAML frontmatter reference for SKILL.md files.</p>`,
  },
  "/docs/skill-format/body": {
    title: "Skill Body - SkillHub Docs",
    description: "Writing the markdown body of your SKILL.md — instructions, examples, and best practices.",
    content: `<h1>Skill Body</h1><p>Writing the markdown body of your SKILL.md with instructions and examples.</p>`,
  },
  "/docs/skill-format/examples": {
    title: "Skill Examples - SkillHub Docs",
    description: "Example SKILL.md files showing common patterns and best practices for OpenClaw skills.",
    content: `<h1>Skill Examples</h1><p>Example SKILL.md files showing common patterns and best practices.</p>`,
  },
  "/docs/platform": {
    title: "Platform Guide - SkillHub Docs",
    description: "SkillHub platform guide — publishing, versioning, collaboration, and forking skills.",
    content: `<h1>Platform Guide</h1><p>Learn about publishing, versioning, collaboration, and forking on SkillHub.</p>`,
  },
  "/docs/platform/publishing": {
    title: "Publishing Skills - SkillHub Docs",
    description: "How to publish skills to SkillHub — upload via web UI or CLI, validation, and release management.",
    content: `<h1>Publishing Skills</h1><p>Publish skills via the web UI or shsc CLI with automatic validation.</p>`,
  },
  "/docs/platform/versions": {
    title: "Version Management - SkillHub Docs",
    description: "Semantic versioning for skills — version history, changelogs, and managing releases.",
    content: `<h1>Version Management</h1><p>Manage skill versions with semantic versioning and changelogs.</p>`,
  },
  "/docs/platform/collaboration": {
    title: "Collaboration - SkillHub Docs",
    description: "Collaborate on skills — issues, pull requests, and community contributions.",
    content: `<h1>Collaboration</h1><p>Collaborate on skills with issues, pull requests, and community contributions.</p>`,
  },
  "/docs/platform/forking": {
    title: "Forking Skills - SkillHub Docs",
    description: "Fork skills to create your own version — modify, improve, and publish your fork.",
    content: `<h1>Forking Skills</h1><p>Fork skills to create your own version, modify, and publish improvements.</p>`,
  },
  "/docs/cli": {
    title: "CLI Reference - SkillHub Docs",
    description: "shsc CLI reference — authentication, publishing, installing, searching, and validating skills.",
    content: `<h1>CLI Reference (shsc)</h1><p>Command-line interface for managing OpenClaw skills.</p>`,
  },
  "/docs/cli/auth": {
    title: "CLI Authentication - SkillHub Docs",
    description: "Authenticate the shsc CLI with your SkillHub API token for publishing and managing skills.",
    content: `<h1>CLI Authentication</h1><p>Authenticate the shsc CLI with your API token.</p>`,
  },
  "/docs/cli/publish-install": {
    title: "Publish & Install - SkillHub Docs",
    description: "Publish and install skills using the shsc CLI — one-command workflows for developers.",
    content: `<h1>Publish & Install</h1><p>Publish and install skills with simple CLI commands.</p>`,
  },
  "/docs/cli/search": {
    title: "CLI Search - SkillHub Docs",
    description: "Search for skills from the command line with the shsc CLI.",
    content: `<h1>CLI Search</h1><p>Search and discover skills from the command line.</p>`,
  },
  "/docs/cli/validation": {
    title: "Skill Validation - SkillHub Docs",
    description: "Validate your SKILL.md before publishing — check format, security, and best practices.",
    content: `<h1>Skill Validation</h1><p>Validate your SKILL.md before publishing to ensure quality.</p>`,
  },
  "/docs/cli/templates": {
    title: "CLI Templates - SkillHub Docs",
    description: "Use starter templates to quickly create new skills with the shsc CLI.",
    content: `<h1>CLI Templates</h1><p>Use starter templates to quickly scaffold new skills.</p>`,
  },
  "/docs/cli/dependencies": {
    title: "Dependencies - SkillHub Docs",
    description: "Manage skill dependencies — required binaries, environment variables, and other skills.",
    content: `<h1>Dependencies</h1><p>Manage skill dependencies: binaries, env vars, and other skills.</p>`,
  },
  "/docs/validation": {
    title: "Validation - SkillHub Docs",
    description: "SkillHub validation pipeline — automatic security checks and best practice scoring.",
    content: `<h1>Validation</h1><p>Automatic validation pipeline for security and best practices.</p>`,
  },
  "/docs/validation/criteria": {
    title: "Validation Criteria - SkillHub Docs",
    description: "Detailed validation criteria for SkillHub skills — format, security, and quality checks.",
    content: `<h1>Validation Criteria</h1><p>Detailed validation criteria for format, security, and quality.</p>`,
  },
  "/docs/validation/improving": {
    title: "Improving Scores - SkillHub Docs",
    description: "Tips to improve your skill's validation score on SkillHub.",
    content: `<h1>Improving Scores</h1><p>Tips and best practices to improve your validation score.</p>`,
  },
  "/docs/ai": {
    title: "AI Features - SkillHub Docs",
    description: "AI-powered features on SkillHub — skill explainer, generator, and chat.",
    content: `<h1>AI Features</h1><p>AI-powered skill explainer, generator, and chat on SkillHub.</p>`,
  },
  "/docs/ai/explainer": {
    title: "AI Explainer - SkillHub Docs",
    description: "Get AI-generated explanations of any skill — understand capabilities and use cases.",
    content: `<h1>AI Explainer</h1><p>Get AI-generated plain-English explanations of any skill.</p>`,
  },
  "/docs/ai/generator": {
    title: "AI Generator - SkillHub Docs",
    description: "Generate SKILL.md files from natural language descriptions using AI.",
    content: `<h1>AI Generator</h1><p>Generate SKILL.md from natural language prompts.</p>`,
  },
  "/docs/ai/chat": {
    title: "AI Chat - SkillHub Docs",
    description: "Chat with AI about skills — ask questions and get streaming answers.",
    content: `<h1>AI Chat</h1><p>Ask AI questions about any skill with streaming responses.</p>`,
  },
  "/docs/tokens": {
    title: "API Tokens - SkillHub Docs",
    description: "Create and manage API tokens for CLI authentication and programmatic access.",
    content: `<h1>API Tokens</h1><p>Create and manage API tokens for programmatic access.</p>`,
  },
  "/docs/tokens/creating": {
    title: "Creating Tokens - SkillHub Docs",
    description: "How to create API tokens with scoped permissions on SkillHub.",
    content: `<h1>Creating Tokens</h1><p>Create API tokens with read or write scopes.</p>`,
  },
  "/docs/tokens/scopes": {
    title: "Token Scopes - SkillHub Docs",
    description: "Understand API token scopes — read vs write permissions for SkillHub.",
    content: `<h1>Token Scopes</h1><p>Read vs write scopes and their permissions.</p>`,
  },
  "/docs/tokens/cli-usage": {
    title: "CLI Token Usage - SkillHub Docs",
    description: "Use API tokens with the shsc CLI for authenticated operations.",
    content: `<h1>CLI Token Usage</h1><p>Authenticate the shsc CLI using API tokens.</p>`,
  },
  "/docs/api/overview": {
    title: "API Overview - SkillHub Docs",
    description: "SkillHub REST API overview — authentication, endpoints, and rate limits.",
    content: `<h1>API Overview</h1><p>SkillHub REST API for programmatic skill management.</p>`,
  },
};

export function registerSeoRoutes(app: Express) {
  app.get("/googlea56817ef47caeebd.html", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/html");
    res.send("google-site-verification: googlea56817ef47caeebd.html");
  });

  app.get("/robots.txt", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/plain");
    res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /settings

Sitemap: ${SITE_URL}/sitemap.xml
`);
  });

  app.get("/sitemap.xml", async (_req: Request, res: Response) => {
    try {
      const { data: allSkills } = await supabase
        .from("skills")
        .select("slug, updated_at, owner:users!owner_id(id, handle)")
        .eq("is_public", true);

      const today = new Date().toISOString().split("T")[0];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${today}</lastmod>
  </url>
  <url>
    <loc>${SITE_URL}/browse</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <lastmod>${today}</lastmod>
  </url>
  <url>
    <loc>${SITE_URL}/docs</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${today}</lastmod>
  </url>
`;

      for (const skill of allSkills || []) {
        const ownerData = skill.owner as any;
        const ownerHandle = ownerData?.handle || ownerData?.id || "unknown";
        const lastmod = skill.updated_at
          ? new Date(skill.updated_at).toISOString().split("T")[0]
          : today;
        xml += `  <url>
    <loc>${SITE_URL}/skills/${ownerHandle}/${skill.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <lastmod>${lastmod}</lastmod>
  </url>
`;
      }

      xml += `</urlset>`;

      res.setHeader("Content-Type", "application/xml");
      res.send(xml);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });
}

export async function getSkillMetaTags(owner: string, slug: string): Promise<{ title: string; description: string; url: string; jsonLd: string } | null> {
  try {
    const { data: result } = await supabase
      .from("skills")
      .select("name, description, slug, stars, downloads, is_public, owner:users!owner_id(handle, first_name)")
      .eq("slug", slug)
      .eq("is_public", true)
      .maybeSingle();

    if (!result) return null;

    const ownerData = result.owner as any;
    const ownerHandle = ownerData?.handle || owner;
    const title = `${result.name} - SkillHub`;
    const description = result.description
      ? `${result.description} — Install with: shsc install ${ownerHandle}/${result.slug}`
      : `${result.name} — an OpenClaw agent skill on SkillHub. Install with: shsc install ${ownerHandle}/${result.slug}`;
    const url = `${SITE_URL}/skills/${ownerHandle}/${result.slug}`;

    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": result.name,
      "description": result.description || `${result.name} - an OpenClaw agent skill`,
      "url": url,
      "applicationCategory": "AI Agent Skill",
      "operatingSystem": "Any",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
      "aggregateRating": result.stars && result.stars > 0 ? {
        "@type": "AggregateRating",
        "ratingCount": result.stars,
        "bestRating": 5,
        "worstRating": 1,
      } : undefined,
      "author": {
        "@type": "Person",
        "name": ownerData?.first_name || ownerHandle,
      },
    }).replace(/<\//g, "<\\/");

    return { title, description, url, jsonLd };
  } catch (error) {
    console.error("Error getting skill meta tags:", error);
    return null;
  }
}

export function injectMetaTags(
  html: string,
  meta: { title: string; description: string; url: string; jsonLd: string; preRenderedContent?: string }
): string {
  html = html.replace(
    /<title>.*?<\/title>/,
    `<title>${escapeHtml(meta.title)}</title>`
  );

  html = html.replace(
    /<meta name="description" content=".*?" \/>/,
    `<meta name="description" content="${escapeAttr(meta.description)}" />`
  );

  html = html.replace(
    /<link rel="canonical" href=".*?" \/>/,
    `<link rel="canonical" href="${meta.url}" />`
  );

  html = html.replace(
    /<meta property="og:title" content=".*?" \/>/,
    `<meta property="og:title" content="${escapeAttr(meta.title)}" />`
  );
  html = html.replace(
    /<meta property="og:description" content=".*?" \/>/,
    `<meta property="og:description" content="${escapeAttr(meta.description)}" />`
  );
  html = html.replace(
    /<meta property="og:url" content=".*?" \/>/,
    `<meta property="og:url" content="${meta.url}" />`
  );

  html = html.replace(
    /<meta name="twitter:title" content=".*?" \/>/,
    `<meta name="twitter:title" content="${escapeAttr(meta.title)}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content=".*?" \/>/,
    `<meta name="twitter:description" content="${escapeAttr(meta.description)}" />`
  );

  html = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">${meta.jsonLd}</script>`
  );

  if (meta.preRenderedContent) {
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root">${meta.preRenderedContent}</div><noscript>${meta.preRenderedContent}</noscript>`
    );
  }

  return html;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
