import { supabase } from '../lib/supabaseClient';

export type DocumentType = 'invoice' | 'expense' | 'avoir' | 'devis';

export interface Archive {
  id: string;
  organisation_id: string;
  document_type: DocumentType;
  document_id: string;
  document_number: string | null;
  document_date: string | null;
  montant: number | null;
  archived_at: string;
  archive_expiry_at: string;
  archive_hash: string;
  archived_by: string | null;
  metadata: Record<string, unknown>;
}

// Génère un hash SHA-256 côté client (crypto Web API)
export const generateHash = async (content: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Archiver un document
export const archiveDocument = async (
  documentType: DocumentType,
  documentId: string,
  organisationId: string,
  documentContent: Record<string, unknown>
): Promise<string> => {
  const hash = await generateHash(JSON.stringify(documentContent));
  const { data, error } = await supabase.rpc('archiver_document', {
    p_document_type: documentType,
    p_document_id: documentId,
    p_organisation_id: organisationId,
    p_hash: hash,
    p_metadata: documentContent,
  });
  if (error) throw error;
  return data as string;
};

// Récupérer tous les documents archivés d'une organisation
export const getArchivedDocuments = async (organisationId: string): Promise<Archive[]> => {
  const { data, error } = await supabase
    .from('archives')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('archived_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

// Vérifier l'intégrité d'un document archivé
export const verifyArchiveIntegrity = async (
  archive: Archive,
  currentContent: Record<string, unknown>
): Promise<boolean> => {
  const currentHash = await generateHash(JSON.stringify(currentContent));
  return currentHash === archive.archive_hash;
};

// Exporter les archives en JSON (pour téléchargement)
export const exportArchivesAsJson = (archives: Archive[]): string => {
  return JSON.stringify({
    export_date: new Date().toISOString(),
    total_documents: archives.length,
    archives,
  }, null, 2);
};
