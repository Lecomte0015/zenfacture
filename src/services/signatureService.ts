/**
 * Service Signature Électronique — ZenFacture (Phase 8.4)
 *
 * Permet d'envoyer des documents (devis, factures, contrats) à signer
 * via un lien sécurisé. Le signataire dessine ou tape sa signature
 * sur une page publique sans compte requis.
 *
 * Fonctionnalités :
 * - Envoi d'une demande de signature par email
 * - Page publique de signature (canvas HTML5)
 * - Acceptation avec nom + signature dessinée ou tapée
 * - Mise à jour automatique du statut du document
 * - Historique des signatures (preuve légale)
 */

import { supabase } from '../lib/supabaseClient';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type DocumentType = 'devis' | 'facture' | 'contrat';
export type StatutSignature = 'en_attente' | 'vu' | 'signe' | 'refuse' | 'expire';

export interface SignatureDemande {
  id: string;
  organisation_id: string;
  document_type: DocumentType;
  document_id: string;
  document_titre: string;
  signataire_nom: string;
  signataire_email: string;
  token: string;
  statut: StatutSignature;
  message_personnalise?: string;
  signature_data?: string;
  signature_type?: 'dessinee' | 'tapee';
  nom_signe?: string;
  ip_signataire?: string;
  signe_at?: string;
  vu_at?: string;
  refuse_raison?: string;
  expires_at: string;
  created_at: string;
}

export interface SignaturePublicData {
  demande: SignatureDemande;
  organisation: {
    nom: string;
    logo_url?: string;
    couleur_principale?: string;
  };
  document: {
    titre: string;
    type: DocumentType;
    numero?: string;
    date?: string;
    total?: number;
    devise?: string;
    contenu_texte?: string;
  };
}

// ─── STATUTS ──────────────────────────────────────────────────────────────────

export const STATUTS_SIGNATURE: Record<StatutSignature, {
  label: string; couleur: string; bg: string; emoji: string;
}> = {
  en_attente: { label: 'En attente',  couleur: 'text-yellow-600', bg: 'bg-yellow-100', emoji: '⏳' },
  vu:         { label: 'Vu',          couleur: 'text-blue-600',   bg: 'bg-blue-100',   emoji: '👁' },
  signe:      { label: 'Signé',       couleur: 'text-green-600',  bg: 'bg-green-100',  emoji: '✅' },
  refuse:     { label: 'Refusé',      couleur: 'text-red-600',    bg: 'bg-red-100',    emoji: '❌' },
  expire:     { label: 'Expiré',      couleur: 'text-gray-600',   bg: 'bg-gray-100',   emoji: '🕐' },
};

// ─── GESTION DEMANDES (ADMIN) ─────────────────────────────────────────────────

