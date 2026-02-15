'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAllowed } from '@/lib/hooks/useAllowed';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function SupportStatisticsPage() {
  const { can, loading: permissionsLoading } = useAllowed();
  const router = useRouter();

  useEffect(() => {
    if (permissionsLoading) return;
    if (!can('soporte:estadisticas')) {
      toast.error('No tienes permiso para acceder a esta página');
      router.replace('/support/tickets');
    }
  }, [permissionsLoading, can, router]);

  if (permissionsLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!can('soporte:estadisticas')) {
    return null;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold md:text-2xl">Estadísticas de Soporte Técnico</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visualiza estadísticas y métricas de los tickets de soporte
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estadísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Las estadísticas se mostrarán aquí próximamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
