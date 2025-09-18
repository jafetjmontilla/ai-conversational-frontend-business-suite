import axios, { AxiosResponse } from 'axios';
import { getIdToken } from './firebase';

const instanceApiV1 = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000',
  headers: {
    'Content-Type': 'application/json',
  },
});

const instanceApiJaihomV1 = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_JAIHOM_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adjuntar el token en Authorization
instanceApiV1.interceptors.request.use(async (config) => {
  try {
    const token = await getIdToken();
    if (token) {
      // Preservar el Content-Type existente si es FormData
      if (config.data instanceof FormData) {
        config.headers = {
          ...(config.headers || {}),
          Authorization: `Bearer ${token}`,
        } as any;
        // No establecer Content-Type para FormData, axios lo maneja automáticamente
        delete config.headers['Content-Type'];
      } else {
        config.headers = {
          ...(config.headers || {}),
          Authorization: `Bearer ${token}`,
        } as any;
      }
    }
  } catch {
    // sin token
  }
  return config;
});

// Interceptor para adjuntar el token en Authorization para Jaihom
instanceApiJaihomV1.interceptors.request.use(async (config) => {
  try {
    const token = await getIdToken();
    if (token) {
      // Preservar el Content-Type existente si es FormData
      if (config.data instanceof FormData) {
        config.headers = {
          ...(config.headers || {}),
          Authorization: `Bearer ${token}`,
        } as any;
        // No establecer Content-Type para FormData, axios lo maneja automáticamente
        delete config.headers['Content-Type'];
      } else {
        config.headers = {
          ...(config.headers || {}),
          Authorization: `Bearer ${token}`,
        } as any;
      }
    }
  } catch {
    // sin token
  }
  return config;
});

export type Fetching = {
  graphql: CallableFunction
}

// Verificar salud de la API
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await instanceApiV1.get('/health');
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

export const apiV1: Fetching = {
  graphql: async (data: object): Promise<AxiosResponse> => {
    return await instanceApiV1.post("/graphql", data, {})
  },
}

export const apiJaihomV1: Fetching = {
  graphql: async (data: object): Promise<AxiosResponse> => {
    // Para FormData, no establecer Content-Type para que axios lo maneje automáticamente
    const config = data instanceof FormData ? {} : {};
    return await instanceApiJaihomV1.post("/graphql", data, config)
  },
}
