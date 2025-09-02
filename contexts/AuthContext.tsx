'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, signInWithEmail, signInWithGoogle, registerWithEmail, signOutUser, getIdToken, AuthUser, AuthResponse, auth } from '../lib/firebase';
import { fetchApiV1, queries } from '@/lib/Fetching';

// Tipos para el contexto
interface AuthContextType {
  user: User | null;
  authUser: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signInGoogle: () => Promise<AuthResponse>;
  logout: () => Promise<AuthResponse>;
  getToken: () => Promise<string | null>;
  setAuthUser: (authUser: AuthUser) => void;
}

// Crear contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor del contexto
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Función para convertir User de Firebase a AuthUser
  const convertToAuthUser = async (user: User): Promise<AuthUser> => {
    // Obtener el token para acceder a los custom claims
    const token = await user.getIdToken(true); // Force refresh to get latest claims

    // Decodificar el token para obtener los custom claims
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const decodedToken = JSON.parse(jsonPayload);

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      providerId: user.providerData[0]?.providerId || 'password',
      customClaims: decodedToken.role ? {
        _id: decodedToken._id,
        role: decodedToken.role
      } : undefined
    };
  };

  // Escuchar cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setUser(user);
      if (user) {
        const authUser = await convertToAuthUser(user);
        setAuthUser(authUser);
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
      // Obtener el usuario actual de Firebase y convertir para incluir custom claims
      const currentUser = auth.currentUser;
      if (currentUser) {
        const authUser = await convertToAuthUser(currentUser);
        setAuthUser(authUser);
      } else {
        setAuthUser(response.user);
      }
    }
    return response;
  };

  // Función para iniciar sesión con Google
  const signInGoogle = async (isRegister: boolean = false): Promise<AuthResponse> => {
    const response = await signInWithGoogle();
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
    logout,
    getToken,
    setAuthUser
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