'use client';

import { ThemeDemo } from '@/components/ThemeDemo';

export default function ThemeDemoPage() {
  return (
    <div className="min-h-screen">
      <ThemeDemo />
      <div className="mt-8 text-center">
        <a
          href="/"
          className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          ← Volver al inicio
        </a>
      </div>
    </div>
  );
} 