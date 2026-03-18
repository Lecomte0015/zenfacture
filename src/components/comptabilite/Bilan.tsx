import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import type { Bilan as BilanType, CategorieBilan } from '@/services/comptabiliteService';

interface BilanProps {
  onLoad: (dateFin: string) => Promise<BilanType>;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' }).format(amount);

const CategorieTable: React.FC<{ categories: CategorieBilan[]; titre: string; total: number }> = ({
  categories,
  titre,
  total,
}) => (
  <div>
    <h3 className="text-lg font-semibold mb-3 text-gray-900">{titre}</h3>
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Compte
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Montant
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {categories.map((categorie, catIndex) => (
            <React.Fragment key={catIndex}>
              {/* En-tête catégorie */}
              <tr className="bg-gray-50">
                <td colSpan={2} className="px-4 py-2 text-sm font-medium text-gray-700">
                  {categorie.nom}
                </td>
              </tr>
              {/* Comptes de la catégorie */}
              {categorie.comptes.map((compte, compteIndex) => (
                <tr key={`${catIndex}-${compteIndex}`} className="hover:bg-gray-50">
                  <td className="px-4 py-2 pl-8 text-sm text-gray-900">
                    {compte.numero} - {compte.nom}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-gray-900">
                    {formatCurrency(compte.montant)}
                  </td>
                </tr>
              ))}
              {/* Sous-total catégorie */}
              <tr className="border-t border-gray-300">
                <td className="px-4 py-2 text-sm font-medium text-gray-700 pl-8">
                  Total {categorie.nom}
                </td>
                <td className="px-4 py-2 text-sm text-right font-medium text-gray-700">
                  {formatCurrency(categorie.total)}
                </td>
              </tr>
            </React.Fragment>
          ))}
          {/* Total général */}
          <tr className="bg-indigo-50 font-bold">
            <td className="px-4 py-3 text-sm text-indigo-900">Total {titre}</td>
            <td className="px-4 py-3 text-sm text-right text-indigo-900">
              {formatCurrency(total)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

export const Bilan: React.FC<BilanProps> = ({ onLoad }) => {
  const [dateFin, setDateFin] = useState('');
  const [bilanData, setBilanData] = useState<BilanType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = async () => {
    if (!dateFin) {
      setError('Veuillez sélectionner une date de clôture');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await onLoad(dateFin);
      setBilanData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du bilan');
    } finally {
      setLoading(false);
    }
  };

  const isBalanced = bilanData
    ? Math.abs(bilanData.totalActifs - bilanData.totalPassifs) < 0.01
    : true;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Bilan</h2>

      {/* Filtres */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Date de clôture</label>
          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleLoad}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center"
          >
            <FileText className="w-4 h-4 mr-2" />
            {loading ? 'Chargement...' : 'Générer le bilan'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      {bilanData && (
        <>
          {/* Avertissement si déséquilibré */}
          {!isBalanced && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-700">
              Attention : le bilan n'est pas équilibré. Différence :{' '}
              {formatCurrency(Math.abs(bilanData.totalActifs - bilanData.totalPassifs))}
            </div>
          )}

          {/* Date du bilan */}
          <div className="mb-4 text-sm text-gray-500">
            Bilan au {new Date(bilanData.date).toLocaleDateString('fr-CH')}
          </div>

          {/* Actifs et Passifs côte à côte */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CategorieTable
              categories={bilanData.actifs}
              titre="Actifs"
              total={bilanData.totalActifs}
            />
            <CategorieTable
              categories={bilanData.passifs}
              titre="Passifs"
              total={bilanData.totalPassifs}
            />
          </div>
        </>
      )}

      {!bilanData && !loading && (
        <div className="text-center py-8 text-gray-500">
          <p>Sélectionnez une date de clôture et cliquez sur "Générer le bilan".</p>
        </div>
      )}
    </div>
  );
};

export default Bilan;
