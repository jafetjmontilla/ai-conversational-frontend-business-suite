'use client';

import { ThemeDemo } from '@/components/ThemeDemo';
import * as Examples from '@/components/examples';

export default function ThemeDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-wellness-50 to-primary-50 dark:from-gray-900 dark:to-gray-800">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Sistema de Temas
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 algo">
            Demostración del sistema de temas claro y oscuro de Pestilo
          </p>
        </div>
        <ThemeDemo />
        <Examples.PermissionsIntegrationExample />
        <Examples.PermissionsExample />
        <Examples.SpecializedHooksExample />
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            ← Volver al inicio
          </a>
        </div>
      </main>
    </div>
  );
} 