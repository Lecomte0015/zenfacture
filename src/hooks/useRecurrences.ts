import { useState, useEffect, useCallback } from 'react';
import { RecurrenceData, getRecurrences, createRecurrence, updateRecurrence, deleteRecurrence } from '../services/recurrenceService';
import { useAuth } from '../context/AuthContext';
import { useOrganisation } from '../context/OrganisationContext';

export const useRecurrences = () => {
  const [recurrences, setRecurrences] = useState<RecurrenceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const { isAuthenticated } = useAuth();
  const { organisationId } = useOrganisation();

  const fetchRecurrences = useCallback(async () => {
    if (!isAuthenticated || !organisationId) return;
    setLoading(true);
    try {
      const result = await getRecurrences({ organisationId });
      setRecurrences(result.data);
      setTotal(result.total);
    } catch (err) {
      setError('Impossible de charger les récurrences.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, organisationId]);

  const addRecurrence = async (data: Omit<RecurrenceData, 'id' | 'cree_le' | 'mis_a_jour_le'>) => {
    const newRec = await createRecurrence(data);
    setRecurrences(prev => [newRec, ...prev]);
    setTotal(prev => prev + 1);
    return newRec;
  };

  const editRecurrence = async (id: string, updates: Partial<RecurrenceData>) => {
    const updated = await updateRecurrence(id, updates);
    setRecurrences(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
    return updated;
  };

  const removeRecurrence = async (id: string) => {
    await deleteRecurrence(id);
    setRecurrences(prev => prev.filter(r => r.id !== id));
    setTotal(prev => prev - 1);
  };

  useEffect(() => {
    if (isAuthenticated && organisationId) fetchRecurrences();
    else { setRecurrences([]); setLoading(false); }
  }, [isAuthenticated, organisationId]);

  return { recurrences, loading, error, total, addRecurrence, editRecurrence, removeRecurrence, refreshRecurrences: fetchRecurrences, organisationId };
};
