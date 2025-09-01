'use client';

import Link from 'next/link';

export default function RootPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-wellness-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-6">
          ¡Bienvenido a 4nets!
        </h1>
        <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
          Tu plataforma integral para la gestión de eventos y servicios
        </p>
        <div className="space-x-4">
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="inline-block px-6 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
          >
            Registrarse
          </Link>
        </div>
      </div>
    </div>
  );
}