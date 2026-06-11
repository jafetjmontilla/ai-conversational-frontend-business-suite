"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { getIdToken } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import type { BusinessUpdatedPayload } from '@/lib/types/businessRealtime';

// Tipos para notificaciones
interface NotificationData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  userId?: string;
  timestamp: Date;
  read?: boolean;
  metadata?: Record<string, any>;
}

// Tipos para streaming
interface StreamingUpdate {
  _id: string;
  channelId: string;
  numberChannel: number;
  status: 'running' | 'stopped' | 'error' | 'restarting';
  processId?: number;
  startedAt?: string;
  lastError?: string;
  errorCount: number;
  updatedAt?: string;
}

interface StreamingError {
  channelId: string;
  numberChannel: number;
  error: string;
  errorCount: number;
  timestamp: string;
}

// Payloads de eventos de tickets (modo colaborativo)
export interface TicketCreatedPayload {
  ticket: Record<string, unknown>;
}

export interface TicketUpdatedPayload {
  _id: string;
  ticket: Record<string, unknown>;
}

export interface TicketDeletedPayload {
  _id: string;
}

export interface ProtocolDraftUpdatedPayload {
  businessId: string;
}

export type { BusinessUpdatedPayload };

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  // Eventos de notificaciones
  onNotification: (callback: (notification: NotificationData) => void) => void;
  onConnected: (callback: (data: any) => void) => void;
  // Métodos para suscribirse/desuscribirse
  subscribeToNotifications: () => void;
  unsubscribeFromNotifications: () => void;
  // Nuevos métodos para streaming
  onStreamingUpdate: (callback: (update: StreamingUpdate) => void) => void;
  onStreamingError: (callback: (error: StreamingError) => void) => void;
  subscribeToStreaming: () => void;
  // Eventos de tickets (modo colaborativo)
  onTicketCreated: (callback: (payload: TicketCreatedPayload) => void) => void;
  onTicketUpdated: (callback: (payload: TicketUpdatedPayload) => void) => void;
  onTicketDeleted: (callback: (payload: TicketDeletedPayload) => void) => void;
  // Knowledge: borradores de protocolos (sustituye polling listProtocolDrafts). Devuelve unsubscribe.
  onProtocolDraftUpdated: (callback: (payload: ProtocolDraftUpdatedPayload) => void) => () => void;
  subscribeToKnowledge: (businessId: string) => void;
  unsubscribeFromKnowledge: (businessId: string) => void;
  // Negocio: apps, config, etc. (agente, otro usuario o API)
  onBusinessUpdated: (callback: (payload: BusinessUpdatedPayload) => void) => () => void;
  subscribeToBusiness: (businessId: string) => void;
  unsubscribeFromBusiness: (businessId: string) => void;
  // Se invoca al reconectar tras pérdida de conexión
  onReconnect: (callback: () => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext debe ser usado dentro de WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  // Obtener estado de autenticación
  const { user, loading } = useAuth();

  // Estado para forzar renovación de token y reconexión
  const [forceTokenRefresh, setForceTokenRefresh] = useState(false);
  const tokenRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTokenRef = useRef<string | null>(null);

  // Usar refs para evitar re-renders
  const invoiceCallbacksRef = useRef<{
    onNotification: ((notification: NotificationData) => void)[];
    onConnected: ((data: any) => void)[];
  }>({
    onNotification: [],
    onConnected: []
  });

  const streamingCallbacksRef = useRef<{
    onUpdate: ((update: StreamingUpdate) => void)[];
    onError: ((error: StreamingError) => void)[];
  }>({
    onUpdate: [],
    onError: []
  });

  const ticketCallbacksRef = useRef<{
    onTicketCreated: ((payload: TicketCreatedPayload) => void)[];
    onTicketUpdated: ((payload: TicketUpdatedPayload) => void)[];
    onTicketDeleted: ((payload: TicketDeletedPayload) => void)[];
  }>({
    onTicketCreated: [],
    onTicketUpdated: [],
    onTicketDeleted: []
  });

  const protocolDraftCallbacksRef = useRef<((payload: ProtocolDraftUpdatedPayload) => void)[]>([]);

  const businessUpdatedCallbacksRef = useRef<((payload: BusinessUpdatedPayload) => void)[]>([]);

  const onReconnectCallbacksRef = useRef<(() => void)[]>([]);
  const hadConnectedOnceRef = useRef<boolean>(false);

  // Obtener token de autenticación de Firebase (mismo que GraphQL)
  // Si forceRefresh es true, fuerza la renovación del token
  const getAuthToken = useCallback(async (forceRefresh: boolean = false) => {
    try {
      if (!user) {
        return null;
      }

      // Si se requiere renovación forzada, usar getIdToken(true)
      const token = forceRefresh
        ? await user.getIdToken(true) // Forzar renovación
        : await getIdToken();

      // Verificar si el token cambió
      if (token && token !== lastTokenRef.current) {
        const previousToken = lastTokenRef.current;
        lastTokenRef.current = token;

        // Si había un token anterior y cambió, el token se renovó
        if (previousToken) {
          console.log('🔄 Token renovado detectado');
        }
      }

      return token;
    } catch (error) {
      console.error('Error al obtener token de Firebase:', error);
      return null;
    }
  }, [user]);

  // Wrapper para getAuthToken que siempre pasa el forceRefresh del estado
  const getAuthTokenWrapper = useCallback(async () => {
    const shouldForceRefresh = forceTokenRefresh;
    if (shouldForceRefresh) {
      setForceTokenRefresh(false); // Resetear después de usarlo
    }
    return await getAuthToken(shouldForceRefresh);
  }, [getAuthToken, forceTokenRefresh]);

  // Configurar WebSocket solo si el usuario está autenticado
  const shouldConnect = !loading && !!user;

  // Callback para cuando se detecta que el token expiró
  const handleTokenExpired = useCallback(() => {
    console.log('🔄 Token expirado detectado, forzando renovación...');
    setForceTokenRefresh(true);
  }, []);

  const { socket, isConnected, error, reconnect } = useWebSocket(
    shouldConnect ? (process.env.NEXT_PUBLIC_WEBSOCKET_URL || '') : '',
    shouldConnect ? getAuthTokenWrapper : async () => null,
    forceTokenRefresh,
    { onTokenExpired: shouldConnect ? handleTokenExpired : undefined }
  );

  // Monitorear renovación automática de token de Firebase
  useEffect(() => {
    if (!user || !shouldConnect) {
      // Limpiar intervalo si no hay usuario
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
        tokenRefreshIntervalRef.current = null;
      }
      lastTokenRef.current = null;
      return;
    }

    // Verificar periódicamente si el token cambió (Firebase renueva automáticamente)
    // Firebase renueva tokens aproximadamente cada hora, verificamos cada 5 minutos
    tokenRefreshIntervalRef.current = setInterval(async () => {
      try {
        const currentToken = await getIdToken();
        if (currentToken && currentToken !== lastTokenRef.current && lastTokenRef.current !== null) {
          console.log('🔄 Token renovado automáticamente por Firebase, verificando conexión...');
          lastTokenRef.current = currentToken;

          // Si el socket no está conectado, reconectar
          // Usar una referencia al socket actual para evitar dependencias
          if (socket && !socket.connected) {
            console.log('🔄 Reconectando con nuevo token...');
            reconnect();
          }
        } else if (currentToken) {
          lastTokenRef.current = currentToken;
        }
      } catch (error) {
        console.error('Error al verificar token:', error);
      }
    }, 5 * 60 * 1000); // Cada 5 minutos

    // Inicializar el token actual
    getIdToken().then(token => {
      if (token) {
        lastTokenRef.current = token;
      }
    });

    return () => {
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
        tokenRefreshIntervalRef.current = null;
      }
    };
  }, [user, shouldConnect, socket, reconnect]);

  // Manejadores de eventos WebSocket (sin dependencias que causen re-renders)

  const handleNotification = useCallback((notification: NotificationData) => {
    console.log('🔔 Nueva notificación recibida:', notification);
    invoiceCallbacksRef.current.onNotification.forEach(callback => callback(notification));
  }, []);

  const handleConnected = useCallback((data: any) => {
    console.log('🔌 Confirmación de conexión:', data);
    invoiceCallbacksRef.current.onConnected.forEach(callback => callback(data));
  }, []);

  const handleStreamingUpdate = useCallback((update: StreamingUpdate) => {
    console.log('📺 Actualización de streaming recibida:', update);
    streamingCallbacksRef.current.onUpdate.forEach(callback => callback(update));
  }, []);

  const handleStreamingError = useCallback((error: StreamingError) => {
    console.error('❌ Error de streaming recibido:', error);
    streamingCallbacksRef.current.onError.forEach(callback => callback(error));
  }, []);

  const handleStreamingInitial = useCallback((statuses: StreamingUpdate[]) => {
    console.log('📺 Estado inicial de streaming recibido:', statuses);
    // Emitir cada estado como actualización individual
    statuses.forEach(status => {
      streamingCallbacksRef.current.onUpdate.forEach(callback => callback(status));
    });
  }, []);

  const handleTicketCreated = useCallback((payload: TicketCreatedPayload) => {
    ticketCallbacksRef.current.onTicketCreated.forEach(cb => cb(payload));
  }, []);

  const handleTicketUpdated = useCallback((payload: TicketUpdatedPayload) => {
    ticketCallbacksRef.current.onTicketUpdated.forEach(cb => cb(payload));
  }, []);

  const handleTicketDeleted = useCallback((payload: TicketDeletedPayload) => {
    ticketCallbacksRef.current.onTicketDeleted.forEach(cb => cb(payload));
  }, []);

  const handleProtocolDraftUpdated = useCallback((payload: ProtocolDraftUpdatedPayload) => {
    protocolDraftCallbacksRef.current.forEach(cb => cb(payload));
  }, []);

  const handleBusinessUpdated = useCallback((payload: BusinessUpdatedPayload) => {
    businessUpdatedCallbacksRef.current.forEach(cb => cb(payload));
  }, []);

  // Detectar reconexión (isConnected pasa de false a true tras haber estado conectado)
  useEffect(() => {
    if (isConnected) {
      if (hadConnectedOnceRef.current) {
        onReconnectCallbacksRef.current.forEach(cb => cb());
      } else {
        hadConnectedOnceRef.current = true;
      }
    }
  }, [isConnected]);

  useEffect(() => {
    console.log('🔌 Is Connected:', isConnected);
    console.log('🔌 Error:', error);

    // Si hay un error y el usuario está autenticado, intentar reconectar
    if (error && shouldConnect && socket && !socket.connected) {
      console.log('🔄 Error detectado, intentando reconectar...');
      // El hook useWebSocket ya maneja la reconexión automática,
      // pero podemos forzar una reconexión manual si es necesario
      setTimeout(() => {
        if (socket && !socket.connected && shouldConnect) {
          reconnect();
        }
      }, 2000);
    }
  }, [isConnected, error, shouldConnect, socket, reconnect]);

  // Configurar eventos WebSocket cuando el socket esté disponible
  useEffect(() => {
    if (!socket) {
      console.log('🔌 Socket no disponible para configurar eventos');
      return;
    }

    console.log('🔌 Configurando eventos WebSocket para socket:', socket);

    // Suscribirse a eventos de notificaciones
    socket.on('notification', handleNotification);
    socket.on('connected', handleConnected);

    // Suscribirse a eventos de streaming
    socket.on('streaming:update', handleStreamingUpdate);
    socket.on('streaming:error', handleStreamingError);
    socket.on('streaming:initial', handleStreamingInitial);

    // Eventos de tickets (modo colaborativo)
    socket.on('ticket:created', handleTicketCreated);
    socket.on('ticket:updated', handleTicketUpdated);
    socket.on('ticket:deleted', handleTicketDeleted);

    // Knowledge: borradores de protocolos
    socket.on('protocolDraft:updated', handleProtocolDraftUpdated);

    // Negocio: apps instaladas, config, etc.
    socket.on('business:updated', handleBusinessUpdated);

    // Cleanup
    return () => {
      socket.off('notification', handleNotification);
      socket.off('connected', handleConnected);
      socket.off('streaming:update', handleStreamingUpdate);
      socket.off('streaming:error', handleStreamingError);
      socket.off('streaming:initial', handleStreamingInitial);
      socket.off('ticket:created', handleTicketCreated);
      socket.off('ticket:updated', handleTicketUpdated);
      socket.off('ticket:deleted', handleTicketDeleted);
      socket.off('protocolDraft:updated', handleProtocolDraftUpdated);
      socket.off('business:updated', handleBusinessUpdated);
    };
  }, [socket, handleNotification, handleConnected, handleStreamingUpdate, handleStreamingError, handleStreamingInitial, handleTicketCreated, handleTicketUpdated, handleTicketDeleted, handleProtocolDraftUpdated, handleBusinessUpdated]);

  // Métodos para suscribirse a eventos (sin dependencias)
  const onNotification = useCallback((callback: (notification: NotificationData) => void) => {
    invoiceCallbacksRef.current.onNotification.push(callback);
  }, []);

  const onConnected = useCallback((callback: (data: any) => void) => {
    invoiceCallbacksRef.current.onConnected.push(callback);
  }, []);

  // Métodos para suscribirse/desuscribirse

  const subscribeToNotifications = useCallback(() => {
    if (socket) {
      socket.emit('notification:subscribe', { timestamp: new Date().toISOString() });
    }
  }, [socket]);

  const unsubscribeFromNotifications = useCallback(() => {
    if (socket) {
      socket.emit('notification:unsubscribe');
    }
  }, [socket]);

  const onStreamingUpdate = useCallback((callback: (update: StreamingUpdate) => void) => {
    streamingCallbacksRef.current.onUpdate.push(callback);
  }, []);

  const onStreamingError = useCallback((callback: (error: StreamingError) => void) => {
    streamingCallbacksRef.current.onError.push(callback);
  }, []);

  const subscribeToStreaming = useCallback(() => {
    if (socket) {
      socket.emit('streaming:subscribe');
    }
  }, [socket]);

  const onTicketCreated = useCallback((callback: (payload: TicketCreatedPayload) => void) => {
    ticketCallbacksRef.current.onTicketCreated.push(callback);
  }, []);

  const onTicketUpdated = useCallback((callback: (payload: TicketUpdatedPayload) => void) => {
    ticketCallbacksRef.current.onTicketUpdated.push(callback);
  }, []);

  const onTicketDeleted = useCallback((callback: (payload: TicketDeletedPayload) => void) => {
    ticketCallbacksRef.current.onTicketDeleted.push(callback);
  }, []);

  const onProtocolDraftUpdated = useCallback((callback: (payload: ProtocolDraftUpdatedPayload) => void) => {
    protocolDraftCallbacksRef.current.push(callback);
    return () => {
      const i = protocolDraftCallbacksRef.current.indexOf(callback);
      if (i !== -1) protocolDraftCallbacksRef.current.splice(i, 1);
    };
  }, []);

  const subscribeToKnowledge = useCallback((businessId: string) => {
    if (socket && businessId) {
      socket.emit('knowledge:subscribe', { businessId });
    }
  }, [socket]);

  const unsubscribeFromKnowledge = useCallback((businessId: string) => {
    if (socket && businessId) {
      socket.emit('knowledge:unsubscribe', { businessId });
    }
  }, [socket]);

  const onBusinessUpdated = useCallback((callback: (payload: BusinessUpdatedPayload) => void) => {
    businessUpdatedCallbacksRef.current.push(callback);
    return () => {
      const i = businessUpdatedCallbacksRef.current.indexOf(callback);
      if (i !== -1) businessUpdatedCallbacksRef.current.splice(i, 1);
    };
  }, []);

  const subscribeToBusiness = useCallback((businessId: string) => {
    if (socket && businessId) {
      socket.emit('business:subscribe', { businessId });
    }
  }, [socket]);

  const unsubscribeFromBusiness = useCallback((businessId: string) => {
    if (socket && businessId) {
      socket.emit('business:unsubscribe', { businessId });
    }
  }, [socket]);

  const onReconnect = useCallback((callback: () => void) => {
    onReconnectCallbacksRef.current.push(callback);
    return () => {
      const i = onReconnectCallbacksRef.current.indexOf(callback);
      if (i !== -1) onReconnectCallbacksRef.current.splice(i, 1);
    };
  }, []);

  const value: WebSocketContextType = {
    socket,
    isConnected,
    error,
    onNotification,
    onConnected,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    onStreamingUpdate,
    onStreamingError,
    subscribeToStreaming,
    onTicketCreated,
    onTicketUpdated,
    onTicketDeleted,
    onProtocolDraftUpdated,
    subscribeToKnowledge,
    unsubscribeFromKnowledge,
    onBusinessUpdated,
    subscribeToBusiness,
    unsubscribeFromBusiness,
    onReconnect
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}