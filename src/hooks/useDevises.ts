import { useState, useEffect, useCallback } from 'react';
import { DeviseCode, getTauxDeChange, convertirMontant, formaterMontant } from '../services/deviseService';

export const useDevises = () => {
  const [taux, setTaux] = useState<Record<string, number>>({ CHF: 1, EUR: 0.94, USD: 1.12 });
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const refreshTaux = useCallback(async () => {
    setLoading(true);
    try {
      const nouveauxTaux = await getTauxDeChange();
      setTaux(nouveauxTaux);
      setLastUpdate(new Date().toISOString());
    } catch (error) {
      console.error('Erreur taux de change:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTaux();
  }, [refreshTaux]);

  const convertir = useCallback(async (montant: number, de: DeviseCode, vers: DeviseCode) => {
    return convertirMontant(montant, de, vers);
  }, []);

  const formater = useCallback((montant: number, devise: DeviseCode = 'CHF') => {
    return formaterMontant(montant, devise);
  }, []);

  return {
    taux,
    loading,
    lastUpdate,
    convertir,
    formater,
    refreshTaux,
  };
};
