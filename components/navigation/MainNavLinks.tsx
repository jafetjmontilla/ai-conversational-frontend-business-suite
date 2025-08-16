'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { NavigationMenu as ShadNavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';

export interface MainNavLinksProps { basePath: string; }

export interface NavigationProps {
  items: { href: string; label: string; }[]
}

export default function MainNavLinks({ basePath }: MainNavLinksProps) {
  const { t } = useTranslation(['navigation']);
  const items: NavigationProps['items'] = [
    { href: `${basePath}`, label: t('navigation:home') },
    { href: `${basePath}/theme-demo`, label: t('navigation:themes') },
    { href: `${basePath}/services`, label: t('navigation:services') },
    { href: `${basePath}/about`, label: t('navigation:about') },
    { href: `${basePath}/contact`, label: t('navigation:contact') },
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


