import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search, Download, Pencil, Trash2, Eye, X, Users, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useClients } from '../../hooks/useClients';
import { useTrial } from '../../hooks/useTrial';
import { ClientData, exportClientsCSV } from '../../services/clientService';
import ClientForm, { ClientFormData } from '../../components/clients/ClientForm';

interface ClientsPageProps {
  newClient?: boolean;
}

const ClientsPage: React.FC<ClientsPageProps> = ({ newClient = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(newClient);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);

  const { clients, loading, error, total, addClient, editClient, removeClient } = useClients({
    search: searchTerm,
  });
  const { canAccessFeature } = useTrial();

  // Limite "20 clients" du plan Essentiel — voir useTrial.ts PLANS.essentiel.clients.
  // Professionnel/Entreprise sont illimités (canAccessFeature renvoie toujours true).
  const quotaReached = !canAccessFeature('clients', { currentUsage: total });
  // Export CSV réservé Professionnel/Entreprise (useTrial.ts PLANS.*.export).
  const canExport = canAccessFeature('export');

  const handleAddClient = async (formData: ClientFormData) => {
    await addClient({
      prenom: formData.prenom,
      nom: formData.nom,
      entreprise: formData.entreprise || null,
      email: formData.email || null,
      telephone: formData.telephone || null,
      adresse: formData.adresse || null,
      code_postal: formData.code_postal || null,
      ville: formData.ville || null,
      pays: formData.pays,
      notes: formData.notes || null,
      devise_preferee: formData.devise_preferee,
      conditions_paiement: formData.conditions_paiement,
    });
    setShowForm(false);
  };

  const handleEditClient = async (formData: ClientFormData) => {
    if (!editingClient) return;
    await editClient(editingClient.id, {
      prenom: formData.prenom,
      nom: formData.nom,
      entreprise: formData.entreprise || null,
      email: formData.email || null,
      telephone: formData.telephone || null,
      adresse: formData.adresse || null,
      code_postal: formData.code_postal || null,
      ville: formData.ville || null,
      pays: formData.pays,
      notes: formData.notes || null,
      devise_preferee: formData.devise_preferee,
      conditions_paiement: formData.conditions_paiement,
    });
    setEditingClient(null);
  };

  const handleDeleteClient = async (client: ClientData) => {
    if (window.confirm(t('client.confirmDelete'))) {
      await removeClient(client.id);
    }
  };

  const handleExportCSV = () => {
    const csv = exportClientsCSV(clients);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `clients_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="p-6">
      {/* Modal formulaire nouveau client */}
      {showForm && (
        quotaReached ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 mb-4">
                <Lock className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Limite de clients atteinte</h3>
              <p className="mt-2 text-sm text-gray-500">
                Le forfait Essentiel est limité à 20 clients. Passez au forfait Professionnel
                pour ajouter des clients illimités.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Fermer
                </button>
                <Link
                  to="/dashboard/billing"
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
                >
                  Voir les forfaits
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <ClientForm
            onClose={() => setShowForm(false)}
            onSubmit={handleAddClient}
          />
        )
      )}

      {/* Modal formulaire édition client */}
      {editingClient && (
        <ClientForm
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSubmit={handleEditClient}
        />
      )}

      {/* Modal détail client */}
      {selectedClient && (
        <ClientDetail
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onEdit={() => { setEditingClient(selectedClient); setSelectedClient(null); }}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('client.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total > 0
              ? `${total} ${total > 1 ? 'clients' : 'client'} dans votre carnet d’adresses`
              : 'Votre carnet d’adresses clients'}
          </p>
        </div>
        <div className="flex space-x-3">
          {canExport ? (
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              disabled={clients.length === 0}
            >
              <Download className="-ml-1 mr-2 h-4 w-4" />
              CSV
            </button>
          ) : (
            <Link
              to="/dashboard/billing"
              title="Export CSV réservé aux forfaits Professionnel et Entreprise"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <Lock className="-ml-1 mr-2 h-4 w-4" />
              CSV
            </Link>
          )}
          {quotaReached ? (
            <Link
              to="/dashboard/billing"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-orange-600 hover:bg-orange-700 transition-colors"
            >
              <Lock className="-ml-1 mr-2 h-4 w-4" />
              Voir les forfaits
            </Link>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              {t('client.new')}
            </button>
          )}
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un client par nom, entreprise ou ville..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl">
          <p className="text-sm text-red-700">Une erreur est survenue : {error}</p>
        </div>
      )}

      {/* Liste des clients */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white shadow-sm border border-gray-100 overflow-hidden rounded-2xl">
          <div className="text-center py-16 px-6 text-gray-500">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-lg font-semibold text-gray-900">Aucun client pour l’instant</p>
            <p className="mt-1 text-sm text-gray-500">Ajoutez votre premier client pour commencer à lui envoyer des factures.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-5 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Ajouter mon premier client
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-gray-100 overflow-hidden rounded-2xl">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('client.number')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('client.company')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.email')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.city')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.numero_client}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {client.prenom} {client.nom}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.entreprise || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.ville ? `${client.code_postal || ''} ${client.ville}`.trim() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setSelectedClient(client)}
                        className="text-gray-400 hover:text-blue-600"
                        title={t('client.view')}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingClient(client)}
                        className="text-gray-400 hover:text-blue-600"
                        title={t('common.edit')}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client)}
                        className="text-gray-400 hover:text-red-600"
                        title={t('common.delete')}
                      >
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

// Composant détail client
interface ClientDetailProps {
  client: ClientData;
  onClose: () => void;
  onEdit: () => void;
}

const ClientDetail: React.FC<ClientDetailProps> = ({ client, onClose, onEdit }) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {client.prenom} {client.nom}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-3">
          {client.numero_client && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">{t('client.number')}</span>
              <span className="text-sm font-medium">{client.numero_client}</span>
            </div>
          )}
          {client.entreprise && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">{t('client.company')}</span>
              <span className="text-sm font-medium">{client.entreprise}</span>
            </div>
          )}
          {client.email && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">{t('common.email')}</span>
              <a href={`mailto:${client.email}`} className="text-sm font-medium text-blue-600 hover:underline">{client.email}</a>
            </div>
          )}
          {client.telephone && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">{t('common.phone')}</span>
              <span className="text-sm font-medium">{client.telephone}</span>
            </div>
          )}
          {client.adresse && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">{t('common.address')}</span>
              <span className="text-sm font-medium text-right">
                {client.adresse}<br />
                {client.code_postal} {client.ville}<br />
                {t(`countries.${client.pays}`)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">{t('client.preferredCurrency')}</span>
            <span className="text-sm font-medium">{client.devise_preferee}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">{t('client.paymentTerms')}</span>
            <span className="text-sm font-medium">{client.conditions_paiement} {t('client.days')}</span>
          </div>
          {client.notes && (
            <div>
              <span className="text-sm text-gray-500">{t('client.notes')}</span>
              <p className="mt-1 text-sm text-gray-700">{client.notes}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            {t('common.close')}
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            {t('common.edit')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientsPage;
