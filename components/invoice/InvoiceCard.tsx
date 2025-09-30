"use client";

import { useState, useEffect, SetStateAction, Dispatch } from 'react';
import { XIcon, X } from 'lucide-react';
import { Invoice, InvoiceItem } from '@/lib/schemas/invoice';
import { Button } from '@/components/ui/button';
import { InventorySearch, InventoryItem } from './InventorySearch';
import { PaymentDialog } from './PaymentDialog';
import { useInvoices } from '@/hooks/useInvoices';

interface InvoiceCardProps {
  invoice: Invoice;
  onUpdate: (updatedInvoice: Partial<Invoice>) => void;
  onRemove: () => void;
  tasaBCV: number;
  store?: 'guardians' | 'jaihom';
  setLocalInvoices: (Dispatch<SetStateAction<Invoice[]>>)
}

// Función para formatear números con separadores de miles (.) y decimales (,)
export const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toLocaleString('es-VE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

export function InvoiceCard({ invoice, onUpdate, onRemove, tasaBCV, store = "guardians", setLocalInvoices }: InvoiceCardProps) {
  const [localInvoice, setLocalInvoice] = useState<Invoice>(invoice);
  const [disablePay, setDisablePay] = useState(true);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const { processPayment } = useInvoices();
  const [tableItems, setTableItems] = useState<InvoiceItem[]>(invoice.items);

  const handlePay = (invoice: Invoice) => {
    setIsPaymentDialogOpen(true);
  };

  const handleProcessPayment = async (paymentData: any) => {
    console.log(100061, paymentData)
    const success = await processPayment(paymentData);
    if (success) {
      // Eliminar la factura local después de procesar el pago
      setLocalInvoices(prev =>
        prev.filter(invoice => invoice._id !== localInvoice._id)
      );
      setIsPaymentDialogOpen(false);
    }
  };

  useEffect(() => {
    // Solo sincronizar si el invoice._id cambió (nueva factura) o si es la primera carga
    const invoiceIdChanged = localInvoice._id !== invoice._id;
    setDisablePay(localInvoice.totalUsd === 0);
    if (!invoiceIdChanged) {
      // Si es la misma factura, no hacer nada para preservar tableItems y localInvoice
      return;
    }
    // Si cambió el _id, es una nueva factura, reconstruir todo
    setLocalInvoice(invoice);
    // Sincronizar tableItems con los items de la factura
    if (invoice.items && invoice.items.length > 0) {
      const updatedTableItems = createEmptyItems();
      // Cargar items existentes en las primeras posiciones
      invoice.items.forEach((item, index) => {
        if (index < 10) {
          updatedTableItems[index] = {
            id: `item-${index}`,
            quantity: item.quantity || 0,
            description: item.description || '',
            unitPrice: item.unitPrice || 0,
            total: item.total || 0,
            inventoryItem: null
          };
        }
      });
      setTableItems(updatedTableItems);
    } else {
      // Si no hay items, usar tabla vacía
      setTableItems(createEmptyItems());
    }
  }, [invoice]);

  const updateField = (field: keyof Invoice, value: any) => {
    const updated = { ...localInvoice, [field]: value };
    setLocalInvoice(updated);
    onUpdate({ [field]: value });
  };

  // Crear array de 10 items vacíos para la tabla
  const createEmptyItems = () => {
    const items = [];
    for (let i = 0; i < 10; i++) {
      items.push({
        id: `item-${i}`,
        quantity: 0,
        description: '',
        unitPrice: 0,
        total: 0,
        inventoryItem: null as InventoryItem | null
      });
    }
    return items;
  };

  // const isUpdatingRef = useRef(false);

  // Función para actualizar un item de la tabla
  const updateTableItem = (itemId: string, field: string, value: any) => {
    setTableItems(prevItems => {
      const updatedItems = prevItems.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          // Si se elimina la descripción, también borrar la cantidad
          if (field === 'description' && (!value || value.trim() === '')) {
            updatedItem.quantity = 0;
            updatedItem.unitPrice = 0;
            updatedItem.total = 0;
            updatedItem.inventoryId = undefined;
          }
          // Si se actualiza cantidad o precio unitario, recalcular total
          if (field === 'quantity' || field === 'unitPrice') {
            const quantity = updatedItem.quantity || 0;
            const unitPrice = updatedItem.unitPrice || 0;
            updatedItem.total = quantity * unitPrice;
          }
          return updatedItem;
        }
        return item;
      });

      return updatedItems;
    });
  };

  // Efecto para recalcular totales cuando cambian los items de la tabla
  useEffect(() => {
    const totalBs = tableItems.reduce((sum, item) => {
      return sum + (item.total || 0);
    }, 0);
    const totalUsd = totalBs / tasaBCV;
    // Convertir tableItems a InvoiceItem format
    const invoiceItems: InvoiceItem[] = tableItems
      .filter(item => item.description.trim() !== '' || item.quantity > 0)
      .map(item => ({
        id: item.id,
        quantity: item.quantity || 0,
        description: item.description || '',
        unitPrice: item.unitPrice || 0,
        total: item.total || 0,
        inventoryId: item?.inventoryId || ''
      }));
    // Para store guardians, los totales deben mostrarse en USD (divididos por tasaBCV)
    // Para store jaihom, los totales se mantienen en Bs
    const updatedInvoice = {
      ...localInvoice,
      items: invoiceItems,
      totalBs: store === "guardians" ? totalUsd : totalBs,
      totalUsd: store === "guardians" ? totalUsd : Number(totalUsd.toFixed(2))
    };
    // isUpdatingRef.current = true;
    setLocalInvoice(updatedInvoice);
    onUpdate(updatedInvoice);
  }, [tableItems, tasaBCV, store]);

  // Función para manejar la selección de un artículo del inventario
  const handleInventoryItemSelect = (itemId: string, inventoryItem: InventoryItem) => {
    setTableItems(prevItems => {
      const updatedItems = prevItems.map(item => {
        if (item.id === itemId) {
          const updatedItem = {
            ...item,
            description: inventoryItem.description,
            unitPrice: inventoryItem.salesPrice,
            inventoryId: inventoryItem._id
          };
          // Recalcular total si hay cantidad
          const quantity = updatedItem.quantity || 0;
          const unitPrice = inventoryItem.salesPrice;
          updatedItem.total = quantity * unitPrice;
          return updatedItem;
        }
        return item;
      });
      return updatedItems;
    });
  };

  const handleInputChange = (option: any, e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Si es tipo onlyNumbers, solo permitir números
    if (option.type === 'onlyNumbers') {
      value = value.replace(/[^0-9]/g, '');
    }
    // Si es tipo phone, permitir + solo al inicio y el resto números
    if (option.type === 'phone') {
      // Si empieza con +, mantener el + y solo números después
      if (value.startsWith('+')) {
        value = '+' + value.slice(1).replace(/[^0-9]/g, '');
      } else {
        // Si no empieza con +, solo números
        value = value.replace(/[^0-9]/g, '');
      }
    }
    updateField(option.field as keyof Invoice, value);
  };

  const headerOptions = [
    {
      label: 'Cliente',
      field: 'clientName',
      value: localInvoice.clientName,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleInputChange({ field: 'clientName', type: 'text' }, e),
      size: 'col-span-2',
      type: 'text',
      maxLength: 34
    },
    {
      label: 'Cédula',
      field: 'clientId',
      value: localInvoice.clientId,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleInputChange({ field: 'clientId', type: 'onlyNumbers' }, e),
      size: 'col-span-1',
      type: 'onlyNumbers',
      maxLength: 10
    },
    {
      label: 'Teléfono',
      field: 'clientPhone',
      value: localInvoice.clientPhone,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleInputChange({ field: 'clientPhone', type: 'phone' }, e),
      size: 'col-span-1',
      type: 'phone',
      maxLength: 13
    }
  ]

  return (
    <div className="w-full max-w-full md:max-w-[340px] pb-4 bg-card rounded-sm shadow-lg flex flex-col relative p-2 pt-5 border-[1px] border-ring mx-auto">
      {/* Close Button */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm z-10"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      {/* Client Information */}
      <div className="grid grid-cols-2 gap-1">
        {headerOptions.map((option) => (
          <div key={option.label} className={`${option.size} flex flex-col px-1 relative`}>
            <label htmlFor={`${option.label}-${invoice._id}`} className="text-xs font-medium text-primary">
              {option.label}:
            </label>
            <input
              id={`${option.label}-${invoice._id}`}
              type="text"
              value={option.value}
              onChange={option.onChange}
              placeholder={option.label}
              maxLength={option.maxLength}
              className={`pl-2 pr-6 h-6 bg-white dark:bg-gray-100 border-[1px] border-ring rounded-[6px] text-sm text-gray-700 inputInvoice`}
            />
            <div onClick={() => updateField(option.field as keyof Invoice, '')} className='w-5 h-5 flex items-center justify-center absolute top-[18px] right-1 text-gray-700 cursor-pointer hover:font-semibold'>
              <XIcon className='w-3 h-3' />
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 my-2">
        {/* Items Table */}
        <div className="">
          <table className="w-full text-xs border-[1px] border-ring">
            <thead>
              <tr className='w-full'>
                <th className='w-[45px] border-[1px] border-ring'>Cant.</th>
                <th className='border-[1px] border-ring'>Descripción</th>
                <th className='w-[45px] border-[1px] border-ring'>P.U.</th>
                <th className='w-[60px] border-[1px] border-ring'>Impt.</th>
              </tr>
            </thead>
            <tbody className='text-gray-700'>
              {tableItems.map((item, index) => (
                <tr key={item.id}>
                  <td className='border-[1px] border-ring bg-white dark:bg-gray-100 p-0'>
                    <input
                      id={`quantity-${index}`}
                      value={item.quantity !== 0 ? item.quantity : ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        updateTableItem(item.id, 'quantity', Number(value) || 0)
                      }}
                      autoComplete='off'
                      className='w-full bg-white dark:bg-gray-100 text-center border-0 px-1'
                    />
                  </td>
                  <td className='border-[1px] border-ring bg-white dark:bg-gray-100 p-0'>
                    <InventorySearch
                      value={item.description}
                      onChange={(value) => updateTableItem(item.id, 'description', value)}
                      onSelectItem={(inventoryItem) => handleInventoryItemSelect(item.id, inventoryItem)}
                      className="border-0"
                      store={store}
                      tasaBCV={tasaBCV}
                    />
                  </td>
                  <td className='border-[1px] border-ring bg-white dark:bg-gray-100 p-0'>
                    <input
                      id={`unitPrice-${index}`}
                      type="text"
                      value={item.unitPrice !== 0 ? store === "guardians" ? formatNumber(item.unitPrice / tasaBCV) : formatNumber(item.unitPrice, 0) : ""}
                      readOnly
                      className='w-full bg-gray-100 dark:bg-gray-100 text-right border-0 px-1'
                    />
                  </td>
                  <td className='border-[1px] border-ring bg-white dark:bg-gray-100 p-0'>
                    <input
                      id={`total-${index}`}
                      type="text"
                      value={item.total !== 0 ? store === "guardians" ? formatNumber(item.total / tasaBCV) : formatNumber(item.total) : ""}
                      readOnly
                      className='w-full bg-gray-100 dark:bg-gray-100 text-right border-0 px-1'
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={`flex ${store === "guardians" ? "flex-col-reverse" : "flex-col"}`}>
            <div className="flex justify-between text-xs">
              <div className="flex-1" />
              <span className="font-medium">TOTAL Bs:</span>
              <span className="font-bold w-[60px] text-right pr-1">
                {store === "guardians"
                  ? formatNumber(tableItems.reduce((sum, item) => sum + (item.total || 0), 0))
                  : formatNumber(tableItems.reduce((sum, item) => sum + (item.total || 0), 0))
                }
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <div className="flex-1" />
              <span className="font-medium">TOTAL $:</span>
              <span className="font-bold w-[60px] text-right pr-1">
                {formatNumber(tableItems.reduce((sum, item) => sum + (item.total || 0), 0) / tasaBCV)}
              </span>
            </div>
          </div>
          <Button
            onClick={() => handlePay(localInvoice)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
            disabled={disablePay}
          >
            PAGAR
          </Button>
        </div>
      </div>
      {/* Payment Dialog */}
      {localInvoice && (
        <PaymentDialog
          isOpen={isPaymentDialogOpen}
          onClose={() => setIsPaymentDialogOpen(false)}
          invoice={localInvoice}
          tasaBCV={tasaBCV || 175}
          store={store}
          onProcessPayment={handleProcessPayment}
        />
      )}
    </div>
  );
}
