"use client";

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Invoice, InvoiceItem } from '@/lib/schemas/invoice';
import { formatNumber } from './InvoiceCard';
import { fetchApiImgbbV1 } from '@/lib/Fetching';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { InputContable } from '@/components/inputContable';

interface PaymentMethod {
  id: string;
  name: string;
  amountBs: number;
  amountUsd: number;
  inputValue: number | null;
  changeValue: number | null;
  urlSuport?: string;
  uploadingImage?: boolean;
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
    { id: 'cash-bs', name: 'Efectivo Bs.', amountBs: 0, amountUsd: 0, inputValue: null, changeValue: null, urlSuport: undefined, uploadingImage: false },
    { id: 'point', name: 'Punto', amountBs: 0, amountUsd: 0, inputValue: null, changeValue: null, urlSuport: undefined, uploadingImage: false },
    { id: 'mobile-transfer', name: 'Pago Móvil o Transferencia', amountBs: 0, amountUsd: 0, inputValue: null, changeValue: null, urlSuport: undefined, uploadingImage: false },
    { id: 'cash-usd', name: 'Efectivo Dólar', amountBs: 0, amountUsd: 0, inputValue: null, changeValue: null, urlSuport: undefined, uploadingImage: false },
    { id: 'zelle', name: 'Zelle', amountBs: 0, amountUsd: 0, inputValue: null, changeValue: null, urlSuport: undefined, uploadingImage: false },
    { id: 'binance', name: 'Binance', amountBs: 0, amountUsd: 0, inputValue: null, changeValue: null, urlSuport: undefined, uploadingImage: false }
  ]);

  const [totalPaidBs, setTotalPaidBs] = useState(0);
  const [totalPaidUsd, setTotalPaidUsd] = useState(0);

  useEffect(() => {
    console.log("-----------------------------------------")
    console.log("totalPaidBs", totalPaidBs)
    console.log("totalPaidUsd", totalPaidUsd)
    paymentMethods.map(method => {
      method.amountBs > 0 && console.log("method", method.id, method.amountBs, "Bs", "$", method.amountUsd)
    })
    console.log("invoice.totalBs", invoice.totalBs)
    console.log("invoice.totalUsd", invoice.totalUsd)
  }, [totalPaidBs, invoice])


  useEffect(() => {
    const totalBs = paymentMethods.reduce((sum, method) => {
      return sum + method.amountBs;
    }, 0);
    setTotalPaidBs(totalBs);
    const totalUsd = paymentMethods.reduce((sum, method) => {
      return sum + method.amountUsd;
    }, 0);
    setTotalPaidUsd(totalUsd);
  }, [paymentMethods]);

  const updatePaymentMethod = (id: string, field: 'inputValue' | 'changeValue' | 'urlSuport' | 'uploadingImage', value: number | null | string | boolean) => {
    setPaymentMethods(prev =>
      prev.map(method => {
        if (method.id === id) {
          const updated = { ...method, [field]: value };

          const inputAmount = updated.inputValue ?? 0;
          const changeAmount = updated.changeValue ?? 0;

          if (method.id === 'cash-bs' || method.id === 'point' || method.id === 'mobile-transfer') {
            // Métodos en Bs.
            updated.amountBs = inputAmount;
            updated.amountUsd = parseFloat((inputAmount / tasaBCV).toFixed(2));
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

  const handleImageUpload = async (methodId: string, file: File) => {
    // Actualizar estado de carga
    updatePaymentMethod(methodId, 'uploadingImage', true);

    try {
      const result = await fetchApiImgbbV1(file);
      if (result.success && result.data) {
        updatePaymentMethod(methodId, 'urlSuport', result.data.image_url);
      } else {
        alert('Error al subir la imagen. Por favor, inténtalo de nuevo.');
      }
    } catch (error) {
      alert('Error al subir la imagen. Por favor, inténtalo de nuevo.');
    } finally {
      updatePaymentMethod(methodId, 'uploadingImage', false);
    }
  };

  const handleFileChange = (methodId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecciona un archivo de imagen válido.');
        return;
      }

      // Validar tamaño (máximo 5MB)
      // if (file.size > 5 * 1024 * 1024) {
      //   alert('La imagen es demasiado grande. El tamaño máximo permitido es 5MB.');
      //   return;
      // }

      handleImageUpload(methodId, file);
    }
  };

  const removeImage = (methodId: string) => {
    updatePaymentMethod(methodId, 'urlSuport', '');
  };

  const handleProcessPayment = () => {
    // Filtrar solo los campos que el backend espera
    const cleanPaymentMethods = paymentMethods
      .filter(method => method.amountBs > 0 || method.amountUsd > 0)
      .map(method => ({
        id: method.id,
        name: method.name,
        amountBs: method.amountBs,
        amountUsd: method.amountUsd,
        urlSuport: method.urlSuport
      }));

    const items = invoice.items.reduce((acc: InvoiceItem[], item) => {
      item.total && acc.push(item)
      return acc;
    }, [])
    const paymentData = {
      invoice: { ...invoice, items },
      paymentMethods: cleanPaymentMethods,
      totalPaid: totalPaidUsd,
      tasaBCV
    };
    console.log("paymentData", paymentData);
    if (onProcessPayment) {
      onProcessPayment(paymentData);
    } else {
      onClose();
    }
  };

  // Validar si se han subido las imágenes requeridas
  const hasRequiredImages = () => {
    const methodsRequiringImage = paymentMethods.filter(method =>
      ['mobile-transfer', 'zelle', 'binance'].includes(method.id) &&
      method.amountUsd > 0
    );

    return methodsRequiringImage.every(method => method.urlSuport);
  };

  const isPaymentComplete = totalPaidBs >= invoice.totalBs;
  const canProcessPayment = isPaymentComplete && hasRequiredImages();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[350px] overflow-y-auto">
        <DialogHeader className="flex flex-row justify-between space-y-1.5 text-center sm:text-left">
          <DialogTitle className="text-xl font-bold">Procesar Pago</DialogTitle>
          <DialogDescription className="text-[10px] text-primary mr-10">
            Tasa: {formatNumber(tasaBCV)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          {/* Total Amount */}
          <div className="bg-blue-50 dark:bg-gray-300 rounded-md mb-2">
            <div className="text-center">
              <div className="flex">
                <div className="w-1/2 text-xl font-bold text-blue-800">
                  {formatNumber(invoice.totalBs)} Bs.
                </div>
                <div className="w-1/2 text-xl font-bold text-green-600">
                  $ {formatNumber(invoice.totalUsd)}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-1">
            {paymentMethods.map((method) => {
              const requiresImage = ['mobile-transfer', 'zelle', 'binance'].includes(method.id);

              return (
                <div key={method.id} className="text-sm relative">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{method.name}</span>
                    <div className="text-right absolute right-0 bottom-0">
                      <div className="text-xs dark:text-gray-300">
                        {method.amountBs > 0 && `${formatNumber(method.amountBs)} Bs.`}
                      </div>
                      <div className="font-medium">
                        {method.amountUsd > 0 && `$ ${formatNumber(method.amountUsd)}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 items-end ml-4">
                    <div className="flex flex-col">
                      <label htmlFor={`${method.id}-input`} className="text-[10px]">
                        Ingreso:
                      </label>
                      <InputContable
                        id={`${method.id}-input`}
                        value={method.inputValue}
                        onChange={(value) => updatePaymentMethod(method.id, 'inputValue', value)}
                        autoComplete='off'
                        className="text-sm text-right w-[95px] px-2 py-0.5 rounded-[4px] border-[1px] border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    {(method.id === 'cash-bs' || method.id === 'cash-usd') && (
                      <div className="flex flex-col">
                        <label htmlFor={`${method.id}-change`} className="text-[10px]">
                          Vuelto:
                        </label>
                        <InputContable
                          id={`${method.id}-change`}
                          value={method.changeValue}
                          onChange={(value) => updatePaymentMethod(method.id, 'changeValue', value)}
                          autoComplete='off'
                          className="text-sm text-right w-[95px] px-2 py-0.5 rounded-[4px] border-[1px] border-gray-300 dark:border-gray-600"
                        />
                      </div>
                    )}
                    {requiresImage && (
                      <div className="flex flex-col">
                        <label className="text-[10px]">
                          Soporte:
                        </label>
                        <div className="flex gap-1">
                          {method.urlSuport ? (
                            <div className="flex items-center gap-1">
                              <img
                                src={method.urlSuport}
                                alt="Soporte"
                                className="w-8 h-8 object-cover rounded border"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeImage(method.id)}
                                className="h-8 px-2 text-xs"
                              >
                                <Trash2 className="w-6 h-6 text-gray-400" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(method.id, e)}
                                className="hidden"
                                capture="environment"
                                id={`${method.id}-image`}
                                disabled={method.uploadingImage}
                              />
                              <label
                                htmlFor={`${method.id}-image`}
                                className={`w-8 h-8 border-[1px] border-gray-400 rounded flex items-center justify-center cursor-pointer text-xs ${method.uploadingImage
                                  ? 'opacity-50 cursor-not-allowed'
                                  : 'hover:border-gray-400'
                                  }`}
                              >
                                {method.uploadingImage
                                  ? <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                                  : <Camera className="w-6 h-6 text-gray-400" />
                                }
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Paid */}
          <div className="bg-green-300 dark:bg-gray-300 rounded-md px-3 py-1.5   space-y-1 h-14">
            <div className="flex justify-between items-center gap-1">
              <span className="font-semibold text-primary dark:text-primary-foreground text-sm">Total pagado:</span>
              <div className={`px-2 flex-1 rounded-lg font-bold text-sm h-6 flex items-center justify-center ${canProcessPayment
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
                }`}>
                {formatNumber(totalPaidBs)} Bs.
              </div>
              <div className={`px-2 w-[78px] rounded-lg font-bold text-sm h-6 flex items-center justify-center ${canProcessPayment
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
                }`}>
                $ {formatNumber(totalPaidUsd)}
              </div>
            </div>

            <div className={`text-sm text-red-600 font-semibold w-full transition-opacity duration-700 ${canProcessPayment ? 'opacity-0' : 'opacity-100'}`}>

              {!isPaymentComplete
                ?
                `Faltan ${formatNumber((invoice.totalBs - totalPaidBs))} Bs. o $ ${formatNumber(invoice.totalUsd - totalPaidUsd)} por pagar`
                : !hasRequiredImages()
                  ? 'Requerido subir imágen de soporte de pago'
                  : ''
              }
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
              disabled={!canProcessPayment}
              className={`${canProcessPayment
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
