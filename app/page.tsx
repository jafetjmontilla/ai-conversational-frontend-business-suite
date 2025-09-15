'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function RootPage() {
  const { authUser, loading } = useAuth();
  const router = useRouter();

  // Redirección basada en el estado de autenticación
  useEffect(() => {
    if (!loading) {
      if (authUser) {
        // Si está logueado, redirigir al dashboard
        router.push('/dashboard');
      } else {
        // Si no está logueado, redirigir al login
        router.push('/login');
      }
    }
  }, [authUser, loading, router]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-wellness-50 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  // No mostrar nada mientras se redirige
  return null;
}