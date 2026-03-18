import { supabase } from '../lib/supabaseClient';

export interface BatchClient {
  id: string;
  nom: string;
  email: string;
  selected: boolean;
}

export interface BatchItem {
  description: string;
  quantite: number;
  prix_unitaire: number;
  taux_tva: number;
}

export interface BatchInvoiceConfig {
  date: string;
  date_echeance: string;
  items: BatchItem[];
  notes?: string;
  conditions?: string;
  organisation_id: string;
}

export interface BatchResult {
  client_id: string;
  client_nom: string;
  invoice_id?: string;
  numero?: string;
  success: boolean;
  error?: string;
}

export interface BatchSummary {
  total: number;
  success: number;
  failed: number;
  results: BatchResult[];
}

/**
 * Récupère les clients disponibles pour la facturation groupée
 */
export async function getBatchClients(organisationId: string): Promise<BatchClient[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, nom, email')
    .eq('organisation_id', organisationId)
    .order('nom');

  if (error) throw error;

  return (data || []).map(c => ({
    id: c.id,
    nom: c.nom || 'Client sans nom',
    email: c.email || '',
    selected: false,
  }));
}

/**
 * Génère le prochain numéro de facture pour l'organisation
 */
async function getNextInvoiceNumber(organisationId: string): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('organisation_id', organisationId)
    .gte('created_at', `${year}-01-01`);

  const seq = ((count || 0) + 1).toString().padStart(4, '0');
  return `F${year}-${seq}`;
}

/**
 * Calcule les totaux d'une ligne
 */
function calculerLigne(item: BatchItem) {
  const ht = item.quantite * item.prix_unitaire;
  const tva = ht * (item.taux_tva / 100);
  return { ht, tva, ttc: ht + tva };
}

/**
 * Génère des factures pour tous les clients sélectionnés
 */
export async function generateBatchInvoices(
  clientIds: string[],
  config: BatchInvoiceConfig,
  onProgress?: (current: number, total: number) => void
): Promise<BatchSummary> {
  const results: BatchResult[] = [];
  let success = 0;
  let failed = 0;

  // Récupérer les infos clients
  const { data: clients } = await supabase
    .from('clients')
    .select('id, nom, email, adresse, code_postal, ville, pays')
    .in('id', clientIds);

  const clientMap = new Map((clients || []).map(c => [c.id, c]));

  for (let i = 0; i < clientIds.length; i++) {
    const clientId = clientIds[i];
    const client = clientMap.get(clientId);

    onProgress?.(i + 1, clientIds.length);

    if (!client) {
      results.push({ client_id: clientId, client_nom: 'Inconnu', success: false, error: 'Client introuvable' });
      failed++;
      continue;
    }

    try {
      // Calculer les totaux
      let totalHt = 0;
      let totalTva = 0;
      for (const item of config.items) {
        const { ht, tva } = calculerLigne(item);
        totalHt += ht;
        totalTva += tva;
      }
      const totalTtc = totalHt + totalTva;

      // Générer numéro unique
      const numero = await getNextInvoiceNumber(config.organisation_id);

      // Créer la facture
      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .insert({
          organisation_id: config.organisation_id,
          client_id: clientId,
          numero,
          date: config.date,
          date_echeance: config.date_echeance,
          statut: 'brouillon',
          total_ht: totalHt,
          total_tva: totalTva,
          total_ttc: totalTtc,
          notes: config.notes,
          conditions: config.conditions,
          client_nom: client.nom,
          client_email: client.email,
          client_adresse: client.adresse,
          client_code_postal: client.code_postal,
          client_ville: client.ville,
          client_pays: client.pays || 'Suisse',
        })
        .select('id, numero')
        .single();

      if (invError) throw invError;

      // Créer les lignes de facture
      const lignes = config.items.map((item, idx) => {
        const { ht } = calculerLigne(item);
        return {
          invoice_id: invoice.id,
          description: item.description,
          quantite: item.quantite,
          prix_unitaire: item.prix_unitaire,
          taux_tva: item.taux_tva,
          total_ht: ht,
          ordre: idx + 1,
        };
      });

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(lignes);

      if (itemsError) throw itemsError;

      results.push({
        client_id: clientId,
        client_nom: client.nom,
        invoice_id: invoice.id,
        numero: invoice.numero,
        success: true,
      });
      success++;

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      results.push({
        client_id: clientId,
        client_nom: client?.nom || 'Inconnu',
        success: false,
        error: message,
      });
      failed++;
    }
  }

  return { total: clientIds.length, success, failed, results };
}

/**
 * Récupère l'historique des générations groupées (dernières factures en lot)
 */
export async function getBatchHistory(organisationId: string, limit = 50) {
  const { data, error } = await supabase
    .from('invoices')
    .select('id, numero, client_nom, statut, total_ttc, created_at')
    .eq('organisation_id', organisationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
