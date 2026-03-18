import { useState, useEffect, useCallback } from 'react';
import { InvoiceData, getInvoices, createInvoice, updateInvoice, deleteInvoice } from '../services/invoiceService';
import { useAuth } from '../context/AuthContext';

interface UseInvoicesOptions {
  limit?: number;
  status?: string;
  search?: string;
}

export const useInvoices = (options: UseInvoicesOptions = {}) => {
  const { limit = 10, status, search } = options;
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const { isAuthenticated, user } = useAuth();

  const fetchInvoices = useCallback(async (isLoadMore = false) => {
    // Si pas authentifié ou pas d'user ID, ne pas charger mais mettre loading à false
    if (!isAuthenticated || !user?.id) {
      setLoading(false);
      setLoadingMore(false);
      setInvoices([]);
      return;
    }

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const currentPage = isLoadMore ? page + 1 : 1;
      const { data, hasMore: morePages } = await getInvoices({
        userId: user.id,
        limit,
        page: currentPage,
        status: status !== 'all' ? status : undefined,
        search: search || undefined,
      });

      setInvoices(prev => isLoadMore ? [...prev, ...data] : data);
      setHasMore(morePages);
      if (isLoadMore) {
        setPage(currentPage);
      } else {
        setPage(1);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Impossible de charger les factures. Veuillez réessayer.');
      // Ne pas throw l'erreur, juste la logger
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [isAuthenticated, limit, page, status, search, user?.id]);

  const addInvoice = async (invoiceData: Omit<InvoiceData, 'id' | 'created_at' | 'user_id'>) => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecté');
    }
    
    try {
      setLoading(true);
      const newInvoice = await createInvoice({
        ...invoiceData,
        user_id: user.id,
      });
      
      // Si c'est la première page ou qu'on a moins d'éléments que la limite, on ajoute en haut
      if (invoices.length < limit) {
        setInvoices(prev => [newInvoice, ...prev]);
      } else {
        // Sinon on recharge la première page
        await fetchInvoices(false);
      }
      
      return newInvoice;
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError('Erreur lors de la création de la facture');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const editInvoice = async (id: string, updates: Partial<InvoiceData>) => {
    try {
      setLoading(true);
      const updatedInvoice = await updateInvoice(id, updates);
      
      // Mettre à jour la facture dans la liste
      setInvoices(prev => 
        prev.map(inv => inv.id === id ? { ...inv, ...updatedInvoice } : inv)
      );
      
      return updatedInvoice;
    } catch (err) {
      console.error('Error updating invoice:', err);
      setError('Erreur lors de la mise à jour de la facture');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeInvoice = async (id: string) => {
    try {
      setLoading(true);
      await deleteInvoice(id);
      
      // Supprimer la facture de la liste
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      
      // Si on a moins d'éléments que la limite après suppression, on en charge plus
      if (invoices.length <= limit) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError('Erreur lors de la suppression de la facture');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger plus d'éléments
  const loadMore = useCallback(() => {
    if (hasMore && !loading && !loadingMore) {
      fetchInvoices(true);
    }
  }, [fetchInvoices, hasMore, loading, loadingMore]);

  // Recharger les factures quand les options changent ou quand l'utilisateur change
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      console.log('Chargement des factures pour l\'utilisateur:', user.id);
      fetchInvoices(false);
    } else {
      console.log('Réinitialisation des factures - utilisateur non authentifié ou pas d\'ID');
      setInvoices([]);
      setHasMore(true);
      setPage(1);
      setLoading(false); // Important: mettre loading à false même si pas d'user
    }
  }, [isAuthenticated, user?.id, status, search, limit, fetchInvoices]);

  return {
    invoices,
    loading,
    loadingMore,
    error,
    hasMore,
    page,
    addInvoice,
    editInvoice,
    removeInvoice,
    refreshInvoices: () => fetchInvoices(false),
    loadMore,
  };
};
