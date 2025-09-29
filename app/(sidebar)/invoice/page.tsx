"use client";

import { useState } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { InvoiceCard } from '@/components/invoice/InvoiceCard';
import { PaymentDialog } from '@/components/invoice/PaymentDialog';
import { useTasaBCV } from '@/hooks/useTasaBCV';
import { useInvoices } from '@/hooks/useInvoices';
import { Invoice } from '@/lib/schemas/invoice';
import { Store } from '@/components/invoice/StoreToggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export default function InvoicePage() {
  const [localInvoices, setLocalInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store>('guardians');
  const { tasaBCV } = useTasaBCV();
  const {
    invoices: savedInvoices,
    loading,
    error,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    processPayment
  } = useInvoices();

  const addNewInvoice = () => {
    const newInvoice: Invoice = {
      _id: `local-${Date.now()}`,
      clientName: '',
      clientId: '',
      clientPhone: '',
      items: [
        {
          id: `item-${Date.now()}`,
          quantity: 1,
          description: '',
          unitPrice: 0,
          total: 0
        }
      ],
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

  const removeInvoice = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres cerrar esta factura sin guardar?')) {
      // Si es una factura local, solo eliminarla del estado local
      if (id.startsWith('local-')) {
        setLocalInvoices(prev => prev.filter(invoice => invoice._id !== id));
      } else {
        // Es una factura guardada, eliminarla de la API
        await deleteInvoice(id);
      }
    }
  };

  const handlePay = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentDialogOpen(true);
  };

  const handleProcessPayment = async (paymentData: any) => {
    if (selectedInvoice) {
      const success = await processPayment(paymentData);

      if (success) {
        // Si era una factura local, eliminarla del estado local
        if (selectedInvoice._id.startsWith('local-')) {
          setLocalInvoices(prev =>
            prev.filter(invoice => invoice._id !== selectedInvoice._id)
          );
        }

        setIsPaymentDialogOpen(false);
        setSelectedInvoice(null);
      }
    }
  };

  // Filtrar facturas por store seleccionado
  const filteredSavedInvoices = savedInvoices.filter(invoice => invoice.store === selectedStore);
  const filteredLocalInvoices = localInvoices.filter(invoice => invoice.store === selectedStore);
  const allInvoices = [...filteredSavedInvoices, ...filteredLocalInvoices];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Facturación
            </CardTitle>
            <CardDescription>Crear y gestionar facturas</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-2 md:p-6">
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

          {/* Invoices Carousel */}
          {allInvoices.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {allInvoices.map((invoice) => (
                <InvoiceCard
                  key={invoice._id}
                  invoice={invoice}
                  onUpdate={(updatedInvoice) => updateLocalInvoice(invoice._id, updatedInvoice)}
                  onRemove={() => removeInvoice(invoice._id)}
                  onPay={() => handlePay(invoice)}
                  tasaBCV={tasaBCV?.tasa || 175}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Receipt className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">No hay facturas</p>
                <p className="text-sm text-gray-400">Haz clic en "Nueva Factura" para crear una nueva factura</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      {selectedInvoice && (
        <PaymentDialog
          isOpen={isPaymentDialogOpen}
          onClose={() => setIsPaymentDialogOpen(false)}
          invoice={selectedInvoice}
          tasaBCV={tasaBCV?.tasa || 175}
          onProcessPayment={handleProcessPayment}
        />
      )}
    </div>
  );
}
