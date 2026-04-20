import { useEffect } from "react";

const SITE_NAME = "TraderClaw Skills";
const DEFAULT_SUFFIX = "TraderClaw Skills";
const CANONICAL_ORIGIN = "https://skills.traderclaw.ai";
const DEFAULT_DESCRIPTION =
  "Discover, publish, validate, and install official TraderClaw Skills on the registry at skills.traderclaw.ai.";
const DEFAULT_IMAGE = `${CANONICAL_ORIGIN}/ogimage_skills.jpg`;
const DEFAULT_IMAGE_ALT = "TraderClaw Skills preview with TraderClaw branding and the line Where Skills Become Edge";
const DEFAULT_IMAGE_TYPE = "image/jpeg";
const DEFAULT_IMAGE_WIDTH = "2400";
const DEFAULT_IMAGE_HEIGHT = "1260";
const DEFAULT_LOCALE = "en_US";
const DEFAULT_TWITTER_SITE = "@traderclawai";

interface PageSeoOptions {
  title?: string;
  description?: string;
  canonicalPath?: string;
  robots?: string;
  type?: "website" | "article";
  image?: string;
  imageAlt?: string;
  suffix?: string;
}

function ensureMeta(attribute: "name" | "property", key: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  return element;
}

function ensureLink(rel: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }

  return element;
}

function normalizePath(path?: string) {
  if (!path) return "/";

  const cleanPath = path.split("#")[0].trim();
  if (!cleanPath || cleanPath === "/") return "/";

  const prefixedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return prefixedPath.replace(/\/+$/, "") || "/";
}

export function toMetaDescription(text?: string | null, fallback = DEFAULT_DESCRIPTION) {
  const normalized = (text || fallback).replace(/\s+/g, " ").trim();

  if (normalized.length <= 160) {
    return normalized;
  }

  return `${normalized.slice(0, 157).trimEnd()}...`;
}

export function toCanonicalUrl(path?: string) {
  const normalizedPath = normalizePath(path);
  return `${CANONICAL_ORIGIN}${normalizedPath === "/" ? "/" : normalizedPath}`;
}

function buildTitle(title?: string, suffix = DEFAULT_SUFFIX) {
  if (!title) return SITE_NAME;
  return `${title} | ${suffix}`;
}

export function usePageSeo({
  title,
  description,
  canonicalPath,
  robots = "index,follow",
  type = "website",
  image = DEFAULT_IMAGE,
  imageAlt = DEFAULT_IMAGE_ALT,
  suffix = DEFAULT_SUFFIX,
}: PageSeoOptions) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const resolvedTitle = buildTitle(title, suffix);
    const resolvedDescription = toMetaDescription(description, DEFAULT_DESCRIPTION);
    const resolvedCanonicalUrl = toCanonicalUrl(
      canonicalPath || (typeof window !== "undefined" ? window.location.pathname : "/"),
    );

    document.title = resolvedTitle;

    ensureMeta("name", "description").setAttribute("content", resolvedDescription);
    ensureMeta("name", "robots").setAttribute("content", robots);
    ensureMeta("property", "og:type").setAttribute("content", type);
    ensureMeta("property", "og:site_name").setAttribute("content", SITE_NAME);
    ensureMeta("property", "og:locale").setAttribute("content", DEFAULT_LOCALE);
    ensureMeta("property", "og:title").setAttribute("content", resolvedTitle);
    ensureMeta("property", "og:description").setAttribute("content", resolvedDescription);
    ensureMeta("property", "og:url").setAttribute("content", resolvedCanonicalUrl);
    ensureMeta("property", "og:image").setAttribute("content", image);
    ensureMeta("property", "og:image:type").setAttribute("content", DEFAULT_IMAGE_TYPE);
    ensureMeta("property", "og:image:width").setAttribute("content", DEFAULT_IMAGE_WIDTH);
    ensureMeta("property", "og:image:height").setAttribute("content", DEFAULT_IMAGE_HEIGHT);
    ensureMeta("property", "og:image:alt").setAttribute("content", imageAlt);
    ensureMeta("name", "twitter:card").setAttribute("content", "summary_large_image");
    ensureMeta("name", "twitter:site").setAttribute("content", DEFAULT_TWITTER_SITE);
    ensureMeta("name", "twitter:title").setAttribute("content", resolvedTitle);
    ensureMeta("name", "twitter:description").setAttribute("content", resolvedDescription);
    ensureMeta("name", "twitter:image").setAttribute("content", image);
    ensureMeta("name", "twitter:image:alt").setAttribute("content", imageAlt);

    ensureLink("canonical").setAttribute("href", resolvedCanonicalUrl);
  }, [canonicalPath, description, image, imageAlt, robots, suffix, title, type]);
}
