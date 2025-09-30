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

const instanceApiImgbbV1 = axios.create({
  baseURL: 'https://api.imgbb.com/1',
  // No establecer Content-Type aquí, axios lo manejará automáticamente para FormData
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

export const apiImgbbV1 = {
  upload: async (imageFile: File | string, expiration: number = 15552000): Promise<{
    success: boolean;
    data?: {
      image_url: string;
      medium_url: string;
      thumb_url: string;
      delete_url: string;
    };
    error?: string;
  }> => {
    try {
      console.log('Iniciando subida de imagen...', { imageFile: typeof imageFile, expiration });

      const formData = new FormData();

      // Si es un string (base64), extraer la parte después de "base64,"
      if (typeof imageFile === 'string') {
        const base64Data = imageFile.split("base64,")[1];
        formData.append("image", base64Data);
        console.log('Procesando base64, longitud:', base64Data.length);
      } else {
        // Si es un File, agregarlo directamente
        formData.append("image", imageFile);
        console.log('Procesando File:', { name: imageFile.name, size: imageFile.size, type: imageFile.type });
      }

      // Agregar parámetros de la URL
      const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY || 'c6f787e40fd29dac790a3e42d38c5078';
      const url = `/upload?expiration=${expiration}&key=${apiKey}`;

      console.log('Enviando request a:', url);
      console.log('API Key configurada:', !!apiKey);

      const response = await instanceApiImgbbV1.post(url, formData);

      console.log('Respuesta de ImgBB:', response.data);

      if (response.data.success) {
        return {
          success: true,
          data: {
            image_url: response.data.data.image.url,
            medium_url: response.data.data.medium.url,
            thumb_url: response.data.data.thumb.url,
            delete_url: response.data.data.delete_url
          }
        };
      } else {
        console.error('Error en respuesta de ImgBB:', response.data);
        return {
          success: false,
          error: response.data.error?.message || 'Error desconocido al subir imagen'
        };
      }
    } catch (error: any) {
      console.error('Error completo al subir imagen:', error);
      console.error('Error response:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || 'Error al subir imagen'
      };
    }
  }
}