"use client";

import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Invoice, InvoiceItem } from '@/lib/schemas/invoice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InvoiceCardProps {
  invoice: Invoice;
  onUpdate: (updatedInvoice: Partial<Invoice>) => void;
  onRemove: () => void;
  onPay: () => void;
  tasaBCV: number;
}

export function InvoiceCard({
  invoice,
  onUpdate,
  onRemove,
  onPay,
  tasaBCV
}: InvoiceCardProps) {
  const [localInvoice, setLocalInvoice] = useState<Invoice>(invoice);

  useEffect(() => {
    setLocalInvoice(invoice);
  }, [invoice]);

  const updateField = (field: keyof Invoice, value: any) => {
    const updated = { ...localInvoice, [field]: value };
    setLocalInvoice(updated);
    onUpdate({ [field]: value });
  };

  const updateItem = (itemId: string, field: keyof InvoiceItem, value: any) => {
    const updatedItems = localInvoice.items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };

        // Recalcular total del item
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }

        return updatedItem;
      }
      return item;
    });

    const updated = { ...localInvoice, items: updatedItems };

    // Recalcular totales
    const totalBs = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const totalUsd = totalBs / tasaBCV;

    updated.totalBs = totalBs;
    updated.totalUsd = Number(totalUsd.toFixed(2));

    setLocalInvoice(updated);
    onUpdate(updated);
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      quantity: 1,
      description: '',
      unitPrice: 0,
      total: 0
    };

    const updated = {
      ...localInvoice,
      items: [...localInvoice.items, newItem]
    };

    setLocalInvoice(updated);
    onUpdate(updated);
  };

  const removeItem = (itemId: string) => {
    const updatedItems = localInvoice.items.filter(item => item.id !== itemId);

    if (updatedItems.length === 0) {
      // Si no hay items, agregar uno vacío
      updatedItems.push({
        id: `item-${Date.now()}`,
        quantity: 1,
        description: '',
        unitPrice: 0,
        total: 0
      });
    }

    const updated = {
      ...localInvoice,
      items: updatedItems
    };

    // Recalcular totales
    const totalBs = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const totalUsd = totalBs / tasaBCV;

    updated.totalBs = totalBs;
    updated.totalUsd = Number(totalUsd.toFixed(2));

    setLocalInvoice(updated);
    onUpdate(updated);
  };

  return (
    <div className="w-[300px] h-[380px] bg-white border-2 border-gray-200 rounded-lg shadow-lg flex flex-col relative">
      {/* Close Button */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm z-10"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Factura</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${localInvoice.store === 'guardians'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-green-100 text-green-800'
            }`}>
            {localInvoice.store === 'guardians' ? 'Guardians' : 'Jaihom'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {/* Client Information */}
        <div className="space-y-2">
          <div>
            <Label htmlFor={`clientName-${invoice._id}`} className="text-sm font-medium">
              Cliente:
            </Label>
            <Input
              id={`clientName-${invoice._id}`}
              value={localInvoice.clientName}
              onChange={(e) => updateField('clientName', e.target.value)}
              placeholder="Nombre del cliente"
              className="h-8"
            />
          </div>

          <div>
            <Label htmlFor={`clientId-${invoice._id}`} className="text-sm font-medium">
              Cédula:
            </Label>
            <Input
              id={`clientId-${invoice._id}`}
              value={localInvoice.clientId}
              onChange={(e) => updateField('clientId', e.target.value)}
              placeholder="Cédula o RIF"
              className="h-8"
            />
          </div>

          <div>
            <Label htmlFor={`clientPhone-${invoice._id}`} className="text-sm font-medium">
              Teléfono:
            </Label>
            <Input
              id={`clientPhone-${invoice._id}`}
              value={localInvoice.clientPhone}
              onChange={(e) => updateField('clientPhone', e.target.value)}
              placeholder="Número de teléfono"
              className="h-8"
            />
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-1 text-xs font-medium text-gray-600">
            <div>CANI</div>
            <div>DESCRIPCION</div>
            <div>P.U.</div>
            <div>I.BS.</div>
          </div>

          <div className="space-y-1">
            {localInvoice.items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-4 gap-1">
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value) || 0)}
                  className="h-6 text-xs"
                  min="0"
                />
                <Input
                  value={item.description}
                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  placeholder="Descripción"
                  className="h-6 text-xs"
                />
                <Input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value) || 0)}
                  className="h-6 text-xs"
                  min="0"
                  step="0.01"
                />
                <div className="flex items-center gap-1">
                  <Input
                    value={item.total.toFixed(2)}
                    readOnly
                    className="h-6 text-xs bg-gray-100"
                  />
                  {localInvoice.items.length > 1 && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded flex items-center justify-center"
                    >
                      <Trash2 className="w-2 h-2" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addItem}
            className="w-full flex items-center justify-center gap-1 text-blue-600 hover:text-blue-700 text-xs py-1"
          >
            <Plus className="w-3 h-3" />
            Agregar item
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">TOTAL:</span>
          <span className="font-bold">{localInvoice.totalBs.toFixed(2)} Bs.</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-medium">T DLRS:</span>
          <span className="font-bold">${localInvoice.totalUsd.toFixed(2)}</span>
        </div>

        <Button
          onClick={onPay}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
          disabled={localInvoice.totalBs === 0}
        >
          PAGAR
        </Button>
      </div>
    </div>
  );
}
