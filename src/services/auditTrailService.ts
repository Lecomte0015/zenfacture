/**
 * Service Audit Trail avec intégrité blockchain-like
 *
 * Principe :
 * - Chaque action sur un document crée une entrée dans audit_trail
 * - Le hash de l'entrée est SHA-256 du contenu JSON
 * - Le hash_chaine = SHA-256(hash_precedent + hash_contenu)
 * - La chaîne permet de détecter toute falsification rétroactive
 */

import { supabase } from '../lib/supabaseClient';

export type AuditAction = 'create' | 'update' | 'delete' | 'view' | 'send' | 'archive';
export type AuditDocumentType = 'invoice' | 'expense' | 'devis' | 'avoir' | 'client' | 'produit' | 'organisation';

export interface AuditEntry {
  id: string;
  organisation_id: string;
  document_type: AuditDocumentType;
  document_id: string;
  action: AuditAction;
  user_id?: string;
  user_email?: string;
  contenu_json?: Record<string, unknown>;
  hash_contenu: string;
  hash_precedent?: string;
  hash_chaine: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface VerificationResult {
  valide: boolean;
  total_entrees: number;
  entrees_invalides: number;
  premiere_rupture?: string;
  rapport: {
    id: string;
    hash_chaine: string;
    hash_calcule: string;
    valide: boolean;
  }[];
}

// ─── CRYPTO ──────────────────────────────────────────────────────────────────

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── ENREGISTREMENT ──────────────────────────────────────────────────────────

/**
 * Enregistre une action dans l'audit trail avec chaînage de hash
 */
export async function enregistrerAction(
  organisationId: string,
  documentType: AuditDocumentType,
  documentId: string,
  action: AuditAction,
  contenu?: Record<string, unknown>,
  userEmail?: string
): Promise<AuditEntry> {
  // Récupérer le dernier hash de la chaîne
  const { data: derniere } = await supabase
    .from('audit_trail')
    .select('hash_chaine')
    .eq('organisation_id', organisationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const hashPrecedent = derniere?.hash_chaine || '0000000000000000000000000000000000000000000000000000000000000000';

  // Calculer le hash du contenu
  const contenuStr = JSON.stringify({
    organisation_id: organisationId,
    document_type: documentType,
    document_id: documentId,
    action,
    contenu: contenu || {},
    timestamp: new Date().toISOString(),
  });
  const hashContenu = await sha256(contenuStr);
  const hashChaine = await sha256(hashPrecedent + hashContenu);

  const { data, error } = await supabase
    .from('audit_trail')
    .insert({
      organisation_id: organisationId,
      document_type: documentType,
      document_id: documentId,
      action,
      user_email: userEmail,
      contenu_json: contenu,
      hash_contenu: hashContenu,
      hash_precedent: hashPrecedent,
      hash_chaine: hashChaine,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── LECTURE ─────────────────────────────────────────────────────────────────

export async function getAuditTrail(
  organisationId: string,
  options?: {
    document_type?: AuditDocumentType;
    document_id?: string;
    limit?: number;
  }
): Promise<AuditEntry[]> {
  let query = supabase
    .from('audit_trail')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('created_at', { ascending: false });

  if (options?.document_type) query = query.eq('document_type', options.document_type);
  if (options?.document_id) query = query.eq('document_id', options.document_id);
  if (options?.limit) query = query.limit(options.limit);
  else query = query.limit(200);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ─── VÉRIFICATION D'INTÉGRITÉ ────────────────────────────────────────────────

/**
 * Vérifie l'intégrité de toute la chaîne d'audit
 * Recalcule les hashes et détecte les falsifications
 */
export async function verifierIntegriteChaine(organisationId: string): Promise<VerificationResult> {
  const { data, error } = await supabase
    .from('audit_trail')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  const entrees: AuditEntry[] = data || [];

  const rapport: VerificationResult['rapport'] = [];
  let entrees_invalides = 0;
  let premiere_rupture: string | undefined;

  for (let i = 0; i < entrees.length; i++) {
    const entree = entrees[i];
    const hashPrecedent = i === 0
      ? '0000000000000000000000000000000000000000000000000000000000000000'
      : entrees[i - 1].hash_chaine;

    // Recalculer le hash de la chaîne
    const hashCalcule = await sha256(hashPrecedent + entree.hash_contenu);
    const valide = hashCalcule === entree.hash_chaine;

    if (!valide) {
      entrees_invalides++;
      if (!premiere_rupture) premiere_rupture = entree.id;
    }

    rapport.push({
      id: entree.id,
      hash_chaine: entree.hash_chaine,
      hash_calcule: hashCalcule,
      valide,
    });
  }

  return {
    valide: entrees_invalides === 0,
    total_entrees: entrees.length,
    entrees_invalides,
    premiere_rupture,
    rapport,
  };
}

/**
 * Exporte le rapport d'audit en JSON signé
 */
export function exporterAuditJSON(entries: AuditEntry[]): void {
  const rapport = {
    export_date: new Date().toISOString(),
    total_entrees: entries.length,
    premiere_entree: entries[entries.length - 1]?.created_at,
    derniere_entree: entries[0]?.created_at,
    entrees: entries,
  };
  const blob = new Blob([JSON.stringify(rapport, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── LABELS ──────────────────────────────────────────────────────────────────

export const ACTION_LABELS: Record<AuditAction, { label: string; color: string }> = {
  create: { label: 'Création', color: 'bg-green-100 text-green-700' },
  update: { label: 'Modification', color: 'bg-blue-100 text-blue-700' },
  delete: { label: 'Suppression', color: 'bg-red-100 text-red-700' },
  view: { label: 'Consultation', color: 'bg-gray-100 text-gray-600' },
  send: { label: 'Envoi', color: 'bg-purple-100 text-purple-700' },
  archive: { label: 'Archivage', color: 'bg-amber-100 text-amber-700' },
};

export const DOC_TYPE_LABELS: Record<AuditDocumentType, string> = {
  invoice: 'Facture',
  expense: 'Dépense',
  devis: 'Devis',
  avoir: 'Avoir',
  client: 'Client',
  produit: 'Produit',
  organisation: 'Organisation',
};
