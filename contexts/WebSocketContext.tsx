"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { getIdToken } from '@/lib/firebase';
import { useAuth } from './AuthContext';

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

  // Obtener token de autenticación de Firebase (mismo que GraphQL)
  const getAuthToken = useCallback(async () => {
    try {
      const token = await getIdToken();
      return token;
    } catch (error) {
      console.error('Error al obtener token de Firebase:', error);
      return null;
    }
  }, []);

  // Configurar WebSocket solo si el usuario está autenticado
  const shouldConnect = !loading && !!user;

  const { socket, isConnected, error } = useWebSocket(
    shouldConnect ? (process.env.NEXT_PUBLIC_WEBSOCKET_URL || '') : '',
    shouldConnect ? getAuthToken : async () => null
  );

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

  useEffect(() => {
    console.log('🔌 Is Connected:', isConnected);
    console.log('🔌 Error:', error);
  }, [isConnected]);

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

    // Cleanup
    return () => {
      socket.off('notification', handleNotification);
      socket.off('connected', handleConnected);
      socket.off('streaming:update', handleStreamingUpdate);
      socket.off('streaming:error', handleStreamingError);
      socket.off('streaming:initial', handleStreamingInitial);
    };
  }, [socket, handleNotification, handleConnected, handleStreamingUpdate, handleStreamingError, handleStreamingInitial]);

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
    subscribeToStreaming
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}