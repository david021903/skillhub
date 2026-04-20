import { Link, useLocation } from "wouter";
import DocsLayout, { docsHref } from "@/components/DocsLayout";
import { Button } from "@/components/ui/button";

export default function DocsNotFound() {
  const [location] = useLocation();

  return (
    <DocsLayout
      title="Page Not Found"
      description="The documentation page you requested could not be found. Return to the docs home or open the TraderClaw Skills app."
    >
      <p>
        The documentation route you requested could not be found. It may have moved, been renamed,
        or been removed during a content update.
      </p>

      <div className="not-prose my-6 border border-border/80 bg-card/60 p-5">
        <div
          className="text-[10px] uppercase tracking-[0.18em] text-primary"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Requested Route
        </div>
        <code className="mt-3 block break-all border border-border/80 bg-background/70 px-3 py-3 text-sm text-foreground">
          {location}
        </code>
      </div>

      <div className="not-prose mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href={docsHref("/docs")}>
          <Button>Return to Docs Home</Button>
        </Link>
        <a href="https://skills.traderclaw.ai/">
          <Button variant="outline">Open App</Button>
        </a>
      </div>
    </DocsLayout>
  );
}
