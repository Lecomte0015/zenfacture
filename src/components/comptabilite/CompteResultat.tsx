import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import type { CompteResultat as CompteResultatType, CategorieBilan } from '@/services/comptabiliteService';

interface CompteResultatProps {
  onLoad: (dateDebut: string, dateFin: string) => Promise<CompteResultatType>;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' }).format(amount);

const SectionTable: React.FC<{ categories: CategorieBilan[]; titre: string }> = ({
  categories,
  titre,
}) => {
  const total = categories.reduce((sum, cat) => sum + cat.total, 0);

  return (
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
                <tr className="bg-gray-50">
                  <td colSpan={2} className="px-4 py-2 text-sm font-medium text-gray-700">
                    {categorie.nom}
                  </td>
                </tr>
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
};

export const CompteResultat: React.FC<CompteResultatProps> = ({ onLoad }) => {
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [data, setData] = useState<CompteResultatType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = async () => {
    if (!dateDebut || !dateFin) {
      setError('Veuillez sélectionner une période');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await onLoad(dateDebut, dateFin);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Compte de résultat</h2>

      {/* Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
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
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center justify-center"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            {loading ? 'Chargement...' : 'Générer'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Période */}
          <div className="text-sm text-gray-500">
            Période du {new Date(data.dateDebut).toLocaleDateString('fr-CH')} au{' '}
            {new Date(data.dateFin).toLocaleDateString('fr-CH')}
          </div>

          {/* Indicateurs clés */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase">Chiffre d'affaires</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {formatCurrency(data.chiffreAffaires)}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase">Marge brute</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {formatCurrency(data.margeBrute)}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase">Résultat exploitation</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {formatCurrency(data.resultatExploitation)}
              </p>
            </div>
            <div
              className={`border rounded-lg p-4 ${
                data.resultatNet >= 0
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <p className="text-xs font-medium text-gray-500 uppercase">Résultat net</p>
              <p
                className={`text-lg font-bold mt-1 ${
                  data.resultatNet >= 0 ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {formatCurrency(data.resultatNet)}
              </p>
            </div>
          </div>

          {/* Produits et Charges côte à côte */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SectionTable categories={data.produits} titre="Produits" />
            <SectionTable categories={data.charges} titre="Charges" />
          </div>

          {/* Résultat final */}
          <div
            className={`rounded-lg p-6 ${
              data.resultatNet >= 0
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Résultat de l'exercice</h3>
              <p
                className={`text-2xl font-bold ${
                  data.resultatNet >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(data.resultatNet)}
              </p>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {data.resultatNet >= 0 ? 'Bénéfice' : 'Perte'}
            </p>
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="text-center py-8 text-gray-500">
          <p>Sélectionnez une période et cliquez sur "Générer".</p>
        </div>
      )}
    </div>
  );
};

export default CompteResultat;
