// apps/frontend/src/components/layout/main-menu.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { menuConfig } from '@/config/menu';
import { cn } from '@/lib/utils';

export function MainMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {menuConfig.map((item) => {
          const Icon = item.icon;

          return item.subItems ? (
            <NavigationMenuItem key={item.title}>
              <NavigationMenuTrigger className="gap-2">
                {Icon && <Icon className="h-4 w-4" />}
                {item.title}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                {/* ✅ CORREÇÃO: Adicionamos o conteúdo do submenu aqui */}
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {item.subItems.map((subItem) => (
                    <ListItem
                      key={subItem.title}
                      title={subItem.title}
                      href={subItem.href}
                    >
                      {/* Para 'Cadastros', podemos listar os sub-sub-itens como descrição */}
                      {subItem.subItems?.map((s) => s.title).join(', ')}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          ) : (
            <NavigationMenuItem key={item.title}>
              <Link href={item.href} legacyBehavior passHref>
                <NavigationMenuLink
                  className={cn(navigationMenuTriggerStyle(), 'gap-2')}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.title}
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'>
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            className,
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = 'ListItem';