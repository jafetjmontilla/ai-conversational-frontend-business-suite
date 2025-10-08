import { useState } from 'react';
import { fetchApiV1 } from '../lib/Fetching';
import { queries } from '../lib/Fetching';
import { Invoice, CreateInvoiceInput, UpdateInvoiceInput, ProcessPaymentInput } from '../lib/schemas/invoice';

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = async (params?: {
    store?: 'guardians' | 'jaihom';
    skip?: number;
    limit?: number;
    sort?: { createdAt?: -1 | 1; updatedAt?: -1 | 1 };
    rangeDate?: { gt: string; lt: string };
  }) => {
    try {
      setLoading(true);
      setError(null);

      const variables: any = {
        store: params?.store || 'jaihom',
        skip: params?.skip || 0,
        limit: params?.limit || 100,
        sort: params?.sort || { createdAt: -1 }
      };

      // Solo agregar rangeDate si se proporciona
      if (params?.rangeDate) {
        variables.rangeDate = params.rangeDate;
      }

      const response = await fetchApiV1({
        query: queries.getInvoices,
        type: 'json',
        variables
      });

      if (response && response.results) {
        setInvoices(response.results);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error obteniendo facturas:', err);
    } finally {
      setLoading(false);
    }
  };

  const createInvoice = async (invoiceData: CreateInvoiceInput): Promise<Invoice | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchApiV1({
        query: queries.createInvoice,
        type: 'json',
        variables: {
          args: invoiceData
        }
      });

      if (response) {
        const newInvoice = response;
        setInvoices(prev => [...prev, newInvoice]);
        return newInvoice;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error creando factura:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateInvoice = async (id: string, invoiceData: UpdateInvoiceInput): Promise<Invoice | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchApiV1({
        query: queries.updateInvoice,
        type: 'json',
        variables: {
          _id: id,
          args: invoiceData
        }
      });

      if (response) {
        const updatedInvoice = response;
        setInvoices(prev =>
          prev.map(invoice =>
            invoice._id === id ? updatedInvoice : invoice
          )
        );
        return updatedInvoice;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error actualizando factura:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchApiV1({
        query: queries.deleteInvoice,
        type: 'json',
        variables: {
          _id: id
        }
      });

      if (response) {
        setInvoices(prev => prev.filter(invoice => invoice._id !== id));
        return true;
      }

      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error eliminando factura:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (paymentData: any): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      let invoiceId = paymentData.invoice._id;

      // Si la factura es local, guardarla primero
      if (invoiceId.startsWith('local-')) {
        console.log('Guardando factura local antes del pago...');
        const savedInvoice = await createInvoice({
          clientName: paymentData.invoice.clientName ? paymentData.invoice.clientName : undefined,
          clientId: paymentData.invoice.clientId ? paymentData.invoice.clientId : undefined,
          clientPhone: paymentData.invoice.clientPhone ? paymentData.invoice.clientPhone : undefined,
          items: paymentData.invoice.items,
          store: paymentData.invoice.store
        });

        if (!savedInvoice) {
          throw new Error('Error al guardar la factura');
        }

        invoiceId = savedInvoice._id;
        console.log('Factura guardada con ID:', invoiceId);
      }

      // Preparar los datos para el backend
      const backendData = {
        invoiceId: invoiceId,
        paymentMethods: paymentData.paymentMethods,
        totalPaid: paymentData.totalPaid,
        tasaBCV: paymentData.tasaBCV,
        store: paymentData.invoice.store
      };

      console.log('Procesando pago con datos:', backendData);

      const response = await fetchApiV1({
        query: queries.processPayment,
        type: 'json',
        variables: {
          args: backendData
        }
      });

      console.log('Respuesta del pago:', response);

      if (response && response.success) {
        // Recargar las facturas para obtener la actualizada
        await fetchInvoices();
        return true;
      }

      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error procesando pago:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    invoices,
    loading,
    error,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    processPayment
  };
};
