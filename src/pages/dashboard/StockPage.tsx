import { useState } from 'react';
import {
  Package, Plus, Search, Download, TrendingDown, TrendingUp,
  AlertTriangle, BarChart2, ArrowUp, ArrowDown, SlidersHorizontal,
  Pencil, Trash2, X, Check, Loader2, History, ChevronDown,
} from 'lucide-react';
import { useStock } from '@/hooks/useStock';
import { useOrganisation } from '@/context/OrganisationContext';
import { StockArticle, MouvementType, exportStockCSV } from '@/services/stockService';

type Tab = 'articles' | 'mouvements' | 'alertes';

const UNITES = ['pièce', 'kg', 'g', 'litre', 'ml', 'm', 'cm', 'boîte', 'palette', 'heure', 'forfait'];

const TYPE_LABELS: Record<MouvementType, { label: string; color: string; icon: typeof ArrowUp }> = {
  entree: { label: 'Entrée', color: 'text-green-600 bg-green-50', icon: ArrowUp },
  sortie: { label: 'Sortie', color: 'text-red-600 bg-red-50', icon: ArrowDown },
  ajustement: { label: 'Ajustement', color: 'text-blue-600 bg-blue-50', icon: SlidersHorizontal },
  transfert: { label: 'Transfert', color: 'text-purple-600 bg-purple-50', icon: SlidersHorizontal },
  retour: { label: 'Retour', color: 'text-amber-600 bg-amber-50', icon: TrendingUp },
};

interface ArticleFormData {
  nom: string;
  reference: string;
  categorie: string;
  emplacement: string;
  quantite: number;
  quantite_min: number;
  unite: string;
  cout_unitaire: number;
  description: string;
}

const defaultForm: ArticleFormData = {
  nom: '', reference: '', categorie: '', emplacement: '',
  quantite: 0, quantite_min: 0, unite: 'pièce', cout_unitaire: 0, description: '',
};

interface MouvementFormData {
  type: MouvementType;
  quantite: number;
  motif: string;
}

