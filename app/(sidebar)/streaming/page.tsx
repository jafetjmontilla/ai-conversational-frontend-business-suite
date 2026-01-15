'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";
import { Play, Square, RotateCw, Settings, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { fetchApiV1, queries } from '@/lib/Fetching';

interface Channel {
  _id: string;
  numberChannel: number;
  title: string;
  groupTitle?: string;
  info?: string;
  logo?: string;
  src: string;
  status: string;
}

interface StreamingChannel {
  _id: string;
  channelId: string;
  numberChannel: number;
  status: 'running' | 'stopped' | 'error' | 'restarting';
  processId?: number;
  startedAt?: string;
  lastError?: string;
  errorCount: number;
  channel?: Channel;
}

export default function StreamingPage() {
  const { authUser } = useAuth();
  const { socket, isConnected, onStreamingUpdate, onStreamingError, subscribeToStreaming } = useWebSocketContext();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [streamingChannels, setStreamingChannels] = useState<Map<string, StreamingChannel>>(new Map());
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  // Cargar canales iniciales
  useEffect(() => {
    if (authUser) {
      fetchChannels();
    }
  }, [authUser]);

  // Suscribirse a actualizaciones de streaming cuando el socket esté conectado
  useEffect(() => {
    if (isConnected && socket) {
      subscribeToStreaming();
    }
  }, [isConnected, socket, subscribeToStreaming]);

  // Escuchar actualizaciones de streaming
  useEffect(() => {
    const handleUpdate = (update: any) => {
      setStreamingChannels(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(update.channelId);
        newMap.set(update.channelId, {
          ...existing,
          ...update,
          channel: existing?.channel
        });
        return newMap;
      });
    };

    const handleError = (error: any) => {
      toast.error(`Error en Canal ${error.numberChannel}: ${error.error}`);

      setStreamingChannels(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(error.channelId);
        if (existing) {
          newMap.set(error.channelId, {
            ...existing,
            status: 'error',
            lastError: error.error,
            errorCount: error.errorCount
          });
        }
        return newMap;
      });
    };

    onStreamingUpdate(handleUpdate);
    onStreamingError(handleError);

    // Cleanup no necesario ya que los callbacks se manejan en el contexto
  }, [onStreamingUpdate, onStreamingError, toast]);

  const fetchChannels = async () => {
    try {
      const res: Channel[] = await fetchApiV1({
        query: queries.getChannels,
        type: "json"
      });
      setChannels(res);
    } catch (error) {
      console.error('Error al cargar canales:', error);
      toast.error('Error al cargar canales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authUser) {
      fetchChannels();
    }
  }, [authUser]);
  const handleStart = async (channelId: string) => {
    try {
      await fetchApiV1({
        query: queries.startStreaming,
        type: "json",
        variables: {
          channelId
        }
      });
      toast.success('Streaming iniciado', { description: 'El canal ha comenzado a transmitir' });
      // No necesitamos actualizar manualmente, el socket lo hará
    } catch (error: any) {
      toast.error(`Error al iniciar streaming: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleStop = async (channelId: string) => {
    try {
      await fetchApiV1({
        query: queries.stopStreaming,
        type: "json",
        variables: {
          channelId
        }
      });
      toast.success('Streaming detenido', { description: 'El canal ha dejado de transmitir' });
      // No necesitamos actualizar manualmente, el socket lo hará
    } catch (error: any) {
      toast.error(`Error al detener streaming: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleRestart = async (channelId: string) => {
    try {
      await fetchApiV1({
        query: queries.restartStreaming,
        type: "json",
        variables: {
          channelId
        }
      });
      toast.success('Streaming reiniciado', { description: 'El canal se ha reiniciado' });
      // No necesitamos actualizar manualmente, el socket lo hará
    } catch (error: any) {
      toast.error(`Error al reiniciar streaming: ${error.message || 'Error desconocido'}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      running: { variant: 'default' as const, label: 'En ejecución' },
      stopped: { variant: 'secondary' as const, label: 'Detenido' },
      error: { variant: 'destructive' as const, label: 'Error' },
      restarting: { variant: 'outline' as const, label: 'Reiniciando' }
    };
    const config = variants[status] || variants.stopped;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Streaming</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Estado de conexión: {isConnected ? (
              <Badge variant="default">Conectado</Badge>
            ) : (
              <Badge variant="secondary">Desconectado</Badge>
            )}
          </p>
        </div>
        <Button onClick={() => {
          setSelectedChannel(null);
          setDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Canal
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Canales de Streaming</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Canal</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Iniciado</TableHead>
                <TableHead>Errores</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((channel) => {
                const streaming = streamingChannels.get(channel._id);
                return (
                  <TableRow key={channel._id}>
                    <TableCell className="font-medium">{channel.numberChannel}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {channel.logo && (
                          <img src={channel.logo} alt={channel.title} className="w-8 h-8 rounded" />
                        )}
                        <span>{channel.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>{channel.groupTitle || '-'}</TableCell>
                    <TableCell>
                      {streaming ? getStatusBadge(streaming.status) : <Badge variant="secondary">No configurado</Badge>}
                    </TableCell>
                    <TableCell>
                      {streaming?.startedAt
                        ? format(new Date(streaming.startedAt), 'PPp', { locale: es })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {streaming?.errorCount ? (
                        <Badge variant="destructive">{streaming.errorCount}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {streaming?.status === 'running' ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStop(channel._id)}
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRestart(channel._id)}
                            >
                              <RotateCw className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleStart(channel._id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedChannel(channel);
                            setDialogOpen(true);
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para crear/editar canal */}
      <ChannelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        channel={selectedChannel}
        onSuccess={() => {
          fetchChannels();
        }}
      />
    </div>
  );
}

// Componente Dialog para crear/editar canal
function ChannelDialog({ open, onOpenChange, channel, onSuccess }: any) {
  const [formData, setFormData] = useState({
    numberChannel: channel?.numberChannel || '',
    title: channel?.title || '',
    groupTitle: channel?.groupTitle || '',
    info: channel?.info || '',
    logo: channel?.logo || '',
    src: channel?.src || '',
    status: channel?.status || 'test'
  });

  useEffect(() => {
    if (channel) {
      setFormData({
        numberChannel: channel.numberChannel || '',
        title: channel.title || '',
        groupTitle: channel.groupTitle || '',
        info: channel.info || '',
        logo: channel.logo || '',
        src: channel.src || '',
        status: channel.status || 'test'
      });
    } else {
      setFormData({
        numberChannel: '',
        title: '',
        groupTitle: '',
        info: '',
        logo: '',
        src: '',
        status: 'test'
      });
    }
  }, [channel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const args = {
        numberChannel: parseInt(String(formData.numberChannel)) || 0,
        title: formData.title,
        groupTitle: formData.groupTitle || undefined,
        info: formData.info || undefined,
        logo: formData.logo || undefined,
        src: formData.src,
        status: formData.status
      };

      if (channel) {
        await fetchApiV1({
          query: queries.updateChannel,
          type: "json",
          variables: {
            _id: channel._id,
            args
          }
        });
      } else {
        await fetchApiV1({
          query: queries.createChannel,
          type: "json",
          variables: {
            args
          }
        });
      }

      toast.success(`Canal ${channel ? 'actualizado' : 'creado'} correctamente`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Error al ${channel ? 'actualizar' : 'crear'} canal: ${error.message || 'Error desconocido'}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{channel ? 'Editar Canal' : 'Nuevo Canal'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Número de Canal</Label>
              <Input
                type="number"
                value={formData.numberChannel}
                onChange={(e) => setFormData({ ...formData, numberChannel: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prod">Producción</SelectItem>
                  <SelectItem value="test">Prueba</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Título</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>URL de Origen (src)</Label>
            <Input
              value={formData.src}
              onChange={(e) => setFormData({ ...formData, src: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Grupo</Label>
              <Input
                value={formData.groupTitle}
                onChange={(e) => setFormData({ ...formData, groupTitle: e.target.value })}
              />
            </div>
            <div>
              <Label>Info</Label>
              <Input
                value={formData.info}
                onChange={(e) => setFormData({ ...formData, info: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Logo URL</Label>
            <Input
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

