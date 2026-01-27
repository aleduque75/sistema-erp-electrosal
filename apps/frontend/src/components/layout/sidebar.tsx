"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IconMap } from "@/lib/icon-map";
import api from "@/lib/api";
import { useSidebar } from "@/context/sidebar-context";
import { ChevronDown, MoreHorizontal } from "lucide-react";

interface MenuItem {
  id: string;
  title: string;
  href: string;
  icon?: string;
  order: number;
  disabled?: boolean;
  parentId?: string | null;
  subItems?: MenuItem[];
}

interface FullMenuResponse {
  menuItems: MenuItem[];
  logoImage?: { id: string; path: string };
  logoText?: string;
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  // Add any specific props if needed
}

export function Sidebar({ className }: SidebarProps) {
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
    sidebarWidth,
  } = useSidebar();
  const pathname = usePathname();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [logoImageSrc, setLogoImageSrc] = useState<string>("/images/logo.png");
  const [logoAltText, setLogoAltText] = useState<string>("Sistema Electrosal Logo");

  const [openSubmenu, setOpenSubmenu] = useState<{
    id: string;
  } | null>(null);
  const [subMenuHeights, setSubMenuHeights] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => pathname === path, [pathname]);

  const handleSubmenuToggle = (id: string) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (prevOpenSubmenu && prevOpenSubmenu.id === id) {
        return null;
      }
      return { id };
    });
  };

  useEffect(() => {
    async function fetchMenuItems() {
      try {
        const response = await api.get<FullMenuResponse>('/menu');
        if (response.status === 200) {
          const { menuItems: fetchedMenuItems, logoImage, logoText } = response.data;
          setMenuItems(fetchedMenuItems);
          if (logoImage?.id) {
            setLogoImageSrc(`/api/public-media/${logoImage.id}`);
          }
          if (logoText) {
            setLogoAltText(logoText);
          } else {
            setLogoAltText("Electrosal Logo");
          }
        } else {
          console.error("Failed to fetch menu items");
        }
      } catch (error) {
        console.error("Error fetching menu items:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMenuItems();
  }, []);

  useEffect(() => {
    if (openSubmenu !== null) {
      if (subMenuRefs.current[openSubmenu.id]) {
        setSubMenuHeights((prevHeights) => ({
          ...prevHeights,
          [openSubmenu.id]: subMenuRefs.current[openSubmenu.id]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu, menuItems]);

  useEffect(() => {
    let submenuMatched = false;
    const findAndOpenParent = (items: MenuItem[]) => {
      for (const item of items) {
        if (item.subItems && item.subItems.length > 0) {
          if (item.subItems.some(sub => isActive(sub.href))) {
            setOpenSubmenu({ id: item.id });
            submenuMatched = true;
            return;
          }
          findAndOpenParent(item.subItems);
          if (submenuMatched) return;
        }
      }
    };
    findAndOpenParent(menuItems);

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }

  }, [pathname, isActive, menuItems]);


  const renderMenuItems = (items: MenuItem[], level: number = 0) => {
    return items.map((item) => {
      const IconComponent = item.icon ? IconMap[item.icon] : null;
      const hasSubItems = item.subItems && item.subItems.length > 0;
      const currentSubmenuOpen = openSubmenu && openSubmenu.id === item.id;

      const isItemActive = item.href !== '#' && isActive(item.href);
      const isParentOfActive = hasSubItems && item.subItems?.some(sub => isActive(sub.href));
      const highlightItem = isItemActive || isParentOfActive;


      return (
        <li key={item.id} className="relative">
          {hasSubItems ? (
            <button
              onClick={() => handleSubmenuToggle(item.id)}
              className={cn(
                "menu-item group",
                highlightItem
                  ? "bg-brand-50 text-brand-500 dark:bg-brand-500/12 dark:text-brand-400"
                  : "menu-item-inactive",
                !isExpanded && !isHovered && "lg:justify-center"
              )}
            >
              <div className="flex items-center gap-3">
                {IconComponent && (
                  <IconComponent className={cn(
                    "h-5 w-5",
                    highlightItem ? "menu-item-icon-active" : "menu-item-icon-inactive"
                  )} />
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={cn("menu-item-text", { "hidden": !isExpanded && !isHovered && !isMobileOpen })}>
                    {item.title}
                  </span>
                )}
              </div>
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDown
                  className={cn(
                    "ml-auto h-5 w-5 transition-transform duration-200",
                    highlightItem ? "menu-item-arrow-active" : "menu-item-arrow-inactive",
                    { "rotate-180": currentSubmenuOpen }
                  )}
                />
              )}
            </button>
          ) : (
            <Link
              href={item.href}
              className={cn(
                "menu-item group",
                highlightItem
                  ? "bg-brand-50 text-brand-500 dark:bg-brand-500/12 dark:text-brand-400"
                  : "menu-item-inactive",
                !isExpanded && !isHovered && "lg:justify-center"
              )}
            >
              {IconComponent && (
                <IconComponent className={cn(
                  "h-5 w-5",
                  highlightItem ? "menu-item-icon-active" : "menu-item-icon-inactive"
                )} />
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={cn("menu-item-text", { "hidden": !isExpanded && !isHovered && !isMobileOpen })}>
                  {item.title}
                </span>
              )}
            </Link>
          )}

          {hasSubItems && (
            <div
              ref={(el) => {
                if (el) subMenuRefs.current[item.id] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height: currentSubmenuOpen ? `${subMenuHeights[item.id] || 0}px` : "0px",
              }}
            >
              <ul className={cn(
                "mt-2 space-y-1",
                { "ml-4 pl-4 border-l-2": level === 0 },
                { "ml-8 pl-4 border-l-2": level > 0 }
              )}>
                {renderMenuItems(item.subItems!, level + 1)}
              </ul>
            </div>
          )}
        </li>
      );
    });
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex-col border-r bg-background transition-all duration-300 ease-in-out",
        !isMobileOpen && "-translate-x-full",
        isMobileOpen && "translate-x-0 sm:hidden",
        "sm:flex",
        "no-scrollbar",
        { "w-[290px]": isExpanded || isHovered },
        { "w-[90px]": !isExpanded && !isHovered },
        !isMobileOpen && "lg:translate-x-0"
      )}
      style={{ width: isMobileOpen ? '290px' : `${sidebarWidth}px` }}
      onMouseEnter={() => {
        if (!isExpanded && !isMobileOpen) setIsHovered(true);
      }}
      onMouseLeave={() => {
        if (!isExpanded && !isMobileOpen) setIsHovered(false);
      }}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b px-4 lg:h-[60px]",
          !isExpanded && !isHovered && "lg:justify-center"
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          {(isExpanded || isHovered || isMobileOpen) ? (
            <Image
              src={logoImageSrc}
              alt={logoAltText}
              width={35}
              height={35}
            />
          ) : (
            <Image
              src={logoImageSrc}
              alt="Electrosal Icon"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <ScrollArea className="flex-grow">
        <nav className="flex flex-col gap-4 p-4 text-sm font-medium">
          {isLoading ? (
            <div>Carregando...</div>
          ) : menuItems.length > 0 ? (
            <ul className="space-y-1">
              {(isExpanded || isHovered || isMobileOpen) ? (
                <h2 className="mb-4 text-xs uppercase leading-[20px] text-gray-400">Menu</h2>
              ) : (
                <div className="flex justify-center mb-4">
                  <MoreHorizontal className="h-5 w-5 text-gray-400" />
                </div>
              )}
              {renderMenuItems(menuItems)}
            </ul>
          ) : (
            <p className="p-2 text-muted-foreground">Nenhum item de menu encontrado.</p>
          )}
        </nav>
      </ScrollArea>
    </aside>
  );
}