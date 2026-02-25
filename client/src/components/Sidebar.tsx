import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Home,
  Package,
  Star,
  Search,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  TrendingUp,
  Menu,
  X,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: recentSkills = [] } = useQuery({
    queryKey: ["/api/skills/recent"],
    queryFn: async () => {
      const res = await fetch("/api/skills?sort=latest&limit=5");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: starredSkills = [] } = useQuery({
    queryKey: ["/api/my-stars"],
    queryFn: async () => {
      const res = await fetch("/api/my-stars?limit=5");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/browse", icon: Package, label: "Browse Skills" },
    { href: "/my-skills", icon: FolderOpen, label: "My Skills" },
    { href: "/starred", icon: Star, label: "Starred" },
  ];

  const secondaryItems = [
    { href: "/browse?sort=trending", icon: TrendingUp, label: "Trending" },
    { href: "/generate", icon: Wand2, label: "AI Generator" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      onMobileClose();
    }
  };

  const sidebarContent = (
    <>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <Link href="/" className="flex items-center">
              <img src="/logo-dark.png" alt="SkillHub" className="h-7 dark:invert" />
            </Link>
          )}
          {collapsed && (
            <img src="/icon.png" alt="SkillHub" className="w-8 h-8 mx-auto dark:invert" />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="hidden lg:flex h-8 w-8"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileClose}
            className="lg:hidden h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        {!collapsed && (
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search skills..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        )}

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || 
              (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <button
                  onClick={onMobileClose}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              </Link>
            );
          })}
        </nav>

        <div className="my-4 border-t" />

        <nav className="space-y-1">
          {secondaryItems.map((item) => {
            const isActive = location.includes(item.href.split("?")[0]) && 
              location.includes(item.href.split("?")[1]?.split("=")[1] || "");
            return (
              <Link key={item.href} href={item.href}>
                <button
                  onClick={onMobileClose}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              </Link>
            );
          })}
        </nav>

        {!collapsed && recentSkills.length > 0 && (
          <>
            <div className="my-4 border-t" />
            <div className="px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Recent Skills
                </span>
                <Search className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                {recentSkills.slice(0, 5).map((skill: any) => (
                  <Link key={skill.id} href={`/skills/${skill.owner?.handle || skill.ownerId}/${skill.slug}`}>
                    <button
                      onClick={onMobileClose}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <Package className="h-4 w-4 shrink-0" />
                      <span className="truncate">{skill.owner?.handle || "user"}/{skill.slug}</span>
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        {!collapsed && starredSkills.length > 0 && (
          <>
            <div className="my-4 border-t" />
            <div className="px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Starred
                </span>
              </div>
              <div className="space-y-1">
                {starredSkills.slice(0, 5).map((skill: any) => (
                  <Link key={skill.id} href={`/skills/${skill.owner?.handle || skill.ownerId}/${skill.slug}`}>
                    <button
                      onClick={onMobileClose}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <Star className="h-4 w-4 shrink-0 text-yellow-500" />
                      <span className="truncate">{skill.owner?.handle || "user"}/{skill.slug}</span>
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </ScrollArea>
    </>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen border-r bg-background transition-all duration-300 sticky top-0",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={onMobileClose}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-background flex flex-col shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="lg:hidden h-9 w-9"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
