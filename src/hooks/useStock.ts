import { useState, useEffect, useCallback } from 'react';
import { useOrganisation } from '@/context/OrganisationContext';
import {
  StockArticle, StockMouvement, StockStats, MouvementType,
  getStockArticles, createStockArticle, updateStockArticle, deleteStockArticle,
  getMouvements, enregistrerMouvement, getStockStats,
} from '@/services/stockService';

export function useStock() {
  const { organisation } = useOrganisation();
  const orgId = organisation?.id;

  const [articles, setArticles] = useState<StockArticle[]>([]);
  const [mouvements, setMouvements] = useState<StockMouvement[]>([]);
  const [stats, setStats] = useState<StockStats>({
    total_articles: 0,
    articles_rupture: 0,
    articles_critique: 0,
    valeur_totale: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshArticles = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const [arts, mvts, st] = await Promise.all([
        getStockArticles(orgId),
        getMouvements(orgId, undefined, 50),
        getStockStats(orgId),
      ]);
      setArticles(arts);
      setMouvements(mvts);
      setStats(st);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    refreshArticles();
  }, [refreshArticles]);

  const createArticle = async (data: Omit<StockArticle, 'id' | 'created_at' | 'updated_at'>) => {
    const article = await createStockArticle(data);
    setArticles(prev => [...prev, article].sort((a, b) => a.nom.localeCompare(b.nom)));
    await refreshArticles();
    return article;
  };

  const updateArticle = async (id: string, updates: Partial<StockArticle>) => {
    const article = await updateStockArticle(id, updates);
    setArticles(prev => prev.map(a => a.id === id ? article : a));
    return article;
  };

  const removeArticle = async (id: string) => {
    await deleteStockArticle(id);
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  const addMouvement = async (
    articleId: string,
    type: MouvementType,
    quantite: number,
    options?: { cout_unitaire?: number; reference_doc?: string; motif?: string }
  ) => {
    if (!orgId) throw new Error('Organisation requise');
    const result = await enregistrerMouvement(orgId, articleId, type, quantite, options);
    await refreshArticles();
    return result;
  };

  return {
    articles,
    mouvements,
    stats,
    loading,
    error,
    refreshArticles,
    createArticle,
    updateArticle,
    removeArticle,
    addMouvement,
  };
}
