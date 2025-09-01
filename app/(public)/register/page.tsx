'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterStep1 } from '@/components/auth/RegisterStep1';
import { RegisterStep2 } from '@/components/auth/RegisterStep2';

import { AnimatePresence, motion } from 'framer-motion';

export type Step = 1 | 2;

export interface UserData {
  email: string;
  name: string;
  password: string;
  confirmPassword?: string;
  uid?: string; // Opcional para usuarios de Google
}

export default function RegisterPage() {
  const { authUser, loading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (!loading && authUser?.customClaims?.role && authUser?.customClaims?.plan) {
      router.push('/dashboard'); // Actualizado para incluir el país por defecto
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
  if (authUser?.customClaims?.role && authUser?.customClaims?.plan) {
    return null;
  }

  const handleStep1Complete = (data: UserData) => {
    setUserData(data);
    setCurrentStep(2);
  };

  const handleStep2Complete = () => {
    router.push('/dashboard'); // Actualizado para incluir el país por defecto
  };

  const handleBackToStep1 = () => {
    setCurrentStep(1);
  };

  const handleSwitchToLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">

      <AnimatePresence mode="wait"  >
        {currentStep === 1 ? (
          <motion.div
            key="step1" // <--- Clave única para el primer paso
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <RegisterStep1
              onNext={handleStep1Complete}
              onSwitchToLogin={handleSwitchToLogin}
              userData={userData!}
            />
          </motion.div>
        ) : (
          <motion.div
            key="step2" // <--- Clave única para el segundo paso
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <RegisterStep2
              userData={userData!}
              onBack={handleBackToStep1}
              onSuccess={handleStep2Complete}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}