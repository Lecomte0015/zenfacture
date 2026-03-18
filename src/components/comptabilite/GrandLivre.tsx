import React, { useState } from 'react';
import { Search } from 'lucide-react';
import type { CompteComptable, LigneGrandLivre } from '@/services/comptabiliteService';

interface GrandLivreProps {
  comptes: CompteComptable[];
  onLoad: (compteId: string, dateDebut: string, dateFin: string) => Promise<LigneGrandLivre[]>;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' }).format(amount);

export const GrandLivre: React.FC<GrandLivreProps> = ({ comptes, onLoad }) => {
  const [compteId, setCompteId] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [lignes, setLignes] = useState<LigneGrandLivre[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCompte = comptes.find((c) => c.id === compteId);

  const handleLoad = async () => {
    if (!compteId || !dateDebut || !dateFin) {
      setError('Veuillez sélectionner un compte et une période');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await onLoad(compteId, dateDebut, dateFin);
      setLignes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const totalDebit = lignes.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = lignes.reduce((sum, l) => sum + l.credit, 0);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Grand livre</h2>

      {/* Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Compte</label>
          <select
            value={compteId}
            onChange={(e) => setCompteId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Sélectionner un compte</option>
            {comptes.map((compte) => (
              <option key={compte.id} value={compte.id}>
                {compte.numero} - {compte.nom}
              </option>
            ))}
          </select>
        </div>
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
            <Search className="w-4 h-4 mr-2" />
            {loading ? 'Chargement...' : 'Charger'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Titre du compte sélectionné */}
      {selectedCompte && lignes.length > 0 && (
        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-md">
          <p className="text-sm font-medium text-indigo-900">
            {selectedCompte.numero} - {selectedCompte.nom}
          </p>
          <p className="text-xs text-indigo-700">
            Période du {new Date(dateDebut).toLocaleDateString('fr-CH')} au{' '}
            {new Date(dateFin).toLocaleDateString('fr-CH')}
          </p>
        </div>
      )}

      {/* Tableau */}
      {lignes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° pièce
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Libellé
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Débit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Crédit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Solde
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lignes.map((ligne, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(ligne.date).toLocaleDateString('fr-CH')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ligne.numero_piece}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{ligne.libelle}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {ligne.debit > 0 ? formatCurrency(ligne.debit) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {ligne.credit > 0 ? formatCurrency(ligne.credit) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    {formatCurrency(ligne.solde)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr className="font-semibold">
                <td colSpan={3} className="px-6 py-3 text-sm text-gray-900">
                  Total
                </td>
                <td className="px-6 py-3 text-sm text-right text-gray-900">
                  {formatCurrency(totalDebit)}
                </td>
                <td className="px-6 py-3 text-sm text-right text-gray-900">
                  {formatCurrency(totalCredit)}
                </td>
                <td className="px-6 py-3 text-sm text-right text-gray-900">
                  {lignes.length > 0 ? formatCurrency(lignes[lignes.length - 1].solde) : '-'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {lignes.length === 0 && !loading && compteId && (
        <div className="text-center py-8 text-gray-500">
          <p>Aucune écriture trouvée pour ce compte sur cette période.</p>
        </div>
      )}
    </div>
  );
};

export default GrandLivre;
