'use client';

import React from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';


export interface MobileNavSheetProps { isAuthenticated: boolean; onLogout: () => void; }

export default function MobileNavSheet({ isAuthenticated, onLogout }: MobileNavSheetProps) {

  const items = [
    { label: 'Inicio', href: '/' },
    { label: 'Temas', href: '/theme-demo' },
    { label: 'Servicios', href: '/services' },
    { label: 'Acerca de', href: '/about' },
    { label: 'Contacto', href: '/contact' },
  ];
  const linkClass = 'block px-3 py-2 rounded-md text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors';
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden"><Menu size={20} /></Button>
      </SheetTrigger>
      <SheetContent side="right" className="px-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md">
        <div className="px-4 py-4"><h2 className="text-lg font-semibold">Menú</h2></div>
        <Separator className="bg-gray-200 dark:bg-gray-700" />
        <div className="px-2 pt-2 pb-3 space-y-1">
          {items.map(item => (
            <Link key={item.label} href={item.href} className={linkClass}>{item.label}</Link>
          ))}
        </div>
        <Separator className="bg-gray-200 dark:bg-gray-700" />
        <div className="px-2 pt-2 pb-4">
          {isAuthenticated ? (
            <Button variant="destructive" className="w-full" onClick={onLogout}><span>Cerrar sesión</span></Button>
          ) : (
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1"><Link href="/login">Iniciar sesión</Link></Button>
              <Button asChild className="flex-1"><Link href="/register">Registrarse</Link></Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}


