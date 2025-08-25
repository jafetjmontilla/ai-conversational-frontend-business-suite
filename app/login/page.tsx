'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import LanguageDropdown from '@/components/navigation/LanguageDropdown';

export default function LoginPage() {
  const { authUser, loading } = useAuth();
  const router = useRouter();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (!loading && authUser) {
      router.push('/dashboard');
    }
  }, [authUser, loading, router]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 dark:border-green-400"></div>
      </div>
    );
  }

  // Si ya está autenticado, no mostrar nada (se redirigirá)
  if (authUser) {
    return null;
  }

  const handleAuthSuccess = () => {
    router.push('/dashboard'); // Actualizado para incluir el país por defecto
  };

  const handleSwitchToRegister = () => {
    router.push('/register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 md:top-7 md:right-10">
        <LanguageDropdown />
      </div>
      <div className="w-full max-w-md">
        <LoginForm
          onSwitchToRegister={handleSwitchToRegister}
          onSuccess={handleAuthSuccess}
        />
      </div>
    </div>
  );
}