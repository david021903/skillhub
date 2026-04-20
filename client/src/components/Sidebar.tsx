import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileMenuToggle } from "@/components/MobileMenuToggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Home,
  LogOut,
  Package,
  Plus,
  Settings,
  Sparkles,
  Star,
  TrendingUp,
  User,
  Wand2,
} from "@/components/ui/icons";
import { BrandLockup } from "@/components/BrandLockup";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const currentUserOwner = (user as any)?.handle || user?.id;
  const currentUserSkillPrefix = currentUserOwner ? `/skills/${currentUserOwner}` : null;
  const username = (user as any)?.handle || user?.email?.split("@")[0] || "user";
  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user?.email?.split("@")[0] || "User";

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
        onMobileClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onMobileClose]);

  const navItems = [
    {
      href: "/",
      icon: Home,
      label: "Dashboard",
      isActive: (currentLocation: string) => currentLocation === "/",
    },
    {
      href: "/browse",
      icon: Package,
      label: "Browse Skills",
      isActive: (currentLocation: string) =>
        currentLocation.startsWith("/browse") && !currentLocation.includes("sort=stars"),
    },
    {
      href: "/my-skills",
      icon: FolderOpen,
      label: "My Skills",
      isActive: (currentLocation: string) =>
        currentLocation.startsWith("/my-skills") ||
        (!!currentUserSkillPrefix &&
          (currentLocation === currentUserSkillPrefix ||
            currentLocation.startsWith(`${currentUserSkillPrefix}/`))),
    },
    {
      href: "/starred",
      icon: Star,
      label: "Starred",
      isActive: (currentLocation: string) => currentLocation.startsWith("/starred"),
    },
    {
      href: "/browse?sort=stars",
      icon: TrendingUp,
      label: "Trending",
      isActive: (currentLocation: string) =>
        currentLocation.startsWith("/browse") && currentLocation.includes("sort=stars"),
    },
    {
      href: "/generate",
      icon: Wand2,
      label: "AI Generator",
      isActive: (currentLocation: string) => currentLocation.startsWith("/generate"),
    },
  ];

  const desktopSidebarContent = (
    <>
      <div
        className={cn(
          "flex h-16 items-center transition-[padding] duration-300 ease-out",
          collapsed ? "justify-center px-0" : "justify-start px-4",
        )}
        style={{ borderBottom: "1px solid hsl(var(--border))" }}
      >
        {collapsed ? (
          <Link
            href="/"
            aria-label="Go to dashboard"
            className="mx-auto flex h-12 w-12 items-center justify-center text-primary transition-transform duration-200 ease-out hover:-translate-y-0.5"
          >
            <img
              src="/traderclaw-logo-icon.svg"
              alt="TraderClaw"
              className="h-7 w-7 object-contain"
            />
          </Link>
        ) : (
          <div className="w-full">
            <Link href="/" className="flex items-center">
              <BrandLockup sidebar className="w-full" />
            </Link>
          </div>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className={cn(collapsed ? "space-y-4 px-3 py-5" : "space-y-5 px-4 py-5")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className={cn(
                  collapsed
                    ? "mx-auto h-12 w-12 items-center justify-center gap-0 border border-transparent px-0 [&_svg]:size-5"
                    : "h-12 w-full justify-between px-4 text-left",
                )}
                aria-label="Create or validate a skill"
              >
                <span
                  className={cn(
                    "flex min-w-0 items-center",
                    collapsed ? "w-auto justify-center" : "w-full gap-3",
                  )}
                >
                  <Plus className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-[1.05rem] w-[1.05rem]")} />
                  {!collapsed && <span className="truncate text-[13px] tracking-[0.18em]">Add Skill</span>}
                </span>
                {!collapsed && <ChevronDown className="h-[1.05rem] w-[1.05rem] shrink-0" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={collapsed ? "center" : "start"}
              side="bottom"
              sideOffset={8}
              className={cn(collapsed ? "w-52" : "w-64")}
            >
              <DropdownMenuItem className="px-0 py-0" asChild>
                <Link
                  href="/new"
                  className="flex h-12 w-full cursor-pointer items-center gap-3 px-4 font-mono text-[11px] font-medium uppercase tracking-[0.16em]"
                >
                  <Package className="h-[1.05rem] w-[1.05rem] shrink-0" />
                  New Skill
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="px-0 py-0" asChild>
                <Link
                  href="/validate"
                  className="flex h-12 w-full cursor-pointer items-center gap-3 px-4 font-mono text-[11px] font-medium uppercase tracking-[0.16em]"
                >
                  <Sparkles className="h-[1.05rem] w-[1.05rem] shrink-0" />
                  Validate Skill
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className={cn("section-divider my-0.5", collapsed && "mx-auto w-12")} />

          <nav className={cn("space-y-1.5", collapsed && "flex w-full flex-col items-center space-y-2")}>
            {navItems.map((item) => {
              const isActive = item.isActive(location);

              return (
                <Link key={item.href} href={item.href}>
                  <button
                    className={cn(
                      "sidebar-nav-item flex w-full items-center rounded-none transition-[transform,background-color,border-color,color,outline-color] duration-200 ease-out",
                      collapsed
                        ? "mx-auto h-12 w-12 justify-center border border-transparent px-0 hover:-translate-y-0.5 active:translate-y-0"
                        : "gap-3.5 px-4 py-3 text-[0.95rem] font-medium tracking-[0.01em]",
                      isActive
                        ? "nav-active"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                    )}
                    style={collapsed ? undefined : { fontFamily: "var(--font-sans)" }}
                  >
                    <item.icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-[1.02rem] w-[1.02rem]")} />
                    {!collapsed && <span className="min-w-0 truncate whitespace-nowrap">{item.label}</span>}
                  </button>
                </Link>
              );
            })}
          </nav>
        </div>
      </ScrollArea>

      <div className={cn(collapsed ? "space-y-3 px-0 py-4" : "space-y-3 px-4 py-3.5")}>
        <Link href="/docs">
          <button
            className={cn(
              "sidebar-nav-item hidden w-full items-center rounded-none transition-[transform,background-color,border-color,color,outline-color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar lg:flex",
              collapsed
                ? "mx-auto h-12 w-12 justify-center border border-transparent px-0 hover:-translate-y-0.5 active:translate-y-0"
                : "gap-3.5 px-4 py-3 text-left text-[0.95rem] font-medium tracking-[0.01em]",
              location === "/docs" || location.startsWith("/docs/")
                ? "nav-active"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <BookOpen className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-[1.02rem] w-[1.02rem]")} />
            {!collapsed && (
              <span className="min-w-0 truncate whitespace-nowrap">
                Docs
              </span>
            )}
          </button>
        </Link>

        <div className={cn("section-divider my-0.5", collapsed && "mx-auto w-12")} />

        <button
          type="button"
          data-testid="button-sidebar-toggle"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "hidden shrink-0 items-center justify-between rounded-none border border-border/70 bg-sidebar-accent/40 text-sidebar-foreground transition-[background-color,border-color,color] duration-200 hover:bg-sidebar-accent hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar lg:flex",
            collapsed ? "mx-auto h-12 w-12 justify-center border-border/80 bg-card/50 px-0" : "h-11 w-full px-4 py-2.5",
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <span className="text-[11px] uppercase tracking-[0.08em]" style={{ fontFamily: "var(--font-mono)" }}>
                Collapse
              </span>
              <ChevronLeft className="h-4 w-4 shrink-0" />
            </>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden h-screen flex-col border-r border-primary/10 bg-sidebar transition-all duration-300 lg:flex",
          collapsed ? "w-20" : "w-[18rem]",
        )}
      >
        {desktopSidebarContent}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/96 backdrop-blur-xl" />
          <ScrollArea className="relative h-full">
            <div className="mx-auto flex min-h-full w-full max-w-xl flex-col px-4 pb-8 pt-20 sm:px-6">
              <div className="border border-border/80 bg-card/35 px-5 py-5">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border-border/80 bg-card/70">
                    <AvatarImage src={user?.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-foreground">{displayName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">@{username}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link href="/new" onClick={onMobileClose}>
                  <button className="flex w-full items-center justify-center gap-2 border border-primary/70 bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-[transform,background-color,border-color] duration-300 ease-out hover:-translate-y-[1px] hover:border-primary hover:bg-primary/92">
                    <Plus className="h-4 w-4" />
                    Create New Skill
                  </button>
                </Link>
                <Link href="/validate" onClick={onMobileClose}>
                  <button className="flex w-full items-center justify-center gap-2 border border-border/80 bg-card/45 px-4 py-3 text-sm font-medium text-foreground transition-[transform,background-color,border-color,color] duration-300 ease-out hover:-translate-y-[1px] hover:border-primary/30 hover:bg-card/72">
                    <Sparkles className="h-4 w-4" />
                    Validate SKILL.md
                  </button>
                </Link>
              </div>

              <nav className="mt-6 flex flex-col gap-2">
                {navItems.map((item) => {
                  const isActive = item.isActive(location);

                  return (
                    <Link key={item.href} href={item.href} onClick={onMobileClose}>
                      <button
                        className={cn(
                          "flex w-full items-center gap-3 border px-4 py-4 text-left transition-[transform,background-color,border-color,color] duration-300 ease-out",
                          isActive
                            ? "border-primary/25 bg-primary/8 text-foreground"
                            : "border-transparent bg-transparent text-muted-foreground hover:-translate-y-[1px] hover:border-border/80 hover:bg-card/55 hover:text-foreground",
                        )}
                      >
                        <item.icon className="h-[1.08rem] w-[1.08rem] shrink-0" />
                        <span className="text-[1.05rem] font-medium tracking-[0.01em]">{item.label}</span>
                      </button>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-6 border border-border/80 bg-card/30 px-5 py-5">
                <div
                  className="text-[10px] uppercase tracking-[0.18em] text-primary/80"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Workspace
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Link href={`/users/${username}`} onClick={onMobileClose}>
                    <button className="flex w-full items-center gap-2 border border-border/80 bg-card/30 px-4 py-3 text-sm text-foreground transition-[transform,background-color,border-color] duration-300 ease-out hover:-translate-y-[1px] hover:border-primary/24 hover:bg-card/55">
                      <User className="h-4 w-4" />
                      Your Profile
                    </button>
                  </Link>
                  <Link href="/settings" onClick={onMobileClose}>
                    <button className="flex w-full items-center gap-2 border border-border/80 bg-card/30 px-4 py-3 text-sm text-foreground transition-[transform,background-color,border-color] duration-300 ease-out hover:-translate-y-[1px] hover:border-primary/24 hover:bg-card/55">
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                  </Link>
                  <Link href="/docs" onClick={onMobileClose}>
                    <button className="flex w-full items-center gap-2 border border-border/80 bg-card/30 px-4 py-3 text-sm text-foreground transition-[transform,background-color,border-color] duration-300 ease-out hover:-translate-y-[1px] hover:border-primary/24 hover:bg-card/55">
                      <BookOpen className="h-4 w-4" />
                      Docs
                    </button>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      onMobileClose();
                      logout();
                    }}
                    className="flex w-full items-center gap-2 border border-border/80 bg-card/30 px-4 py-3 text-sm text-foreground transition-[transform,background-color,border-color] duration-300 ease-out hover:-translate-y-[1px] hover:border-primary/24 hover:bg-card/55"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      ) : null}
    </>
  );
}

export function MobileMenuButton({
  onClick,
  open = false,
}: {
  onClick: () => void;
  open?: boolean;
}) {
  return (
    <MobileMenuToggle
      open={open}
      onClick={onClick}
      className="h-10 w-10"
      label={open ? "Close workspace navigation" : "Open workspace navigation"}
    />
  );
}
