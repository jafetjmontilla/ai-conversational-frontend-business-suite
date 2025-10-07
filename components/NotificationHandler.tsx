"use client";

import React, { useEffect } from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';

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

const NotificationHandler: React.FC = () => {
  const { 
    isConnected, 
    onNotification, 
    onConnected, 
    subscribeToNotifications 
  } = useWebSocketContext();

  useEffect(() => {
    if (isConnected) {
      console.log('🔔 Suscribiéndose a notificaciones...');
      subscribeToNotifications();
    }
  }, [isConnected, subscribeToNotifications]);

  useEffect(() => {
    // Escuchar confirmación de conexión
    onConnected((data) => {
      console.log('✅ Conexión confirmada:', data);
    });
  }, [onConnected]);

  useEffect(() => {
    // Escuchar notificaciones
    onNotification((notification: NotificationData) => {
      console.log('🔔 Notificación recibida:', notification);
      
      // Aquí puedes mostrar la notificación en la UI
      // Por ejemplo, usando un toast, modal, o sistema de notificaciones
      showNotificationToast(notification);
    });
  }, [onNotification]);

  const showNotificationToast = (notification: NotificationData) => {
    // Ejemplo de cómo mostrar la notificación
    // Puedes integrar con tu sistema de toast preferido
    const toast = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      timestamp: notification.timestamp,
      metadata: notification.metadata
    };

    // Ejemplo usando console para debugging
    console.log('📢 Mostrando toast:', toast);
    
    // Aquí puedes integrar con tu sistema de notificaciones:
    // - React Toastify
    // - Chakra UI Toast
    // - Ant Design notification
    // - Custom toast component
    
    // Ejemplo con alert (solo para testing)
    if (typeof window !== 'undefined') {
      alert(`${notification.type.toUpperCase()}: ${notification.title}\n${notification.message}`);
    }
  };

  return null; // Este componente no renderiza nada visible
};

export default NotificationHandler;
