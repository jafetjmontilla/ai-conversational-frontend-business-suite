'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FcGoogle } from 'react-icons/fc';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface RegisterStep1Props {
  onNext: (userData: { email: string; password: string; name: string }) => void;
  onSwitchToLogin: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

export const RegisterStep1: React.FC<RegisterStep1Props> = ({ onNext, onSwitchToLogin }) => {
  const { signInGoogle } = useAuth();
  const { t } = useTranslation(['auth', 'common']);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Validar si el email ya existe
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('../../lib/firebase');
      const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
      await createUserWithEmailAndPassword(auth, email, tempPassword);
      const { deleteUser } = await import('firebase/auth');
      await deleteUser(auth.currentUser!);
      return false;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        return true;
      }
      return false;
    }
  };

  const handleEmailBlur = async (email: string) => {
    if (email && email.includes('@')) {
      setIsCheckingEmail(true);
      const exists = await checkEmailExists(email);
      setIsCheckingEmail(false);

      if (exists) {
        form.setError('email', { message: t('auth:register.errors.emailExists') });
      }
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const emailExists = await checkEmailExists(data.email);
      if (emailExists) {
        form.setError('email', { message: t('auth:register.errors.emailExists') });
        return;
      }

      onNext({
        email: data.email,
        password: data.password,
        name: data.name,
      });
    } catch (error) {
      toast.error(t('auth:register.errors.unexpectedError'));
    }
  };

  const handleGoogleRegister = async () => {
    try {
      const response = await signInGoogle();
      if (response.success) {
        window.location.href = '/dashboard';
      } else {
        toast.error(response.message);
      }
    } catch (err) {
      toast.error(t('auth:register.errors.unexpectedGoogle'));
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1 text-center">
        <h2 className="text-3xl font-bold">{t('auth:register.title')}</h2>
        <p className="text-muted-foreground">{t('auth:register.step1Subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth:register.fullName')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        {...field}
                        placeholder={t('auth:register.fullNamePlaceholder')}
                        className="pl-10"
                        disabled={form.formState.isSubmitting}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth:register.email')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        {...field}
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-10"
                        disabled={form.formState.isSubmitting || isCheckingEmail}
                        onBlur={() => handleEmailBlur(field.value)}
                      />
                      {isCheckingEmail && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth:register.password')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('auth:register.passwordHint')}
                        className="pl-10 pr-10"
                        disabled={form.formState.isSubmitting}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={form.formState.isSubmitting}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth:register.confirmPassword')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        {...field}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        disabled={form.formState.isSubmitting}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={form.formState.isSubmitting}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting || isCheckingEmail}
            >
              {form.formState.isSubmitting ? t('common:loading') : t('common:next')}
            </Button>
          </form>
        </Form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">
              {t('common:orContinueWith')}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleRegister}
          disabled={form.formState.isSubmitting}
        >
          <FcGoogle className="h-4 w-4 mr-2" />
          {form.formState.isSubmitting ? t('common:connecting') : 'Google'}
        </Button>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">{t('auth:register.hasAccount')} </span>
          <Button
            variant="link"
            className="px-2 font-medium"
            onClick={onSwitchToLogin}
          >
            {t('auth:register.signIn')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};