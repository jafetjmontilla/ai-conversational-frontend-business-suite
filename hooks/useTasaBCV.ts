import { useState, useEffect } from 'react';
import { fetchApiJaihomV1 } from '../lib/Fetching';
import { TasaBCV } from '../lib/types/payment-reports';

interface TasaBCVResponse {
  getTasasBCV: TasaBCV[];
}

const TASA_BCV_STORAGE_KEY = 'tasaBCV';
const TASA_BCV_DATE_KEY = 'tasaBCVDate';

// Función utilitaria para redondear la tasa BCV hacia arriba a 2 decimales
const roundTasaBCV = (tasa: number): number => {
  const rounded = Math.ceil(tasa);
  return rounded;
};

export const useTasaBCV = () => {
  const [tasaBCV, setTasaBCV] = useState<TasaBCV | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStoredTasaBCV = (): TasaBCV | null => {
    try {
      const stored = localStorage.getItem(TASA_BCV_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const getStoredDate = (): string | null => {
    try {
      return localStorage.getItem(TASA_BCV_DATE_KEY);
    } catch {
      return null;
    }
  };

  const storeTasaBCV = (tasa: TasaBCV) => {
    try {
      localStorage.setItem(TASA_BCV_STORAGE_KEY, JSON.stringify(tasa));
      // Extraer solo la fecha (YYYY-MM-DD) de la fecha ISO
      const fecha = new Date(tasa.fecha).toISOString().split('T')[0];
      localStorage.setItem(TASA_BCV_DATE_KEY, fecha);
    } catch (error) {
      console.error('Error guardando tasa BCV en localStorage:', error);
    }
  };

  const shouldUpdateTasa = (): boolean => {
    const storedDate = getStoredDate();
    if (!storedDate) return true;

    const today = new Date().toISOString().split('T')[0];
    return storedDate !== today;
  };

  const fetchTasaBCV = async (): Promise<TasaBCV | null> => {
    try {
      setLoading(true);
      setError(null);

      // Obtener la fecha actual en formato YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];

      const query = `
        query getTasasBCV($fecha: String!, $skip: Int!, $limit: Int!) {
          getTasasBCV(fecha: $fecha, skip: $skip, limit: $limit) {
            tasa
            fecha
          }
        }
      `;

      const response = await fetchApiJaihomV1({
        query,
        type: 'json',
        variables: {
          fecha: today,
          skip: 0,
          limit: 1
        }
      });

      if (response && response.length > 0) {
        const tasaData = response[0];
        // Redondear la tasa BCV al recibirla del API
        const roundedTasaData = {
          ...tasaData,
          tasa: roundTasaBCV(tasaData.tasa)
        };
        storeTasaBCV(roundedTasaData);
        return roundedTasaData;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error obteniendo tasa BCV:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadTasaBCV = async () => {
    // Primero intentar cargar desde localStorage
    const storedTasa = getStoredTasaBCV();

    if (storedTasa && !shouldUpdateTasa()) {
      // Redondear la tasa almacenada por si hay datos antiguos sin redondear
      const roundedStoredTasa = {
        ...storedTasa,
        tasa: roundTasaBCV(storedTasa.tasa)
      };
      setTasaBCV(roundedStoredTasa);
      return;
    }

    // Si no hay datos almacenados o la fecha cambió, hacer fetch
    const freshTasa = await fetchTasaBCV();
    if (freshTasa) {
      setTasaBCV(freshTasa);
    } else if (storedTasa) {
      // Si falla el fetch pero tenemos datos almacenados, usar los almacenados (redondeados)
      const roundedStoredTasa = {
        ...storedTasa,
        tasa: roundTasaBCV(storedTasa.tasa)
      };
      setTasaBCV(roundedStoredTasa);
    }
  };

  const refreshTasaBCV = async () => {
    const freshTasa = await fetchTasaBCV();
    if (freshTasa) {
      setTasaBCV(freshTasa);
    }
  };

  useEffect(() => {
    loadTasaBCV();
  }, []);

  return {
    tasaBCV,
    loading,
    error,
    refreshTasaBCV,
    loadTasaBCV,
  };
};
