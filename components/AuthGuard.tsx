'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { authUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  //Modificar para el primer usuario que se registre sea admin
  // Rutas que no requieren autenticación
  const publicRoutes = ['/login', '/register-invitation', '/forgot-password'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Redirección basada en el estado de autenticación
  useEffect(() => {
    if (!loading) {
      if (authUser && isPublicRoute) {
        // Si está logueado y está en una ruta pública, redirigir al dashboard
        router.push('/invoice');
      } else if (!authUser && !isPublicRoute) {
        // Si no está logueado y no está en una ruta pública, redirigir al login
        router.push('/login');
      }
    }
  }, [authUser, loading, router, pathname, isPublicRoute]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-wellness-50 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  // Si no está autenticado y no es una ruta pública, no mostrar nada mientras se redirige
  if (!authUser && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}
