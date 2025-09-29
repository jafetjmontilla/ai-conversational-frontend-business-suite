# Store Toggle Component

## Descripción

El componente `StoreToggle` permite seleccionar entre dos stores: "Guardians" y "Jaihom". Este toggle determina en qué store se creará la factura y filtra las facturas existentes según el store seleccionado.

## Características

### 🎯 Funcionalidades

- **Selección de Store**: Toggle entre "Guardians" y "Jaihom"
- **Estados Visuales**: Diferentes colores para cada store
- **Integración Completa**: Se integra con el sistema de facturas
- **Filtrado Automático**: Filtra facturas por store seleccionado

### 🎨 Diseño

- **Guardians**: Color azul (bg-blue-600)
- **Jaihom**: Color verde (bg-green-600)
- **Estados**: Activo (sólido) e inactivo (outline)
- **Responsive**: Adaptable a diferentes tamaños

### 🔧 Uso

```tsx
import { StoreToggle, Store } from '@/components/invoice/StoreToggle';

function MyComponent() {
  const [selectedStore, setSelectedStore] = useState<Store>('guardians');

  return (
    <StoreToggle 
      selectedStore={selectedStore} 
      onStoreChange={setSelectedStore} 
    />
  );
}
```

### 📊 Props

```typescript
interface StoreToggleProps {
  selectedStore: Store;
  onStoreChange: (store: Store) => void;
}

type Store = 'guardians' | 'jaihom';
```

### 🚀 Integración con Facturas

#### 1. Creación de Facturas
- Las nuevas facturas se crean con el store seleccionado
- El store se incluye en el schema de validación
- Se almacena en la base de datos

#### 2. Filtrado de Facturas
- Solo se muestran facturas del store seleccionado
- Filtrado tanto para facturas guardadas como locales
- Cambio de store actualiza la vista automáticamente

#### 3. Visualización
- Cada factura muestra su store en el header
- Badge con color correspondiente al store
- Identificación visual clara

### 💾 Almacenamiento

- **Estado Local**: Se mantiene en el estado del componente padre
- **Persistencia**: Se incluye en las facturas guardadas
- **Filtrado**: Se aplica en tiempo real

### 🔄 Flujo de Trabajo

1. **Selección Inicial**: Por defecto se selecciona "Guardians"
2. **Cambio de Store**: Click en el botón cambia el store
3. **Filtrado**: Se filtran las facturas existentes
4. **Nueva Factura**: Se crea con el store seleccionado
5. **Visualización**: Se muestra el store en cada factura

### 🎯 Casos de Uso

- **Multi-Store**: Manejo de múltiples tiendas
- **Separación de Datos**: Facturas separadas por store
- **Identificación**: Identificación visual del store
- **Filtrado**: Vista filtrada por store

### 🔧 Implementación Técnica

#### Componente
```tsx
export function StoreToggle({ selectedStore, onStoreChange }: StoreToggleProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={selectedStore === 'guardians' ? 'default' : 'outline'}
        onClick={() => onStoreChange('guardians')}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Guardians
      </Button>
      <Button
        variant={selectedStore === 'jaihom' ? 'default' : 'outline'}
        onClick={() => onStoreChange('jaihom')}
        className="bg-green-600 hover:bg-green-700"
      >
        Jaihom
      </Button>
    </div>
  );
}
```

#### Schema de Validación
```typescript
export const invoiceSchema = z.object({
  // ... otros campos
  store: z.enum(['guardians', 'jaihom']),
  // ... otros campos
});
```

#### Filtrado
```typescript
const filteredInvoices = invoices.filter(invoice => 
  invoice.store === selectedStore
);
```

### 🚨 Consideraciones

- **Consistencia**: El store debe ser consistente en toda la aplicación
- **Validación**: Se valida que el store sea uno de los valores permitidos
- **Filtrado**: El filtrado se aplica tanto a facturas guardadas como locales
- **UI/UX**: Los colores deben ser consistentes con el diseño general

### 🔄 Estados

- **Guardians Seleccionado**: Botón azul sólido, Jaihom outline
- **Jaihom Seleccionado**: Botón verde sólido, Guardians outline
- **Hover**: Efectos de hover en ambos botones
- **Transición**: Transiciones suaves entre estados
