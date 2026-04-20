import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Header from "./Header";
import Sidebar, { MobileMenuButton } from "./Sidebar";

interface AuthenticatedShellProps {
  children: ReactNode;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  mobileMenuOpen: boolean;
  onOpenMobileMenu: () => void;
  onCloseMobileMenu: () => void;
}

export default function AuthenticatedShell({
  children,
  sidebarCollapsed,
  onToggleSidebar,
  mobileMenuOpen,
  onOpenMobileMenu,
  onCloseMobileMenu,
}: AuthenticatedShellProps) {
  return (
    <div className="tc-app-shell h-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={onToggleSidebar}
        mobileOpen={mobileMenuOpen}
        onMobileClose={onCloseMobileMenu}
      />
      <div
        className={cn(
          "flex h-screen min-w-0 flex-col transition-[padding-left] duration-300 ease-out",
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-[18rem]",
        )}
      >
        <Header
          mobileMenuOpen={mobileMenuOpen}
          mobileMenuButton={
            <MobileMenuButton open={mobileMenuOpen} onClick={onOpenMobileMenu} />
          }
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-5 md:px-6 lg:px-8 lg:py-6 xl:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
