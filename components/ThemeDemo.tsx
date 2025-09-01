'use client';

import { FC } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { useThemeContext } from '../contexts/ThemeContext';
import { SimpleThemeToggle } from './SimpleThemeToggle';
import { Input } from './ui/input';
import { InputSearch } from './InputSearch';
import { Toggle, ToggleWithBorder } from './Toggle';
import { Bold, ChevronDown, Italic, Underline } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';


export const ThemeDemo: FC = () => {
  const { theme, isDark, isLight, isSystem } = useThemeContext();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h3 className="text-lg font-semibold text-primary mb-4">
        Demostración del Sistema de Temas
      </h3>

      <div className="space-y-6">
        {/* Estado actual del tema */}
        <div className="bg-card rounded-lg p-4 border border-border">
          <h4 className="font-medium text-foreground mb-2">Estado Actual:</h4>
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-muted-foreground">
              Tema seleccionado: <span className="font-medium text-primary">{theme}</span>
            </span>
            <div className="flex space-x-2">
              {isLight && <span className="px-2 py-1 bg-accent text-accent-foreground rounded text-xs">Claro</span>}
              {isDark && <span className="px-2 py-1 bg-accent text-accent-foreground rounded text-xs">Oscuro</span>}
              {isSystem && <span className="px-2 py-1 bg-accent text-accent-foreground rounded text-xs">Sistema</span>}
            </div>
          </div>
        </div>

        {/* Paleta de colores */}
        <div>
          <h4 className="font-medium text-primary mb-2">Paleta de colores:</h4>
          <div className="flex flex-wrap gap-2">
            <div className='w-10 h-10 bg-primary text-yellow-500 text-[8px]' >primary</div>
            <div className='w-10 h-10 bg-primary-foreground text-yellow-500 text-[8px]' >primary-foreground</div>
            <div className='w-10 h-10 bg-secondary text-yellow-500 text-[8px]' >secondary</div>
            <div className='w-10 h-10 bg-secondary-foreground text-yellow-500 text-[8px]' >secondary-foreground</div>
            <div className='w-10 h-10 bg-accent text-yellow-500 text-[8px]' >accent</div>
            <div className='w-10 h-10 bg-accent-foreground text-yellow-500 text-[8px]' >accent-foreground</div>
            <div className='w-10 h-10 bg-destructive text-yellow-500 text-[8px]' >destructive</div>
            <div className='w-10 h-10 bg-destructive-foreground text-yellow-500 text-[8px]' >destructive-foreground</div>
          </div>
        </div>

        {/* countrys */}
        <div>
          <h4 className="font-medium text-primary mb-2">Countrys:</h4>
          <div className='flex gap-2'>
            <p>
              Me encanta la comida mexicana 🌮 y su bandera 🇲🇽.
            </p>
          </div>
        </div>

        {/* Inputs */}
        <div>
          <h4 className="font-medium text-primary mb-2">Inputs:</h4>
          <div className='flex gap-2'>
            <InputSearch placeholder='Buscar' className='w-80' />
            <Input type='email' placeholder='email' className='w-80' />
            <Input type='password' placeholder='password' className='w-80' />
          </div>
        </div>

        {/* toggle */}
        <div>
          <h4 className="font-medium text-primary mb-2">Toggle:</h4>
          <div className="flex gap-2 items-end">
            <Toggle size="sm" type="single" items={[
              { value: 'bold', label: 'Bold', icon: <Bold /> },
              { value: 'italic', label: 'Italic', icon: <Italic /> },
              { value: 'underline', label: 'Underline', icon: <Underline /> }
            ]} />
            <ToggleWithBorder size="xs" type="single" items={[
              { value: 'bold', label: 'Bold', icon: <Bold /> },
              { value: 'italic', label: 'Italic', icon: <Italic /> },
              { value: 'underline', label: 'Underline', icon: <Underline /> }
            ]} />
          </div>
        </div>

        {/* buttons */}
        <h4 className="font-medium text-primary mb-2">Buttons:</h4>
        <div className="flex gap-2">
          <Button variant="outline">
            <span>outline</span>
          </Button>
          <Button>
            <span>default</span>
          </Button>
          <Button variant="secondary">
            <span>secondary</span>
          </Button>
          <Button variant="destructive">
            <span>destructive</span>
          </Button>
          <Button variant="ghost">
            <span>ghost</span>
          </Button>
          <Button variant="link">
            <span>link</span>
          </Button>
        </div>

        {/* Selector completo de temas */}
        <div>
          <h4 className="font-medium text-primary mb-2">Selector Completo:</h4>
          <ThemeToggle />
        </div>

        {/* Selector simple */}
        <div>
          <h4 className="font-medium text-primary mb-2">Selector Simple:</h4>
          <SimpleThemeToggle />
        </div>

        {/*Tabs */}
        <div>
          <h4 className="font-medium text-primary mb-2">Tabs:</h4>
          <Tabs defaultValue="account">
            <TabsList>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
              hola 1
            </TabsContent>
            <TabsContent value="password">
              hola 2
            </TabsContent>
          </Tabs>
        </div>

        {/*Table */}
        <div>
          <h4 className="font-medium text-primary mb-2">Table:</h4>
          <TableDemo />
        </div>

        {/* Ejemplos de componentes */}
        <div>
          <h4 className="font-medium text-primary mb-2">Ejemplos de Componentes:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card rounded-lg p-4 border border-border">
              <h5 className="font-medium text-foreground mb-2">Tarjeta de Ejemplo</h5>
              <p className="text-muted-foreground text-sm mb-3">
                Este es un ejemplo de cómo se ven los componentes en el tema actual.
              </p>
              <button className="bg-primary hover:bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm transition-colors">
                Botón Primario
              </button>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <h5 className="font-medium text-foreground mb-2">Tarjeta con Borde</h5>
              <p className="text-muted-foreground text-sm mb-3">
                Componente con borde para mostrar contraste.
              </p>
              <button className="border border-primary text-primary hover:bg-accent px-4 py-2 rounded-lg text-sm transition-colors">
                Botón Secundario
              </button>
            </div>
          </div>
        </div>

        {/* Información del sistema */}
        <div className="bg-accent/20 border border-border rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Información del Sistema</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• El tema se guarda automáticamente en el navegador</li>
            <li>• El modo "Sistema" sigue la preferencia del sistema operativo</li>
            <li>• Los cambios se aplican instantáneamente sin recargar la página</li>
            <li>• Todos los componentes están optimizados para ambos temas</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow, } from "@/components/ui/table"

