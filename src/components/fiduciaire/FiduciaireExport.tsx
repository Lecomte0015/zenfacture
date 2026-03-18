import React, { useState } from 'react';
import { Download, Calendar, FileText, CheckCircle } from 'lucide-react';
import { ExportFiduciaire, AccesFiduciaire, downloadExport } from '../../services/fiduciaireService';

interface FiduciaireExportProps {
  accesses: AccesFiduciaire[];
  exports: ExportFiduciaire[];
  onGenerateExport: (
    accesId: string,
    type: ExportFiduciaire['type_export'],
    format: 'csv' | 'json',
    periodeDebut?: string,
    periodeFin?: string
  ) => Promise<void>;
  loading: boolean;
}

const FiduciaireExport: React.FC<FiduciaireExportProps> = ({
  accesses,
  exports,
  onGenerateExport,
  loading
}) => {
  const [selectedType, setSelectedType] = useState<ExportFiduciaire['type_export']>('plan_comptable');
  const [selectedAccess, setSelectedAccess] = useState<string>('');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [periodeDebut, setPeriodeDebut] = useState('');
  const [periodeFin, setPeriodeFin] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const activeAccesses = accesses.filter(a => a.actif);

  const handleGenerate = async () => {
    if (!selectedAccess) {
      alert('Veuillez sélectionner un accès fiduciaire');
      return;
    }

    try {
      setIsGenerating(true);
      await onGenerateExport(
        selectedAccess,
        selectedType,
        format,
        periodeDebut || undefined,
        periodeFin || undefined
      );

      // Réinitialiser les périodes
      setPeriodeDebut('');
      setPeriodeFin('');
    } catch (error) {
      console.error('Erreur lors de la génération de l\'export:', error);
      alert('Erreur lors de la génération de l\'export');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (exportData: ExportFiduciaire) => {
    await downloadExport(exportData, format);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type: ExportFiduciaire['type_export']) => {
    const labels = {
      plan_comptable: 'Plan Comptable',
      journal: 'Journal',
      bilan: 'Bilan',
      tva: 'TVA'
    };
    return labels[type];
  };

  const needsPeriod = ['journal', 'bilan', 'tva'].includes(selectedType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Exports Comptables</h2>
        <p className="text-sm text-gray-600 mt-1">
          Générez et téléchargez des exports pour vos fiduciaires
        </p>
      </div>

      {/* Formulaire de génération */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Générer un export</h3>

        {activeAccesses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>Aucun accès fiduciaire actif</p>
            <p className="text-sm mt-1">Créez d'abord un accès fiduciaire dans l'onglet "Accès"</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sélection de l'accès */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accès fiduciaire *
              </label>
              <select
                value={selectedAccess}
                onChange={(e) => setSelectedAccess(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner un accès</option>
                {activeAccesses.map((access) => (
                  <option key={access.id} value={access.id}>
                    {access.nom_fiduciaire} ({access.email_fiduciaire})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type d'export */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'export *
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as ExportFiduciaire['type_export'])}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="plan_comptable">Plan Comptable</option>
                  <option value="journal">Journal</option>
                  <option value="bilan">Bilan</option>
                  <option value="tva">TVA</option>
                </select>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format *
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as 'csv' | 'json')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
              </div>
            </div>

            {/* Période (optionnel selon le type) */}
            {needsPeriod && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={periodeDebut}
                      onChange={(e) => setPeriodeDebut(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={periodeFin}
                      onChange={(e) => setPeriodeFin(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedAccess}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {isGenerating ? 'Génération...' : 'Générer l\'export'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Historique des exports */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Historique des exports</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Chargement des exports...
          </div>
        ) : exports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>Aucun export généré</p>
            <p className="text-sm mt-1">Générez votre premier export ci-dessus</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Période
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {exports.map((exportData) => (
                  <tr key={exportData.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(exportData.cree_le)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getTypeLabel(exportData.type_export)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {exportData.periode_debut && exportData.periode_fin
                        ? `${new Date(exportData.periode_debut).toLocaleDateString('fr-CH')} - ${new Date(exportData.periode_fin).toLocaleDateString('fr-CH')}`
                        : 'Toutes les données'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDownload(exportData)}
                        className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Télécharger
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FiduciaireExport;
