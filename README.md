# Pestilo Frontend

Aplicación web frontend, construida con Next.js, TypeScript, Tailwind CSS y Firebase Authentication.

## 🚀 Características

- **Next.js 14** con App Router
- **TypeScript** para type safety
- **Tailwind CSS** para estilos
- **Firebase Authentication** con email/contraseña y Google
- **Context API** para manejo de estado de autenticación
- **Componentes reutilizables** y responsive
- **Axios** para comunicación con la API

## 📋 Prerrequisitos

- Node.js (v16 o superior)
- npm o yarn
- Proyecto Firebase configurado

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
cd frontend-pestilo
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp env.example .env.local
```

Editar `.env.local` con tu configuración de Firebase:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:2000
```

## 🔥 Configuración Firebase

### 1. Crear Proyecto Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Habilita Authentication
4. Configura los proveedores:
   - Email/Password
   - Google

### 2. Configurar Web App
1. En Firebase Console, ve a Project Settings
2. En la sección "Your apps", agrega una nueva Web App
3. Copia la configuración y agrégalo a `.env.local`

### 3. Configurar Authentication
1. Ve a Authentication > Sign-in method
2. Habilita Email/Password
3. Habilita Google y configura el OAuth consent screen

## 🚀 Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar en producción
npm start
```

## 🏗️ Estructura del Proyecto

```
app/
├── layout.tsx              # Layout principal con AuthProvider
├── page.tsx                # Página principal
└── globals.css             # Estilos globales

components/
├── auth/
│   ├── AuthContainer.tsx   # Contenedor de autenticación
│   ├── LoginForm.tsx       # Formulario de login
│   └── RegisterForm.tsx    # Formulario de registro
└── ui/                     # Componentes de UI

contexts/
└── AuthContext.tsx         # Contexto de autenticación

lib/
├── api.ts                  # Configuración de Axios
├── fetch.ts                # Funciones de fetch
└── firebase.ts             # Configuración de Firebase
```

## 🔐 Autenticación

### Métodos de Autenticación
- ✅ **Email/Contraseña** - Registro e inicio de sesión tradicional
- ✅ **Google** - Inicio de sesión con cuenta de Google
- ✅ **Persistencia** - Mantiene la sesión entre recargas
- ✅ **Protección de rutas** - Redirección automática

### Flujo de Autenticación
1. **Registro**: Usuario crea cuenta con email/contraseña o Google
2. **Verificación**: Firebase verifica las credenciales
3. **Token**: Se genera un token de autenticación
4. **Contexto**: El estado se mantiene en AuthContext
5. **API**: Las peticiones incluyen el token automáticamente

## 🎨 Componentes de Autenticación

### AuthContainer
- Contenedor principal que maneja el cambio entre login y registro
- Diseño responsive con gradiente de fondo
- Transiciones suaves entre formularios

### LoginForm
- Formulario de inicio de sesión con email/contraseña
- Botón de inicio de sesión con Google
- Validaciones en tiempo real
- Manejo de errores con mensajes descriptivos

### RegisterForm
- Formulario de registro con validaciones
- Confirmación de contraseña
- Registro con Google
- Validaciones de seguridad

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construir para producción
- `npm start` - Iniciar en producción
- `npm run lint` - Ejecutar linter

## 🛡️ Seguridad

- ✅ **Variables de entorno** para configuración sensible
- ✅ **Validación de formularios** en frontend y backend
- ✅ **Tokens de autenticación** seguros
- ✅ **Manejo de errores** robusto
- ✅ **Protección CSRF** con tokens

## 📱 Responsive Design

- ✅ **Mobile-first** approach
- ✅ **Breakpoints** optimizados
- ✅ **Componentes adaptativos**
- ✅ **Touch-friendly** interfaces

## 🔄 Integración con Backend

- ✅ **Axios** para peticiones HTTP
- ✅ **Interceptores** para tokens automáticos
- ✅ **Manejo de errores** centralizado
- ✅ **Tipos TypeScript** compartidos

## 🌍 Internacionalización por país (rutas con sufijo)

- **Detección automática de país por headers**: El middleware inspecciona el header `Accept-Language` para inferir la región preferida del usuario y redirigir a la ruta con el sufijo de país correspondiente. Si no se puede determinar, se usa un país por defecto (`DEFAULT_COUNTRY`).
- **Redirecciones basadas en cookies**: Se persiste la preferencia en la cookie `preferred-country` para futuras visitas. Si la cookie existe y es válida, se prioriza sobre el header.
- **Validación de países soportados**: Solo se aceptan códigos incluidos en `SUPPORTED_COUNTRIES`. Si el primer segmento de la URL no corresponde a un país soportado, se retorna 404.

### Estructura de rutas
- Home por país: `/{country}` (ej.: `/ar`, `/us`, `/mx`)
- Secciones: `/{country}/dashboard`, `/{country}/login`, `/{country}/register`, `/{country}/theme-demo`

### Middleware
- Archivo: `middleware.ts`
- Funciones clave: detección de país, validación y redirección, persistencia de cookie.

### Pendiente
- Incluir un selector de país en la sección de Configuraciones cuando esté disponible, para permitir cambiar manualmente la región desde la UI.

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

MIT License - ver archivo [LICENSE](LICENSE) para detalles. 

## 🧱 Patrón: Componentes de Alto Nivel (HLC) con props estructuradas

- **Qué es**: crear un componente contenedor que resuelva la interacción/estilos y reciba "props estructuradas" (evita prop drilling desordenado y repetición de `className`).
- **Beneficios**: consistencia visual, reusabilidad, menor código repetido, mejor DX.
- **Dónde aplicarlo**: Dropdowns, menús de usuario, selectores (idioma/tema/país), barras de herramientas, acciones masivas, etc.

### Ejemplo: Dropdown de idioma

```tsx
import Dropdown, { StructuredDropdownItem } from '@/components/Dropdown';
import { Languages } from 'lucide-react';

