import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketHook {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
}

interface UseWebSocketOptions {
  onTokenExpired?: () => void;
}

// Razones de desconexión que requieren renovación de token
const TOKEN_EXPIRED_REASONS = [
  'io server disconnect', // Servidor desconecta por token inválido
  'Invalid token',
  'No token provided'
];

// Razones de desconexión temporales que permiten reconexión
const TEMPORARY_DISCONNECT_REASONS = [
  'transport close', // Pérdida de conexión de red
  'ping timeout', // Timeout del ping
  'transport error' // Error de transporte
];

export const useWebSocket = (
  url: string,
  getToken: () => Promise<string | null>,
  forceRefresh: boolean = false,
  options: UseWebSocketOptions = {}
): WebSocketHook => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const getTokenRef = useRef(getToken);
  const onTokenExpiredRef = useRef(options.onTokenExpired);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const isConnectingRef = useRef(false);
  const shouldReconnectRef = useRef(true);

  // Actualizar referencia del callback
  useEffect(() => {
    onTokenExpiredRef.current = options.onTokenExpired;
  }, [options.onTokenExpired]);

  // Actualizar la referencia cuando cambie getToken
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  // Función para limpiar timeout de reconexión
  const clearReconnectTimeout = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  // Función para determinar si debe reconectarse basado en la razón
  const shouldReconnect = (reason: string): boolean => {
    // Si el usuario se desautenticó, no reconectar
    if (!shouldReconnectRef.current) {
      return false;
    }

    // Si es una razón de token expirado, sí reconectar (después de renovar token)
    if (TOKEN_EXPIRED_REASONS.some(r => reason.includes(r))) {
      return true;
    }

    // Si es una razón temporal, sí reconectar
    if (TEMPORARY_DISCONNECT_REASONS.some(r => reason.includes(r))) {
      return true;
    }

    // Por defecto, no reconectar (desconexión manual o desconocida)
    return false;
  };

  // Función para conectar el socket
  const connectSocket = async () => {
    if (isConnectingRef.current) {
      return;
    }

    isConnectingRef.current = true;
    clearReconnectTimeout();

    try {
      // Obtener token (el contexto manejará la renovación forzada si es necesario)
      const token = await getTokenRef.current();

      if (!token) {
        console.warn('🔌 No hay token disponible, no se puede conectar');
        isConnectingRef.current = false;
        return;
      }

      // Si ya existe un socket, desconectarlo primero
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }

      console.log('🔌 Intentando conectar Socket.IO...', { url });

      const newSocket = io(url, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        reconnection: false // Deshabilitamos la reconexión automática de Socket.IO para manejarla nosotros
      });

      // Eventos de conexión
      newSocket.on('connect', () => {
        console.log('✅ Socket.IO conectado exitosamente');
        setIsConnected(true);
        setError(null);
        retryCountRef.current = 0; // Resetear contador de reintentos
        isConnectingRef.current = false;
      });

      newSocket.on('connect_error', async (err) => {
        console.error('❌ Error de conexión Socket.IO:', err.message);
        setIsConnected(false);
        isConnectingRef.current = false;

        // Verificar si el error es por token inválido
        const isTokenError = TOKEN_EXPIRED_REASONS.some(r =>
          err.message.includes(r) || err.message.toLowerCase().includes('token')
        );

        if (isTokenError && shouldReconnectRef.current) {
          console.log('🔄 Token expirado, intentando renovar y reconectar...');
          // Notificar al contexto que el token expiró
          if (onTokenExpiredRef.current) {
            onTokenExpiredRef.current();
          }
          // Intentar reconectar con token renovado después de un breve delay
          setTimeout(() => {
            if (shouldReconnectRef.current) {
              connectSocket(); // Reconectar (el contexto renovará el token si es necesario)
            }
          }, 1000);
        } else if (shouldReconnectRef.current) {
          // Error temporal, intentar reconectar en 2 segundos
          const delay = 2000;
          console.log(`🔄 Reintentando conexión en 2 segundos (intento ${retryCountRef.current + 1})...`);

          retryCountRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldReconnectRef.current) {
              connectSocket();
            }
          }, delay);
        } else {
          setError(err.message);
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Socket.IO desconectado:', reason);
        setIsConnected(false);
        isConnectingRef.current = false;

        // Verificar si debe reconectarse
        if (shouldReconnect(reason)) {
          const isTokenExpired = TOKEN_EXPIRED_REASONS.some(r => reason.includes(r));

          if (isTokenExpired) {
            console.log('🔄 Desconexión por token expirado, renovando token y reconectando...');
            // Notificar al contexto que el token expiró
            if (onTokenExpiredRef.current) {
              onTokenExpiredRef.current();
            }
            // Renovar token y reconectar
            setTimeout(() => {
              if (shouldReconnectRef.current) {
                connectSocket(); // Reconectar (el contexto renovará el token si es necesario)
              }
            }, 1000);
          } else {
            // Desconexión temporal, reconectar en 2 segundos
            const delay = 2000;
            console.log(`🔄 Reintentando conexión en 2 segundos (intento ${retryCountRef.current + 1})...`);

            retryCountRef.current++;
            reconnectTimeoutRef.current = setTimeout(() => {
              if (shouldReconnectRef.current) {
                connectSocket();
              }
            }, delay);
          }
        } else {
          console.log('🔌 Desconexión permanente, no se reconectará:', reason);
          setError(`Desconectado: ${reason}`);
        }
      });

      setSocket(newSocket);

    } catch (error) {
      console.error('❌ Error al conectar Socket.IO:', error);
      setError('Error de autenticación');
      setIsConnected(false);
      isConnectingRef.current = false;

      // Reintentar si es un error recuperable
      if (shouldReconnectRef.current) {
        const delay = 2000;
        console.log(`🔄 Reintentando conexión en 2 segundos (intento ${retryCountRef.current + 1})...`);
        retryCountRef.current++;
        reconnectTimeoutRef.current = setTimeout(() => {
          if (shouldReconnectRef.current) {
            connectSocket();
          }
        }, delay);
      }
    }
  };

  // Función manual para reconectar
  const reconnect = () => {
    if (socket && socket.connected) {
      console.log('🔌 Socket ya está conectado');
      return;
    }

    console.log('🔄 Reconexión manual solicitada');
    retryCountRef.current = 0; // Resetear contador
    connectSocket();
  };

  useEffect(() => {
    // No conectar si no hay URL
    if (!url) {
      setSocket(null);
      setIsConnected(false);
      shouldReconnectRef.current = false;
      clearReconnectTimeout();
      return;
    }

    shouldReconnectRef.current = true; // Permitir reconexión
    retryCountRef.current = 0; // Resetear contador

    // Conectar inicialmente
    connectSocket();

    // Cleanup al desmontar
    return () => {
      shouldReconnectRef.current = false;
      clearReconnectTimeout();

      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }

      setSocket(null);
      setIsConnected(false);
      isConnectingRef.current = false;
    };
  }, [url, forceRefresh]);

  return {
    socket,
    isConnected,
    error,
    reconnect
  };
};
