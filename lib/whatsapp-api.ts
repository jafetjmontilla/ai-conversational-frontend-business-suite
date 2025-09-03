import axios, { AxiosResponse } from 'axios';
import { io, Socket } from 'socket.io-client';

// Configuración de la API de WhatsApp
const WHATSAPP_API_URL = process.env.NEXT_PUBLIC_WHATSAPP_API_URL || 'http://localhost:2001';
const DEVELOPMENT_ID = process.env.NEXT_PUBLIC_DEVELOPMENT_ID || '4net';

// Cliente axios para la API de WhatsApp
const whatsappApiClient = axios.create({
  baseURL: WHATSAPP_API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Tipos para TypeScript
export interface WhatsAppSession {
  id: string;
  development: string;
  userId?: string;
  isConnected: boolean;
  qrCode?: string;
  phoneNumber?: string;
  connectionTime?: string;
  lastActivity?: string;
}

export interface CreateSessionResponse {
  success: boolean;
  session?: WhatsAppSession;
  qrCode?: string;
  error?: string;
}

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SessionEventData {
  sessionId: string;
  event: 'connected' | 'disconnected' | 'qr_generated' | 'qr_expired' | 'error';
  data?: any;
  timestamp: string;
}

export interface WebSocketConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastPing?: Date;
}

// Clase para manejar la API de WhatsApp
class WhatsAppApiService {

  // Función genérica para hacer consultas GraphQL
  private async graphqlQuery<T>(query: string, variables?: any): Promise<T> {
    try {
      const response: AxiosResponse = await whatsappApiClient.post('/graphql', {
        query,
        variables
      });

      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error en consulta GraphQL:', error);
      throw error;
    }
  }

  // Crear sesión de WhatsApp
  async createSession({ sessionId, phoneNumber }: { sessionId: string, phoneNumber?: string }): Promise<CreateSessionResponse> {
    const query = `
      mutation CreateSession($args: CreateSessionArgs!) {
        createSession(args: $args) {
          success
          session {
            id
            development
            isConnected
            qrCode
            phoneNumber
            connectionTime
            lastActivity
          }
          qrCode
          error
        }
      }
    `;

    const variables = {
      args: { sessionId, phoneNumber, development: DEVELOPMENT_ID }
    };

    const result = await this.graphqlQuery<{ createSession: CreateSessionResponse }>(query, variables);
    return result.createSession;
  }

  // Obtener información de una sesión
  async getSession(sessionId: string): Promise<WhatsAppSession | null> {
    const query = `
      query GetSession($args: GetSessionArgs!) {
        getSession(args: $args) {
          id
          development
          userId
          isConnected
          qrCode
          phoneNumber
          connectionTime
          lastActivity
        }
      }
    `;

    const variables = {
      args: { sessionId }
    };

    const result = await this.graphqlQuery<{ getSession: WhatsAppSession | null }>(query, variables);
    return result.getSession;
  }

  // Obtener sesiones por desarrollo
  async getSessionsByDevelopment(): Promise<WhatsAppSession[]> {
    const query = `
      query GetSessionsByDevelopment($args: GetSessionsByDevelopmentArgs!) {
        getSessionsByDevelopment(args: $args) {
          id
          development
          userId
          isConnected
          qrCode
          phoneNumber
          connectionTime
          lastActivity
        }
      }
    `;

    const variables = {
      args: { development: DEVELOPMENT_ID }
    };

    const result = await this.graphqlQuery<{ getSessionsByDevelopment: WhatsAppSession[] }>(query, variables);
    return result.getSessionsByDevelopment;
  }

  // Enviar mensaje
  async sendMessage(sessionId: string, to: string, message: string): Promise<SendMessageResponse> {
    const query = `
      mutation SendMessage($args: SendMessageArgs!) {
        sendMessage(args: $args) {
          success
          messageId
          error
        }
      }
    `;

    const variables = {
      args: { sessionId, to, message, type: 'text' }
    };

    const result = await this.graphqlQuery<{ sendMessage: SendMessageResponse }>(query, variables);
    return result.sendMessage;
  }

  // Desconectar sesión
  async disconnectSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    const query = `
      mutation DisconnectSession($args: DisconnectSessionArgs!) {
        disconnectSession(args: $args) {
          success
          error
        }
      }
    `;

    const variables = {
      args: { sessionId }
    };

    const result = await this.graphqlQuery<{ disconnectSession: { success: boolean; error?: string } }>(query, variables);
    return result.disconnectSession;
  }

  // Regenerar QR
  async regenerateQR(sessionId: string): Promise<CreateSessionResponse> {
    const query = `
      mutation RegenerateQR($sessionId: String!) {
        regenerateQR(sessionId: $sessionId) {
          success
          session {
            id
            development
            userId
            isConnected
            qrCode
          }
          qrCode
          error
        }
      }
    `;

    const variables = { sessionId };

    const result = await this.graphqlQuery<{ regenerateQR: CreateSessionResponse }>(query, variables);
    return result.regenerateQR;
  }

  // Obtener QR usando REST endpoint (alternativa)
  async getQRCode(sessionId: string): Promise<{ qrCode?: string; isConnected: boolean }> {
    try {
      const response = await whatsappApiClient.get(`/sessions/${sessionId}/qr`);
      return {
        qrCode: response.data.qrCode,
        isConnected: response.data.isConnected
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { isConnected: false };
      }
      throw error;
    }
  }

  // Verificar salud de la API
  async healthCheck(): Promise<boolean> {
    try {
      const response = await whatsappApiClient.get('/health');
      return response.data.status === 'OK';
    } catch (error) {
      return false;
    }
  }
}

