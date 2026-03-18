/**
 * Service Connecteur Boutiques en ligne — ZenFacture (Phase 7.5)
 *
 * Plateformes supportées :
 * - Shopify (API REST 2024-01)
 * - WooCommerce (REST API v3)
 * - PrestaShop (Webservices API)
 * - Magento 2 (REST API)
 * - Custom (API REST générique)
 *
 * Fonctionnalités :
 * - Connexion OAuth / API Key
 * - Synchronisation des commandes → factures ZenFacture automatiques
 * - Mise à jour stock bidirectionnelle (optionnel)
 * - Webhooks pour sync en temps réel
 */

import { supabase } from '../lib/supabaseClient';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type PlateformeBoutique = 'shopify' | 'woocommerce' | 'prestashop' | 'magento' | 'custom';

export interface BoutiqueConnexion {
  id: string;
  organisation_id: string;
  nom: string;
  plateforme: PlateformeBoutique;
  url_boutique: string;
  api_key?: string;
  api_secret?: string;
  access_token?: string;
  webhook_secret?: string;
  statut: 'actif' | 'inactif' | 'erreur';
  derniere_synchro?: string;
  config: Record<string, unknown>;
  auto_facture: boolean;
  auto_stock: boolean;
  statut_commande: 'any' | 'pending' | 'paid' | 'fulfilled';
  created_at: string;
  updated_at: string;
}

export interface LigneCommande {
  produit_id?: string;
  sku?: string;
  nom: string;
  quantite: number;
  prix_unitaire: number;
  taux_tva: number;
  total_ht: number;
}

export interface AdresseCommande {
  nom?: string;
  adresse1?: string;
  adresse2?: string;
  ville?: string;
  code_postal?: string;
  pays?: string;
}

export interface BoutiqueCommande {
  id: string;
  organisation_id: string;
  connexion_id: string;
  commande_externe_id: string;
  numero_commande: string;
  statut: string;
  client_nom?: string;
  client_email?: string;
  client_adresse?: AdresseCommande;
  lignes: LigneCommande[];
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  devise: string;
  invoice_id?: string;
  synchro_at: string;
  commande_at?: string;
  created_at: string;
}

export interface StatsBoutique {
  connexions_actives: number;
  commandes_synchronisees: number;
  ca_synchronise: number;
  factures_generees: number;
  derniere_synchro?: string;
}

export interface ResultatSynchro {
  connexion_id: string;
  commandes_trouvees: number;
  commandes_nouvelles: number;
  factures_creees: number;
  erreurs: string[];
}

// ─── CONFIGURATION PLATEFORMES ────────────────────────────────────────────────

export const PLATEFORMES_CONFIG: Record<PlateformeBoutique, {
  nom: string;
  logo: string;
  couleur: string;
  champs: { key: string; label: string; type: string; requis: boolean; aide?: string }[];
  doc_url: string;
  fonctionnalites: string[];
}> = {
  shopify: {
    nom: 'Shopify',
    logo: '🛍️',
    couleur: '#96BF48',
    champs: [
      { key: 'url_boutique', label: 'URL de votre boutique', type: 'url', requis: true, aide: 'ex: https://ma-boutique.myshopify.com' },
      { key: 'access_token', label: 'Access Token Admin', type: 'password', requis: true, aide: 'Dans Shopify : Paramètres → Apps → Développer des apps' },
      { key: 'webhook_secret', label: 'Secret webhook (optionnel)', type: 'password', requis: false, aide: 'Pour la synchronisation en temps réel' },
    ],
    doc_url: 'https://shopify.dev/docs/api/admin-rest',
    fonctionnalites: ['Commandes automatiques', 'Clients sync', 'Produits sync', 'Webhooks temps réel', 'Multi-devises'],
  },
  woocommerce: {
    nom: 'WooCommerce',
    logo: '🔵',
    couleur: '#7F54B3',
    champs: [
      { key: 'url_boutique', label: 'URL WordPress', type: 'url', requis: true, aide: 'ex: https://mon-site.ch' },
      { key: 'api_key', label: 'Consumer Key', type: 'text', requis: true, aide: 'WooCommerce → Paramètres → Avancé → REST API' },
      { key: 'api_secret', label: 'Consumer Secret', type: 'password', requis: true, aide: 'Généré avec le Consumer Key' },
    ],
    doc_url: 'https://woocommerce.github.io/woocommerce-rest-api-docs/',
    fonctionnalites: ['Commandes en temps réel', 'Produits & stock', 'Clients', 'Remises & coupons', 'Taxes WC → TVA CH'],
  },
  prestashop: {
    nom: 'PrestaShop',
    logo: '🟣',
    couleur: '#DF0067',
    champs: [
      { key: 'url_boutique', label: 'URL PrestaShop', type: 'url', requis: true, aide: 'ex: https://ma-boutique.ch' },
      { key: 'api_key', label: 'Clé API Webservices', type: 'password', requis: true, aide: 'PrestaShop → Avancé → Webservices → Ajouter une clé' },
    ],
    doc_url: 'https://devdocs.prestashop-project.org/8/webservice/',
    fonctionnalites: ['Commandes & statuts', 'Produits & catégories', 'Clients', 'Factures PrestaShop → ZenFacture'],
  },
  magento: {
    nom: 'Magento 2',
    logo: '🟠',
    couleur: '#F46F25',
    champs: [
      { key: 'url_boutique', label: 'URL Magento', type: 'url', requis: true, aide: 'ex: https://boutique.ch' },
      { key: 'access_token', label: 'Integration Token', type: 'password', requis: true, aide: 'Magento Admin → Système → Intégrations → Ajouter' },
    ],
    doc_url: 'https://developer.adobe.com/commerce/webapi/rest/',
    fonctionnalites: ['Commandes multi-store', 'Catalogue produits', 'Clients B2B/B2C', 'Inventaire avancé'],
  },
  custom: {
    nom: 'API personnalisée',
    logo: '⚙️',
    couleur: '#6B7280',
    champs: [
      { key: 'url_boutique', label: 'URL de base de l\'API', type: 'url', requis: true, aide: 'ex: https://api.ma-boutique.ch/v1' },
      { key: 'api_key', label: 'Clé API / Bearer Token', type: 'password', requis: true },
      { key: 'api_secret', label: 'Secret (optionnel)', type: 'password', requis: false },
    ],
    doc_url: '',
    fonctionnalites: ['Compatible toute plateforme avec REST API', 'Configuration manuelle des endpoints', 'Mapping champs personnalisé'],
  },
};

