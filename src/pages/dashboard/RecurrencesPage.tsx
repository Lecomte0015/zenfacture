import React, { useState } from 'react';
import { RefreshCw, Trash2, Pause, Play, Zap, Info, Clock, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRecurrences } from '../../hooks/useRecurrences';
import { RecurrenceData } from '../../services/recurrenceService';
import { formatCurrency } from '../../utils/format';
import { supabase } from '../../lib/supabaseClient';

/**
 * Formate une date ISO (YYYY-MM-DD) en DD.MM.YYYY.
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}`;
}

/**
 * Retourne true si la date est dans moins de 7 jours (ou déjà passée).
 */
function estProche(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const diff = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= 7;
}

const RecurrencesPage: React.FC = () => {
  const { t } = useTranslation();
  const {
    recurrences,
    loading,
    error,
    total,
    removeRecurrence,
    pauseRecurrence,
    reprendreRecurrence,
    refreshRecurrences,
  } = useRecurrences();

  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleDelete = async (rec: RecurrenceData) => {
    if (window.confirm(t('recurrence.confirmDelete', 'Supprimer cette récurrence ?'))) {
      await removeRecurrence(rec.id);
    }
  };

  const handleToggle = async (rec: RecurrenceData) => {
    if (rec.actif) {
      await pauseRecurrence(rec.id);
    } else {
      await reprendreRecurrence(rec.id);
    }
  };

  const handleGenererMaintenant = async () => {
    setGenerating(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-recurring-invoices');
      if (fnError) throw fnError;
      const result = data as { success: boolean; generated: number; errors: string[] };
      if (result.success) {
        showToast('success', `${result.generated} facture(s) générée(s) avec succès.`);
        await refreshRecurrences();
      } else {
        showToast('error', 'Erreur lors de la génération des factures.');
      }
    } catch (err) {
      showToast('error', `Erreur : ${String(err)}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm transition-all ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <Info className="h-4 w-4 flex-shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('recurrence.title', 'Factures récurrentes')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} {total > 1 ? 'récurrences' : 'récurrence'}
          </p>
        </div>
        <button
          onClick={handleGenererMaintenant}
          disabled={generating}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Zap className="h-4 w-4" />
          {generating ? 'Génération en cours...' : 'Générer maintenant'}
        </button>
      </div>

      {/* Bannière d'information */}
      <div className="mb-6 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-700">
          Les factures récurrentes actives sont générées automatiquement chaque jour à{' '}
          <strong>08h00</strong> (heure suisse). Vous pouvez également déclencher la génération
          manuellement via le bouton "Générer maintenant".
        </p>
      </div>

      {/* Erreur */}
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Contenu */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : recurrences.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="text-center py-12 text-gray-500">
            <RefreshCw className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium">
              {t('recurrence.noRecurrences', 'Aucune récurrence configurée')}
            </p>
            <p className="mt-1 text-sm">
              {t('recurrence.manageRecurrences', 'Créez une récurrence pour automatiser vos factures.')}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('recurrence.name', 'Nom')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('recurrence.frequency', 'Fréquence')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invoice.total', 'Total')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière émission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prochaine facture
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.status', 'Statut')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions', 'Actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recurrences.map((rec) => {
                  const proche = estProche(rec.prochaine_emission);
                  return (
                    <tr key={rec.id} className="hover:bg-gray-50">
                      {/* Nom + badge envoi_auto */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{rec.nom}</span>
                          {rec.envoi_auto && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              <Zap className="h-3 w-3" />
                              Envoi auto
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Fréquence */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {t(`recurrence.frequencies.${rec.frequence}`, rec.frequence)}
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(rec.total, rec.devise)}
                      </td>

                      {/* Dernière émission */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(rec.derniere_emission)}
                      </td>

                      {/* Prochaine facture */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {rec.prochaine_emission ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              proche && rec.actif
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {proche && rec.actif && <Clock className="h-3 w-3" />}
                            {formatDate(rec.prochaine_emission)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* Statut */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            rec.actif
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {rec.actif
                            ? t('recurrence.active', 'Actif')
                            : t('recurrence.paused', 'En pause')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center space-x-2">
                          <button
                            onClick={() => handleToggle(rec)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            title={rec.actif ? 'Mettre en pause' : 'Reprendre'}
                          >
                            {rec.actif ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(rec)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title={t('common.delete', 'Supprimer')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurrencesPage;
