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

// Configuración de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000';

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
  role: string = 'Cliente',
  plan: string = 'gratuito'
): Promise<ApiResponse<CustomClaimsData>> => {
  return apiCall<CustomClaimsData>('/api/auth/assign-custom-claims', {
    method: 'POST',
    body: JSON.stringify({ uid, role, plan })
  });
};

// Función para obtener información de custom claims de un usuario
export const getCustomClaims = async (uid: string): Promise<ApiResponse<CustomClaimsData>> => {
  return apiCall<CustomClaimsData>(`/api/auth/custom-claims/${uid}`, {
    method: 'GET'
  });
}; 