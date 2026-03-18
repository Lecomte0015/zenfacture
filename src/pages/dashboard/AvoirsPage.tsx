import React, { useState } from 'react';
import { Plus, Search, FileText, Pencil, Trash2, Mail, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAvoirs } from '../../hooks/useAvoirs';
import { AvoirData } from '../../services/avoirService';
import { useClients } from '../../hooks/useClients';
import { formatCurrency } from '../../utils/format';
import { sendInvoiceEmail } from '../../services/emailService';

const STATUT_COLORS: Record<string, string> = {
  brouillon: 'bg-gray-100 text-gray-800',
  emis: 'bg-blue-100 text-blue-800',
  applique: 'bg-green-100 text-green-800',
  annule: 'bg-red-100 text-red-800',
};

interface SendFeedback {
  type: 'success' | 'error';
  message: string;
}

const AvoirsPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  // Email send modal state
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendingAvoir, setSendingAvoir] = useState<AvoirData | null>(null);
  const [sendEmailTo, setSendEmailTo] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [sendFeedback, setSendFeedback] = useState<SendFeedback | null>(null);

  const { avoirs, loading, error, total, removeAvoir, editAvoir } = useAvoirs({ search: searchTerm });
  const { clients } = useClients();

  const getClientName = (clientId?: string | null): string => {
    if (!clientId) return '-';
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.prenom} ${client.nom}` : '-';
  };

  const getClientEmail = (clientId?: string | null): string => {
    if (!clientId) return '';
    const client = clients.find(c => c.id === clientId);
    return client?.email || '';
  };

  const handleDelete = async (avoir: AvoirData) => {
    if (window.confirm(t('avoir.confirmDelete'))) {
      await removeAvoir(avoir.id);
    }
  };

  const handleOpenSendModal = (avoir: AvoirData) => {
    setSendingAvoir(avoir);
    setSendEmailTo(getClientEmail(avoir.client_id));
    setSendFeedback(null);
    setShowSendModal(true);
  };

  const handleCloseSendModal = () => {
    setShowSendModal(false);
    setSendingAvoir(null);
    setSendEmailTo('');
    setSendFeedback(null);
  };

  const handleSendAvoirEmail = async () => {
    if (!sendingAvoir || !sendEmailTo.trim()) return;
    setIsSendingEmail(true);
    setSendFeedback(null);

    const result = await sendInvoiceEmail({
      to: sendEmailTo.trim(),
      recipientName: getClientName(sendingAvoir.client_id),
      senderName: 'ZenFacture',
      invoiceNumber: sendingAvoir.numero_avoir,
      amount: sendingAvoir.total.toFixed(2),
      currency: sendingAvoir.devise || 'CHF',
      dueDate: sendingAvoir.date_avoir,
      notes: sendingAvoir.notes || undefined,
    });

    setIsSendingEmail(false);

    if (result.success) {
      setSendFeedback({ type: 'success', message: `Avoir envoyé à ${sendEmailTo}` });
      // Mettre le statut à "emis"
      try {
        await editAvoir(sendingAvoir.id, { statut: 'emis' });
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
      {/* Email Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={handleCloseSendModal} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Envoyer l'avoir par email</h3>
                <button onClick={handleCloseSendModal} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Avoir <span className="font-medium">{sendingAvoir?.numero_avoir}</span> —
                -{formatCurrency(sendingAvoir?.total || 0, sendingAvoir?.devise)}
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
                  onClick={handleSendAvoirEmail}
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

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('avoir.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{total} {total > 1 ? 'avoirs' : 'avoir'}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('common.search') + '...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
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
      ) : avoirs.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="text-center py-12 text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium">{t('avoir.noCredits')}</p>
            <p className="mt-1 text-sm">{t('avoir.manageCredits')}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('avoir.number')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('avoir.date')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('avoir.linkedInvoice')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('avoir.reason')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('invoice.total')}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {avoirs.map((avoir) => (
                <tr key={avoir.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{avoir.numero_avoir}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{avoir.date_avoir}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{avoir.facture_id ? 'Oui' : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">{avoir.motif || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-medium">
                    -{formatCurrency(avoir.total, avoir.devise)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUT_COLORS[avoir.statut] || ''}`}>
                      {t(`avoir.status.${avoir.statut}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleOpenSendModal(avoir)}
                        className="text-gray-400 hover:text-blue-600"
                        title="Envoyer par email"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(avoir)} className="text-gray-400 hover:text-red-600" title={t('common.delete')}>
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

export default AvoirsPage;