const currentLang = 'es'; // o 'en'

const languageItems: StructuredDropdownItem[] = [
  {
    value: 'es',
    label: (
      <span className="flex items-center"><span className="mr-2">🇪🇸</span><span>Español</span></span>
    ),
    onSelect: () => change('es'),
  },
  {
    value: 'en',
    label: (
      <span className="flex items-center"><span className="mr-2">🇺🇸</span><span>English</span></span>
    ),
    onSelect: () => change('en'),
  },
];

<Dropdown
  icon={Languages}            // Icono del botón
  text={<span className="uppercase">{currentLang}</span>} // Texto del botón
  items={languageItems}       // Opciones estructuradas
  selected={currentLang}      // Opción seleccionada (opcional)
/>
```

Notas:
- Los estilos base de `DropdownMenuContent` y `DropdownMenuItem` están centralizados en `components/ui/dropdown-menu.tsx` para heredar tema/hover sin repetir clases.
- Prefiere pasar `items` como arreglo de `{ value, label, onSelect, disabled? }`.
- Evita duplicar estilos en cada uso; si hace falta una variante, exponerla como prop en el HLC.

## 🧩 Estilo de código: "código conciso/denso"

- **Importaciones**: agrupar dentro de llaves en una sola línea.
- **Funciones**: no dejar líneas en blanco internas; excepción permitida justo antes de `return` si mejora legibilidad.
- **Componentes funcionales**: en el `return ( ... )` no dejar líneas en blanco entre nodos.

Ejemplos:

```ts
// ✅ Importaciones en una sola línea
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

// ✅ Función sin líneas en blanco internas (salvo antes del return)
function doSomething(a: number, b: number) {
  const sum = a + b;
  if (sum < 0) return 0;

  return sum;
}

// ✅ Componentes funcionales: separar la lógica en funciones/secciones; en el JSX del return no dejes líneas en blanco
export const Widget = () => {
  return (
    <div>
      <span>Hola</span>
      <button>Aceptar</button>
    </div>
  );
};
```