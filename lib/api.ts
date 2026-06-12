import axios, { AxiosResponse } from 'axios';
import { getIdToken } from './firebase';

const instanceApiV1 = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000',
  headers: {},
});

const instanceApiV1FormData = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000',
  headers: {
    'Content-Type': 'multipart/form-data',
    'apollo-require-preflight': 'true',
  },
});

// Misma API (Api Business Suite); se mantiene instancia separada por compatibilidad
const instanceApiJaihomV1 = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000',
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

    // Manejar FormData de manera especial
    if (config.data instanceof FormData) {
      // NO leer el FormData aquí porque lo consume y queda vacío
      // Solo configurar los headers necesarios
      if (!config.headers) {
        config.headers = {} as any;
      }

      // Agregar headers necesarios
      config.headers['apollo-require-preflight'] = 'true';
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }

      // Asegurar que no haya Content-Type establecido (axios lo establecerá automáticamente)
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];

      return config;
    }

    // Para requests JSON normales
    if (token) {
      config.headers = {
        ...(config.headers || {}),
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      } as any;
    }
  } catch (error) {
    console.error('Error en interceptor:', error);
    // Si hay error obteniendo token pero es FormData, agregar header CSRF
    if (config.data instanceof FormData) {
      config.headers = {
        'apollo-require-preflight': 'true',
      } as any;
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
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

/** Respuesta de auditoría Knowledge-RAG (config vs contenido indexado) */
export type KnowledgeAuditResponse = {
  businessId: string;
  configSources: { sourceId: string; name?: string; roles: string[] }[];
  documentsBySource: {
    sourceId: string;
    name: string;
    documentCount: number;
    documents: {
      documentId?: string;
      contentLength: number;
      contentPreview: string;
      metadata?: Record<string, unknown>;
    }[];
  }[];
  summary: {
    totalDocuments: number;
    totalConfigSources: number;
    sourcesWithDocuments: number;
    sourcesWithoutDocuments: string[];
    orphanSources: string[];
  };
  debugSearch?: {
    query: string;
    min_score?: number | null;
    results: {
      documentId: string;
      content: string;
      score: number;
      sourceId: string;
      metadata?: Record<string, unknown>;
    }[];
    note?: string;
  };
};

export type KnowledgeAuditOptions = {
  query?: string;
  minScore?: number;
};

/** GET /api/knowledge/audit?businessId=xxx[&query=...&min_score=0.7] — requiere autenticación */
export const fetchKnowledgeAudit = async (
  businessId: string,
  options?: KnowledgeAuditOptions
): Promise<KnowledgeAuditResponse> => {
  const token = await getIdToken();
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000';
  const params = new URLSearchParams({ businessId });
  const query = options?.query?.trim();
  if (query) {
    params.set('query', query);
    if (options.minScore != null) {
      params.set('min_score', String(options.minScore));
    }
  }
  const url = `${baseURL}/api/knowledge/audit?${params.toString()}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Error ${res.status} al obtener auditoría`);
  }
  return res.json();
};

// Función específica para enviar FormData usando fetch nativo
// fetch maneja FormData de manera más directa que axios en el navegador
const sendFormDataGraphQL = async (formData: FormData): Promise<AxiosResponse> => {
  try {
    const token = await getIdToken();
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000';
    const url = `${baseURL}/graphql`;

    // Crear headers manualmente
    const headers: HeadersInit = {
      'apollo-require-preflight': 'true',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Usar fetch nativo que maneja FormData mejor que axios
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData, // fetch maneja FormData automáticamente - NO establecer Content-Type
    });

    // Verificar que la respuesta sea exitosa
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    // Convertir la respuesta de fetch a formato compatible con axios
    const data = await response.json();

    // Crear un objeto compatible con AxiosResponse
    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as any,
      config: {} as any,
    } as AxiosResponse;
  } catch (error: any) {
    // Si falla obtener token, intentar sin token pero con CSRF header
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000';
    const url = `${baseURL}/graphql`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apollo-require-preflight': 'true',
      },
      body: formData,
    });

    // Verificar que la respuesta sea exitosa
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as any,
      config: {} as any,
    } as AxiosResponse;
  }
};

