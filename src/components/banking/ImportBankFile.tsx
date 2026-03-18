import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { BankAccount } from '@/services/bankingService';

interface ImportBankFileProps {
  accounts: BankAccount[];
  onImport: (compteId: string, file: File) => Promise<void>;
  loading?: boolean;
}

export const ImportBankFile: React.FC<ImportBankFileProps> = ({
  accounts,
  onImport,
  loading = false,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xml')) {
      setError('Seuls les fichiers XML sont acceptés (ISO 20022)');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setSuccess(null);
  };

  const handleImport = async () => {
    if (!selectedAccountId) {
      setError('Veuillez sélectionner un compte bancaire');
      return;
    }
    if (!selectedFile) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      await onImport(selectedAccountId, selectedFile);
      setSuccess(`Fichier "${selectedFile.name}" importé avec succès`);
      setSelectedFile(null);
      setSelectedAccountId('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'import du fichier");
    } finally {
      setUploading(false);
    }
  };

  const isDisabled = loading || uploading;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Importer un fichier bancaire
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Importez vos relevés bancaires au format ISO 20022 (camt.053 / camt.054)
      </p>

      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="import-account" className="block text-sm font-medium text-gray-700 mb-1">
            Compte bancaire
          </label>
          <select
            id="import-account"
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            disabled={isDisabled}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">-- Sélectionner un compte --</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.nom} - {account.iban}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="bank-file-upload"
            className={`flex items-center justify-center w-full h-32 px-4 transition border-2 border-dashed rounded-md appearance-none cursor-pointer ${
              isDisabled
                ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                : 'bg-white border-gray-300 hover:border-gray-400'
            } focus:outline-none`}
          >
            <div className="flex flex-col items-center space-y-2">
              {selectedFile ? (
                <>
                  <FileText className="w-8 h-8 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">{selectedFile.name}</span>
                  <span className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} Ko
                  </span>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">
                    Cliquez pour sélectionner un fichier XML
                  </span>
                  <span className="text-xs text-gray-500">
                    Formats: camt.053, camt.054 (ISO 20022)
                  </span>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              id="bank-file-upload"
              type="file"
              className="hidden"
              accept=".xml"
              onChange={handleFileSelect}
              disabled={isDisabled}
            />
          </label>
        </div>

        <button
          onClick={handleImport}
          disabled={isDisabled || !selectedFile || !selectedAccountId}
          className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Importation en cours...' : 'Importer le fichier'}
        </button>
      </div>
    </div>
  );
};

export default ImportBankFile;
