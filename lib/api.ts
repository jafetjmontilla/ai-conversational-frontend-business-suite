// Tipos para las respuestas de la API
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface CustomClaimsData {
  uid: string;
  email: string | null;
  customClaims: any;
  role: string;
  plan: string;
}

// Configuración de la API (REST legacy) y GraphQL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000';
import { graphqlMutation } from './Fetching';

// Función para hacer llamadas a la API
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, defaultOptions);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Error en la petición',
        error: data.error
      };
    }

    return {
      success: true,
      message: data.message || 'Operación exitosa',
      data: data.data
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Error de conexión con el servidor',
      error: error.message
    };
  }
}

// Función para asignar custom claims a un usuario
export const assignCustomClaims = async (
  uid: string,
  role: string = 'client',
  plan: string = 'free'
): Promise<ApiResponse<CustomClaimsData>> => {
  const mutation = `
    mutation AssignCustomClaims($args: AssignCustomClaimsInput!) {
      assignCustomClaims(args: $args) {
        success
        message
        data {
          uid
          email
          role
          plan
          assignedAt
        }
      }
    }
  `;

  try {
    const data = await graphqlMutation(mutation, { args: { uid, role, plan } });
    const res = data.assignCustomClaims;
    return {
      success: res.success,
      message: res.message,
      data: res.data
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Error de conexión con el servidor',
      error: error.message
    } as any;
  }
};

// Función para obtener información de custom claims de un usuario
export const getCustomClaims = async (uid: string): Promise<ApiResponse<CustomClaimsData>> => {
  const query = `
    query CustomClaims($uid: ID!) {
      customClaims(uid: $uid) {
        success
        message
        data {
          uid
          email
          role
          plan
          assignedAt
        }
      }
    }
  `;

  try {
    const data = await graphqlMutation(query, { uid });
    const res = data.customClaims;
    return {
      success: res.success,
      message: res.message,
      data: res.data
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Error de conexión con el servidor',
      error: error.message
    } as any;
  }
};