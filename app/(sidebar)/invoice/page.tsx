"use client";

import { useState, useEffect } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatNumber, InvoiceCard } from '@/components/invoice/InvoiceCard';
import { useTasaBCV } from '@/hooks/useTasaBCV';
import { Invoice } from '@/lib/schemas/invoice';
import { Store } from '@/components/invoice/StoreToggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useSidebar } from '@/components/ui/sidebar';
import { fetchApiV1, queries } from '@/lib/Fetching';
import { useAllowed } from '@/lib/hooks/useAllowed';
import { SocketEvent, useWebSocketContext } from '@/contexts/WebSocketContext';

export default function InvoicePage() {
  const [localInvoices, setLocalInvoices] = useState<Invoice[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store>('guardians');
  const { tasaBCV } = useTasaBCV();
  const { state, isMobile } = useSidebar();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const { hasRole, getCurrentRole } = useAllowed();
  const { socket } = useWebSocketContext();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Aplicar filtro automático de tienda según el rol del usuario
  useEffect(() => {
    const userRole = getCurrentRole();
    if (hasRole('customerServiceG')) {
      setSelectedStore('guardians');
    } else if (hasRole('customerServiceJ')) {
      setSelectedStore('jaihom');
    }
  }, [hasRole, getCurrentRole]);

  useEffect(() => {
    if (!isMounted) return;
    if (!socket) return;
    const handleInvoiceCreated = (data: Invoice) => {
      setInvoices(prevInvoices => [data, ...prevInvoices]);
    };
    socket.on<SocketEvent>('invoice:created', handleInvoiceCreated);
    return () => {
      socket.off<SocketEvent>('invoice:created', handleInvoiceCreated);
    };
  }, [socket, isMounted]);

  const td = new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const gt = new Date(td);
  const lt = new Date(new Date(td).getTime() + 86400000 - 1000);

  useEffect(() => {
    fetchApiV1({
      query: queries.getInvoices,
      type: 'json',
      variables: {
        store: selectedStore,
        sort: { createdAt: -1 },
        rangeDate: {
          gt: gt.toISOString(),
          lt: lt.toISOString()
        }
      }
    }).then((res: any) => {
      setInvoices(res.results);
    })
  }, [selectedStore])

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
      <Card className='flex flex-col w-full h-full overflow-hidden'>
        <CardHeader className='h-[72px]'>
          <div className="flex flex-col">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Facturación
            </CardTitle>
            <CardDescription>Crear facturas</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-2 md:px-6 w-full flex-1 flex flex-col">
          <div className="flex items-center justify-between gap-4 pb-2">
            <div className="flex items-center gap-2 flex-1"></div>
            {!hasRole('customerServiceG') && !hasRole('customerServiceJ') && (
              <ToggleGroup
                type="single"
                value={selectedStore}
                onValueChange={(value: string) => setSelectedStore(value as "guardians" | "jaihom")}
                className="border rounded-md"
              >
                <ToggleGroupItem value="guardians" className="px-3 py-2">
                  Guardians
                </ToggleGroupItem>
                <ToggleGroupItem value="jaihom" className="px-3 py-2">
                  Jaihom
                </ToggleGroupItem>
              </ToggleGroup>
            )}
            <Button onClick={addNewInvoice} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva Factura
            </Button>
          </div>
          {/* <div className="h-[95%] bg-blue-200 flex"></div> */}
          <div className='flex flex-col h-full overflow-hidden'>
            <div className='w-full h-[410px] flex relative flex-shrink-0'>
              {filteredInvoices.length > 0 ? (
                <Carousel
                  opts={{
                    align: (isMobile ? "center" : "start") as "center" | "start", // Centrado en móvil, inicio en web
                    skipSnaps: false,
                    dragFree: false,
                  }}
                  className="w-full max-w-full flex-1 flex overflow-hidden absolute"
                >
                  <CarouselContent className='w-full h-full -ml-0 md:-ml-4'>
                    {filteredInvoices.map((invoice) => (
                      <CarouselItem key={invoice._id} className="pl-0 md:pl-4 basis-full md:basis-[340px] h-full">
                        <InvoiceCard
                          setLocalInvoices={setLocalInvoices}
                          invoice={invoice}
                          onUpdate={(updatedInvoice) => updateLocalInvoice(invoice._id, updatedInvoice)}
                          onRemove={() => removeInvoice(invoice._id)}
                          tasaBCV={tasaBCV?.tasa || 0}
                          store={selectedStore}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className={`${state === "collapsed" ? "md:translate-x-[90px]" : "md:translate-x-[266px]"} fixed -left-1.5 md:left-0 md:translate-y-[54px] bg-white hover:bg-gray-50 border border-gray-300 shadow-md"`} />
                  <CarouselNext className="fixed -right-1.5 md:right-0  md:-translate-x-[10px] md:translate-y-[54px] bg-white hover:bg-gray-50 border border-gray-300 shadow-md" />
                </Carousel>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500 w-full">
                  <div className="text-center">
                    <Receipt className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg mb-2">No hay facturas</p>
                    <p className="text-sm text-gray-400">Haz clic en "Nueva Factura" para crear una nueva factura</p>
                  </div>
                </div>
              )}
            </div>
            <div id='invoices-list-container' className='flex justify-end items-end w-full mt-2 md:mt-0'>
              <div id='invoices-list' className='flex flex-col w-full md:w-[320px] md:max-h-[125px]'>
                {invoices.map((invoice, index) => (
                  <li key={invoice._id} className='w-full flex items-center text-xs text-primary hover:bg-accent flex-shrink-0'>
                    <span className={`flex items-center w-32 h-6 px-2 justify-start border-l border-r border-b border-primary ${index === 0 ? 'border-t' : ''}`}>{new Date(invoice.createdAt).toLocaleString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                    <span className={`flex items-center flex-1 h-6 px-2 justify-end border-r border-b border-primary ${index === 0 ? 'border-t' : ''}`}>
                      {formatNumber(invoice.totalBs)}

                    </span>
                    <span className={`flex items-center w-20 h-6 px-2 justify-end border-r border-b border-primary ${index === 0 ? 'border-t' : ''}`}>
                      {formatNumber(invoice.totalUsd)}
                    </span>
                  </li>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
