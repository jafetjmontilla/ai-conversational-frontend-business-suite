import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketHook {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
}

export const useWebSocket = (url: string, getToken: () => Promise<string | null>): WebSocketHook => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const getTokenRef = useRef(getToken);

  // Actualizar la referencia cuando cambie getToken
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(() => {
    // No conectar si no hay URL
    if (!url) {
      setSocket(null);
      return;
    }

    let isMounted = true;

    const connectSocket = async () => {
      try {
        const token = await getTokenRef.current();

        if (!token || !isMounted) {
          return;
        }

        // Crear conexión Socket.IO con token en header Authorization
        const socket = io(url, {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling']
        });

        if (!isMounted) {
          socket.disconnect();
          return;
        }

        setSocket(socket);

        // Eventos de conexión
        socket.on('connect', () => {
          if (isMounted) {
            setIsConnected(true);
            setError(null);
          }
        });

        socket.on('connect_error', (err) => {
          if (isMounted) {
            setError(err.message);
            setIsConnected(false);
          }
        });

        socket.on('disconnect', (reason) => {
          if (isMounted) {
            setIsConnected(false);
          }
        });

      } catch (error) {
        if (isMounted) {
          setError('Error de autenticación');
          setIsConnected(false);
        }
      }
    };

    connectSocket();

    // Cleanup al desmontar
    return () => {
      isMounted = false;
      setSocket(null);
    };
  }, [url]);

  return {
    socket,
    isConnected,
    error
  };
};
