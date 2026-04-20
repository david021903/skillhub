import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { AuthForms } from "@/components/AuthForms";
import { BrandLockup } from "@/components/BrandLockup";
import { MobileMenuToggle } from "@/components/MobileMenuToggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type AuthTab = "login" | "register";

interface PublicHeaderProps {
  authOpen: boolean;
  authDefaultTab: AuthTab;
  onAuthOpenChange: (open: boolean) => void;
  onOpenAuth: (tab?: AuthTab) => void;
}

interface PublicNavItem {
  href: string;
  label: string;
  isActive: (location: string) => boolean;
}

const publicNav: PublicNavItem[] = [
  {
    href: "/browse",
    label: "Browse",
    isActive: (location) => location.startsWith("/browse") && !location.includes("sort=stars"),
  },
  {
    href: "/browse?sort=stars",
    label: "Trending",
    isActive: (location) => location.startsWith("/browse") && location.includes("sort=stars"),
  },
  {
    href: "/docs",
    label: "Docs",
    isActive: (location) => location === "/docs" || location.startsWith("/docs/"),
  },
];

export function PublicHeader({
  authOpen,
  authDefaultTab,
  onAuthOpenChange,
  onOpenAuth,
}: PublicHeaderProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  const openAuth = (tab: AuthTab = "login") => {
    setMobileOpen(false);
    onOpenAuth(tab);
  };

  return (
    <>
      <header className="sticky top-0 z-[60] w-full bg-background/94 backdrop-blur">
        <div className="container relative flex h-20 max-w-[1480px] items-center justify-between gap-4 px-4">
          <Link href="/" className="flex min-w-0 items-center">
            <BrandLockup className="max-w-[78vw] sm:max-w-none" />
          </Link>

          <nav
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 lg:flex"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {publicNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-[11px] uppercase tracking-[0.18em] transition-colors",
                  item.isActive(location) ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:block">
            <Button variant="outline" className="px-5" onClick={() => onOpenAuth("login")}>
              Sign In
            </Button>
          </div>

          <MobileMenuToggle
            open={mobileOpen}
            onClick={() => setMobileOpen((current) => !current)}
            className="lg:hidden"
            label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          />
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/96 backdrop-blur-xl" />
          <div className="relative flex h-full flex-col overflow-y-auto px-4 pb-8 pt-24 sm:px-6">
            <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
              <nav className="flex flex-col gap-2">
                {publicNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "border border-transparent px-4 py-4 text-[1.35rem] font-semibold tracking-[-0.02em] transition-[transform,background-color,border-color,color] duration-300 ease-out",
                      item.isActive(location)
                        ? "border-primary/25 bg-primary/8 text-foreground"
                        : "text-muted-foreground hover:-translate-y-[1px] hover:border-border/80 hover:bg-card/55 hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-6 border border-border/80 bg-card/35 px-5 py-5">
                <div
                  className="text-[10px] uppercase tracking-[0.2em] text-primary/80"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Official Registry
                </div>
                <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                  Discover official TraderClaw Skills, install faster, and access docs or your account from one clean mobile surface.
                </p>
              </div>

              <div className="mt-auto space-y-3 border-t border-border/80 pt-6">
                <Button className="w-full" size="lg" onClick={() => openAuth("login")}>
                  Sign In
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={() => openAuth("register")}
                >
                  Create Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={authOpen} onOpenChange={onAuthOpenChange}>
        <DialogContent className="overflow-hidden border-primary/20 bg-card p-0 sm:max-w-md">
          <AuthForms defaultTab={authDefaultTab} onSuccess={() => onAuthOpenChange(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
