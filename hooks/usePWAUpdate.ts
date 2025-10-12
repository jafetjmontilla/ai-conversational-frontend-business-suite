"use client";

import { useEffect, useState } from 'react';

export function usePWAUpdate() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [newWorker, setNewWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Obtener el registro actual del service worker
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) {
        setRegistration(reg);

        // Verificar si hay una actualización inmediatamente
        reg.update();

        // Escuchar eventos de actualización
        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing;

          if (installingWorker) {
            console.log('[PWA] Nueva versión del Service Worker encontrada');

            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Hay un nuevo service worker disponible
                console.log('[PWA] Nuevo contenido disponible');
                setNewWorker(installingWorker);
                setShowUpdatePrompt(true);
              }
            });
          }
        });
      }
    });

    // Escuchar cambios de controlador (cuando el nuevo SW toma control)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('[PWA] Recargando para aplicar actualización...');
        window.location.reload();
      }
    });
  }, []);

  const updateServiceWorker = () => {
    if (newWorker) {
      // Enviar mensaje al nuevo worker para que tome control inmediatamente
      newWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  const dismissUpdate = () => {
    setShowUpdatePrompt(false);
  };

  return {
    showUpdatePrompt,
    updateServiceWorker,
    dismissUpdate,
  };
}

