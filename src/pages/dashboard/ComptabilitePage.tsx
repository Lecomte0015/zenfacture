import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useComptabilite } from '@/hooks/useComptabilite';
import { PlanComptable } from '@/components/comptabilite/PlanComptable';
import { JournalEcritures } from '@/components/comptabilite/JournalEcritures';
import type { LigneGrandLivre, Bilan, CompteResultat } from '@/services/comptabiliteService';

type TabType = 'plan' | 'journal' | 'grand-livre' | 'bilan' | 'compte-resultat';

const ComptabilitePage: React.FC = () => {
  const {
    planComptable,
    ecritures,
    exercices,
    loading,
    error,
    addCompte,
    editCompte,
    removeCompte,
    addEcriture,
    refreshEcritures,
    fetchGrandLivre,
    fetchBilan,
    fetchCompteResultat
  } = useComptabilite();

  const [activeTab, setActiveTab] = useState<TabType>('plan');

  // Grand Livre state
  const [glDateDebut, setGlDateDebut] = useState('');
  const [glDateFin, setGlDateFin] = useState('');
  const [glCompteId, setGlCompteId] = useState('');
  const [grandLivreData, setGrandLivreData] = useState<LigneGrandLivre[]>([]);
  const [glLoading, setGlLoading] = useState(false);

  // Bilan state
  const [bilanDateFin, setBilanDateFin] = useState('');
  const [bilanData, setBilanData] = useState<Bilan | null>(null);
  const [bilanLoading, setBilanLoading] = useState(false);

  // Compte de résultat state
  const [crDateDebut, setCrDateDebut] = useState('');
  const [crDateFin, setCrDateFin] = useState('');
  const [compteResultatData, setCompteResultatData] = useState<CompteResultat | null>(null);
  const [crLoading, setCrLoading] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount);
  };

  const handleLoadGrandLivre = async () => {
    if (!glCompteId || !glDateDebut || !glDateFin) {
      alert('Veuillez sélectionner un compte et une période');
      return;
    }
    setGlLoading(true);
    try {
      const data = await fetchGrandLivre(glCompteId, glDateDebut, glDateFin);
      setGrandLivreData(data);
    } catch (err) {
      console.error('Erreur lors du chargement du grand livre:', err);
      alert('Erreur lors du chargement du grand livre');
    } finally {
      setGlLoading(false);
    }
  };

  const handleLoadBilan = async () => {
    if (!bilanDateFin) {
      alert('Veuillez sélectionner une date');
      return;
    }
    setBilanLoading(true);
    try {
      const data = await fetchBilan(bilanDateFin);
      setBilanData(data);
    } catch (err) {
      console.error('Erreur lors du chargement du bilan:', err);
      alert('Erreur lors du chargement du bilan');
    } finally {
      setBilanLoading(false);
    }
  };

  const handleLoadCompteResultat = async () => {
    if (!crDateDebut || !crDateFin) {
      alert('Veuillez sélectionner une période');
      return;
    }
    setCrLoading(true);
    try {
      const data = await fetchCompteResultat(crDateDebut, crDateFin);
      setCompteResultatData(data);
    } catch (err) {
      console.error('Erreur lors du chargement du compte de résultat:', err);
      alert('Erreur lors du chargement du compte de résultat');
    } finally {
      setCrLoading(false);
    }
  };

  const tabs = [
    { id: 'plan' as TabType, label: 'Plan comptable' },
    { id: 'journal' as TabType, label: 'Journal' },
    { id: 'grand-livre' as TabType, label: 'Grand livre' },
    { id: 'bilan' as TabType, label: 'Bilan' },
    { id: 'compte-resultat' as TabType, label: 'Compte de résultat' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Erreur: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Comptabilité</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'plan' && (
          <div className="p-6">
            <PlanComptable
              comptes={planComptable}
              onAddCompte={addCompte}
              onEditCompte={editCompte}
              onDeleteCompte={removeCompte}
            />
          </div>
        )}

        {activeTab === 'journal' && (
          <div className="p-6">
            <JournalEcritures
              ecritures={ecritures}
              comptes={planComptable}
              exercices={exercices}
              onAddEcriture={addEcriture}
              onRefresh={refreshEcritures}
            />
          </div>
        )}

        {activeTab === 'grand-livre' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Grand livre</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compte
                  </label>
                  <select
                    value={glCompteId}
                    onChange={(e) => setGlCompteId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Sélectionner un compte</option>
                    {planComptable.map((compte) => (
                      <option key={compte.id} value={compte.id}>
                        {compte.numero} - {compte.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date début
                  </label>
                  <input
                    type="date"
                    value={glDateDebut}
                    onChange={(e) => setGlDateDebut(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date fin
                  </label>
                  <input
                    type="date"
                    value={glDateFin}
                    onChange={(e) => setGlDateFin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleLoadGrandLivre}
                    disabled={glLoading}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {glLoading ? 'Chargement...' : 'Charger'}
                  </button>
                </div>
              </div>
            </div>

            {grandLivreData.length > 0 && (
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
                    {grandLivreData.map((ligne, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(ligne.date).toLocaleDateString('fr-CH')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ligne.numero_piece}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {ligne.libelle}
                        </td>
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
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bilan' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Bilan</h2>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de clôture
                  </label>
                  <input
                    type="date"
                    value={bilanDateFin}
                    onChange={(e) => setBilanDateFin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleLoadBilan}
                    disabled={bilanLoading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {bilanLoading ? 'Chargement...' : 'Charger'}
                  </button>
                </div>
              </div>
            </div>

            {bilanData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Actifs */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Actifs</h3>
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
                        {bilanData.actifs.map((categorie, catIndex) => (
                          <React.Fragment key={catIndex}>
                            <tr className="bg-gray-100">
                              <td colSpan={2} className="px-4 py-2 text-sm font-semibold text-gray-700">
                                {categorie.nom}
                              </td>
                            </tr>
                            {categorie.comptes.map((compte, cIndex) => (
                              <tr key={`${catIndex}-${cIndex}`}>
                                <td className="px-4 py-3 text-sm text-gray-900 pl-8">
                                  {compte.numero} - {compte.nom}
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">
                                  {formatCurrency(compte.montant)}
                                </td>
                              </tr>
                            ))}
                            <tr className="border-t">
                              <td className="px-4 py-2 text-sm font-medium text-gray-700 pl-8">
                                Sous-total {categorie.nom}
                              </td>
                              <td className="px-4 py-2 text-sm text-right font-medium text-gray-700">
                                {formatCurrency(categorie.total)}
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                        <tr className="bg-gray-50 font-semibold">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            Total Actifs
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">
                            {formatCurrency(bilanData.totalActifs)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Passifs */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Passifs</h3>
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
                        {bilanData.passifs.map((categorie, catIndex) => (
                          <React.Fragment key={catIndex}>
                            <tr className="bg-gray-100">
                              <td colSpan={2} className="px-4 py-2 text-sm font-semibold text-gray-700">
                                {categorie.nom}
                              </td>
                            </tr>
                            {categorie.comptes.map((compte, cIndex) => (
                              <tr key={`${catIndex}-${cIndex}`}>
                                <td className="px-4 py-3 text-sm text-gray-900 pl-8">
                                  {compte.numero} - {compte.nom}
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">
                                  {formatCurrency(compte.montant)}
                                </td>
                              </tr>
                            ))}
                            <tr className="border-t">
                              <td className="px-4 py-2 text-sm font-medium text-gray-700 pl-8">
                                Sous-total {categorie.nom}
                              </td>
                              <td className="px-4 py-2 text-sm text-right font-medium text-gray-700">
                                {formatCurrency(categorie.total)}
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                        <tr className="bg-gray-50 font-semibold">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            Total Passifs
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">
                            {formatCurrency(bilanData.totalPassifs)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'compte-resultat' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Compte de résultat</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date début
                  </label>
                  <input
                    type="date"
                    value={crDateDebut}
                    onChange={(e) => setCrDateDebut(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date fin
                  </label>
                  <input
                    type="date"
                    value={crDateFin}
                    onChange={(e) => setCrDateFin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleLoadCompteResultat}
                    disabled={crLoading}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {crLoading ? 'Chargement...' : 'Charger'}
                  </button>
                </div>
              </div>
            </div>

            {compteResultatData && (
              <div className="space-y-6">
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase">Chiffre d'affaires</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(compteResultatData.chiffreAffaires)}</p>
                  </div>
                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase">Marge brute</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(compteResultatData.margeBrute)}</p>
                  </div>
                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase">Résultat exploitation</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(compteResultatData.resultatExploitation)}</p>
                  </div>
                  <div className={`border rounded-lg p-4 ${compteResultatData.resultatNet >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <p className="text-xs text-gray-500 uppercase">Résultat net</p>
                    <p className={`text-lg font-semibold ${compteResultatData.resultatNet >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {formatCurrency(compteResultatData.resultatNet)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Charges */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">Charges</h3>
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
                          {compteResultatData.charges.map((categorie, catIndex) => (
                            <React.Fragment key={catIndex}>
                              <tr className="bg-gray-100">
                                <td colSpan={2} className="px-4 py-2 text-sm font-semibold text-gray-700">
                                  {categorie.nom}
                                </td>
                              </tr>
                              {categorie.comptes.map((compte, cIndex) => (
                                <tr key={`${catIndex}-${cIndex}`}>
                                  <td className="px-4 py-3 text-sm text-gray-900 pl-8">
                                    {compte.numero} - {compte.nom}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                                    {formatCurrency(compte.montant)}
                                  </td>
                                </tr>
                              ))}
                              <tr className="border-t">
                                <td className="px-4 py-2 text-sm font-medium text-gray-700 pl-8">
                                  Sous-total {categorie.nom}
                                </td>
                                <td className="px-4 py-2 text-sm text-right font-medium text-gray-700">
                                  {formatCurrency(categorie.total)}
                                </td>
                              </tr>
                            </React.Fragment>
                          ))}
                          <tr className="bg-gray-50 font-semibold">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              Total Charges
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900">
                              {formatCurrency(compteResultatData.charges.reduce((sum, c) => sum + c.total, 0))}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Produits */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">Produits</h3>
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
                          {compteResultatData.produits.map((categorie, catIndex) => (
                            <React.Fragment key={catIndex}>
                              <tr className="bg-gray-100">
                                <td colSpan={2} className="px-4 py-2 text-sm font-semibold text-gray-700">
                                  {categorie.nom}
                                </td>
                              </tr>
                              {categorie.comptes.map((compte, cIndex) => (
                                <tr key={`${catIndex}-${cIndex}`}>
                                  <td className="px-4 py-3 text-sm text-gray-900 pl-8">
                                    {compte.numero} - {compte.nom}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                                    {formatCurrency(compte.montant)}
                                  </td>
                                </tr>
                              ))}
                              <tr className="border-t">
                                <td className="px-4 py-2 text-sm font-medium text-gray-700 pl-8">
                                  Sous-total {categorie.nom}
                                </td>
                                <td className="px-4 py-2 text-sm text-right font-medium text-gray-700">
                                  {formatCurrency(categorie.total)}
                                </td>
                              </tr>
                            </React.Fragment>
                          ))}
                          <tr className="bg-gray-50 font-semibold">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              Total Produits
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900">
                              {formatCurrency(compteResultatData.produits.reduce((sum, c) => sum + c.total, 0))}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Résultat */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Résultat de l'exercice
                    </h3>
                    <p className={`text-2xl font-bold ${
                      compteResultatData.resultatNet >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(compteResultatData.resultatNet)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {compteResultatData.resultatNet >= 0 ? 'Bénéfice' : 'Perte'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComptabilitePage;
