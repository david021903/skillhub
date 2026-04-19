import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. " +
    "Set them in .env (see .env.example).",
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export function resolveDatabaseUrl(): { url: string; source: "PROD_DATABASE_URL" | "DATABASE_URL" } {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    if (process.env.PROD_DATABASE_URL) {
      return { url: process.env.PROD_DATABASE_URL, source: "PROD_DATABASE_URL" };
    }
    if (process.env.DATABASE_URL) {
      return { url: process.env.DATABASE_URL, source: "DATABASE_URL" };
    }
    throw new Error(
      "No database URL configured in production. Set PROD_DATABASE_URL (preferred) or DATABASE_URL.",
    );
  }
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required in development for the session store.",
    );
  }
  return { url: process.env.DATABASE_URL, source: "DATABASE_URL" };
}

export function describeDbHost(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.port ? ":" + u.port : ""}${u.pathname || ""}`;
  } catch {
    return "<unparseable url>";
  }
}
