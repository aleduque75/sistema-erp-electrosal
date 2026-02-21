"use client";
import React from "react";
import { AlignJustify } from "lucide-react";
import { useSidebar } from "@/context/sidebar-context";
import { UserNav } from "./user-nav";
import { NavbarActions } from "./NavbarActions";

export function Header() {
  const { toggleSidebar, toggleMobileSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-divider bg-card">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center">
          {/* Botão para toggle do sidebar em Desktop */}
          <button
            onClick={toggleSidebar}
            className="hidden md:flex p-2 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <AlignJustify className="h-6 w-6" />
            <span className="sr-only">Toggle sidebar</span>
          </button>
          {/* Botão para toggle do sidebar em Mobile */}
          <button
            onClick={toggleMobileSidebar}
            className="flex md:hidden p-2 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <AlignJustify className="h-6 w-6" />
            <span className="sr-only">Toggle mobile sidebar</span>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <NavbarActions />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
