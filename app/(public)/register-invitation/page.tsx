'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RegisterInvitationForm } from '@/components/auth/RegisterInvitationForm';
import { motion, useReducedMotion } from 'framer-motion';

export default function RegisterInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [validatingInvitation, setValidatingInvitation] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setValidatingInvitation(true);
    setContentVisible(false);
  }, [token]);

  useEffect(() => {
    if (validatingInvitation) {
      setContentVisible(false);
      return;
    }
    const timer = setTimeout(() => setContentVisible(true), 300);
    return () => clearTimeout(timer);
  }, [validatingInvitation]);

  const contentTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 1.2, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        className="relative w-full max-w-md"
        initial={false}
        animate={
          contentVisible
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: prefersReducedMotion ? 0 : 10 }
        }
        transition={contentTransition}
        aria-hidden={!contentVisible}
      >
        <RegisterInvitationForm
          token={token || ''}
          onSuccess={() => router.push('/dashboard')}
          onValidatingChange={setValidatingInvitation}
        />
      </motion.div>
    </div>
  );
}
