import { useState, useEffect, useCallback } from 'react';
import { useOrganisation } from '@/context/OrganisationContext';
import {
  Marque, MarqueInput,
  getMarques, createMarque, updateMarque, deleteMarque, setMarqueDefault,
} from '@/services/marqueService';

export function useMarques() {
  const { organisation } = useOrganisation();
  const orgId = organisation?.id;

  const [marques, setMarques] = useState<Marque[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMarques(orgId);
      setMarques(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (input: Omit<MarqueInput, 'organisation_id' | 'actif'>) => {
    if (!orgId) throw new Error('Organisation requise');
    const m = await createMarque({ ...input, organisation_id: orgId, actif: true });
    setMarques(prev => [...prev, m]);
    return m;
  };

  const update = async (id: string, updates: Partial<MarqueInput>) => {
    const m = await updateMarque(id, { ...updates, organisation_id: orgId });
    setMarques(prev => prev.map(x => x.id === id ? m : x));
    return m;
  };

  const remove = async (id: string) => {
    await deleteMarque(id);
    setMarques(prev => prev.filter(x => x.id !== id));
  };

  const setDefault = async (id: string) => {
    if (!orgId) return;
    await setMarqueDefault(id, orgId);
    setMarques(prev => prev.map(x => ({ ...x, is_default: x.id === id })));
  };

  const defaultMarque = marques.find(m => m.is_default) || marques[0];

  return { marques, defaultMarque, loading, error, refresh, create, update, remove, setDefault };
}
