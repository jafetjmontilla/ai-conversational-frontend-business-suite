'use client';

import React from 'react';
import Link from 'next/link';
import { NavigationMenu as ShadNavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';

export interface MainNavLinksProps { basePath: string; }

export interface NavigationProps {
  items: { href: string; label: string; }[]
}

export default function MainNavLinks({ basePath }: MainNavLinksProps) {
  const items: NavigationProps['items'] = [
    { href: `${basePath}`, label: 'Inicio' },
    { href: `${basePath}/theme-demo`, label: 'Temas' },
    { href: `${basePath}/services`, label: 'Servicios' },
    { href: `${basePath}/about`, label: 'Acerca de' },
    { href: `${basePath}/contact`, label: 'Contacto' },
  ];

  return (
    <div className="hidden md:flex items-center space-x-4">
      <ShadNavigationMenu>
        <NavigationMenuList>
          {items.map((item) => (
            <NavigationMenuItem key={item.href}>
              <NavigationMenuLink asChild>
                <Link href={item.href} className={navigationMenuTriggerStyle()}>{item.label}</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </ShadNavigationMenu>
    </div>
  );
}


