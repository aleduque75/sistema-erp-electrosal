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
import { ChevronDown, MoreHorizontal, Sun, Moon } from "lucide-react";

export function Sidebar() {
  const { isExpanded, isHovered, setIsHovered, sidebarWidth } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [items, setItems] = useState<any[]>([]);
  const [openSub, setOpenSub] = useState<string | null>(null);

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
            style={{
              borderRadius: "var(--menu-item-radius, 8px)",
              backgroundColor: active
                ? "hsl(var(--menu-selected-background))"
                : "transparent",
              color: active
                ? "hsl(var(--menu-selected-text))"
                : "hsl(var(--menu-text))",
            }}
            className="flex items-center transition-all duration-200 hover:bg-[hsl(var(--menu-bg-hover))] hover:text-[hsl(var(--menu-text-hover))]"
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
                        isOpen && "rotate-180",
                      )}
                    />
                  )}
                </>
              )}
            </Link>
          </div>
          {isOpen && item.subItems && (isExpanded || isHovered) && (
            <ul
              className="mt-1 ml-6 border-l space-y-1"
              style={{
                borderColor:
                  "hsla(var(--menu-border), var(--menu-border-opacity, 1))",
              }}
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
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => !isExpanded && setIsHovered(false)}
      className="fixed inset-y-0 left-0 z-50 flex flex-col border-r transition-all duration-300"
      style={{
        width: sidebarWidth + "px",
        backgroundColor: "hsl(var(--menu-background))",
        borderRight: `1px solid hsla(var(--menu-border), var(--menu-border-opacity, 1))`,
      }}
    >
      <div
        className="h-16 flex items-center px-4 border-b shrink-0"
        style={{
          borderColor: "hsla(var(--menu-border), var(--menu-border-opacity))",
        }}
      >
        <Image src="/images/logo.png" alt="Logo" width={32} height={32} />
        {(isExpanded || isHovered) && (
          <span
            className="ml-3 font-black text-lg truncate"
            style={{ color: "hsl(var(--menu-text))" }}
          >
            ELECTROSAL
          </span>
        )}
      </div>

      <ScrollArea className="flex-1 py-4">
        <ul>{renderItems(items)}</ul>
      </ScrollArea>

      <div
        className="p-4 border-t"
        style={{
          borderColor: "hsla(var(--menu-border), var(--menu-border-opacity))",
        }}
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
