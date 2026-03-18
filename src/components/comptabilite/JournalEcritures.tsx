import React, { useState, useEffect } from 'react';
import { Plus, Filter, X } from 'lucide-react';
import { EcritureAvecComptes, CompteComptable, ExerciceComptable } from '@/services/comptabiliteService';

interface JournalEcrituresProps {
  ecritures: EcritureAvecComptes[];
  comptes: CompteComptable[];
  exercices: ExerciceComptable[];
  onAddEcriture: (ecriture: any) => Promise<void>;
  onRefresh: (filters?: any) => Promise<void>;
}

export const JournalEcritures: React.FC<JournalEcrituresProps> = ({
  ecritures,
  comptes,
  exercices,
  onAddEcriture,
  onRefresh,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateDebut: '',
    dateFin: '',
    compteId: '',
    exerciceId: '',
  });
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    numero_piece: '',
    libelle: '',
    compte_debit_id: '',
    compte_credit_id: '',
    montant: '',
    exercice_id: '',
  });

  // Sélectionner automatiquement l'exercice en cours
  useEffect(() => {
    const exerciceEnCours = exercices.find((e) => e.statut === 'ouvert');
    if (exerciceEnCours && !formData.exercice_id) {
      setFormData((prev) => ({ ...prev, exercice_id: exerciceEnCours.id }));
    }
  }, [exercices, formData.exercice_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await onAddEcriture({
      ...formData,
      date_ecriture: formData.date,
      montant: parseFloat(formData.montant),
    });

    setFormData({
      date: new Date().toISOString().split('T')[0],
      numero_piece: '',
      libelle: '',
      compte_debit_id: '',
      compte_credit_id: '',
      montant: '',
      exercice_id: formData.exercice_id,
    });
    setShowAddForm(false);
  };

  const applyFilters = () => {
    onRefresh({
      dateDebut: filters.dateDebut || undefined,
      dateFin: filters.dateFin || undefined,
      compteId: filters.compteId || undefined,
      exerciceId: filters.exerciceId || undefined,
    });
  };

  const clearFilters = () => {
    setFilters({
      dateDebut: '',
      dateFin: '',
      compteId: '',
      exerciceId: '',
    });
    onRefresh();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-CH');
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF',
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Journal des écritures</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filtrer
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvelle écriture
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date début
              </label>
              <input
                type="date"
                value={filters.dateDebut}
                onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date fin
              </label>
              <input
                type="date"
                value={filters.dateFin}
                onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compte
              </label>
              <select
                value={filters.compteId}
                onChange={(e) => setFilters({ ...filters, compteId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les comptes</option>
                {comptes.map((compte) => (
                  <option key={compte.id} value={compte.id}>
                    {compte.numero} - {compte.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exercice
              </label>
              <select
                value={filters.exerciceId}
                onChange={(e) => setFilters({ ...filters, exerciceId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les exercices</option>
                {exercices.map((exercice) => (
                  <option key={exercice.id} value={exercice.id}>
                    {exercice.annee} {exercice.statut === 'cloture' ? '(Clôturé)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Appliquer
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  N° de pièce *
                </label>
                <input
                  type="text"
                  value={formData.numero_piece}
                  onChange={(e) => setFormData({ ...formData, numero_piece: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ex: FACT-2024-001"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Libellé *
                </label>
                <input
                  type="text"
                  value={formData.libelle}
                  onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Description de l'écriture"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compte débit *
                </label>
                <select
                  value={formData.compte_debit_id}
                  onChange={(e) => setFormData({ ...formData, compte_debit_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compte crédit *
                </label>
                <select
                  value={formData.compte_credit_id}
                  onChange={(e) => setFormData({ ...formData, compte_credit_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant (CHF) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.montant}
                  onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exercice *
                </label>
                <select
                  value={formData.exercice_id}
                  onChange={(e) => setFormData({ ...formData, exercice_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Sélectionner un exercice</option>
                  {exercices
                    .filter((e) => e.statut === 'ouvert')
                    .map((exercice) => (
                      <option key={exercice.id} value={exercice.id}>
                        {exercice.annee}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                N° pièce
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Libellé
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Compte débit
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Compte crédit
              </th>
              <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Montant
              </th>
              <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ecritures.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 px-4 text-center text-gray-500">
                  Aucune écriture comptable
                </td>
              </tr>
            ) : (
              ecritures.map((ecriture) => (
                <tr key={ecriture.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{formatDate(ecriture.date_ecriture)}</td>
                  <td className="py-3 px-4 text-sm font-mono">{ecriture.numero_piece}</td>
                  <td className="py-3 px-4 text-sm">{ecriture.libelle}</td>
                  <td className="py-3 px-4 text-sm">
                    {ecriture.compte_debit && (
                      <span className="font-mono">
                        {ecriture.compte_debit.numero} - {ecriture.compte_debit.nom}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {ecriture.compte_credit && (
                      <span className="font-mono">
                        {ecriture.compte_credit.numero} - {ecriture.compte_credit.nom}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-medium">
                    {formatAmount(ecriture.montant)}
                  </td>
                  <td className="py-3 px-4 text-center">
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
