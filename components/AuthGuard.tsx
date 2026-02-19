'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { systemRoles } from '@/lib/interfases';
import { fetchApiV1, queries } from '@/lib/Fetching';

interface AuthGuardProps {
  children: React.ReactNode;
}

const SYSTEM_SCOPE_SEGMENTS = ['dashboard', 'users', 'businesses', 'profile'];

/** Redirige a usuario con rol de negocio a su primer negocio (URL por businessId string). */
async function redirectToBusiness(router: ReturnType<typeof useRouter>): Promise<void> {
  const list = await fetchApiV1({ query: queries.getMyBusinessMemberships, type: 'json' }) as { business_id: string }[] | undefined;
  const first = list?.length ? list[0] : null;
  if (!first?.business_id) {
    router.push('/dashboard');
    return;
  }
  const business = await fetchApiV1({
    query: queries.getBusiness,
    type: 'json',
    variables: { id: first.business_id },
  }) as { businessId: string } | undefined;
  if (business?.businessId) {
    router.push(`/${business.businessId}`);
  } else {
    router.push('/dashboard');
  }
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { authUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirectingRef = useRef(false);

  const publicRoutes = ['/login', '/register-invitation', '/forgot-password', '/register'];
  const isPublicRoute = publicRoutes.includes(pathname);

  const role = authUser?.customClaims?.role as string | undefined;
  const isSystemRole = role && systemRoles.includes(role as 'system_admin' | 'system_operator' | 'system_viewer');
  const firstSegment = pathname?.split('/').filter(Boolean)[0] ?? '';
  const isSystemScopeRoute = SYSTEM_SCOPE_SEGMENTS.includes(firstSegment);

  // Redirección: no autenticado -> login
  useEffect(() => {
    if (loading) return;
    if (!authUser && !isPublicRoute) {
      router.push('/login');
    }
  }, [authUser, loading, router, pathname, isPublicRoute]);

  // Redirección: autenticado en ruta pública -> dashboard o al negocio según rol
  useEffect(() => {
    if (loading || !authUser || !isPublicRoute) return;
    if (isSystemRole) {
      router.push('/dashboard');
      return;
    }
    if (redirectingRef.current) return;
    redirectingRef.current = true;
    redirectToBusiness(router).finally(() => { redirectingRef.current = false; });
  }, [authUser, loading, isPublicRoute, isSystemRole, router]);

  // Redirección: rol de negocio en ruta del sistema -> al negocio (por businessId). Evita redirigir si ya estamos en un negocio.
  useEffect(() => {
    if (loading || !authUser || isPublicRoute || isSystemRole || !isSystemScopeRoute) return;
    if (redirectingRef.current) return;
    redirectingRef.current = true;
    redirectToBusiness(router).finally(() => { redirectingRef.current = false; });
  }, [authUser, loading, pathname, isPublicRoute, isSystemRole, isSystemScopeRoute, router]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-wellness-50 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  if (!authUser && !isPublicRoute) return null;

  // Usuario autenticado en ruta pública: no mostrar login, mostrar loading hasta redirigir
  if (authUser && isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-wellness-50 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400" />
      </div>
    );
  }

  // Rol de negocio en ruta del sistema: mostrar loading hasta redirigir al negocio
  if (authUser && isSystemScopeRoute && !isSystemRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-wellness-50 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400" />
      </div>
    );
  }

  return <>{children}</>;
}