export const apiV1: Fetching = {
  graphql: async (data: object): Promise<AxiosResponse> => {
    // Si es FormData, usar función específica sin interceptors
    if (data instanceof FormData) {
      return await sendFormDataGraphQL(data);
    }
    // Para JSON normal, usar la instancia con interceptor
    return await instanceApiV1.post("/graphql", data, {});
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

// Función de prueba básica con fetch sin autenticación
export const testFileUpload = async (file: File, category?: string, description?: string, tags?: string[]) => {
  try {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000';
    const url = `${baseURL}/graphql`;

    // Crear FormData
    const formData = new FormData();

    // Construir las operaciones GraphQL
    const operations = {
      query: `mutation uploadFile($file: Upload!, $args: StorageInput) {
        uploadFile(file: $file, args: $args) {
          _id
          filename
          originalName
          mimeType
          size
          path
          url
          uploadedBy
          category
          description
          tags
          createdAt
          updatedAt
        }
      }`,
      variables: {
        file: null, // Se reemplazará en el map
        args: {
          category: category || undefined,
          description: description || undefined,
          tags: tags || undefined,
        }
      }
    };

    // Crear el map para el archivo
    const map = {
      "0": ["variables.file"]
    };

    // Agregar al FormData
    formData.append("operations", JSON.stringify(operations));
    formData.append("map", JSON.stringify(map));
    formData.append("0", file);

    console.log('=== Test Upload Debug ===');
    console.log('URL:', url);
    console.log('Base URL:', baseURL);
    console.log('File name:', file.name);
    console.log('File size:', file.size);
    console.log('File type:', file.type);
    console.log('Operations:', JSON.stringify(operations, null, 2));
    console.log('Map:', JSON.stringify(map, null, 2));

    // NO leer FormData aquí porque lo consume y queda vacío
    // Solo loggear información que no requiere leer el FormData
    console.log('FormData creado correctamente');
    console.log('FormData tiene file:', file ? 'Sí' : 'No');
    console.log('========================');

    // Hacer el fetch sin autenticación
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'apollo-require-preflight': 'true',
          // NO incluir Authorization header
          // NO establecer Content-Type - fetch lo hará automáticamente con boundary
        },
        body: formData,
      });
    } catch (fetchError: any) {
      console.error('Error en fetch:', fetchError);
      console.error('Error name:', fetchError?.name);
      console.error('Error message:', fetchError?.message);
      console.error('Error stack:', fetchError?.stack);

      // Proporcionar más información sobre el error
      const errorMessage = fetchError?.message || 'Error desconocido';
      const isNetworkError = errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('Network request failed');

      if (isNetworkError) {
        throw new Error(
          `Error de red al conectar con ${url}. ` +
          `Posibles causas: CORS bloqueado, servidor no disponible, o URL incorrecta. ` +
          `Verifica que el servidor esté corriendo y que CORS esté configurado correctamente. ` +
          `Error original: ${errorMessage}`
        );
      }

      throw new Error(`Error al hacer fetch: ${errorMessage}`);
    }

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = `No se pudo leer el cuerpo de la respuesta. Status: ${response.status}`;
      }
      console.error('Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    let data;
    try {
      data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
    } catch (jsonError: any) {
      const text = await response.text();
      console.error('Error al parsear JSON:', jsonError);
      console.error('Response text:', text);
      throw new Error(`Error al parsear respuesta JSON: ${jsonError.message}. Respuesta: ${text.substring(0, 200)}`);
    }

    return data;
  } catch (error: any) {
    console.error('Error completo en testFileUpload:', error);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    throw error;
  }
};