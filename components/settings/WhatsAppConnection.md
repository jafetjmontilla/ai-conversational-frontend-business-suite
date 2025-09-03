# Componente WhatsApp Connection

Componente React para gestionar conexiones de WhatsApp Business integrado con la API de WhatsApp de 4net.

## 🚀 Características

- ✅ **Gestión de Sesiones**: Crear, listar y eliminar sesiones de WhatsApp
- ✅ **QR Code en Tiempo Real**: Generación y visualización automática de códigos QR
- ✅ **WebSocket Integration**: Notificaciones en tiempo real del estado de conexión
- ✅ **UI Moderna**: Interfaz intuitiva con componentes de shadcn/ui
- ✅ **Estado Reactivo**: Actualización automática del estado de las sesiones
- ✅ **Manejo de Errores**: Notificaciones toast para todos los estados

## 📁 Archivos Relacionados

```
frontend-4net/
├── components/settings/
│   └── WhatsAppConnection.tsx          # Componente principal
├── lib/
│   ├── whatsapp-api.ts                # Cliente API y WebSocket
│   └── hooks/
│       └── useWhatsAppWebSocket.ts     # Hook personalizado para WebSocket
└── environment.local.example           # Variables de entorno
```

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env.local` con:

```bash
# URL de la API de WhatsApp
NEXT_PUBLIC_WHATSAPP_API_URL=http://localhost:2001
```

### Dependencias

El componente requiere estas dependencias que ya están instaladas:

```json
{
  "socket.io-client": "^4.7.0",
  "axios": "^1.6.0",
  "sonner": "^2.0.7"
}
```

## 🎨 Uso del Componente

### Integración Básica

```tsx
import WhatsAppConnection from "@/components/settings/WhatsAppConnection";

function SettingsPage() {
  const [cardFocusedId, setCardFocusedId] = useState<string>();

  return (
    <WhatsAppConnection
      cardFocusedId={cardFocusedId}
      setCardFocusedId={setCardFocusedId}
    />
  );
}
```

### Props del Componente

```tsx
interface WhatsAppConnectionProps {
  cardFocusedId?: string;           // ID de la tarjeta enfocada
  setCardFocusedId?: (id: string) => void;  // Función para cambiar el foco
}
```

## 🔌 API Cliente

### Uso del Cliente API

```tsx
import { whatsappApiService } from '@/lib/whatsapp-api';

// Crear sesión
const response = await whatsappApiService.createSession('mi-sesion');

// Enviar mensaje
const result = await whatsappApiService.sendMessage('sesion-id', '+573001234567', 'Hola!');
```

### Uso del WebSocket Hook

```tsx
import { useWhatsAppWebSocket } from '@/lib/hooks/useWhatsAppWebSocket';

