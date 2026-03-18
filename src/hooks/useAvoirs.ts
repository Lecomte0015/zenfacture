import { useState, useEffect, useCallback } from 'react';
import { AvoirData, getAvoirs, createAvoir, updateAvoir, deleteAvoir } from '../services/avoirService';
import { useAuth } from '../context/AuthContext';
import { useOrganisation } from '../context/OrganisationContext';

interface UseAvoirsOptions {
  limit?: number;
  search?: string;
}

export const useAvoirs = (options: UseAvoirsOptions = {}) => {
  const { limit = 20, search } = options;
  const [avoirs, setAvoirs] = useState<AvoirData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const { isAuthenticated } = useAuth();
  const { organisationId } = useOrganisation();

  const fetchAvoirs = useCallback(async () => {
    if (!isAuthenticated || !organisationId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getAvoirs({ organisationId, limit, search: search || undefined });
      setAvoirs(result.data);
      setTotal(result.total);
    } catch (err) {
      setError('Impossible de charger les avoirs.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, organisationId, limit, search]);

  const addAvoir = async (data: Omit<AvoirData, 'id' | 'cree_le'>) => {
    const newAvoir = await createAvoir(data);
    setAvoirs(prev => [newAvoir, ...prev]);
    setTotal(prev => prev + 1);
    return newAvoir;
  };

  const editAvoir = async (id: string, updates: Partial<AvoirData>) => {
    const updated = await updateAvoir(id, updates);
    setAvoirs(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
    return updated;
  };

  const removeAvoir = async (id: string) => {
    await deleteAvoir(id);
    setAvoirs(prev => prev.filter(a => a.id !== id));
    setTotal(prev => prev - 1);
  };

  useEffect(() => {
    if (isAuthenticated && organisationId) fetchAvoirs();
    else { setAvoirs([]); setLoading(false); }
  }, [isAuthenticated, organisationId, search, limit]);

  return { avoirs, loading, error, total, addAvoir, editAvoir, removeAvoir, refreshAvoirs: fetchAvoirs, organisationId };
};
