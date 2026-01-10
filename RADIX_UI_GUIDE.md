## Componentes Implementados

### 1. Button (`components/ui/button.tsx`)
Botón reutilizable con múltiples variantes y tamaños.

```typescript
import { Button } from '../components/ui/button';

// Variantes disponibles
<Button>Primario</Button>
<Button variant="secondary">Secundario</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="wellness">Wellness</Button>
<Button variant="destructive">Destructivo</Button>

// Tamaños
<Button size="sm">Pequeño</Button>
<Button size="default">Normal</Button>
<Button size="lg">Grande</Button>
<Button size="icon">Icono</Button>
```

### 2. Dialog (`components/ui/dialog.tsx`)
Modal accesible para confirmaciones y formularios.

```typescript
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Abrir Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título del Modal</DialogTitle>
      <DialogDescription>Descripción del modal</DialogDescription>
    </DialogHeader>
    {/* Contenido */}
    <DialogFooter>
      <Button variant="outline">Cancelar</Button>
      <Button>Confirmar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 3. Progress (`components/ui/progress.tsx`)
Barra de progreso para mostrar avance de rutinas.

```typescript
import { Progress } from '../components/ui/progress';

<Progress value={65} className="w-full" />
```

### 4. Switch (`components/ui/switch.tsx`)
Interruptor para configuraciones.

```typescript
import { Switch } from '../components/ui/switch';

const [enabled, setEnabled] = useState(false);

<Switch checked={enabled} onCheckedChange={setEnabled} />
```

### 5. Tabs (`components/ui/tabs.tsx`)
Pestañas para organizar contenido.

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

<Tabs defaultValue="ejercicio">
  <TabsList>
    <TabsTrigger value="ejercicio">Ejercicio</TabsTrigger>
    <TabsTrigger value="meditacion">Meditación</TabsTrigger>
  </TabsList>
  <TabsContent value="ejercicio">
    Contenido de ejercicio
  </TabsContent>
  <TabsContent value="meditacion">
    Contenido de meditación
  </TabsContent>
</Tabs>
```

### 6. DropdownMenu (`components/ui/dropdown-menu.tsx`)
Menú desplegable para navegación.

```typescript
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Menú</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Perfil</DropdownMenuItem>
    <DropdownMenuItem>Configuración</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Características de Accesibilidad

### ✅ Implementadas
- **Navegación por teclado** completa
- **Screen readers** optimizados
- **Focus management** automático
- **ARIA labels** apropiados
- **Contraste** optimizado para ambos temas
- **Estados de hover/focus** claros

### 🎯 Beneficios para 4netERP
- **Inclusividad**: Accesible para usuarios con discapacidades
- **Profesionalismo**: Componentes de nivel empresarial
- **Mantenibilidad**: Código más limpio y estructurado
- **Escalabilidad**: Fácil agregar nuevos componentes

## Integración con el Sistema de Temas

Todos los componentes están optimizados para el sistema de temas claro/oscuro:

```typescript
// Ejemplo de clases automáticas
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
```

## Casos de Uso en 4netERP

### Dashboard
- **Progress**: Progreso semanal de rutinas
- **Tabs**: Categorías de bienestar
- **Button**: Acciones principales

### Configuración
- **Switch**: Notificaciones, auto-play
- **Dialog**: Confirmaciones importantes
- **DropdownMenu**: Menú de usuario

### Rutinas
- **Dialog**: Iniciar rutina, confirmar completado
- **Progress**: Progreso en tiempo real
- **Button**: Controles de reproducción

## Próximos Componentes

### Fase 2 (Próximamente)
- **Toast**: Notificaciones de logros
- **Tooltip**: Ayuda contextual
- **Accordion**: FAQ, instrucciones
- **Select**: Filtros de rutinas
- **Slider**: Configuración de duración

### Fase 3 (Futuro)
- **AlertDialog**: Confirmaciones críticas
- **Popover**: Información contextual
- **ScrollArea**: Contenido con scroll
- **HoverCard**: Previews de rutinas

## Mejores Prácticas

### 1. Uso de `asChild`
```typescript
// ✅ Correcto
<DialogTrigger asChild>
  <Button>Abrir</Button>
</DialogTrigger>

// ❌ Incorrecto
<DialogTrigger>
  <Button>Abrir</Button>
</DialogTrigger>
```

### 2. Manejo de Estados
```typescript
// ✅ Correcto
const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
```

### 3. Accesibilidad
```typescript
// ✅ Siempre incluir labels apropiados
<Button aria-label="Cerrar modal">
  <X className="h-4 w-4" />
</Button>
```

## Consideraciones de Performance

- **Tree-shaking**: Solo se importan los componentes usados
- **Bundle size**: Optimizado automáticamente
- **Lazy loading**: Los componentes se cargan bajo demanda
- **No CSS-in-JS**: Usa Tailwind CSS para mejor performance

### Estilo de código: "código conciso/denso"

- Importaciones de Shadcn y UI internas en una sola línea cuando sea posible.
- Evitar líneas en blanco dentro de funciones; se permite una antes de `return` si mejora la lectura.
- En `return` de componentes, no intercalar líneas en blanco entre nodos.

Esto ayuda a mantener consistencia, densidad y lectura skimmable en componentes de UI con mucha composición.

---

## Patrón recomendado: High-Level Components (HLC) con props estructuradas

- Objetivo: encapsular lógica y estilos frecuentes (Radix + Tailwind) y exponer una API declarativa basada en objetos estructurados.
- Ventajas: consistencia, menos duplicación de `className`, y fácil estandarización.

### Ejemplo: Dropdown genérico (`components/Dropdown.tsx`)

```tsx
<Dropdown
  icon={Languages}
  text={currentLang}
  items={languageItems}
  selected={currentLang}
/>
```

Estructura de item:

```ts
type StructuredDropdownItem = {
  value: string;
  label: React.ReactNode; // libertad para banderas, iconos, etc.
  onSelect: () => void;
  disabled?: boolean;
}
```

Buenas prácticas:
- Estilos base centralizados en `components/ui/dropdown-menu.tsx` (fondo, borde, hover/focus acorde al tema).
- Evitar asignar `className` ad-hoc en cada uso; en su lugar, agregar props de variante al HLC si se requieren.
- Reutilizar este patrón para menús de usuario, acciones masivas, y selectores (idioma/tema/país).