function MyComponent() {
  const { 
    connectionState, 
    sessionEvents, 
    subscribeToSession 
  } = useWhatsAppWebSocket('user-id');

  useEffect(() => {
    if (connectionState.connected) {
      subscribeToSession('my-session-id');
    }
  }, [connectionState.connected]);

  return (
    <div>
      <p>Estado: {connectionState.connected ? 'Conectado' : 'Desconectado'}</p>
      <p>Eventos: {sessionEvents.length}</p>
    </div>
  );
}
```

## 🎯 Funcionalidades del Componente

### 1. Crear Nueva Sesión

- **Input**: ID de sesión y número de teléfono (opcional)
- **Acción**: Crea sesión en la API y se suscribe a eventos
- **Resultado**: Genera QR code para escanear

### 2. Visualización de Sesiones

- **Lista**: Muestra todas las sesiones con su estado
- **Estados**: Conectado, Esperando QR, Desconectado
- **Información**: ID, número de teléfono, última actividad

### 3. Gestión de QR Codes

- **Generación**: Automática al crear sesión
- **Visualización**: QR code embebido en la interfaz
- **Regeneración**: Botón para crear nuevo QR
- **Expiración**: Manejo automático de QR expirados

### 4. WebSocket en Tiempo Real

- **Conexión**: Estado de conectividad mostrado en tiempo real
- **Eventos**: Notificaciones instantáneas de cambios
- **Suscripciones**: Por sesión específica o globales

### 5. Acciones Disponibles

- **Suscribirse**: Recibir eventos de una sesión específica
- **Regenerar QR**: Crear nuevo código QR
- **Eliminar Sesión**: Desconectar y eliminar sesión
- **Refrescar**: Actualizar lista de sesiones

## 🎨 Estados Visuales

### Iconos de Estado

- ✅ **Conectado**: `CheckCircle` verde
- ⏳ **Esperando QR**: `Clock` amarillo  
- ❌ **Desconectado**: `AlertCircle` rojo

### Badges de Estado

- **Conectado**: Badge verde con texto "Conectado"
- **Esperando QR**: Badge amarillo con texto "Esperando QR"
- **Desconectado**: Badge rojo con texto "Desconectado"
- **Suscrito**: Badge outline cuando está suscrito a eventos

### Notificaciones Toast

- **Éxito**: `toast.success()` para acciones exitosas
- **Error**: `toast.error()` para errores y problemas
- **Info**: Mensajes informativos sobre el estado

## 🔄 Flujo de Trabajo

### 1. Flujo de Conexión Normal

```
Usuario crea sesión → API genera QR → Usuario escanea QR → 
WhatsApp conecta → WebSocket notifica → UI actualiza estado
```

### 2. Flujo de Eventos WebSocket

```
WebSocket conecta → Suscripción a sesión → Evento recibido → 
Handler procesa evento → Estado actualizado → UI re-renderiza
```

### 3. Flujo de Manejo de Errores

```
Error ocurre → Catch del error → Toast de notificación → 
Log en consola → Estado de error mostrado → Usuario informado
```

## 🐛 Debugging

### Logs del Cliente

Todos los eventos de WebSocket se loggean en la consola:

```javascript
// Eventos de conexión
console.log('🔌 Conectado al WebSocket de WhatsApp');

// Eventos de sesión
console.log('📱 Evento de sesión:', data);

// Errores
console.error('❌ Error conectando WebSocket:', error);
```

### Estados de Red

- **connectionState.connected**: Estado de WebSocket
- **connectionState.error**: Último error de conexión
- **sessionEvents**: Array de eventos recibidos

### Verificación de API

```javascript
// Verificar salud de la API
const isHealthy = await whatsappApiService.healthCheck();
console.log('API Health:', isHealthy);
```

## 🔧 Personalización

### Modificar Estilos

El componente usa clases de Tailwind CSS que pueden ser personalizadas:

```tsx
// Cambiar colores de estado
const getStatusColor = (isConnected: boolean) => {
  return isConnected ? 'text-green-500' : 'text-red-500';
};
```

### Agregar Eventos Personalizados

```tsx
// Extender el hook de WebSocket
const client = useWhatsAppWebSocket();

client.on('custom_event', (data) => {
  // Manejar evento personalizado
});
```

### Configurar Timeout

```tsx
// En whatsapp-api.ts
const whatsappApiClient = axios.create({
  timeout: 15000  // Cambiar timeout a 15 segundos
});
```

## 📱 Responsive Design

El componente es totalmente responsive:

- **Mobile**: Layout vertical, botones full-width
- **Tablet**: Grid de 2 columnas para inputs
- **Desktop**: Layout horizontal optimizado

## 🔐 Seguridad

- **Validación**: Inputs validados antes de envío
- **Sanitización**: QR codes encoded correctamente
- **Timeouts**: Requests con timeout configurado
- **Error Handling**: Manejo seguro de errores de red

## 🚀 Optimizaciones

- **Memoización**: Estados optimizados con useState
- **Debouncing**: Previene requests duplicados
- **Cleanup**: Proper cleanup de WebSocket connections
- **Lazy Loading**: Componentes cargados cuando es necesario