export default function StockPage() {
  const { organisation } = useOrganisation();
  const { articles, mouvements, stats, loading, createArticle, updateArticle, removeArticle, addMouvement } = useStock();

  const [tab, setTab] = useState<Tab>('articles');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ArticleFormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [movArticleId, setMovArticleId] = useState<string | null>(null);
  const [movForm, setMovForm] = useState<MouvementFormData>({ type: 'entree', quantite: 1, motif: '' });
  const [movSaving, setMovSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = articles.filter(a =>
    a.nom.toLowerCase().includes(search.toLowerCase()) ||
    (a.reference || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.categorie || '').toLowerCase().includes(search.toLowerCase())
  );

  const articlesEnRupture = articles.filter(a => a.quantite <= 0);
  const articlesCritique = articles.filter(a => a.quantite > 0 && a.quantite <= a.quantite_min);

  const openForm = (article?: StockArticle) => {
    if (article) {
      setEditingId(article.id);
      setForm({
        nom: article.nom,
        reference: article.reference || '',
        categorie: article.categorie || '',
        emplacement: article.emplacement || '',
        quantite: article.quantite,
        quantite_min: article.quantite_min,
        unite: article.unite,
        cout_unitaire: article.cout_unitaire,
        description: article.description || '',
      });
    } else {
      setEditingId(null);
      setForm(defaultForm);
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!organisation?.id || !form.nom) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateArticle(editingId, form);
      } else {
        await createArticle({ ...form, organisation_id: organisation.id, actif: true });
      }
      setShowForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await removeArticle(id);
    setDeleteConfirm(null);
  };

  const handleMouvement = async () => {
    if (!movArticleId || !movForm.quantite) return;
    setMovSaving(true);
    try {
      await addMouvement(movArticleId, movForm.type, movForm.quantite, { motif: movForm.motif });
      setMovArticleId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setMovSaving(false);
    }
  };

  const getStockBadge = (article: StockArticle) => {
    if (article.quantite <= 0)
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Rupture</span>;
    if (article.quantite <= article.quantite_min)
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Critique</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">OK</span>;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Gestion du stock
          </h1>
          <p className="text-gray-500 mt-1">Suivi des articles, mouvements et alertes de réapprovisionnement.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportStockCSV(articles)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
          <button
            onClick={() => openForm()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Articles actifs</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_articles}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Ruptures</p>
          <p className={`text-2xl font-bold mt-1 ${stats.articles_rupture > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {stats.articles_rupture}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Stocks critiques</p>
          <p className={`text-2xl font-bold mt-1 ${stats.articles_critique > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
            {stats.articles_critique}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Valeur totale</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">CHF {stats.valeur_totale.toFixed(0)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {([
            { id: 'articles', label: 'Articles', count: articles.length },
            { id: 'mouvements', label: 'Mouvements', count: mouvements.length },
            { id: 'alertes', label: 'Alertes', count: articlesEnRupture.length + articlesCritique.length },
          ] as { id: Tab; label: string; count: number }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  t.id === 'alertes' && t.count > 0
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB: Articles */}
      {tab === 'articles' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un article..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Aucun article en stock</p>
              <button onClick={() => openForm()} className="mt-2 text-blue-600 text-sm hover:underline">
                Ajouter le premier article
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Article</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Catégorie</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Quantité</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Coût unit.</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Valeur</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(article => (
                    <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{article.nom}</div>
                        {article.reference && <div className="text-xs text-gray-400">Réf: {article.reference}</div>}
                        {article.emplacement && <div className="text-xs text-gray-400">📍 {article.emplacement}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{article.categorie || '—'}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {article.quantite} <span className="text-gray-400 text-xs">{article.unite}</span>
                        <div className="text-xs text-gray-400">Min: {article.quantite_min}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">CHF {article.cout_unitaire.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">
                        CHF {(article.quantite * article.cout_unitaire).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">{getStockBadge(article)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setMovArticleId(article.id); setMovForm({ type: 'entree', quantite: 1, motif: '' }); }}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                            title="Mouvement de stock"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openForm(article)}
                            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(article.id)}
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {deleteConfirm === article.id && (
                          <div className="mt-1 flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(article.id)}
                              className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded"
                            >
                              Confirmer
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                            >
                              Annuler
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: Mouvements */}
      {tab === 'mouvements' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-800 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-500" />
              Historique des mouvements (50 derniers)
            </h3>
          </div>
          {mouvements.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Aucun mouvement enregistré</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {mouvements.map(m => {
                const typeInfo = TYPE_LABELS[m.type];
                const TypeIcon = typeInfo.icon;
                return (
                  <div key={m.id} className="flex items-center gap-4 px-4 py-3">
                    <div className={`p-1.5 rounded-lg ${typeInfo.color}`}>
                      <TypeIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 text-sm">{m.article_nom || 'Article'}</div>
                      {m.motif && <div className="text-xs text-gray-400">{m.motif}</div>}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className={`font-medium ${m.type === 'sortie' ? 'text-red-600' : 'text-green-600'}`}>
                        {m.type === 'sortie' ? '-' : '+'}{m.quantite}
                      </span>
                      <span className="text-gray-400"> → {m.quantite_apres}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    <div className="text-xs text-gray-400">
                      {new Date(m.created_at).toLocaleString('fr-CH')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: Alertes */}
      {tab === 'alertes' && (
        <div className="space-y-4">
          {articlesEnRupture.length > 0 && (
            <div className="bg-white rounded-xl border border-red-200 shadow-sm">
              <div className="p-4 border-b border-red-100 bg-red-50 rounded-t-xl">
                <h3 className="font-semibold text-red-800 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" />
                  Ruptures de stock ({articlesEnRupture.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {articlesEnRupture.map(a => (
                  <div key={a.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800">{a.nom}</p>
                      {a.reference && <p className="text-xs text-gray-400">Réf: {a.reference}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-red-600 font-bold">{a.quantite} {a.unite}</span>
                      <button
                        onClick={() => { setMovArticleId(a.id); setMovForm({ type: 'entree', quantite: a.quantite_min, motif: 'Réapprovisionnement' }); setTab('articles'); }}
                        className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-lg hover:bg-green-200 transition-colors"
                      >
                        Réapprovisionner
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {articlesCritique.length > 0 && (
            <div className="bg-white rounded-xl border border-amber-200 shadow-sm">
              <div className="p-4 border-b border-amber-100 bg-amber-50 rounded-t-xl">
                <h3 className="font-semibold text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Stocks critiques ({articlesCritique.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {articlesCritique.map(a => (
                  <div key={a.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800">{a.nom}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-right">
                        <span className="text-amber-600 font-bold">{a.quantite}</span>
                        <span className="text-gray-400"> / min {a.quantite_min} {a.unite}</span>
                      </div>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (a.quantite / (a.quantite_min || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {articlesEnRupture.length === 0 && articlesCritique.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              <BarChart2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Aucune alerte — tous les stocks sont suffisants</p>
            </div>
          )}
        </div>
      )}

      {/* Modal: Formulaire article */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">
                {editingId ? 'Modifier l\'article' : 'Nouvel article'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nom de l'article"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
                  <input
                    type="text"
                    value={form.reference}
                    onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SKU / code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <input
                    type="text"
                    value={form.categorie}
                    onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Catégorie"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
                  <select
                    value={form.unite}
                    onChange={e => setForm(f => ({ ...f, unite: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {UNITES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emplacement</label>
                  <input
                    type="text"
                    value={form.emplacement}
                    onChange={e => setForm(f => ({ ...f, emplacement: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Rayon A3, entrepôt..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité initiale</label>
                  <input
                    type="number"
                    min={0}
                    value={form.quantite}
                    onChange={e => setForm(f => ({ ...f, quantite: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seuil minimum</label>
                  <input
                    type="number"
                    min={0}
                    value={form.quantite_min}
                    onChange={e => setForm(f => ({ ...f, quantite_min: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coût unitaire (CHF)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.cout_unitaire}
                    onChange={e => setForm(f => ({ ...f, cout_unitaire: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-100">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.nom}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Mouvement de stock */}
      {movArticleId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Enregistrer un mouvement</h3>
              <button onClick={() => setMovArticleId(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de mouvement</label>
                <select
                  value={movForm.type}
                  onChange={e => setMovForm(f => ({ ...f, type: e.target.value as MouvementType }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {Object.entries(TYPE_LABELS).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {movForm.type === 'ajustement' ? 'Nouvelle quantité' : 'Quantité'}
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.001}
                  value={movForm.quantite}
                  onChange={e => setMovForm(f => ({ ...f, quantite: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motif (optionnel)</label>
                <input
                  type="text"
                  value={movForm.motif}
                  onChange={e => setMovForm(f => ({ ...f, motif: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Réapprovisionnement, inventaire..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-100">
              <button onClick={() => setMovArticleId(null)} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={handleMouvement}
                disabled={movSaving || !movForm.quantite}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {movSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
