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
  'transport error', // Error de transporte
  'websocket error', // Fallo de upgrade tras proxy/CDN; polling suele funcionar
];

// Errores de connect_error recuperables (proxy, red, polling, etc.)
const RECOVERABLE_CONNECT_ERROR_PATTERNS = [
  'websocket error',
  'xhr poll error',
  'transport',
  'timeout',
  'network',
  'econnrefused',
  'enotfound',
  'etimedout',
  'socket hang up',
];

const MAX_RETRIES = 15;

const isRecoverableConnectError = (message: string): boolean =>
  RECOVERABLE_CONNECT_ERROR_PATTERNS.some((pattern) =>
    message.toLowerCase().includes(pattern)
  );

const isTokenConnectError = (message: string): boolean =>
  TOKEN_EXPIRED_REASONS.some((reason) => message.includes(reason)) ||
  message.toLowerCase().includes('token');

export const useWebSocket = (
  url: string,
  getToken: () => Promise<string | null>,
  _forceRefresh: boolean = false,
  options: UseWebSocketOptions = {}
): WebSocketHook => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
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

  const teardownSocket = (target?: Socket | null) => {
    const sock = target ?? socketRef.current;
    if (!sock) return;

    sock.removeAllListeners();
    sock.disconnect();

    if (socketRef.current === sock) {
      socketRef.current = null;
    }
  };

  const scheduleReconnect = (delayMs: number, resetRetries = false) => {
    if (!shouldReconnectRef.current) return;

    if (retryCountRef.current >= MAX_RETRIES) {
      console.error('❌ Socket.IO: máximo de reintentos alcanzado');
      setError('No se pudo conectar al servidor en tiempo real');
      return;
    }

    if (resetRetries) {
      retryCountRef.current = 0;
    }

    retryCountRef.current++;
    console.log(`🔄 Reintentando conexión en ${delayMs / 1000}s (intento ${retryCountRef.current}/${MAX_RETRIES})...`);

    reconnectTimeoutRef.current = setTimeout(() => {
      if (shouldReconnectRef.current) {
        connectSocket();
      }
    }, delayMs);
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

      // Desconectar socket previo (ref evita closure obsoleto del state)
      teardownSocket();

      console.log('🔌 Intentando conectar Socket.IO...', { url });

      const newSocket = io(url, {
        auth: {
          token: token
        },
        // Polling primero: más fiable detrás de nginx/Cloudflare; luego upgrade a websocket
        transports: ['polling', 'websocket'],
        upgrade: true,
        rememberUpgrade: true,
        reconnection: false // Deshabilitamos la reconexión automática de Socket.IO para manejarla nosotros
      });

      socketRef.current = newSocket;

      // Eventos de conexión
      newSocket.on('connect', () => {
        console.log('✅ Socket.IO conectado exitosamente');
        setIsConnected(true);
        setError(null);
        retryCountRef.current = 0; // Resetear contador de reintentos
        isConnectingRef.current = false;
      });

      newSocket.on('connect_error', (err) => {
        const recoverable = isRecoverableConnectError(err.message);
        const tokenError = isTokenConnectError(err.message);

        if (recoverable || tokenError) {
          console.warn('⚠️ Socket.IO: error de conexión, reintentando...', err.message);
        } else {
          console.error('❌ Error de conexión Socket.IO:', err.message);
        }

        setIsConnected(false);
        isConnectingRef.current = false;
        teardownSocket(newSocket);

        if (tokenError && shouldReconnectRef.current) {
          console.log('🔄 Token expirado, intentando renovar y reconectar...');
          if (onTokenExpiredRef.current) {
            onTokenExpiredRef.current();
          }
          scheduleReconnect(1000, true);
        } else if (recoverable && shouldReconnectRef.current) {
          scheduleReconnect(2000);
        } else if (shouldReconnectRef.current) {
          scheduleReconnect(2000);
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
            if (onTokenExpiredRef.current) {
              onTokenExpiredRef.current();
            }
            scheduleReconnect(1000, true);
          } else {
            scheduleReconnect(2000);
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

      if (shouldReconnectRef.current) {
        scheduleReconnect(2000);
      }
    }
  };

  // Función manual para reconectar
  const reconnect = () => {
    if (socketRef.current?.connected) {
      console.log('🔌 Socket ya está conectado');
      return;
    }

    console.log('🔄 Reconexión manual solicitada');
    retryCountRef.current = 0;
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
      teardownSocket();

      setSocket(null);
      setIsConnected(false);
      isConnectingRef.current = false;
    };
    // Solo reconectar cuando cambia la URL; forceRefresh se maneja vía ref en getToken
  }, [url]);

  return {
    socket,
    isConnected,
    error,
    reconnect
  };
};
