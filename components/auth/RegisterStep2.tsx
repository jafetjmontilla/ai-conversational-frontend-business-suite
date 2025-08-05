'use client';

import React, { useState } from 'react';
import { Phone, User, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { assignCustomClaims } from '../../lib/api';

interface RegisterStep2Props {
  userData: { email: string; password: string; name: string };
  onBack: () => void;
  onSuccess: () => void;
}

type Role = 'Cliente' | 'Profesional' | 'Administrador';

const roleOptions = [
  {
    value: 'Cliente' as Role,
    title: 'Cliente',
    description: 'Usuario que busca mejorar su bienestar personal',
    icon: '👤',
    features: ['Acceso a rutinas básicas', 'Seguimiento de progreso', 'Ejercicios disponibles']
  },
  {
    value: 'Profesional' as Role,
    title: 'Profesional',
    description: 'Entrenador o profesional del fitness',
    icon: '💪',
    features: ['Crear y gestionar rutinas', 'Acceso a ejercicios premium', 'Estadísticas avanzadas']
  },
  {
    value: 'Administrador' as Role,
    title: 'Administrador',
    description: 'Gestión completa del sistema',
    icon: '⚙️',
    features: ['Control total del sistema', 'Gestión de usuarios', 'Configuración avanzada']
  }
];

export const RegisterStep2: React.FC<RegisterStep2Props> = ({ userData, onBack, onSuccess }) => {
  const { register } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>('Cliente');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validaciones
    if (!phone.trim()) {
      setError('El número de teléfono es requerido');
      setLoading(false);
      return;
    }

    // Validación básica de teléfono (puedes hacerla más específica)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setError('Por favor, ingresa un número de teléfono válido');
      setLoading(false);
      return;
    }

    try {
      // Registrar el usuario
      const response = await register(userData.email, userData.password);

      if (response.success && response.user) {
        // Asignar custom claims con el rol seleccionado
        const customClaimsResponse = await assignCustomClaims(
          response.user.uid,
          selectedRole,
          'gratuito' // Plan por defecto
        );

        if (customClaimsResponse.success) {
          console.log('Usuario registrado y custom claims asignados:', customClaimsResponse.data);
          onSuccess();
        } else {
          console.warn('Usuario registrado pero error al asignar custom claims:', customClaimsResponse.message);
          // Aún así continuar, ya que el usuario se registró exitosamente
          onSuccess();
        }
      } else {
        setError(response.message || 'Error al registrar usuario');
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="text-center p-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Completar Registro</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Paso 2 de 2: Selecciona tu rol y teléfono</p>
      </div>
      <div className="p-8 space-y-8">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información del usuario */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Información del Usuario</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                <p className="text-sm text-gray-900 dark:text-white">{userData.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <p className="text-sm text-gray-900 dark:text-white">{userData.email}</p>
              </div>
            </div>
          </div>

          {/* Selección de rol */}
          <div>
            <label className="text-lg font-medium mb-4 block text-gray-900 dark:text-white">
              Selecciona tu rol
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {roleOptions.map((role) => (
                <div
                  key={role.value}
                  onClick={() => setSelectedRole(role.value)}
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedRole === role.value
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                >
                  {selectedRole === role.value && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}

                  <div className="text-center">
                    <div className="text-3xl mb-2">{role.icon}</div>
                    <h4 className="font-medium mb-1 text-gray-900 dark:text-white">{role.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{role.description}</p>

                    <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                      {role.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="h-3 w-3 text-blue-600 dark:text-blue-400 mr-1" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Número de teléfono */}
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">Número de Teléfono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="+1 (555) 123-4567"
                required
                disabled={loading}
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Usaremos este número para contactarte si es necesario
            </p>
          </div>

          {/* Plan por defecto */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
            <div className="flex items-start">
              <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Plan Gratuito Activado
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  Todos los usuarios nuevos comienzan con el plan gratuito.
                  Puedes actualizar tu plan más tarde desde tu perfil.
                </p>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Atrás
            </button>

            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Completar Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 