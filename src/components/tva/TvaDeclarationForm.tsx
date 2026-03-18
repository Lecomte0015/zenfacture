import React, { useState, useEffect } from 'react';
import { Calculator, Check, Download, AlertTriangle } from 'lucide-react';
import type { TvaCalculation, TvaMethode, TvaPeriod } from '@/types/tva';

interface TvaDeclarationFormProps {
  calculation: TvaCalculation | null;
  onCalculate: (
    periodeDebut: string,
    periodeFin: string,
    methode: TvaMethode
  ) => Promise<void>;
  onValidate: () => Promise<void>;
  onExportXml: () => void;
  loading?: boolean;
}

const TvaDeclarationForm: React.FC<TvaDeclarationFormProps> = ({
  calculation,
  onCalculate,
  onValidate,
  onExportXml,
  loading = false,
}) => {
  const [periodeDebut, setPeriodeDebut] = useState('');
  const [periodeFin, setPeriodeFin] = useState('');
  const [methode, setMethode] = useState<TvaMethode>('effective');
  const [overrides, setOverrides] = useState<{ [key: string]: number }>({});

  // Générer les périodes disponibles
  const generatePeriods = (): TvaPeriod[] => {
    const periods: TvaPeriod[] = [];
    const currentYear = new Date().getFullYear();

    // Trimestres de l'année en cours et précédente
    for (let year = currentYear; year >= currentYear - 1; year--) {
      for (let quarter = 4; quarter >= 1; quarter--) {
        const startMonth = (quarter - 1) * 3;
        const endMonth = startMonth + 2;
        const debut = `${year}-${String(startMonth + 1).padStart(2, '0')}-01`;
        const fin = new Date(year, endMonth + 1, 0)
          .toISOString()
          .split('T')[0];

        periods.push({
          label: `T${quarter} ${year}`,
          debut,
          fin,
          type: 'trimestre',
        });
      }
    }

    return periods;
  };

  const periods = generatePeriods();

  const handlePeriodChange = (periodLabel: string) => {
    const period = periods.find((p) => p.label === periodLabel);
    if (period) {
      setPeriodeDebut(period.debut);
      setPeriodeFin(period.fin);
    }
  };

  const handleCalculate = async () => {
    if (!periodeDebut || !periodeFin) {
      alert('Veuillez sélectionner une période');
      return;
    }
    await onCalculate(periodeDebut, periodeFin, methode);
  };

  const handleOverride = (field: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setOverrides({ ...overrides, [field]: numValue });
    } else {
      const newOverrides = { ...overrides };
      delete newOverrides[field];
      setOverrides(newOverrides);
    }
  };

  const getValue = (field: keyof TvaCalculation): number => {
    if (overrides[field] !== undefined) {
      return overrides[field];
    }
    return calculation?.[field] || 0;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-CH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const FormField: React.FC<{
    chiffre: string;
    label: string;
    field: keyof TvaCalculation;
    readOnly?: boolean;
    highlight?: boolean;
  }> = ({ chiffre, label, field, readOnly = false, highlight = false }) => {
    const value = getValue(field);

    return (
      <div
        className={`flex items-center space-x-4 p-3 rounded ${
          highlight ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
        }`}
      >
        <div className="w-20 flex-shrink-0">
          <span className="text-sm font-semibold text-gray-700">
            {chiffre}
          </span>
        </div>
        <div className="flex-1">
          <label className="text-sm text-gray-700">{label}</label>
        </div>
        <div className="w-48">
          {readOnly ? (
            <div className="text-right font-mono text-sm bg-gray-100 px-3 py-2 rounded border border-gray-300">
              {formatCurrency(value)}
            </div>
          ) : (
            <input
              type="text"
              value={formatCurrency(value)}
              onChange={(e) =>
                handleOverride(field, e.target.value.replace(/[^\d.-]/g, ''))
              }
              className="w-full text-right font-mono text-sm px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sélection de période et méthode */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Paramètres de déclaration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Période
            </label>
            <select
              value={
                periods.find(
                  (p) => p.debut === periodeDebut && p.fin === periodeFin
                )?.label || ''
              }
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="">Sélectionner une période</option>
              {periods.map((period) => (
                <option key={period.label} value={period.label}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Méthode
            </label>
            <select
              value={methode}
              onChange={(e) => setMethode(e.target.value as TvaMethode)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="effective">Méthode effective</option>
              <option value="forfaitaire">Méthode forfaitaire</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleCalculate}
              disabled={loading || !periodeDebut || !periodeFin}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Calculator className="w-4 h-4" />
              <span>{loading ? 'Calcul...' : 'Calculer'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Formulaire AFC */}
      {calculation && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Formulaire AFC 200 - Décompte TVA
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <AlertTriangle className="w-4 h-4" />
              <span>Vous pouvez modifier les valeurs si nécessaire</span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Section 1: Chiffre d'affaires */}
            <div className="border-b pb-4">
              <h4 className="font-semibold text-gray-800 mb-3">
                I. Chiffre d'affaires
              </h4>
              <FormField
                chiffre="200"
                label="Total des contre-prestations convenues ou reçues"
                field="chiffre200"
              />
              <FormField
                chiffre="220"
                label="Prestations exonérées (art. 21)"
                field="chiffre220"
              />
              <FormField
                chiffre="230"
                label="Prestations fournies à l'étranger"
                field="chiffre230"
              />
              <FormField
                chiffre="289"
                label="Total des déductions"
                field="chiffre289"
                readOnly
              />
              <FormField
                chiffre="299"
                label="Chiffre d'affaires imposable"
                field="chiffre299"
                readOnly
                highlight
              />
            </div>

            {/* Section 2: TVA due */}
            <div className="border-b pb-4">
              <h4 className="font-semibold text-gray-800 mb-3">
                II. Calcul de l'impôt
              </h4>
              <FormField
                chiffre="300"
                label="Montant de la TVA au taux de 8.1%"
                field="chiffre300"
              />
              <FormField
                chiffre="310"
                label="Montant de la TVA au taux de 2.6%"
                field="chiffre310"
              />
              <FormField
                chiffre="340"
                label="Montant de la TVA au taux de 3.8% (hébergement)"
                field="chiffre340"
              />
              <FormField
                chiffre="399"
                label="Total de l'impôt dû"
                field="chiffre399"
                readOnly
                highlight
              />
            </div>

            {/* Section 3: Impôt préalable */}
            <div className="border-b pb-4">
              <h4 className="font-semibold text-gray-800 mb-3">
                III. Déduction de l'impôt préalable
              </h4>
              <FormField
                chiffre="400"
                label="Impôt préalable sur les charges d'exploitation"
                field="chiffre400"
              />
              <FormField
                chiffre="405"
                label="Corrections et réductions"
                field="chiffre405"
              />
              <FormField
                chiffre="410"
                label="Total de l'impôt préalable"
                field="chiffre410"
                readOnly
              />
            </div>

            {/* Section 4: Solde */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <FormField
                chiffre="420"
                label="Montant à payer (+) ou solde en votre faveur (-)"
                field="chiffre420"
                readOnly
                highlight
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end space-x-4">
            <button
              onClick={onValidate}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Valider la déclaration</span>
            </button>
            <button
              onClick={onExportXml}
              disabled={loading}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Exporter XML</span>
            </button>
          </div>
        </div>
      )}

      {!calculation && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
          <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Sélectionnez une période et cliquez sur "Calculer" pour générer
            votre déclaration TVA
          </p>
        </div>
      )}
    </div>
  );
};

export default TvaDeclarationForm;
