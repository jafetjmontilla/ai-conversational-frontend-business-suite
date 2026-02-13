'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupportPermissions } from '@/lib/hooks/useAllowed';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function SupportStatisticsPage() {
  const { canViewStatistics } = useSupportPermissions();
  const router = useRouter();

  useEffect(() => {
    if (!canViewStatistics()) {
      toast.error('No tienes permiso para acceder a esta página');
      router.push('/support/tickets');
    }
  }, [canViewStatistics, router]);

  if (!canViewStatistics()) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No tienes permiso para acceder a esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Estadísticas de Soporte Técnico</h1>
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
