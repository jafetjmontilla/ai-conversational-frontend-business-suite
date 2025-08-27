'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAllowed } from '@/lib/hooks/useAllowed';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function DashboardPage() {
  const { authUser, loading, logout } = useAuth();
  const { getCurrentRole, getCurrentPlan } = useAllowed();
  const router = useRouter();
  const { t } = useTranslation(['dashboard', 'common']);

  useEffect(() => {
    if (!loading && !authUser) {
      router.push('/login');
    }
    if (authUser?.customClaims) {
      router.push('/dashboard');
    }
  }, [authUser, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!authUser) return null;

  const currentRole = getCurrentRole();
  const currentPlan = getCurrentPlan();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold">{t('dashboard:title')}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{authUser.displayName || authUser.email}</span>
                <Separator orientation="vertical" className="h-4" />
                <Badge variant="secondary" className="capitalize">{currentRole}</Badge>
                <Separator orientation="vertical" className="h-4" />
                <Badge variant="outline" className="capitalize">{currentPlan}</Badge>
              </div>
              <Button variant="destructive" onClick={handleLogout}>
                {t('common:logout')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Welcome Section */}
        <Card>
          <CardContent className="text-center p-8">
            <h2 className="text-3xl font-bold mb-4">{t('dashboard:welcomeTitle')}</h2>
            <p className="text-lg text-muted-foreground">{t('dashboard:welcomeSubtitle')}</p>
          </CardContent>
        </Card>

        {/* User Info Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
          <CardHeader>
            <CardTitle>{t('dashboard:accountInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('dashboard:name')}</label>
                <p className="text-sm font-medium">{authUser.displayName || 'No especificado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('dashboard:email')}</label>
                <p className="text-sm font-medium">{authUser.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('dashboard:emailVerified')}</label>
                <Badge variant={authUser.emailVerified ? "default" : "secondary"} className="mt-1">
                  {authUser.emailVerified ? t('common:yes') : t('common:no')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role and Plan Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard:yourRole')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize mb-2">{currentRole}</div>
              <p className="text-muted-foreground">{t(`dashboard:roleDesc.${currentRole}`)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard:yourPlan')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize mb-2">{currentPlan}</div>
              <p className="text-muted-foreground">{t(`dashboard:planDesc.${currentPlan}`)}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 