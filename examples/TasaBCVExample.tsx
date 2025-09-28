import React from 'react';
import { useTasaBCV } from '@/hooks/useTasaBCV';

/**
 * Ejemplo de uso del hook useTasaBCV
 * Este componente demuestra diferentes formas de usar el sistema de caché
 */
export const TasaBCVExample: React.FC = () => {
  const {
    tasaBCV,
    loading,
    error,
    refreshTasaBCV,
    loadTasaBCV
  } = useTasaBCV();

  const handleRefresh = () => {
    refreshTasaBCV();
  };

  const handleReload = () => {
    loadTasaBCV();
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Tasa BCV</h2>

      {/* Estado de carga */}
      {loading && (
        <div className="flex items-center space-x-2 text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Cargando tasa BCV...</span>
        </div>
      )}

      {/* Estado de error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Datos de la tasa */}
      {tasaBCV && (
        <div className="space-y-4">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Tasa BCV:</span>
              <span className="text-2xl font-bold">${tasaBCV.tasa.toFixed(2)}</span>
            </div>
            <div className="text-sm mt-1">
              Fecha: {new Date(tasaBCV.fecha).toLocaleDateString('es-VE')}
            </div>
          </div>

          {/* Información adicional */}
          <div className="text-sm text-gray-600">
            <p><strong>ID:</strong> {tasaBCV._id}</p>
            <p><strong>Creado:</strong> {new Date(tasaBCV.createdAt).toLocaleString('es-VE')}</p>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="mt-6 space-x-2">
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
        >
          {loading ? 'Actualizando...' : 'Actualizar Tasa'}
        </button>

        <button
          onClick={handleReload}
          disabled={loading}
          className="bg-gray-500 hover:bg-gray-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
        >
          Recargar
        </button>
      </div>

      {/* Información sobre el caché */}
      <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
        <h3 className="font-semibold mb-2">Información del Caché:</h3>
        <ul className="space-y-1 text-gray-600">
          <li>• Los datos se almacenan en localStorage</li>
          <li>• Solo se actualiza cuando cambia la fecha</li>
          <li>• Si falla la red, usa datos almacenados</li>
          <li>• La tasa se actualiza automáticamente al cargar</li>
          <li>• Query con argumentos: fecha, skip=0, limit=1</li>
        </ul>
      </div>
    </div>
  );
};

export default TasaBCVExample;
