import { supabase } from '../lib/supabaseClient';

export interface StockArticle {
  id: string;
  organisation_id: string;
  produit_id?: string;
  nom: string;
  reference?: string;
  description?: string;
  quantite: number;
  quantite_min: number;
  quantite_max?: number;
  unite: string;
  cout_unitaire: number;
  emplacement?: string;
  categorie?: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export type MouvementType = 'entree' | 'sortie' | 'ajustement' | 'transfert' | 'retour';

export interface StockMouvement {
  id: string;
  organisation_id: string;
  article_id: string;
  type: MouvementType;
  quantite: number;
  quantite_avant: number;
  quantite_apres: number;
  cout_unitaire?: number;
  reference_doc?: string;
  motif?: string;
  created_by?: string;
  created_at: string;
  // Joined
  article_nom?: string;
}

export interface StockStats {
  total_articles: number;
  articles_rupture: number;
  articles_critique: number;
  valeur_totale: number;
}

// ─── ARTICLES ─────────────────────────────────────────────────────────────────

export async function getStockArticles(organisationId: string): Promise<StockArticle[]> {
  const { data, error } = await supabase
    .from('stock_articles')
    .select('*')
    .eq('organisation_id', organisationId)
    .eq('actif', true)
    .order('nom');
  if (error) throw error;
  return data || [];
}

export async function createStockArticle(
  article: Omit<StockArticle, 'id' | 'created_at' | 'updated_at'>
): Promise<StockArticle> {
  const { data, error } = await supabase
    .from('stock_articles')
    .insert(article)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateStockArticle(
  id: string,
  updates: Partial<StockArticle>
): Promise<StockArticle> {
  const { data, error } = await supabase
    .from('stock_articles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteStockArticle(id: string): Promise<void> {
  const { error } = await supabase
    .from('stock_articles')
    .update({ actif: false })
    .eq('id', id);
  if (error) throw error;
}

// ─── MOUVEMENTS ───────────────────────────────────────────────────────────────

export async function getMouvements(
  organisationId: string,
  articleId?: string,
  limit = 100
): Promise<StockMouvement[]> {
  let query = supabase
    .from('stock_mouvements')
    .select(`
      *,
      stock_articles!inner(nom)
    `)
    .eq('organisation_id', organisationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (articleId) {
    query = query.eq('article_id', articleId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((m: StockMouvement & { stock_articles?: { nom: string } }) => ({
    ...m,
    article_nom: m.stock_articles?.nom,
  }));
}

/**
 * Enregistre un mouvement et met à jour la quantité de l'article
 */
export async function enregistrerMouvement(
  organisationId: string,
  articleId: string,
  type: MouvementType,
  quantite: number,
  options?: {
    cout_unitaire?: number;
    reference_doc?: string;
    motif?: string;
  }
): Promise<{ article: StockArticle; mouvement: StockMouvement }> {
  // Récupérer l'article
  const { data: article, error: artError } = await supabase
    .from('stock_articles')
    .select('*')
    .eq('id', articleId)
    .single();
  if (artError) throw artError;

  const quantiteAvant = article.quantite;
  let quantiteApres: number;

  switch (type) {
    case 'entree':
    case 'retour':
      quantiteApres = quantiteAvant + quantite;
      break;
    case 'sortie':
      if (quantiteAvant < quantite) throw new Error('Stock insuffisant');
      quantiteApres = quantiteAvant - quantite;
      break;
    case 'ajustement':
    case 'transfert':
      quantiteApres = quantite; // Valeur absolue pour ajustement
      break;
    default:
      quantiteApres = quantiteAvant + quantite;
  }

  // Créer le mouvement
  const { data: mouvement, error: movError } = await supabase
    .from('stock_mouvements')
    .insert({
      organisation_id: organisationId,
      article_id: articleId,
      type,
      quantite,
      quantite_avant: quantiteAvant,
      quantite_apres: quantiteApres,
      cout_unitaire: options?.cout_unitaire || article.cout_unitaire,
      reference_doc: options?.reference_doc,
      motif: options?.motif,
    })
    .select()
    .single();
  if (movError) throw movError;

  // Mettre à jour la quantité
  const { data: updatedArticle, error: updateError } = await supabase
    .from('stock_articles')
    .update({ quantite: quantiteApres })
    .eq('id', articleId)
    .select()
    .single();
  if (updateError) throw updateError;

  return { article: updatedArticle, mouvement };
}

// ─── STATS ────────────────────────────────────────────────────────────────────

export async function getStockStats(organisationId: string): Promise<StockStats> {
  const { data, error } = await supabase
    .from('stock_articles')
    .select('quantite, quantite_min, cout_unitaire')
    .eq('organisation_id', organisationId)
    .eq('actif', true);
  if (error) throw error;

  const articles = data || [];
  const total_articles = articles.length;
  const articles_rupture = articles.filter(a => a.quantite <= 0).length;
  const articles_critique = articles.filter(a => a.quantite > 0 && a.quantite <= a.quantite_min).length;
  const valeur_totale = articles.reduce((sum, a) => sum + a.quantite * a.cout_unitaire, 0);

  return { total_articles, articles_rupture, articles_critique, valeur_totale };
}

/**
 * Articles en dessous du seuil critique
 */
export async function getArticlesCritiques(organisationId: string): Promise<StockArticle[]> {
  const { data, error } = await supabase
    .from('stock_articles')
    .select('*')
    .eq('organisation_id', organisationId)
    .eq('actif', true)
    .filter('quantite', 'lte', 'quantite_min')
    .order('quantite');
  if (error) throw error;
  return data || [];
}

// ─── IMPORT / EXPORT ──────────────────────────────────────────────────────────

export function exportStockCSV(articles: StockArticle[]): string {
  const headers = ['Nom', 'Référence', 'Catégorie', 'Emplacement', 'Quantité', 'Unité', 'Seuil min', 'Coût unitaire (CHF)', 'Valeur (CHF)'];
  const rows = articles.map(a => [
    a.nom,
    a.reference || '',
    a.categorie || '',
    a.emplacement || '',
    a.quantite,
    a.unite,
    a.quantite_min,
    a.cout_unitaire.toFixed(2),
    (a.quantite * a.cout_unitaire).toFixed(2),
  ]);
  const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `stock-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  return csv;
}
