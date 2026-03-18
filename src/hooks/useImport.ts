import { useState } from 'react';
import {
  parseCSV,
  detectSource,
  getBexioMapping,
  getCresusMapping,
  importData,
  getTargetColumns,
  ColumnMapping,
} from '../services/importService';

export type ImportStep = 1 | 2 | 3;
export type ImportSource = 'bexio' | 'cresus' | 'generic';
export type ImportType = 'clients' | 'factures' | 'produits' | 'depenses';

export interface ImportState {
  step: ImportStep;
  file: File | null;
  source: ImportSource;
  type: ImportType;
  headers: string[];
  rows: any[];
  mapping: ColumnMapping;
  progress: number;
  result: {
    nbImportees: number;
    nbErreurs: number;
    erreurs: any[];
  } | null;
  error: string | null;
  loading: boolean;
}

const initialState: ImportState = {
  step: 1,
  file: null,
  source: 'generic',
  type: 'clients',
  headers: [],
  rows: [],
  mapping: {},
  progress: 0,
  result: null,
  error: null,
  loading: false,
};

export const useImport = () => {
  const [state, setState] = useState<ImportState>(initialState);

  /**
   * Réinitialise l'état de l'import
   */
  const reset = () => {
    setState(initialState);
  };

  /**
   * Sélectionne et parse le fichier CSV
   */
  const selectFile = async (file: File) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { headers, rows } = await parseCSV(file);
      const detectedSource = detectSource(headers);

      setState(prev => ({
        ...prev,
        file,
        headers,
        rows,
        source: detectedSource,
        loading: false,
        error: null,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erreur lors de la lecture du fichier',
      }));
    }
  };

  /**
   * Change la source d'import
   */
  const setSource = (source: ImportSource) => {
    setState(prev => ({ ...prev, source }));
  };

  /**
   * Change le type de données à importer
   */
  const setType = (type: ImportType) => {
    setState(prev => {
      // Générer le mapping automatique basé sur la source et le type
      let autoMapping: ColumnMapping = {};

      if (prev.source === 'bexio') {
        autoMapping = getBexioMapping(type);
      } else if (prev.source === 'cresus') {
        autoMapping = getCresusMapping(type);
      }

      // Ne garder que les colonnes qui existent dans le fichier
      const filteredMapping: ColumnMapping = {};
      Object.entries(autoMapping).forEach(([sourceCol, targetCol]) => {
        if (prev.headers.includes(sourceCol)) {
          filteredMapping[sourceCol] = targetCol;
        }
      });

      return {
        ...prev,
        type,
        mapping: filteredMapping,
      };
    });
  };

  /**
   * Met à jour le mapping de colonnes
   */
  const updateMapping = (sourceColumn: string, targetColumn: string) => {
    setState(prev => ({
      ...prev,
      mapping: {
        ...prev.mapping,
        [sourceColumn]: targetColumn,
      },
    }));
  };

  /**
   * Supprime une colonne du mapping
   */
  const removeMapping = (sourceColumn: string) => {
    setState(prev => {
      const newMapping = { ...prev.mapping };
      delete newMapping[sourceColumn];
      return {
        ...prev,
        mapping: newMapping,
      };
    });
  };

  /**
   * Génère le mapping automatique
   */
  const autoMap = () => {
    setState(prev => {
      let autoMapping: ColumnMapping = {};

      if (prev.source === 'bexio') {
        autoMapping = getBexioMapping(prev.type);
      } else if (prev.source === 'cresus') {
        autoMapping = getCresusMapping(prev.type);
      } else {
        // Pour générique, essayer de deviner basé sur les noms de colonnes
        const targetColumns = getTargetColumns(prev.type);
        prev.headers.forEach(header => {
          const headerLower = header.toLowerCase();
          const match = targetColumns.find(tc =>
            tc.label.toLowerCase().includes(headerLower) ||
            headerLower.includes(tc.label.toLowerCase()) ||
            tc.key.toLowerCase() === headerLower
          );
          if (match) {
            autoMapping[header] = match.key;
          }
        });
      }

      // Ne garder que les colonnes qui existent dans le fichier
      const filteredMapping: ColumnMapping = {};
      Object.entries(autoMapping).forEach(([sourceCol, targetCol]) => {
        if (prev.headers.includes(sourceCol)) {
          filteredMapping[sourceCol] = targetCol;
        }
      });

      return {
        ...prev,
        mapping: filteredMapping,
      };
    });
  };

  /**
   * Passe à l'étape suivante
   */
  const nextStep = () => {
    setState(prev => ({
      ...prev,
      step: Math.min(3, prev.step + 1) as ImportStep,
    }));
  };

  /**
   * Retourne à l'étape précédente
   */
  const previousStep = () => {
    setState(prev => ({
      ...prev,
      step: Math.max(1, prev.step - 1) as ImportStep,
    }));
  };

  /**
   * Exécute l'import
   */
  const executeImport = async (organisationId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null, progress: 0 }));

    try {
      // Simuler la progression
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(95, prev.progress + 5),
        }));
      }, 200);

      const result = await importData(
        organisationId,
        state.source,
        state.type,
        state.rows,
        state.mapping
      );

      clearInterval(progressInterval);

      setState(prev => ({
        ...prev,
        loading: false,
        progress: 100,
        result,
      }));

      return result;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erreur lors de l\'import',
      }));
      throw error;
    }
  };

  /**
   * Obtient un aperçu des données avec le mapping appliqué
   */
  const getPreviewData = (limit: number = 3) => {
    const targetColumns = getTargetColumns(state.type);
    const previewRows = state.rows.slice(0, limit);

    return previewRows.map(row => {
      const mapped: any = {};
      Object.entries(state.mapping).forEach(([sourceCol, targetCol]) => {
        const targetColumn = targetColumns.find(tc => tc.key === targetCol);
        if (targetColumn) {
          mapped[targetColumn.label] = row[sourceCol] || '';
        }
      });
      return mapped;
    });
  };

  return {
    state,
    selectFile,
    setSource,
    setType,
    updateMapping,
    removeMapping,
    autoMap,
    nextStep,
    previousStep,
    executeImport,
    getPreviewData,
    reset,
  };
};
