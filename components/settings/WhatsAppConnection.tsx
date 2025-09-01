'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from 'sonner';
import {
  Smartphone,
  QrCode,
  Wifi,
  WifiOff,
  RefreshCw,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2
} from "lucide-react";
import {
  whatsappApiService,
  WhatsAppSession,
  CreateSessionResponse,
  SessionEventData
} from "@/lib/whatsapp-api";
import { useWhatsAppWebSocket } from "@/lib/hooks/useWhatsAppWebSocket";
import * as Typography from "@/components/Typography";

interface WhatsAppConnectionProps {
  cardFocusedId?: string;
  setCardFocusedId?: (id: string) => void;
}

export default function WhatsAppConnection({ cardFocusedId, setCardFocusedId }: WhatsAppConnectionProps) {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSessionId, setNewSessionId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [qrCodeData, setQrCodeData] = useState<{ [sessionId: string]: string }>({});
  const [selectedSession, setSelectedSession] = useState<string>('');

  // WebSocket connection
  const {
    connectionState,
    sessionEvents,
    subscribeToSession,
    unsubscribeFromSession
  } = useWhatsAppWebSocket('whatsapp-user');

  // Cargar sesiones al montar el componente
  useEffect(() => {
    loadSessions();
  }, []);

  // Escuchar eventos de WebSocket
  useEffect(() => {
    if (sessionEvents.length > 0) {
      const latestEvent = sessionEvents[sessionEvents.length - 1];
      handleSessionEvent(latestEvent);
    }
  }, [sessionEvents]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const sessionsData = await whatsappApiService.getAllSessions();
      setSessions(sessionsData);
    } catch (error: any) {
      toast.error("No se pudieron cargar las sesiones de WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  const handleSessionEvent = (event: SessionEventData) => {
    const { sessionId, event: eventType, data } = event;

    switch (eventType) {
      case 'connected':
        setSessions(prev => prev.map(session =>
          session.id === sessionId
            ? { ...session, isConnected: true, qrCode: undefined }
            : session
        ));
        setQrCodeData(prev => {
          const newData = { ...prev };
          delete newData[sessionId];
          return newData;
        });
        toast.success(`WhatsApp Conectado: La sesión ${sessionId} se conectó exitosamente`);
        break;

      case 'disconnected':
        setSessions(prev => prev.map(session =>
          session.id === sessionId
            ? { ...session, isConnected: false }
            : session
        ));
        toast.error(`WhatsApp Desconectado: La sesión ${sessionId} se desconectó`);
        break;

      case 'qr_generated':
        if (data?.qrCode) {
          setQrCodeData(prev => ({ ...prev, [sessionId]: data.qrCode }));
          toast.success(`QR Code Generado: Escanea el código QR para conectar ${sessionId}`);
        }
        break;

      case 'qr_expired':
        setQrCodeData(prev => {
          const newData = { ...prev };
          delete newData[sessionId];
          return newData;
        });
        toast.error(`QR Code Expirado: El código QR de ${sessionId} ha expirado`);
        break;

      case 'error':
        toast.error(`Error en ${sessionId}: ${data?.error || 'Error desconocido'}`);
        break;
    }
  };

  const createSession = async () => {
    if (!newSessionId.trim()) {
      toast.error("El ID de sesión es requerido");
      return;
    }

    setCreating(true);
    try {
      const response: CreateSessionResponse = await whatsappApiService.createSession(
        newSessionId.trim(),
        phoneNumber.trim() || undefined
      );

      if (response.success && response.session) {
        setSessions(prev => [...prev, response.session!]);

        if (response.qrCode) {
          setQrCodeData(prev => ({ ...prev, [response.session!.id]: response.qrCode! }));
        }

        // Suscribirse a eventos de esta sesión
        subscribeToSession(response.session.id);
        setSelectedSession(response.session.id);

        setNewSessionId('');
        setPhoneNumber('');

        toast.success(response.qrCode
          ? "Sesión Creada: Escanea el código QR para conectar WhatsApp"
          : "Sesión creada exitosamente");
      } else {
        toast.error(response.error || "No se pudo crear la sesión");
      }
    } catch (error: any) {
      toast.error(error.message || "Error al crear la sesión");
    } finally {
      setCreating(false);
    }
  };

  const regenerateQR = async (sessionId: string) => {
    try {
      const response = await whatsappApiService.regenerateQR(sessionId);

      if (response.success && response.qrCode) {
        setQrCodeData(prev => ({ ...prev, [sessionId]: response.qrCode! }));
        toast.success("QR Regenerado: Nuevo código QR generado");
      } else {
        toast.error(response.error || "No se pudo regenerar el QR");
      }
    } catch (error: any) {
      toast.error(error.message || "Error al regenerar QR");
    }
  };

  const disconnectSession = async (sessionId: string) => {
    try {
      const response = await whatsappApiService.disconnectSession(sessionId);

      if (response.success) {
        setSessions(prev => prev.filter(session => session.id !== sessionId));
        setQrCodeData(prev => {
          const newData = { ...prev };
          delete newData[sessionId];
          return newData;
        });
        unsubscribeFromSession(sessionId);

        toast.success("Sesión Eliminada: La sesión de WhatsApp ha sido eliminada");
      } else {
        toast.error(response.error || "No se pudo eliminar la sesión");
      }
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar sesión");
    }
  };

  const subscribeToSessionEvents = (sessionId: string) => {
    subscribeToSession(sessionId);
    setSelectedSession(sessionId);
    toast.success(`Suscripción Activada: Recibiendo eventos en tiempo real de ${sessionId}`);
  };

  const getStatusIcon = (session: WhatsAppSession) => {
    if (session.isConnected) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (qrCodeData[session.id]) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    } else {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = (session: WhatsAppSession) => {
    if (session.isConnected) {
      return "Conectado";
    } else if (qrCodeData[session.id]) {
      return "Esperando QR";
    } else {
      return "Desconectado";
    }
  };

  const getStatusVariant = (session: WhatsAppSession): "default" | "secondary" | "destructive" => {
    if (session.isConnected) return "default";
    if (qrCodeData[session.id]) return "secondary";
    return "destructive";
  };

  return (
    <Card
      className={`transition-all duration-200 ${cardFocusedId === 'whatsapp-connection' ? 'ring-2 ring-primary' : ''
        }`}
      onClick={() => setCardFocusedId?.('whatsapp-connection')}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-green-600" />
            <div>
              <CardTitle>Conexión WhatsApp</CardTitle>
              <CardDescription>
                Gestiona las conexiones de WhatsApp Business para automatización de mensajes
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {connectionState.connected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <Badge variant={connectionState.connected ? "default" : "destructive"}>
              {connectionState.connected ? "WebSocket Conectado" : "WebSocket Desconectado"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Crear nueva sesión */}
        <div className="space-y-4">
          <Typography.TypographyH4>Nueva Sesión</Typography.TypographyH4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sessionId">ID de Sesión</Label>
              <Input
                id="sessionId"
                placeholder="ej: empresa-ventas"
                value={newSessionId}
                onChange={(e) => setNewSessionId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Número (Opcional)</Label>
              <Input
                id="phoneNumber"
                placeholder="ej: +573001234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={createSession}
            disabled={creating || !newSessionId.trim()}
            className="w-full md:w-auto"
          >
            {creating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <MessageSquare className="mr-2 h-4 w-4" />
                Crear Sesión
              </>
            )}
          </Button>
        </div>

        <Separator />

        {/* Lista de sesiones */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Typography.TypographyH4>Sesiones Activas</Typography.TypographyH4>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSessions}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>

          {sessions.length === 0 ? (
            <Card className="bg-muted/50">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
                <Typography.TypographyP className="text-center text-muted-foreground">
                  No hay sesiones de WhatsApp configuradas.
                  <br />
                  Crea una nueva sesión para comenzar.
                </Typography.TypographyP>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sessions.map((session) => (
                <Card key={session.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(session)}
                        <div>
                          <Typography.TypographyP className="font-medium">
                            {session.id}
                          </Typography.TypographyP>
                          {session.phoneNumber && (
                            <Typography.TypographySmall className="text-muted-foreground">
                              {session.phoneNumber}
                            </Typography.TypographySmall>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusVariant(session)}>
                          {getStatusText(session)}
                        </Badge>

                        {selectedSession === session.id && (
                          <Badge variant="outline">
                            Suscrito
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* QR Code Display */}
                    {qrCodeData[session.id] && (
                      <div className="mt-4 p-4 bg-white rounded-lg border-2 border-dashed border-primary/20">
                        <div className="flex flex-col items-center space-y-3">
                          <QrCode className="h-6 w-6 text-primary" />
                          <Typography.TypographySmall className="text-center">
                            Escanea este código con WhatsApp
                          </Typography.TypographySmall>
                          <div className="w-64 h-64 flex items-center justify-center border border-gray-200 rounded-lg bg-white">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData[session.id])}`}
                              alt="QR Code"
                              className="w-48 h-48"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex items-center justify-end space-x-2 mt-4">
                      {!session.isConnected && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => regenerateQR(session.id)}
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          Regenerar QR
                        </Button>
                      )}

                      {selectedSession !== session.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => subscribeToSessionEvents(session.id)}
                        >
                          <Wifi className="h-4 w-4 mr-2" />
                          Suscribirse
                        </Button>
                      )}

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => disconnectSession(session.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Estado de conexión WebSocket */}
        {connectionState.error && (
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <Typography.TypographySmall className="text-destructive">
                  {connectionState.error}
                </Typography.TypographySmall>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Eventos recientes */}
        {sessionEvents.length > 0 && (
          <div className="space-y-3">
            <Typography.TypographyH4>Eventos Recientes</Typography.TypographyH4>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {sessionEvents.slice(-5).reverse().map((event, index) => (
                <Card key={index} className="bg-muted/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {event.event}
                        </Badge>
                        <Typography.TypographySmall>
                          {event.sessionId}
                        </Typography.TypographySmall>
                      </div>
                      <Typography.TypographySmall className="text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </Typography.TypographySmall>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
