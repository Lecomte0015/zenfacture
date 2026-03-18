import React, { useState } from 'react';
import { Plus, Search, FileText, Pencil, Trash2, ArrowRight, Mail, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDevis } from '../../hooks/useDevis';
import { DevisData, generateDevisNumber, convertirEnFacture, updateDevis } from '../../services/devisService';
import { useClients } from '../../hooks/useClients';
import { useProduits } from '../../hooks/useProduits';
import DevisForm from '../../components/devis/DevisForm';
import DeviseSelector from '../../components/common/DeviseSelector';
import { DeviseCode } from '../../services/deviseService';
import { formatCurrency } from '../../utils/format';
import { sendInvoiceEmail } from '../../services/emailService';

const STATUT_COLORS: Record<string, string> = {
  brouillon: 'bg-gray-100 text-gray-800',
  envoye: 'bg-blue-100 text-blue-800',
  accepte: 'bg-green-100 text-green-800',
  refuse: 'bg-red-100 text-red-800',
  expire: 'bg-yellow-100 text-yellow-800',
  converti: 'bg-purple-100 text-purple-800',
};

interface SendFeedback {
  type: 'success' | 'error';
  message: string;
}

const DevisPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingDevis, setEditingDevis] = useState<DevisData | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Email send modal state
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendingDevis, setSendingDevis] = useState<DevisData | null>(null);
  const [sendEmailTo, setSendEmailTo] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [sendFeedback, setSendFeedback] = useState<SendFeedback | null>(null);

  const { devisList, loading, error, total, addDevis, editDevis, removeDevis, organisationId } = useDevis({
    search: searchTerm,
    statut: statutFilter,
  });

  const { clients } = useClients();
  const { produits } = useProduits({ actifOnly: true });

  const getClientName = (clientId?: string | null) => {
    if (!clientId) return '-';
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.prenom} ${client.nom}` : '-';
  };

  const getClientEmail = (clientId?: string | null): string => {
    if (!clientId) return '';
    const client = clients.find(c => c.id === clientId);
    return client?.email || '';
  };

  const handleConvertToInvoice = async (devis: DevisData) => {
    if (window.confirm(t('devis.convertToInvoice') + ' ?')) {
      try {
        await convertirEnFacture(devis.id);
        window.location.reload();
      } catch (err) {
        console.error('Error converting devis:', err);
      }
    }
  };

  const handleDelete = async (devis: DevisData) => {
    if (window.confirm(t('devis.confirmDelete'))) {
      await removeDevis(devis.id);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingDevis(null);
  };

  const handleEdit = (devis: DevisData) => {
    setEditingDevis(devis);
    setShowForm(true);
  };

  const handleStatusChange = async (devisId: string, newStatus: string) => {
    setUpdatingStatus(devisId);
    try {
      await editDevis(devisId, { statut: newStatus as any });
    } catch (error) {
      console.error('Erreur changement statut:', error);
      alert('Erreur lors du changement de statut');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleOpenSendModal = (devis: DevisData) => {
    setSendingDevis(devis);
    setSendEmailTo(getClientEmail(devis.client_id));
    setSendFeedback(null);
    setShowSendModal(true);
  };

  const handleCloseSendModal = () => {
    setShowSendModal(false);
    setSendingDevis(null);
    setSendEmailTo('');
    setSendFeedback(null);
  };

  const handleSendDevisEmail = async () => {
    if (!sendingDevis || !sendEmailTo.trim()) return;
    setIsSendingEmail(true);
    setSendFeedback(null);

    const result = await sendInvoiceEmail({
      to: sendEmailTo.trim(),
      recipientName: getClientName(sendingDevis.client_id),
      senderName: 'ZenFacture',
      invoiceNumber: sendingDevis.numero_devis,
      amount: sendingDevis.total.toFixed(2),
      currency: sendingDevis.devise || 'CHF',
      dueDate: sendingDevis.date_validite || sendingDevis.date_devis,
      notes: sendingDevis.notes || undefined,
    });

    setIsSendingEmail(false);

    if (result.success) {
      setSendFeedback({ type: 'success', message: `Devis envoyé à ${sendEmailTo}` });
      // Mettre le statut à "envoye"
      try {
        await editDevis(sendingDevis.id, { statut: 'envoye' });
      } catch (_e) {
        // Non bloquant
      }
      setTimeout(() => {
        handleCloseSendModal();
      }, 2000);
    } else {
      setSendFeedback({ type: 'error', message: result.error || "Erreur lors de l'envoi" });
    }
  };

  return (
    <div className="p-6">
      {/* DevisForm Modal */}
      {showForm && organisationId && (
        <DevisForm
          devis={editingDevis}
          clients={clients}
          produits={produits}
          organisationId={organisationId}
          onSave={addDevis}
          onUpdate={editDevis}
          onClose={handleCloseForm}
        />
      )}

      {/* Email Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={handleCloseSendModal} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Envoyer le devis par email</h3>
                <button onClick={handleCloseSendModal} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Devis <span className="font-medium">{sendingDevis?.numero_devis}</span> —
                {formatCurrency(sendingDevis?.total || 0, sendingDevis?.devise)}
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse email du destinataire
                </label>
                <input
                  type="email"
                  value={sendEmailTo}
                  onChange={(e) => setSendEmailTo(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="client@exemple.com"
                  disabled={isSendingEmail}
                />
              </div>

              {sendFeedback && (
                <div className={`mb-4 p-3 rounded-md text-sm ${
                  sendFeedback.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {sendFeedback.message}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleCloseSendModal}
                  disabled={isSendingEmail}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSendDevisEmail}
                  disabled={isSendingEmail || !sendEmailTo.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingEmail ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Envoi en cours…
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Envoyer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('devis.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{total} {total > 1 ? 'devis' : 'devis'}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          {t('devis.new')}
        </button>
      </div>

      {/* Filtres */}
      <div className="flex space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('common.search') + '...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="all">{t('common.all')}</option>
          {['brouillon', 'envoye', 'accepte', 'refuse', 'expire', 'converti'].map(s => (
            <option key={s} value={s}>{t(`devis.status.${s}`)}</option>
          ))}
        </select>
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
      ) : devisList.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="text-center py-12 text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium">{t('devis.noQuotes')}</p>
            <p className="mt-1 text-sm">{t('devis.manageQuotes')}</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              {t('devis.new')}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('devis.number')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('invoice.client')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('devis.date')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('devis.validUntil')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('invoice.total')}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {devisList.map((devis) => (
                <tr key={devis.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {devis.numero_devis}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getClientName(devis.client_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {devis.date_devis}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {devis.date_validite || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(devis.total, devis.devise)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <select
                      value={devis.statut}
                      onChange={(e) => handleStatusChange(devis.id, e.target.value)}
                      disabled={updatingStatus === devis.id}
                      className={`px-2 py-1 text-xs font-semibold rounded border-0 cursor-pointer ${STATUT_COLORS[devis.statut] || ''}`}
                    >
                      <option value="brouillon">{t('devis.status.brouillon')}</option>
                      <option value="envoye">{t('devis.status.envoye')}</option>
                      <option value="accepte">{t('devis.status.accepte')}</option>
                      <option value="refuse">{t('devis.status.refuse')}</option>
                      <option value="expire">{t('devis.status.expire')}</option>
                      <option value="converti">{t('devis.status.converti')}</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleOpenSendModal(devis)}
                        className="text-gray-400 hover:text-blue-600"
                        title="Envoyer par email"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      {devis.statut === 'accepte' && (
                        <button
                          onClick={() => handleConvertToInvoice(devis)}
                          className="text-purple-600 hover:text-purple-800"
                          title={t('devis.convertToInvoice')}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(devis)}
                        className="text-gray-400 hover:text-blue-600"
                        title={t('common.edit')}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(devis)}
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

export default DevisPage;
