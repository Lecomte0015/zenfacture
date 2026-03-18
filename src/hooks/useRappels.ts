import { useState, useEffect, useCallback } from 'react';
import { RappelData, getRappels, createRappel, deleteRappel, getFacturesEnRetard } from '../services/rappelService';
import { useAuth } from '../context/AuthContext';
import { useOrganisation } from '../context/OrganisationContext';

export const useRappels = () => {
  const [rappels, setRappels] = useState<RappelData[]>([]);
  const [facturesEnRetard, setFacturesEnRetard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const { organisationId } = useOrganisation();

  const fetchRappels = useCallback(async () => {
    if (!isAuthenticated || !organisationId) return;
    setLoading(true);
    try {
      const [rappelsData, retardData] = await Promise.all([
        getRappels(organisationId),
        getFacturesEnRetard(organisationId),
      ]);
      setRappels(rappelsData);
      setFacturesEnRetard(retardData);
    } catch (err) {
      setError('Impossible de charger les rappels.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, organisationId]);

  const addRappel = async (data: Omit<RappelData, 'id' | 'cree_le'>) => {
    const newRappel = await createRappel(data);
    setRappels(prev => [newRappel, ...prev]);
    return newRappel;
  };

  const removeRappel = async (id: string) => {
    await deleteRappel(id);
    setRappels(prev => prev.filter(r => r.id !== id));
  };

  useEffect(() => {
    if (isAuthenticated && organisationId) fetchRappels();
    else { setRappels([]); setLoading(false); }
  }, [isAuthenticated, organisationId]);

  return { rappels, facturesEnRetard, loading, error, addRappel, removeRappel, refreshRappels: fetchRappels, organisationId };
};
