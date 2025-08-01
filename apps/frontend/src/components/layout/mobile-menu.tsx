"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { menuConfig } from "@/config/menu";
import { UserNav } from "./user-nav";

export function MobileMenu() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir Menu</span>
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
        <DrawerHeader className="text-left">
          <DrawerTitle>Navegação</DrawerTitle>
        </DrawerHeader>
        <div className="p-4">
          <div className="flex flex-col space-y-1">
            {menuConfig.map((item) => {
              const Icon = item.icon;
              return item.subItems ? (
                <Collapsible key={item.title}>
                  <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md px-3 py-2 text-base font-medium hover:bg-accent">
                    <div className="flex items-center gap-3">
                      {Icon && <Icon className="h-5 w-5" />} {item.title}
                    </div>
                    <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-8 border-l-2 ml-4">
                    {item.subItems.map((subItem) => {
                      const SubIcon = subItem.icon;
                      return (
                        <Link
                          key={subItem.title}
                          href={subItem.href}
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:bg-accent"
                          onClick={() => setIsOpen(false)}
                        >
                          {SubIcon && <SubIcon className="h-4 w-4" />}
                          {subItem.title}
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <Link
                  key={item.title}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium hover:bg-accent"
                  onClick={() => setIsOpen(false)}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="p-4 border-t">
          <UserNav />
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Fechar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
