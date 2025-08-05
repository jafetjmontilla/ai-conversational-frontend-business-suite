'use client';

import React from 'react';
import {
  useRoutinePermissions,
  useExercisePermissions,
  useProgressPermissions,
  useConfigPermissions,
  useExportPermissions,
  useSupportPermissions,
  useEmailPermissions
} from '../../lib/hooks/useAllowed';

export const SpecializedHooksExample: React.FC = () => {
  // Hooks especializados
  const routinePerms = useRoutinePermissions();
  const exercisePerms = useExercisePermissions();
  const progressPerms = useProgressPermissions();
  const configPerms = useConfigPermissions();
  const exportPerms = useExportPermissions();
  const supportPerms = useSupportPermissions();
  const emailPerms = useEmailPermissions();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Hooks Especializados - useAllowed
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Permisos de Rutinas */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-3">
              🏃‍♂️ Permisos de Rutinas
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Crear rutinas:</span>
                <span className={routinePerms.canCreate() ? 'text-green-600' : 'text-red-600'}>
                  {routinePerms.canCreate() ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Editar rutinas:</span>
                <span className={routinePerms.canEdit() ? 'text-green-600' : 'text-red-600'}>
                  {routinePerms.canEdit() ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Eliminar rutinas:</span>
                <span className={routinePerms.canDelete() ? 'text-green-600' : 'text-red-600'}>
                  {routinePerms.canDelete() ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Rutinas ilimitadas:</span>
                <span className={routinePerms.canUnlimited() ? 'text-green-600' : 'text-red-600'}>
                  {routinePerms.canUnlimited() ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Acceso premium:</span>
                <span className={routinePerms.hasPremiumAccess() ? 'text-green-600' : 'text-red-600'}>
                  {routinePerms.hasPremiumAccess() ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>

          {/* Permisos de Ejercicios */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              💪 Permisos de Ejercicios
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Acceder a ejercicios:</span>
                <span className={exercisePerms.canAccess() ? 'text-green-600' : 'text-red-600'}>
                  {exercisePerms.canAccess() ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Ejercicios premium:</span>
                <span className={exercisePerms.canAccessPremium() ? 'text-green-600' : 'text-red-600'}>
                  {exercisePerms.canAccessPremium() ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Acceso premium:</span>
                <span className={exercisePerms.hasPremiumAccess() ? 'text-green-600' : 'text-red-600'}>
                  {exercisePerms.hasPremiumAccess() ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>

          {/* Permisos de Progreso */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 mb-3">
              📊 Permisos de Progreso
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Ver progreso:</span>
                <span className={progressPerms.canView() ? 'text-green-600' : 'text-red-600'}>
                  {progressPerms.canView() ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Progreso avanzado:</span>
                <span className={progressPerms.canViewAdvanced() ? 'text-green-600' : 'text-red-600'}>
                  {progressPerms.canViewAdvanced() ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Estadísticas detalladas:</span>
                <span className={progressPerms.canViewDetailedStats() ? 'text-green-600' : 'text-red-600'}>
                  {progressPerms.canViewDetailedStats() ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Acceso premium:</span>
                <span className={progressPerms.hasPremiumAccess() ? 'text-green-600' : 'text-red-600'}>
                  {progressPerms.hasPremiumAccess() ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>

          {/* Permisos de Configuración */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">
              ⚙️ Permisos de Configuración
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Editar perfil:</span>
                <span className={configPerms.canEditProfile() ? 'text-green-600' : 'text-red-600'}>
                  {configPerms.canEditProfile() ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Configuración avanzada:</span>
                <span className={configPerms.canAdvancedConfig() ? 'text-green-600' : 'text-red-600'}>
                  {configPerms.canAdvancedConfig() ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Acceso premium:</span>
                <span className={configPerms.hasPremiumAccess() ? 'text-green-600' : 'text-red-600'}>
                  {configPerms.hasPremiumAccess() ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>

          {/* Permisos de Exportación */}
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <h3 className="text-lg font-semibold text-indigo-800 mb-3">
              📤 Permisos de Exportación
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Exportar datos:</span>
                <span className={exportPerms.canExportData() ? 'text-green-600' : 'text-red-600'}>
                  {exportPerms.canExportData() ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Plan Pro:</span>
                <span className={exportPerms.hasProPlan() ? 'text-green-600' : 'text-red-600'}>
                  {exportPerms.hasProPlan() ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>

          {/* Permisos de Soporte */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="text-lg font-semibold text-red-800 mb-3">
              🆘 Permisos de Soporte
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Soporte prioritario:</span>
                <span className={supportPerms.hasPrioritySupport() ? 'text-green-600' : 'text-red-600'}>
                  {supportPerms.hasPrioritySupport() ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Plan Pro:</span>
                <span className={supportPerms.hasProPlan() ? 'text-green-600' : 'text-red-600'}>
                  {supportPerms.hasProPlan() ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>

          {/* Permisos de Email */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              📧 Permisos de Email
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Email verificado:</span>
                <span className={emailPerms.isEmailVerified() ? 'text-green-600' : 'text-red-600'}>
                  {emailPerms.isEmailVerified() ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Estado actual:</span>
                <span className={emailPerms.emailVerified ? 'text-green-600' : 'text-red-600'}>
                  {emailPerms.emailVerified ? 'Verificado' : 'No verificado'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-3">Acciones Disponibles</h4>
          <div className="flex flex-wrap gap-3">
            {routinePerms.canCreate() && (
              <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors">
                Crear Rutina
              </button>
            )}

            {exercisePerms.canAccessPremium() && (
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                Ejercicios Premium
              </button>
            )}

            {progressPerms.canViewDetailedStats() && (
              <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors">
                Estadísticas Detalladas
              </button>
            )}

            {configPerms.canAdvancedConfig() && (
              <button className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors">
                Configuración Avanzada
              </button>
            )}

            {exportPerms.canExportData() && (
              <button className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-colors">
                Exportar Datos
              </button>
            )}

            {supportPerms.hasPrioritySupport() && (
              <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors">
                Soporte Prioritario
              </button>
            )}

            {!emailPerms.isEmailVerified() && (
              <button className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors">
                Verificar Email
              </button>
            )}
          </div>
        </div>

        {/* Información Adicional */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Información del Hook</h4>
          <p className="text-blue-700 text-sm">
            Los hooks especializados proporcionan una interfaz más específica y fácil de usar
            para verificar permisos en áreas específicas de la aplicación. Cada hook se enfoca
            en un conjunto particular de funcionalidades y devuelve métodos descriptivos.
          </p>
        </div>
      </div>
    </div>
  );
}; 