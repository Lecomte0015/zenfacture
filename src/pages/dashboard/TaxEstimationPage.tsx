import { useState } from 'react';
import {
  Calculator, TrendingUp, TrendingDown, AlertCircle,
  Info, ChevronDown, ChevronUp, Download, RefreshCw,
} from 'lucide-react';
import {
  InputFiscal, ResultatFiscal, LigneFiscale, StatutFiscal, Canton,
  calculerEstimationFiscale, genererScenarios, verifierSeuilTVA,
} from '@/services/taxEstimationService';

const CANTONS: { value: Canton; label: string }[] = [
  { value: 'GE', label: 'Genève' },
  { value: 'VD', label: 'Vaud' },
  { value: 'ZH', label: 'Zurich' },
  { value: 'BE', label: 'Berne' },
  { value: 'VS', label: 'Valais' },
  { value: 'FR', label: 'Fribourg' },
  { value: 'NE', label: 'Neuchâtel' },
  { value: 'JU', label: 'Jura' },
  { value: 'autre', label: 'Autre canton' },
];

const STATUTS: { value: StatutFiscal; label: string; desc: string }[] = [
  { value: 'independant', label: 'Indépendant / raison individuelle', desc: 'Revenu soumis à l\'impôt sur le revenu' },
  { value: 'sarl', label: 'Sàrl', desc: 'Impôt sur le bénéfice de la société' },
  { value: 'sa', label: 'SA', desc: 'Impôt sur le bénéfice de la société' },
];

const defaultInput: InputFiscal = {
  chiffre_affaires_ht: 120000,
  charges_deductibles: 20000,
  salaires_bruts: 0,
  loyer_annuel: 0,
  autres_charges: 0,
  statut: 'independant',
  canton: 'GE',
  assujetti_tva: true,
  taux_tva_moyen: 8.1,
  annee: 2025,
};

function formatCHF(v: number) {
  return new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 }).format(v);
}