export async function getDemandesSignature(
  organisationId: string,
  documentId?: string
): Promise<SignatureDemande[]> {
  let q = supabase
    .from('signature_demandes')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('created_at', { ascending: false });

  if (documentId) q = q.eq('document_id', documentId);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function creerDemandeSignature(
  organisationId: string,
  payload: {
    document_type: DocumentType;
    document_id: string;
    document_titre: string;
    signataire_nom: string;
    signataire_email: string;
    message_personnalise?: string;
    expires_days?: number;
  }
): Promise<SignatureDemande> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (payload.expires_days ?? 30));

  const { data, error } = await supabase
    .from('signature_demandes')
    .insert({
      organisation_id: organisationId,
      document_type: payload.document_type,
      document_id: payload.document_id,
      document_titre: payload.document_titre,
      signataire_nom: payload.signataire_nom,
      signataire_email: payload.signataire_email,
      message_personnalise: payload.message_personnalise,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function annulerDemande(id: string): Promise<void> {
  const { error } = await supabase
    .from('signature_demandes')
    .update({ statut: 'expire' })
    .eq('id', id);
  if (error) throw error;
}

// ─── ACCÈS PUBLIC (TOKEN) ─────────────────────────────────────────────────────

export async function getSignatureParToken(token: string): Promise<SignaturePublicData | null> {
  const { data: demande, error } = await supabase
    .from('signature_demandes')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !demande) return null;
  if (new Date(demande.expires_at) < new Date()) return null;

  // Marquer comme "vu" si en attente
  if (demande.statut === 'en_attente') {
    await supabase
      .from('signature_demandes')
      .update({ statut: 'vu', vu_at: new Date().toISOString() })
      .eq('id', demande.id);
  }

  // Récupérer les infos de l'organisation
  const { data: org } = await supabase
    .from('organizations')
    .select('name, logo_url, primary_color')
    .eq('id', demande.organisation_id)
    .single();

  // Récupérer les infos du document selon son type
  let documentInfo: SignaturePublicData['document'] = {
    titre: demande.document_titre,
    type: demande.document_type,
  };

  if (demande.document_type === 'devis') {
    const { data: devis } = await supabase
      .from('devis')
      .select('numero, date, total_ttc, devise, notes, client_nom')
      .eq('id', demande.document_id)
      .single();
    if (devis) {
      documentInfo = {
        ...documentInfo,
        numero: devis.numero,
        date: devis.date,
        total: devis.total_ttc,
        devise: devis.devise,
        contenu_texte: devis.notes,
      };
    }
  } else if (demande.document_type === 'facture') {
    const { data: facture } = await supabase
      .from('invoices')
      .select('invoice_number, date, total, devise, notes')
      .eq('id', demande.document_id)
      .single();
    if (facture) {
      documentInfo = {
        ...documentInfo,
        numero: facture.invoice_number,
        date: facture.date,
        total: facture.total,
        devise: facture.devise,
        contenu_texte: facture.notes,
      };
    }
  }

  return {
    demande: { ...demande, statut: demande.statut === 'en_attente' ? 'vu' : demande.statut },
    organisation: {
      nom: org?.name || 'Mon Entreprise',
      logo_url: org?.logo_url,
      couleur_principale: org?.primary_color || '#2563EB',
    },
    document: documentInfo,
  };
}

export async function enregistrerSignature(
  token: string,
  payload: {
    signature_data?: string;
    signature_type: 'dessinee' | 'tapee';
    nom_signe: string;
  }
): Promise<boolean> {
  const { data: demande, error } = await supabase
    .from('signature_demandes')
    .select('id, statut, document_type, document_id, expires_at')
    .eq('token', token)
    .single();

  if (error || !demande) return false;
  if (['signe', 'refuse', 'expire'].includes(demande.statut)) return false;
  if (new Date(demande.expires_at) < new Date()) return false;

  // Enregistrer la signature
  const { error: updateErr } = await supabase
    .from('signature_demandes')
    .update({
      statut: 'signe',
      signature_data: payload.signature_data,
      signature_type: payload.signature_type,
      nom_signe: payload.nom_signe,
      signe_at: new Date().toISOString(),
    })
    .eq('id', demande.id);

  if (updateErr) return false;

  // Mettre à jour le statut du document source
  if (demande.document_type === 'devis') {
    await supabase
      .from('devis')
      .update({ statut: 'accepte' })
      .eq('id', demande.document_id);
  }

  return true;
}

export async function refuserSignature(token: string, raison?: string): Promise<boolean> {
  const { data: demande } = await supabase
    .from('signature_demandes')
    .select('id, statut')
    .eq('token', token)
    .single();

  if (!demande || ['signe', 'refuse', 'expire'].includes(demande.statut)) return false;

  const { error } = await supabase
    .from('signature_demandes')
    .update({
      statut: 'refuse',
      refuse_raison: raison,
    })
    .eq('id', demande.id);

  return !error;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function buildSignatureUrl(token: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://zenfacture.ch';
  return `${base}/signer/${token}`;
}

export function genererEmailSignature(opts: {
  signataire_nom: string;
  org_nom: string;
  document_titre: string;
  lien_signature: string;
  message?: string;
  expires_at: string;
}): string {
  const expiry = new Date(opts.expires_at).toLocaleDateString('fr-CH');
  return `
Bonjour ${opts.signataire_nom},

${opts.org_nom} vous envoie un document à signer électroniquement.

Document : ${opts.document_titre}
${opts.message ? `\nMessage : ${opts.message}\n` : ''}
Pour signer, cliquez sur le lien ci-dessous :
${opts.lien_signature}

Ce lien expire le ${expiry}.

Cordialement,
${opts.org_nom}
  `.trim();
}
