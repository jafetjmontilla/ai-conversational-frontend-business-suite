'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { X, Plus } from 'lucide-react';
import { fetchApiV1, queries } from '@/lib/Fetching';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { useAllowed } from '@/lib/hooks/useAllowed';
import { useRouter } from 'next/navigation';

interface TicketSetting {
  _id: string;
  issues: string[];
  failures: string[];
  createdAt?: string;
  updatedAt?: string;
}

export default function SupportSettingsPage() {
  const { can, loading: permissionsLoading } = useAllowed();
  const canViewSettings = () => can('soporte:ajustes');
  const router = useRouter();
  const [ticketSetting, setTicketSetting] = useState<TicketSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [newIssue, setNewIssue] = useState('');
  const [newFailure, setNewFailure] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'issue' | 'failure'; index: number; value: string } | null>(null);

  useEffect(() => {
    if (permissionsLoading) return;
    if (!can('soporte:ajustes')) {
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

  if (!canViewSettings()) {
    return null;
  }

  // Cargar configuración de tickets
  const loadTicketSettings = async () => {
    try {
      setLoading(true);
      const response = await fetchApiV1({
        query: queries.getTicketSettings,
        type: 'json',
        variables: {}
      });

      if (response && response.length > 0) {
        setTicketSetting(response[0]);
      } else {
        // Si no existe, crear uno vacío
        const newSetting = await fetchApiV1({
          query: queries.createTicketSetting,
          type: 'json',
          variables: {
            args: {
              issues: [],
              failures: []
            }
          }
        });
        setTicketSetting(newSetting);
      }
    } catch (error: any) {
      console.error('Error loading ticket settings:', error);
      toast.error('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicketSettings();
  }, []);

  // Agregar issue
  const handleAddIssue = async () => {
    if (!newIssue.trim() || !ticketSetting) return;

    const updatedIssues = [...(ticketSetting.issues || []), newIssue.trim()];

    try {
      setSaving(true);
      const response = await fetchApiV1({
        query: queries.updateTicketSetting,
        type: 'json',
        variables: {
          id: ticketSetting._id,
          args: {
            issues: updatedIssues,
            failures: ticketSetting.failures || []
          }
        }
      });

      setTicketSetting(response);
      setNewIssue('');
      toast.success('Asunto agregado correctamente');
    } catch (error: any) {
      console.error('Error adding issue:', error);
      toast.error('Error al agregar elasunto');
    } finally {
      setSaving(false);
    }
  };

  // Abrir diálogo de confirmación para eliminar issue
  const handleRemoveIssueClick = (index: number) => {
    if (!ticketSetting) return;
    setItemToDelete({ type: 'issue', index, value: ticketSetting.issues[index] });
    setDeleteDialogOpen(true);
  };

  // Eliminar issue
  const handleRemoveIssue = async () => {
    if (!ticketSetting || !itemToDelete || itemToDelete.type !== 'issue') return;

    const updatedIssues = ticketSetting.issues.filter((_, i) => i !== itemToDelete.index);

    try {
      setSaving(true);
      const response = await fetchApiV1({
        query: queries.updateTicketSetting,
        type: 'json',
        variables: {
          id: ticketSetting._id,
          args: {
            issues: updatedIssues,
            failures: ticketSetting.failures || []
          }
        }
      });

      setTicketSetting(response);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      toast.success('Asunto eliminado correctamente');
    } catch (error: any) {
      console.error('Error removing issue:', error);
      toast.error('Error al eliminar el asunto');
    } finally {
      setSaving(false);
    }
  };

  // Agregar failure
  const handleAddFailure = async () => {
    if (!newFailure.trim() || !ticketSetting) return;

    const updatedFailures = [...(ticketSetting.failures || []), newFailure.trim()];

    try {
      setSaving(true);
      const response = await fetchApiV1({
        query: queries.updateTicketSetting,
        type: 'json',
        variables: {
          id: ticketSetting._id,
          args: {
            issues: ticketSetting.issues || [],
            failures: updatedFailures
          }
        }
      });

      setTicketSetting(response);
      setNewFailure('');
      toast.success('Falla agregada correctamente');
    } catch (error: any) {
      console.error('Error adding failure:', error);
      toast.error('Error al agregar la falla');
    } finally {
      setSaving(false);
    }
  };

  // Abrir diálogo de confirmación para eliminar failure
  const handleRemoveFailureClick = (index: number) => {
    if (!ticketSetting) return;
    setItemToDelete({ type: 'failure', index, value: ticketSetting.failures[index] });
    setDeleteDialogOpen(true);
  };

  // Eliminar failure
  const handleRemoveFailure = async () => {
    if (!ticketSetting || !itemToDelete || itemToDelete.type !== 'failure') return;

    const updatedFailures = ticketSetting.failures.filter((_, i) => i !== itemToDelete.index);

    try {
      setSaving(true);
      const response = await fetchApiV1({
        query: queries.updateTicketSetting,
        type: 'json',
        variables: {
          id: ticketSetting._id,
          args: {
            issues: ticketSetting.issues || [],
            failures: updatedFailures
          }
        }
      });

      setTicketSetting(response);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      toast.success('Falla eliminada correctamente');
    } catch (error: any) {
      console.error('Error removing failure:', error);
      toast.error('Error al eliminar la falla');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Ajustes de Soporte Técnico</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Ajustes de Soporte Técnico</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tarjeta de Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Asuntos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Agregar nuevo asunto..."
                value={newIssue}
                onChange={(e) => setNewIssue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !saving) {
                    handleAddIssue();
                  }
                }}
                disabled={saving}
              />
              <Button
                onClick={handleAddIssue}
                disabled={!newIssue.trim() || saving}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {ticketSetting?.issues && ticketSetting.issues.length > 0 ? (
                ticketSetting.issues.map((issue, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-2 pr-1"
                  >
                    <span>{issue}</span>
                    <button
                      onClick={() => handleRemoveIssueClick(index)}
                      disabled={saving}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay asuntos agregados</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta de Failures */}
        <Card>
          <CardHeader>
            <CardTitle>Fallas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Agregar nueva falla..."
                value={newFailure}
                onChange={(e) => setNewFailure(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !saving) {
                    handleAddFailure();
                  }
                }}
                disabled={saving}
              />
              <Button
                onClick={handleAddFailure}
                disabled={!newFailure.trim() || saving}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {ticketSetting?.failures && ticketSetting.failures.length > 0 ? (
                ticketSetting.failures.map((failure, index) => (
                  <Badge
                    key={index}
                    variant="destructive"
                    className="flex items-center gap-2 pr-1"
                  >
                    <span>{failure}</span>
                    <button
                      onClick={() => handleRemoveFailureClick(index)}
                      disabled={saving}
                      className="ml-1 hover:bg-destructive/80 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay fallas agregadas</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          if (itemToDelete?.type === 'issue') {
            handleRemoveIssue();
          } else if (itemToDelete?.type === 'failure') {
            handleRemoveFailure();
          }
        }}
        title={`Eliminar ${itemToDelete?.type === 'issue' ? 'Asunto' : 'Falla'}`}
        description={
          <>
            ¿Estás seguro de que deseas eliminar <strong>"{itemToDelete?.value}"</strong>?
            Esta acción no se puede deshacer.
          </>
        }
        confirmButtonText="Eliminar"
        loading={saving}
      />
    </div>
  );
}
