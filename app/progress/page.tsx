'use client';

import { useState, useEffect } from 'react';
import { Heart, Activity, Moon, Sun, TrendingUp, Calendar, Clock, Target } from 'lucide-react';
import { getEstadisticasBienestar, EstadisticasBienestar } from '../../lib/Fetching';
import { useAuth } from '../../contexts/AuthContext';
import { Navigation } from '../../components/Navigation';


export default function ProgressPage() {
  const { user, authUser, loading: authLoading } = useAuth();
  const [usuarioId] = useState('1'); // Usuario de ejemplo
  const [estadisticas, setEstadisticas] = useState<EstadisticasBienestar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('ejercicio');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const statsData = await getEstadisticasBienestar(usuarioId);
        setEstadisticas(statsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error al cargar las estadísticas');
      } finally {
        setLoading(false);
      }
    };

    // Cargar datos si el usuario está autenticado o en modo demo
    if (!authLoading) {
      fetchData();
    }
  }, [usuarioId, authLoading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wellness-50 to-primary-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Cargando progreso...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wellness-50 to-primary-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">⚠️</div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Datos de ejemplo si no hay estadísticas reales
  const demoStats = {
    totalRutinasCompletadas: 45,
    tiempoTotalDedicado: 1200,
    rutinasEstaSemana: 7,
    promedioTiempoPorRutina: 25,
    progresoSemanal: 75,
    objetivoSemanal: 10,
    diasConsecutivos: 12,
    caloriasQuemadas: 8500
  };

  const stats = (estadisticas as any) || demoStats;

  return (
    <div className="min-h-screen bg-gradient-to-br from-wellness-50 to-primary-50 dark:from-gray-900 dark:to-gray-800">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-wellness-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Tu Progreso de Bienestar
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Seguimiento de tu evolución y logros
              </p>
            </div>
          </div>
        </header>

        {/* Estadísticas Principales */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Resumen General
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                {stats.totalRutinasCompletadas}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">Rutinas Completadas</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <div className="text-3xl font-bold text-wellness-600 dark:text-wellness-400 mb-2">
                {stats.tiempoTotalDedicado} min
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">Tiempo Total</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {stats.rutinasEstaSemana}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">Esta Semana</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                {Math.round(stats.promedioTiempoPorRutina)} min
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">Promedio/Rutina</div>
            </div>
          </div>
        </section>

        {/* Progreso Detallado */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Progreso Detallado
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Progreso Semanal */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Progreso Semanal
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Rutinas completadas</span>
                    <span>{stats.rutinasEstaSemana} / {stats.objetivoSemanal}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(stats.rutinasEstaSemana / stats.objetivoSemanal) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600 dark:text-gray-400">Objetivo: {stats.objetivoSemanal}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600 dark:text-gray-400">{stats.diasConsecutivos} días consecutivos</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Calorías Quemadas */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-4">
                <Activity className="w-5 h-5 text-wellness-600 dark:text-wellness-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Calorías Quemadas
                </h3>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-wellness-600 dark:text-wellness-400 mb-2">
                  {(stats.caloriasQuemadas || 0).toLocaleString()}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  Calorías totales quemadas
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categorías de Bienestar */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Progreso por Categoría
          </h2>
          <div className="w-full">
            <div className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('ejercicio')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'ejercicio'
                  ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
              >
                <Activity className="h-4 w-4" />
                Ejercicio
              </button>
              <button
                onClick={() => setActiveTab('meditacion')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'meditacion'
                  ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
              >
                <Heart className="h-4 w-4" />
                Meditación
              </button>
              <button
                onClick={() => setActiveTab('nutricion')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'nutricion'
                  ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
              >
                <Sun className="h-4 w-4" />
                Nutrición
              </button>
              <button
                onClick={() => setActiveTab('sueno')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'sueno'
                  ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
              >
                <Moon className="h-4 w-4" />
                Sueño
              </button>
            </div>

            <div className="mt-6">
              {activeTab === 'ejercicio' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Progreso de Ejercicio</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>Rutinas de cardio</span>
                        <span>15 / 20</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>Rutinas de fuerza</span>
                        <span>12 / 15</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: '80%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>Flexibilidad</span>
                        <span>8 / 10</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: '80%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'meditacion' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Progreso de Meditación</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>Sesiones completadas</span>
                        <span>18 / 25</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: '72%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>Minutos totales</span>
                        <span>540 / 750</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: '72%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'nutricion' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Progreso de Nutrición</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>Días saludables</span>
                        <span>22 / 30</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: '73%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>Hidratación</span>
                        <span>28 / 30</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: '93%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'sueno' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Progreso del Sueño</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>Horas de sueño</span>
                        <span>7.5 / 8</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: '94%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>Calidad del sueño</span>
                        <span>85%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Acciones */}
        <section className="text-center">
          <div className="space-y-4">
            <button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">
              Ver Rutinas Disponibles
            </button>
            <div>
              <button className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-8 py-3 rounded-lg font-medium transition-colors">
                Exportar Reporte
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
} 