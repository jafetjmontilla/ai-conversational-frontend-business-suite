"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Invoice } from '@/lib/schemas/invoice';

interface PaymentMethod {
  id: string;
  name: string;
  amountBs: number;
  amountUsd: number;
  inputValue: string;
  changeValue: string;
}

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  tasaBCV: number;
  onProcessPayment?: (paymentData: any) => void;
}

export function PaymentDialog({ isOpen, onClose, invoice, tasaBCV, onProcessPayment }: PaymentDialogProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: 'cash-bs', name: 'Efectivo Bs.', amountBs: 0, amountUsd: 0, inputValue: '', changeValue: '' },
    { id: 'point', name: 'Punto', amountBs: 0, amountUsd: 0, inputValue: '', changeValue: '' },
    { id: 'mobile-transfer', name: 'Pago Móvil o Transferencia', amountBs: 0, amountUsd: 0, inputValue: '', changeValue: '' },
    { id: 'cash-usd', name: 'Efectivo Dólar', amountBs: 0, amountUsd: 0, inputValue: '', changeValue: '' },
    { id: 'zelle', name: 'Zelle', amountBs: 0, amountUsd: 0, inputValue: '', changeValue: '' },
    { id: 'binance', name: 'Binance', amountBs: 0, amountUsd: 0, inputValue: '', changeValue: '' }
  ]);

  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    const total = paymentMethods.reduce((sum, method) => sum + method.amountUsd, 0);
    setTotalPaid(total);
  }, [paymentMethods]);

  const updatePaymentMethod = (id: string, field: 'inputValue' | 'changeValue', value: string) => {
    setPaymentMethods(prev =>
      prev.map(method => {
        if (method.id === id) {
          const updated = { ...method, [field]: value };

          const inputAmount = parseFloat(updated.inputValue) || 0;
          const changeAmount = parseFloat(updated.changeValue) || 0;

          if (method.id === 'cash-bs' || method.id === 'point' || method.id === 'mobile-transfer') {
            // Métodos en Bs.
            updated.amountBs = inputAmount;
            updated.amountUsd = inputAmount / tasaBCV;
          } else if (method.id === 'cash-usd') {
            // Efectivo en dólares
            updated.amountUsd = inputAmount - changeAmount;
            updated.amountBs = updated.amountUsd * tasaBCV;
          } else {
            // Zelle y Binance (solo USD)
            updated.amountUsd = inputAmount;
            updated.amountBs = inputAmount * tasaBCV;
          }

          return updated;
        }
        return method;
      })
    );
  };

  const handleProcessPayment = () => {
    // Filtrar solo los campos que el backend espera
    const cleanPaymentMethods = paymentMethods
      .filter(method => method.amountBs > 0 || method.amountUsd > 0)
      .map(method => ({
        id: method.id,
        name: method.name,
        amountBs: method.amountBs,
        amountUsd: method.amountUsd
      }));

    const paymentData = {
      invoice,
      paymentMethods: cleanPaymentMethods,
      totalPaid,
      tasaBCV
    };

    if (onProcessPayment) {
      onProcessPayment(paymentData);
    } else {
      console.log('Procesando pago:', paymentData);
      onClose();
    }
  };

  const isPaymentComplete = totalPaid >= invoice.totalUsd;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Procesar Pago</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Total Amount */}
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-blue-800">
                Bs. {invoice.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-2xl font-bold text-green-600">
                $ {invoice.totalUsd.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">
                Tasa: {tasaBCV.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{method.name}</h3>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {method.amountBs > 0 && `${method.amountBs.toFixed(2)} Bs.`}
                    </div>
                    <div className="font-medium">
                      {method.amountUsd > 0 && `$${method.amountUsd.toFixed(2)}`}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`${method.id}-input`} className="text-sm">
                      Ingreso:
                    </Label>
                    <Input
                      id={`${method.id}-input`}
                      type="number"
                      value={method.inputValue}
                      onChange={(e) => updatePaymentMethod(method.id, 'inputValue', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  {(method.id === 'cash-bs' || method.id === 'cash-usd') && (
                    <div>
                      <Label htmlFor={`${method.id}-change`} className="text-sm">
                        Vuelto:
                      </Label>
                      <Input
                        id={`${method.id}-change`}
                        type="number"
                        value={method.changeValue}
                        onChange={(e) => updatePaymentMethod(method.id, 'changeValue', e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Total Paid */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total pagado:</span>
              <div className={`px-4 py-2 rounded-lg font-bold text-lg ${isPaymentComplete
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
                }`}>
                ${totalPaid.toFixed(2)}
              </div>
            </div>

            {!isPaymentComplete && (
              <div className="text-sm text-red-600 mt-2">
                Faltan ${(invoice.totalUsd - totalPaid).toFixed(2)} por pagar
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleProcessPayment}
              disabled={!isPaymentComplete}
              className={`${isPaymentComplete
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400 cursor-not-allowed'
                }`}
            >
              Procesar Pago
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
