'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useAllowed } from '../../lib/hooks/useAllowed';

export default function DashboardPage() {
  const { authUser, loading, logout } = useAuth();
  const { getCurrentRole, getCurrentPlan } = useAllowed();
  const router = useRouter();

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!loading && !authUser) {
      router.push('/login');
    }
  }, [authUser, loading, router]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Si no está autenticado, no mostrar nada (se redirigirá)
  if (!authUser) {
    return null;
  }

  const currentRole = getCurrentRole();
  const currentPlan = getCurrentPlan();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pestilo Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">{authUser.displayName || authUser.email}</span>
                <span className="mx-2 text-gray-400">|</span>
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full capitalize">{currentRole}</span>
                <span className="mx-2 text-gray-400">|</span>
                <span className="px-2 py-1 text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full capitalize">{currentPlan}</span>
              </div>
              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors"
                onClick={handleLogout}
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-center p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              ¡Bienvenido a Pestilo!
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Tu plataforma de bienestar y cuidado personal
            </p>
          </div>
          <div className="p-8 space-y-8">
            {/* User Info Card */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Información de tu Cuenta</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                    <p className="text-sm text-gray-900 dark:text-white">{authUser.displayName || 'No especificado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <p className="text-sm text-gray-900 dark:text-white">{authUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Verificado</label>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${authUser.emailVerified
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                      {authUser.emailVerified ? 'Sí' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Role and Plan Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tu Rol</h3>
                  <div className="text-2xl font-bold capitalize mb-2 text-gray-900 dark:text-white">{currentRole}</div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {currentRole === 'Cliente' && 'Acceso a funcionalidades básicas de bienestar'}
                    {currentRole === 'Profesional' && 'Herramientas avanzadas para entrenadores'}
                    {currentRole === 'Administrador' && 'Control total del sistema'}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tu Plan</h3>
                  <div className="text-2xl font-bold capitalize mb-2 text-gray-900 dark:text-white">{currentPlan}</div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {currentPlan === 'gratuito' && 'Plan básico con funcionalidades esenciales'}
                    {currentPlan === 'premium' && 'Funcionalidades avanzadas y estadísticas detalladas'}
                    {currentPlan === 'pro' && 'Acceso completo a todas las funcionalidades'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Acciones Rápidas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="h-24 flex-col bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors">
                    <div className="text-2xl mb-2">🏃‍♂️</div>
                    <div className="font-medium">Crear Rutina</div>
                  </button>

                  <button className="h-24 flex-col bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-md transition-colors">
                    <div className="text-2xl mb-2">📊</div>
                    <div className="font-medium">Ver Progreso</div>
                  </button>

                  <button className="h-24 flex-col border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-md transition-colors">
                    <div className="text-2xl mb-2">⚙️</div>
                    <div className="font-medium">Configuración</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Claims Info (for debugging) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Debug Info (Solo Desarrollo)</h3>
                  <pre className="text-xs overflow-auto bg-gray-100 dark:bg-gray-700 p-4 rounded text-gray-900 dark:text-white">
                    {JSON.stringify(authUser.customClaims, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 