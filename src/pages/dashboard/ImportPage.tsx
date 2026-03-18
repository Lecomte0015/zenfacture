import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import ImportWizard from '../../components/import/ImportWizard';
import { getImportHistory, ImportRecord } from '../../services/importService';
import { useOrganisation } from '../../context/OrganisationContext';

const ImportPage: React.FC = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [history, setHistory] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { organisationId } = useOrganisation();

  // Charger l'historique des imports
  useEffect(() => {
    const loadHistory = async () => {
      if (!organisationId) return;

      setLoading(true);
      try {
        const data = await getImportHistory(organisationId);
        setHistory(data);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [organisationId]);

  const handleWizardComplete = async () => {
    setShowWizard(false);
    // Recharger l'historique
    if (organisationId) {
      const data = await getImportHistory(organisationId);
      setHistory(data);
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'en_cours':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="mr-1 h-3 w-3" />
            En cours
          </span>
        );
      case 'termine':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Terminé
          </span>
        );
      case 'termine_avec_erreurs':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="mr-1 h-3 w-3" />
            Avec erreurs
          </span>
        );
      case 'erreur':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="mr-1 h-3 w-3" />
            Erreur
          </span>
        );
      default:
        return null;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'bexio':
        return 'Bexio';
      case 'cresus':
        return 'Crésus';
      case 'generic':
        return 'Générique';
      default:
        return source;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'clients':
        return 'Clients';
      case 'factures':
        return 'Factures';
      case 'produits':
        return 'Produits';
      case 'depenses':
        return 'Dépenses';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (!organisationId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-sm text-yellow-700">
            Organisation non trouvée. Veuillez vous reconnecter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Import de données</h1>
        <p className="mt-1 text-sm text-gray-500">
          Importez vos données depuis Bexio, Crésus ou un fichier CSV générique
        </p>
      </div>

      {/* Description et formats supportés */}
      {!showWizard && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <FileSpreadsheet className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Formats supportés
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Exports CSV de Bexio (clients, factures, produits)</li>
                  <li>Exports CSV de Crésus Facturation</li>
                  <li>Fichiers CSV génériques avec mapping personnalisé</li>
                </ul>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => setShowWizard(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Nouvel import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wizard d'import */}
      {showWizard && (
        <div className="mb-8">
          <ImportWizard
            organisationId={organisationId}
            onComplete={handleWizardComplete}
          />
        </div>
      )}

      {/* Historique des imports */}
      {!showWizard && (
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Historique des imports
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="text-center py-12 text-gray-500">
                <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium">Aucun import</p>
                <p className="mt-1 text-sm">
                  Vous n'avez pas encore effectué d'import de données.
                </p>
                <button
                  onClick={() => setShowWizard(true)}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Commencer un import
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lignes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Importées
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Erreurs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(record.cree_le)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getSourceLabel(record.source)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getTypeLabel(record.type_donnees)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.nb_lignes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {record.nb_importees}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                        {record.nb_erreurs}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(record.statut)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportPage;
