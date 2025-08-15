'use client';

import { Menu, User, Settings, LogOut } from 'lucide-react';
import { SimpleThemeToggle } from './SimpleThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  NavigationMenu as ShadNavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';

export const Navigation = () => {
  const { user, logout } = useAuth();

  const userLabel = user?.displayName || user?.email || 'Usuario';
  const userInitial = (userLabel || 'U').charAt(0).toUpperCase();
  console.log(user);
  return (
    <nav className="bg-background shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary">
              Pestilo
            </h1>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <ShadNavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/" className={navigationMenuTriggerStyle()}>
                      Inicio
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/theme-demo" className={navigationMenuTriggerStyle()}>
                      Temas
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="#" className={navigationMenuTriggerStyle()}>
                      Servicios
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="#" className={navigationMenuTriggerStyle()}>
                      Acerca de
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="#" className={navigationMenuTriggerStyle()}>
                      Contacto
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </ShadNavigationMenu>
          </div>

          <div className="flex items-center space-x-2">
            <SimpleThemeToggle />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{userInitial}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium">
                      {userLabel}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2" size={16} />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2" size={16} />
                    <span>Configuración</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600 dark:text-red-400 focus:text-red-600">
                    <LogOut className="mr-2" size={16} />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:text-primary transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Button asChild>
                  <Link href="/register">Registrarse</Link>
                </Button>
              </div>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="px-0">
                <div className="px-4 py-4">
                  <h2 className="text-lg font-semibold">Menú</h2>
                </div>
                <Separator />
                <div className="px-2 pt-2 pb-3 space-y-1">
                  <Link
                    href="/"
                    className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    Inicio
                  </Link>
                  <Link
                    href="/theme-demo"
                    className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    Temas
                  </Link>
                  <Link
                    href="#"
                    className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    Servicios
                  </Link>
                  <Link
                    href="#"
                    className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    Acerca de
                  </Link>
                  <Link
                    href="#"
                    className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    Contacto
                  </Link>
                </div>
                <Separator />
                <div className="px-2 pt-2 pb-4">
                  {user ? (
                    <Button variant="destructive" className="w-full" onClick={logout}>
                      <LogOut className="mr-2" size={16} /> Cerrar sesión
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button asChild variant="outline" className="flex-1">
                        <Link href="/login">Iniciar sesión</Link>
                      </Button>
                      <Button asChild className="flex-1">
                        <Link href="/register">Registrarse</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};