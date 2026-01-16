'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { InputInteger } from '@/components/InputInteger';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";
import { Play, Square, RotateCw, Settings, Plus, Trash2, Video, Monitor, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { fetchApiV1, queries } from '@/lib/Fetching';
const channelsFF = [153, 170, 185, 186, 187, 188, 189, 190, 191, 198, 207, 229, 231, 232, 233, 243, 263, 269, 271, 274, 278, 279, 281, 283]

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
  const [playerUrl, setPlayerUrl] = useState<string | null>(null);
  const [playerTitle, setPlayerTitle] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
    }
  };

  const fetchStreamingChannels = async () => {
    try {
      const res: StreamingChannel[] = await fetchApiV1({
        query: queries.getStreamingChannels,
        type: "json"
      });

      // Mapear los streamingChannels a un Map usando el _id del channel como clave
      const streamingMap = new Map<string, StreamingChannel>();
      res.forEach((streamingChannel) => {
        // Obtener el _id del channel (puede venir desde channelId o desde channel._id)
        let channelId: string | undefined;

        if (typeof streamingChannel.channelId === 'string') {
          channelId = streamingChannel.channelId;
        } else if ((streamingChannel.channelId as any)?._id) {
          channelId = (streamingChannel.channelId as any)._id.toString();
        } else if (streamingChannel.channel?._id) {
          channelId = streamingChannel.channel._id;
        }

        if (channelId) {
          streamingMap.set(channelId, {
            ...streamingChannel,
            channelId: channelId,
            channel: streamingChannel.channel || undefined
          });
        }
      });

      setStreamingChannels(streamingMap);
    } catch (error) {
      console.error('Error al cargar streaming channels:', error);
      toast.error('Error al cargar streaming channels');
    }
  };

  useEffect(() => {
    if (authUser) {
      const loadData = async () => {
        setLoading(true);
        try {
          await Promise.all([
            fetchChannels(),
            fetchStreamingChannels()
          ]);
        } catch (error) {
          console.error('Error al cargar datos:', error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [authUser]);
  const handleStart = async (channelId: string) => {
    try {
      const channel = channels.find(c => c._id === channelId);
      const channelNumber = channel?.numberChannel || 'N/A';
      await fetchApiV1({
        query: queries.startStreaming,
        type: "json",
        variables: {
          channelId
        }
      });
      toast.success('Streaming iniciado', { description: `El canal ${channelNumber} ha comenzado a transmitir` });
      // No necesitamos actualizar manualmente, el socket lo hará
    } catch (error: any) {
      const channel = channels.find(c => c._id === channelId);
      const channelNumber = channel?.numberChannel || 'N/A';
      toast.error(`Error al iniciar streaming en canal ${channelNumber}: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleStop = async (channelId: string) => {
    try {
      const channel = channels.find(c => c._id === channelId);
      const channelNumber = channel?.numberChannel || 'N/A';
      await fetchApiV1({
        query: queries.stopStreaming,
        type: "json",
        variables: {
          channelId
        }
      });
      toast.success('Streaming detenido', { description: `El canal ${channelNumber} ha dejado de transmitir` });
      // No necesitamos actualizar manualmente, el socket lo hará
    } catch (error: any) {
      const channel = channels.find(c => c._id === channelId);
      const channelNumber = channel?.numberChannel || 'N/A';
      toast.error(`Error al detener streaming en canal ${channelNumber}: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleRestart = async (channelId: string) => {
    try {
      const channel = channels.find(c => c._id === channelId);
      const channelNumber = channel?.numberChannel || 'N/A';
      await fetchApiV1({
        query: queries.restartStreaming,
        type: "json",
        variables: {
          channelId
        }
      });
      toast.success('Streaming reiniciado', { description: `El canal ${channelNumber} se ha reiniciado` });
      // No necesitamos actualizar manualmente, el socket lo hará
    } catch (error: any) {
      const channel = channels.find(c => c._id === channelId);
      const channelNumber = channel?.numberChannel || 'N/A';
      toast.error(`Error al reiniciar streaming en canal ${channelNumber}: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleDeleteClick = (channel: Channel) => {
    setChannelToDelete(channel);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!channelToDelete) return;

    try {
      await fetchApiV1({
        query: queries.deleteChannel,
        type: "json",
        variables: {
          _id: channelToDelete._id
        }
      });
      toast.success('Canal eliminado', { description: `El canal ${channelToDelete.numberChannel} "${channelToDelete.title}" ha sido eliminado` });
      fetchChannels();
      fetchStreamingChannels();
      setDeleteDialogOpen(false);
      setChannelToDelete(null);
    } catch (error: any) {
      toast.error(`Error al eliminar canal ${channelToDelete.numberChannel}: ${error.message || 'Error desconocido'}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      running: { label: 'En ejecución', className: 'bg-green-500 hover:bg-green-600 text-white' },
      stopped: { label: 'Detenido', className: 'bg-red-500 hover:bg-red-600 text-white' },
      error: { variant: 'destructive' as const, label: 'Error' },
      restarting: { variant: 'outline' as const, label: 'Reiniciando' }
    };
    const config = variants[status] || variants.stopped;
    if (config.className) {
      return <Badge className={config.className}>{config.label}</Badge>;
    }
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getChannelStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      prod: { label: 'Producción', className: 'bg-green-500 hover:bg-green-600 text-white' },
      test: { label: 'Prueba', className: 'bg-orange-500 hover:bg-orange-600 text-white' },
      inactive: { variant: 'secondary' as const, label: 'Inactivo' }
    };
    const config = variants[status] || variants.inactive;
    if (config.className) {
      return <Badge className={config.className}>{config.label}</Badge>;
    }
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const getSortedChannels = () => {
    if (!sortColumn) return channels;

    return [...channels].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      const streamingA = streamingChannels.get(a._id);
      const streamingB = streamingChannels.get(b._id);

      switch (sortColumn) {
        case 'numberChannel':
          aValue = a.numberChannel;
          bValue = b.numberChannel;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'groupTitle':
          aValue = (a.groupTitle || '').toLowerCase();
          bValue = (b.groupTitle || '').toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'streamingStatus':
          aValue = streamingA?.status || '';
          bValue = streamingB?.status || '';
          break;
        case 'startedAt':
          aValue = streamingA?.startedAt ? new Date(streamingA.startedAt).getTime() : 0;
          bValue = streamingB?.startedAt ? new Date(streamingB.startedAt).getTime() : 0;
          break;
        case 'errorCount':
          aValue = streamingA?.errorCount || 0;
          bValue = streamingB?.errorCount || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
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
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('numberChannel')}
                >
                  <div className="flex items-center">
                    Canal
                    {getSortIcon('numberChannel')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center">
                    Título
                    {getSortIcon('title')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('groupTitle')}
                >
                  <div className="flex items-center">
                    Grupo
                    {getSortIcon('groupTitle')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status Canal
                    {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('streamingStatus')}
                >
                  <div className="flex items-center">
                    Estado
                    {getSortIcon('streamingStatus')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('startedAt')}
                >
                  <div className="flex items-center">
                    Iniciado
                    {getSortIcon('startedAt')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('errorCount')}
                >
                  <div className="flex items-center">
                    Errores
                    {getSortIcon('errorCount')}
                  </div>
                </TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getSortedChannels().map((channel) => {
                const streaming = streamingChannels.get(channel._id);
                const isSelected = selectedRowId === channel._id;
                const isInChannelsFF = channelsFF.includes(channel.numberChannel);
                return (
                  <TableRow
                    key={channel._id}
                    onClick={() => setSelectedRowId(channel._id)}
                    className={`cursor-pointer ${isSelected
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : isInChannelsFF
                        ? 'bg-yellow-200 dark:bg-yellow-900 hover:bg-yellow-500 dark:hover:bg-yellow-900/50'
                        : 'hover:bg-muted/50'
                      }`}
                  >
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
                      {getChannelStatusBadge(channel.status)}
                    </TableCell>
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
                        {streaming?.status === 'running' || streaming?.status === 'error' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRowId(channel._id);
                              handleStop(channel._id);
                            }}
                            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRowId(channel._id);
                              handleStart(channel._id);
                            }}
                            disabled={channel.status !== 'test' && channel.status !== 'prod'}
                            className={channel.status === 'test' || channel.status === 'prod'
                              ? 'bg-green-500 hover:bg-green-600 text-white'
                              : ''}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRowId(channel._id);
                            handleRestart(channel._id);
                          }}
                          disabled={streaming?.status !== 'running' && streaming?.status !== 'error'}
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedRowId(channel._id);
                            setPlayerUrl(channel.src);
                            setPlayerTitle(`${channel.title} - Origen`);
                            setPlayerDialogOpen(true);
                          }}
                          title="Reproducir URL de origen"
                        >
                          <Video className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedRowId(channel._id);
                            setPlayerUrl(`https://stream.4net.plus/hls/${channel.numberChannel}.m3u8`);
                            setPlayerTitle(`${channel.title} - HLS`);
                            setPlayerDialogOpen(true);
                          }}
                          title="Reproducir HLS"
                        >
                          <Monitor className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedRowId(channel._id);
                            setSelectedChannel(channel);
                            setDialogOpen(true);
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedRowId(channel._id);
                            handleDeleteClick(channel);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Dialog para confirmar borrado */}
      <DeleteChannelDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setChannelToDelete(null);
          }
        }}
        channel={channelToDelete}
        onConfirm={handleConfirmDelete}
      />

      {/* Dialog para reproducir video */}
      <VideoPlayerDialog
        open={playerDialogOpen}
        onOpenChange={(open) => {
          setPlayerDialogOpen(open);
          if (!open) {
            setPlayerUrl(null);
            setPlayerTitle('');
          }
        }}
        url={playerUrl}
        title={playerTitle}
      />
    </div>
  );
}

