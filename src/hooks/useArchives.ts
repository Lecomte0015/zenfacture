import { useState, useEffect, useCallback } from 'react';
import { Archive, DocumentType, getArchivedDocuments, archiveDocument } from '../services/archiveService';
import { useOrganisation } from '../context/OrganisationContext';

export const useArchives = () => {
  const [archives, setArchives] = useState<Archive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organisationId } = useOrganisation();

  const fetchArchives = useCallback(async () => {
    if (!organisationId) return;
    setLoading(true);
    try {
      const data = await getArchivedDocuments(organisationId);
      setArchives(data);
    } catch {
      setError('Impossible de charger les archives.');
    } finally {
      setLoading(false);
    }
  }, [organisationId]);

  const archive = async (
    documentType: DocumentType,
    documentId: string,
    documentContent: Record<string, unknown>
  ) => {
    if (!organisationId) throw new Error('Organisation non trouvée');
    await archiveDocument(documentType, documentId, organisationId, documentContent);
    await fetchArchives();
  };

  useEffect(() => {
    if (organisationId) fetchArchives();
    else setLoading(false);
  }, [organisationId, fetchArchives]);

  return { archives, loading, error, archive, refreshArchives: fetchArchives };
};
