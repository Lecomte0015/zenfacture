import React, { useState } from 'react';
import { Building2, Upload, AlertCircle } from 'lucide-react';
import { useBanking } from '@/hooks/useBanking';
import { BankAccountList } from '@/components/banking/BankAccountList';
import { TransactionList } from '@/components/banking/TransactionList';
import { ReconciliationView } from '@/components/banking/ReconciliationView';
import { BankTransaction } from '@/services/bankingService';

type TabType = 'accounts' | 'transactions' | 'reconciliation';

const BankingPage: React.FC = () => {
  const {
    accounts,
    transactions,
    files,
    loading,
    error,
    addAccount,
    modifyAccount,
    removeAccount,
    importFile,
    reconcile,
    runAutoReconcile,
    loadTransactions
  } = useBanking();

  const [activeTab, setActiveTab] = useState<TabType>('accounts');
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedAccountForImport, setSelectedAccountForImport] = useState<string>('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedAccountForImport) {
      alert('Veuillez sélectionner un compte bancaire');
      return;
    }

    setUploadingFile(true);
    try {
      await importFile(file, selectedAccountForImport);
      // Reset file input
      event.target.value = '';
      setSelectedAccountForImport('');
    } catch (err) {
      console.error('Error uploading file:', err);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleTransactionClick = (transaction: BankTransaction) => {
    setSelectedTransaction(transaction);
  };

  const handleReconcile = async (transactionId: string, invoiceId: string) => {
    await reconcile(transactionId, invoiceId);
    setSelectedTransaction(null);
  };

  const handleIgnore = () => {
    setSelectedTransaction(null);
  };

  const handleAutoReconcile = async () => {
    await runAutoReconcile();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'accounts':
        return (
          <div className="space-y-6">
            {/* Bank Account List */}
            <div>
              <BankAccountList
                accounts={accounts}
                onAdd={addAccount}
                onUpdate={modifyAccount}
                onDelete={removeAccount}
                loading={loading}
              />
            </div>

            {/* Import Bank File Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Importer un fichier
              </h2>
              <div className="space-y-4">
                {/* Account Selection */}
                <div>
                  <label htmlFor="account-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Sélectionner un compte
                  </label>
                  <select
                    id="account-select"
                    value={selectedAccountForImport}
                    onChange={(e) => setSelectedAccountForImport(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    disabled={loading || uploadingFile}
                  >
                    <option value="">-- Choisir un compte --</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} - {account.iban}
                      </option>
                    ))}
                  </select>
                </div>

                {/* File Upload */}
                <div>
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">
                        {uploadingFile ? 'Importation en cours...' : 'Cliquez pour sélectionner un fichier XML'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Formats supportés: ISO 20022 XML (.xml)
                      </span>
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".xml"
                      onChange={handleFileUpload}
                      disabled={loading || uploadingFile || !selectedAccountForImport}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'transactions':
        return (
          <div>
            {selectedTransaction ? (
              <ReconciliationView
                transaction={selectedTransaction}
                onReconcile={handleReconcile}
                onIgnore={handleIgnore}
                onClose={handleIgnore}
              />
            ) : (
              <TransactionList
                transactions={transactions}
                onTransactionClick={handleTransactionClick}
                onFilterChange={loadTransactions}
                loading={loading}
              />
            )}
          </div>
        );

      case 'reconciliation':
        return (
          <div className="space-y-6">
            {/* Auto Reconciliation Button */}
            <div className="bg-white rounded-lg shadow p-6">
              <button
                onClick={handleAutoReconcile}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Rapprochement automatique
              </button>
              <p className="mt-2 text-sm text-gray-500">
                Lance le rapprochement automatique des transactions avec les factures
              </p>
            </div>

            {/* Reconciliation View */}
            {selectedTransaction ? (
              <ReconciliationView
                transaction={selectedTransaction}
                onReconcile={handleReconcile}
                onIgnore={handleIgnore}
                onClose={handleIgnore}
              />
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-center">
                  Sélectionnez une transaction dans l'onglet "Transactions" ou lancez le rapprochement automatique
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">E-banking</h1>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('accounts')}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === 'accounts'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Comptes
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === 'transactions'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Transactions
              </button>
              <button
                onClick={() => setActiveTab('reconciliation')}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === 'reconciliation'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Rapprochement
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default BankingPage;
