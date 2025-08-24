'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterStep1 } from '@/components/auth/RegisterStep1';
import { RegisterStep2 } from '@/components/auth/RegisterStep2';
import LanguageDropdown from '@/components/navigation/LanguageDropdown';

type Step = 1 | 2;

interface UserData {
  email: string;
  password: string;
  name: string;
}

export default function RegisterPage() {
  const { authUser, loading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (!loading && authUser) {
      router.push('/es/dashboard'); // Actualizado para incluir el país por defecto
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

  const handleStep1Complete = (data: UserData) => {
    setUserData(data);
    setCurrentStep(2);
  };

  const handleStep2Complete = () => {
    router.push('/es/dashboard'); // Actualizado para incluir el país por defecto
  };

  const handleBackToStep1 = () => {
    setCurrentStep(1);
  };

  const handleSwitchToLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="absolute top-4 right-4 md:top-7 md:right-10">
        <LanguageDropdown />
      </div>
      <div className="w-full">
        {/* Contenido del paso actual */}
        {currentStep === 1 ? (
          <RegisterStep1
            onNext={handleStep1Complete}
            onSwitchToLogin={handleSwitchToLogin}
          />
        ) : (
          <RegisterStep2
            userData={userData!}
            onBack={handleBackToStep1}
            onSuccess={handleStep2Complete}
          />
        )}
      </div>
    </div>
  );
}