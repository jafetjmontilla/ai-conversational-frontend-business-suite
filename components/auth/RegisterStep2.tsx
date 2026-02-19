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

import { useAuth } from '@/contexts/AuthContext';
import { AuthUser } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';
import { Role, roles } from '@/lib/interfases';

interface RegisterStep2Props {
  userData: UserData;
  onBack: () => void;
  onSuccess: () => void;
}

export function RegisterStep2({ userData, onBack, onSuccess }: RegisterStep2Props) {
  const { authUser, setAuthUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formSchema = z.object({
    role: z.enum(roles),
    phone: z
      .string()
      .min(7, 'El teléfono debe tener al menos 7 dígitos')
      .refine((val) => /^[\+]?\d[\d\s-]{5,15}$/.test(val), 'Formato de teléfono inválido'),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: 'system_viewer',
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
      //Modificar para el primer usuario que se registre sea admin
      // Asignar custom claims con el rol seleccionado
      const customClaimsResponse = await fetchApiV1({
        query: queries.assignCustomClaims,
        variables: {
          args: {
            uid: userId,
            role: data.role
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
      <CardHeader className="space-y-1 text-center py-4">
        <Label className="text-2xl font-bold">{'Completar registro'}</Label>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Información del usuario */}
            <Card className="space-y-3 p-2 bg-background">
              <CardHeader className="space-y-0 py-0">
                <CardTitle className="text-center py-2">{'Información del usuario'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 py-0 text-sm">
                <div className="flex gap-2">
                  <label className="font-medium text-gray-700 dark:text-gray-300">{'Nombre:'}</label>
                  <p className="text-gray-900 dark:text-white">{userData?.name}</p>
                </div>
                <div className="flex gap-2">
                  <label className="font-medium text-gray-700 dark:text-gray-300">{'Email:'}</label>
                  <p className="text-gray-900 dark:text-white">{userData?.email}</p>
                </div>
                <div className="flex gap-2">
                  <label className="font-medium text-gray-700 dark:text-gray-300">{'Rol:'}</label>
                  <p className="text-gray-900 dark:text-white">{userData?.role}</p>
                </div>
              </CardContent>
            </Card>
            <div className='pb-12'>
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className='space-y-0 relative'>
                    <FormLabel htmlFor="phone">{'Teléfono'}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <FormInput
                          id="phone"
                          type="tel"
                          value={field.value}
                          onChange={(e) => field.onChange(e)}
                          className="pl-10 pr-4 py-2"
                          placeholder="+584123456789"
                          disabled={loading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className='absolute text-xs' />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" style={{ marginTop: '2rem', marginBottom: '1rem' }} className="w-full" disabled={loading} >
              {loading ? 'Creando cuenta...' : 'Completar registro'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}; 