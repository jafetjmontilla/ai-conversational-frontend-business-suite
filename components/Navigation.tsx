'use client';

import { Menu } from 'lucide-react';
import { SimpleThemeToggle } from './SimpleThemeToggle';
import { useAuth } from '../contexts/AuthContext';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import UserMenu from '@/components/navigation/UserMenu';
import MainNavLinks from '@/components/navigation/MainNavLinks';
import MobileNavSheet from '@/components/navigation/MobileNavSheet';
import { NavigationMenu as ShadNavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';

export const Navigation = () => {
  const { user, logout } = useAuth();


  const userLabel = user?.displayName || user?.email || 'Usuario';
  const userInitial = (userLabel || 'U').charAt(0).toUpperCase();

  return (
    <nav className="bg-background shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary">
              4net
            </h1>
          </div>
          <MainNavLinks />
          <div className="flex items-center space-x-2">
            <SimpleThemeToggle />
            {user ? (
              <UserMenu userLabel={userLabel} userInitial={userInitial} onLogout={logout} />
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login" className="px-3 py-2 rounded-md text-sm font-medium hover:text-primary transition-colors">Iniciar sesión</Link>
                <Button asChild><Link href="/register">Registrarse</Link></Button>
              </div>
            )}
            <MobileNavSheet isAuthenticated={!!user} onLogout={logout} />
          </div>
        </div>
      </div>
    </nav>
  );
};