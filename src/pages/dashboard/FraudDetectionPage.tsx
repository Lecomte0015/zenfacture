import { useState, useEffect } from 'react';
import { useOrganisation } from '@/context/OrganisationContext';
import {
  Shield, AlertTriangle, CheckCircle, XCircle, Search,
  RefreshCw, Loader2, Info, TrendingUp, Eye, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  RisqueFraude, InvoiceForAnalysis,
  analyserFacturesRisquees, getRisqueColor, analyserRisqueFraude,
} from '@/services/fraudDetectionService';
import { supabase } from '@/lib/supabaseClient';

interface FactureRisque {
  invoice: InvoiceForAnalysis;
  risque: RisqueFraude;
}

function ScoreBadge({ niveau, score }: { niveau: RisqueFraude['niveau']; score: number }) {
  const colors = getRisqueColor(niveau);
  const labels = {
    faible: 'Faible', moyen: 'Moyen', eleve: 'Élevé', critique: 'Critique',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
      {score}/100 — {labels[niveau]}
    </span>
  );
}

function AlerteItem({ alerte }: { alerte: RisqueFraude['alertes'][0] }) {
  const iconMap = {
    info: <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />,
    warning: <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />,
    danger: <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />,
  };
  const bgMap = {
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-amber-50 border-amber-200',
    danger: 'bg-red-50 border-red-200',
  };

  return (
    <div className={`flex items-start gap-2 p-2 rounded-lg border ${bgMap[alerte.gravite]}`}>
      {iconMap[alerte.gravite]}
      <div>
        <p className="text-xs font-medium text-gray-800">{alerte.message}</p>
        {alerte.details && <p className="text-xs text-gray-500 mt-0.5">{alerte.details}</p>}
      </div>
    </div>
  );
}

function RisqueRow({ item }: { item: FactureRisque }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-800">{item.invoice.client_nom || 'Client'}</p>
          <p className="text-xs text-gray-400">
            {new Date(item.invoice.date).toLocaleDateString('fr-CH')} — CHF {item.invoice.montant.toFixed(2)}
          </p>
        </div>
        <ScoreBadge niveau={item.risque.niveau} score={item.risque.score} />
        <button className="text-gray-400 hover:text-gray-600">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 space-y-2 mt-2">
          <p className="text-sm text-gray-700 font-medium">Recommandation :</p>
          <p className="text-sm text-gray-600">{item.risque.recommandation}</p>
          <div className="space-y-1.5 mt-2">
            {item.risque.alertes.map((a, idx) => (
              <AlerteItem key={idx} alerte={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FraudDetectionPage() {
  const { organisation } = useOrganisation();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FactureRisque[]>([]);
  const [stats, setStats] = useState({ total: 0, critiques: 0, eleves: 0, moyens: 0 });
  const [singleId, setSingleId] = useState('');
  const [singleResult, setSingleResult] = useState<RisqueFraude | null>(null);
  const [singleLoading, setSingleLoading] = useState(false);

  const runAnalysis = async () => {
    if (!organisation?.id) return;
    setLoading(true);
    try {
      const data = await analyserFacturesRisquees(organisation.id);
      setResults(data);
      setStats({
        total: data.length,
        critiques: data.filter(d => d.risque.niveau === 'critique').length,
        eleves: data.filter(d => d.risque.niveau === 'eleve').length,
        moyens: data.filter(d => d.risque.niveau === 'moyen').length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runAnalysis(); }, [organisation?.id]);

  const analyserFacture = async () => {
    if (!organisation?.id || !singleId) return;
    setSingleLoading(true);
    try {
      const { data } = await supabase
        .from('invoices')
        .select('id, total_ttc, date, client_id, client_nom')
        .eq('id', singleId)
        .single();

      if (data) {
        const invoice: InvoiceForAnalysis = {
          id: data.id,
          montant: data.total_ttc || 0,
          date: data.date,
          client_id: data.client_id,
          client_nom: data.client_nom,
        };
        const risque = await analyserRisqueFraude(organisation.id, invoice);
        setSingleResult(risque);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSingleLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Détection de fraude IA
          </h1>
          <p className="text-gray-500 mt-1">
            Analyse automatique des anomalies dans vos factures : doublons, montants atypiques, clients suspects.
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Alertes totales', value: stats.total, color: 'text-gray-800' },
          { label: 'Critiques', value: stats.critiques, color: 'text-red-700' },
          { label: 'Élevées', value: stats.eleves, color: 'text-orange-700' },
          { label: 'Moyennes', value: stats.moyens, color: 'text-amber-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Comment ça marche */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-800 text-sm mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Algorithmes de détection
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
          {[
            '🔍 Montants atypiques (>3x la moyenne client)',
            '📋 Doublons suspects (même montant, même client, 30j)',
            '💰 Montants ronds élevés (CHF multiple de 1000)',
            '👤 Premier document client > CHF 2\'000',
            '⚡ Fréquence inhabituelle (>5 factures en 7j)',
            '📊 Scoring de risque 0-100 en temps réel',
          ].map(item => (
            <div key={item} className="flex items-center gap-1">
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Analyser une facture spécifique */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-500" />
          Analyser une facture spécifique
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={singleId}
            onChange={e => setSingleId(e.target.value)}
            placeholder="ID de la facture (UUID)"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <button
            onClick={analyserFacture}
            disabled={singleLoading || !singleId}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {singleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            Analyser
          </button>
        </div>

        {singleResult && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <ScoreBadge niveau={singleResult.niveau} score={singleResult.score} />
              <p className="text-sm text-gray-700">{singleResult.recommandation}</p>
            </div>
            <div className="space-y-2">
              {singleResult.alertes.map((a, idx) => (
                <AlerteItem key={idx} alerte={a} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Résultats de l'analyse globale */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-medium text-gray-800">
            Factures avec score de risque ≥ 30 ({results.length})
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-500">Analyse en cours...</span>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
            <p className="font-medium text-green-700">Aucune anomalie détectée</p>
            <p className="text-sm mt-1 text-gray-400">Toutes vos factures semblent conformes.</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {results.map((item, idx) => (
              <RisqueRow key={idx} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
