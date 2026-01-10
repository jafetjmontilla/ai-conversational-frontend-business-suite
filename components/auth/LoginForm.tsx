'use client';

import React, { useState } from 'react';

import { useAuth } from '../../contexts/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormInput } from '@/components/ui/input';
import { useThemeContext } from '../../contexts/ThemeContext';
import Image from 'next/image';
import { PasswordRecoveryForm } from './PasswordRecoveryForm';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSuccess?: () => void;
}

export function LoginForm({ onSwitchToRegister, onSuccess }: LoginFormProps) {
  const { signIn, signInGoogle, errorAuth } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const { theme, isDark } = useThemeContext();
  const formSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const values = [
    {
      name: 'email' as const,
      label: 'Email',
      placeholder: 'tu@email.com',
      icon: Mail,
      type: 'email' as const,
    },
    {
      name: 'password' as const,
      label: 'Contraseña',
      placeholder: '••••••••',
      icon: Lock,
      type: 'password' as const,
    },
  ];

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError('');
    try {
      const response = await signIn(values.email, values.password);
      if (response.success) {
        onSuccess?.();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await signInGoogle();
      if (response.success) {
        onSuccess?.();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Error inesperado con Google');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRecovery = () => {
    setShowPasswordRecovery(true);
  };

  const handleBackToLogin = () => {
    setShowPasswordRecovery(false);
    setError('');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {!showPasswordRecovery ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.15 }}
          >
            <Card className="w-full">
              <Image src={theme === "dark" ? '/images/4netGradientDark.png' : '/images/4netGradientLight.png'} alt="4netERP" width={200} height={200} className="mt-10 mx-auto" />
              <CardHeader className="text-center space-y-1 py-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Iniciar sesión</h2>
                <p className="text-gray-600 dark:text-gray-300">Accede a tu cuenta</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {error || errorAuth && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                    <p className="text-red-800 dark:text-red-200 text-sm">{error || errorAuth}</p>
                  </div>
                )}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {values.map((value) => (
                      <FormField
                        key={value.name}
                        control={form.control}
                        name={value.name}
                        render={({ field }) => (
                          <FormItem className='space-y-0 relative'>
                            <FormLabel>{value.label}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <value.icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <FormInput
                                  {...field}
                                  type={value.name === 'password' ? (showPassword ? 'text' : 'password') : value.type}
                                  placeholder={value.placeholder}
                                  className={value.name === 'password' ? 'pl-10 pr-10' : 'pl-10'}
                                  disabled={loading}
                                />
                                {value.name === 'password' && (
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                  >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage className="absolute text-xs" />
                          </FormItem>
                        )}
                      />
                    ))}
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="link"
                        onClick={handlePasswordRecovery}
                        className="text-sm px-0"
                      >
                        ¿Olvidaste tu contraseña?
                      </Button>
                    </div>
                    <div className='mt-6' />
                    <Button variant={isDark ? "outline" : "default"} type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Cargando...' : 'Iniciar sesión'}
                    </Button>
                  </form>
                </Form>
                <div className="space-y-4 pb-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-card text-muted-foreground">O continúa con</span>
                    </div>
                  </div>
                  <Button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    variant={isDark ? "default" : "outline"}
                    className="w-full"
                  >
                    <FcGoogle className="h-4 w-4 mr-2" />
                    {loading ? 'Conectando...' : 'Google'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="password-recovery"
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.15 }}
          >
            <PasswordRecoveryForm onBackToLogin={handleBackToLogin} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 