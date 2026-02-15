'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAllowed } from '@/lib/hooks/useAllowed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PWAUpdateDialog } from '@/components/PWAUpdateDialog';
import { usePWAUpdate } from '@/hooks/usePWAUpdate';

export default function DashboardPage() {
  const { authUser, loading, logout } = useAuth();
  const { getCurrentRole } = useAllowed();
  const router = useRouter();
  const { showUpdatePrompt, updateServiceWorker, dismissUpdate } = usePWAUpdate();

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
            <h1 className="text-xl font-bold md:text-2xl">Dashboard</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{authUser.displayName || authUser.email}</span>
                <Separator orientation="vertical" className="h-4" />
                <Badge variant="secondary" className="capitalize">{currentRole}</Badge>

              </div>
              <Button variant="destructive" onClick={handleLogout}>
                Cerrar sesión
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
            <h2 className="text-3xl font-bold mb-4">Bienvenido a ERP 4NET</h2>
            <p className="text-lg text-muted-foreground">Sistema de gestión</p>
          </CardContent>
        </Card>

        {/* User Info Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
          <CardHeader>
            <CardTitle>Información de la cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                <p className="text-sm font-medium">{authUser.displayName || 'No especificado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-sm font-medium">{authUser.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email verificado</label>
                <Badge variant={authUser.emailVerified ? "default" : "secondary"} className="mt-1">
                  {authUser.emailVerified ? 'Sí' : 'No'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role and Plan Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tu Rol</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize mb-2">{currentRole}</div>
              <p className="text-muted-foreground">Descripción del rol: {currentRole}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tu Rol</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize mb-2">{currentRole}</div>
              <p className="text-muted-foreground">Tu rol actual en el sistema</p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal de actualización PWA */}
      <PWAUpdateDialog
        open={showUpdatePrompt}
        onUpdate={updateServiceWorker}
        onDismiss={dismissUpdate}
      />
    </div>
  );
} 