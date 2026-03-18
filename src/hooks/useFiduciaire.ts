import { useState, useEffect, useCallback } from 'react';
import {
  AccesFiduciaire,
  ExportFiduciaire,
  getAccesses,
  getExports,
  createAccess as createAccessService,
  revokeAccess as revokeAccessService,
  createExport as createExportService
} from '../services/fiduciaireService';

export const useFiduciaire = () => {
  const [accesses, setAccesses] = useState<AccesFiduciaire[]>([]);
  const [exports, setExports] = useState<ExportFiduciaire[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les accès et exports
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [accessesData, exportsData] = await Promise.all([
        getAccesses(),
        getExports()
      ]);

      setAccesses(accessesData);
      setExports(exportsData);
    } catch (err) {
      console.error('Erreur lors du chargement des données fiduciaire:', err);
      setError('Impossible de charger les données. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Créer un nouvel accès
  const createAccess = async (
    email: string,
    nom: string,
    permissions: AccesFiduciaire['permissions']
  ) => {
    try {
      setLoading(true);
      setError(null);

      const newAccess = await createAccessService(email, nom, permissions);
      setAccesses(prev => [newAccess, ...prev]);

      return newAccess;
    } catch (err) {
      console.error('Erreur lors de la création de l\'accès:', err);
      setError('Erreur lors de la création de l\'accès');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Révoquer un accès
  const revokeAccess = async (accessId: string) => {
    try {
      setLoading(true);
      setError(null);

      await revokeAccessService(accessId);

      // Mettre à jour la liste locale
      setAccesses(prev =>
        prev.map(access =>
          access.id === accessId
            ? { ...access, actif: false }
            : access
        )
      );
    } catch (err) {
      console.error('Erreur lors de la révocation de l\'accès:', err);
      setError('Erreur lors de la révocation de l\'accès');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Générer un export
  const generateExport = async (
    accesId: string,
    type: ExportFiduciaire['type_export'],
    format: 'csv' | 'json',
    periodeDebut?: string,
    periodeFin?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const newExport = await createExportService(
        accesId,
        type,
        format,
        periodeDebut,
        periodeFin
      );

      setExports(prev => [newExport, ...prev]);

      return newExport;
    } catch (err) {
      console.error('Erreur lors de la génération de l\'export:', err);
      setError('Erreur lors de la génération de l\'export');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    accesses,
    exports,
    loading,
    error,
    createAccess,
    revokeAccess,
    generateExport,
    refreshData: loadData
  };
};
