'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { fetchApiV1, queries } from '@/lib/Fetching';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle, XCircle, User, Mail, Phone, Shield } from 'lucide-react';
import { getAuth } from 'firebase/auth';

interface InvitationData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  token: string;
  expiresAt: string;
  used: boolean;
  createdBy: string;
  whatsappSent: boolean;
  createdAt: string;
}

interface UserData {
  name: string;
  email: string;
  phone: string;
  role: string;
}

export default function RegisterInvitationPage() {
  const { authUser, loading, signInGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isValidating, setIsValidating] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegisteringWithGoogle, setIsRegisteringWithGoogle] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (!loading && authUser?.customClaims?.role) {
      router.push('/dashboard');
    }
  }, [authUser, loading, router]);

  // Validar token al cargar la página
  useEffect(() => {
    if (token && isMounted) {
      validateToken();
    } else {
      setValidationError('Token de invitación no encontrado');
      setIsValidating(false);
    }
  }, [token, isMounted]);

  const validateToken = async () => {
    try {
      const response = await fetchApiV1({
        query: queries.validateInvitationToken,
        variables: { token },
        type: 'json'
      });

      if (response.success) {
        setInvitationData(response.data);
        setUserData(response.userData);
        setValidationError('');
      } else {
        setValidationError(response.message);
      }
    } catch (error) {
      console.error('Error validando token:', error);
      setValidationError('Error validando la invitación');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsRegistering(true);
    try {
      const response = await fetchApiV1({
        query: queries.completeUserRegistration,
        variables: {
          args: {
            token,
            password
          }
        },
        type: 'json'
      });

      if (response.success) {
        toast.success('Registro completado exitosamente');
        // El usuario será redirigido automáticamente por el AuthContext
        router.push('/dashboard');
      } else {
        toast.error(response.message || 'Error completando el registro');
      }
    } catch (error) {
      console.error('Error completando registro:', error);
      toast.error('Error completando el registro');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRegisterWithGoogle = async () => {
    setIsRegisteringWithGoogle(true);
    try {
      // Iniciar sesión con Google
      const googleResponse = await signInGoogle();

      if (!googleResponse.success || !googleResponse.user) {
        toast.error(googleResponse.message || 'Error iniciando sesión con Google');
        return;
      }

      // Verificar que el email de Google coincida con el de la invitación
      if (googleResponse.user.email !== userData?.email) {
        //borrar el usuario de firebase
        const auth = getAuth();
        auth.currentUser?.delete();
        toast.error('El email de Google no coincide con el de la invitación');
        return;
      }

      // Obtener el token de Firebase
      const firebaseToken = await auth.currentUser?.getIdToken();
      if (!firebaseToken) {
        toast.error('Error obteniendo token de Firebase');
        return;
      }

      // Completar registro con Google
      const response = await fetchApiV1({
        query: queries.completeUserRegistrationWithGoogle,
        variables: {
          args: {
            token,
            firebaseToken
          }
        },
        type: 'json'
      });

      if (response.success) {
        toast.success('Registro con Google completado exitosamente');
        // El usuario será redirigido automáticamente por el AuthContext
        router.push('/dashboard');
      } else {
        toast.error(response.message || 'Error completando el registro con Google');
      }
    } catch (error) {
      console.error('Error completando registro con Google:', error);
      toast.error('Error completando el registro con Google');
    } finally {
      setIsRegisteringWithGoogle(false);
    }
  };

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 dark:border-green-400"></div>
      </div>
    );
  }

  // Si ya está autenticado, no mostrar nada (se redirigirá)
  if (authUser?.customClaims?.role) {
    return null;
  }

  // Mostrar loading mientras se valida el token
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Validando invitación...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mostrar error si la validación falló
  if (validationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <XCircle className="h-6 w-6" />
              <span>Invitación Inválida</span>
            </CardTitle>
            <CardDescription>
              No se pudo validar tu invitación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
            <Button
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Ir al Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mostrar formulario de registro
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            <span>Completar Registro</span>
          </CardTitle>
          <CardDescription>
            ¡Hola {userData?.name}! Completa tu registro para acceder a la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mostrar información del usuario */}
          <div className="space-y-3 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Nombre:</span>
              <span className="text-sm">{userData?.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm">{userData?.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Teléfono:</span>
              <span className="text-sm">{userData?.phone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Rol:</span>
              <span className="text-sm capitalize">{userData?.role}</span>
            </div>
          </div>

          {/* Opción de registro con Google */}
          <div className="space-y-4">
            <Button
              onClick={handleRegisterWithGoogle}
              className="w-full"
              variant="outline"
              disabled={isRegisteringWithGoogle || isRegistering}
            >
              {isRegisteringWithGoogle ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando con Google...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continuar con Google
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  O continúa con contraseña
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirma tu contraseña"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isRegistering || isRegisteringWithGoogle}
            >
              {isRegistering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completando registro...
                </>
              ) : (
                'Completar Registro con Contraseña'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => router.push('/login')}
              className="text-sm"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
