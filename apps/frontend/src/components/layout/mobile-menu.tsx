"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { IconMap } from "@/lib/icon-map";
import api from "@/lib/api";
import { useSidebar } from "@/context/sidebar-context";

interface MenuItem {
  id: string;
  title: string;
  href: string;
  icon?: string;
  order: number;
  parentId?: string;
  subItems?: MenuItem[];
}

export function MobileMenu() {
  const { toggleMobileSidebar, isMobileOpen } = useSidebar();
  const pathname = usePathname();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [openSubmenu, setOpenSubmenu] = useState<{
    id: string;
  } | null>(null);

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
        const response = await api.get('/menu');
        if (response.status === 200) {
          const data = response.data;
          const buildHierarchy = (items: MenuItem[], parentId: string | null = null) => {
            return items
              .filter(item => item.parentId === parentId)
              .sort((a, b) => a.order - b.order)
              .map(item => ({
                ...item,
                subItems: buildHierarchy(items, item.id),
              }));
          };
          setMenuItems(buildHierarchy(data));
        } else {
          console.error("Failed to fetch menu items");
        }
      } catch (error) {
        console.error("Error fetching menu items:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMenuItems();
  }, []);

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
            <Collapsible
              open={currentSubmenuOpen}
              onOpenChange={() => handleSubmenuToggle(item.id)}
            >
              <CollapsibleTrigger
                className={cn(
                  "menu-item group",
                  highlightItem
                    ? "bg-brand-50 text-brand-500 dark:bg-brand-500/12 dark:text-brand-400"
                    : "menu-item-inactive",
                )}
              >
                <div className="flex items-center gap-3">
                  {IconComponent && (
                    <IconComponent className={cn(
                      "h-5 w-5",
                      highlightItem ? "menu-item-icon-active" : "menu-item-icon-inactive"
                    )} />
                  )}
                  <span className="menu-item-text">
                    {item.title}
                  </span>
                </div>
                <ChevronRight
                  className={cn(
                    "ml-auto h-5 w-5 transition-transform duration-200",
                    highlightItem ? "menu-item-arrow-active" : "menu-item-arrow-inactive",
                    { "rotate-90": currentSubmenuOpen }
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent
                className={cn(
                  "mt-2 space-y-1",
                  { "ml-4 pl-4 border-l-2": level === 0 },
                  { "ml-8 pl-4 border-l-2": level > 0 }
                )}
              >
                <ul className="space-y-1">
                  {renderMenuItems(item.subItems!, level + 1)}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <SheetClose asChild>
              <Link
                href={item.href}
                className={cn(
                  "menu-item group",
                  highlightItem
                    ? "bg-brand-50 text-brand-500 dark:bg-brand-500/12 dark:text-brand-400"
                    : "menu-item-inactive",
                )}
              >
                {IconComponent && (
                  <IconComponent className={cn(
                    "h-5 w-5",
                    highlightItem ? "menu-item-icon-active" : "menu-item-icon-inactive"
                  )} />
                )}
                <span className="menu-item-text">
                  {item.title}
                </span>
              </Link>
            </SheetClose>
          )}
        </li>
      );
    });
  };

  return (
    <Sheet open={isMobileOpen} onOpenChange={toggleMobileSidebar}>
      <SheetTrigger asChild>
        {/* This trigger is now in the Header component, but keeping it here for completeness/fallback */}
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir Menu</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="flex flex-col w-[290px] p-0 lg:hidden !top-0 !h-full">
        <SheetHeader className="text-left flex-shrink-0 border-b p-4">
          <SheetTitle>Navegação</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 overflow-y-auto no-scrollbar">
          <nav className="flex flex-col gap-4 p-4 text-sm font-medium">
            {isLoading ? (
              <div>Carregando...</div>
            ) : menuItems.length > 0 ? (
              <ul className="space-y-1">
                {renderMenuItems(menuItems)}
              </ul>
            ) : (
              <p className="p-2 text-muted-foreground">Nenhum item de menu encontrado.</p>
            )}
          </nav>
        </ScrollArea>
        <div className="p-4 border-t flex-shrink-0">
          <SheetClose asChild>
            <Button variant="outline" className="w-full">Fechar</Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}