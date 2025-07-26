# Pestilo Frontend - Aplicación de Bienestar

Frontend de la aplicación SaaS de Bienestar y Cuidado Personal construido con Next.js, TypeScript y Tailwind CSS.

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

La aplicación se ejecutará en http://localhost:3000

## Características

- **Next.js 14** con App Router
- **TypeScript** para type safety
- **Tailwind CSS** para estilos
- **Axios** para peticiones HTTP
- **Lucide React** para iconos
- Diseño responsive y moderno
- Integración con API GraphQL vía HTTP

## Estructura del Proyecto

```
frontend-pestilo/
├── app/
│   ├── globals.css          # Estilos globales
│   ├── layout.tsx           # Layout principal
│   └── page.tsx             # Página principal
├── lib/
│   ├── api.ts               # Configuración de axios
│   └── fetch.ts             # Funciones de fetch para GraphQL
└── components/              # Componentes reutilizables
```

## Integración con API

La aplicación se conecta a la API GraphQL en `http://localhost:2000/graphql` usando axios y las siguientes funciones:

- `getRutinas()`: Obtiene todas las rutinas disponibles
- `getEstadisticasBienestar(usuarioId)`: Obtiene estadísticas de bienestar del usuario
- `crearRutina(input)`: Crea una nueva rutina
- `checkApiHealth()`: Verifica el estado de la API

## Tecnologías Utilizadas

- **Next.js 14**: Framework de React
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Framework de CSS
- **Axios**: Cliente HTTP
- **Lucide React**: Iconos
- **React Hooks**: Estado y efectos 