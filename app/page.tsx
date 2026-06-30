'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/** `/` no es ruta pública en AuthGuard; solo llega aquí un usuario ya autenticado. */
export default function RootPage() {
  const { authUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    router.push(authUser ? '/dashboard' : '/login');
  }, [authUser, router]);

  return null;
}
