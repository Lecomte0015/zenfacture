import { useState, useEffect } from 'react';
import { useOrganisation } from '@/context/OrganisationContext';
import {
  Users, FileText, CheckCircle, XCircle, ChevronRight,
  ChevronLeft, Loader2, Plus, Trash2, Send, Search,
  AlertCircle, RotateCcw,
} from 'lucide-react';
import {
  getBatchClients,
  generateBatchInvoices,
  BatchClient,
  BatchItem,
  BatchSummary,
} from '@/services/batchInvoiceService';

type Step = 1 | 2 | 3 | 4;

const TVA_OPTIONS = [
  { value: 8.1, label: '8.1% (normal)' },
  { value: 2.6, label: '2.6% (réduit)' },
  { value: 3.8, label: '3.8% (hébergement)' },
  { value: 0, label: '0% (exonéré)' },
];

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function getDefaultDue() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}

export default function BatchInvoicePage() {
  const { organisation } = useOrganisation();
  const [step, setStep] = useState<Step>(1);

  // Step 1 — Clients
  const [clients, setClients] = useState<BatchClient[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [search, setSearch] = useState('');

  // Step 2 — Config facture
  const [date, setDate] = useState(getTodayStr());
  const [dateEcheance, setDateEcheance] = useState(getDefaultDue());
  const [notes, setNotes] = useState('');
  const [conditions, setConditions] = useState('');
  const [items, setItems] = useState<BatchItem[]>([
    { description: '', quantite: 1, prix_unitaire: 0, taux_tva: 8.1 },
  ]);

  // Step 3 — Génération
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<BatchSummary | null>(null);

  useEffect(() => {
    if (!organisation?.id) return;
    setLoadingClients(true);
    getBatchClients(organisation.id)
      .then(setClients)
      .catch(console.error)
      .finally(() => setLoadingClients(false));
  }, [organisation?.id]);

  const selectedClients = clients.filter(c => c.selected);
  const filteredClients = clients.filter(c =>
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleClient = (id: string) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  };

  const toggleAll = () => {
    const allSelected = filteredClients.every(c => c.selected);
    const filteredIds = new Set(filteredClients.map(c => c.id));
    setClients(prev => prev.map(c =>
      filteredIds.has(c.id) ? { ...c, selected: !allSelected } : c
    ));
  };

  const addItem = () => {
    setItems(prev => [...prev, { description: '', quantite: 1, prix_unitaire: 0, taux_tva: 8.1 }]);
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof BatchItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const calcTotals = () => {
    let ht = 0; let tva = 0;
    for (const item of items) {
      const lineHt = item.quantite * item.prix_unitaire;
      ht += lineHt;
      tva += lineHt * (item.taux_tva / 100);
    }
    return { ht, tva, ttc: ht + tva };
  };

  const handleGenerate = async () => {
    if (!organisation?.id) return;
    setGenerating(true);
    setProgress(0);
    try {
      const result = await generateBatchInvoices(
        selectedClients.map(c => c.id),
        {
          date,
          date_echeance: dateEcheance,
          items,
          notes,
          conditions,
          organisation_id: organisation.id,
        },
        (current, total) => setProgress(Math.round((current / total) * 100))
      );
      setSummary(result);
      setStep(4);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSummary(null);
    setProgress(0);
    setClients(prev => prev.map(c => ({ ...c, selected: false })));
  };

  const totals = calcTotals();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Send className="w-6 h-6 text-blue-600" />
          Facturation groupée
        </h1>
        <p className="text-gray-500 mt-1">
          Générez des factures identiques pour plusieurs clients en une seule opération.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {[
          { n: 1, label: 'Clients' },
          { n: 2, label: 'Contenu' },
          { n: 3, label: 'Confirmation' },
          { n: 4, label: 'Résultats' },
        ].map((s, idx) => (
          <div key={s.n} className="flex items-center flex-1 last:flex-none">
            <div className={`flex items-center gap-2 ${step >= s.n ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                step > s.n ? 'bg-blue-600 border-blue-600 text-white' :
                step === s.n ? 'border-blue-600 text-blue-600 bg-blue-50' :
                'border-gray-300 text-gray-400'
              }`}>
                {step > s.n ? <CheckCircle className="w-4 h-4" /> : s.n}
              </div>
              <span className="text-sm font-medium hidden sm:block">{s.label}</span>
            </div>
            {idx < 3 && (
              <div className={`flex-1 h-0.5 mx-2 ${step > s.n ? 'bg-blue-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* STEP 1 — Sélection clients */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Sélectionner les clients ({selectedClients.length} sélectionné{selectedClients.length !== 1 ? 's' : ''})
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {loadingClients ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-500">Chargement des clients...</span>
            </div>
          ) : (
            <>
              {/* Sélectionner tout */}
              <div className="px-5 py-2 border-b border-gray-50 bg-gray-50">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={filteredClients.length > 0 && filteredClients.every(c => c.selected)}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  Tout sélectionner ({filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''})
                </label>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {filteredClients.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    Aucun client trouvé
                  </div>
                ) : filteredClients.map(client => (
                  <label
                    key={client.id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={client.selected}
                      onChange={() => toggleClient(client.id)}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {client.nom.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm">{client.nom}</p>
                      <p className="text-xs text-gray-400">{client.email || 'Pas d\'email'}</p>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}

          <div className="p-5 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={selectedClients.length === 0}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Contenu facture */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Contenu de la facture
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Ce contenu sera identique pour les {selectedClients.length} client{selectedClients.length !== 1 ? 's' : ''} sélectionné{selectedClients.length !== 1 ? 's' : ''}.
            </p>
          </div>

          <div className="p-5 space-y-5">
            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de facturation</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
                <input
                  type="date"
                  value={dateEcheance}
                  onChange={e => setDateEcheance(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Lignes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Lignes de facture</label>
                <button
                  onClick={addItem}
                  className="flex items-center gap-1 text-blue-600 text-sm hover:text-blue-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="col-span-5">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={e => updateItem(idx, 'description', e.target.value)}
                        className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-1">
                      <input
                        type="number"
                        placeholder="Qté"
                        value={item.quantite}
                        min={0}
                        onChange={e => updateItem(idx, 'quantite', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Prix unit."
                        value={item.prix_unitaire}
                        min={0}
                        step={0.01}
                        onChange={e => updateItem(idx, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-3">
                      <select
                        value={item.taux_tva}
                        onChange={e => updateItem(idx, 'taux_tva', parseFloat(e.target.value))}
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        {TVA_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <button
                        onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                        className="text-red-400 hover:text-red-600 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totaux */}
              <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm space-y-1 text-right">
                <div className="flex justify-between text-gray-600">
                  <span>Total HT</span>
                  <span className="font-medium">CHF {totals.ht.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>TVA</span>
                  <span className="font-medium">CHF {totals.tva.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-blue-700 font-bold border-t border-blue-200 pt-1 mt-1">
                  <span>Total TTC</span>
                  <span>CHF {totals.ttc.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Notes visibles sur la facture..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conditions de paiement</label>
                <textarea
                  rows={3}
                  value={conditions}
                  onChange={e => setConditions(e.target.value)}
                  placeholder="Ex: Paiement à 30 jours..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-gray-100 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-5 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={items.every(i => !i.description)}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Confirmation */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Confirmation avant génération</h2>
          </div>

          <div className="p-5 space-y-4">
            {/* Résumé */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">{selectedClients.length}</p>
                <p className="text-sm text-blue-600">Clients sélectionnés</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{items.length}</p>
                <p className="text-sm text-green-600">Ligne{items.length !== 1 ? 's' : ''} de facture</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-purple-700">CHF {totals.ttc.toFixed(2)}</p>
                <p className="text-sm text-purple-600">Par facture (TTC)</p>
              </div>
            </div>

            {/* Détails */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Date de facturation</span>
                <span className="font-medium">{date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Échéance</span>
                <span className="font-medium">{dateEcheance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Montant total généré</span>
                <span className="font-bold text-blue-700">
                  CHF {(totals.ttc * selectedClients.length).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Liste clients */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Clients ({selectedClients.length})</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {selectedClients.map(c => (
                  <div key={c.id} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    <span className="font-medium">{c.nom}</span>
                    {c.email && <span className="text-gray-400">— {c.email}</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-700">
                Cette opération créera <strong>{selectedClients.length} facture{selectedClients.length !== 1 ? 's' : ''}</strong> en brouillon.
                Elles seront disponibles dans la liste des factures.
              </p>
            </div>
          </div>

          <div className="p-5 border-t border-gray-100 flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-5 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Génération en cours... {progress}%
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Générer {selectedClients.length} facture{selectedClients.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>

          {/* Barre de progression */}
          {generating && (
            <div className="px-5 pb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 4 — Résultats */}
      {step === 4 && summary && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Résultats de la génération</h2>
          </div>

          <div className="p-5 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-700">{summary.total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{summary.success}</p>
                <p className="text-sm text-green-600">Réussites</p>
              </div>
              <div className={`${summary.failed > 0 ? 'bg-red-50' : 'bg-gray-50'} rounded-lg p-4 text-center`}>
                <p className={`text-2xl font-bold ${summary.failed > 0 ? 'text-red-700' : 'text-gray-400'}`}>
                  {summary.failed}
                </p>
                <p className={`text-sm ${summary.failed > 0 ? 'text-red-600' : 'text-gray-400'}`}>Échec{summary.failed !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Liste résultats */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {summary.results.map((r, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    r.success ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  {r.success ? (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                  <span className="font-medium text-gray-800">{r.client_nom}</span>
                  {r.success && r.numero && (
                    <span className="text-gray-400 ml-auto">{r.numero}</span>
                  )}
                  {!r.success && r.error && (
                    <span className="text-red-500 ml-auto text-xs">{r.error}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Nouvelle génération
              </button>
              <a
                href="/dashboard/invoices"
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Voir les factures
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
