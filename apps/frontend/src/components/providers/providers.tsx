"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Header } from "@/components/layout/header";
import { AuthRedirector } from "@/components/auth/AuthRedirector";

function AppContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isLoading: isLoading, isAuthenticated } = useAuth();

  if (isLoading || !pathname) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  const isPublicRoute = ["/"].includes(pathname);

  return (
    <AuthRedirector>
      {isPublicRoute ? (
        <>
          <PublicNavbar />
          <main className="flex-1">{children}</main>
        </>
      ) : (
        <div className="flex flex-col min-h-screen">
          {isAuthenticated && <Header />}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/40">
            {children}
          </main>
        </div>
      )}
    </AuthRedirector>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <QueryProvider>
        <ThemeProvider>
          <AppContent>{children}</AppContent>
        </ThemeProvider>
      </QueryProvider>
    </AuthProvider>
  );
}
