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
  const [appearance, setAppearance] = useState<any>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    // Busca aparência com retry e tratamento de erro
    const fetchAppearance = async () => {
      try {
        const res = await api.get(`/settings/appearance?t=${Date.now()}`);
        console.log("[SidebarDebug] Appearance loaded:", res.data);
        if (res.data) setAppearance(res.data);
      } catch (err) {
        console.error("Erro ao carregar aparência no sidebar:", err);
      }
    };

    fetchAppearance();

    api
      .get("/menu")
      .then((res) => setItems(res.data.menuItems || []))
      .catch((err) => {
        console.error("Erro no menu (provável 401):", err);
        setItems([]);
      });
  }, []);

  const renderItems = (menu: any[]) => {
    if (!Array.isArray(menu)) return null;
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
              active
                ? "bg-sidebar-selected text-sidebar-selected-foreground"
                : "bg-transparent text-sidebar-foreground hover:bg-sidebar-hover",
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
            <ul className="mt-1 ml-6 border-l border-sidebar-border space-y-1">
              {renderItems(item.subItems)}
            </ul>
          )}
        </li>
      );
    });
  };

  const logoUrl = appearance?.sidebarLogoId
    ? `/api/media/public-media/${appearance.sidebarLogoId}`
    : "/images/logo.png";

  return (
    <aside
      onMouseEnter={() => isDesktop && !isExpanded && setIsHovered(true)}
      onMouseLeave={() => isDesktop && !isExpanded && setIsHovered(false)}
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-sidebar border-sidebar-border transition-transform duration-300",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0",
      )}
      style={{ width: sidebarWidth + "px" }}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <div className="flex items-center">
          <div className="relative w-8 h-8 flex items-center justify-center overflow-hidden rounded-md">
            <Image
              src={logoUrl}
              alt="Logo"
              fill
              className="object-contain"
              unoptimized
              onError={(e) => {
                (e.target as any).src = "/images/logo.png";
              }}
            />
          </div>
          {(isExpanded || isHovered) && (
            <span className="ml-3 font-black text-lg text-sidebar-foreground tracking-tighter">
              ELECTROSAL
            </span>
          )}
        </div>
      </div>
      <ScrollArea className="flex-1 py-4">
        <ul>{renderItems(items)}</ul>
      </ScrollArea>
    </aside>
  );
}
