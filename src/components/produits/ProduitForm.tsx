import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProduitData } from '../../services/produitService';

// ─── Schema Zod ──────────────────────────────────────────────────────────────

export const produitSchema = z.object({
  nom: z.string().min(1, 'Nom requis').max(100, 'Nom trop long (max 100 caractères)'),
  description: z.string().max(500, 'Description trop longue').optional().default(''),
  prix_unitaire: z
    .number({ invalid_type_error: 'Prix requis' })
    .min(0, 'Le prix ne peut pas être négatif'),
  taux_tva: z.number().min(0).max(100).default(8.1),
  unite: z.enum(['piece', 'hour', 'day', 'flat', 'm2', 'kg'], {
    errorMap: () => ({ message: 'Unité invalide' }),
  }),
  categorie: z.string().max(100).optional().default(''),
  actif: z.boolean().default(true),
});

export type ProduitFormData = z.infer<typeof produitSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProduitFormProps {
  produit?: ProduitData | null;
  onClose: () => void;
  onSubmit: (data: ProduitFormData) => Promise<void>;
}

// ─── Composant ────────────────────────────────────────────────────────────────

const ProduitForm: React.FC<ProduitFormProps> = ({ produit, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const isEditing = !!produit;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProduitFormData>({
    resolver: zodResolver(produitSchema),
    defaultValues: {
      nom: produit?.nom || '',
      description: produit?.description || '',
      prix_unitaire: produit?.prix_unitaire ?? 0,
      taux_tva: produit?.taux_tva ?? 8.1,
      unite: (produit?.unite as ProduitFormData['unite']) || 'piece',
      categorie: produit?.categorie || '',
      actif: produit?.actif ?? true,
    },
  });

  const handleFormSubmit = async (data: ProduitFormData) => {
    await onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? t('produit.edit') : t('produit.new')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500" disabled={isSubmitting}>
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('produit.name')}</label>
            <input
              type="text"
              {...register('nom')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={isSubmitting}
            />
            {errors.nom && <p className="mt-1 text-xs text-red-600">{errors.nom.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('produit.description')}</label>
            <textarea
              {...register('description')}
              rows={2}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={isSubmitting}
            />
            {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
          </div>

          {/* Prix + TVA */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('produit.unitPrice')}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('prix_unitaire', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={isSubmitting}
              />
              {errors.prix_unitaire && <p className="mt-1 text-xs text-red-600">{errors.prix_unitaire.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('produit.vatRate')}</label>
              <select
                {...register('taux_tva', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={isSubmitting}
              >
                <option value={8.1}>{t('invoice.vatRates.normal')}</option>
                <option value={2.6}>{t('invoice.vatRates.reduced')}</option>
                <option value={3.8}>{t('invoice.vatRates.accommodation')}</option>
                <option value={0}>{t('invoice.vatRates.exempt')}</option>
              </select>
            </div>
          </div>

          {/* Unité + Catégorie */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('produit.unit')}</label>
              <select
                {...register('unite')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={isSubmitting}
              >
                <option value="piece">{t('produit.units.piece')}</option>
                <option value="hour">{t('produit.units.hour')}</option>
                <option value="day">{t('produit.units.day')}</option>
                <option value="flat">{t('produit.units.flat')}</option>
                <option value="m2">{t('produit.units.m2')}</option>
                <option value="kg">{t('produit.units.kg')}</option>
              </select>
              {errors.unite && <p className="mt-1 text-xs text-red-600">{errors.unite.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('produit.category')}</label>
              <input
                type="text"
                {...register('categorie')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder={t('common.optional')}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Actif (édition seulement) */}
          {isEditing && (
            <div className="flex items-center">
              <input
                type="checkbox"
                {...register('actif')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isSubmitting}
              />
              <label className="ml-2 block text-sm text-gray-900">{t('produit.active')}</label>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProduitForm;
