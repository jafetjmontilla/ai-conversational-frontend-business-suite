'use client';

import { useState, useEffect } from 'react';
import { Heart, Activity, Moon, Sun, ChevronRight, Play, LogOut, User } from 'lucide-react';
import { getRutinas, getEstadisticasBienestar, Rutina, EstadisticasBienestar } from '../lib/Fetching';
import { useAuth } from '../contexts/AuthContext';
import { AuthContainer } from '../components/auth/AuthContainer';

export default function Home() {
  const { user, authUser, loading: authLoading, logout } = useAuth();
  const [usuarioId] = useState('1'); // Usuario de ejemplo
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasBienestar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [rutinasData, statsData] = await Promise.all([
          getRutinas(),
          getEstadisticasBienestar(usuarioId)
        ]);

        setRutinas(rutinasData);
        setEstadisticas(statsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    // Solo cargar datos si el usuario está autenticado
    if (user && !authLoading) {
      fetchData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [usuarioId, user, authLoading]);

  const categorias = [
    { nombre: 'Ejercicio', icono: Activity, color: 'bg-blue-500', descripcion: 'Rutinas de actividad física' },
    { nombre: 'Meditación', icono: Heart, color: 'bg-pink-500', descripcion: 'Prácticas de mindfulness' },
    { nombre: 'Nutrición', icono: Sun, color: 'bg-yellow-500', descripcion: 'Hábitos alimenticios saludables' },
    { nombre: 'Sueño', icono: Moon, color: 'bg-purple-500', descripcion: 'Optimización del descanso' }
  ];

  // Mostrar pantalla de autenticación si no está autenticado
  if (!authLoading && !user) {
    return <AuthContainer onAuthSuccess={() => setShowAuth(false)} />;
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wellness-50 to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando Pestilo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wellness-50 to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">⚠️</div>
          <p className="text-gray-600 text-lg">{error}</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-wellness-50 to-primary-50">
      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-wellness-500 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Pestilo</span>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-2">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {user.displayName || user.email}
                  </span>
                </div>
              )}
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>

        {/* Forma decorativa */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-primary-200 to-wellness-200 rounded-full opacity-30"></div>
          <div className="absolute -top-10 right-10 w-32 h-32 bg-gradient-to-br from-wellness-200 to-primary-200 rounded-full opacity-30"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="relative">
            {/* Imagen principal */}
            <div className="w-full h-64 bg-gradient-to-r from-primary-400 to-wellness-400 rounded-2xl mb-8 flex items-center justify-center">
              <div className="text-white text-center">
                <Heart className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold">Tu bienestar, nuestra prioridad</h2>
                <p className="text-primary-100 mt-2">Descubre rutinas personalizadas para una vida más saludable</p>
              </div>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Transforma tu vida con{' '}
            <span className="bg-gradient-to-r from-primary-600 to-wellness-600 bg-clip-text text-transparent">
              Pestilo
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Tu compañero digital para el bienestar y cuidado personal.
            Rutinas personalizadas, seguimiento de progreso y consejos expertos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center">
              <Play className="w-5 h-5 mr-2" />
              Comenzar Gratis
            </button>
            <button className="border-2 border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-3 rounded-lg font-semibold text-lg transition-colors">
              Ver Demo
            </button>
          </div>
        </section>

        {/* Estadísticas */}
        {estadisticas && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Tu Progreso de Bienestar
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                <div className="text-2xl font-bold text-primary-600">{estadisticas.totalRutinasCompletadas}</div>
                <div className="text-gray-600">Rutinas Completadas</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                <div className="text-2xl font-bold text-wellness-600">{estadisticas.tiempoTotalDedicado} min</div>
                <div className="text-gray-600">Tiempo Total</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                <div className="text-2xl font-bold text-purple-600">{estadisticas.rutinasEstaSemana}</div>
                <div className="text-gray-600">Esta Semana</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                <div className="text-2xl font-bold text-yellow-600">{Math.round(estadisticas.promedioTiempoPorRutina)} min</div>
                <div className="text-gray-600">Promedio/Rutina</div>
              </div>
            </div>
          </section>
        )}

        {/* Categorías de Bienestar */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Categorías de Bienestar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categorias.map((categoria, index) => {
              const IconComponent = categoria.icono;
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer group">
                  <div className={`w-12 h-12 ${categoria.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{categoria.nombre}</h3>
                  <p className="text-gray-600 mb-4">{categoria.descripcion}</p>
                  <div className="flex items-center text-primary-600 font-medium group-hover:text-primary-700">
                    Explorar
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Rutinas Recientes */}
        <section>
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Rutinas Recientes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rutinas.slice(0, 6).map((rutina) => (
              <div key={rutina.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${rutina.categoria === 'ejercicio' ? 'bg-blue-100 text-blue-800' :
                    rutina.categoria === 'meditacion' ? 'bg-pink-100 text-pink-800' :
                      rutina.categoria === 'nutricion' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-purple-100 text-purple-800'
                    }`}>
                    {rutina.categoria}
                  </span>
                  <span className="text-sm text-gray-500">{rutina.duracion} min</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{rutina.nombre}</h3>
                <p className="text-gray-600 mb-4">{rutina.descripcion}</p>
                <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center">
                  <Play className="w-4 h-4 mr-2" />
                  Comenzar
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-wellness-500 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Pestilo</span>
          </div>
          <p className="text-gray-400 mb-4">
            Transformando vidas a través del bienestar digital
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Contacto</a>
            <a href="#" className="hover:text-white transition-colors">Soporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
} 