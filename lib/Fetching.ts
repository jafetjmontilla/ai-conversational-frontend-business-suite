import axios from 'axios';
import { getIdToken } from './firebase';

// Configuración de axios para la API
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adjuntar el token en Authorization
api.interceptors.request.use(async (config) => {
  try {
    const token = await getIdToken();
    if (token) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      } as any;
    }
  } catch {
    // sin token
  }
  return config;
});

// Tipos para las respuestas
export interface Routine {
  id: string;
  name: string;
  description: string;
  duration: number;
  category: string;
  createdAt: string;
}

// Removed wellness stats related to routines/progress

// Función para hacer consultas GraphQL
const graphqlQuery = async (query: string, variables?: any) => {
  try {
    const response = await api.post('/graphql', {
      query,
      variables,
    });
    return response.data.data;
  } catch (error) {
    console.error('GraphQL Query Error:', error);
    throw error;
  }
};

export const graphqlMutation = async (mutation: string, variables?: any) => {
  try {
    const response = await api.post('/graphql', {
      query: mutation,
      variables,
    });
    return response.data.data;
  } catch (error) {
    console.error('GraphQL Mutation Error:', error);
    throw error;
  }
};

// Verificar salud de la API
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health');
    return response.status === 200;
  } catch (error) {
    return false;
  }
}; 