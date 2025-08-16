'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_COUNTRY } from '@/lib/countries';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${DEFAULT_COUNTRY}`);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-wellness-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-8"></div>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
          Redirigiendo...
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Te estamos dirigiendo a tu región
        </p>
      </div>
    </div>
  );
}