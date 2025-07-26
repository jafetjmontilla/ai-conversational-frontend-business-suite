'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Progress } from './ui/progress';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { User, Settings, LogOut, Bell, Heart, Activity, Moon, Sun } from 'lucide-react';

export const RadixDemo = () => {
  const [progress, setProgress] = useState(65);
  const [notifications, setNotifications] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Componentes Radix UI
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Demostración de los componentes implementados con Radix UI
        </p>
      </div>

      {/* Botones */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Botones</h3>
        <div className="flex flex-wrap gap-4">
          <Button>Botón Primario</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="wellness">Wellness</Button>
          <Button variant="destructive">Destructivo</Button>
          <Button size="sm">Pequeño</Button>
          <Button size="lg">Grande</Button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Progreso</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Progreso de la rutina</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>
              -10%
            </Button>
            <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>
              +10%
            </Button>
          </div>
        </div>
      </div>

      {/* Switches */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Switches</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Notificaciones
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Recibir recordatorios de rutinas
              </p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Reproducción automática
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Siguiente rutina automáticamente
              </p>
            </div>
            <Switch checked={autoPlay} onCheckedChange={setAutoPlay} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Pestañas</h3>
        <Tabs defaultValue="ejercicio" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ejercicio" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Ejercicio
            </TabsTrigger>
            <TabsTrigger value="meditacion" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Meditación
            </TabsTrigger>
            <TabsTrigger value="nutricion" className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              Nutrición
            </TabsTrigger>
            <TabsTrigger value="sueno" className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Sueño
            </TabsTrigger>
          </TabsList>
          <TabsContent value="ejercicio" className="mt-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Rutinas de Ejercicio</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Aquí encontrarás todas tus rutinas de actividad física.
              </p>
            </div>
          </TabsContent>
          <TabsContent value="meditacion" className="mt-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Prácticas de Meditación</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Sesiones de mindfulness y relajación.
              </p>
            </div>
          </TabsContent>
          <TabsContent value="nutricion" className="mt-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Hábitos Nutricionales</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Consejos y rutinas para una alimentación saludable.
              </p>
            </div>
          </TabsContent>
          <TabsContent value="sueno" className="mt-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Optimización del Sueño</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Técnicas para mejorar la calidad del descanso.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dropdown Menu */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Menú Desplegable</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Menú de Usuario
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificaciones
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dialog */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Diálogos</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Iniciar Nueva Rutina</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Estás listo para comenzar?</DialogTitle>
              <DialogDescription>
                Esta rutina de ejercicio durará aproximadamente 30 minutos y incluirá ejercicios de cardio y fuerza.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Duración:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">30 minutos</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Dificultad:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Intermedia</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Calorías:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">~250 kcal</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Cancelar</Button>
              <Button variant="wellness">¡Comenzar!</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}; 