import axios from 'axios';

const WHATSAPP_API_URL = process.env.NEXT_PUBLIC_WHATSAPP_API_URL || 'http://localhost:2001';

// Función para enviar mensaje por WhatsApp usando la API existente
export const sendWhatsAppMessage = async (sessionId: string, phoneNumber: string, message: string) => {
  try {
    const response = await axios.post(`${WHATSAPP_API_URL}/graphql`, {
      query: `
        mutation SendMessage($args: SendMessageArgs!) {
          sendMessage(args: $args) {
            success
            messageId
            error
          }
        }
      `,
      variables: {
        args: {
          sessionId,
          to: phoneNumber,
          message,
          type: 'text'
        }
      }
    });

    return response.data.data.sendMessage;
  } catch (error) {
    console.error('Error enviando mensaje por WhatsApp:', error);
    throw error;
  }
};

// Función para obtener sesiones activas de WhatsApp
export const getWhatsAppSessions = async () => {
  try {
    const response = await axios.post(`${WHATSAPP_API_URL}/graphql`, {
      query: `
        query GetAllSessions {
          getAllSessions {
            id
            isConnected
            phoneNumber
            lastActivity
          }
        }
      `
    });

    return response.data.data.getAllSessions;
  } catch (error) {
    console.error('Error obteniendo sesiones de WhatsApp:', error);
    throw error;
  }
};

// Función para crear sesión de WhatsApp si no existe
export const createWhatsAppSession = async (sessionId: string = 'default') => {
  try {
    const response = await axios.post(`${WHATSAPP_API_URL}/graphql`, {
      query: `
        mutation CreateSession($args: CreateSessionArgs!) {
          createSession(args: $args) {
            success
            session {
              id
              isConnected
              qrCode
            }
            error
          }
        }
      `,
      variables: {
        args: {
          sessionId,
          development: 'sistemasJaihom',
          userId: 'admin'
        }
      }
    });

    return response.data.data.createSession;
  } catch (error) {
    console.error('Error creando sesión de WhatsApp:', error);
    throw error;
  }
};
