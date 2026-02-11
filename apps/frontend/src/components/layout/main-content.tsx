"use client";

import { useSidebar } from "@/context/sidebar-context";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import React from "react";

interface MainContentProps {
  children: React.ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  const { sidebarWidth } = useSidebar();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <div
      className={cn("transition-all duration-300 ease-in-out")}
      style={{ paddingLeft: isDesktop ? `${sidebarWidth}px` : "0px" }}
    >
      {children}
    </div>
  );
}
