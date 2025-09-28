# Sistema de Caché para Tasa BCV

## Descripción

Este sistema implementa un caché inteligente para la tasa BCV que evita hacer fetch innecesarios al API. La tasa se almacena en localStorage y solo se actualiza cuando la fecha cambia.

## Características

- **Caché en localStorage**: Los datos se almacenan localmente para acceso rápido
- **Validación por fecha**: Solo actualiza cuando la fecha cambia (nuevo día)
- **Fallback inteligente**: Si falla el fetch, usa los datos almacenados
- **Estados de carga**: Maneja estados de loading, error y datos

## Uso

### Hook useTasaBCV

```typescript
import { useTasaBCV } from '@/hooks/useTasaBCV';

function MiComponente() {
  const { tasaBCV, loading, error, refreshTasaBCV, loadTasaBCV } = useTasaBCV();

  return (
    <div>
      {loading && <p>Cargando tasa BCV...</p>}
      {error && <p>Error: {error}</p>}
      {tasaBCV && (
        <p>Tasa BCV: ${tasaBCV.tasa.toFixed(2)}</p>
      )}
    </div>
  );
}
```

### Propiedades del Hook

- `tasaBCV`: Objeto con la tasa y fecha actual
- `loading`: Boolean que indica si está cargando
- `error`: String con el mensaje de error si ocurre uno
- `refreshTasaBCV()`: Función para forzar actualización
- `loadTasaBCV()`: Función para recargar datos

### Estructura de Datos

```typescript
interface TasaBCV {
  _id: string;
  tasa: number;
  fecha: string;
  createdAt: string;
}
```

## Implementación en SidebarLayout

El componente `SidebarLayout` ya está configurado para mostrar la tasa BCV en tiempo real:

```tsx
<span id="tasaBCV" className="hidden md:block">
  {tasaLoading ? 'Cargando...' : tasaError ? 'Error' : tasaBCV ? `$ ${tasaBCV.tasa.toFixed(2)}` : '$ 0.00'}
</span>
```

## Lógica de Caché

1. **Primera carga**: Intenta cargar desde localStorage
2. **Validación de fecha**: Compara la fecha almacenada con la fecha actual
3. **Actualización**: Si la fecha cambió, hace fetch al API
4. **Almacenamiento**: Guarda los nuevos datos en localStorage
5. **Fallback**: Si falla el fetch, usa los datos almacenados

## Almacenamiento en localStorage

- `tasaBCV`: Objeto con la tasa y fecha
- `tasaBCVDate`: Fecha en formato YYYY-MM-DD para comparación

## Query GraphQL

```graphql
query getTasasBCV($fecha: String!, $skip: Int!, $limit: Int!) {
  getTasasBCV(fecha: $fecha, skip: $skip, limit: $limit) {
    tasa
    fecha
  }
}
```

### Argumentos de la Query

- `fecha`: String con la fecha en formato YYYY-MM-DD (ej: "2025-09-28")
- `skip`: Número de registros a omitir (siempre 0)
- `limit`: Número máximo de registros a obtener (siempre 1)

### Ejemplo de Uso

```typescript
const variables = {
  fecha: "2025-09-28",
  skip: 0,
  limit: 1
};
```

## Ventajas

- **Rendimiento**: Evita requests innecesarios
- **Experiencia de usuario**: Carga instantánea de datos cacheados
- **Confiabilidad**: Fallback a datos almacenados si falla la red
- **Eficiencia**: Solo actualiza cuando es necesario
