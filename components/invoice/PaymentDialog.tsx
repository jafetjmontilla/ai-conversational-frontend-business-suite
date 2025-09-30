"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  store?: 'guardians' | 'jaihom';
  onProcessPayment?: (paymentData: any) => void;
}

export function PaymentDialog({ isOpen, onClose, invoice, tasaBCV, store = 'jaihom', onProcessPayment }: PaymentDialogProps) {
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
      <DialogContent className="w-[350px] overflow-y-auto">
        <DialogHeader className="flex flex-row justify-between space-y-1.5 text-center sm:text-left">
          <DialogTitle className="text-xl font-bold">Procesar Pago</DialogTitle>
          <DialogDescription className="text-sm text-primary mr-10">
            Tasa: {tasaBCV.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          {/* Total Amount */}
          <div className="bg-blue-50 dark:bg-gray-300 rounded-md mb-2">
            <div className="text-center">
              {store === "guardians" ? (
                <div className="flex">
                  <div className="w-1/2 text-xl font-bold text-green-600">
                    $ {invoice.totalUsd.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true })}
                  </div>
                  <div className="w-1/2 text-xl font-bold text-blue-800">
                    Bs. {(invoice.totalUsd * tasaBCV).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true })}
                  </div>
                </div>
              ) : (
                <div className="flex">
                  <div className="w-1/2 text-xl font-bold text-blue-800">
                    Bs. {invoice.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true })}
                  </div>
                  <div className="w-1/2 text-xl font-bold text-green-600">
                    $ {invoice.totalUsd.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-1">
            {paymentMethods.map((method) => (
              <div key={method.id} className="text-sm relative">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{method.name}</span>
                  <div className="text-right absolute right-0 bottom-0">
                    <div className="text-xs dark:text-gray-300">
                      {method.amountBs > 0 && `${method.amountBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true })} Bs.`}
                    </div>
                    <div className="font-medium">
                      {method.amountUsd > 0 && `$${method.amountUsd.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true })}`}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 items-end ml-4">
                  <div className="flex flex-col">
                    <label htmlFor={`${method.id}-input`} className="text-[10px]">
                      Ingreso:
                    </label>
                    <input
                      id={`${method.id}-input`}
                      type="text"
                      value={method.inputValue}
                      onChange={(e) => updatePaymentMethod(method.id, 'inputValue', e.target.value)}
                      autoComplete='off'
                      className="text-sm text-right w-[95px] px-2 py-0.5 rounded-[4px] border-[1px] border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  {(method.id === 'cash-bs' || method.id === 'cash-usd') && (
                    <div className="flex flex-col">
                      <label htmlFor={`${method.id}-change`} className="text-[10px]">
                        Vuelto:
                      </label>
                      <input
                        id={`${method.id}-change`}
                        type="text"
                        value={method.changeValue}
                        onChange={(e) => updatePaymentMethod(method.id, 'changeValue', e.target.value)}
                        autoComplete='off'
                        className="text-sm text-right w-[95px] px-2 py-0.5 rounded-[4px] border-[1px] border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Total Paid */}
          <div className="bg-green-300 dark:bg-gray-300 rounded-md px-4 py-1">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-primary dark:text-primary-foreground">Total pagado:</span>
              <div className={`px-4 rounded-lg font-bold text-lg ${isPaymentComplete
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
                }`}>
                ${totalPaid.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true })}
              </div>
            </div>

            <div className={`text-sm text-red-600 font-semibold w-full transition-opacity duration-700 ${isPaymentComplete ? 'opacity-0' : 'opacity-100'}`}>
              Faltan ${(invoice.totalUsd - totalPaid).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true })} por pagar
            </div>
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
