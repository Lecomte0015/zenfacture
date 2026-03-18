import { useState, useEffect, useCallback } from 'react';
import { ProduitData, getProduits, createProduit, updateProduit, deleteProduit } from '../services/produitService';
import { useAuth } from '../context/AuthContext';
import { useOrganisation } from '../context/OrganisationContext';

interface UseProduitsOptions {
  limit?: number;
  search?: string;
  categorie?: string;
  actifOnly?: boolean;
}

export const useProduits = (options: UseProduitsOptions = {}) => {
  const { limit = 20, search, categorie, actifOnly = false } = options;
  const [produits, setProduits] = useState<ProduitData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const { isAuthenticated } = useAuth();
  const { organisationId } = useOrganisation();

  const fetchProduits = useCallback(async (isLoadMore = false) => {
    if (!isAuthenticated || !organisationId) return;

    if (!isLoadMore) setLoading(true);
    setError(null);

    try {
      const currentPage = isLoadMore ? page + 1 : 1;
      const result = await getProduits({
        organisationId,
        limit,
        page: currentPage,
        search: search || undefined,
        categorie: categorie || undefined,
        actifOnly,
      });

      setProduits(prev => isLoadMore ? [...prev, ...result.data] : result.data);
      setHasMore(result.hasMore);
      setTotal(result.total);
      setPage(currentPage);
    } catch (err) {
      console.error('Error fetching produits:', err);
      setError('Impossible de charger les produits.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, organisationId, limit, search, categorie, actifOnly, page]);

  const addProduit = async (produitData: Omit<ProduitData, 'id' | 'cree_le' | 'mis_a_jour_le' | 'organisation_id'>) => {
    if (!organisationId) throw new Error('Organisation non trouvée');

    try {
      const newProduit = await createProduit({
        ...produitData,
        organisation_id: organisationId,
      });
      setProduits(prev => [newProduit, ...prev]);
      setTotal(prev => prev + 1);
      return newProduit;
    } catch (err) {
      console.error('Error creating produit:', err);
      setError('Erreur lors de la création du produit');
      throw err;
    }
  };

  const editProduit = async (id: string, updates: Partial<ProduitData>) => {
    try {
      const updated = await updateProduit(id, updates);
      setProduits(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
      return updated;
    } catch (err) {
      console.error('Error updating produit:', err);
      setError('Erreur lors de la mise à jour du produit');
      throw err;
    }
  };

  const removeProduit = async (id: string) => {
    try {
      await deleteProduit(id);
      setProduits(prev => prev.filter(p => p.id !== id));
      setTotal(prev => prev - 1);
    } catch (err) {
      console.error('Error deleting produit:', err);
      setError('Erreur lors de la suppression du produit');
      throw err;
    }
  };

  const loadMore = useCallback(() => {
    if (hasMore && !loading) fetchProduits(true);
  }, [fetchProduits, hasMore, loading]);

  useEffect(() => {
    if (isAuthenticated && organisationId) {
      fetchProduits(false);
    } else {
      setProduits([]);
      setLoading(false);
    }
  }, [isAuthenticated, organisationId, search, categorie, actifOnly, limit]);

  return {
    produits,
    loading,
    error,
    hasMore,
    total,
    addProduit,
    editProduit,
    removeProduit,
    refreshProduits: () => fetchProduits(false),
    loadMore,
    organisationId,
  };
};
