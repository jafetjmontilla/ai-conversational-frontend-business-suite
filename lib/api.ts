import axios from 'axios';

// Configuración base de axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://96.126.110.203:2000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  async (config) => {
    // Obtener token de Firebase si está disponible
    if (typeof window !== 'undefined') {
      try {
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
          try {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
          } catch (error) {
            console.error('Error al obtener token:', error);
          }
        }
      } catch (error) {
        console.error('Error al importar Firebase auth:', error);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);

    // Manejar errores de autenticación
    if (error.response?.status === 401) {
      console.log('Token expirado o inválido');
      // Aquí podrías redirigir al login o refrescar el token
    }

    return Promise.reject(error);
  }
);

export default api; 