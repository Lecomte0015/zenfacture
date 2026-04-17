/**
 * CRMPage — Pipeline commercial Kanban (Phase 8.2)
 * URL : /dashboard/crm
 */

import { useState, useEffect, useCallback } from 'react';
import { useOrganisation } from '@/context/OrganisationContext';
import {
  TrendingUp, Plus, Target, Trophy, X, Loader2,
  ChevronRight, Phone, Mail, FileText, Calendar,
  ArrowRight, Pencil, Trash2, Clock,
} from 'lucide-react';
import {
  CRMOpportunite, CRMActivite, CRMStats, StadeCRM,
  STADES_CONFIG, STADES_ORDRE,
  getOpportunites, creerOpportunite, mettreAJourOpportunite,
  changerStade, supprimerOpportunite, convertirEnDevis,
  getActivites, ajouterActivite, getStatsCRM,
  getOpportunitesByStade, TYPES_ACTIVITE,
} from '@/services/crmService';
import { formatCurrency } from '@/utils/format';

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────

export default function CRMPage() {
  const { organisation } = useOrganisation();
  const [opportunites, setOpportunites] = useState<CRMOpportunite[]>([]);
  const [stats, setStats] = useState<CRMStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editOpp, setEditOpp] = useState<CRMOpportunite | null>(null);
  const [detailOpp, setDetailOpp] = useState<CRMOpportunite | null>(null);
  const [vueMode, setVueMode] = useState<'kanban' | 'liste'>('kanban');

  const charger = useCallback(async () => {
    if (!organisation?.id) return;
    setLoading(true);
    try {
      const [opps, st] = await Promise.all([
        getOpportunites(organisation.id),
        getStatsCRM(organisation.id),
      ]);
      setOpportunites(opps);
      setStats(st);
    } finally {
      setLoading(false);
    }
  }, [organisation?.id]);

  useEffect(() => { charger(); }, [charger]);

  const byStade = getOpportunitesByStade(opportunites);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-600" />
              CRM — Pipeline commercial
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Gérez vos opportunités de vente de prospect à client.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {(['kanban', 'liste'] as const).map(v => (
                <button key={v} onClick={() => setVueMode(v)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${vueMode === v ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                  {v === 'kanban' ? '🗂 Kanban' : '📋 Liste'}
                </button>
              ))}
            </div>
            <button onClick={() => { setEditOpp(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              <Plus className="w-4 h-4" />Nouvelle opportunité
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-3 mt-4">
            <KpiCard label="CA potentiel" value={formatCurrency(stats.ca_total_potentiel, 'CHF')} color="blue" emoji="💰" />
            <KpiCard label="CA gagné" value={formatCurrency(stats.ca_gagne, 'CHF')} color="green" emoji="🏆" />
            <KpiCard label="Taux conversion" value={`${stats.taux_conversion}%`} color="purple" emoji="📊" />
            <KpiCard label="Durée moy. closing" value={`${stats.duree_moyenne_jours}j`} color="orange" emoji="⏱" />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : vueMode === 'kanban' ? (
        /* VUE KANBAN */
        <div className="flex-1 overflow-x-auto px-4 py-4">
          <div className="flex gap-3 min-w-max h-full">
            {STADES_ORDRE.map(stade => {
              const cfg = STADES_CONFIG[stade];
              const opps = byStade[stade] || [];
              const total = opps.reduce((s, o) => s + o.valeur, 0);

              return (
                <div key={stade} className="w-72 flex flex-col">
                  {/* En-tête colonne */}
                  <div className={`rounded-xl border ${cfg.border} ${cfg.bg} px-3 py-2.5 mb-2 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cfg.emoji}</span>
                      <div>
                        <p className={`text-sm font-semibold ${cfg.couleur}`}>{cfg.label}</p>
                        <p className="text-xs text-gray-400">{opps.length} opp. • {formatCurrency(total, 'CHF')}</p>
                      </div>
                    </div>
                    <button onClick={() => { setEditOpp({ stade } as CRMOpportunite); setShowModal(true); }}
                      className="p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-gray-600">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Cartes */}
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {opps.map(opp => (
                      <OpportuniteCard
                        key={opp.id}
                        opp={opp}
                        onDetail={() => setDetailOpp(opp)}
                        onChanger={async (newStade) => {
                          await changerStade(opp.id, newStade);
                          charger();
                        }}
                        onSupprimer={async () => {
                          if (!window.confirm('Supprimer cette opportunité ?')) return;
                          await supprimerOpportunite(opp.id);
                          charger();
                        }}
                      />
                    ))}
                    {opps.length === 0 && (
                      <div className={`rounded-xl border border-dashed ${cfg.border} p-4 text-center`}>
                        <p className="text-xs text-gray-400">Aucune opportunité</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VUE LISTE */
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-50">
            {opportunites.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucune opportunité</p>
              </div>
            ) : opportunites.map(opp => {
              const cfg = STADES_CONFIG[opp.stade];
              return (
                <div key={opp.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => setDetailOpp(opp)}>
                  <span className="text-lg">{cfg.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{opp.nom}</p>
                    <p className="text-xs text-gray-400">{opp.client_nom || opp.client_email || '—'}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.couleur} border ${cfg.border}`}>{cfg.label}</span>
                  <span className="text-sm font-semibold text-gray-700 w-28 text-right">{formatCurrency(opp.valeur, opp.devise)}</span>
                  <span className="text-xs text-gray-400">{opp.probabilite}%</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <OpportuniteModal
          opp={editOpp}
          organisationId={organisation?.id || ''}
          onClose={() => setShowModal(false)}
          onSave={async () => { setShowModal(false); await charger(); }}
        />
      )}

      {detailOpp && (
        <DetailModal
          opp={detailOpp}
          organisationId={organisation?.id || ''}
          onClose={() => setDetailOpp(null)}
          onRefresh={charger}
          onEdit={() => { setEditOpp(detailOpp); setShowModal(true); setDetailOpp(null); }}
        />
      )}
    </div>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, color, emoji }: { label: string; value: string; color: string; emoji: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100', green: 'bg-green-50 border-green-100',
    purple: 'bg-purple-50 border-purple-100', orange: 'bg-orange-50 border-orange-100',
  };
  return (
    <div className={`rounded-xl border p-3 ${colors[color]}`}>
      <p className="text-xs text-gray-500">{emoji} {label}</p>
      <p className="text-lg font-bold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}

// ─── CARTE OPPORTUNITÉ (KANBAN) ───────────────────────────────────────────────

function OpportuniteCard({ opp, onDetail, onChanger, onSupprimer }: {
  opp: CRMOpportunite;
  onDetail: () => void;
  onChanger: (stade: StadeCRM) => void;
  onSupprimer: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const cfg = STADES_CONFIG[opp.stade];
  const curIdx = STADES_ORDRE.indexOf(opp.stade);
  const nextStade = curIdx < STADES_ORDRE.length - 3 ? STADES_ORDRE[curIdx + 1] : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onDetail}>
          <p className="font-medium text-gray-800 text-sm leading-tight truncate">{opp.nom}</p>
          {opp.client_nom && <p className="text-xs text-gray-400 mt-0.5 truncate">{opp.client_nom}</p>}
          {opp.client_email && !opp.client_nom && <p className="text-xs text-gray-400 mt-0.5 truncate">{opp.client_email}</p>}
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(s => !s)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <span className="text-gray-400">•••</span>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-xl shadow-lg z-10 w-40 py-1 text-sm">
              <button onClick={() => { onDetail(); setShowMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-gray-50">Détails</button>
              {nextStade && (
                <button onClick={() => { onChanger(nextStade); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-blue-600">
                  → {STADES_CONFIG[nextStade].label}
                </button>
              )}
              <button onClick={() => { onChanger('gagne'); setShowMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-green-600">🏆 Marquer gagné</button>
              <button onClick={() => { onChanger('perdu'); setShowMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-red-600">❌ Marquer perdu</button>
              <button onClick={() => { onSupprimer(); setShowMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-red-600">Supprimer</button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-sm font-bold text-gray-700">{formatCurrency(opp.valeur, opp.devise)}</span>
        <div className="flex items-center gap-1">
          <div className="w-16 bg-gray-100 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${opp.probabilite}%` }} />
          </div>
          <span className="text-xs text-gray-400">{opp.probabilite}%</span>
        </div>
      </div>

      {opp.date_fermeture && (
        <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
          <Calendar className="w-3 h-3" />
          {new Date(opp.date_fermeture).toLocaleDateString('fr-CH')}
        </div>
      )}
    </div>
  );
}

// ─── MODAL DÉTAIL ─────────────────────────────────────────────────────────────

function DetailModal({ opp, organisationId, onClose, onRefresh, onEdit }: {
  opp: CRMOpportunite;
  organisationId: string;
  onClose: () => void;
  onRefresh: () => void;
  onEdit: () => void;
}) {
  const [activites, setActivites] = useState<CRMActivite[]>([]);
  const [typeActivite, setTypeActivite] = useState<CRMActivite['type']>('note');
  const [titreActivite, setTitreActivite] = useState('');
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const cfg = STADES_CONFIG[opp.stade];

  useEffect(() => {
    getActivites(opp.id).then(setActivites);
  }, [opp.id]);

  const handleActivite = async () => {
    if (!titreActivite.trim()) return;
    setSaving(true);
    await ajouterActivite(opp.id, { type: typeActivite, titre: titreActivite.trim() });
    setTitreActivite('');
    const acts = await getActivites(opp.id);
    setActivites(acts);
    setSaving(false);
  };

  const handleConvertir = async () => {
    setConverting(true);
    try {
      const devisId = await convertirEnDevis(organisationId, opp);
      alert(`Devis créé ! ID: ${devisId.slice(0, 8)}`);
      onRefresh();
      onClose();
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500/75" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
          {/* Header */}
          <div className={`px-6 py-4 ${cfg.bg} border-b ${cfg.border}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cfg.emoji}</span>
                  <span className={`text-xs font-semibold ${cfg.couleur}`}>{cfg.label}</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mt-0.5">{opp.nom}</h2>
                {opp.client_nom && <p className="text-sm text-gray-500">{opp.client_nom}</p>}
              </div>
              <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/60">✕</button>
            </div>
          </div>

          <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Infos */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-400 text-xs">Valeur</span><p className="font-bold text-gray-800">{formatCurrency(opp.valeur, opp.devise)}</p></div>
              <div><span className="text-gray-400 text-xs">Probabilité</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${opp.probabilite}%` }} />
                  </div>
                  <p className="font-bold text-gray-800">{opp.probabilite}%</p>
                </div>
              </div>
              {opp.client_email && <div><span className="text-gray-400 text-xs">Email</span><p className="text-gray-700 truncate">{opp.client_email}</p></div>}
              {opp.date_fermeture && <div><span className="text-gray-400 text-xs">Clôture prévue</span><p className="text-gray-700">{new Date(opp.date_fermeture).toLocaleDateString('fr-CH')}</p></div>}
            </div>

            {opp.description && (
              <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">{opp.description}</div>
            )}

            {/* Changer stade */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Changer le stade</p>
              <div className="flex flex-wrap gap-1.5">
                {STADES_ORDRE.filter(s => s !== opp.stade).map(s => {
                  const c = STADES_CONFIG[s];
                  return (
                    <button key={s} onClick={async () => { await changerStade(opp.id, s); onRefresh(); onClose(); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${c.bg} ${c.border} ${c.couleur}`}>
                      {c.emoji} {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Activités */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Journal d'activités ({activites.length})</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {activites.map(a => (
                  <div key={a.id} className="flex items-start gap-2 text-xs">
                    <span>{TYPES_ACTIVITE[a.type].emoji}</span>
                    <div className="flex-1">
                      <p className="text-gray-700 font-medium">{a.titre}</p>
                      <p className="text-gray-400">{new Date(a.date_activite).toLocaleString('fr-CH', { dateStyle: 'short', timeStyle: 'short' })}</p>
                    </div>
                  </div>
                ))}
                {activites.length === 0 && <p className="text-gray-400">Aucune activité</p>}
              </div>

              {/* Ajouter activité */}
              <div className="flex gap-2 mt-2">
                <select value={typeActivite} onChange={e => setTypeActivite(e.target.value as CRMActivite['type'])}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                  {(Object.entries(TYPES_ACTIVITE) as [CRMActivite['type'], typeof TYPES_ACTIVITE[CRMActivite['type']]][]).map(([k, v]) => (
                    <option key={k} value={k}>{v.emoji} {v.label}</option>
                  ))}
                </select>
                <input type="text" value={titreActivite} onChange={e => setTitreActivite(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleActivite()}
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ajouter une note, appel…" />
                <button onClick={handleActivite} disabled={saving || !titreActivite.trim()}
                  className="px-2 py-1.5 bg-blue-600 text-white rounded-lg text-xs disabled:opacity-50 hover:bg-blue-700">
                  {saving ? '…' : '+'}
                </button>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
            <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Pencil className="w-4 h-4" />Modifier
            </button>
            {!opp.devis_id && opp.stade !== 'perdu' && (
              <button onClick={handleConvertir} disabled={converting}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-50">
                {converting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Créer un devis
              </button>
            )}
            {opp.stade !== 'gagne' && opp.stade !== 'perdu' && (
              <button onClick={async () => { await changerStade(opp.id, 'gagne'); onRefresh(); onClose(); }}
                className="ml-auto flex items-center gap-1.5 px-3 py-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100">
                <Trophy className="w-4 h-4" />Gagné !
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL CRÉATION/ÉDITION ───────────────────────────────────────────────────

function OpportuniteModal({ opp, organisationId, onClose, onSave }: {
  opp: Partial<CRMOpportunite> | null;
  organisationId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [nom, setNom] = useState(opp?.nom || '');
  const [clientNom, setClientNom] = useState(opp?.client_nom || '');
  const [clientEmail, setClientEmail] = useState(opp?.client_email || '');
  const [valeur, setValeur] = useState(String(opp?.valeur || 0));
  const [stade, setStade] = useState<StadeCRM>(opp?.stade || 'prospect');
  const [probabilite, setProbabilite] = useState(String(opp?.probabilite ?? STADES_CONFIG[opp?.stade || 'prospect'].probabilite_defaut));
  const [dateFermeture, setDateFermeture] = useState(opp?.date_fermeture || '');
  const [description, setDescription] = useState(opp?.description || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!nom.trim()) return;
    setSaving(true);
    try {
      const payload = {
        nom: nom.trim(),
        client_nom: clientNom.trim() || undefined,
        client_email: clientEmail.trim() || undefined,
        valeur: parseFloat(valeur) || 0,
        stade,
        probabilite: parseInt(probabilite) || 50,
        date_fermeture: dateFermeture || undefined,
        description: description.trim() || undefined,
      };

      if (opp?.id) {
        await mettreAJourOpportunite(opp.id, payload);
      } else {
        await creerOpportunite(organisationId, payload);
      }
      onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500/75" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {opp?.id ? 'Modifier l\'opportunité' : 'Nouvelle opportunité'}
            </h2>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">✕</button>
          </div>

          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <Field label="Nom de l'opportunité *">
              <input type="text" value={nom} onChange={e => setNom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ex: Contrat annuel maintenance IT" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Nom du client">
                <input type="text" value={clientNom} onChange={e => setClientNom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Dupont SA" />
              </Field>
              <Field label="Email">
                <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="contact@dupont.ch" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Valeur estimée (CHF)">
                <input type="number" value={valeur} onChange={e => setValeur(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5000" />
              </Field>
              <Field label="Probabilité (%)">
                <input type="number" min={0} max={100} value={probabilite} onChange={e => setProbabilite(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Stade">
                <select value={stade} onChange={e => { const s = e.target.value as StadeCRM; setStade(s); setProbabilite(String(STADES_CONFIG[s].probabilite_defaut)); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {STADES_ORDRE.map(s => (
                    <option key={s} value={s}>{STADES_CONFIG[s].emoji} {STADES_CONFIG[s].label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Date de clôture">
                <input type="date" value={dateFermeture} onChange={e => setDateFermeture(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </Field>
            </div>

            <Field label="Description">
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Détails de l'opportunité…" />
            </Field>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
            <button onClick={handleSave} disabled={saving || !nom.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
              {opp?.id ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
