'use client';

import React from 'react';
import Link from 'next/link';

import { NavigationMenu as ShadNavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';

export interface NavigationProps {
  items: { href: string; label: string; }[]
}

export default function MainNavLinks() {

  const items: NavigationProps['items'] = [
    { href: '/', label: 'Inicio' },
    { href: '/theme-demo', label: 'Temas' },
    { href: '/services', label: 'Servicios' },
    { href: '/about', label: 'Acerca de' },
    { href: '/contact', label: 'Contacto' },
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