// Clase para manejar WebSocket de WhatsApp
export class WhatsAppWebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor(private development: string = DEVELOPMENT_ID, private userId?: string, private token?: string) { }

  // Conectar al servidor WebSocket
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(WHATSAPP_API_URL, {
        path: '/ws',
        transports: ['websocket', 'polling'],
        timeout: 10000,
        autoConnect: true
      });

      this.setupEventHandlers();

      this.socket.on('connect', () => {
        console.log('🔌 Conectado al WebSocket de WhatsApp');
        this.reconnectAttempts = 0;

        // Autenticar si tenemos credenciales
        if (this.development || this.userId || this.token) {
          this.authenticate(this.development, this.userId, this.token);
        }

        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Error conectando WebSocket:', error);
        reject(error);
      });
    });
  }

  // Configurar manejadores de eventos
  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connected', (data) => {
      console.log('✅ WebSocket conectado:', data);
      this.emit('connection_established', data);
    });

    this.socket.on('authenticated', (data) => {
      console.log('🔐 Autenticación:', data);
      this.emit('authenticated', data);
    });

    this.socket.on('session_event', (data: SessionEventData) => {
      console.log('📱 Evento de sesión:', data);
      this.emit('session_event', data);
      this.emit(`session_${data.event}`, data);
    });

    this.socket.on('session_state', (data) => {
      console.log('📊 Estado de sesión:', data);
      this.emit('session_state', data);
    });

    this.socket.on('global_event', (data) => {
      console.log('🌐 Evento global:', data);
      this.emit('global_event', data);
    });

    this.socket.on('subscription_confirmed', (data) => {
      console.log('✅ Suscripción confirmada:', data);
      this.emit('subscription_confirmed', data);
    });

    this.socket.on('subscription_error', (data) => {
      console.error('❌ Error de suscripción:', data);
      this.emit('subscription_error', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('🔌 WebSocket desconectado:', reason);
      this.emit('disconnected', { reason });
      this.handleReconnection();
    });

    this.socket.on('pong', (data) => {
      this.emit('pong', data);
    });
  }

  // Autenticar con el servidor
  authenticate(development?: string, userId?: string, token?: string) {
    if (!this.socket?.connected) return;

    this.socket.emit('authenticate', { development, userId, token });
  }

  // Suscribirse a eventos de una sesión específica
  subscribeToSession(sessionId: string) {
    if (!this.socket?.connected) return;

    this.socket.emit('subscribe_session', sessionId);
    console.log(`👂 Suscrito a eventos de sesión: ${sessionId}`);
  }

  // Desuscribirse de eventos de una sesión
  unsubscribeFromSession(sessionId: string) {
    if (!this.socket?.connected) return;

    this.socket.emit('unsubscribe_session', sessionId);
    console.log(`👋 Desuscrito de eventos de sesión: ${sessionId}`);
  }

  // Suscribirse a eventos globales
  subscribeToGlobalEvents() {
    if (!this.socket?.connected) return;

    this.socket.emit('subscribe_global');
    console.log('👂 Suscrito a eventos globales');
  }

  // Ping al servidor
  ping() {
    if (!this.socket?.connected) return;

    this.socket.emit('ping');
  }

  // Desconectar
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Sistema de eventos personalizado
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback?: Function) {
    if (!this.eventListeners.has(event)) return;

    if (callback) {
      this.eventListeners.get(event)!.delete(callback);
    } else {
      this.eventListeners.get(event)!.clear();
    }
  }

  private emit(event: string, data: any) {
    if (!this.eventListeners.has(event)) return;

    this.eventListeners.get(event)!.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error en callback de evento ${event}:`, error);
      }
    });
  }

  // Manejo de reconexión
  private handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Máximo de intentos de reconexión alcanzado');
      this.emit('max_reconnects_reached', {});
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`🔄 Reintentando conexión en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Error en reconexión:', error);
      });
    }, delay);
  }

  // Getters
  get connected(): boolean {
    return this.socket?.connected || false;
  }

  get connecting(): boolean {
    return this.socket?.connected === false && this.socket?.disconnected === false;
  }
}

// Crear instancia singleton del servicio
export const whatsappApiService = new WhatsAppApiService();

// Métodos de conveniencia que usan el desarrollo actual
export const createSession = ({ sessionId, phoneNumber }: { sessionId: string, phoneNumber?: string }) =>
  whatsappApiService.createSession({ sessionId, phoneNumber });

export const getSessionsByDevelopment = () =>
  whatsappApiService.getSessionsByDevelopment();

// Exportar para uso directo
export default whatsappApiService;
