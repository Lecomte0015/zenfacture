import React, { useRef } from 'react';
import { Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useImport, ImportSource, ImportType } from '../../hooks/useImport';
import ColumnMapper from './ColumnMapper';
import { getTargetColumns } from '../../services/importService';

interface ImportWizardProps {
  organisationId: string;
  onComplete?: () => void;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({ organisationId, onComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    state,
    selectFile,
    setSource,
    setType,
    updateMapping,
    removeMapping,
    autoMap,
    nextStep,
    previousStep,
    executeImport,
    getPreviewData,
    reset,
  } = useImport();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      selectFile(file);
    }
  };

  const handleStep1Next = () => {
    if (!state.file || state.headers.length === 0) {
      return;
    }
    autoMap();
    nextStep();
  };

  const handleStep2Next = () => {
    if (Object.keys(state.mapping).length === 0) {
      return;
    }
    nextStep();
  };

  const handleImport = async () => {
    try {
      await executeImport(organisationId);
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
    }
  };

  const handleComplete = () => {
    reset();
    onComplete?.();
  };

  const steps = [
    { number: 1, label: 'Fichier et type' },
    { number: 2, label: 'Mapping des colonnes' },
    { number: 3, label: 'Import et résultats' },
  ];

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <nav aria-label="Progress">
        <ol className="flex items-center justify-center space-x-8">
          {steps.map((step, idx) => (
            <React.Fragment key={step.number}>
              <li className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      state.step > step.number
                        ? 'border-green-600 bg-green-600'
                        : state.step === step.number
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {state.step > step.number ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : (
                      <span
                        className={`text-sm font-medium ${
                          state.step === step.number ? 'text-white' : 'text-gray-500'
                        }`}
                      >
                        {step.number}
                      </span>
                    )}
                  </div>
                  <span
                    className={`mt-2 text-sm font-medium ${
                      state.step >= step.number ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </li>
              {idx < steps.length - 1 && (
                <div className="h-0.5 w-16 bg-gray-300" />
              )}
            </React.Fragment>
          ))}
        </ol>
      </nav>

      {/* Contenu de l'étape */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {state.error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="ml-3 text-sm text-red-700">{state.error}</p>
            </div>
          </div>
        )}

        {/* Étape 1 : Sélection du fichier et configuration */}
        {state.step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Sélectionner un fichier CSV
              </h2>

              {/* Zone de dépôt de fichier */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 cursor-pointer transition-colors"
              >
                <div className="space-y-2 text-center">
                  {state.file ? (
                    <>
                      <FileSpreadsheet className="mx-auto h-12 w-12 text-green-500" />
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-gray-900">{state.file.name}</span>
                        <p className="text-xs text-gray-500 mt-1">
                          {state.rows.length} lignes détectées
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="text-sm text-gray-600">
                        <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                          Choisir un fichier
                        </label>
                        <p className="text-xs text-gray-500 mt-1">ou glisser-déposer</p>
                      </div>
                      <p className="text-xs text-gray-500">CSV jusqu'à 10 MB</p>
                    </>
                  )}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {state.file && (
              <>
                {/* Sélection de la source */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source des données
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['bexio', 'cresus', 'generic'] as ImportSource[]).map(source => (
                      <button
                        key={source}
                        type="button"
                        onClick={() => setSource(source)}
                        className={`px-4 py-3 text-sm font-medium rounded-lg border-2 transition-colors ${
                          state.source === source
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {source === 'bexio' && 'Bexio'}
                        {source === 'cresus' && 'Crésus'}
                        {source === 'generic' && 'Générique'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sélection du type de données */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de données à importer
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['clients', 'factures', 'produits', 'depenses'] as ImportType[]).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setType(type)}
                        className={`px-4 py-3 text-sm font-medium rounded-lg border-2 transition-colors ${
                          state.type === type
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {type === 'clients' && 'Clients'}
                        {type === 'factures' && 'Factures'}
                        {type === 'produits' && 'Produits'}
                        {type === 'depenses' && 'Dépenses'}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Étape 2 : Mapping des colonnes */}
        {state.step === 2 && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900">
                Correspondance des colonnes
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Vérifiez et ajustez la correspondance entre vos colonnes et les champs ZenFacture
              </p>
            </div>

            <ColumnMapper
              sourceColumns={state.headers}
              targetColumns={getTargetColumns(state.type)}
              mapping={state.mapping}
              onChange={updateMapping}
              onRemove={removeMapping}
              previewData={getPreviewData(3)}
            />
          </div>
        )}

        {/* Étape 3 : Import et résultats */}
        {state.step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {state.result ? 'Résultats de l\'import' : 'Confirmation'}
              </h2>

              {!state.result && !state.loading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-blue-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Prêt à importer
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>{state.rows.length} lignes seront importées</li>
                          <li>{Object.keys(state.mapping).length} colonnes mappées</li>
                          <li>Type de données : {state.type}</li>
                          <li>Source : {state.source}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {state.loading && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        Import en cours...
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {state.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${state.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {state.result && (
                <div className="space-y-4">
                  {/* Statistiques */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {state.rows.length}
                      </div>
                      <div className="text-sm text-gray-500">Total</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {state.result.nbImportees}
                      </div>
                      <div className="text-sm text-gray-500">Importées</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {state.result.nbErreurs}
                      </div>
                      <div className="text-sm text-gray-500">Erreurs</div>
                    </div>
                  </div>

                  {/* Message de succès/erreur */}
                  {state.result.nbErreurs === 0 ? (
                    <div className="bg-green-50 border-l-4 border-green-400 p-4">
                      <div className="flex">
                        <Check className="h-5 w-5 text-green-400" />
                        <p className="ml-3 text-sm text-green-700">
                          Import terminé avec succès ! Toutes les lignes ont été importées.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-yellow-400" />
                        <p className="ml-3 text-sm text-yellow-700">
                          Import terminé avec {state.result.nbErreurs} erreur(s).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Détails des erreurs */}
                  {state.result.erreurs.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-sm font-medium text-gray-900">
                          Détails des erreurs
                        </h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Ligne
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Erreur
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {state.result.erreurs.map((err, idx) => (
                              <tr key={idx}>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {err.ligne}
                                </td>
                                <td className="px-4 py-2 text-sm text-red-600">
                                  {err.erreur}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Boutons de navigation */}
      <div className="flex justify-between">
        <button
          onClick={previousStep}
          disabled={state.step === 1 || state.loading || !!state.result}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Précédent
        </button>

        <div className="flex space-x-3">
          {state.result && (
            <button
              onClick={handleComplete}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              <Check className="mr-2 h-4 w-4" />
              Terminer
            </button>
          )}

          {state.step === 1 && (
            <button
              onClick={handleStep1Next}
              disabled={!state.file || state.headers.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          )}

          {state.step === 2 && (
            <button
              onClick={handleStep2Next}
              disabled={Object.keys(state.mapping).length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          )}

          {state.step === 3 && !state.result && (
            <button
              onClick={handleImport}
              disabled={state.loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Import en cours...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importer
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportWizard;
