import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DevisData, DevisArticle, generateDevisNumber } from '../../services/devisService';
import { ClientData } from '../../services/clientService';
import { ProduitData } from '../../services/produitService';
import DeviseSelector from '../common/DeviseSelector';
import { DeviseCode } from '../../services/deviseService';

interface DevisFormProps {
  devis?: DevisData | null;
  clients: ClientData[];
  produits: ProduitData[];
  organisationId: string;
  onSave: (data: Omit<DevisData, 'id' | 'cree_le' | 'mis_a_jour_le'>) => Promise<any>;
  onUpdate?: (id: string, updates: Partial<DevisData>) => Promise<any>;
  onClose: () => void;
}

const EMPTY_ARTICLE: Omit<DevisArticle, 'id'> = {
  description: '',
  quantite: 1,
  prix_unitaire: 0,
  taux_tva: 8.1,
  montant: 0,
};

const DevisForm: React.FC<DevisFormProps> = ({
  devis,
  clients,
  produits,
  organisationId,
  onSave,
  onUpdate,
  onClose,
}) => {
  const { t } = useTranslation();
  const isEditing = !!devis;

  const [clientId, setClientId] = useState<string>(devis?.client_id || '');
  const [numeroDevis, setNumeroDevis] = useState(devis?.numero_devis || '');
  const [dateDevis, setDateDevis] = useState(devis?.date_devis || new Date().toISOString().split('T')[0]);
  const [dateValidite, setDateValidite] = useState(
    devis?.date_validite || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [devise, setDevise] = useState<DeviseCode>((devis?.devise as DeviseCode) || 'CHF');
  const [notes, setNotes] = useState(devis?.notes || '');
  const [conditions, setConditions] = useState(devis?.conditions || '');
  const [articles, setArticles] = useState<Omit<DevisArticle, 'id'>[]>(
    devis?.articles?.length
      ? (devis.articles as DevisArticle[]).map(({ id, ...rest }) => rest)
      : [{ ...EMPTY_ARTICLE }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate devis number on mount for new devis
  useEffect(() => {
    if (!isEditing && organisationId) {
      generateDevisNumber(organisationId).then(setNumeroDevis).catch(console.error);
    }
  }, [isEditing, organisationId]);

  const updateArticle = (index: number, field: string, value: any) => {
    setArticles(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // Recalculate montant
      if (field === 'quantite' || field === 'prix_unitaire') {
        const qty = field === 'quantite' ? value : updated[index].quantite;
        const price = field === 'prix_unitaire' ? value : updated[index].prix_unitaire;
        updated[index].montant = qty * price;
      }
      return updated;
    });
  };

  const addArticle = () => {
    setArticles(prev => [...prev, { ...EMPTY_ARTICLE }]);
  };

  const removeArticle = (index: number) => {
    if (articles.length <= 1) return;
    setArticles(prev => prev.filter((_, i) => i !== index));
  };

  const addProduit = (produit: ProduitData) => {
    setArticles(prev => [
      ...prev,
      {
        description: produit.nom + (produit.description ? ` - ${produit.description}` : ''),
        quantite: 1,
        prix_unitaire: produit.prix_unitaire,
        taux_tva: produit.taux_tva,
        montant: produit.prix_unitaire,
      },
    ]);
  };

  const sousTotal = articles.reduce((sum, a) => sum + a.montant, 0);
  const totalTva = articles.reduce((sum, a) => sum + (a.montant * a.taux_tva) / 100, 0);
  const total = sousTotal + totalTva;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clientId) {
      setError('Veuillez sélectionner un client');
      return;
    }
    if (articles.length === 0 || articles.every(a => a.montant === 0)) {
      setError('Veuillez ajouter au moins un article');
      return;
    }

    setSaving(true);
    try {
      const articlesWithIds: DevisArticle[] = articles.map((a, i) => ({
        ...a,
        id: `art-${i + 1}`,
      }));

      if (isEditing && onUpdate && devis) {
        await onUpdate(devis.id, {
          client_id: clientId,
          numero_devis: numeroDevis,
          date_devis: dateDevis,
          date_validite: dateValidite,
          devise,
          notes: notes || null,
          conditions: conditions || null,
          articles: articlesWithIds,
          sous_total: sousTotal,
          total_tva: totalTva,
          total,
        });
      } else {
        await onSave({
          organisation_id: organisationId,
          client_id: clientId,
          numero_devis: numeroDevis,
          date_devis: dateDevis,
          date_validite: dateValidite,
          statut: 'brouillon',
          articles: articlesWithIds,
          sous_total: sousTotal,
          total_tva: totalTva,
          total,
          devise,
          notes: notes || null,
          conditions: conditions || null,
          facture_id: null,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-start justify-center min-h-screen pt-4 px-4 pb-20">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-auto my-8 z-10">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? t('devis.edit') : t('devis.new')}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Info générale */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('devis.number')}
                </label>
                <input
                  type="text"
                  value={numeroDevis}
                  onChange={(e) => setNumeroDevis(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('invoice.client')}
                </label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  <option value="">-- Sélectionner un client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.entreprise ? `${c.entreprise} - ` : ''}{c.prenom} {c.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('devis.date')}
                </label>
                <input
                  type="date"
                  value={dateDevis}
                  onChange={(e) => setDateDevis(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('devis.validUntil')}
                </label>
                <input
                  type="date"
                  value={dateValidite}
                  onChange={(e) => setDateValidite(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('invoice.currency')}
                </label>
                <DeviseSelector value={devise} onChange={setDevise} />
              </div>
            </div>

            {/* Articles */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">{t('invoice.items')}</h3>
                <div className="flex space-x-2">
                  {produits.length > 0 && (
                    <select
                      onChange={(e) => {
                        const p = produits.find(p => p.id === e.target.value);
                        if (p) addProduit(p);
                        e.target.value = '';
                      }}
                      className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      defaultValue=""
                    >
                      <option value="" disabled>+ Ajouter un produit</option>
                      {produits.map((p) => (
                        <option key={p.id} value={p.id}>{p.nom} - {p.prix_unitaire} {devise}</option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={addArticle}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ligne vide
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-20">Qté</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-28">Prix unit.</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-20">TVA %</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-28">Montant</th>
                      <th className="px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {articles.map((article, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={article.description}
                            onChange={(e) => updateArticle(index, 'description', e.target.value)}
                            className="block w-full border-0 bg-transparent focus:ring-0 sm:text-sm"
                            placeholder="Description..."
                            required
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={article.quantite}
                            onChange={(e) => updateArticle(index, 'quantite', parseFloat(e.target.value) || 0)}
                            className="block w-full text-right border-0 bg-transparent focus:ring-0 sm:text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={article.prix_unitaire}
                            onChange={(e) => updateArticle(index, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                            className="block w-full text-right border-0 bg-transparent focus:ring-0 sm:text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={article.taux_tva}
                            onChange={(e) => updateArticle(index, 'taux_tva', parseFloat(e.target.value))}
                            className="block w-full text-right border-0 bg-transparent focus:ring-0 sm:text-sm"
                          >
                            <option value={8.1}>8.1%</option>
                            <option value={2.6}>2.6%</option>
                            <option value={3.8}>3.8%</option>
                            <option value={0}>0%</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 text-right text-sm text-gray-900">
                          {article.montant.toFixed(2)}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => removeArticle(index)}
                            className="text-gray-400 hover:text-red-500"
                            disabled={articles.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totaux */}
              <div className="mt-4 flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('invoice.subtotal')}</span>
                    <span className="text-gray-900">{sousTotal.toFixed(2)} {devise}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('invoice.tax')}</span>
                    <span className="text-gray-900">{totalTva.toFixed(2)} {devise}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t pt-2">
                    <span className="text-gray-900">{t('invoice.total')}</span>
                    <span className="text-gray-900">{total.toFixed(2)} {devise}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes & Conditions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('invoice.notes')}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Notes internes..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conditions
                </label>
                <textarea
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Conditions de paiement..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 border-t pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : isEditing ? t('common.save') : t('devis.new')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DevisForm;
