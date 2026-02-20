'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import type { AuthUser, AuthResponse, } from '../lib/firebase';

/** Respuesta de getMe: usuario + negocio poblado (si tiene business_id) + rol en ese negocio. */
export interface MeData {
  user: { _id: string; name?: string; email?: string; phone?: string; role?: string; active?: boolean; emailVerified?: boolean; photoURL?: string; createdAt?: string; updatedAt?: string };
  business: { _id: string; name: string; businessId: string; description?: string; active: boolean; createdAt?: string; updatedAt?: string } | null;
  businessRole: string | null;
}

// Tipos para el contexto
interface AuthContextType {
  user: User | null;
  authUser: AuthUser | null;
  /** Datos del usuario actual desde getMe (una sola llamada: user + business + businessRole). */
  meData: MeData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signInGoogle: () => Promise<AuthResponse>;
  logout: () => Promise<AuthResponse>;
  getToken: () => Promise<string | null>;
  setAuthUser: (authUser: AuthUser) => void;
  sendPasswordResetEmail: (email: string) => Promise<AuthResponse>;
  errorAuth: string | undefined;
}

// Crear contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor del contexto
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [meData, setMeData] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorAuth, setErrorAuth] = useState<string | undefined>(undefined);


  // useEffect con inicialización de Firebase
  useEffect(() => {
    // Importación dinámica de firebase solo en el cliente
    const initAuth = async () => {
      try {
        const { onAuthStateChange, auth } = await import('@/lib/firebase');
        const { fetchApiV1, queries } = await import('@/lib/Fetching');

        const unsubscribe = onAuthStateChange(async (user) => {
          try {
            setLoading(true);

            if (typeof window !== 'undefined' && window.location.pathname !== '/register-invitation') {
              try {
                if (user?.uid) {
                  const data = await fetchApiV1({
                    query: queries.getMe,
                    type: 'json',
                  }) as { user?: { _id: string }; business?: MeData['business']; businessRole?: string | null } | undefined;
                  const userData = data?.user;

                  if (!userData?._id) {
                    setUser(null);
                    setAuthUser(null);
                    setMeData(null);
                    await auth.currentUser?.delete();
                    setLoading(false);
                    return;
                  }
                  setMeData(data ? { user: data.user!, business: data.business ?? null, businessRole: data.businessRole ?? null } : null);
                } else {
                  setMeData(null);
                }
              } catch (error) {
                console.error('Error al verificar usuario en base de datos:', error);
                setMeData(null);
              }
            }

            setErrorAuth(undefined);
            setUser(user);

            if (user) {
              try {
                // Convertir user a AuthUser
                const token = await user.getIdToken(true);
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                  return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const decodedToken = JSON.parse(jsonPayload);

                const authUser: AuthUser = {
                  uid: user.uid,
                  email: user.email,
                  displayName: user.displayName,
                  photoURL: user.photoURL,
                  emailVerified: user.emailVerified,
                  providerId: user.providerData[0]?.providerId || 'password',
                  customClaims: decodedToken.role ? {
                    _id: decodedToken._id,
                    role: decodedToken.role,
                    phone: decodedToken.phone,
                    assignedAt: decodedToken.assignedAt
                  } : undefined
                };

                setAuthUser(authUser);
              } catch (error) {
                console.error('Error al convertir usuario:', error);
                setAuthUser(null);
              }
            } else {
              setAuthUser(null);
            }
          } catch (error) {
            console.error('Error en onAuthStateChange:', error);
            setErrorAuth('Error de autenticación');
          } finally {
            setLoading(false);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error al inicializar auth:', error);
        setLoading(false);
      }
    };

    let unsubscribe: (() => void) | undefined;
    initAuth().then(unsub => {
      if (unsub) unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    const { signInWithEmail, auth } = await import('@/lib/firebase');
    const response = await signInWithEmail(email, password);
    if (response.success && response.user) {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken(true);
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const decodedToken = JSON.parse(jsonPayload);

        const authUser: AuthUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          emailVerified: currentUser.emailVerified,
          providerId: currentUser.providerData[0]?.providerId || 'password',
          customClaims: decodedToken.role ? {
            _id: decodedToken._id,
            role: decodedToken.role,
            phone: decodedToken.phone,
            assignedAt: decodedToken.assignedAt
          } : undefined
        };

        setAuthUser(authUser);
      } else {
        setAuthUser(response.user as AuthUser);
      }
    }
    return response;
  };

  const signInGoogle = async (): Promise<AuthResponse> => {
    const { signInWithGoogle } = await import('@/lib/firebase');
    const response = await signInWithGoogle();
    if (response.success) {
      return response;
    }
    setErrorAuth('Usuario no encontrado 1');
    return response;
  };

  const logout = async (): Promise<AuthResponse> => {
    const { signOutUser } = await import('@/lib/firebase');
    const response = await signOutUser();
    if (response.success) {
      setUser(null);
      setAuthUser(null);
      setMeData(null);
    }
    return response;
  };

  const getToken = async (): Promise<string | null> => {
    const { getIdToken } = await import('@/lib/firebase');
    return await getIdToken();
  };

  const handleSendPasswordResetEmail = async (email: string): Promise<AuthResponse> => {
    const { sendPasswordResetEmail } = await import('@/lib/firebase');
    return await sendPasswordResetEmail(email);
  };

  const value: AuthContextType = {
    user,
    authUser,
    meData,
    loading,
    signIn,
    signInGoogle,
    logout,
    getToken,
    setAuthUser,
    sendPasswordResetEmail: handleSendPasswordResetEmail,
    errorAuth,
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
