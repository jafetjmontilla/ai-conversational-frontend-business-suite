'use client';

import React from 'react';
import { useAllowed } from '../../lib/hooks/useAllowed';

export const PermissionsExample: React.FC = () => {
  const {
    can,
    canAll,
    canAny,
    hasPlan,
    getCurrentPlan,
    getAvailablePermissions,
    loading
  } = useAllowed();

  if (loading) {
    return (
      <div className="p-6 bg-gray-100 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  const planActual = getCurrentPlan();
  const permisosDisponibles = getAvailablePermissions();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Sistema de Permisos - useAllowed Hook
        </h2>

        {/* Información del Plan */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Plan Actual: {planActual}
          </h3>
          <p className="text-blue-700">
            Este es tu plan actual. Los permisos se basan en tu plan de suscripción.
          </p>
        </div>

        {/* Verificaciones Básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Verificaciones Básicas</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Crear Rutinas:</span>
                <span className={can('rutinas:crear') ? 'text-green-600' : 'text-red-600'}>
                  {can('rutinas:crear') ? '✓ Permitido' : '✗ Denegado'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Rutinas Ilimitadas:</span>
                <span className={can('rutinas:ilimitadas') ? 'text-green-600' : 'text-red-600'}>
                  {can('rutinas:ilimitadas') ? '✓ Permitido' : '✗ Denegado'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Ejercicios Premium:</span>
                <span className={can('ejercicios:premium') ? 'text-green-600' : 'text-red-600'}>
                  {can('ejercicios:premium') ? '✓ Permitido' : '✗ Denegado'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Exportar Datos:</span>
                <span className={can('exportar:datos') ? 'text-green-600' : 'text-red-600'}>
                  {can('exportar:datos') ? '✓ Permitido' : '✗ Denegado'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Verificaciones de Plan</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Plan Gratuito:</span>
                <span className={hasPlan('gratuito') ? 'text-green-600' : 'text-gray-400'}>
                  {hasPlan('gratuito') ? '✓ Activo' : '✗ Inactivo'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Plan Premium:</span>
                <span className={hasPlan('premium') ? 'text-green-600' : 'text-gray-400'}>
                  {hasPlan('premium') ? '✓ Activo' : '✗ Inactivo'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Plan Pro:</span>
                <span className={hasPlan('pro') ? 'text-green-600' : 'text-gray-400'}>
                  {hasPlan('pro') ? '✓ Activo' : '✗ Inactivo'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Verificaciones Múltiples */}
        <div className="bg-yellow-50 p-4 rounded-lg mb-6">
          <h4 className="font-semibold text-yellow-800 mb-3">Verificaciones Múltiples</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Gestionar Rutinas (TODOS los permisos):</span>
              <span className={canAll(['rutinas:crear', 'rutinas:editar', 'rutinas:eliminar']) ? 'text-green-600' : 'text-red-600'}>
                {canAll(['rutinas:crear', 'rutinas:editar', 'rutinas:eliminar']) ? '✓ Permitido' : '✗ Denegado'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Acceso Premium (AL MENOS UNO):</span>
              <span className={canAny(['ejercicios:premium', 'progreso:avanzado', 'estadisticas:detalladas']) ? 'text-green-600' : 'text-red-600'}>
                {canAny(['ejercicios:premium', 'progreso:avanzado', 'estadisticas:detalladas']) ? '✓ Permitido' : '✗ Denegado'}
              </span>
            </div>
          </div>
        </div>

        {/* Funcionalidades por Plan */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">Funcionalidades Disponibles</h4>

          {/* Plan Gratuito */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-700 mb-2">Plan Gratuito</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Crear rutinas básicas
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Acceder a ejercicios básicos
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Ver progreso básico
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Configurar perfil
              </div>
            </div>
          </div>

          {/* Plan Premium */}
          <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
            <h5 className="font-medium text-purple-700 mb-2">Plan Premium</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Rutinas ilimitadas
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Ejercicios premium
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Progreso avanzado
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Estadísticas detalladas
              </div>
            </div>
          </div>

          {/* Plan Pro */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <h5 className="font-medium text-blue-700 mb-2">Plan Pro</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Exportar datos
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Soporte prioritario
              </div>
            </div>
          </div>
        </div>

        {/* Permisos Disponibles */}
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-3">
            Permisos Disponibles ({permisosDisponibles.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {permisosDisponibles.map((permiso) => (
              <div key={permiso} className="bg-white px-2 py-1 rounded border">
                {permiso}
              </div>
            ))}
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="mt-6 flex flex-wrap gap-3">
          {can('rutinas:crear') && (
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors">
              Crear Rutina
            </button>
          )}

          {can('ejercicios:premium') && (
            <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors">
              Ejercicios Premium
            </button>
          )}

          {can('exportar:datos') && (
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
              Exportar Datos
            </button>
          )}

          {!can('ejercicios:premium') && (
            <button className="bg-gray-300 text-gray-600 px-4 py-2 rounded cursor-not-allowed">
              Ejercicios Premium (No disponible)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 