import { useState, ReactNode } from "react";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<"login" | "register">("login");

  const openAuth = (tab: "login" | "register" = "login") => {
    setAuthDefaultTab(tab);
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader
        authOpen={authOpen}
        authDefaultTab={authDefaultTab}
        onAuthOpenChange={setAuthOpen}
        onOpenAuth={openAuth}
      />

      <main className="container mx-auto max-w-[1480px] px-4 py-8 md:py-10">
        {children}
      </main>

      <PublicFooter />
    </div>
  );
}
