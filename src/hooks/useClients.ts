import { useState, useEffect, useCallback } from 'react';
import { ClientData, getClients, createClient, updateClient, deleteClient } from '../services/clientService';
import { useAuth } from '../context/AuthContext';
import { useOrganisation } from '../context/OrganisationContext';

interface UseClientsOptions {
  limit?: number;
  search?: string;
}

export const useClients = (options: UseClientsOptions = {}) => {
  const { limit = 20, search } = options;
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const { isAuthenticated } = useAuth();
  const { organisationId } = useOrganisation();

  const fetchClients = useCallback(async (isLoadMore = false) => {
    if (!isAuthenticated || !organisationId) return;

    if (!isLoadMore) setLoading(true);
    setError(null);

    try {
      const currentPage = isLoadMore ? page + 1 : 1;
      const result = await getClients({
        organisationId,
        limit,
        page: currentPage,
        search: search || undefined,
      });

      setClients(prev => isLoadMore ? [...prev, ...result.data] : result.data);
      setHasMore(result.hasMore);
      setTotal(result.total);
      setPage(currentPage);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Impossible de charger les clients.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, organisationId, limit, search, page]);

  const addClient = async (clientData: Omit<ClientData, 'id' | 'cree_le' | 'mis_a_jour_le' | 'numero_client' | 'organisation_id'>) => {
    if (!organisationId) throw new Error('Organisation non trouvée');

    try {
      const newClient = await createClient({
        ...clientData,
        organisation_id: organisationId,
      });
      setClients(prev => [newClient, ...prev]);
      setTotal(prev => prev + 1);
      return newClient;
    } catch (err) {
      console.error('Error creating client:', err);
      setError('Erreur lors de la création du client');
      throw err;
    }
  };

  const editClient = async (id: string, updates: Partial<ClientData>) => {
    try {
      const updatedClient = await updateClient(id, updates);
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...updatedClient } : c));
      return updatedClient;
    } catch (err) {
      console.error('Error updating client:', err);
      setError('Erreur lors de la mise à jour du client');
      throw err;
    }
  };

  const removeClient = async (id: string) => {
    try {
      await deleteClient(id);
      setClients(prev => prev.filter(c => c.id !== id));
      setTotal(prev => prev - 1);
    } catch (err) {
      console.error('Error deleting client:', err);
      setError('Erreur lors de la suppression du client');
      throw err;
    }
  };

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchClients(true);
    }
  }, [fetchClients, hasMore, loading]);

  useEffect(() => {
    if (isAuthenticated && organisationId) {
      fetchClients(false);
    } else {
      setClients([]);
      setLoading(false);
    }
  }, [isAuthenticated, organisationId, search, limit]);

  return {
    clients,
    loading,
    error,
    hasMore,
    total,
    addClient,
    editClient,
    removeClient,
    refreshClients: () => fetchClients(false),
    loadMore,
    organisationId,
  };
};
