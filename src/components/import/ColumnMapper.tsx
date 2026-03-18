import React from 'react';
import { ArrowRight, X } from 'lucide-react';

interface ColumnMapperProps {
  sourceColumns: string[];
  targetColumns: { key: string; label: string }[];
  mapping: Record<string, string>;
  onChange: (sourceColumn: string, targetColumn: string) => void;
  onRemove: (sourceColumn: string) => void;
  previewData: any[];
}

export const ColumnMapper: React.FC<ColumnMapperProps> = ({
  sourceColumns,
  targetColumns,
  mapping,
  onChange,
  onRemove,
  previewData,
}) => {
  return (
    <div className="space-y-6">
      {/* Table de mapping */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">
            Correspondance des colonnes
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Associez les colonnes de votre fichier aux champs de ZenFacture
          </p>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Colonne source
              </th>
              <th className="px-6 py-3 text-center w-16"></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Champ ZenFacture
              </th>
              <th className="px-6 py-3 text-right w-16"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sourceColumns.map(sourceCol => (
              <tr key={sourceCol} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{sourceCol}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  <ArrowRight className="h-4 w-4 text-gray-400 mx-auto" />
                </td>
                <td className="px-6 py-4">
                  <select
                    value={mapping[sourceCol] || ''}
                    onChange={(e) => onChange(sourceCol, e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Ne pas importer</option>
                    {targetColumns.map(tc => (
                      <option key={tc.key} value={tc.key}>
                        {tc.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 text-right">
                  {mapping[sourceCol] && (
                    <button
                      onClick={() => onRemove(sourceCol)}
                      className="text-gray-400 hover:text-red-600"
                      title="Retirer cette colonne"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {Object.keys(mapping).length === 0 && (
          <div className="px-6 py-8 text-center text-sm text-gray-500">
            Aucune colonne mappée. Sélectionnez les champs correspondants ci-dessus.
          </div>
        )}
      </div>

      {/* Aperçu des données */}
      {previewData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">
              Aperçu des données
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Les {previewData.length} premières lignes avec le mapping appliqué
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(previewData[0] || {}).map(col => (
                    <th
                      key={col}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {Object.values(row).map((value: any, cellIdx) => (
                      <td
                        key={cellIdx}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {value || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnMapper;
