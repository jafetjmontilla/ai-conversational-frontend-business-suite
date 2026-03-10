"use client";

import { useState, useEffect, SetStateAction, Dispatch } from 'react';
import { XIcon, X, Loader2 } from 'lucide-react';
import type { Invoice, InvoiceItem } from '@/lib/interfases';
import { Button } from '@/components/ui/button';
import { InventorySearch } from './InventorySearch';
import { PaymentDialog } from './PaymentDialog';
import { fetchApiV1, queries } from '@/lib/Fetching';
import { toast } from 'sonner';

interface InvoiceCardProps {
  invoice: Invoice;
  onUpdate: (updatedInvoice: Partial<Invoice>) => void;
  onRemove: () => void;
  exchangeRate: number;
  /** _id del negocio (Business document). */
  businessId: string;
  setLocalInvoices: Dispatch<SetStateAction<Invoice[]>>;
  onPaymentSuccess: () => void;
}

export const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toLocaleString('es-VE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

const roundToTwoDecimals = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

interface TableItem extends InvoiceItem {
  inventoryItem?: any;
}

export function InvoiceCard({ invoice, onUpdate, onRemove, exchangeRate, businessId, setLocalInvoices, onPaymentSuccess }: InvoiceCardProps) {
  const [localInvoice, setLocalInvoice] = useState<Invoice>(invoice);
  const [disablePay, setDisablePay] = useState(true);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [savingForPayment, setSavingForPayment] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);
  const [tableItems, setTableItems] = useState<TableItem[]>(invoice.items?.length ? invoice.items : createEmptyItems());

  function createEmptyItems(): TableItem[] {
    return Array.from({ length: 10 }, (_, i) => ({
      _id: '',
      id: `item-${i}`,
      quantity: 0,
      description: '',
      unitPrice: 0,
      total: 0,
      inventoryId: '',
      invoiceId: '',
    }));
  }

  useEffect(() => {
    const invoiceIdChanged = localInvoice._id !== invoice._id;
    setDisablePay(localInvoice.totalUsd === 0);
    if (!invoiceIdChanged) return;
    setLocalInvoice(invoice);
    if (invoice.items && invoice.items.length > 0) {
      const updatedTableItems = createEmptyItems();
      invoice.items.forEach((item, index) => {
        if (index < 10) {
          updatedTableItems[index] = {
            ...updatedTableItems[index],
            quantity: item.quantity || 0,
            description: item.description || '',
            unitPrice: item.unitPrice || 0,
            total: item.total || 0,
            inventoryId: item.inventoryId || '',
          };
        }
      });
      setTableItems(updatedTableItems);
    } else {
      setTableItems(createEmptyItems());
    }
  }, [invoice]);

  const updateField = (field: keyof Invoice, value: any) => {
    const updated = { ...localInvoice, [field]: value };
    setLocalInvoice(updated);
    onUpdate({ [field]: value });
  };

  const updateTableItem = (itemId: string, field: string, value: any) => {
    setTableItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'description' && (!value || value.trim() === '')) {
            updatedItem.unitPrice = 0;
            updatedItem.total = 0;
            updatedItem.inventoryId = '';
          }
          if (field === 'quantity' || field === 'unitPrice') {
            const quantity = updatedItem.quantity || 0;
            const unitPrice = updatedItem.unitPrice || 0;
            updatedItem.total = roundToTwoDecimals(quantity * unitPrice);
          }
          return updatedItem;
        }
        return item;
      });
    });
  };

  useEffect(() => {
    const totalBs = roundToTwoDecimals(tableItems.reduce((sum, item) => sum + (item.total || 0), 0));
    const totalUsd = exchangeRate > 0 ? roundToTwoDecimals(totalBs / exchangeRate) : 0;
    const invoiceItems: InvoiceItem[] = tableItems
      .filter(item => item.description.trim() !== '' || item.quantity > 0)
      .map(item => ({
        _id: item._id || '',
        id: item.id,
        quantity: roundToTwoDecimals(item.quantity || 0),
        description: item.description || '',
        unitPrice: roundToTwoDecimals(item.unitPrice || 0),
        total: roundToTwoDecimals(item.total || 0),
        inventoryId: item.inventoryId || '',
        invoiceId: item.invoiceId || '',
      }));
    const updatedInvoice = {
      ...localInvoice,
      items: invoiceItems,
      totalBs,
      totalUsd,
    };
    setLocalInvoice(updatedInvoice);
    onUpdate(updatedInvoice);
  }, [tableItems, exchangeRate]);

  const handleInventoryItemSelect = (itemId: string, inventoryItem: any) => {
    setTableItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === itemId) {
          const unitPrice = inventoryItem.salesPrice;
          const updatedItem = {
            ...item,
            description: inventoryItem.description,
            unitPrice: roundToTwoDecimals(unitPrice),
            inventoryId: inventoryItem._id,
            id: inventoryItem.code || item.id,
          };
          const quantity = updatedItem.quantity || 0;
          updatedItem.total = roundToTwoDecimals(quantity * unitPrice);
          return updatedItem;
        }
        return item;
      });
    });
  };

  const handleInputChange = (option: any, e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (option.type === 'onlyNumbers') {
      value = value.replace(/[^0-9]/g, '');
    }
    if (option.type === 'phone') {
      if (value.startsWith('+')) {
        value = '+' + value.slice(1).replace(/[^0-9]/g, '');
      } else {
        value = value.replace(/[^0-9]/g, '');
      }
    }
    updateField(option.field as keyof Invoice, value);
  };

  const handlePay = async () => {
    setSavingForPayment(true);
    try {
      const items = tableItems
        .filter(item => item.description.trim() !== '' || item.quantity > 0)
        .map(item => ({
          id: item.id,
          inventoryId: item.inventoryId || '',
          description: item.description || '',
          quantity: roundToTwoDecimals(item.quantity || 0),
          unitPrice: roundToTwoDecimals(item.unitPrice || 0),
          total: roundToTwoDecimals(item.total || 0),
        }));

      if (items.length === 0) {
        toast.error('Agrega al menos un item a la factura');
        return;
      }

      // Guardar factura en DB primero
      const saved = await fetchApiV1({
        query: queries.createInvoice,
        type: 'json',
        variables: {
          id: businessId,
          args: {
            clientName: localInvoice.clientName || undefined,
            clientId: localInvoice.clientId || undefined,
            clientPhone: localInvoice.clientPhone || undefined,
            items,
          },
        },
      });

      if (!saved) {
        throw new Error('Error al guardar la factura');
      }

      // Guardar la factura creada y abrir diálogo de pago
      setSavedInvoice(saved);
      setIsPaymentDialogOpen(true);
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar factura');
    } finally {
      setSavingForPayment(false);
    }
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
  ];

  return (
    <div className="w-full max-w-full md:max-w-[340px] pb-4 bg-card rounded-sm shadow-lg flex flex-col relative p-2 pt-5 border-[1px] border-ring mx-auto">
      {/* Close Button */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm z-10"
      >
        <X className="w-4 h-4" />
      </button>

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
              value={option.value || ''}
              onChange={option.onChange}
              placeholder={option.label}
              maxLength={option.maxLength}
              className="pl-2 pr-6 h-6 bg-gray-100 dark:bg-gray-100 border-[1px] rounded-[6px] text-sm text-gray-700 font-semibold"
            />
            <div onClick={() => updateField(option.field as keyof Invoice, '')} className='w-5 h-5 flex items-center justify-center absolute top-[18px] right-1 text-gray-700 cursor-pointer hover:font-semibold'>
              <XIcon className='w-3 h-3' />
            </div>
          </div>
        ))}
      </div>

      {/* Items Table */}
      <div className="flex-1 my-2">
        <div>
          <table className="w-full text-xs border-[1px] border-ring">
            <thead>
              <tr className='w-full'>
                <th className='w-[45px] border-[1px] border-ring'>Cant.</th>
                <th className='border-[1px] border-ring'>Descripción</th>
                <th className='w-[45px] border-[1px] border-ring'>P.U.</th>
                <th className='w-[60px] border-[1px] border-ring'>Impt.</th>
              </tr>
            </thead>
            <tbody className='text-gray-700 font-semibold'>
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
                      businessId={businessId}
                      exchangeRate={exchangeRate}
                    />
                  </td>
                  <td className='border-[1px] border-ring bg-white dark:bg-gray-100 p-0'>
                    <input
                      id={`unitPrice-${index}`}
                      type="text"
                      value={item.unitPrice !== 0 ? formatNumber(item.unitPrice) : ""}
                      readOnly
                      className='w-full bg-gray-100 dark:bg-gray-100 text-right border-0 px-1'
                    />
                  </td>
                  <td className='border-[1px] border-ring bg-white dark:bg-gray-100 p-0'>
                    <input
                      id={`total-${index}`}
                      type="text"
                      value={item.total !== 0 ? formatNumber(item.total) : ""}
                      readOnly
                      className='w-full bg-gray-100 dark:bg-gray-100 text-right border-0 px-1'
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-col">
            <div className="flex justify-between text-xs">
              <div className="flex-1" />
              <span className="font-medium">TOTAL Bs:</span>
              <span className="font-bold w-[60px] text-right pr-1">
                {formatNumber(tableItems.reduce((sum, item) => sum + (item.total || 0), 0))}
              </span>
            </div>
            {exchangeRate > 0 && (
              <div className="flex justify-between text-xs">
                <div className="flex-1" />
                <span className="font-medium">TOTAL $:</span>
                <span className="font-bold w-[60px] text-right pr-1">
                  {formatNumber(tableItems.reduce((sum, item) => sum + (item.total || 0), 0) / exchangeRate)}
                </span>
              </div>
            )}
          </div>
          <Button
            onClick={handlePay}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
            disabled={disablePay || savingForPayment}
          >
            {savingForPayment ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Guardando...</> : 'PAGAR'}
          </Button>
        </div>
      </div>

      {/* Payment Dialog — uses the saved invoice (with real DB _id) */}
      {isPaymentDialogOpen && savedInvoice && (
        <PaymentDialog
          isOpen={isPaymentDialogOpen}
          onClose={() => {
            setIsPaymentDialogOpen(false);
            setSavedInvoice(null);
          }}
          invoice={savedInvoice}
          businessId={businessId}
          exchangeRate={exchangeRate}
          onSuccess={() => {
            setLocalInvoices(prev => prev.filter(inv => inv._id !== localInvoice._id));
            setIsPaymentDialogOpen(false);
            setSavedInvoice(null);
            onPaymentSuccess();
          }}
        />
      )}
    </div>
  );
}
