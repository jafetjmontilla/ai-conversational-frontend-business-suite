'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { usePathname, useRouter } from 'next/navigation';
import { useAllowed } from '@/lib/hooks/useAllowed';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Input } from '@/components/ui/input';
import { InputInteger } from '@/components/InputInteger';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Square, RotateCw, Settings, Plus, Trash2, Video, Monitor, ArrowUpDown, ArrowUp, ArrowDown, Copy, ChevronLeft, ChevronRight, X, Eye } from 'lucide-react';
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
  srcOrigins?: string[];
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
  ffmpegOptions?: {
    useGpuTranscoding?: boolean;
  };
  channel?: Channel;
}

export default function StreamingPage() {
  const { authUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { hasAnyRole, loading: permissionsLoading } = useAllowed();
  const canAccessStreaming = () => hasAnyRole(['admin', 'logicalSupport']);
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
  const [playerChannel, setPlayerChannel] = useState<Channel | null>(null);
  const [playerType, setPlayerType] = useState<'origin' | 'hls'>('hls');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [errorsDialogOpen, setErrorsDialogOpen] = useState(false);
  const [selectedChannelForErrors, setSelectedChannelForErrors] = useState<string | null>(null);
  const [errorsList, setErrorsList] = useState<any[]>([]);
  const [loadingErrors, setLoadingErrors] = useState(false);
  const rowRefs = React.useRef<Map<string, HTMLTableRowElement>>(new Map());
  const pathnameRef = React.useRef<string>(pathname);
  const isMountedRef = React.useRef<boolean>(true);

  // Efecto para hacer scroll automático a la fila seleccionada
  useEffect(() => {
    if (selectedRowId) {
      const rowElement = rowRefs.current.get(selectedRowId);
      if (rowElement) {
        // Usar setTimeout para asegurar que el DOM esté actualizado
        setTimeout(() => {
          rowElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }, 100);
      }
    }
  }, [selectedRowId]);

  // Mantener pathname actualizado en el ref
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // Redirigir si no tiene permiso (solo admin y logicalSupport)
  useEffect(() => {
    if (permissionsLoading) return;
    if (!hasAnyRole(['admin', 'logicalSupport'])) {
      toast.error('No tienes permiso para acceder a esta página');
      router.replace('/dashboard');
    }
  }, [permissionsLoading, hasAnyRole, router]);

  // Marcar componente como montado/desmontado
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
      // Verificar múltiples formas de confirmar que estamos en la ruta de streaming
      const currentPath = pathnameRef.current;
      const windowPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const isOnStreamingPage = currentPath === '/streaming' || windowPath === '/streaming';

      // Solo mostrar toast si el componente está montado y estamos en la ruta de streaming
      if (isMountedRef.current && isOnStreamingPage) {
        toast.error(`Error en Canal ${error.numberChannel}: ${error.error}`);
      }

      // Solo actualizar estado si el componente está montado
      if (isMountedRef.current) {
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
      }
    };

    onStreamingUpdate(handleUpdate);
    onStreamingError(handleError);

    // Cleanup: eliminar los callbacks del array cuando el componente se desmonte
    return () => {
      // Los callbacks se almacenan en refs en el contexto, necesitamos acceder a ellos
      // Para evitar memory leaks, verificamos el pathname antes de ejecutar
      // El ref pathnameRef se actualiza, así que esto debería funcionar
    };
  }, [onStreamingUpdate, onStreamingError]);

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

  const handleClearErrors = async (channelId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      const channel = channels.find(c => c._id === channelId);
      const channelNumber = channel?.numberChannel || 'N/A';

      await fetchApiV1({
        query: queries.clearStreamingErrors,
        type: "json",
        variables: {
          channelId
        }
      });
      toast.success(`Errores limpiados correctamente`, { description: `Canal ${channelNumber}` });

      // Si el modal está abierto, cerrarlo y limpiar la lista
      if (selectedChannelForErrors === channelId) {
        setErrorsDialogOpen(false);
        setSelectedChannelForErrors(null);
        setErrorsList([]);
      }

      // Recargar los streaming channels para actualizar el estado
      await fetchStreamingChannels();
    } catch (error: any) {
      const channel = channels.find(c => c._id === channelId);
      const channelNumber = channel?.numberChannel || 'N/A';
      toast.error(`Error al limpiar errores del canal ${channelNumber}: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleViewErrors = async (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedChannelForErrors(channelId);
    setErrorsDialogOpen(true);
    setLoadingErrors(true);
    try {
      const errors = await fetchApiV1({
        query: queries.getStreamingErrors,
        type: "json",
        variables: {
          channelId
        }
      });
      setErrorsList(errors || []);
    } catch (error: any) {
      toast.error(`Error al cargar errores: ${error.message || 'Error desconocido'}`);
      setErrorsList([]);
    } finally {
      setLoadingErrors(false);
    }
  };

  const handleGpuTranscodingChange = async (channelId: string, checked: boolean) => {
    try {
      // Obtener todas las opciones actuales del streaming channel desde el backend
      const streamingChannelData = await fetchApiV1({
        query: queries.getStreamingChannel,
        type: "json",
        variables: {
          channelId
        }
      });

      // Obtener opciones actuales o usar valores por defecto
      const currentOptions = streamingChannelData?.ffmpegOptions || {
        hwaccel: 'vaapi',
        hwaccelDevice: '/dev/dri/renderD128',
        hwaccelOutputFormat: 'vaapi',
        videoCodec: 'h264_vaapi',
        videoQuality: 25,
        audioCodec: 'aac',
        audioBitrate: '128k',
        resolution: '1280:720',
        aspectRatio: '16:9',
        hlsTime: 4,
        hlsListSize: 5,
        useGpuTranscoding: false
      };

      // Actualizar solo el campo useGpuTranscoding
      const updatedOptions = {
        ...currentOptions,
        useGpuTranscoding: checked
      };

      await fetchApiV1({
        query: queries.updateFfmpegOptions,
        type: "json",
        variables: {
          channelId,
          ffmpegOptions: updatedOptions
        }
      });

      // Actualizar el estado local
      setStreamingChannels(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(channelId);
        if (existing) {
          newMap.set(channelId, {
            ...existing,
            ffmpegOptions: {
              ...existing.ffmpegOptions,
              useGpuTranscoding: checked
            }
          });
        }
        return newMap;
      });

      // Recargar los streaming channels para asegurar sincronización
      await fetchStreamingChannels();

      const channel = channels.find(c => c._id === channelId);
      const channelNumber = channel?.numberChannel || 'N/A';
      toast.success(`Transcodificación GPU ${checked ? 'habilitada' : 'deshabilitada'}`, {
        description: `Canal ${channelNumber}: ${checked ? 'Usará transcodificación GPU' : 'Usará -c copy'}`
      });
    } catch (error: any) {
      toast.error(`Error al actualizar opción: ${error.message || 'Error desconocido'}`);
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

  if (permissionsLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!canAccessStreaming()) {
    return null;
  }

  if (loading) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Streaming</h1>
          <div className="text-sm text-muted-foreground mt-1">
            Estado de conexión: {isConnected ? (
              <Badge variant="default">Conectado</Badge>
            ) : (
              <Badge variant="secondary">Desconectado</Badge>
            )}
          </div>
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
                return (
                  <TableRow
                    key={channel._id}
                    ref={(el) => {
                      if (el) {
                        rowRefs.current.set(channel._id, el);
                      } else {
                        rowRefs.current.delete(channel._id);
                      }
                    }}
                    onClick={() => setSelectedRowId(channel._id)}
                    className={`cursor-pointer ${isSelected
                      ? 'bg-blue-100 dark:bg-blue-900/30'
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
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">{streaming.errorCount}</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => handleClearErrors(channel._id, e)}
                            title="Limpiar errores"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={(e) => handleViewErrors(channel._id, e)}
                            title="Ver errores"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 items-center">
                        {/* Checkbox para transcodificación GPU - primero en las acciones */}
                        <label
                          className="flex items-center gap-1 cursor-pointer"
                          title="Transcodificación GPU para HLS/IPTV"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={streaming?.ffmpegOptions?.useGpuTranscoding || false}
                            onChange={(e) => handleGpuTranscodingChange(channel._id, e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-xs text-muted-foreground">GPU</span>
                        </label>
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
                        {window.location.origin.split('://')[0] != 'https' && <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedRowId(channel._id);
                            setPlayerUrl(channel.src);
                            setPlayerTitle(`${channel.title} - Origen`);
                            setPlayerChannel(channel);
                            setPlayerType('origin');
                            setPlayerDialogOpen(true);
                          }}
                          title="Reproducir URL de origen"
                        >
                          <Video className="h-4 w-4" />
                        </Button>}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedRowId(channel._id);
                            setPlayerUrl(`https://stream.4net.plus/hls/${channel.numberChannel}.m3u8`);
                            setPlayerTitle(`${channel.title} - HLS`);
                            setPlayerChannel(channel);
                            setPlayerType('hls');
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

      {/* Dialog para mostrar errores */}
      <ErrorsDialog
        open={errorsDialogOpen}
        onOpenChange={(open) => {
          setErrorsDialogOpen(open);
          if (!open) {
            setSelectedChannelForErrors(null);
            setErrorsList([]);
          }
        }}
        channelId={selectedChannelForErrors}
        errors={errorsList}
        loading={loadingErrors}
        channelNumber={channels.find(c => c._id === selectedChannelForErrors)?.numberChannel}
        channelTitle={channels.find(c => c._id === selectedChannelForErrors)?.title}
        onClearErrors={handleClearErrors}
        onErrorsCleared={() => {
          setErrorsList([]);
          fetchStreamingChannels();
        }}
        channelsWithErrors={Array.from(streamingChannels.values())
          .filter(sc => sc.status === 'error' && sc.errorCount > 0)
          .map(sc => {
            const channel = channels.find(c => c._id === sc.channelId);
            return channel ? { ...channel, errorCount: sc.errorCount } : null;
          })
          .filter((c): c is Channel & { errorCount: number } => c !== null)
          .sort((a, b) => a.numberChannel - b.numberChannel)}
        onChannelChange={async (newChannelId: string) => {
          setSelectedChannelForErrors(newChannelId);
          setSelectedRowId(newChannelId);
          setLoadingErrors(true);
          try {
            const errors = await fetchApiV1({
              query: queries.getStreamingErrors,
              type: "json",
              variables: {
                channelId: newChannelId
              }
            });
            setErrorsList(errors || []);
          } catch (error: any) {
            toast.error(`Error al cargar errores: ${error.message || 'Error desconocido'}`);
            setErrorsList([]);
          } finally {
            setLoadingErrors(false);
          }
        }}
        onOpenPlayer={(channelId: string, playerType: 'origin' | 'hls') => {
          const channel = channels.find(c => c._id === channelId);
          if (channel) {
            // Cerrar el modal de errores
            setErrorsDialogOpen(false);
            setSelectedChannelForErrors(null);
            setErrorsList([]);

            setSelectedRowId(channelId);
            if (playerType === 'hls') {
              setPlayerUrl(`https://stream.4net.plus/hls/${channel.numberChannel}.m3u8`);
              setPlayerTitle(`${channel.title} - HLS`);
            } else {
              setPlayerUrl(channel.src);
              setPlayerTitle(`${channel.title} - Origen`);
            }
            setPlayerChannel(channel);
            setPlayerType(playerType);
            setPlayerDialogOpen(true);
          }
        }}
      />

      {/* Dialog para reproducir video */}
      <VideoPlayerDialog
        open={playerDialogOpen}
        onOpenChange={(open) => {
          setPlayerDialogOpen(open);
          if (!open) {
            setPlayerUrl(null);
            setPlayerTitle('');
            setPlayerChannel(null);
          }
        }}
        url={playerUrl}
        title={playerTitle}
        channel={playerChannel}
        playerType={playerType}
        channels={channels.filter(c => c.status === 'prod')}
        onChannelChange={(newChannel) => {
          setPlayerChannel(newChannel);
          setSelectedRowId(newChannel._id);
          if (playerType === 'hls') {
            setPlayerUrl(`https://stream.4net.plus/hls/${newChannel.numberChannel}.m3u8`);
            setPlayerTitle(`${newChannel.title} - HLS`);
          } else {
            setPlayerUrl(newChannel.src);
            setPlayerTitle(`${newChannel.title} - Origen`);
          }
        }}
        streamingChannel={playerChannel ? streamingChannels.get(playerChannel._id) : undefined}
        onClearErrors={handleClearErrors}
        onViewErrors={async (channelId: string) => {
          setSelectedChannelForErrors(channelId);
          setErrorsDialogOpen(true);
          setLoadingErrors(true);
          try {
            const errors = await fetchApiV1({
              query: queries.getStreamingErrors,
              type: "json",
              variables: {
                channelId
              }
            });
            setErrorsList(errors || []);
          } catch (error: any) {
            toast.error(`Error al cargar errores: ${error.message || 'Error desconocido'}`);
            setErrorsList([]);
          } finally {
            setLoadingErrors(false);
          }
        }}
      />
    </div>
  );
}

// Componente Dialog para mostrar errores
interface ErrorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string | null;
  errors: any[];
  loading: boolean;
  channelNumber?: number;
  channelTitle?: string;
  onClearErrors: (channelId: string) => Promise<void>;
  onErrorsCleared: () => void;
  channelsWithErrors: (Channel & { errorCount: number })[];
  onChannelChange: (channelId: string) => Promise<void>;
  onOpenPlayer: (channelId: string, playerType: 'origin' | 'hls') => void;
}

