'use client';

import React, { useState } from 'react';
import { Phone, ArrowLeft, Check } from 'lucide-react';
import { fetchApiV1, queries } from '@/lib/Fetching';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormInput } from '@/components/ui/input';
import { UserData } from '@/app/(public)/register/page';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { AuthUser } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

interface RegisterStep2Props {
  userData: UserData;
  onBack: () => void;
  onSuccess: () => void;
}

type Role = 'client' | 'professional' | 'admin';

export const RegisterStep2: React.FC<RegisterStep2Props> = ({ userData, onBack, onSuccess }) => {
  const { authUser, setAuthUser } = useAuth();
  const { t } = useTranslation(['auth', 'common']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roleOptions = [
    {
      value: 'client' as Role,
      title: t('auth:register.client'),
      description: '',
      icon: '👤',
      features: []
    },
    {
      value: 'professional' as Role,
      title: t('auth:register.professional'),
      description: '',
      icon: '💇🏻',
      features: []
    },
    {
      value: 'admin' as Role,
      title: t('auth:register.admin'),
      description: '',
      icon: '⚙️',
      features: []
    }
  ];

  const formSchema = z.object({
    role: z.enum(['client', 'professional', 'admin']),
    phone: z
      .string()
      .min(7, t('auth:register.errors.phoneMin'))
      .refine((val) => /^[\+]?\d[\d\s-]{5,15}$/.test(val), t('auth:register.errors.phoneInvalid')),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: 'client',
      phone: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setError('');
    try {
      let userId;
      // Si el usuario se registró con Google
      if (!userData?.password) {
        const { auth } = await import('../../lib/firebase');
        userId = auth.currentUser?.uid;
        if (!userId) {
          setError('No se pudo obtener la información del usuario');
          setLoading(false);
          return;
        }
      } else {
        // Registrar nuevo usuario con email y contraseña
        try {
          const { createUserWithEmailAndPassword } = await import('firebase/auth');
          const { auth } = await import('../../lib/firebase');
          const userCredential = await createUserWithEmailAndPassword(auth, userData?.email, userData?.password);
          userId = userCredential.user.uid;
        } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
            setError('Este email ya está registrado. Por favor, vuelve al paso anterior.');
          } else {
            setError('Error al crear el usuario. Por favor, intenta de nuevo.');
          }
          setLoading(false);
          return;
        }
      }
      // Asignar custom claims con el rol seleccionado
      const customClaimsResponse = await fetchApiV1({
        query: queries.assignCustomClaims,
        variables: {
          args: {
            uid: userId,
            role: data.role,
            plan: 'free'
          }
        }
      });
      if (customClaimsResponse.success) {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        const newAuthUser = { ...currentUser, customClaims: customClaimsResponse.data } as AuthUser;
        setAuthUser(newAuthUser);
        const response = await fetchApiV1({
          query: queries.createUser,
          variables: {
            args: {
              name: userData?.name,
              email: userData?.email,
              phone: data?.phone,
              role: data?.role,
              photoURL: newAuthUser?.photoURL ?? undefined,
            }
          }
        });
      }
      if (customClaimsResponse.success) {
        onSuccess();
      } else {
        console.warn('Error al asignar custom claims:', customClaimsResponse.message);
        setError('Error al asignar permisos. Por favor, contacta a soporte.');
        // No continuamos si hay error en los claims
        return;
      }
    } catch (err: any) {
      //borrar el usuario de firebase
      const auth = getAuth();
      auth.currentUser?.delete();
      setError(err.message || 'Error inesperado al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto transition-all duration-300 relative">
      <Button type="button" variant="secondary" className='absolute top-2 left-2 w-8 h-8 p-0 rounded-full' onClick={onBack} disabled={loading}>
        <ArrowLeft className="h-4 w-4 " />
      </Button>
      <CardHeader className="space-y-1 text-center py-2">
        <Label className="text-2xl font-bold">{t('auth:register.step2Title')}</Label>
        <Label className="text-muted-foreground text-sm">{t('auth:register.step2Subtitle')}</Label>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Información del usuario */}
            <Card className="space-y-1 p-2 bg-background">
              <CardHeader className="space-y-0 py-0">
                <CardTitle>{t('auth:register.userInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0 py-0 text-sm">
                <div className="flex gap-2">
                  <label className="font-medium text-gray-700 dark:text-gray-300">{t('auth:register.fullName')}</label>
                  <p className="text-gray-900 dark:text-white">{userData?.name}</p>
                </div>
                <div className="flex gap-2">
                  <label className="font-medium text-gray-700 dark:text-gray-300">{t('auth:register.email')}</label>
                  <p className="text-gray-900 dark:text-white">{userData?.email}</p>
                </div>
              </CardContent>
            </Card>
            <div>
              <FormLabel className="font-medium text-primary">{t('auth:register.role')}</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {roleOptions.map((role) => (
                  <div
                    key={role.value}
                    onClick={() => form.setValue('role', role.value, { shouldValidate: true })}
                    className={`relative p-2 border-2 rounded-lg cursor-pointer transition-all ${form.watch('role') === role.value
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                  >
                    {form.watch('role') === role.value && (
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
            <div>
              <FormLabel htmlFor="phone">{t('auth:register.phone')}</FormLabel>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FormInput
                          id="phone"
                          type="tel"
                          value={field.value}
                          onChange={(e) => field.onChange(e)}
                          className="pl-10 pr-4 py-2"
                          placeholder="+1 (555) 123-4567"
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage className='absolute text-xs translate-y-1.5' />
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{t('auth:register.phoneHelp')}</p>
            </div>
            <Card className='p-2'>
              <div className="flex items-start">
                <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-primary">{t('auth:register.freePlanTitle')}</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">{t('auth:register.freePlanDesc')}</p>
                </div>
              </div>
            </Card>
            <Button type="submit" style={{ marginTop: '2rem', marginBottom: '1rem' }} className="w-full" disabled={loading} >
              {loading ? t('common:creatingAccount') : t('auth:register.complete')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}; 