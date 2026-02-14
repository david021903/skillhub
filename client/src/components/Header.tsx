import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Plus, 
  LogOut, 
  Settings, 
  User, 
  Key, 
  Package, 
  Star, 
  Palette,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface HeaderProps {
  mobileMenuButton?: ReactNode;
}

export default function Header({ mobileMenuButton }: HeaderProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const displayName = user?.firstName 
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : user?.email?.split('@')[0] || 'User';

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {mobileMenuButton}
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-lg">🦞</span>
            </div>
            <span className="font-bold text-xl">SkillHub</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/browse">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Search className="h-5 w-5" />
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Plus className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/new" className="flex items-center gap-2 cursor-pointer">
                  <Package className="h-4 w-4" />
                  New Skill
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/validate" className="flex items-center gap-2 cursor-pointer">
                  <Sparkles className="h-4 w-4" />
                  Validate SKILL.md
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                <Avatar className="h-8 w-8 cursor-pointer border-2 border-transparent hover:border-primary transition-colors">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    @{(user as any)?.handle || user?.email?.split('@')[0] || 'user'}
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
                <DropdownMenuItem asChild>
                  <Link href={`/users/${(user as any)?.handle || 'me'}?tab=skills`} className="flex items-center gap-2 cursor-pointer">
                    <Package className="h-4 w-4" />
                    Your Skills
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/users/${(user as any)?.handle || 'me'}?tab=stars`} className="flex items-center gap-2 cursor-pointer">
                    <Star className="h-4 w-4" />
                    Your Stars
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
                  <Link href="/settings/appearance" className="flex items-center gap-2 cursor-pointer">
                    <Palette className="h-4 w-4" />
                    Appearance
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
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem asChild>
                <a 
                  href="https://github.com/openclaw" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" />
                  OpenClaw Docs
                </a>
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
    </header>
  );
}
