'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RegisterStep1 } from '@/components/auth/RegisterStep1';
import { RegisterStep2 } from '@/components/auth/RegisterStep2';
import { AnimatePresence, motion } from 'framer-motion';

export type Step = 1 | 2;

export interface UserData {
  role?: string;
  email: string;
  name: string;
  password: string;
  confirmPassword?: string;
  uid?: string;
  phone?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (token) {
      router.push(`/register-invitation?token=${token}`);
    }
  }, [token, router]);

  const handleStep1Complete = (_data: UserData) => {
    // setUserData(data);
    // setCurrentStep(2);
  };

  const handleStep2Complete = () => {
    router.push('/dashboard');
  };

  const handleBackToStep1 = () => {
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {currentStep === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <RegisterStep1
              onNext={(data) => handleStep1Complete(data)}
              onSwitchToLogin={() => router.push('/login')}
              userData={userData || { role: 'none', email: '', name: '', password: '' }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="step2"
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
