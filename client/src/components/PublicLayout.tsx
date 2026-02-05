import { useState, ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AuthForms } from "@/components/AuthForms";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center">
              <img src="/logo-dark.png" alt="SkillHub" className="h-7 dark:invert" />
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/browse">
                <Button variant="ghost" size="sm">Browse Skills</Button>
              </Link>
              <a href="https://docs.skillhub.space">
                <Button variant="ghost" size="sm">Docs</Button>
              </a>
            </div>
          </div>
          <Dialog open={authOpen} onOpenChange={setAuthOpen}>
            <DialogTrigger asChild>
              <Button>Sign In</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden">
              <AuthForms onSuccess={() => setAuthOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t bg-muted/30 py-8 mt-auto">
        <div className="container px-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-3">
          <p>&copy; 2026 SkillHub. All rights reserved. Created by 0BL1V1ON AI</p>
          <a href="https://x.com/skillhubspace" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/60 hover:text-foreground transition-colors" aria-label="Follow us on X">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
        </div>
      </footer>
    </div>
  );
}
