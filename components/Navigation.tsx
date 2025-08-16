'use client';

import { Menu } from 'lucide-react';
import { SimpleThemeToggle } from './SimpleThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { useCountry } from '@/components/providers/CountryProvider';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import LanguageDropdown from '@/components/navigation/LanguageDropdown';
import UserMenu from '@/components/navigation/UserMenu';
import MainNavLinks from '@/components/navigation/MainNavLinks';
import MobileNavSheet from '@/components/navigation/MobileNavSheet';
import { NavigationMenu as ShadNavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';

export const Navigation = () => {
  const { user, logout } = useAuth();
  const { countryCode } = useCountry();
  const { t } = useTranslation(['navigation']);
  const userLabel = user?.displayName || user?.email || 'Usuario';
  const userInitial = (userLabel || 'U').charAt(0).toUpperCase();

  return (
    <nav className="bg-background shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary">
              Pestilo
            </h1>
          </div>
          <MainNavLinks basePath={`/${countryCode}`} />
          <div className="flex items-center space-x-2">
            <SimpleThemeToggle />
            <LanguageDropdown />
            {user ? (
              <UserMenu userLabel={userLabel} userInitial={userInitial} onLogout={logout} />
            ) : (
              <div className="flex items-center space-x-2">
                <Link href={`/${countryCode}/login`} className="px-3 py-2 rounded-md text-sm font-medium hover:text-primary transition-colors">{t('navigation:login')}</Link>
                <Button asChild><Link href={`/${countryCode}/register`}>{t('navigation:register')}</Link></Button>
              </div>
            )}
            <MobileNavSheet basePath={`/${countryCode}`} isAuthenticated={!!user} onLogout={logout} />
          </div>
        </div>
      </div>
    </nav>
  );
};