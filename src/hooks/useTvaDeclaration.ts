import { useState, useEffect, useCallback } from 'react';
import {
  calculateTva,
  createDeclaration,
  getDeclarations,
  updateDeclaration,
  validateDeclaration,
  generateXml,
  deleteDeclaration,
  getOrganisationId,
} from '@/services/tvaDeclarationService';
import type {
  TvaCalculation,
  TvaDeclaration,
  TvaDeclarationData,
  TvaMethode,
} from '@/types/tva';

interface UseTvaDeclarationReturn {
  declarations: TvaDeclaration[];
  currentCalculation: TvaCalculation | null;
  loading: boolean;
  error: string | null;
  calculate: (
    periodeDebut: string,
    periodeFin: string,
    methode: TvaMethode
  ) => Promise<TvaCalculation>;
  create: (
    data: Omit<TvaDeclarationData, 'organisation_id'>
  ) => Promise<TvaDeclaration>;
  update: (
    id: string,
    data: Partial<TvaDeclarationData>
  ) => Promise<TvaDeclaration>;
  validate: (id: string) => Promise<TvaDeclaration>;
  remove: (id: string) => Promise<void>;
  generateXmlFile: (declaration: TvaDeclaration) => string;
  downloadXml: (declaration: TvaDeclaration) => void;
  refresh: () => Promise<void>;
}

export function useTvaDeclaration(): UseTvaDeclarationReturn {
  const [declarations, setDeclarations] = useState<TvaDeclaration[]>([]);
  const [currentCalculation, setCurrentCalculation] =
    useState<TvaCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organisationId, setOrganisationId] = useState<string | null>(null);

  // Récupérer l'organisation ID au chargement
  useEffect(() => {
    const fetchOrganisationId = async () => {
      const orgId = await getOrganisationId();
      setOrganisationId(orgId);
    };
    fetchOrganisationId();
  }, []);

  // Charger les déclarations
  const loadDeclarations = useCallback(async () => {
    if (!organisationId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getDeclarations(organisationId);
      setDeclarations(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement des déclarations'
      );
    } finally {
      setLoading(false);
    }
  }, [organisationId]);

  // Charger les déclarations au montage et quand organisationId change
  useEffect(() => {
    loadDeclarations();
  }, [loadDeclarations]);

  // Calculer la TVA
  const calculate = useCallback(
    async (
      periodeDebut: string,
      periodeFin: string,
      methode: TvaMethode
    ): Promise<TvaCalculation> => {
      if (!organisationId) {
        throw new Error('Organisation non trouvée');
      }

      try {
        setLoading(true);
        setError(null);
        const calculation = await calculateTva(
          organisationId,
          periodeDebut,
          periodeFin,
          methode
        );
        setCurrentCalculation(calculation);
        return calculation;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Erreur lors du calcul de la TVA';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [organisationId]
  );

  // Créer une déclaration
  const create = useCallback(
    async (
      data: Omit<TvaDeclarationData, 'organisation_id'>
    ): Promise<TvaDeclaration> => {
      if (!organisationId) {
        throw new Error('Organisation non trouvée');
      }

      try {
        setLoading(true);
        setError(null);
        const declaration = await createDeclaration(organisationId, data);
        await loadDeclarations();
        return declaration;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Erreur lors de la création de la déclaration';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [organisationId, loadDeclarations]
  );

  // Mettre à jour une déclaration
  const update = useCallback(
    async (
      id: string,
      data: Partial<TvaDeclarationData>
    ): Promise<TvaDeclaration> => {
      try {
        setLoading(true);
        setError(null);
        const declaration = await updateDeclaration(id, data);
        await loadDeclarations();
        return declaration;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Erreur lors de la mise à jour de la déclaration';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadDeclarations]
  );

  // Valider une déclaration
  const validate = useCallback(
    async (id: string): Promise<TvaDeclaration> => {
      try {
        setLoading(true);
        setError(null);
        const declaration = await validateDeclaration(id);
        await loadDeclarations();
        return declaration;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Erreur lors de la validation de la déclaration';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadDeclarations]
  );

  // Supprimer une déclaration
  const remove = useCallback(
    async (id: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        await deleteDeclaration(id);
        await loadDeclarations();
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Erreur lors de la suppression de la déclaration';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadDeclarations]
  );

  // Générer le XML
  const generateXmlFile = useCallback((declaration: TvaDeclaration): string => {
    return generateXml(declaration);
  }, []);

  // Télécharger le XML
  const downloadXml = useCallback((declaration: TvaDeclaration): void => {
    const xml = generateXml(declaration);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `declaration_tva_${declaration.periode_debut}_${declaration.periode_fin}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // Rafraîchir les données
  const refresh = useCallback(async (): Promise<void> => {
    await loadDeclarations();
  }, [loadDeclarations]);

  return {
    declarations,
    currentCalculation,
    loading,
    error,
    calculate,
    create,
    update,
    validate,
    remove,
    generateXmlFile,
    downloadXml,
    refresh,
  };
}
