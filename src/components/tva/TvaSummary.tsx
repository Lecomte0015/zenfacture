import React from 'react';
import { TrendingUp, TrendingDown, Calculator, DollarSign } from 'lucide-react';
import type { TvaCalculation } from '@/types/tva';

interface TvaSummaryProps {
  calculation: TvaCalculation;
  previousCalculation?: TvaCalculation | null;
}

const TvaSummary: React.FC<TvaSummaryProps> = ({
  calculation,
  previousCalculation,
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF',
    }).format(amount);
  };

  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const cards = [
    {
      title: 'Chiffre d\'affaires total',
      value: calculation.chiffre200,
      previousValue: previousCalculation?.chiffre200,
      icon: DollarSign,
      color: 'blue',
    },
    {
      title: 'TVA due',
      value: calculation.tvaTotaleDue,
      previousValue: previousCalculation?.tvaTotaleDue,
      icon: Calculator,
      color: 'orange',
    },
    {
      title: 'TVA préalable',
      value: calculation.tvaPrealable,
      previousValue: previousCalculation?.tvaPrealable,
      icon: TrendingDown,
      color: 'green',
    },
    {
      title: 'Solde net',
      value: calculation.tvaNette,
      previousValue: previousCalculation?.tvaNette,
      icon: calculation.tvaNette >= 0 ? TrendingUp : TrendingDown,
      color: calculation.tvaNette >= 0 ? 'red' : 'green',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cartes de résumé */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          const change =
            card.previousValue !== undefined
              ? calculateChange(card.value, card.previousValue)
              : null;

          return (
            <div
              key={card.title}
              className="bg-white rounded-lg shadow p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    {card.title}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {formatCurrency(card.value)}
                  </p>
                  {change !== null && (
                    <div className="mt-2 flex items-center text-sm">
                      {change >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span
                        className={
                          change >= 0 ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {Math.abs(change).toFixed(1)}%
                      </span>
                      <span className="text-gray-500 ml-1">vs période préc.</span>
                    </div>
                  )}
                </div>
                <div
                  className={`p-3 rounded-full bg-${card.color}-100 text-${card.color}-600`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Répartition de la TVA par taux */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Répartition de la TVA collectée
        </h3>
        <div className="space-y-4">
          {/* TVA 8.1% */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Taux normal (8.1%)
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(calculation.tvaCollecteeNormale)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${
                    calculation.tvaTotaleDue > 0
                      ? (calculation.tvaCollecteeNormale /
                          calculation.tvaTotaleDue) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              CA: {formatCurrency(calculation.chiffreAffairesNormal)}
            </p>
          </div>

          {/* TVA 2.6% */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Taux réduit (2.6%)
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(calculation.tvaCollecteeReduite)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{
                  width: `${
                    calculation.tvaTotaleDue > 0
                      ? (calculation.tvaCollecteeReduite /
                          calculation.tvaTotaleDue) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              CA: {formatCurrency(calculation.chiffreAffairesReduit)}
            </p>
          </div>

          {/* TVA 3.8% */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Taux hébergement (3.8%)
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(calculation.tvaCollecteeHebergement)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{
                  width: `${
                    calculation.tvaTotaleDue > 0
                      ? (calculation.tvaCollecteeHebergement /
                          calculation.tvaTotaleDue) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              CA: {formatCurrency(calculation.chiffreAffairesHebergement)}
            </p>
          </div>

          {/* CA exonéré */}
          {calculation.chiffreAffairesExonere > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Exonéré (0%)
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(0)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gray-400 h-2 rounded-full" style={{ width: '0%' }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                CA: {formatCurrency(calculation.chiffreAffairesExonere)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Résumé du calcul */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Détail du calcul
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">TVA collectée totale</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(calculation.tvaTotaleDue)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">TVA préalable (déductible)</span>
            <span className="font-medium text-gray-900">
              - {formatCurrency(calculation.tvaPrealable)}
            </span>
          </div>
          <div className="border-t border-gray-300 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">
                {calculation.tvaNette >= 0
                  ? 'Montant à payer'
                  : 'Montant en votre faveur'}
              </span>
              <span
                className={`font-bold text-lg ${
                  calculation.tvaNette >= 0 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {formatCurrency(Math.abs(calculation.tvaNette))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TvaSummary;
