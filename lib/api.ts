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

// Función auxiliar para redimensionar imagen
const resizeImage = async (file: File, maxWidth: number = 640): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Solo redimensionar si la imagen es más grande que maxWidth
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto del canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('No se pudo convertir la imagen'));
              return;
            }

            // Crear un nuevo archivo con el blob redimensionado
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });

            console.log('Imagen redimensionada:', {
              original: { width: img.width, height: img.height, size: file.size },
              resized: { width, height, size: resizedFile.size }
            });

            resolve(resizedFile);
          },
          file.type,
          0.85 // Calidad de compresión (85%)
        );
      };

      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    reader.readAsDataURL(file);
  });
};

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
        // Si es un File, redimensionar antes de subir
        const resizedFile = await resizeImage(imageFile, 640);
        formData.append("image", resizedFile);
        console.log('Procesando File:', { name: resizedFile.name, size: resizedFile.size, type: resizedFile.type });
      }

      // Agregar parámetros de la URL
      const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY || 'c6f787e40fd29dac790a3e42d38c5078';
      const url = `/upload?expiration=${expiration}&key=${apiKey}`;

      console.log('Enviando request a:', url);
      console.log('API Key configurada:', !!apiKey);

      const response = await instanceApiImgbbV1.post(url, formData);

      console.log('Respuesta completa de ImgBB:', response);
      console.log('Respuesta data de ImgBB:', response.data);

      if (response.data && response.data.success) {
        const imgData = response.data.data;
        console.log('Data de imagen:', imgData);

        // ImgBB devuelve la estructura: response.data.data = { url, display_url, image: {...}, thumb: {...}, medium: {...}, delete_url }
        return {
          success: true,
          data: {
            image_url: imgData?.display_url || imgData?.url || '',
            medium_url: imgData?.medium?.url || imgData?.display_url || '',
            thumb_url: imgData?.thumb?.url || imgData?.display_url || '',
            delete_url: imgData?.delete_url || ''
          }
        };
      } else {
        console.error('Error en respuesta de ImgBB:', response.data);
        return {
          success: false,
          error: response.data?.error?.message || 'Error desconocido al subir imagen'
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