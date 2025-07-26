'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  onAuthStateChange,
  signInWithEmail,
  signInWithGoogle,
  registerWithEmail,
  signOutUser,
  getIdToken,
  AuthUser,
  AuthResponse
} from '../lib/firebase';

// Tipos para el contexto
interface AuthContextType {
  user: User | null;
  authUser: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signInGoogle: () => Promise<AuthResponse>;
  register: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<AuthResponse>;
  getToken: () => Promise<string | null>;
}

// Crear contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor del contexto
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Función para convertir User de Firebase a AuthUser
  const convertToAuthUser = (user: User): AuthUser => ({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    providerId: user.providerData[0]?.providerId || 'password'
  });

  // Escuchar cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      if (user) {
        setAuthUser(convertToAuthUser(user));
      } else {
        setAuthUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Función para iniciar sesión con email y contraseña
  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await signInWithEmail(email, password);
    if (response.success && response.user) {
      setAuthUser(response.user);
    }
    return response;
  };

  // Función para iniciar sesión con Google
  const signInGoogle = async (): Promise<AuthResponse> => {
    const response = await signInWithGoogle();
    if (response.success && response.user) {
      setAuthUser(response.user);
    }
    return response;
  };

  // Función para registrar usuario
  const register = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await registerWithEmail(email, password);
    if (response.success && response.user) {
      setAuthUser(response.user);
    }
    return response;
  };

  // Función para cerrar sesión
  const logout = async (): Promise<AuthResponse> => {
    const response = await signOutUser();
    if (response.success) {
      setUser(null);
      setAuthUser(null);
    }
    return response;
  };

  // Función para obtener token
  const getToken = async (): Promise<string | null> => {
    return await getIdToken();
  };

  const value: AuthContextType = {
    user,
    authUser,
    loading,
    signIn,
    signInGoogle,
    register,
    logout,
    getToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar el contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}; 