"use client";

import { ThemeProvider } from "@/components/providers/custom-theme-provider";
import { SidebarProvider } from "@/context/sidebar-context";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        {children}
      </SidebarProvider>
    </ThemeProvider>
  );
}
