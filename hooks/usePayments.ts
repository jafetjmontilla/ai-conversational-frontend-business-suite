import { useState, useEffect, useCallback } from 'react';
import { fetchApiV1 } from '../lib/Fetching';
import { queries } from '../lib/Fetching';
import { Payment, PaymentFilters } from '../lib/schemas/invoice';

export const usePayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchPayments = useCallback(async (filters: PaymentFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchApiV1({
        query: queries.getPayments,
        type: 'json',
        variables: {
          filters: Object.keys(filters).length > 0 ? filters : undefined
        }
      });

      if (response && response.results) {
        setPayments(response.results);
        setTotal(response.total);
      } else {
        setPayments([]);
        setTotal(0);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error obteniendo pagos:', err);
      setPayments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    total,
    loading,
    error,
    fetchPayments,
    refetch: () => fetchPayments()
  };
};
