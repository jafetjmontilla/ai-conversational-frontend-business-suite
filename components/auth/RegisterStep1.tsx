'use client';

import React from 'react';

import { FcGoogle } from 'react-icons/fc';
import { Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useTheme } from 'next-themes';
import { fetchApiV1, queries } from '@/lib/Fetching';
import { UserData } from '@/app/(public)/register/page';


interface RegisterStep1Props {
  userData: UserData;
  onNext: (userData: UserData) => void;
  onSwitchToLogin: () => void;
}

export function RegisterStep1({ onNext, onSwitchToLogin, userData }: RegisterStep1Props) {
  const { signInGoogle } = useAuth();
  const [isCheckingEmail, setIsCheckingEmail] = React.useState(false);
  const { theme } = useTheme();

  const formSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ["confirmPassword"],
  });

  type FormData = z.infer<typeof formSchema>;

  const values = [
    {
      name: 'name',
      label: 'Nombre completo',
      placeholder: 'Tu nombre completo',
      icon: User,
    },
    {
      name: 'email',
      label: 'Email',
      placeholder: 'tu@email.com',
      icon: Mail,
    },
    {
      name: 'password',
      label: 'Contraseña',
      placeholder: 'Mínimo 6 caracteres',
      icon: Lock,
      type: 'password',
    },
    {
      name: 'confirmPassword',
      label: 'Confirmar contraseña',
      placeholder: '••••••••',
      icon: Lock,
      type: 'password',
    },
  ]

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: values.reduce((acc, value) => {
      if (userData?.[value.name as keyof UserData]) {
        return { ...acc, [value.name]: userData[value.name as keyof UserData] }
      }
      return { ...acc, [value.name]: '' }
    }, {}),
  });

  // Validar si el email ya existe (backend GraphQL)
  const checkEmailExists = async (rawEmail: string): Promise<boolean> => {
    const email = (rawEmail || '').trim().toLowerCase();
    if (!email) return false;
    try {
      const exists = await fetchApiV1({
        query: queries.emailExists,
        variables: { args: { email } },
        type: 'json'
      });
      return exists === true;
    } catch (e) {
      console.error('Error verificando email:', e);
      return false;
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsCheckingEmail(true);
      const emailExists = await checkEmailExists(data.email);
      if (emailExists) {
        form.setError('email', { message: 'Este email ya está registrado' });
        return;
      }
      const userDataToPass = {
        email: data.email,
        password: data.password,
        name: data.name,
        confirmPassword: data.confirmPassword,
        role: userData.role,
      };
      onNext(userDataToPass);
    } catch (error) {
      toast.error('Error inesperado');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  //Modificar para el primer usuario que se registre sea admin
  const handleGoogleRegister = async () => {
    try {
      const response = await signInGoogle();
      if (response.success && response.user) {
        // Pasar al siguiente paso con los datos del usuario de Google
        onNext({
          email: response.user.email || '',
          name: response.user.displayName || '',
          password: '', // No necesitamos contraseña para auth con Google
          role: userData.role,
        });
      } else {
        toast.error(response.message || 'Error inesperado con Google');
      }
    } catch (err) {
      toast.error('Error inesperado con Google');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1 text-center py-2 pt-4">
        <Label className="text-2xl font-bold">{'Crear cuenta'}</Label>
      </CardHeader>
      <CardContent className="space-y-6 pb-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {values.map((value) => (
              <FormField
                key={value.name}
                control={form.control}
                name={value.name as keyof FormData}
                render={({ field }) => (
                  <FormItem className="space-y-0 relative">
                    <FormLabel>{value.label}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <value.icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <FormInput
                          {...field}
                          placeholder={value.placeholder}
                          className="pl-10"
                          disabled={form.formState.isSubmitting || (value.name === 'email' && isCheckingEmail)}
                          type={value?.type || 'text'}
                          onBlur={value.name === 'email' ? async () => {
                            setIsCheckingEmail(true);
                            const exists = await checkEmailExists(field.value);
                            if (exists) {
                              form.setError('email', { message: 'Este email ya está registrado' });
                            } else {
                              form.clearErrors('email');
                            }
                            setIsCheckingEmail(false);
                          } : undefined}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="absolute text-xs" />
                  </FormItem>
                )}
              />
            ))}
            <Button
              type="submit"
              variant={theme === "dark" ? "outline" : "default"}
              className="w-full"
              disabled={form.formState.isSubmitting || isCheckingEmail}
            >
              {form.formState.isSubmitting ? 'Cargando...' : 'Siguiente'}
            </Button>
          </form>
        </Form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-muted-foreground">
              {'O continúa con'}
            </span>
          </div>
        </div>
        <Button
          variant={theme === "dark" ? "default" : "outline"}
          className="w-full"
          onClick={handleGoogleRegister}
          disabled={form.formState.isSubmitting}
        >
          <FcGoogle className="h-4 w-4 mr-2" />
          {form.formState.isSubmitting ? 'Conectando...' : 'Google'}
        </Button>
        <div className="text-center text-sm">
          <span className="text-muted-foreground">{'¿Ya tienes una cuenta?'} </span>
          <Button
            variant="link"
            className="px-2 font-medium"
            onClick={onSwitchToLogin}
          >
            {'Inicia sesión'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};