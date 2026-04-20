import { Link, useLocation } from "wouter";
import { PageIntro } from "@/components/PageIntro";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { usePageSeo } from "@/lib/seo";
import { ArrowLeft, Home, Search } from "@/components/ui/icons";

export default function NotFound() {
  const { user } = useAuth();
  const [location] = useLocation();
  const primaryLabel = user ? "Return to Dashboard" : "Return Home";

  usePageSeo({
    title: "Page Not Found",
    description:
      "The page you requested could not be found in TraderClaw Skills. Return to the main surface or continue browsing the registry.",
    canonicalPath: location,
    robots: "noindex,nofollow",
  });

  return (
    <div className="max-w-6xl space-y-8">
      <PageIntro
        tag="404 ERROR"
        title="This page fell off the registry."
        description="We couldn't find the page you requested inside TraderClaw Skills. Head back to the main surface or jump straight into the registry."
        actions={
          <>
            <Link href="/">
              <Button className="gap-2">
                <Home className="h-4 w-4" />
                {primaryLabel}
              </Button>
            </Link>
            <Link href="/browse">
              <Button variant="outline" className="gap-2">
                <Search className="h-4 w-4" />
                Browse Skills
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_340px]">
        <section className="border border-border bg-card/65 p-6 sm:p-8 lg:p-10">
          <div className="flex items-center gap-3">
            <img
              src="/traderclaw-logo.svg"
              alt="TraderClaw"
              className="h-6 w-auto shrink-0 object-contain sm:h-7"
            />
            <span
              className="inline-flex items-center border border-primary/38 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-primary"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Skills
            </span>
          </div>

          <div
            className="mt-8 text-[4.75rem] leading-none text-foreground sm:text-[6.5rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            404
          </div>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
            The route may be outdated, private, or removed after a release. If someone shared this
            link with you, it may no longer point to an active TraderClaw Skills page.
          </p>

          <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4 text-primary" />
            <span>Use the buttons above to get back on track.</span>
          </div>
        </section>

        <div className="space-y-5">
          <Card className="border-border/80 bg-card/70">
            <CardContent className="space-y-4 p-5">
              <div
                className="text-[10px] uppercase tracking-[0.18em] text-primary"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Requested Route
              </div>
              <code className="block break-all border border-border/80 bg-background/70 px-3 py-3 text-sm text-foreground">
                {location}
              </code>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/70">
            <CardContent className="space-y-4 p-5">
              <div
                className="text-[10px] uppercase tracking-[0.18em] text-primary"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Quick Recovery
              </div>
              <div className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>Return to the main TraderClaw Skills surface.</p>
                <p>Browse the registry if you were looking for a specific skill.</p>
                <p>Check the link again if it came from older docs, a bookmark, or a shared message.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
