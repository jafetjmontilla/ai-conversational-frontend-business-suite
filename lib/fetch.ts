import api from './api';

// Tipos para las respuestas
export interface Rutina {
  id: string;
  nombre: string;
  descripcion: string;
  duracion: number;
  categoria: string;
  fechaCreacion: string;
}

export interface EstadisticasBienestar {
  totalRutinasCompletadas: number;
  tiempoTotalDedicado: number;
  rutinasEstaSemana: number;
  categoriaFavorita: string;
  promedioTiempoPorRutina: number;
}

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

// Obtener todas las rutinas
export const getRutinas = async (): Promise<Rutina[]> => {
  const query = `
    query {
      rutinas {
        id
        nombre
        descripcion
        duracion
        categoria
        fechaCreacion
      }
    }
  `;

  const data = await graphqlQuery(query);
  return data.rutinas;
};

// Obtener estadísticas de bienestar
export const getEstadisticasBienestar = async (usuarioId: string): Promise<EstadisticasBienestar> => {
  const query = `
    query GetEstadisticas($usuarioId: ID!) {
      estadisticasBienestar(usuarioId: $usuarioId) {
        totalRutinasCompletadas
        tiempoTotalDedicado
        rutinasEstaSemana
        categoriaFavorita
        promedioTiempoPorRutina
      }
    }
  `;

  const data = await graphqlQuery(query, { usuarioId });
  return data.estadisticasBienestar;
};

// Crear nueva rutina
export const crearRutina = async (input: {
  nombre: string;
  descripcion: string;
  duracion: number;
  categoria: string;
  usuarioId: string;
}): Promise<Rutina> => {
  const query = `
    mutation CrearRutina($input: CrearRutinaInput!) {
      crearRutina(input: $input) {
        id
        nombre
        descripcion
        duracion
        categoria
        fechaCreacion
      }
    }
  `;

  const data = await graphqlQuery(query, { input });
  return data.crearRutina;
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