import type { Express, Request, Response } from "express";
import { db } from "./db.js";
import { skills, users, skillVersions, skillValidations } from "../shared/schema.js";
import { eq, and, desc } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

const SITE_URL = "https://skillhub.space";

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
      const allSkills = await db
        .select({
          slug: skills.slug,
          updatedAt: skills.updatedAt,
          ownerHandle: users.handle,
          ownerId: users.id,
        })
        .from(skills)
        .leftJoin(users, eq(skills.ownerId, users.id))
        .where(eq(skills.isPublic, true));

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
`;

      for (const skill of allSkills) {
        const owner = skill.ownerHandle || skill.ownerId;
        const lastmod = skill.updatedAt
          ? new Date(skill.updatedAt).toISOString().split("T")[0]
          : today;
        xml += `  <url>
    <loc>${SITE_URL}/skills/${owner}/${skill.slug}</loc>
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
    const result = await db
      .select({
        name: skills.name,
        description: skills.description,
        slug: skills.slug,
        stars: skills.stars,
        downloads: skills.downloads,
        isPublic: skills.isPublic,
        ownerHandle: users.handle,
        ownerName: users.firstName,
      })
      .from(skills)
      .leftJoin(users, eq(skills.ownerId, users.id))
      .where(and(
        eq(skills.slug, slug),
        eq(skills.isPublic, true),
      ))
      .limit(1);

    if (result.length === 0) return null;

    const skill = result[0];
    const ownerHandle = skill.ownerHandle || owner;
    const title = `${skill.name} - SkillHub`;
    const description = skill.description
      ? `${skill.description} — Install with: shsc install ${ownerHandle}/${skill.slug}`
      : `${skill.name} — an OpenClaw agent skill on SkillHub. Install with: shsc install ${ownerHandle}/${skill.slug}`;
    const url = `${SITE_URL}/skills/${ownerHandle}/${skill.slug}`;

    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": skill.name,
      "description": skill.description || `${skill.name} - an OpenClaw agent skill`,
      "url": url,
      "applicationCategory": "AI Agent Skill",
      "operatingSystem": "Any",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
      "aggregateRating": skill.stars && skill.stars > 0 ? {
        "@type": "AggregateRating",
        "ratingCount": skill.stars,
        "bestRating": 5,
        "worstRating": 1,
      } : undefined,
      "author": {
        "@type": "Person",
        "name": skill.ownerName || ownerHandle,
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
  meta: { title: string; description: string; url: string; jsonLd: string }
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

  return html;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