const invoices = [
  {
    invoice: "INV001",
    paymentStatus: "Paid",
    totalAmount: "$250.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV002",
    paymentStatus: "Pending",
    totalAmount: "$150.00",
    paymentMethod: "PayPal",
  },
  {
    invoice: "INV003",
    paymentStatus: "Unpaid",
    totalAmount: "$350.00",
    paymentMethod: "Bank Transfer",
  },
  {
    invoice: "INV004",
    paymentStatus: "Paid",
    totalAmount: "$450.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV005",
    paymentStatus: "Paid",
    totalAmount: "$550.00",
    paymentMethod: "PayPal",
  },
  {
    invoice: "INV006",
    paymentStatus: "Pending",
    totalAmount: "$200.00",
    paymentMethod: "Bank Transfer",
  },
  {
    invoice: "INV007",
    paymentStatus: "Unpaid",
    totalAmount: "$300.00",
    paymentMethod: "Credit Card",
  },
]

export function TableDemo() {
  return (
    <Table >
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.invoice}>
            <TableCell className="font-medium">{invoice.invoice}</TableCell>
            <TableCell>{invoice.paymentStatus}</TableCell>
            <TableCell>{invoice.paymentMethod}</TableCell>
            <TableCell className="text-right">{invoice.totalAmount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">$2,500.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
