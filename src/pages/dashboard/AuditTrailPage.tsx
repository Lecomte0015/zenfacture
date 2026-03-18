import { useState, useEffect } from 'react';
import { useOrganisation } from '@/context/OrganisationContext';
import {
  Link2, CheckCircle, XCircle, Loader2, Download,
  RefreshCw, Shield, AlertTriangle, Filter, ChevronDown, ChevronUp,
  Hash,
} from 'lucide-react';
import {
  AuditEntry, AuditDocumentType, AuditAction,
  getAuditTrail, verifierIntegriteChaine, exporterAuditJSON,
  ACTION_LABELS, DOC_TYPE_LABELS,
} from '@/services/auditTrailService';

export default function AuditTrailPage() {
  const { organisation } = useOrganisation();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<{
    valide: boolean;
    total_entrees: number;
    entrees_invalides: number;
    premiere_rupture?: string;
  } | null>(null);
  const [filterType, setFilterType] = useState<AuditDocumentType | 'all'>('all');
  const [filterAction, setFilterAction] = useState<AuditAction | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!organisation?.id) return;
    setLoading(true);
    getAuditTrail(organisation.id, { limit: 200 })
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [organisation?.id]);

  const handleVerify = async () => {
    if (!organisation?.id) return;
    setVerifying(true);
    try {
      const result = await verifierIntegriteChaine(organisation.id);
      setVerification({
        valide: result.valide,
        total_entrees: result.total_entrees,
        entrees_invalides: result.entrees_invalides,
        premiere_rupture: result.premiere_rupture,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  const filtered = entries.filter(e => {
    if (filterType !== 'all' && e.document_type !== filterType) return false;
    if (filterAction !== 'all' && e.action !== filterAction) return false;
    return true;
  });

  const truncateHash = (hash: string) => `${hash.slice(0, 8)}…${hash.slice(-8)}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Link2 className="w-6 h-6 text-blue-600" />
            Audit Trail — Intégrité blockchain
          </h1>
          <p className="text-gray-500 mt-1">
            Journal immuable de toutes les actions sur vos documents. Chaîne de hashes SHA-256 vérifiable.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exporterAuditJSON(entries)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exporter JSON
          </button>
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Vérifier l'intégrité
          </button>
        </div>
      </div>

      {/* Résultat vérification */}
      {verification && (
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${
          verification.valide
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          {verification.valide ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className={`font-semibold ${verification.valide ? 'text-green-800' : 'text-red-800'}`}>
              {verification.valide
                ? `✅ Chaîne intègre — ${verification.total_entrees} entrées vérifiées`
                : `❌ ${verification.entrees_invalides} rupture(s) détectée(s) sur ${verification.total_entrees} entrées`
              }
            </p>
            {!verification.valide && verification.premiere_rupture && (
              <p className="text-sm text-red-700 mt-0.5">
                Première rupture : entrée <code className="font-mono">{verification.premiere_rupture.slice(0, 12)}…</code>
              </p>
            )}
            <p className={`text-sm mt-0.5 ${verification.valide ? 'text-green-700' : 'text-red-600'}`}>
              {verification.valide
                ? 'Aucune falsification détectée. Votre historique est authentique.'
                : 'Une ou plusieurs entrées ont été modifiées après leur enregistrement.'}
            </p>
          </div>
        </div>
      )}

      {/* Explication */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <Hash className="w-4 h-4" />
          Comment fonctionne l'intégrité blockchain ?
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          Chaque entrée du journal contient un hash SHA-256 calculé à partir du contenu + le hash de l'entrée précédente.
          Cette chaîne de hashes est <strong>impossible à falsifier</strong> rétroactivement : toute modification d'une entrée
          invaliderait toutes les suivantes. La vérification recalcule l'ensemble de la chaîne pour détecter toute altération.
        </p>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Filter className="w-4 h-4" />
          Filtres :
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as AuditDocumentType | 'all')}
          className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
        >
          <option value="all">Tous types</option>
          {(Object.keys(DOC_TYPE_LABELS) as AuditDocumentType[]).map(t => (
            <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value as AuditAction | 'all')}
          className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
        >
          <option value="all">Toutes actions</option>
          {(Object.keys(ACTION_LABELS) as AuditAction[]).map(a => (
            <option key={a} value={a}>{ACTION_LABELS[a].label}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400">{filtered.length} entrée{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Journal */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Link2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Aucune entrée dans l'audit trail</p>
            <p className="text-sm mt-1">Les actions sur vos documents apparaîtront ici automatiquement.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(entry => {
              const actionConf = ACTION_LABELS[entry.action];
              const isExpanded = expandedId === entry.id;
              return (
                <div key={entry.id} className="px-4 py-3">
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  >
                    {/* Hash mini */}
                    <div className="w-16 flex-shrink-0">
                      <code className="text-[10px] text-gray-400 font-mono block truncate">
                        {entry.hash_chaine.slice(0, 10)}
                      </code>
                    </div>

                    {/* Action */}
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${actionConf.color}`}>
                      {actionConf.label}
                    </span>

                    {/* Type + ID */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-800">
                        {DOC_TYPE_LABELS[entry.document_type]}
                      </span>
                      <code className="ml-2 text-xs text-gray-400 font-mono">
                        {entry.document_id.slice(0, 8)}…
                      </code>
                    </div>

                    {/* User */}
                    {entry.user_email && (
                      <span className="text-xs text-gray-400 truncate max-w-32">{entry.user_email}</span>
                    )}

                    {/* Date */}
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(entry.created_at).toLocaleString('fr-CH')}
                    </span>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-gray-400 font-medium uppercase tracking-wide text-[10px]">Hash contenu</p>
                          <code className="text-gray-600 font-mono block mt-0.5 break-all">{entry.hash_contenu}</code>
                        </div>
                        <div>
                          <p className="text-gray-400 font-medium uppercase tracking-wide text-[10px]">Hash chaîne</p>
                          <code className="text-gray-600 font-mono block mt-0.5 break-all">{entry.hash_chaine}</code>
                        </div>
                        {entry.hash_precedent && (
                          <div className="col-span-2">
                            <p className="text-gray-400 font-medium uppercase tracking-wide text-[10px]">Hash précédent</p>
                            <code className="text-gray-400 font-mono block mt-0.5 break-all">{entry.hash_precedent}</code>
                          </div>
                        )}
                        {entry.contenu_json && (
                          <div className="col-span-2">
                            <p className="text-gray-400 font-medium uppercase tracking-wide text-[10px]">Données enregistrées</p>
                            <pre className="mt-0.5 text-gray-600 bg-gray-50 rounded p-2 overflow-x-auto text-[11px]">
                              {JSON.stringify(entry.contenu_json, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
