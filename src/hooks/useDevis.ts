import { useState, useEffect, useCallback } from 'react';
import { DevisData, getDevisList, createDevis, updateDevis, deleteDevis } from '../services/devisService';
import { useAuth } from '../context/AuthContext';
import { useOrganisation } from '../context/OrganisationContext';

interface UseDevisOptions {
  limit?: number;
  statut?: string;
  search?: string;
}

export const useDevis = (options: UseDevisOptions = {}) => {
  const { limit = 20, statut, search } = options;
  const [devisList, setDevisList] = useState<DevisData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const { isAuthenticated } = useAuth();
  const { organisationId } = useOrganisation();

  const fetchDevis = useCallback(async (isLoadMore = false) => {
    if (!isAuthenticated || !organisationId) return;
    if (!isLoadMore) setLoading(true);
    setError(null);

    try {
      const currentPage = isLoadMore ? page + 1 : 1;
      const result = await getDevisList({
        organisationId,
        limit,
        page: currentPage,
        statut: statut !== 'all' ? statut : undefined,
        search: search || undefined,
      });

      setDevisList(prev => isLoadMore ? [...prev, ...result.data] : result.data);
      setHasMore(result.hasMore);
      setTotal(result.total);
      setPage(currentPage);
    } catch (err) {
      console.error('Error fetching devis:', err);
      setError('Impossible de charger les devis.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, organisationId, limit, statut, search, page]);

  const addDevis = async (data: Omit<DevisData, 'id' | 'cree_le' | 'mis_a_jour_le'>) => {
    try {
      const newDevis = await createDevis(data);
      setDevisList(prev => [newDevis, ...prev]);
      setTotal(prev => prev + 1);
      return newDevis;
    } catch (err) {
      setError('Erreur lors de la création du devis');
      throw err;
    }
  };

  const editDevis = async (id: string, updates: Partial<DevisData>) => {
    try {
      const updated = await updateDevis(id, updates);
      setDevisList(prev => prev.map(d => d.id === id ? { ...d, ...updated } : d));
      return updated;
    } catch (err) {
      setError('Erreur lors de la mise à jour du devis');
      throw err;
    }
  };

  const removeDevis = async (id: string) => {
    try {
      await deleteDevis(id);
      setDevisList(prev => prev.filter(d => d.id !== id));
      setTotal(prev => prev - 1);
    } catch (err) {
      setError('Erreur lors de la suppression du devis');
      throw err;
    }
  };

  useEffect(() => {
    if (isAuthenticated && organisationId) fetchDevis(false);
    else { setDevisList([]); setLoading(false); }
  }, [isAuthenticated, organisationId, statut, search, limit]);

  return {
    devisList,
    loading,
    error,
    hasMore,
    total,
    addDevis,
    editDevis,
    removeDevis,
    refreshDevis: () => fetchDevis(false),
    loadMore: () => { if (hasMore && !loading) fetchDevis(true); },
    organisationId,
  };
};
