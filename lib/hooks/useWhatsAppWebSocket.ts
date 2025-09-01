import { useState, useEffect, useRef } from 'react';
import {
  WhatsAppWebSocketClient,
  SessionEventData,
  WebSocketConnectionState
} from '../whatsapp-api';

// Hook de React para usar WebSocket de WhatsApp
export function useWhatsAppWebSocket(userId?: string, token?: string) {
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>({
    connected: false,
    connecting: false,
    error: null
  });

  const [sessionEvents, setSessionEvents] = useState<SessionEventData[]>([]);
  const clientRef = useRef<WhatsAppWebSocketClient | null>(null);

  useEffect(() => {
    // Crear cliente si no existe
    if (!clientRef.current) {
      clientRef.current = new WhatsAppWebSocketClient(userId, token);
    }

    const client = clientRef.current;

    // Configurar listeners
    const handleConnectionEstablished = () => {
      setConnectionState(prev => ({
        ...prev,
        connected: true,
        connecting: false,
        error: null
      }));
    };

    const handleDisconnected = (data: any) => {
      setConnectionState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        error: `Desconectado: ${data.reason}`
      }));
    };

    const handleSessionEvent = (data: SessionEventData) => {
      setSessionEvents(prev => [...prev.slice(-19), data]); // Mantener últimos 20 eventos
    };

    const handlePong = () => {
      setConnectionState(prev => ({
        ...prev,
        lastPing: new Date()
      }));
    };

    // Registrar listeners
    client.on('connection_established', handleConnectionEstablished);
    client.on('disconnected', handleDisconnected);
    client.on('session_event', handleSessionEvent);
    client.on('pong', handlePong);

    // Conectar
    setConnectionState(prev => ({ ...prev, connecting: true }));
    client.connect().catch(error => {
      setConnectionState(prev => ({
        ...prev,
        connecting: false,
        error: error.message
      }));
    });

    // Cleanup
    return () => {
      client.off('connection_established', handleConnectionEstablished);
      client.off('disconnected', handleDisconnected);
      client.off('session_event', handleSessionEvent);
      client.off('pong', handlePong);
      client.disconnect();
    };
  }, [userId, token]);

  const subscribeToSession = (sessionId: string) => {
    clientRef.current?.subscribeToSession(sessionId);
  };

  const unsubscribeFromSession = (sessionId: string) => {
    clientRef.current?.unsubscribeFromSession(sessionId);
  };

  const subscribeToGlobalEvents = () => {
    clientRef.current?.subscribeToGlobalEvents();
  };

  const ping = () => {
    clientRef.current?.ping();
  };

  return {
    connectionState,
    sessionEvents,
    subscribeToSession,
    unsubscribeFromSession,
    subscribeToGlobalEvents,
    ping,
    client: clientRef.current
  };
}

export default useWhatsAppWebSocket;
