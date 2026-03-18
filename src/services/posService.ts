/**
 * Service Point de Vente (POS) — ZenFacture
 * Gère le panier, les ventes et la génération automatique de factures
 */

import { supabase } from '../lib/supabaseClient';

export interface ProduitPOS {
  id: string;
  nom: string;
  prix: number;
  taux_tva: number;
  reference?: string;
  categorie?: string;
  stock?: number;
}

export interface LignePanier {
  produit: ProduitPOS;
  quantite: number;
  remise_pct: number;
}

export interface TotalPanier {
  ht: number;
  tva: number;
  ttc: number;
  remise: number;
}

export type ModePaiement = 'especes' | 'carte' | 'twint' | 'virement' | 'bon';

export interface VentePOS {
  id: string;
  organisation_id: string;
  numero: string;
  lignes: LignePanier[];
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  remise_totale: number;
  mode_paiement: ModePaiement;
  montant_recu?: number;
  monnaie_rendue?: number;
  client_id?: string;
  client_nom?: string;
  invoice_id?: string;
  created_at: string;
}

// ─── PANIER ──────────────────────────────────────────────────────────────────

export function calculerTotalPanier(lignes: LignePanier[]): TotalPanier {
  let ht = 0;
  let tva = 0;
  let remise = 0;

  for (const ligne of lignes) {
    const prixHt = ligne.produit.prix * ligne.quantite;
    const remiseMontant = prixHt * (ligne.remise_pct / 100);
    const htNet = prixHt - remiseMontant;
    const tvaLigne = htNet * (ligne.produit.taux_tva / 100);
    ht += htNet;
    tva += tvaLigne;
    remise += remiseMontant;
  }

  return { ht, tva, ttc: ht + tva, remise };
}

// ─── PRODUITS POS ─────────────────────────────────────────────────────────────

export async function getProduitsPOS(organisationId: string): Promise<ProduitPOS[]> {
  const { data, error } = await supabase
    .from('produits')
    .select('id, nom, prix, taux_tva, reference, categorie')
    .eq('organisation_id', organisationId)
    .eq('actif', true)
    .order('nom');
  if (error) throw error;
  return (data || []).map(p => ({
    id: p.id,
    nom: p.nom,
    prix: p.prix || 0,
    taux_tva: p.taux_tva || 8.1,
    reference: p.reference,
    categorie: p.categorie,
  }));
}

// ─── VENTES ──────────────────────────────────────────────────────────────────

/**
 * Enregistre une vente et génère automatiquement une facture
 */
export async function enregistrerVente(
  organisationId: string,
  lignes: LignePanier[],
  modePaiement: ModePaiement,
  options?: {
    client_id?: string;
    client_nom?: string;
    montant_recu?: number;
    generer_facture?: boolean;
  }
): Promise<VentePOS> {
  const totaux = calculerTotalPanier(lignes);

  // Générer numéro de vente
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('ventes_pos')
    .select('*', { count: 'exact', head: true })
    .eq('organisation_id', organisationId)
    .gte('created_at', `${year}-01-01`);
  const numero = `V${year}-${((count || 0) + 1).toString().padStart(4, '0')}`;

  const monnaie_rendue = options?.montant_recu
    ? Math.max(0, options.montant_recu - totaux.ttc)
    : undefined;

  // Créer la vente
  const { data: vente, error: venteError } = await supabase
    .from('ventes_pos')
    .insert({
      organisation_id: organisationId,
      numero,
      lignes: JSON.stringify(lignes),
      total_ht: totaux.ht,
      total_tva: totaux.tva,
      total_ttc: totaux.ttc,
      remise_totale: totaux.remise,
      mode_paiement: modePaiement,
      montant_recu: options?.montant_recu,
      monnaie_rendue,
      client_id: options?.client_id,
      client_nom: options?.client_nom,
    })
    .select()
    .single();

  if (venteError) throw venteError;

  // Générer la facture si demandé
  if (options?.generer_facture !== false) {
    const today = new Date().toISOString().split('T')[0];
    const due = new Date();
    due.setDate(due.getDate() + 30);
    const dueDateStr = due.toISOString().split('T')[0];

    const { data: invoice } = await supabase
      .from('invoices')
      .insert({
        organisation_id: organisationId,
        client_id: options?.client_id,
        client_nom: options?.client_nom || 'Client comptant',
        numero: numero.replace('V', 'F'),
        date: today,
        date_echeance: dueDateStr,
        statut: 'paye',
        total_ht: totaux.ht,
        total_tva: totaux.tva,
        total_ttc: totaux.ttc,
        notes: `Vente POS ${numero} — ${modePaiement}`,
      })
      .select('id')
      .single();

    if (invoice) {
      // Créer les lignes de facture
      const items = lignes.map((l, idx) => ({
        invoice_id: invoice.id,
        description: l.produit.nom,
        quantite: l.quantite,
        prix_unitaire: l.produit.prix,
        taux_tva: l.produit.taux_tva,
        total_ht: l.produit.prix * l.quantite * (1 - l.remise_pct / 100),
        ordre: idx + 1,
      }));
      await supabase.from('invoice_items').insert(items);

      // Lier la vente à la facture
      await supabase
        .from('ventes_pos')
        .update({ invoice_id: invoice.id })
        .eq('id', vente.id);

      vente.invoice_id = invoice.id;
    }
  }

  return { ...vente, lignes };
}

/**
 * Récupère les ventes POS
 */
export async function getVentesPOS(organisationId: string, limit = 50): Promise<VentePOS[]> {
  const { data, error } = await supabase
    .from('ventes_pos')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(v => ({
    ...v,
    lignes: typeof v.lignes === 'string' ? JSON.parse(v.lignes) : v.lignes || [],
  }));
}

/**
 * Stats du jour
 */
export async function getStatsPOS(organisationId: string): Promise<{
  ventes_aujourd_hui: number;
  ca_aujourd_hui: number;
  ventes_mois: number;
  ca_mois: number;
}> {
  const today = new Date().toISOString().split('T')[0];
  const debutMois = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;

  const { data } = await supabase
    .from('ventes_pos')
    .select('total_ttc, created_at')
    .eq('organisation_id', organisationId);

  const ventes = data || [];
  const aujourd_hui = ventes.filter(v => v.created_at.startsWith(today));
  const ce_mois = ventes.filter(v => v.created_at >= debutMois);

  return {
    ventes_aujourd_hui: aujourd_hui.length,
    ca_aujourd_hui: aujourd_hui.reduce((sum, v) => sum + v.total_ttc, 0),
    ventes_mois: ce_mois.length,
    ca_mois: ce_mois.reduce((sum, v) => sum + v.total_ttc, 0),
  };
}
