import React, { useState, useMemo } from 'react';
import {
  Archive,
  Shield,
  Download,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  CreditCard,
  RotateCcw,
  FileCheck,
} from 'lucide-react';
import { useArchives } from '../../hooks/useArchives';
import { exportArchivesAsJson, verifyArchiveIntegrity, Archive as ArchiveType, DocumentType } from '../../services/archiveService';
import { formatCurrency } from '../../utils/format';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

function daysUntilExpiry(expiryStr: string): number {
  const expiry = new Date(expiryStr);
  const now = new Date();
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function thisYear(dateStr: string): boolean {
  return new Date(dateStr).getFullYear() === new Date().getFullYear();
}

// ─── Badge type document ─────────────────────────────────────────────────────

const TYPE_CONFIG: Record<DocumentType, { label: string; color: string; Icon: React.ElementType }> = {
  invoice: { label: 'Facture', color: 'bg-blue-100 text-blue-700', Icon: FileText },
  expense: { label: 'Dépense', color: 'bg-orange-100 text-orange-700', Icon: CreditCard },
  avoir: { label: 'Avoir', color: 'bg-emerald-100 text-emerald-700', Icon: RotateCcw },
  devis: { label: 'Devis', color: 'bg-violet-100 text-violet-700', Icon: FileCheck },
};

const TypeBadge: React.FC<{ type: DocumentType }> = ({ type }) => {
  const cfg = TYPE_CONFIG[type] ?? { label: type, color: 'bg-gray-100 text-gray-700', Icon: FileText };
  const Icon = cfg.Icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

// ─── Page principale ─────────────────────────────────────────────────────────

const ArchivePage: React.FC = () => {
  const { archives, loading, error, refreshArchives } = useArchives();

  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [integrityStatus, setIntegrityStatus] = useState<Record<string, boolean | null>>({});
  const [verifying, setVerifying] = useState<string | null>(null);

  // ── Filtrage ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return archives.filter(a => {
      if (typeFilter !== 'all' && a.document_type !== typeFilter) return false;
      if (search && !a.document_number?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [archives, typeFilter, search]);

  // ── Statistiques ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = archives.length;
    const thisYearCount = archives.filter(a => thisYear(a.archived_at)).length;
    const soonestExpiry = archives.reduce<string | null>((acc, a) => {
      if (!acc) return a.archive_expiry_at;
      return new Date(a.archive_expiry_at) < new Date(acc) ? a.archive_expiry_at : acc;
    }, null);
    return { total, thisYearCount, soonestExpiry };
  }, [archives]);

  // ── Export JSON ──────────────────────────────────────────────────────────────
  const handleExportJson = () => {
    const json = exportArchivesAsJson(archives);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archives-nlpd-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Vérification intégrité ───────────────────────────────────────────────────
  const handleVerify = async (archive: ArchiveType) => {
    setVerifying(archive.id);
    try {
      const ok = await verifyArchiveIntegrity(archive, archive.metadata);
      setIntegrityStatus(prev => ({ ...prev, [archive.id]: ok }));
    } catch {
      setIntegrityStatus(prev => ({ ...prev, [archive.id]: false }));
    } finally {
      setVerifying(null);
    }
  };

  // ── Rendu ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Archive className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Archives — Conservation 10 ans (nLPD)</h1>
            <p className="text-sm text-gray-500">Documents comptables archivés conformément à la loi suisse</p>
          </div>
        </div>
        <button
          onClick={handleExportJson}
          disabled={archives.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4" />
          Exporter JSON
        </button>
      </div>

      {/* Bannière info nLPD */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Conformément à la loi suisse sur la protection des données (nLPD) et au CO art. 962, les documents comptables doivent être conservés pendant 10 ans. Les documents archivés ne peuvent plus être modifiés ni supprimés.
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Total archivés</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Archivés cette année</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.thisYearCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Prochaine expiration</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {stats.soonestExpiry ? formatDate(stats.soonestExpiry) : '-'}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par numéro..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as DocumentType | 'all')}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="all">Tous les types</option>
          <option value="invoice">Factures</option>
          <option value="expense">Dépenses</option>
          <option value="avoir">Avoirs</option>
          <option value="devis">Devis</option>
        </select>
        <button
          onClick={refreshArchives}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Actualiser
        </button>
      </div>

      {/* Contenu principal */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Archive className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Aucun document archivé</h3>
          <p className="text-sm text-gray-400 max-w-sm">
            {search || typeFilter !== 'all'
              ? 'Aucun document ne correspond aux filtres sélectionnés.'
              : 'Les documents que vous archivez apparaîtront ici. Ils seront conservés pendant 10 ans conformément à la nLPD.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Numéro</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date document</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Montant</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Archivé le</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Expire le</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Hash</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Intégrité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(archive => {
                  const daysLeft = daysUntilExpiry(archive.archive_expiry_at);
                  const isSoonExpiring = daysLeft < 365;
                  const status = integrityStatus[archive.id];
                  const isVerifying = verifying === archive.id;

                  return (
                    <tr key={archive.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <TypeBadge type={archive.document_type} />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {archive.document_number || <span className="text-gray-400 italic">-</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(archive.document_date)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {archive.montant != null ? formatCurrency(archive.montant) : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(archive.archived_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-600">{formatDate(archive.archive_expiry_at)}</span>
                        {isSoonExpiring && (
                          <span className="ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {daysLeft}j
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">
                          {archive.archive_hash.slice(0, 6)}…
                        </code>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {status === true ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" title="Intégrité vérifiée" />
                        ) : status === false ? (
                          <XCircle className="w-5 h-5 text-red-500 mx-auto" title="Intégrité compromise" />
                        ) : (
                          <button
                            onClick={() => handleVerify(archive)}
                            disabled={isVerifying}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-indigo-600 border border-indigo-200 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Vérifier l'intégrité"
                          >
                            {isVerifying ? (
                              <div className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                            ) : (
                              <Shield className="w-3.5 h-3.5" />
                            )}
                            Vérifier
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
            {filtered.length} document{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
            {filtered.length !== archives.length && ` sur ${archives.length} au total`}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchivePage;
