"use client";

import { useState } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { InvoiceCard } from '@/components/invoice/InvoiceCard';
import { useTasaBCV } from '@/hooks/useTasaBCV';
import { Invoice } from '@/lib/schemas/invoice';
import { Store } from '@/components/invoice/StoreToggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

export default function InvoicePage() {
  const [localInvoices, setLocalInvoices] = useState<Invoice[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store>('guardians');
  const { tasaBCV } = useTasaBCV();

  const createEmptyItems = () => {
    return Array.from({ length: 10 }, (_, index) => ({
      id: `item-${index}`,
      quantity: 0,
      description: '',
      unitPrice: 0,
      total: 0,
      inventoryItem: null
    }));
  };

  const addNewInvoice = () => {
    const newInvoice: Invoice = {
      _id: `local-${Date.now()}`,
      clientName: '',
      clientId: '',
      clientPhone: '',
      items: createEmptyItems(),
      totalBs: 0,
      totalUsd: 0,
      store: selectedStore,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setLocalInvoices(prev => [...prev, newInvoice]);
  };

  const updateLocalInvoice = (id: string, updatedInvoice: Partial<Invoice>) => {
    setLocalInvoices(prev =>
      prev.map(invoice =>
        invoice._id === id
          ? { ...invoice, ...updatedInvoice }
          : invoice
      )
    );
  };

  const removeInvoice = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres cerrar esta factura sin guardar?')) {
      setLocalInvoices(prev => prev.filter(invoice => invoice._id !== id));
    }
  };

  // Filtrar facturas locales por store seleccionado
  const filteredInvoices = localInvoices.filter(invoice => invoice.store === selectedStore);

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full h-full">
      <Card className='flex flex-col w-full h-full'>
        <CardHeader>
          <div className="flex flex-col">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Facturación
            </CardTitle>
            <CardDescription>Crear facturas</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-2 md:p-6 w-full flex flex-col flex-1">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 flex-1"></div>
            <ToggleGroup
              type="single"
              value={selectedStore}
              onValueChange={(value) => setSelectedStore(value as "guardians" | "jaihom")}
              className="border rounded-md"
            >
              <ToggleGroupItem value="guardians" className="px-3 py-2">
                Guardians
              </ToggleGroupItem>
              <ToggleGroupItem value="jaihom" className="px-3 py-2">
                Jaihom
              </ToggleGroupItem>
            </ToggleGroup>
            <Button onClick={addNewInvoice} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva Factura
            </Button>
          </div>
          <Separator className="my-4" />
          <div className='w-full max-w-full h-full flex overflow-hidden relative'>
            {filteredInvoices.length > 0 ? (
              <Carousel
                opts={{
                  align: "center",
                  skipSnaps: false,
                  dragFree: false,
                }}
                className="w-full max-w-full h-full flex overflow-hidden absolute"
              >
                <CarouselContent className='w-full h-full -ml-0 md:-ml-4'>
                  {filteredInvoices.map((invoice) => (
                    <CarouselItem key={invoice._id} className="pl-0 md:pl-4 basis-full md:basis-[340px] h-full">
                      <InvoiceCard
                        setLocalInvoices={setLocalInvoices}
                        invoice={invoice}
                        onUpdate={(updatedInvoice) => updateLocalInvoice(invoice._id, updatedInvoice)}
                        onRemove={() => removeInvoice(invoice._id)}
                        tasaBCV={tasaBCV?.tasa || 175}
                        store={selectedStore}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="fixed md:absolute -left-1.5 md:left-0 md:translate-y-32 bg-white hover:bg-gray-50 border border-gray-300 shadow-md" />
                <CarouselNext className="fixed md:absolute -right-1.5 md:right-0 md:translate-y-32 bg-white hover:bg-gray-50 border border-gray-300 shadow-md" />
              </Carousel>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <Receipt className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg mb-2">No hay facturas</p>
                  <p className="text-sm text-gray-400">Haz clic en "Nueva Factura" para crear una nueva factura</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
