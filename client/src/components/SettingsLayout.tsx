import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { User, Key, Palette, Sparkles } from "lucide-react";

interface SettingsLayoutProps {
  children: ReactNode;
}

const settingsNav = [
  { href: "/settings", label: "Profile", icon: User },
  { href: "/settings/tokens", label: "API Tokens", icon: Key },
  { href: "/settings/appearance", label: "Appearance", icon: Palette },
  { href: "/settings/ai", label: "AI Features", icon: Sparkles },
];

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <nav className="md:w-48 flex-shrink-0">
          <ul className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
            {settingsNav.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <li key={item.href}>
                  <Link href={item.href}>
                    <a
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