// Componente Dialog para crear/editar canal
interface ChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: Channel | null;
  onSuccess: () => void;
}
function ChannelDialog({ open, onOpenChange, channel, onSuccess }: ChannelDialogProps) {
  const [formData, setFormData] = useState({
    numberChannel: channel?.numberChannel?.toString() || '',
    title: channel?.title || '',
    groupTitle: channel?.groupTitle || '',
    info: channel?.info || '',
    logo: channel?.logo || '',
    src: channel?.src || '',
    status: channel?.status || 'test'
  });

  // Resetear el formulario cuando se abre el diálogo o cambia el channel
  useEffect(() => {
    if (open) {
      if (channel) {
        setFormData({
          numberChannel: channel.numberChannel?.toString() || '',
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
    }
  }, [open, channel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const args = {
        numberChannel: parseInt(formData.numberChannel) || 0,
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

      const channelNumber = channel?.numberChannel || formData.numberChannel || 'N/A';
      toast.success(`Canal ${channelNumber} ${channel ? 'actualizado' : 'creado'} correctamente`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      const channelNumber = channel?.numberChannel || formData.numberChannel || 'N/A';
      toast.error(`Error al ${channel ? 'actualizar' : 'crear'} canal ${channelNumber}: ${error.message || 'Error desconocido'}`);
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
              <InputInteger
                value={formData.numberChannel}
                onChange={(value) => {
                  setFormData({ ...formData, numberChannel: value })
                }}
                min={1}
                max={999}
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

// Componente Dialog para confirmar borrado de canal
interface DeleteChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: Channel | null;
  onConfirm: () => void;
}

function DeleteChannelDialog({ open, onOpenChange, channel, onConfirm }: DeleteChannelDialogProps) {
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const isValid = channel && confirmationNumber === channel.numberChannel.toString();

  // Resetear el campo cuando se abre/cierra el diálogo
  useEffect(() => {
    if (open) {
      setConfirmationNumber('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (isValid) {
      onConfirm();
    }
  };

  if (!channel) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-destructive">Eliminar Canal</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente el canal
            <strong> "{channel.title}"</strong> (Canal {channel.numberChannel}).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="confirmation-number">
              Para confirmar, ingresa el número del canal: <strong>{channel.numberChannel}</strong>
            </Label>
            <InputInteger
              id="confirmation-number"
              value={confirmationNumber}
              onChange={(value) => setConfirmationNumber(value)}
              min={1}
              max={999}
              className="mt-2"
              autoFocus
            />
            {confirmationNumber && !isValid && (
              <p className="text-sm text-destructive mt-2">
                El número ingresado no coincide con el número del canal.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid}
          >
            Eliminar Canal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Componente Dialog para reproducir video
interface VideoPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string | null;
  title: string;
}

function VideoPlayerDialog({ open, onOpenChange, url, title }: VideoPlayerDialogProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const hlsRef = React.useRef<any>(null);
  const mpegtsRef = React.useRef<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [streamType, setStreamType] = React.useState<string>('');

  // Detectar tipo de stream
  const detectStreamType = React.useCallback((streamUrl: string): 'hls' | 'mpegts' | 'direct' => {
    const lowerUrl = streamUrl.toLowerCase();

    // Detectar HLS
    if (lowerUrl.includes('.m3u8') || lowerUrl.includes('application/vnd.apple.mpegurl')) {
      return 'hls';
    }

    // Detectar MPEG-TS por extensión
    if (lowerUrl.includes('.ts') ||
      lowerUrl.includes('.m2ts') ||
      lowerUrl.includes('mpegts') ||
      lowerUrl.includes('transport') ||
      lowerUrl.includes('mpeg-ts') ||
      lowerUrl.match(/\.ts(\?|$)/i)) {
      return 'mpegts';
    }

    // Detectar URLs HTTP/HTTPS sin extensión conocida como posibles MPEG-TS (IPTV)
    // Estas URLs suelen ser streams MPEG-TS
    if ((streamUrl.startsWith('http://') || streamUrl.startsWith('https://')) &&
      !lowerUrl.match(/\.(mp4|webm|ogg|avi|mov|mkv|flv|m3u8|ts|m2ts)(\?|$)/i) &&
      !lowerUrl.includes('.m3u8')) {
      return 'mpegts'; // Intentar primero como MPEG-TS
    }

    // Stream directo (HTTP/HTTPS, MP4, WebM, etc.)
    return 'direct';
  }, []);

  // Efecto para configurar el video cuando esté montado
  React.useEffect(() => {
    if (!open || !url) {
      setError(null);
      setIsLoading(false);
      setStreamType('');
      return;
    }

    setIsLoading(true);
    setError(null);
    const detectedType = detectStreamType(url);
    setStreamType(detectedType);

    const loadVideo = async () => {
      if (!videoRef.current) return;

      const video = videoRef.current;

      // Limpiar instancias anteriores
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (mpegtsRef.current) {
        mpegtsRef.current.destroy();
        mpegtsRef.current = null;
      }

      try {
        if (detectedType === 'hls') {
          // Usar HLS.js para streams HLS
          // @ts-ignore - hls.js puede no tener tipos en algunos entornos
          const HlsModule = await import('hls.js');
          const Hls = HlsModule.default;

          if (Hls.isSupported()) {
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: false,
              backBufferLength: 90,
              maxBufferLength: 30,
              maxMaxBufferLength: 60,
              startLevel: -1,
              debug: false,
            });

            hls.loadSource(url);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setIsLoading(false);
              video.play().catch((err) => {
                console.error('Error al reproducir:', err);
                setError('No se pudo iniciar la reproducción automática. Intenta hacer clic en play.');
              });
            });

            hls.on(Hls.Events.ERROR, (_event: string, data: any) => {
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    setError('Error de red. Verifica la conexión o que el stream esté disponible.');
                    hls.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    setError('Error de codec de video. El formato puede no ser compatible con el navegador.');
                    hls.recoverMediaError();
                    break;
                  default:
                    setError('Error al cargar el stream. El formato puede no ser compatible.');
                    hls.destroy();
                    break;
                }
              }
            });

            hlsRef.current = hls;
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Soporte nativo de HLS (Safari)
            video.src = url;
            video.addEventListener('loadedmetadata', () => {
              setIsLoading(false);
            });
            video.play().catch((err) => {
              console.error('Error al reproducir:', err);
              setError('No se pudo iniciar la reproducción automática. Intenta hacer clic en play.');
            });
          } else {
            setError('Tu navegador no soporta reproducción HLS. Prueba con Chrome, Firefox o Safari.');
            setIsLoading(false);
          }
        } else if (detectedType === 'mpegts') {
          // Usar mpegts.js para streams MPEG-TS
          // @ts-ignore - mpegts.js puede no tener tipos en algunos entornos
          const mpegtsModule = await import('mpegts.js');
          const mpegts = mpegtsModule.default;

          // Verificar si la URL no tiene extensión (para fallback)
          const isUrlWithoutExtension = !url.match(/\.(ts|m2ts)(\?|$)/i);

          if (mpegts.isSupported()) {
            const player = mpegts.createPlayer({
              type: 'mse', // Media Source Extensions
              url: url,
              isLive: true,
              // @ts-ignore - opciones adicionales de configuración
              liveBufferLatencyChasing: true,
              liveBufferLatencyMaxLatency: 1.5,
              liveBufferLatencyMinRemain: 0.3,
              autoCleanupSourceBuffer: true,
              autoCleanupMaxBackwardDuration: 3,
              autoCleanupMinBackwardDuration: 2,
            });

            player.attachMediaElement(video);
            player.load();

            let hasError = false;

            player.on(mpegts.Events.ERROR, (errorType: string, errorDetail: string, errorInfo: any) => {
              console.error('Error MPEG-TS:', errorType, errorDetail, errorInfo);

              // Si es un error fatal y la URL no tiene extensión, intentar como stream directo
              if (!hasError && isUrlWithoutExtension && (errorType === 'MediaError' || errorType === 'NetworkError')) {
                hasError = true;
                console.log('MPEG-TS falló, intentando como stream directo...');

                // Limpiar player MPEG-TS
                try {
                  player.destroy();
                } catch (e) {
                  console.error('Error al destruir player MPEG-TS:', e);
                }
                mpegtsRef.current = null;

                // Intentar como stream directo
                video.src = url;
                video.addEventListener('loadedmetadata', () => {
                  setIsLoading(false);
                });
                video.addEventListener('error', (e) => {
                  setIsLoading(false);
                  const videoError = video.error;
                  if (videoError) {
                    let errorMessage = 'Error al cargar el video. ';
                    switch (videoError.code) {
                      case videoError.MEDIA_ERR_ABORTED:
                        errorMessage += 'La carga fue abortada.';
                        break;
                      case videoError.MEDIA_ERR_NETWORK:
                        errorMessage += 'Error de red. Verifica la conexión o que el stream esté disponible.';
                        break;
                      case videoError.MEDIA_ERR_DECODE:
                        errorMessage += 'Error de codec. El formato puede no ser compatible con el navegador.';
                        break;
                      case videoError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        errorMessage += 'El formato de video no es compatible con el navegador.';
                        break;
                      default:
                        errorMessage += 'Formato no compatible.';
                    }
                    setError(errorMessage);
                  }
                });
                video.addEventListener('canplay', () => {
                  setIsLoading(false);
                });
                video.play().catch((err) => {
                  console.error('Error al reproducir:', err);
                  setIsLoading(false);
                  setError('No se pudo iniciar la reproducción automática. Intenta hacer clic en play.');
                });
                return;
              }

              setIsLoading(false);
              if (errorType === 'NetworkError') {
                setError('Error de red al cargar el stream MPEG-TS. Verifica la conexión o que el stream esté disponible.');
              } else if (errorType === 'MediaError') {
                setError('Error de codec en el stream MPEG-TS. El formato puede requerir transcodificación.');
              } else {
                setError(`Error al reproducir stream MPEG-TS: ${errorDetail || errorType}`);
              }
            });

            player.on(mpegts.Events.LOADING_COMPLETE, () => {
              setIsLoading(false);
              video.play().catch((err) => {
                console.error('Error al reproducir:', err);
                setError('No se pudo iniciar la reproducción automática. Intenta hacer clic en play.');
              });
            });

            player.on(mpegts.Events.RECOVERED_EARLY_EOF, () => {
              console.log('Stream MPEG-TS recuperado después de EOF temprano');
            });

            player.on(mpegts.Events.MEDIA_INFO, (mediaInfo: any) => {
              console.log('Información del stream MPEG-TS:', mediaInfo);
              setIsLoading(false);
            });

            mpegtsRef.current = player;
          } else {
            // Si mpegts.js no está soportado, intentar como stream directo para URLs sin extensión
            if (isUrlWithoutExtension && (url.startsWith('http://') || url.startsWith('https://'))) {
              console.log('mpegts.js no soportado, intentando como stream directo...');
              video.src = url;
              video.addEventListener('loadedmetadata', () => {
                setIsLoading(false);
              });
              video.addEventListener('error', (e) => {
                setIsLoading(false);
                const videoError = video.error;
                if (videoError) {
                  setError('El formato de video no es compatible con el navegador. Prueba con VLC/PotPlayer.');
                }
              });
              video.addEventListener('canplay', () => {
                setIsLoading(false);
              });
              video.play().catch((err) => {
                console.error('Error al reproducir:', err);
                setIsLoading(false);
                setError('No se pudo iniciar la reproducción automática. Intenta hacer clic en play.');
              });
            } else {
              setError('Tu navegador no soporta reproducción MPEG-TS. Prueba con Chrome o Firefox.');
              setIsLoading(false);
            }
          }
        } else {
          // Stream directo (HTTP/HTTPS, MP4, WebM, etc.)
          video.src = url;

          video.addEventListener('loadedmetadata', () => {
            setIsLoading(false);
          });

          video.addEventListener('error', (e) => {
            setIsLoading(false);
            const videoError = video.error;
            if (videoError) {
              let errorMessage = 'Error al cargar el video. ';
              switch (videoError.code) {
                case videoError.MEDIA_ERR_ABORTED:
                  errorMessage += 'La carga fue abortada.';
                  break;
                case videoError.MEDIA_ERR_NETWORK:
                  errorMessage += 'Error de red. Verifica la conexión o que el stream esté disponible.';
                  break;
                case videoError.MEDIA_ERR_DECODE:
                  errorMessage += 'Error de codec. El formato de video puede no ser compatible con el navegador. PotPlayer/VLC pueden reproducirlo porque tienen codecs adicionales.';
                  break;
                case videoError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                  errorMessage += 'El formato de video no es compatible con el navegador. Prueba abriendo la URL en VLC/PotPlayer o usa el stream HLS si está disponible.';
                  break;
                default:
                  errorMessage += 'Formato no compatible. Algunos formatos solo funcionan en VLC.';
              }
              setError(errorMessage);
            }
          });

          video.addEventListener('canplay', () => {
            setIsLoading(false);
          });

          video.play().catch((err) => {
            console.error('Error al reproducir:', err);
            setIsLoading(false);
            setError('No se pudo iniciar la reproducción automática. Intenta hacer clic en play.');
          });
        }
      } catch (err: any) {
        console.error('Error al configurar el video:', err);
        setError(`Error al cargar el video: ${err.message || 'Error desconocido'}`);
        setIsLoading(false);
      }
    };

    // Usar setTimeout para asegurar que el DOM esté listo
    const timer = setTimeout(loadVideo, 100);

    return () => {
      clearTimeout(timer);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (mpegtsRef.current) {
        mpegtsRef.current.destroy();
        mpegtsRef.current = null;
      }
      if (videoRef.current) {
        const video = videoRef.current;
        video.pause();
        video.src = '';
        video.removeEventListener('error', () => { });
        video.removeEventListener('loadedmetadata', () => { });
        video.removeEventListener('canplay', () => { });
      }
      setError(null);
      setIsLoading(false);
      setStreamType('');
    };
  }, [open, url, detectStreamType]);

  if (!url) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="text-white text-center">
                <RotateCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm">Cargando video...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 p-4">
              <div className="text-white text-center max-w-md">
                <p className="text-sm font-semibold mb-2 text-red-400">⚠️ Error de reproducción</p>
                <p className="text-xs mb-4">{error}</p>
                <p className="text-xs text-muted-foreground">
                  Nota: Algunos formatos de video (como RTSP o ciertos codecs) solo funcionan en VLC/PotPlayer u otros reproductores especializados.
                </p>
              </div>
            </div>
          )}
          <video
            ref={videoRef}
            controls
            autoPlay
            className="w-full h-full"
            playsInline
            muted={false}
          >
            Tu navegador no soporta la reproducción de video.
          </video>
        </div>
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">URL:</p>
          <p className="text-sm font-mono break-all">{url}</p>
          {streamType && (
            <p className="text-xs text-muted-foreground mt-2">
              Tipo: {streamType === 'hls' ? 'Stream HLS (usando HLS.js)' :
                streamType === 'mpegts' ? 'Stream MPEG-TS (usando mpegts.js)' :
                  'Stream directo (HTTP/HTTPS)'}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

