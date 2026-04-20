import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { PageIntro } from "@/components/PageIntro";
import { cn } from "@/lib/utils";
import { User, Key, Sparkles } from "@/components/ui/icons";

interface SettingsLayoutProps {
  children: ReactNode;
}

const settingsNav = [
  { href: "/settings", label: "Profile", icon: User },
  { href: "/settings/tokens", label: "API Tokens", icon: Key },
  { href: "/settings/ai", label: "AI Features", icon: Sparkles },
];

const settingsPageCopy: Record<string, { tag: string; title: string; description: string }> = {
  "/settings": {
    tag: "PROFILE SETTINGS",
    title: "Manage Your Profile",
    description: "Update your public identity, username, and account details for the TraderClaw registry.",
  },
  "/settings/tokens": {
    tag: "API TOKENS",
    title: "Manage API Tokens",
    description: "Create and control the tokens you use with the CLI and your automated workflows.",
  },
  "/settings/ai": {
    tag: "AI FEATURES",
    title: "Configure AI Tools",
    description: "Set up AI-powered generation, explanation, and chat features for your workflow.",
  },
};

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const [location] = useLocation();
  const pageCopy = settingsPageCopy[location] || settingsPageCopy["/settings"];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <PageIntro
          tag={pageCopy.tag}
          title={pageCopy.title}
          description={pageCopy.description}
        />
      </div>

      <div className="space-y-6">
        <nav className="overflow-x-auto">
          <div className="inline-flex min-w-full justify-start sm:min-w-0">
            <div className="inline-flex w-max min-w-full items-center gap-1 border border-border/70 bg-card/60 p-1 text-muted-foreground backdrop-blur-sm sm:min-w-0">
              {settingsNav.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-state={isActive ? "active" : "inactive"}
                    className={cn(
                      "tab-trigger relative inline-flex min-h-9 min-w-fit items-center justify-center gap-2 whitespace-nowrap rounded-none border border-transparent px-3 py-1.5 text-[0.84rem] font-medium tracking-[0.02em] ring-offset-background",
                      isActive ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
