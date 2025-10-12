// Script de registro del Service Worker - sistemasJaihom
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] Service Worker registrado con éxito:', registration.scope);

        // Verificar si hay actualizaciones cada hora
        setInterval(() => {
          registration.update();
        }, 3600000); // 1 hora

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[PWA] Nueva versión del Service Worker encontrada');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Hay un nuevo service worker disponible
              console.log('[PWA] Nuevo contenido disponible');
              // El modal de React en el dashboard manejará la UI de actualización
            }
          });
        });
      })
      .catch((error) => {
        console.error('[PWA] Error al registrar el Service Worker:', error);
      });

    // Recargar cuando el service worker tome control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

// Detectar si la app está instalada
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('[PWA] App puede ser instalada');
  // Prevenir el mini-infobar automático de Chrome
  e.preventDefault();
  // Guardar el evento para usar después
  window.deferredPrompt = e;

  // Opcional: Mostrar un botón personalizado de instalación
  // Puedes usar este evento para mostrar tu propio UI de instalación
});

// Detectar cuando la app fue instalada
window.addEventListener('appinstalled', () => {
  console.log('[PWA] App instalada exitosamente');
  window.deferredPrompt = null;
});

// Función helper para instalar la app programáticamente
window.installPWA = async () => {
  if (window.deferredPrompt) {
    window.deferredPrompt.prompt();
    const { outcome } = await window.deferredPrompt.userChoice;
    console.log(`[PWA] Usuario eligió: ${outcome}`);
    window.deferredPrompt = null;
  }
};