function ErrorsDialog({ open, onOpenChange, channelId, errors, loading, channelNumber, channelTitle, onClearErrors, onErrorsCleared, channelsWithErrors, onChannelChange, onOpenPlayer }: ErrorsDialogProps) {
  const [clearing, setClearing] = React.useState(false);

  // Ordenar errores por timestamp descendente (más reciente primero)
  const sortedErrors = React.useMemo(() => {
    return [...errors].sort((a, b) => {
      const timestampA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timestampB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timestampB - timestampA; // Descendente: más reciente primero
    });
  }, [errors]);

  // Encontrar el índice del canal actual
  const currentChannelIndex = React.useMemo(() => {
    if (!channelId) return -1;
    return channelsWithErrors.findIndex(c => c._id === channelId);
  }, [channelId, channelsWithErrors]);

  // Función para navegar al canal anterior
  const handlePreviousChannel = async () => {
    if (currentChannelIndex > 0 && channelsWithErrors.length > 0) {
      const previousChannel = channelsWithErrors[currentChannelIndex - 1];
      await onChannelChange(previousChannel._id);
    }
  };

  // Función para navegar al canal siguiente
  const handleNextChannel = async () => {
    if (currentChannelIndex < channelsWithErrors.length - 1 && channelsWithErrors.length > 0) {
      const nextChannel = channelsWithErrors[currentChannelIndex + 1];
      await onChannelChange(nextChannel._id);
    }
  };

  const canGoPrevious = currentChannelIndex > 0;
  const canGoNext = currentChannelIndex >= 0 && currentChannelIndex < channelsWithErrors.length - 1;

  const handleClear = async () => {
    if (!channelId) return;

    setClearing(true);
    try {
      await onClearErrors(channelId);
      onErrorsCleared();
    } catch (error) {
      // El error ya se maneja en handleClearErrors
    } finally {
      setClearing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Errores del Canal {channelNumber} {channelTitle ? `- ${channelTitle}` : ''}
          </DialogTitle>
          <DialogDescription>
            Lista de errores registrados para este canal
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RotateCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Cargando errores...</span>
            </div>
          ) : sortedErrors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay errores registrados para este canal
            </div>
          ) : (
            <div className="space-y-3">
              {sortedErrors.map((error, index) => (
                <Card key={index} className="border-destructive/20">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">
                            Error #{error.errorCount}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {error.timestamp ? format(new Date(error.timestamp), 'PPp', { locale: es }) : 'Sin fecha'}
                          </span>
                        </div>
                        <p className="text-sm font-mono bg-muted p-2 rounded break-words">
                          {error.error}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        <DialogFooter className="flex-shrink-0">
          <div className="flex justify-center gap-2 w-60">
            {channelId && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (channelId) {
                    onOpenPlayer(channelId, 'hls');
                  }
                }}
                className="h-8 w-8 p-0"
                title="Reproducir HLS"
              >
                <Monitor className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex flex-1 justify-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handlePreviousChannel}
              disabled={!canGoPrevious}
              className="h-8 w-8 p-0"
              title="Canal anterior con errores"
            >
              <ChevronLeft className="h-10 w-10" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleNextChannel}
              disabled={!canGoNext}
              className="h-8 w-8 p-0"
              title="Canal siguiente con errores"
            >
              <ChevronRight className="h-10 w-10" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleClear}
              disabled={clearing || !channelId || errors.length === 0}
            >
              {clearing ? (
                <>
                  <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                  Limpiando...
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Limpiar Errores
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const [srcOrigins, setSrcOrigins] = useState<string[]>(['', '', '', '']);
  const [selectedSrcIndex, setSelectedSrcIndex] = useState<number>(0);

  // Resetear el formulario cuando se abre el diálogo o cambia el channel
  useEffect(() => {
    if (open) {
      if (channel) {
        // Inicializar srcOrigins: si existe, usarlo; si no, crear array con src actual en primera posición
        const initialSrcOrigins = channel.srcOrigins && channel.srcOrigins.length > 0
          ? [...channel.srcOrigins, ...Array(4 - channel.srcOrigins.length).fill('')].slice(0, 4)
          : [channel.src || '', '', '', ''];

        // Encontrar el índice del src actual en srcOrigins
        const currentSrcIndex = initialSrcOrigins.findIndex(s => s === channel.src);
        const indexToSelect = currentSrcIndex >= 0 ? currentSrcIndex : 0;

        setSrcOrigins(initialSrcOrigins);
        setSelectedSrcIndex(indexToSelect);
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
        setSrcOrigins(['', '', '', '']);
        setSelectedSrcIndex(0);
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

  // Actualizar src cuando se selecciona un radio diferente
  useEffect(() => {
    if (srcOrigins[selectedSrcIndex] && srcOrigins[selectedSrcIndex].trim() !== '') {
      setFormData(prev => ({ ...prev, src: srcOrigins[selectedSrcIndex] }));
    }
  }, [selectedSrcIndex]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Filtrar srcOrigins para eliminar valores vacíos
      const filteredSrcOrigins = srcOrigins.filter(src => src.trim() !== '');

      const args = {
        numberChannel: parseInt(formData.numberChannel) || 0,
        title: formData.title,
        groupTitle: formData.groupTitle || undefined,
        info: formData.info || undefined,
        logo: formData.logo || undefined,
        src: formData.src,
        srcOrigins: filteredSrcOrigins.length > 0 ? filteredSrcOrigins : undefined,
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
            <Label>Fuentes de Origen (srcOrigins)</Label>
            <div className="space-y-3 mt-2">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="srcOrigin"
                    checked={selectedSrcIndex === index}
                    onChange={() => {
                      setSelectedSrcIndex(index);
                      if (srcOrigins[index]) {
                        setFormData(prev => ({ ...prev, src: srcOrigins[index] }));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <Input
                    value={srcOrigins[index]}
                    onChange={(e) => {
                      const newSrcOrigins = [...srcOrigins];
                      newSrcOrigins[index] = e.target.value;
                      setSrcOrigins(newSrcOrigins);
                      // Si este es el src seleccionado, actualizar también el campo src
                      if (selectedSrcIndex === index) {
                        setFormData(prev => ({ ...prev, src: e.target.value }));
                      }
                    }}
                    placeholder={`Fuente de origen ${index + 1}`}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
            <div className="mt-2">
              <Label className="text-sm text-muted-foreground">URL de Origen Activa (src):</Label>
              <Input
                value={formData.src}
                onChange={(e) => setFormData({ ...formData, src: e.target.value })}
                required
                className="mt-1"
              />
            </div>
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
  const isValid = channel ? confirmationNumber === channel.numberChannel.toString() : false;

  // Resetear el campo cuando se abre/cierra el diálogo
  useEffect(() => {
    if (open) {
      setConfirmationNumber('');
    }
  }, [open]);

  if (!channel) return null;

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title="Eliminar Canal"
      description={
        <>
          Esta acción no se puede deshacer. Esto eliminará permanentemente el canal
          <strong> "{channel.title}"</strong> (Canal {channel.numberChannel}).
        </>
      }
      confirmButtonText="Eliminar Canal"
      isValid={isValid}
      validationContent={
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
      }
    />
  );
}

// Componente Dialog para reproducir video
interface VideoPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string | null;
  title: string;
  channel: Channel | null;
  playerType: 'origin' | 'hls';
  channels: Channel[];
  onChannelChange: (channel: Channel) => void;
  streamingChannel?: StreamingChannel;
  onClearErrors: (channelId: string) => Promise<void>;
  onViewErrors: (channelId: string) => Promise<void>;
}

function VideoPlayerDialog({ open, onOpenChange, url, title, channel, playerType, channels, onChannelChange, streamingChannel, onClearErrors, onViewErrors }: VideoPlayerDialogProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const hlsRef = React.useRef<any>(null);
  const mpegtsRef = React.useRef<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [streamType, setStreamType] = React.useState<string>('');

  // Obtener la lista de canales ordenados por número de canal
  const sortedChannels = React.useMemo(() => {
    return [...channels].sort((a, b) => a.numberChannel - b.numberChannel);
  }, [channels]);

  // Encontrar el índice del canal actual
  const currentChannelIndex = React.useMemo(() => {
    if (!channel) return -1;
    return sortedChannels.findIndex(c => c._id === channel._id);
  }, [channel, sortedChannels]);

  // Función para navegar al canal anterior
  const handlePreviousChannel = () => {
    if (currentChannelIndex > 0 && sortedChannels.length > 0) {
      const previousChannel = sortedChannels[currentChannelIndex - 1];
      onChannelChange(previousChannel);
    }
  };

  // Función para navegar al canal siguiente
  const handleNextChannel = () => {
    if (currentChannelIndex < sortedChannels.length - 1 && sortedChannels.length > 0) {
      const nextChannel = sortedChannels[currentChannelIndex + 1];
      onChannelChange(nextChannel);
    }
  };

  const canGoPrevious = currentChannelIndex > 0;
  const canGoNext = currentChannelIndex >= 0 && currentChannelIndex < sortedChannels.length - 1;

  // Función para copiar el origen al portapapeles
  const handleCopyOrigin = async () => {
    if (!channel?.src) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(channel.src);
        toast.success("URL de origen copiada al portapapeles");
      } else {
        // Fallback para contextos no seguros
        const textArea = document.createElement('textarea');
        textArea.value = channel.src;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          if (successful) {
            toast.success("URL de origen copiada al portapapeles");
          } else {
            throw new Error('Fallback copy failed');
          }
        } catch (fallbackError) {
          document.body.removeChild(textArea);
          toast.error("Error al copiar. Por favor, cópialo manualmente.");
        }
      }
    } catch (error) {
      toast.error("Error al copiar la URL");
    }
  };

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

      // Establecer volumen inicial al 20%
      video.volume = 0.2;

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
          <DialogTitle>{channel?.numberChannel} - {channel?.title}</DialogTitle>
          <DialogDescription>
            Reproductor de video en streaming Canal {channel?.numberChannel} - {channel?.title}
          </DialogDescription>
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
            onError={(e) => { console.log(545409, "error", e) }}
            onCanPlay={(e) => { console.log(545410, "canplay", e) }}
            onLoadStart={(e) => { console.log(545411, "loadstart", e) }}
            onLoad={(e) => { console.log(545412, "load", e) }}
            onLoadedMetadata={(e) => { console.log(545413, "loadedmetadata", e) }}
            onPlay={(e) => { console.log(545414, "play", e) }}
            onPause={(e) => { console.log(545415, "pause", e) }}
            onEnded={(e) => { console.log(545416, "ended", e) }}
          // onTimeUpdate={(e) => { console.log(545417, "timeupdate", e) }}
          >
            Tu navegador no soporta la reproducción de video.
          </video>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          {streamType && (
            <p className="text-xs text-muted-foreground my-2">
              Tipo: {streamType === 'hls' ? 'Stream HLS (usando HLS.js)' :
                streamType === 'mpegts' ? 'Stream MPEG-TS (usando mpegts.js)' :
                  'Stream directo (HTTP/HTTPS)'}
            </p>
          )}
          <div className="flex gap-2">
            <p className="text-sm text-muted-foreground mb-1">URL:</p>
            <p className="text-sm font-mono break-all">{url}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground mb-1">Origen:</p>
            <p className="text-sm font-mono break-all">{channel?.src}</p>
            {channel?.src && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyOrigin}
                className="h-8 w-8 p-0"
                title="Copiar URL de origen"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <DialogFooter>
          <div className='flex justify-center gap-2 w-20'>
            {streamingChannel?.errorCount && streamingChannel.errorCount > 0 ? (
              <div className="flex items-center gap-2">
                <Badge variant="destructive">{streamingChannel.errorCount}</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => channel && onClearErrors(channel._id)}
                  title="Limpiar errores"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => channel && onViewErrors(channel._id)}
                  title="Ver errores"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </div>
          <div className='flex flex-1 justify-center gap-2'>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handlePreviousChannel}
              disabled={!canGoPrevious}
              className="h-8 w-8 p-0"
              title="Canal anterior"
            >
              <ChevronLeft className="h-10 w-10" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleNextChannel}
              disabled={!canGoNext}
              className="h-8 w-8 p-0"
              title="Canal siguiente"
            >
              <ChevronRight className="h-10 w-10" />
            </Button>
          </div>
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

