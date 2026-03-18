import React, { useState } from 'react';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';
import { OcrResult } from '@/services/ocrService';
import { supabase } from '@/lib/supabase';
import { useOrganisation } from '@/context/OrganisationContext';

interface OcrResultEditorProps {
  result: OcrResult;
  onSave: () => void;
  onCancel: () => void;
}

const CATEGORIES = [
  'Fournitures de bureau',
  'Matériel informatique',
  'Frais de déplacement',
  'Repas & Restauration',
  'Formation',
  'Abonnements',
  'Téléphonie',
  'Marketing',
  'Loyer',
  'Assurances',
  'Autres',
];

const DEVISES = ['CHF', 'EUR', 'USD'];

const TVA_RATES = [
  { label: '8.1% (taux normal)', value: '8.1' },
  { label: '3.8% (taux réduit)', value: '3.8' },
  { label: '2.6% (hébergement)', value: '2.6' },
  { label: '0% (exonéré)', value: '0' },
];

export const OcrResultEditor: React.FC<OcrResultEditorProps> = ({
  result,
  onSave,
  onCancel,
}) => {
  const { organisationId } = useOrganisation();
  const [formData, setFormData] = useState({
    montant: result.montant?.toString() || '',
    devise: result.devise || 'CHF',
    date: result.date || new Date().toISOString().split('T')[0],
    fournisseur: result.fournisseur || '',
    categorie: result.categorie || CATEGORIES[0],
    taux_tva: result.taux_tva || '8.1',
    notes: result.description || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (!organisationId) {
        throw new Error('Organisation introuvable');
      }

      // Insert expense into depenses table
      const { error: insertError } = await supabase.from('depenses').insert({
        organisation_id: organisationId,
        description: formData.fournisseur,
        amount: parseFloat(formData.montant),
        currency: formData.devise,
        category: formData.categorie,
        date: formData.date,
        vat_rate: parseFloat(formData.taux_tva),
        notes: formData.notes,
        status: 'pending',
      });

      if (insertError) {
        throw new Error(`Erreur lors de la création de la dépense: ${insertError.message}`);
      }

      onSave();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Check className="h-8 w-8 text-green-600" />
            Vérifier et sauvegarder
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Vérifiez les informations extraites et ajustez si nécessaire
          </p>
        </div>

        {/* Success Banner */}
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-medium text-green-800">
            Informations extraites avec succès
          </p>
          <p className="text-sm text-green-700 mt-1">
            Veuillez vérifier les données ci-dessous avant de créer la dépense
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Montant */}
            <div>
              <label
                htmlFor="montant"
                className="block text-sm font-medium text-gray-700"
              >
                Montant <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="montant"
                id="montant"
                step="0.01"
                min="0"
                required
                value={formData.montant}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Devise */}
            <div>
              <label
                htmlFor="devise"
                className="block text-sm font-medium text-gray-700"
              >
                Devise <span className="text-red-500">*</span>
              </label>
              <select
                name="devise"
                id="devise"
                required
                value={formData.devise}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {DEVISES.map((devise) => (
                  <option key={devise} value={devise}>
                    {devise}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700"
              >
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                id="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Fournisseur */}
            <div>
              <label
                htmlFor="fournisseur"
                className="block text-sm font-medium text-gray-700"
              >
                Fournisseur <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fournisseur"
                id="fournisseur"
                required
                value={formData.fournisseur}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Catégorie */}
            <div>
              <label
                htmlFor="categorie"
                className="block text-sm font-medium text-gray-700"
              >
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                name="categorie"
                id="categorie"
                required
                value={formData.categorie}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {CATEGORIES.map((categorie) => (
                  <option key={categorie} value={categorie}>
                    {categorie}
                  </option>
                ))}
              </select>
            </div>

            {/* Taux TVA */}
            <div>
              <label
                htmlFor="taux_tva"
                className="block text-sm font-medium text-gray-700"
              >
                Taux TVA <span className="text-red-500">*</span>
              </label>
              <select
                name="taux_tva"
                id="taux_tva"
                required
                value={formData.taux_tva}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {TVA_RATES.map((rate) => (
                  <option key={rate.value} value={rate.value}>
                    {rate.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700"
            >
              Notes
            </label>
            <textarea
              name="notes"
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Informations additionnelles..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-5 w-5 inline mr-2" />
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Créer la dépense
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
