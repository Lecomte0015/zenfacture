import React, { useEffect, useState } from 'react';
import { ScrollText, User, Ban, CheckCircle, Trash2, Shield, Settings, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getAdminAuditLog, AdminAuditEntry } from '@/services/adminAuditService';

const ACTION_LABELS: Record<string, string> = {
  block_user: 'Blocage utilisateur',
  unblock_user: 'Déblocage utilisateur',
  delete_user: 'Suppression utilisateur',
  change_role: 'Changement de rôle',
  update_settings: 'Modification configuration',
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  block_user: Ban,
  unblock_user: CheckCircle,
  delete_user: Trash2,
  change_role: Shield,
  update_settings: Settings,
};

const ACTION_COLORS: Record<string, string> = {
  block_user: 'bg-yellow-100 text-yellow-700',
  unblock_user: 'bg-green-100 text-green-700',
  delete_user: 'bg-red-100 text-red-700',
  change_role: 'bg-blue-100 text-blue-700',
  update_settings: 'bg-purple-100 text-purple-700',
};

const PAGE_SIZE = 50;

const AdminAuditLogPage: React.FC = () => {
  const [entries, setEntries] = useState<AdminAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadLog(0);
  }, []);

  const loadLog = async (targetPage: number) => {
    try {
      setLoading(true);
      const data = await getAdminAuditLog(PAGE_SIZE, targetPage * PAGE_SIZE);
      setEntries(data);
      setHasMore(data.length === PAGE_SIZE);
      setPage(targetPage);
    } catch (error) {
      console.error('Erreur lors du chargement du journal d\'audit :', error);
    } finally {
      setLoading(false);
    }
  };

  const renderDetails = (details: Record<string, unknown> | null) => {
    if (!details || Object.keys(details).length === 0) return null;
    return (
      <p className="text-xs text-gray-500 mt-1">
        {Object.entries(details)
          .map(([key, value]) => `${key}: ${value === null || value === undefined ? '—' : String(value)}`)
          .join(' · ')}
      </p>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <ScrollText className="w-7 h-7 mr-3 text-gray-700" />
            Journal d'audit
          </h1>
          <p className="text-gray-600 mt-2">
            Historique des actions administratives (blocage, suppression, rôles, configuration...)
          </p>
        </div>
        <button
          onClick={() => loadLog(0)}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Rafraîchir
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          {entries.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500">Aucune action enregistrée pour le moment</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {entries.map((entry) => {
                const Icon = ACTION_ICONS[entry.action] || User;
                const color = ACTION_COLORS[entry.action] || 'bg-gray-100 text-gray-700';
                const label = ACTION_LABELS[entry.action] || entry.action;
                return (
                  <li key={entry.id} className="px-6 py-4 flex items-start hover:bg-gray-50">
                    <div className={`p-2 rounded-full mr-4 shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{label}</p>
                        <p className="text-xs text-gray-400 whitespace-nowrap ml-4">
                          {format(new Date(entry.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Par {entry.admin_email || 'admin inconnu'}
                        {entry.target_type && (
                          <>
                            {' '}— cible : {entry.target_type}
                            {entry.target_id ? ` (${entry.target_id.slice(0, 8)}...)` : ''}
                          </>
                        )}
                      </p>
                      {renderDetails(entry.details)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => loadLog(page - 1)}
              disabled={page === 0}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <span className="text-sm text-gray-500">Page {page + 1}</span>
            <button
              onClick={() => loadLog(page + 1)}
              disabled={!hasMore}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogPage;
