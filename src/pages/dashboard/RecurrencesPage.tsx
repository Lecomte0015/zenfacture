import React, { useState } from 'react';
import { Plus, RefreshCw, Pencil, Trash2, Pause, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRecurrences } from '../../hooks/useRecurrences';
import { RecurrenceData, toggleRecurrence } from '../../services/recurrenceService';
import { formatCurrency } from '../../utils/format';

const RecurrencesPage: React.FC = () => {
  const { t } = useTranslation();
  const { recurrences, loading, error, total, removeRecurrence, refreshRecurrences } = useRecurrences();

  const handleDelete = async (rec: RecurrenceData) => {
    if (window.confirm(t('recurrence.confirmDelete'))) {
      await removeRecurrence(rec.id);
    }
  };

  const handleToggle = async (rec: RecurrenceData) => {
    await toggleRecurrence(rec.id, !rec.actif);
    refreshRecurrences();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('recurrence.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{total} {total > 1 ? 'récurrences' : 'récurrence'}</p>
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
      ) : recurrences.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="text-center py-12 text-gray-500">
            <RefreshCw className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium">{t('recurrence.noRecurrences')}</p>
            <p className="mt-1 text-sm">{t('recurrence.manageRecurrences')}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('recurrence.name')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('recurrence.frequency')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('invoice.total')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('recurrence.nextEmission')}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recurrences.map((rec) => (
                <tr key={rec.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rec.nom}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {t(`recurrence.frequencies.${rec.frequence}`)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(rec.total, rec.devise)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rec.prochaine_emission || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      rec.actif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rec.actif ? t('recurrence.active') : t('recurrence.paused')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleToggle(rec)}
                        className="text-gray-400 hover:text-blue-600"
                        title={rec.actif ? t('recurrence.paused') : t('recurrence.active')}
                      >
                        {rec.actif ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      <button onClick={() => handleDelete(rec)} className="text-gray-400 hover:text-red-600" title={t('common.delete')}>
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

export default RecurrencesPage;
