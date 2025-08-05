'use client';

import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface RegisterStep1Props {
  onNext: (userData: { email: string; password: string; name: string }) => void;
  onSwitchToLogin: () => void;
}

export const RegisterStep1: React.FC<RegisterStep1Props> = ({ onNext, onSwitchToLogin }) => {
  const { signInGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // Validar si el email ya existe
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      // Intentar crear un usuario temporal para verificar si el email existe
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('../../lib/firebase');

      // Crear un usuario temporal con una contraseña temporal
      const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
      await createUserWithEmailAndPassword(auth, email, tempPassword);

      // Si llegamos aquí, el email no existía, así que eliminamos el usuario temporal
      const { deleteUser } = await import('firebase/auth');
      await deleteUser(auth.currentUser!);

      return false; // El email no existe
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        return true; // El email ya existe
      }
      return false; // Otro error, asumimos que no existe
    }
  };

  const handleEmailBlur = async () => {
    if (email && email.includes('@')) {
      setIsCheckingEmail(true);
      const exists = await checkEmailExists(email);
      setIsCheckingEmail(false);

      if (exists) {
        setError('Este email ya está registrado. Por favor, inicia sesión o usa otro email.');
      } else {
        setError('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validaciones
    if (!name.trim()) {
      setError('El nombre es requerido');
      setLoading(false);
      return;
    }

    if (!email.trim()) {
      setError('El email es requerido');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    // Verificar si el email ya existe
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      setError('Este email ya está registrado. Por favor, inicia sesión o usa otro email.');
      setLoading(false);
      return;
    }

    // Si todo está bien, pasar al siguiente paso
    onNext({ email, password, name });
    setLoading(false);
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await signInGoogle();
      if (response.success) {
        // Si el registro con Google es exitoso, redirigir al dashboard
        // El contexto de autenticación manejará la asignación de custom claims
        window.location.href = '/dashboard';
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Error inesperado al registrar con Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="text-center p-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Crear Cuenta</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Paso 1 de 2: Información básica</p>
      </div>
      <div className="p-8 space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="Tu nombre completo"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="tu@email.com"
                required
                disabled={loading || isCheckingEmail}
              />
              {isCheckingEmail && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="Mínimo 6 caracteres"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="Repite tu contraseña"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || isCheckingEmail}
          >
            {loading ? 'Verificando...' : 'Continuar'}
          </button>
        </form>

        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                O continúa con
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleRegister}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <FcGoogle className="h-4 w-4 mr-2" />
            Google
          </button>
        </div>

        <div className="text-center text-sm">
          <span className="text-gray-600 dark:text-gray-300">¿Ya tienes una cuenta? </span>
          <button
            onClick={onSwitchToLogin}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Inicia sesión
          </button>
        </div>
      </div>
    </div>
  );
}; 