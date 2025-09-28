'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Loader2, CheckCircle, XCircle, User, Mail, Phone, Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { FcGoogle } from 'react-icons/fc';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormInput } from '@/components/ui/input';
import { useThemeContext } from '@/contexts/ThemeContext';
import Image from 'next/image';

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

interface RegisterInvitationFormProps {
  token: string;
  onSuccess?: () => void;
}

const formSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'La confirmación de contraseña debe tener al menos 6 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export const RegisterInvitationForm: React.FC<RegisterInvitationFormProps> = ({ token, onSuccess }) => {
  const { signInGoogle } = useAuth();
  const router = useRouter();
  const { theme, isDark } = useThemeContext();

  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegisteringWithGoogle, setIsRegisteringWithGoogle] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Validar token al cargar el componente
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

  const onSubmit = async (values: FormValues) => {
    setIsRegistering(true);
    try {
      const response = await fetchApiV1({
        query: queries.completeUserRegistration,
        variables: {
          args: {
            token,
            password: values.password
          }
        },
        type: 'json'
      });

      if (response.success) {
        toast.success('Registro completado exitosamente');
        onSuccess?.();
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
        onSuccess?.();
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

  // Mostrar loading mientras se valida el token
  if (isValidating) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Validando invitación...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mostrar error si la validación falló
  if (validationError) {
    return (
      <Card className="w-full max-w-md mx-auto">
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
    );
  }

  // Mostrar formulario de registro
  return (
    <Card className="w-full max-w-md mx-auto">
      <Image
        src={theme === "dark" ? '/images/sistemasJaihomLogo.png' : '/images/sistemasJaihomLogo.png'}
        alt="sistemasJaihom"
        width={200}
        height={200}
        className="mt-10 mx-auto"
      />
      <CardHeader className="text-center space-y-1 py-6">
        <CardTitle className="flex items-center justify-center space-x-2 text-green-600">
          <CheckCircle className="h-6 w-6" />
          <span>Completar Registro</span>
        </CardTitle>
        <CardDescription>
          ¡Hola {userData?.name}! Completa tu registro para acceder a la plataforma
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Mostrar información del usuario */}
        <div className="space-y-2 p-4 mb-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
        <div className="space-y-3">
          <Button
            onClick={handleRegisterWithGoogle}
            className="w-full"
            disabled={isRegisteringWithGoogle || isRegistering}
            variant={isDark ? "default" : "outline"}
          >
            {isRegisteringWithGoogle ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando con Google...
              </>
            ) : (
              <>
                <FcGoogle className="mr-2 h-4 w-4" />
                Continuar con Google
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                O continúa con contraseña
              </span>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className='space-y-0 relative'  >
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <FormInput
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Ingresa tu contraseña"
                        className="pl-10 pr-10"
                        disabled={isRegistering || isRegisteringWithGoogle}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="absolute text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className='space-y-0 relative'>
                  <FormLabel>Confirmar Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative" >
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <FormInput
                        {...field}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirma tu contraseña"
                        className="pl-10 pr-10"
                        disabled={isRegistering || isRegisteringWithGoogle}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="absolute text-xs" />
                </FormItem>
              )}
            />
            <div className='mt-10' />
            <Button
              variant={isDark ? "outline" : "default"}
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
        </Form>

        <div className="text-center">
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
  );
};
