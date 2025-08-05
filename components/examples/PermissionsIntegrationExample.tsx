'use client';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAllowed } from '../../lib/hooks/useAllowed';

export const PermissionsIntegrationExample: React.FC = () => {
  const { authUser, loading: authLoading, logout } = useAuth();
  const {
    can,
    hasPlan,
    getCurrentPlan,
    loading: permissionsLoading
  } = useAllowed();

  const [selectedPlan, setSelectedPlan] = useState<'gratuito' | 'premium' | 'pro'>('gratuito');

  if (authLoading || permissionsLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🔐 Autenticación Requerida
          </h2>
          <p className="text-gray-600 mb-4">
            Debes iniciar sesión para ver los permisos y funcionalidades disponibles.
          </p>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-yellow-800">
              El hook <code className="bg-yellow-100 px-1 rounded">useAllowed</code> requiere
              que el usuario esté autenticado para funcionar correctamente.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const planActual = getCurrentPlan();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Información del Usuario */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            👤 Información del Usuario
          </h2>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Datos del Usuario</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Email:</span>
                <span>{authUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Nombre:</span>
                <span>{authUser.displayName || 'No especificado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Email Verificado:</span>
                <span className={authUser.emailVerified ? 'text-green-600' : 'text-red-600'}>
                  {authUser.emailVerified ? '✓ Sí' : '✗ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Proveedor:</span>
                <span>{authUser.providerId}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-3">Plan y Permisos</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Plan Actual:</span>
                <span className="font-semibold text-blue-600">{planActual}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Rutinas:</span>
                <span className={can('rutinas:crear') ? 'text-green-600' : 'text-red-600'}>
                  {can('rutinas:crear') ? '✓ Disponible' : '✗ Limitado'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Ejercicios Premium:</span>
                <span className={can('ejercicios:premium') ? 'text-green-600' : 'text-red-600'}>
                  {can('ejercicios:premium') ? '✓ Disponible' : '✗ No disponible'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Exportar Datos:</span>
                <span className={can('exportar:datos') ? 'text-green-600' : 'text-red-600'}>
                  {can('exportar:datos') ? '✓ Disponible' : '✗ No disponible'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulador de Planes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          🎛️ Simulador de Planes
        </h3>
        <p className="text-gray-600 mb-4">
          Selecciona un plan para ver cómo cambiarían los permisos (esto es solo para demostración).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {(['gratuito', 'premium', 'pro'] as const).map((plan) => (
            <div
              key={plan}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedPlan === plan
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
              onClick={() => setSelectedPlan(plan)}
            >
              <h4 className="font-semibold text-gray-800 mb-2 capitalize">{plan}</h4>
              <div className="text-sm text-gray-600 space-y-1">
                {plan === 'gratuito' && (
                  <>
                    <div>• Rutinas básicas</div>
                    <div>• Ejercicios básicos</div>
                    <div>• Progreso básico</div>
                  </>
                )}
                {plan === 'premium' && (
                  <>
                    <div>• Rutinas ilimitadas</div>
                    <div>• Ejercicios premium</div>
                    <div>• Estadísticas avanzadas</div>
                  </>
                )}
                {plan === 'pro' && (
                  <>
                    <div>• Todo de Premium</div>
                    <div>• Exportar datos</div>
                    <div>• Soporte prioritario</div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Permisos según el plan seleccionado */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-3">
            Permisos del Plan: {selectedPlan}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h5 className="font-medium text-gray-700">Rutinas</h5>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Crear:</span>
                  <span className="text-green-600">✓</span>
                </div>
                <div className="flex justify-between">
                  <span>Editar:</span>
                  <span className="text-green-600">✓</span>
                </div>
                <div className="flex justify-between">
                  <span>Ilimitadas:</span>
                  <span className={selectedPlan !== 'gratuito' ? 'text-green-600' : 'text-red-600'}>
                    {selectedPlan !== 'gratuito' ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-medium text-gray-700">Ejercicios</h5>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Básicos:</span>
                  <span className="text-green-600">✓</span>
                </div>
                <div className="flex justify-between">
                  <span>Premium:</span>
                  <span className={selectedPlan !== 'gratuito' ? 'text-green-600' : 'text-red-600'}>
                    {selectedPlan !== 'gratuito' ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-medium text-gray-700">Funcionalidades</h5>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Estadísticas detalladas:</span>
                  <span className={selectedPlan !== 'gratuito' ? 'text-green-600' : 'text-red-600'}>
                    {selectedPlan !== 'gratuito' ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Exportar datos:</span>
                  <span className={selectedPlan === 'pro' ? 'text-green-600' : 'text-red-600'}>
                    {selectedPlan === 'pro' ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Soporte prioritario:</span>
                  <span className={selectedPlan === 'pro' ? 'text-green-600' : 'text-red-600'}>
                    {selectedPlan === 'pro' ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Integración con Componentes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          🔗 Integración con Componentes
        </h3>
        <p className="text-gray-600 mb-4">
          Ejemplo de cómo el hook se integra con componentes de la interfaz.
        </p>

        <div className="space-y-4">
          {/* Botones condicionales */}
          <div className="flex flex-wrap gap-3">
            {can('rutinas:crear') && (
              <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors">
                Crear Nueva Rutina
              </button>
            )}

            {can('ejercicios:premium') && (
              <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors">
                Ejercicios Premium
              </button>
            )}

            {can('exportar:datos') && (
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                Exportar Mis Datos
              </button>
            )}

            {!can('ejercicios:premium') && (
              <button className="bg-gray-300 text-gray-600 px-4 py-2 rounded cursor-not-allowed">
                Ejercicios Premium (Actualiza tu plan)
              </button>
            )}
          </div>

          {/* Mensajes informativos */}
          <div className="space-y-2">
            {!authUser.emailVerified && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Verifica tu email para acceder a todas las funcionalidades.
                </p>
              </div>
            )}

            {hasPlan('gratuito') && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                <p className="text-blue-800 text-sm">
                  💡 Actualiza a Premium para acceder a ejercicios exclusivos y estadísticas avanzadas.
                </p>
              </div>
            )}

            {hasPlan('premium') && (
              <div className="bg-green-50 border border-green-200 p-3 rounded">
                <p className="text-green-800 text-sm">
                  ✨ ¡Disfruta de todas las funcionalidades Premium!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Información Técnica */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2">Información Técnica</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• El hook <code className="bg-gray-200 px-1 rounded">useAllowed</code> se integra automáticamente con <code className="bg-gray-200 px-1 rounded">AuthContext</code></p>
          <p>• Los permisos se actualizan dinámicamente cuando cambia el estado de autenticación</p>
          <p>• El hook maneja automáticamente los estados de carga</p>
          <p>• Los permisos se basan en el plan del usuario y otros criterios de seguridad</p>
        </div>
      </div>
    </div>
  );
}; 