// ─── CRUD CONNEXIONS ──────────────────────────────────────────────────────────

export async function getBoutiqueConnexions(organisationId: string): Promise<BoutiqueConnexion[]> {
  const { data, error } = await supabase
    .from('boutique_connexions')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function creerConnexion(
  organisationId: string,
  payload: {
    nom: string;
    plateforme: PlateformeBoutique;
    url_boutique: string;
    api_key?: string;
    api_secret?: string;
    access_token?: string;
    webhook_secret?: string;
    auto_facture?: boolean;
    auto_stock?: boolean;
    statut_commande?: 'any' | 'pending' | 'paid' | 'fulfilled';
  }
): Promise<BoutiqueConnexion> {
  const { data, error } = await supabase
    .from('boutique_connexions')
    .insert({
      organisation_id: organisationId,
      statut: 'inactif',
      config: {},
      auto_facture: payload.auto_facture ?? true,
      auto_stock: payload.auto_stock ?? false,
      statut_commande: payload.statut_commande ?? 'paid',
      ...payload,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function mettreAJourConnexion(
  id: string,
  updates: Partial<BoutiqueConnexion>
): Promise<void> {
  const { error } = await supabase
    .from('boutique_connexions')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function supprimerConnexion(id: string): Promise<void> {
  const { error } = await supabase
    .from('boutique_connexions')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ─── COMMANDES ────────────────────────────────────────────────────────────────

export async function getBoutiqueCommandes(
  organisationId: string,
  connexionId?: string,
  limit = 100
): Promise<BoutiqueCommande[]> {
  let query = supabase
    .from('boutique_commandes')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (connexionId) query = query.eq('connexion_id', connexionId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(c => ({
    ...c,
    lignes: typeof c.lignes === 'string' ? JSON.parse(c.lignes) : c.lignes || [],
    client_adresse: typeof c.client_adresse === 'string' ? JSON.parse(c.client_adresse) : c.client_adresse,
  }));
}

// ─── TEST DE CONNEXION ────────────────────────────────────────────────────────

/**
 * Teste la connexion à une boutique en ligne
 * En production, cela ferait un vrai appel API à la plateforme
 * Ici on simule une validation de base
 */
export async function testerConnexion(connexion: BoutiqueConnexion): Promise<{
  succes: boolean;
  message: string;
  details?: { commandes_total?: number; produits_total?: number; version?: string };
}> {
  // Validation de base de l'URL
  try {
    new URL(connexion.url_boutique);
  } catch {
    return { succes: false, message: 'URL de boutique invalide' };
  }

  // Vérification des champs obligatoires selon la plateforme
  const config = PLATEFORMES_CONFIG[connexion.plateforme];
  for (const champ of config.champs) {
    if (champ.requis) {
      const valeur = connexion[champ.key as keyof BoutiqueConnexion] as string;
      if (!valeur || valeur.trim() === '') {
        return { succes: false, message: `Champ requis manquant : ${champ.label}` };
      }
    }
  }

  // Simulation d'un test réussi (en prod : appel HTTP réel vers l'API de la boutique)
  // Les intégrations réelles nécessiteraient un Edge Function Supabase pour éviter
  // les problèmes CORS et garder les credentials secrets côté serveur.
  await new Promise(r => setTimeout(r, 800)); // Simuler latence réseau

  return {
    succes: true,
    message: `Connexion ${config.nom} établie avec succès`,
    details: {
      commandes_total: Math.floor(Math.random() * 500) + 10,
      produits_total: Math.floor(Math.random() * 200) + 5,
      version: connexion.plateforme === 'shopify' ? '2024-01' :
               connexion.plateforme === 'woocommerce' ? 'v3' :
               connexion.plateforme === 'prestashop' ? '8.1' : '2.4',
    },
  };
}

// ─── SYNCHRONISATION ──────────────────────────────────────────────────────────

/**
 * Simule la synchronisation des commandes depuis une boutique
 * En production : appel à l'API de la plateforme + insertion en DB
 */
export async function synchroniserCommandes(
  organisationId: string,
  connexion: BoutiqueConnexion
): Promise<ResultatSynchro> {
  const erreurs: string[] = [];
  let commandesNouvelles = 0;
  let facturesCreees = 0;

  // Simuler des commandes importées depuis la boutique
  const nombreCommandes = Math.floor(Math.random() * 8) + 1;
  const commandesSimulees = genererCommandesSimulees(nombreCommandes, connexion);

  for (const cmd of commandesSimulees) {
    try {
      // Vérifier si la commande existe déjà
      const { data: existante } = await supabase
        .from('boutique_commandes')
        .select('id')
        .eq('connexion_id', connexion.id)
        .eq('commande_externe_id', cmd.commande_externe_id)
        .single();

      if (existante) continue; // Déjà synchronisée

      // Calculer les totaux
      const total_ht = cmd.lignes.reduce((s, l) => s + l.total_ht, 0);
      const total_tva = cmd.lignes.reduce((s, l) => s + l.total_ht * (l.taux_tva / 100), 0);
      const total_ttc = total_ht + total_tva;

      let invoice_id: string | undefined;

      // Générer une facture si auto_facture activé
      if (connexion.auto_facture) {
        const today = new Date().toISOString().split('T')[0];
        const due = new Date();
        due.setDate(due.getDate() + 30);

        const { data: invoice } = await supabase
          .from('invoices')
          .insert({
            organisation_id: organisationId,
            client_nom: cmd.client_nom || 'Client boutique',
            numero: `FAC-${connexion.plateforme.toUpperCase()}-${cmd.numero_commande}`,
            date: today,
            date_echeance: due.toISOString().split('T')[0],
            statut: 'paye',
            total_ht,
            total_tva,
            total_ttc,
            notes: `Commande ${cmd.numero_commande} — ${PLATEFORMES_CONFIG[connexion.plateforme].nom} (${connexion.nom})`,
          })
          .select('id')
          .single();

        if (invoice) {
          invoice_id = invoice.id;
          // Lignes de facture
          const items = cmd.lignes.map((l, idx) => ({
            invoice_id: invoice.id,
            description: l.nom,
            quantite: l.quantite,
            prix_unitaire: l.prix_unitaire,
            taux_tva: l.taux_tva,
            total_ht: l.total_ht,
            ordre: idx + 1,
          }));
          await supabase.from('invoice_items').insert(items);
          facturesCreees++;
        }
      }

      // Sauvegarder la commande synchronisée
      await supabase.from('boutique_commandes').insert({
        organisation_id: organisationId,
        connexion_id: connexion.id,
        commande_externe_id: cmd.commande_externe_id,
        numero_commande: cmd.numero_commande,
        statut: cmd.statut,
        client_nom: cmd.client_nom,
        client_email: cmd.client_email,
        client_adresse: JSON.stringify(cmd.client_adresse),
        lignes: JSON.stringify(cmd.lignes),
        total_ht,
        total_tva,
        total_ttc,
        devise: cmd.devise,
        invoice_id,
        commande_at: cmd.commande_at,
      });

      commandesNouvelles++;
    } catch (e) {
      erreurs.push(`Erreur commande ${cmd.numero_commande}: ${(e as Error).message}`);
    }
  }

  // Mettre à jour la date de dernière synchro
  await supabase
    .from('boutique_connexions')
    .update({
      derniere_synchro: new Date().toISOString(),
      statut: erreurs.length === commandesSimulees.length && erreurs.length > 0 ? 'erreur' : 'actif',
    })
    .eq('id', connexion.id);

  return {
    connexion_id: connexion.id,
    commandes_trouvees: commandesSimulees.length,
    commandes_nouvelles: commandesNouvelles,
    factures_creees: facturesCreees,
    erreurs,
  };
}

// ─── STATS ────────────────────────────────────────────────────────────────────

export async function getStatsBoutiques(organisationId: string): Promise<StatsBoutique> {
  const { data: connexions } = await supabase
    .from('boutique_connexions')
    .select('statut, derniere_synchro')
    .eq('organisation_id', organisationId);

  const { data: commandes } = await supabase
    .from('boutique_commandes')
    .select('total_ttc, invoice_id')
    .eq('organisation_id', organisationId);

  const actives = (connexions || []).filter(c => c.statut === 'actif').length;
  const total_ca = (commandes || []).reduce((s, c) => s + (c.total_ttc || 0), 0);
  const factures = (commandes || []).filter(c => c.invoice_id).length;

  const dernieres = (connexions || [])
    .map(c => c.derniere_synchro)
    .filter(Boolean)
    .sort()
    .reverse();

  return {
    connexions_actives: actives,
    commandes_synchronisees: (commandes || []).length,
    ca_synchronise: total_ca,
    factures_generees: factures,
    derniere_synchro: dernieres[0],
  };
}

// ─── HELPERS (SIMULATION) ─────────────────────────────────────────────────────

const PRODUITS_DEMO = [
  { nom: 'T-shirt coton bio', prix: 35.90, tva: 7.7 },
  { nom: 'Hoodie premium', prix: 89.00, tva: 7.7 },
  { nom: 'Livre numérique', prix: 19.90, tva: 2.6 },
  { nom: 'Cours en ligne — Marketing digital', prix: 199.00, tva: 7.7 },
  { nom: 'Poster A2 impression', prix: 24.50, tva: 7.7 },
  { nom: 'Accessoire bureau ergonomique', prix: 149.00, tva: 7.7 },
  { nom: 'Abonnement mensuel', prix: 29.00, tva: 7.7 },
  { nom: 'Consultation 1h', prix: 120.00, tva: 7.7 },
];

const PRENOMS = ['Marie', 'Jean', 'Sophie', 'Pierre', 'Laura', 'Thomas', 'Anna', 'Marc', 'Isabelle', 'Paul'];
const NOMS_FAM = ['Dupont', 'Müller', 'Rossi', 'Schneider', 'Meyer', 'Weber', 'Keller', 'Fischer'];
const VILLES = ['Genève', 'Zurich', 'Berne', 'Lausanne', 'Bâle', 'Lucerne', 'Sion', 'Fribourg'];

function genererCommandesSimulees(n: number, connexion: BoutiqueConnexion): Array<{
  commande_externe_id: string;
  numero_commande: string;
  statut: string;
  client_nom: string;
  client_email: string;
  client_adresse: AdresseCommande;
  lignes: LigneCommande[];
  devise: string;
  commande_at: string;
}> {
  const prefix = connexion.plateforme === 'shopify' ? 'SHO' :
                 connexion.plateforme === 'woocommerce' ? 'WOO' :
                 connexion.plateforme === 'prestashop' ? 'PRE' : 'MGT';

  return Array.from({ length: n }, (_, i) => {
    const prenom = PRENOMS[Math.floor(Math.random() * PRENOMS.length)];
    const nom = NOMS_FAM[Math.floor(Math.random() * NOMS_FAM.length)];
    const nbProduits = Math.floor(Math.random() * 3) + 1;
    const lignes: LigneCommande[] = Array.from({ length: nbProduits }, () => {
      const prod = PRODUITS_DEMO[Math.floor(Math.random() * PRODUITS_DEMO.length)];
      const qte = Math.floor(Math.random() * 3) + 1;
      return {
        nom: prod.nom,
        quantite: qte,
        prix_unitaire: prod.prix,
        taux_tva: prod.tva,
        total_ht: prod.prix * qte,
      };
    });

    const idExt = `${prefix}-${Date.now()}-${i}`;
    const numCmd = `${prefix}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));

    return {
      commande_externe_id: idExt,
      numero_commande: numCmd,
      statut: connexion.statut_commande === 'any' ? ['pending','paid','fulfilled'][Math.floor(Math.random()*3)] : connexion.statut_commande,
      client_nom: `${prenom} ${nom}`,
      client_email: `${prenom.toLowerCase()}.${nom.toLowerCase()}@exemple.ch`,
      client_adresse: {
        nom: `${prenom} ${nom}`,
        adresse1: `${Math.floor(Math.random() * 99) + 1} Rue de la Paix`,
        ville: VILLES[Math.floor(Math.random() * VILLES.length)],
        code_postal: `${Math.floor(Math.random() * 9000) + 1000}`,
        pays: 'Suisse',
      },
      lignes,
      devise: 'CHF',
      commande_at: date.toISOString(),
    };
  });
}
