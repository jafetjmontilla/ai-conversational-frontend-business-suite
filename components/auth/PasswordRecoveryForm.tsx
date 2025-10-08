'use client';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormInput } from '@/components/ui/input';
import { useThemeContext } from '../../contexts/ThemeContext';
import Image from 'next/image';
import { toast } from 'sonner';

interface PasswordRecoveryFormProps {
  onBackToLogin: () => void;
}

const formSchema = z.object({
  email: z.string().email('Email inválido'),
});

type FormValues = z.infer<typeof formSchema>;

export function PasswordRecoveryForm({ onBackToLogin }: PasswordRecoveryFormProps) {
  const { sendPasswordResetEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const { theme, isDark } = useThemeContext();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError('');
    try {
      const response = await sendPasswordResetEmail(values.email);
      if (response.success) {
        setEmailSent(true);
        toast.success('Email de recuperación enviado correctamente');
      } else {
        setError(response.message || 'Error enviando el email de recuperación');
        toast.error(response.message || 'Error enviando el email de recuperación');
      }
    } catch (err) {
      setError('Error inesperado');
      toast.error('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
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
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Email Enviado</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Te hemos enviado un enlace para restablecer tu contraseña
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
            <p className="text-green-800 dark:text-green-200 text-sm text-center">
              Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={onBackToLogin}
              variant={isDark ? "outline" : "default"}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Login
            </Button>

            <Button
              onClick={() => setEmailSent(false)}
              variant="link"
              className="w-full text-sm"
            >
              ¿No recibiste el email? Intentar de nuevo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

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
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Recuperar Contraseña</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Ingresa tu email para recibir un enlace de recuperación
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className='space-y-0 relative'>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <FormInput
                        {...field}
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-10"
                        disabled={loading}
                      />
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
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Email de Recuperación'}
            </Button>
          </form>
        </Form>

        <div className="text-center">
          <Button
            onClick={onBackToLogin}
            variant="link"
            className="text-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Login
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
