import { ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandLockup } from "@/components/BrandLockup";
import { GlobalSearchDialog } from "@/components/GlobalSearchDialog";
import { ShortcutHint } from "@/components/ShortcutHint";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  LogOut, 
  Settings, 
  User, 
  Key, 
  Sparkles,
  BookOpen,
  Shield,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface HeaderProps {
  mobileMenuButton?: ReactNode;
  mobileMenuOpen?: boolean;
}

export default function Header({ mobileMenuButton, mobileMenuOpen = false }: HeaderProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const username = (user as any)?.handle || user?.email?.split("@")[0] || "user";
  const currentSearch = useMemo(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    return params.get("q") || params.get("search") || "";
  }, [location]);
  const isMacShortcut = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      /(Mac|iPhone|iPad|iPod)/i.test(navigator.platform || navigator.userAgent || ""),
    [],
  );

  const displayName = user?.firstName 
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : user?.email?.split('@')[0] || 'User';

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (!isShortcut) return;

      const target = event.target as HTMLElement | null;
      const isEditable =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (isEditable) {
        return;
      }

      event.preventDefault();
      setSearchOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 w-full border-b border-border bg-card/95 backdrop-blur-sm",
        mobileMenuOpen ? "z-[60]" : "z-40",
      )}
    >
      <div className="relative h-16 w-full">
        <div className="mx-auto flex h-full w-full max-w-6xl items-center gap-3 px-4 sm:px-5 md:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3 pr-14 md:pr-16 lg:pr-0">
            <Link href="/" className="flex items-center lg:hidden">
              <BrandLockup compact />
            </Link>

            <div className="hidden min-w-0 flex-1 md:block md:-ml-0.5 lg:-ml-1">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="group relative flex h-10 w-full max-w-[36rem] items-center border border-border/80 bg-background/65 pl-11 pr-[6.8rem] text-left text-sm text-foreground transition-[border-color,background-color,transform] duration-200 ease-out hover:-translate-y-[1px] hover:border-primary/28 hover:bg-card/76 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/35"
                aria-label="Open search"
              >
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-hover:text-primary" />
                <span className={cn("truncate", currentSearch ? "text-foreground" : "text-muted-foreground/75")}>
                  {currentSearch ? `Search: ${currentSearch}` : "Search skills, pages, docs..."}
                </span>
                <div
                  className="pointer-events-none absolute right-2 top-1/2 hidden h-6 -translate-y-1/2 items-center border border-border/80 bg-card/95 px-2 text-muted-foreground lg:inline-flex"
                >
                  <ShortcutHint isMac={isMacShortcut} />
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="absolute inset-y-0 right-4 flex shrink-0 items-center justify-end gap-2 sm:right-5 md:right-6 lg:right-8">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-10 w-10 items-center justify-center border border-border/80 bg-card/55 text-muted-foreground transition-[border-color,background-color,color,transform] duration-200 ease-out hover:-translate-y-[1px] hover:border-primary/28 hover:bg-primary/6 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/35 md:hidden"
            aria-label="Open search"
          >
            <Search className="h-[1.125rem] w-[1.125rem]" />
          </button>

          {mobileMenuButton ? <div className="lg:hidden">{mobileMenuButton}</div> : null}

          <div className="hidden items-center gap-2 py-2.5 lg:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="group flex h-10 shrink-0 items-center gap-2 border border-border/80 bg-card/72 pl-3 pr-0.5 text-left transition-[border-color,background-color,transform] duration-200 ease-out hover:-translate-y-[1px] hover:border-primary/28 hover:bg-card/90 focus:outline-none focus:ring-1 focus:ring-ring"
                  aria-label="Open profile menu"
                >
                  <span
                    className="max-w-[9.5rem] truncate text-[11px] text-foreground/76"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    @{username}
                  </span>
                  <Avatar className="h-9 w-9 cursor-pointer border-border/70 bg-background/85 transition-colors duration-200 group-hover:border-primary/22">
                    <AvatarImage src={user?.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={10} collisionPadding={16} className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1.5" style={{ fontFamily: "var(--font-sans)" }}>
                    <p className="text-[0.96rem] font-semibold leading-none text-foreground">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      @{username}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href={`/users/${(user as any)?.handle || 'me'}`} className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      Your Profile
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/tokens" className="flex items-center gap-2 cursor-pointer">
                      <Key className="h-4 w-4" />
                      API Tokens
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/ai" className="flex items-center gap-2 cursor-pointer">
                      <Sparkles className="h-4 w-4" />
                      AI Features
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                
                {(user as any)?.isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                        <Shield className="h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                  <Link href="/docs" className="flex items-center gap-2 cursor-pointer">
                    <BookOpen className="h-4 w-4" />
                    Docs
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={() => logout()} 
                  className="text-destructive cursor-pointer focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <GlobalSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        currentSearch={currentSearch}
        isMacShortcut={isMacShortcut}
        userHandle={(user as any)?.handle}
        isAdmin={Boolean((user as any)?.isAdmin)}
      />
    </header>
  );
}
