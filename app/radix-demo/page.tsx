'use client';

import { Navigation } from '../../components/Navigation';
import { RadixDemo } from '../../components/RadixDemo';

export default function RadixDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-wellness-50 to-primary-50 dark:from-gray-900 dark:to-gray-800">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RadixDemo />

        <div className="mt-12 text-center">
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