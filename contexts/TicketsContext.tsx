'use client';

import React, { createContext, useContext, useCallback, useRef, useEffect, useState } from 'react';
import { fetchApiV1, queries } from '@/lib/Fetching';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import type { TicketCreatedPayload, TicketUpdatedPayload, TicketDeletedPayload } from '@/contexts/WebSocketContext';

/** Ticket tal como lo devuelve la API / WebSocket (compatible con la página de tickets) */
export interface Ticket {
  _id: string;
  number: number;
  subject: string;
  zoneId?: number;
  status?: string;
  priority?: string;
  createdAt?: string;
  technician?: { name?: string; email?: string };
  cliente?: { zona?: { nombre?: string } };
  [key: string]: unknown;
}

interface TicketsResponse {
  total: number;
  results: Ticket[];
}

export interface TicketsListParams {
  currentPage: number;
  pageSize: number;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
}

interface TicketsContextType {
  tickets: Ticket[];
  total: number;
  loading: boolean;
  error: string | null;
  listParams: TicketsListParams;
  setListParams: (params: Partial<TicketsListParams>) => void;
  loadTickets: (overrides?: Partial<TicketsListParams>) => Promise<void>;
}

const TicketsContext = createContext<TicketsContextType | undefined>(undefined);

export const useTicketsContext = () => {
  const context = useContext(TicketsContext);
  if (!context) {
    throw new Error('useTicketsContext debe usarse dentro de TicketsProvider');
  }
  return context;
};

interface TicketsProviderProps {
  children: React.ReactNode;
}

export function TicketsProvider({ children }: TicketsProviderProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listParams, setListParamsState] = useState<TicketsListParams>({
    currentPage: 1,
    pageSize: 10,
    sortColumn: null,
    sortDirection: 'desc',
  });

  const {
    onTicketCreated,
    onTicketUpdated,
    onTicketDeleted,
    onReconnect,
  } = useWebSocketContext();

  const listParamsRef = useRef(listParams);
  listParamsRef.current = listParams;

  const setListParams = useCallback((params: Partial<TicketsListParams>) => {
    setListParamsState(prev => ({ ...prev, ...params }));
  }, []);

  const loadTickets = useCallback(async (overrides?: Partial<TicketsListParams>) => {
    const params = overrides ? { ...listParamsRef.current, ...overrides } : listParamsRef.current;
    if (overrides) {
      setListParamsState(prev => ({ ...prev, ...overrides }));
    }
    const { currentPage, pageSize, sortColumn, sortDirection } = params;
    try {
      setLoading(true);
      setError(null);
      const sort: Record<string, number> = sortColumn
        ? { [sortColumn]: sortDirection === 'asc' ? 1 : -1 }
        : { createdAt: -1 };

      const response: TicketsResponse = await fetchApiV1({
        query: queries.getTickets,
        type: 'json',
        variables: {
          sort,
          skip: (currentPage - 1) * pageSize,
          limit: pageSize,
        },
      });

      setTickets(response.results ?? []);
      setTotal(response.total ?? 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar tickets';
      setError(message);
      setTickets([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyTicketCreated = useCallback((payload: TicketCreatedPayload) => {
    const ticket = payload.ticket as Ticket;
    if (!ticket || !ticket._id) return;
    const { currentPage, pageSize, sortColumn, sortDirection } = listParamsRef.current;
    setTotal(prev => prev + 1);
    if (currentPage === 1 && (!sortColumn || sortColumn === 'createdAt') && sortDirection === 'desc') {
      setTickets(prev => [ticket, ...prev].slice(0, pageSize));
    }
  }, []);

  const applyTicketUpdated = useCallback((payload: TicketUpdatedPayload) => {
    const { _id, ticket: updated } = payload;
    if (!_id || !updated) return;
    setTickets(prev =>
      prev.map(t => (String(t._id) === String(_id) ? (updated as Ticket) : t))
    );
  }, []);

  const applyTicketDeleted = useCallback((payload: TicketDeletedPayload) => {
    const { _id } = payload;
    if (!_id) return;
    setTickets(prev => prev.filter(t => String(t._id) !== String(_id)));
    setTotal(prev => Math.max(0, prev - 1));
  }, []);

  useEffect(() => {
    const handleCreated = (p: TicketCreatedPayload) => applyTicketCreated(p);
    const handleUpdated = (p: TicketUpdatedPayload) => applyTicketUpdated(p);
    const handleDeleted = (p: TicketDeletedPayload) => applyTicketDeleted(p);

    onTicketCreated(handleCreated);
    onTicketUpdated(handleUpdated);
    onTicketDeleted(handleDeleted);
    onReconnect(loadTickets);
  }, [onTicketCreated, onTicketUpdated, onTicketDeleted, onReconnect, applyTicketCreated, applyTicketUpdated, applyTicketDeleted, loadTickets]);

  const value: TicketsContextType = {
    tickets,
    total,
    loading,
    error,
    listParams,
    setListParams,
    loadTickets,
  };

  return (
    <TicketsContext.Provider value={value}>
      {children}
    </TicketsContext.Provider>
  );
}
