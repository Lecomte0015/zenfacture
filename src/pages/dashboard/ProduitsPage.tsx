import React, { useState } from 'react';
import { Plus, Search, Download, Pencil, Trash2, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProduits } from '../../hooks/useProduits';
import { ProduitData, exportProduitsCSV } from '../../services/produitService';
import ProduitForm, { ProduitFormData } from '../../components/produits/ProduitForm';

const ProduitsPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduit, setEditingProduit] = useState<ProduitData | null>(null);

  const { produits, loading, error, total, addProduit, editProduit, removeProduit } = useProduits({
    search: searchTerm,
  });

  const handleAddProduit = async (formData: ProduitFormData) => {
    await addProduit({
      nom: formData.nom,
      description: formData.description || null,
      prix_unitaire: formData.prix_unitaire,
      taux_tva: formData.taux_tva,
      unite: formData.unite,
      categorie: formData.categorie || null,
      actif: formData.actif,
    });
    setShowForm(false);
  };

  const handleEditProduit = async (formData: ProduitFormData) => {
    if (!editingProduit) return;
    await editProduit(editingProduit.id, {
      nom: formData.nom,
      description: formData.description || null,
      prix_unitaire: formData.prix_unitaire,
      taux_tva: formData.taux_tva,
      unite: formData.unite,
      categorie: formData.categorie || null,
      actif: formData.actif,
    });
    setEditingProduit(null);
  };

  const handleDeleteProduit = async (produit: ProduitData) => {
    if (window.confirm(t('produit.confirmDelete'))) {
      await removeProduit(produit.id);
    }
  };

  const handleExportCSV = () => {
    const csv = exportProduitsCSV(produits);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `produits_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' }).format(price);
  };

  return (
    <div className="p-6">
      {showForm && (
        <ProduitForm onClose={() => setShowForm(false)} onSubmit={handleAddProduit} />
      )}
      {editingProduit && (
        <ProduitForm produit={editingProduit} onClose={() => setEditingProduit(null)} onSubmit={handleEditProduit} />
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('produit.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} {total > 1 ? 'produits' : 'produit'}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            disabled={produits.length === 0}
          >
            <Download className="-ml-1 mr-2 h-4 w-4" />
            CSV
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            {t('produit.new')}
          </button>
        </div>
      </div>

      {/* Recherche */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('common.search') + '...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : produits.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="text-center py-12 text-gray-500">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium">{t('produit.noProducts')}</p>
            <p className="mt-1 text-sm">{t('produit.manageProducts')}</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              {t('produit.new')}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('produit.name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('produit.category')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('produit.unitPrice')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('produit.vatRate')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('produit.unit')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.status')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {produits.map((produit) => (
                <tr key={produit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{produit.nom}</div>
                    {produit.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">{produit.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {produit.categorie || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatPrice(produit.prix_unitaire)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {produit.taux_tva}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {t(`produit.units.${produit.unite}`)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      produit.actif
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {produit.actif ? t('produit.active') : t('produit.inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingProduit(produit)}
                        className="text-gray-400 hover:text-blue-600"
                        title={t('common.edit')}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduit(produit)}
                        className="text-gray-400 hover:text-red-600"
                        title={t('common.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProduitsPage;
