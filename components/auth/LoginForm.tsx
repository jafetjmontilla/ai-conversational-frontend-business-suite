'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useTheme } from 'next-themes';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onSuccess }) => {
  const { signIn, signInGoogle } = useAuth();
  const { t } = useTranslation(['auth', 'common']);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { theme } = useTheme();
  const formSchema = z.object({
    email: z.string().email(t('auth:login.errors.emailInvalid')),
    password: z.string().min(6, t('auth:login.errors.passwordMin')),
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
      label: t('auth:login.email'),
      placeholder: t('auth:login.emailPlaceholder'),
      icon: Mail,
      type: 'email' as const,
    },
    {
      name: 'password' as const,
      label: t('auth:login.password'),
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
      setError(t('auth:login.errors.unexpected'));
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
      setError(t('auth:login.errors.unexpectedGoogle'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center space-y-1 py-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('auth:login.title')}</h2>
        <p className="text-gray-600 dark:text-gray-300">{t('auth:login.subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
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
                  <FormItem>
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={loading}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <Button variant={theme === "dark" ? "outline" : "default"} type="submit" className="w-full" disabled={loading}>
              {loading ? t('common:loading') : t('auth:login.submit')}
            </Button>
          </form>
        </Form>
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">{t('common:orContinueWith')}</span>
            </div>
          </div>
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            variant={theme === "dark" ? "default" : "outline"}
            className="w-full"
          >
            <FcGoogle className="h-4 w-4 mr-2" />
            {loading ? t('common:connecting') : t('auth:login.google')}
          </Button>
        </div>
        <div className="text-center text-sm">
          <span className="text-gray-600 dark:text-gray-300">{t('auth:login.noAccount')} </span>
          <button
            onClick={onSwitchToRegister}
            disabled={loading}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium disabled:opacity-50"
          >
            {t('auth:login.signUp')}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}; 