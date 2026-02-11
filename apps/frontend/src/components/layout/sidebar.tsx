"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IconMap } from "@/lib/icon-map";
import api from "@/lib/api";
import { useSidebar } from "@/context/sidebar-context";
import { useTheme } from "@/components/providers/custom-theme-provider";
import { ChevronDown, MoreHorizontal, Sun, Moon, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

export function Sidebar() {
  const {
    isExpanded,
    isHovered,
    setIsHovered,
    sidebarWidth,
    isMobileOpen,
    toggleMobileSidebar,
  } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [items, setItems] = useState<any[]>([]);
  const [openSub, setOpenSub] = useState<string | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    api.get("/menu").then((res) => setItems(res.data.menuItems || []));
  }, []);

  const renderItems = (menu: any[]) => {
    return menu.map((item) => {
      const Icon = IconMap[item.icon] || MoreHorizontal;
      const active =
        pathname === item.href ||
        item.subItems?.some((s: any) => pathname === s.href);
      const isOpen = openSub === item.id;

      return (
        <li key={item.id} className="px-2 mb-1 list-none">
          <div
            className={cn(
              "flex items-center transition-all duration-200 rounded-[8px]",
              active ? "bg-sidebar-selected text-sidebar-selected-foreground" : "bg-transparent text-sidebar-foreground hover:bg-sidebar-hover"
            )}
          >
            <Link
              href={item.href}
              className="flex items-center w-full gap-3 p-2 outline-none"
              onClick={(e) => {
                if (item.subItems?.length > 0) {
                  e.preventDefault();
                  setOpenSub(isOpen ? null : item.id);
                }
              }}
            >
              <Icon size={20} className="shrink-0" />
              {(isExpanded || isHovered) && (
                <>
                  <span className="text-sm font-medium flex-1 truncate">
                    {item.title}
                  </span>
                  {item.badge && (
                    <span className="badge-custom ml-auto">{item.badge}</span>
                  )}
                  {item.subItems?.length > 0 && (
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  )}
                </>
              )}
            </Link>
          </div>
          {isOpen && item.subItems && (isExpanded || isHovered) && (
            <ul
              className="mt-1 ml-6 border-l border-sidebar-border space-y-1"
            >
              {renderItems(item.subItems)}
            </ul>
          )}
        </li>
      );
    });
  };

  return (
    <aside
      onMouseEnter={() => isDesktop && !isExpanded && setIsHovered(true)}
      onMouseLeave={() => isDesktop && !isExpanded && setIsHovered(false)}
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-sidebar border-sidebar-border transform transition-transform duration-300 ease-in-out",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0"
      )}
      style={{
        width: sidebarWidth + "px",
      }}
    >
      <div
        className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0"
      >
        <div className="flex items-center">
          <Image src="/images/logo.png" alt="Logo" width={32} height={32} />
          {(isExpanded || isHovered) && (
            <span
              className="ml-3 font-black text-lg truncate text-sidebar-foreground"
            >
              ELECTROSAL
            </span>
          )}
        </div>
        <button
          onClick={toggleMobileSidebar}
          className={cn("p-2 rounded-md md:hidden", {
            "hidden": !isMobileOpen,
          })}
        >
          <X className="h-6 w-6" />
          <span className="sr-only">Fechar menu</span>
        </button>
      </div>

      <ScrollArea className="flex-1 py-4">
        <ul>{renderItems(items)}</ul>
      </ScrollArea>

      <div
        className="p-4 border-t border-sidebar-border"
      >
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-full p-2 rounded-lg hover:bg-muted transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="text-yellow-500" />
          ) : (
            <Moon className="text-slate-500" />
          )}
          {(isExpanded || isHovered) && (
            <span className="ml-3 text-sm font-bold">
              {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
