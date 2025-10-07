"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { Invoice } from '@/lib/schemas/invoice';
import { getIdToken } from '@/lib/firebase';
import { useAuth } from './AuthContext';

export type SocketEvent = "invoice:created" | "invoice:updated" | "invoice:deleted" | "invoices-list-updated";

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

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  // Eventos de facturas
  onInvoiceCreated: (callback: (invoice: Invoice) => void) => void;
  onInvoiceUpdated: (callback: (invoice: Invoice) => void) => void;
  onInvoiceDeleted: (callback: (invoiceId: string) => void) => void;
  onInvoicesListUpdated: (callback: (invoices: Invoice[]) => void) => void;
  // Eventos de notificaciones
  onNotification: (callback: (notification: NotificationData) => void) => void;
  onConnected: (callback: (data: any) => void) => void;
  // Métodos para suscribirse/desuscribirse
  subscribeToInvoices: () => void;
  unsubscribeFromInvoices: () => void;
  subscribeToNotifications: () => void;
  unsubscribeFromNotifications: () => void;
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

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  // Obtener estado de autenticación
  const { user, loading } = useAuth();

  // Usar refs para evitar re-renders
  const invoiceCallbacksRef = useRef<{
    onInvoiceCreated: ((invoice: Invoice) => void)[];
    onInvoiceUpdated: ((invoice: Invoice) => void)[];
    onInvoiceDeleted: ((invoiceId: string) => void)[];
    onInvoicesListUpdated: ((invoices: Invoice[]) => void)[];
    onNotification: ((notification: NotificationData) => void)[];
    onConnected: ((data: any) => void)[];
  }>({
    onInvoiceCreated: [],
    onInvoiceUpdated: [],
    onInvoiceDeleted: [],
    onInvoicesListUpdated: [],
    onNotification: [],
    onConnected: []
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
    shouldConnect ? (process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'https://api-erp-v1.sistemasjaihom.com') : '',
    shouldConnect ? getAuthToken : async () => null
  );

  // Manejadores de eventos WebSocket (sin dependencias que causen re-renders)
  const handleInvoiceCreated = useCallback((invoice: Invoice) => {
    invoiceCallbacksRef.current.onInvoiceCreated.forEach(callback => callback(invoice));
  }, []);

  const handleInvoiceUpdated = useCallback((invoice: Invoice) => {
    console.log('📡 Factura actualizada via WebSocket:', invoice._id);
    invoiceCallbacksRef.current.onInvoiceUpdated.forEach(callback => callback(invoice));
  }, []);

  const handleInvoiceDeleted = useCallback((data: { invoiceId: string }) => {
    console.log('📡 Factura eliminada via WebSocket:', data.invoiceId);
    invoiceCallbacksRef.current.onInvoiceDeleted.forEach(callback => callback(data.invoiceId));
  }, []);

  const handleInvoicesListUpdated = useCallback((invoices: Invoice[]) => {
    console.log('📡 Lista de facturas actualizada via WebSocket');
    invoiceCallbacksRef.current.onInvoicesListUpdated.forEach(callback => callback(invoices));
  }, []);

  const handleNotification = useCallback((notification: NotificationData) => {
    console.log('🔔 Nueva notificación recibida:', notification);
    invoiceCallbacksRef.current.onNotification.forEach(callback => callback(notification));
  }, []);

  const handleConnected = useCallback((data: any) => {
    console.log('🔌 Confirmación de conexión:', data);
    invoiceCallbacksRef.current.onConnected.forEach(callback => callback(data));
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
    // Suscribirse a eventos de facturas
    socket.on('invoice:created', handleInvoiceCreated);
    socket.on('invoice:updated', handleInvoiceUpdated);
    socket.on('invoice:deleted', handleInvoiceDeleted);
    socket.on('invoices-list-updated', handleInvoicesListUpdated);

    // Suscribirse a eventos de notificaciones
    socket.on('notification', handleNotification);
    socket.on('connected', handleConnected);

    // Cleanup
    return () => {
      socket.off('invoice:created', handleInvoiceCreated);
      socket.off('invoice:updated', handleInvoiceUpdated);
      socket.off('invoice:deleted', handleInvoiceDeleted);
      socket.off('invoices-list-updated', handleInvoicesListUpdated);
      socket.off('notification', handleNotification);
      socket.off('connected', handleConnected);
    };
  }, [socket, handleInvoiceCreated, handleInvoiceUpdated, handleInvoiceDeleted, handleInvoicesListUpdated, handleNotification, handleConnected]);

  // Métodos para suscribirse a eventos (sin dependencias)
  const onInvoiceCreated = useCallback((callback: (invoice: Invoice) => void) => {
    invoiceCallbacksRef.current.onInvoiceCreated.push(callback);
  }, []);

  const onInvoiceUpdated = useCallback((callback: (invoice: Invoice) => void) => {
    invoiceCallbacksRef.current.onInvoiceUpdated.push(callback);
  }, []);

  const onInvoiceDeleted = useCallback((callback: (invoiceId: string) => void) => {
    invoiceCallbacksRef.current.onInvoiceDeleted.push(callback);
  }, []);

  const onInvoicesListUpdated = useCallback((callback: (invoices: Invoice[]) => void) => {
    invoiceCallbacksRef.current.onInvoicesListUpdated.push(callback);
  }, []);

  const onNotification = useCallback((callback: (notification: NotificationData) => void) => {
    invoiceCallbacksRef.current.onNotification.push(callback);
  }, []);

  const onConnected = useCallback((callback: (data: any) => void) => {
    invoiceCallbacksRef.current.onConnected.push(callback);
  }, []);

  // Métodos para suscribirse/desuscribirse
  const subscribeToInvoices = useCallback(() => {
    if (socket) {
      socket.emit('join-invoices-room');
    }
  }, [socket]);

  const unsubscribeFromInvoices = useCallback(() => {
    if (socket) {
      socket.emit('leave-invoices-room');
    }
  }, [socket]);

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

  const value: WebSocketContextType = {
    socket,
    isConnected,
    error,
    onInvoiceCreated,
    onInvoiceUpdated,
    onInvoiceDeleted,
    onInvoicesListUpdated,
    onNotification,
    onConnected,
    subscribeToInvoices,
    unsubscribeFromInvoices,
    subscribeToNotifications,
    unsubscribeFromNotifications
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};