'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { fetchApiV1 } from '@/lib/Fetching';
import { queries } from '@/lib/Fetching';
import { Business, BusinessInput, BranchInput } from '@/lib/interfases';

interface BusinessContextType {
  // Estado
  businesses: Business[];
  currentBusiness: Business | null;
  loading: boolean;
  error: string | null;
  // Acciones
  loadBusinesses: () => Promise<void>;
  loadBusiness: (id: string) => Promise<void>;
  loadBusinessBySlug: (slug: string) => Promise<void>;
  createBusiness: (args: BusinessInput) => Promise<Business | null>;
  updateBusiness: (id: string, args: BusinessInput) => Promise<Business | null>;
  deleteBusiness: (id: string) => Promise<boolean>;
  addBranch: (businessId: string, args: BranchInput) => Promise<Business | null>;
  updateBranch: (businessId: string, branchIndex: number, args: BranchInput) => Promise<Business | null>;
  removeBranch: (businessId: string, branchIndex: number) => Promise<Business | null>;
  checkSlugAvailable: (slug: string) => Promise<boolean>;
  // Utilidades
  clearError: () => void;
  setCurrentBusiness: (business: Business | null) => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness debe ser usado dentro de BusinessProvider');
  }
  return context;
};

interface BusinessProviderProps {
  children: ReactNode;
}

export const BusinessProvider: React.FC<BusinessProviderProps> = ({ children }) => {
  const { authUser } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clearError = () => setError(null);

  // Cargar negocios del usuario autenticado
  const loadBusinesses = async () => {
    if (!authUser?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchApiV1({
        query: queries.getBusinessesByOwner,
        variables: { ownerId: authUser?.customClaims?._id || "" }
      });
      if (result) {
        setBusinesses(result);
        // Si no hay negocio actual y hay negocios, seleccionar el primero
        if (!currentBusiness && result.length > 0) {
          setCurrentBusiness(result[0]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar negocios');
      console.error('Error loading businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar negocio por ID
  const loadBusiness = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchApiV1({
        query: queries.getBusiness,
        variables: { id }
      });
      if (result) {
        setCurrentBusiness(result);
        // Actualizar en la lista si existe
        setBusinesses(prev =>
          prev.map(b => b._id === id ? result : b)
        );
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar negocio');
      console.error('Error loading business:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar negocio por slug
  const loadBusinessBySlug = async (slug: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchApiV1({
        query: queries.getBusinessBySlug,
        variables: { slug }
      });
      if (result) {
        setCurrentBusiness(result);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar negocio');
      console.error('Error loading business by slug:', err);
    } finally {
      setLoading(false);
    }
  };

  // Crear negocio
  const createBusiness = async (args: BusinessInput): Promise<Business | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchApiV1({
        query: queries.createBusiness,
        variables: { args }
      });
      if (result) {
        setBusinesses(prev => [...prev, result]);
        setCurrentBusiness(result);
        return result;
      }
      return null;
    } catch (err: any) {
      setError(err.message || 'Error al crear negocio');
      console.error('Error creating business:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar negocio
  const updateBusiness = async (id: string, args: BusinessInput): Promise<Business | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchApiV1({
        query: queries.updateBusiness,
        variables: { id, args }
      });
      if (result) {
        setBusinesses(prev =>
          prev.map(b => b._id === id ? result : b)
        );
        if (currentBusiness?._id === id) {
          setCurrentBusiness(result);
        }
        return result;
      }
      return null;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar negocio');
      console.error('Error updating business:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar negocio
  const deleteBusiness = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchApiV1({
        query: queries.deleteBusiness,
        variables: { id }
      });
      if (result) {
        setBusinesses(prev => prev.filter(b => b._id !== id));
        if (currentBusiness?._id === id) {
          setCurrentBusiness(null);
        }
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message || 'Error al eliminar negocio');
      console.error('Error deleting business:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Agregar sucursal
  const addBranch = async (businessId: string, args: BranchInput): Promise<Business | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchApiV1({
        query: queries.addBranch,
        variables: { businessId, args }
      });
      if (result) {
        setBusinesses(prev =>
          prev.map(b => b._id === businessId ? result : b)
        );
        if (currentBusiness?._id === businessId) {
          setCurrentBusiness(result);
        }
        return result;
      }
      return null;
    } catch (err: any) {
      setError(err.message || 'Error al agregar sucursal');
      console.error('Error adding branch:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar sucursal
  const updateBranch = async (businessId: string, branchIndex: number, args: BranchInput): Promise<Business | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchApiV1({
        query: queries.updateBranch,
        variables: { businessId, branchIndex, args }
      });
      if (result) {
        setBusinesses(prev =>
          prev.map(b => b._id === businessId ? result : b)
        );
        if (currentBusiness?._id === businessId) {
          setCurrentBusiness(result);
        }
        return result;
      }
      return null;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar sucursal');
      console.error('Error updating branch:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar sucursal
  const removeBranch = async (businessId: string, branchIndex: number): Promise<Business | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchApiV1({
        query: queries.removeBranch,
        variables: { businessId, branchIndex }
      });
      if (result) {
        setBusinesses(prev =>
          prev.map(b => b._id === businessId ? result : b)
        );
        if (currentBusiness?._id === businessId) {
          setCurrentBusiness(result);
        }
        return result;
      }
      return null;
    } catch (err: any) {
      setError(err.message || 'Error al eliminar sucursal');
      console.error('Error removing branch:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Verificar disponibilidad de slug
  const checkSlugAvailable = async (slug: string): Promise<boolean> => {
    try {
      const result = await fetchApiV1({
        query: queries.checkSlugAvailable,
        variables: { slug }
      });
      return result;
    } catch (err: any) {
      console.error('Error checking slug availability:', err);
      return false;
    }
  };

  // Cargar negocios cuando el usuario se autentica
  useEffect(() => {
    if (authUser?.uid) {
      loadBusinesses();
    } else {
      setBusinesses([]);
      setCurrentBusiness(null);
    }
  }, [authUser?.uid]);

  const value: BusinessContextType = {
    // Estado
    businesses,
    currentBusiness,
    loading,
    error,
    // Acciones
    loadBusinesses,
    loadBusiness,
    loadBusinessBySlug,
    createBusiness,
    updateBusiness,
    deleteBusiness,
    addBranch,
    updateBranch,
    removeBranch,
    checkSlugAvailable,
    // Utilidades
    clearError,
    setCurrentBusiness
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
};
