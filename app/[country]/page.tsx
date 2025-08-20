'use client';

import { useState, useEffect } from 'react';
import { Heart, Activity, Moon, Sun, ChevronRight, Play, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';

export default function Home() {
  const { authUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [])

  const categorias = [
    { nombre: 'Ejercicio', icono: Activity, color: 'bg-blue-500', descripcion: 'Rutinas de actividad física' },
    { nombre: 'Meditación', icono: Heart, color: 'bg-pink-500', descripcion: 'Prácticas de mindfulness' },
    { nombre: 'Nutrición', icono: Sun, color: 'bg-yellow-500', descripcion: 'Hábitos alimenticios saludables' },
    { nombre: 'Sueño', icono: Moon, color: 'bg-purple-500', descripcion: 'Optimización del descanso' }
  ];

  return (
    <div className="min-h-screen bg-sidebar-primary">
      <Navigation />
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-wellness-500 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Pestilo</span>
            </div>
            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                <User className="w-5 h-5" />
                <span className="font-medium">{authUser?.displayName || authUser?.email || 'Usuario'}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </header>
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
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Transforma tu vida con{' '}
            <span className="bg-gradient-to-r from-primary-600 to-wellness-600 bg-clip-text text-transparent">
              Pestilo
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Tu compañero digital para el bienestar y cuidado personal.
            Rutinas personalizadas, seguimiento de progreso y consejos expertos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center">
              <Play className="w-5 h-5 mr-2" />
              Comenzar Gratis
            </button>
            <button className="border-2 border-primary-600 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 px-8 py-3 rounded-lg font-semibold text-lg transition-colors">
              Ver Demo
            </button>
          </div>
        </section>
        {/* Removed Progress CTA */}
        {/* Categorías de Bienestar */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Categorías de Bienestar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categorias.map((categoria, index) => {
              const IconComponent = categoria.icono;
              return (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer group">
                  <div className={`w-12 h-12 ${categoria.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{categoria.nombre}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{categoria.descripcion}</p>
                  <div className="flex items-center text-primary-600 dark:text-primary-400 font-medium group-hover:text-primary-700 dark:group-hover:text-primary-300">
                    Explorar
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12 mt-20">
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