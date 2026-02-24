"use client";

import { Header } from "@/components/layout/header";
import { MainContent } from "@/components/layout/main-content";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider, useSidebar } from "@/context/sidebar-context";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

import { ProtectedRoute } from "@/components/auth/protected-route";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <>
      <Sidebar />
      <MainContent>
        <Header />
        <main className="p-2 md:p-6">{children}</main>
      </MainContent>
      {isMobileOpen && !isDesktop && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={toggleMobileSidebar}
        />
      )}
    </>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <LayoutContent>{children}</LayoutContent>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