function LigneRow({ ligne }: { ligne: LigneFiscale }) {
  const [expanded, setExpanded] = useState(false);
  const isPos = ligne.type === 'positif';
  const color = isPos ? 'text-green-700' : ligne.type === 'impot' ? 'text-red-700' : ligne.type === 'cotisation' ? 'text-purple-700' : 'text-gray-700';

  return (
    <div>
      <div
        className={`flex items-center justify-between py-2 px-1 rounded hover:bg-gray-50 cursor-pointer ${isPos ? 'border-t border-gray-100 mt-1 pt-3' : ''}`}
        onClick={() => ligne.info && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">{ligne.libelle}</span>
          {ligne.info && <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
        </div>
        <span className={`text-sm font-medium ${color}`}>
          {ligne.montant < 0 ? '-' : ''}{formatCHF(Math.abs(ligne.montant))}
        </span>
      </div>
      {expanded && ligne.info && (
        <p className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1 mb-1">{ligne.info}</p>
      )}
    </div>
  );
}

export default function TaxEstimationPage() {
  const [input, setInput] = useState<InputFiscal>(defaultInput);
  const [result, setResult] = useState<ResultatFiscal | null>(null);
  const [scenarios, setScenarios] = useState<{
    pessimiste: ResultatFiscal;
    realiste: ResultatFiscal;
    optimiste: ResultatFiscal;
  } | null>(null);
  const [showScenarios, setShowScenarios] = useState(false);
  const [activeScenario, setActiveScenario] = useState<'pessimiste' | 'realiste' | 'optimiste'>('realiste');

  const seuil = verifierSeuilTVA(input.chiffre_affaires_ht);

  const handleCalculate = () => {
    const r = calculerEstimationFiscale(input);
    setResult(r);
    setScenarios(genererScenarios(input));
    setShowScenarios(false);
  };

  const field = (key: keyof InputFiscal) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setInput(prev => ({ ...prev, [key]: val }));
  };

  const displayResult = showScenarios && scenarios
    ? scenarios[activeScenario]
    : result;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-blue-600" />
          Estimation fiscale suisse
        </h1>
        <p className="text-gray-500 mt-1">
          Simulez votre charge fiscale (cotisations + impôts) selon votre situation.
          <span className="ml-1 text-amber-600 font-medium">Estimation indicative — consultez un fiduciaire pour votre situation exacte.</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire de saisie */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Paramètres</h2>

            {/* Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Forme juridique</label>
              <div className="space-y-2">
                {STATUTS.map(s => (
                  <label key={s.value} className={`flex items-start gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors ${
                    input.statut === s.value ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="statut"
                      value={s.value}
                      checked={input.statut === s.value}
                      onChange={field('statut')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{s.label}</p>
                      <p className="text-xs text-gray-500">{s.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Canton */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Canton de domicile fiscal</label>
              <select
                value={input.canton}
                onChange={field('canton')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {CANTONS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* CA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chiffre d'affaires HT (CHF)
              </label>
              <input
                type="number"
                min={0}
                step={1000}
                value={input.chiffre_affaires_ht}
                onChange={field('chiffre_affaires_ht')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {/* Seuil TVA */}
              <div className={`mt-1 text-xs flex items-start gap-1 ${seuil.assujetti ? 'text-amber-600' : 'text-green-600'}`}>
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>{seuil.message}</span>
              </div>
            </div>

            {/* TVA */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={input.assujetti_tva}
                  onChange={field('assujetti_tva')}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">Assujetti à la TVA</span>
              </label>
              {input.assujetti_tva && (
                <select
                  value={input.taux_tva_moyen}
                  onChange={field('taux_tva_moyen')}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value={8.1}>8.1% (normal)</option>
                  <option value={2.6}>2.6% (réduit)</option>
                  <option value={3.8}>3.8% (hébergement)</option>
                </select>
              )}
            </div>

            {/* Charges */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Charges déductibles</h3>
              {[
                { key: 'charges_deductibles' as const, label: 'Charges professionnelles (matériel, frais...)' },
                { key: 'salaires_bruts' as const, label: 'Salaires bruts versés' },
                { key: 'loyer_annuel' as const, label: 'Loyer annuel locaux' },
                { key: 'autres_charges' as const, label: 'Autres charges' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={input[key] as number}
                    onChange={field(key)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleCalculate}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
            >
              <Calculator className="w-4 h-4" />
              Calculer l'estimation
            </button>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              <strong>Estimation indicative uniquement.</strong> Les taux cantonaux sont approximatifs.
              Cette simulation ne remplace pas les conseils d'un fiduciaire ou d'un expert fiscal.
            </p>
          </div>
        </div>

        {/* Résultats */}
        <div className="space-y-4">
          {displayResult ? (
            <>
              {/* Scénarios */}
              {scenarios && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">Analyse par scénario</h3>
                    <button
                      onClick={() => setShowScenarios(!showScenarios)}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      {showScenarios ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {showScenarios ? 'Masquer' : 'Voir scénarios'}
                    </button>
                  </div>

                  {showScenarios && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {(['pessimiste', 'realiste', 'optimiste'] as const).map(sc => (
                        <button
                          key={sc}
                          onClick={() => setActiveScenario(sc)}
                          className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                            activeScenario === sc
                              ? sc === 'pessimiste' ? 'border-red-400 bg-red-50 text-red-700'
                              : sc === 'optimiste' ? 'border-green-400 bg-green-50 text-green-700'
                              : 'border-blue-400 bg-blue-50 text-blue-700'
                              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-bold">{sc === 'pessimiste' ? '↓ -20%' : sc === 'optimiste' ? '↑ +20%' : '● Réaliste'}</div>
                          <div className="mt-0.5">{formatCHF(scenarios[sc].revenu_net)}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-xs text-green-700 font-medium">Revenu net estimé</p>
                  <p className="text-xl font-bold text-green-800 mt-1">{formatCHF(displayResult.revenu_net)}</p>
                  <p className="text-xs text-green-600 mt-0.5">Après impôts et cotisations</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-xs text-red-700 font-medium">Charge totale</p>
                  <p className="text-xl font-bold text-red-800 mt-1">
                    {displayResult.taux_charge_global.toFixed(1)}%
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">Du chiffre d'affaires</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <p className="text-xs text-purple-700 font-medium">Cotisations sociales</p>
                  <p className="text-xl font-bold text-purple-800 mt-1">{formatCHF(displayResult.cotisations_sociales)}</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-xs text-orange-700 font-medium">Total impôts</p>
                  <p className="text-xl font-bold text-orange-800 mt-1">{formatCHF(displayResult.total_impots)}</p>
                </div>
              </div>

              {/* Détail ligne par ligne */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h3 className="font-semibold text-gray-800 mb-3">Détail du calcul</h3>
                <div className="space-y-0.5 divide-y divide-gray-50">
                  {displayResult.lignes.map((ligne, idx) => (
                    <LigneRow key={idx} ligne={ligne} />
                  ))}
                </div>
              </div>

              {/* Barre de répartition visuelle */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h3 className="font-semibold text-gray-800 mb-3">Répartition du CA</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Charges professionnelles', value: displayResult.total_charges, color: 'bg-gray-400' },
                    { label: 'Cotisations sociales', value: displayResult.cotisations_sociales, color: 'bg-purple-500' },
                    { label: 'Impôts', value: displayResult.total_impots, color: 'bg-red-500' },
                    { label: 'Revenu net', value: Math.max(0, displayResult.revenu_net), color: 'bg-green-500' },
                  ].map(item => {
                    const pct = displayResult.chiffre_affaires_ht > 0
                      ? (item.value / displayResult.chiffre_affaires_ht) * 100
                      : 0;
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                          <span>{item.label}</span>
                          <span>{pct.toFixed(1)}% — {formatCHF(item.value)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3">
                          <div
                            className={`${item.color} h-3 rounded-full transition-all duration-500`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bouton reset */}
              <button
                onClick={() => { setResult(null); setScenarios(null); }}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Réinitialiser
              </button>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center text-gray-400">
              <Calculator className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Remplissez les paramètres et cliquez sur "Calculer"</p>
              <p className="text-sm mt-1">L'estimation apparaîtra ici</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
