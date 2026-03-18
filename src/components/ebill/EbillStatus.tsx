import React, { useState } from 'react';
import { Send, CheckCircle, XCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { EbillEnvoi, EbillStats, EbillEnvoiStatut } from '../../services/ebillService';

interface EbillStatusProps {
  envois: EbillEnvoi[];
  stats: EbillStats | null;
  loading: boolean;
  onRefresh: (statut?: EbillEnvoiStatut) => Promise<void>;
}

const EbillStatus: React.FC<EbillStatusProps> = ({
  envois,
  stats,
  loading,
  onRefresh,
}) => {
  const [selectedStatut, setSelectedStatut] = useState<EbillEnvoiStatut | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleFilterChange = async (statut: EbillEnvoiStatut | 'all') => {
    setSelectedStatut(statut);
    setRefreshing(true);
    try {
      await onRefresh(statut === 'all' ? undefined : statut);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusBadge = (statut: EbillEnvoiStatut) => {
    switch (statut) {
      case 'accepte':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepté
          </span>
        );
      case 'envoye':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Send className="w-3 h-3 mr-1" />
            Envoyé
          </span>
        );
      case 'refuse':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Refusé
          </span>
        );
      case 'en_attente':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </span>
        );
      case 'erreur':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Erreur
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cartes de statistiques */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {/* Total */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Envoyé */}
          <div className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleFilterChange('envoye')}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Send className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Envoyé</dt>
                    <dd className="text-lg font-semibold text-blue-600">{stats.envoye}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Accepté */}
          <div className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleFilterChange('accepte')}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Accepté</dt>
                    <dd className="text-lg font-semibold text-green-600">{stats.accepte}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Refusé */}
          <div className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleFilterChange('refuse')}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Refusé</dt>
                    <dd className="text-lg font-semibold text-red-600">{stats.refuse}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* En attente */}
          <div className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleFilterChange('en_attente')}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">En attente</dt>
                    <dd className="text-lg font-semibold text-yellow-600">{stats.en_attente}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtre */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label htmlFor="statut-filter" className="text-sm font-medium text-gray-700">
              Filtrer par statut:
            </label>
            <select
              id="statut-filter"
              value={selectedStatut}
              onChange={(e) => handleFilterChange(e.target.value as EbillEnvoiStatut | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={refreshing}
            >
              <option value="all">Tous les envois</option>
              <option value="en_attente">En attente</option>
              <option value="envoye">Envoyé</option>
              <option value="accepte">Accepté</option>
              <option value="refuse">Refusé</option>
              <option value="erreur">Erreur</option>
            </select>
          </div>
          <div className="text-sm text-gray-500">
            {envois.length} résultat{envois.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Table des envois */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {envois.length === 0 ? (
          <div className="text-center py-12">
            <Send className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun envoi</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedStatut === 'all'
                ? 'Vous n\'avez pas encore envoyé de factures via eBill.'
                : `Aucun envoi avec le statut "${selectedStatut}".`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facture n°
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destinataire
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date d'envoi
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date d'acceptation
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {envois.map((envoi) => (
                  <tr key={envoi.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {envoi.facture_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {envoi.participant_destinataire}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(envoi.statut)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(envoi.date_envoi)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {envoi.date_acceptation ? formatDate(envoi.date_acceptation) : '-'}
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

export default EbillStatus;
