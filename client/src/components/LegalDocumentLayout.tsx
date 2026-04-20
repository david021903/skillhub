import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PageIntro } from "@/components/PageIntro";
import { usePageSeo } from "@/lib/seo";

interface LegalSection {
  id: string;
  title: string;
  content: ReactNode;
}

interface LegalDocumentLayoutProps {
  tag: string;
  title: string;
  description: string;
  canonicalPath: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export function LegalDocumentLayout({
  tag,
  title,
  description,
  canonicalPath,
  lastUpdated,
  sections,
}: LegalDocumentLayoutProps) {
  usePageSeo({
    title,
    description,
    canonicalPath,
    robots: "index,follow",
    type: "article",
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageIntro
        tag={tag}
        title={title}
        description={description}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-5">
          <Card className="border-border/80 bg-card/70">
            <CardContent className="space-y-3 p-5 sm:p-6">
              <div
                className="text-[10px] uppercase tracking-[0.18em] text-primary"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Last Updated
              </div>
              <div className="text-lg text-foreground">{lastUpdated}</div>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                TraderClaw Skills is a product of TraderClaw and is operated by SpyFly INC — Republic of Panama.
                For legal inquiries, contact{" "}
                <a href="mailto:legal@traderclaw.ai" className="text-primary hover:underline">
                  legal@traderclaw.ai
                </a>.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-28">
                <Card className="border-border/80 bg-card/70">
                  <CardContent className="space-y-4 p-5 sm:p-6">
                    <div className="space-y-2">
                      <div
                        className="text-[10px] uppercase tracking-[0.18em] text-primary"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        Section
                      </div>
                      <h2 className="text-2xl text-foreground sm:text-[1.9rem]">{section.title}</h2>
                    </div>

                    <div className="space-y-4 text-sm leading-7 text-muted-foreground sm:text-[0.98rem]">
                      {section.content}
                    </div>
                  </CardContent>
                </Card>
              </section>
            ))}
          </div>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <Card className="border-border/80 bg-card/70">
            <CardContent className="p-5">
              <div
                className="text-[10px] uppercase tracking-[0.18em] text-primary"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                On This Page
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {sections.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {index + 1}. {section.title}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/70">
            <CardContent className="space-y-3 p-5">
              <div
                className="text-[10px] uppercase tracking-[0.18em] text-primary"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Legal Contact
              </div>
              <p className="text-sm leading-7 text-muted-foreground">
                SpyFly INC — Republic of Panama
              </p>
              <a
                href="mailto:legal@traderclaw.ai"
                className="text-sm text-primary transition-colors hover:text-foreground"
              >
                legal@traderclaw.ai
              </a>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
