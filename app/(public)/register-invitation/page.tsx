'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterInvitationForm } from '@/components/auth/RegisterInvitationForm';
import { motion } from 'framer-motion';

export default function RegisterInvitationPage() {
  const { authUser, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (!loading && authUser?.customClaims?.role) {
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
  if (authUser?.customClaims?.role) {
    return null;
  }

  const handleAuthSuccess = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <RegisterInvitationForm
            token={token || ''}
            onSuccess={handleAuthSuccess}
          />
        </motion.div>
      </div>
    </div>
  );
}
