/**
 * CommandesFournisseursPage — Achats & Purchase Orders (Phase 8.3)
 * URL : /dashboard/commandes-fournisseurs
 */

import { useState, useEffect, useCallback } from 'react';
import { useOrganisation } from '@/context/OrganisationContext';
import {
  ShoppingCart, Plus, Loader2, Package, Truck, CheckCircle,
  Building, Pencil, Trash2, ChevronDown, ChevronUp, Send,
  X, AlertCircle, ArrowDown,
} from 'lucide-react';
import {
  Fournisseur, CommandeFournisseur, LigneCommande,
  STATUTS_COMMANDE,
  getFournisseurs, creerFournisseur, mettreAJourFournisseur, supprimerFournisseur,
  getCommandesFournisseurs, creerCommande, envoyerCommande, annulerCommande,
  recevoirMarchandises, getStatsFournisseurs, calculerTotaux,
} from '@/services/fournisseurService';
import { formatCurrency } from '@/utils/format';

export default function CommandesFournisseursPage() {
  const { organisation } = useOrganisation();
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [commandes, setCommandes] = useState<CommandeFournisseur[]>([]);
  const [stats, setStats] = useState<{ nb_fournisseurs: number; nb_commandes: number; ca_achats_mois: number; commandes_en_attente: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'commandes' | 'fournisseurs'>('commandes');
  const [showCommandeModal, setShowCommandeModal] = useState(false);
  const [showFournisseurModal, setShowFournisseurModal] = useState(false);
  const [editFournisseur, setEditFournisseur] = useState<Fournisseur | null>(null);
  const [receptionModal, setReceptionModal] = useState<CommandeFournisseur | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filtreStatut, setFiltreStatut] = useState<string>('tous');

  const charger = useCallback(async () => {
    if (!organisation?.id) return;
    setLoading(true);
    try {
      const [four, cmds, st] = await Promise.all([
        getFournisseurs(organisation.id),
        getCommandesFournisseurs(organisation.id),
        getStatsFournisseurs(organisation.id),
      ]);
      setFournisseurs(four);
      setCommandes(cmds);
      setStats(st);
    } finally {
      setLoading(false);
    }
  }, [organisation?.id]);

  useEffect(() => { charger(); }, [charger]);

  const commandesFiltrees = filtreStatut === 'tous'
    ? commandes
    : commandes.filter(c => c.statut === filtreStatut);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-indigo-600" />
            Commandes fournisseurs
          </h1>
          <p className="text-gray-500 mt-1">Gérez vos achats et réceptions de marchandises.</p>
        </div>
        <button onClick={() => setShowCommandeModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus className="w-4 h-4" />Nouvelle commande
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Fournisseurs', value: stats.nb_fournisseurs, icon: <Building className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50' },
            { label: 'Commandes', value: stats.nb_commandes, icon: <Package className="w-5 h-5 text-indigo-600" />, bg: 'bg-indigo-50' },
            { label: 'Achats ce mois', value: formatCurrency(stats.ca_achats_mois, 'CHF'), icon: <ArrowDown className="w-5 h-5 text-orange-600" />, bg: 'bg-orange-50' },
            { label: 'En attente', value: stats.commandes_en_attente, icon: <Truck className="w-5 h-5 text-yellow-600" />, bg: 'bg-yellow-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-white/50`}>
              <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs text-gray-500">{s.label}</span></div>
              <p className="text-xl font-bold text-gray-800">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['commandes', 'fournisseurs'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab === 'commandes' ? `Commandes (${commandes.length})` : `Fournisseurs (${fournisseurs.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
      ) : activeTab === 'commandes' ? (
        <div className="space-y-4">
          {/* Filtre statut */}
          <div className="flex gap-2 flex-wrap">
            {['tous', ...Object.keys(STATUTS_COMMANDE)].map(s => (
              <button key={s} onClick={() => setFiltreStatut(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  filtreStatut === s
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}>
                {s === 'tous' ? 'Toutes' : STATUTS_COMMANDE[s as CommandeFournisseur['statut']].label}
                {s === 'tous' ? ` (${commandes.length})` : ` (${commandes.filter(c => c.statut === s).length})`}
              </button>
            ))}
          </div>

          {commandesFiltrees.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 text-center py-16 shadow-sm">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium">Aucune commande</p>
              <p className="text-sm text-gray-400 mt-1">Créez votre première commande fournisseur.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-50">
              {commandesFiltrees.map(cmd => (
                <CommandeRow
                  key={cmd.id}
                  cmd={cmd}
                  expanded={expandedId === cmd.id}
                  onToggle={() => setExpandedId(expandedId === cmd.id ? null : cmd.id)}
                  onEnvoyer={async () => { await envoyerCommande(cmd.id); charger(); }}
                  onReception={() => setReceptionModal(cmd)}
                  onAnnuler={async () => { if (window.confirm('Annuler cette commande ?')) { await annulerCommande(cmd.id); charger(); } }}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ONGLET FOURNISSEURS */
        <div className="space-y-3">
          <button onClick={() => { setEditFournisseur(null); setShowFournisseurModal(true); }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100">
            <Plus className="w-4 h-4" />Ajouter un fournisseur
          </button>

          {fournisseurs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 text-center py-16 shadow-sm">
              <Building className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Aucun fournisseur</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-50">
              {fournisseurs.map(f => (
                <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Building className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{f.nom}</p>
                    <p className="text-xs text-gray-400">{[f.ville, f.pays].filter(Boolean).join(', ')} {f.email ? `• ${f.email}` : ''}</p>
                  </div>
                  {f.numero && <span className="text-xs text-gray-400">{f.numero}</span>}
                  <div className="flex gap-1">
                    <button onClick={() => { setEditFournisseur(f); setShowFournisseurModal(true); }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={async () => { if (window.confirm(`Supprimer ${f.nom} ?`)) { await supprimerFournisseur(f.id); charger(); } }}
                      className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCommandeModal && (
        <CommandeModal
          fournisseurs={fournisseurs}
          organisationId={organisation?.id || ''}
          onClose={() => setShowCommandeModal(false)}
          onSave={async () => { setShowCommandeModal(false); await charger(); }}
        />
      )}

      {showFournisseurModal && (
        <FournisseurModal
          fournisseur={editFournisseur}
          organisationId={organisation?.id || ''}
          onClose={() => setShowFournisseurModal(false)}
          onSave={async () => { setShowFournisseurModal(false); await charger(); }}
        />
      )}

      {receptionModal && (
        <ReceptionModal
          commande={receptionModal}
          onClose={() => setReceptionModal(null)}
          onSave={async (recs) => {
            await recevoirMarchandises(receptionModal.id, recs);
            setReceptionModal(null);
            charger();
          }}
        />
      )}
    </div>
  );
}

// ─── LIGNE COMMANDE ───────────────────────────────────────────────────────────

function CommandeRow({ cmd, expanded, onToggle, onEnvoyer, onReception, onAnnuler }: {
  cmd: CommandeFournisseur;
  expanded: boolean;
  onToggle: () => void;
  onEnvoyer: () => void;
  onReception: () => void;
  onAnnuler: () => void;
}) {
  const sc = STATUTS_COMMANDE[cmd.statut];
  const fournNom = (cmd.fournisseur as Fournisseur)?.nom || '—';

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3 cursor-pointer" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-800 text-sm">{cmd.numero}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${sc.bg} ${sc.couleur}`}>{sc.label}</span>
            <span className="text-xs text-gray-400">{fournNom}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(cmd.date_commande).toLocaleDateString('fr-CH')}
            {cmd.date_livraison_prevue && ` → Livraison : ${new Date(cmd.date_livraison_prevue).toLocaleDateString('fr-CH')}`}
          </p>
        </div>
        <span className="font-bold text-gray-800">{formatCurrency(cmd.total_ttc, cmd.devise)}</span>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </div>

      {expanded && (
        <div className="mt-3 pl-2 space-y-3">
          {/* Lignes */}
          {(cmd.lignes || []).length > 0 && (
            <div className="text-xs space-y-1 bg-gray-50 rounded-xl p-3">
              {(cmd.lignes || []).map((l, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-gray-600">{l.quantite_commandee}× {l.description}</span>
                  <span className="text-gray-500">
                    {formatCurrency(l.total_ht, 'CHF')} HT
                    {l.quantite_recue > 0 && <span className="text-green-600 ml-1">({l.quantite_recue} reçus)</span>}
                  </span>
                </div>
              ))}
              <div className="pt-1 border-t border-gray-200 flex justify-between font-semibold text-gray-700">
                <span>Total TTC</span><span>{formatCurrency(cmd.total_ttc, cmd.devise)}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {cmd.statut === 'brouillon' && (
              <button onClick={onEnvoyer} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                <Send className="w-3.5 h-3.5" />Envoyer au fournisseur
              </button>
            )}
            {['envoye', 'partiel'].includes(cmd.statut) && (
              <button onClick={onReception} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100">
                <Truck className="w-3.5 h-3.5" />Réceptionner
              </button>
            )}
            {cmd.statut === 'recu' && (
              <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                <CheckCircle className="w-3.5 h-3.5" />Commande complètement reçue
              </div>
            )}
            {['brouillon', 'envoye'].includes(cmd.statut) && (
              <button onClick={onAnnuler} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100">
                <X className="w-3.5 h-3.5" />Annuler
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MODAL CRÉATION COMMANDE ──────────────────────────────────────────────────

function CommandeModal({ fournisseurs, organisationId, onClose, onSave }: {
  fournisseurs: Fournisseur[];
  organisationId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [fournisseurId, setFournisseurId] = useState(fournisseurs[0]?.id || '');
  const [lignes, setLignes] = useState<Partial<LigneCommande>[]>([
    { description: '', quantite_commandee: 1, prix_unitaire: 0, taux_tva: 7.7, remise_pct: 0, unite: 'pcs', total_ht: 0, ordre: 0 },
  ]);
  const [dateLivraison, setDateLivraison] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const updateLigne = (idx: number, field: string, value: string | number) => {
    setLignes(prev => prev.map((l, i) => {
      if (i !== idx) return l;
      const updated = { ...l, [field]: value };
      const qte = Number(field === 'quantite_commandee' ? value : l.quantite_commandee) || 0;
      const prix = Number(field === 'prix_unitaire' ? value : l.prix_unitaire) || 0;
      const remise = Number(field === 'remise_pct' ? value : l.remise_pct) || 0;
      updated.total_ht = qte * prix * (1 - remise / 100);
      return updated;
    }));
  };

  const { total_ht, total_tva, total_ttc } = calculerTotaux(lignes);

  const handleSave = async () => {
    if (!fournisseurId) return;
    setSaving(true);
    try {
      await creerCommande(organisationId, {
        fournisseur_id: fournisseurId,
        lignes: lignes.filter(l => l.description?.trim()) as LigneCommande[],
        date_livraison_prevue: dateLivraison || undefined,
        notes: notes.trim() || undefined,
      });
      onSave();
    } finally {
      setSaving(false);
    }
  };

  if (fournisseurs.length === 0) return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500/75" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
          <AlertCircle className="w-10 h-10 text-orange-400 mx-auto mb-3" />
          <p className="font-semibold text-gray-900">Aucun fournisseur</p>
          <p className="text-sm text-gray-500 mt-1">Ajoutez d'abord un fournisseur dans l'onglet Fournisseurs.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">Fermer</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500/75" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Nouvelle commande fournisseur</h2>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">✕</button>
          </div>

          <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur *</label>
                <select value={fournisseurId} onChange={e => setFournisseurId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date livraison prévue</label>
                <input type="date" value={dateLivraison} onChange={e => setDateLivraison(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            {/* Lignes */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Articles commandés</p>
              <div className="space-y-2">
                {lignes.map((l, i) => (
                  <div key={i} className="grid grid-cols-12 gap-1.5 items-end">
                    <div className="col-span-4">
                      {i === 0 && <label className="block text-xs text-gray-400 mb-0.5">Description</label>}
                      <input type="text" value={l.description || ''} onChange={e => updateLigne(i, 'description', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Article..." />
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <label className="block text-xs text-gray-400 mb-0.5">Qté</label>}
                      <input type="number" min={0} step={0.001} value={l.quantite_commandee || ''} onChange={e => updateLigne(i, 'quantite_commandee', parseFloat(e.target.value))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <label className="block text-xs text-gray-400 mb-0.5">Prix unit.</label>}
                      <input type="number" min={0} step={0.01} value={l.prix_unitaire || ''} onChange={e => updateLigne(i, 'prix_unitaire', parseFloat(e.target.value))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <label className="block text-xs text-gray-400 mb-0.5">TVA %</label>}
                      <select value={l.taux_tva || 7.7} onChange={e => updateLigne(i, 'taux_tva', parseFloat(e.target.value))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
                        <option value={7.7}>7.7%</option><option value={2.6}>2.6%</option><option value={3.8}>3.8%</option><option value={0}>0%</option>
                      </select>
                    </div>
                    <div className="col-span-1">
                      {i === 0 && <label className="block text-xs text-gray-400 mb-0.5">HT</label>}
                      <p className="text-xs text-gray-600 py-1.5 text-right font-medium">{formatCurrency(l.total_ht || 0, 'CHF')}</p>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button onClick={() => setLignes(prev => prev.filter((_, j) => j !== i))}
                        className="p-1 text-red-400 hover:text-red-600 rounded">✕</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => setLignes(prev => [...prev, { description: '', quantite_commandee: 1, prix_unitaire: 0, taux_tva: 7.7, remise_pct: 0, unite: 'pcs', total_ht: 0, ordre: prev.length }])}
                  className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" />Ajouter une ligne
                </button>
              </div>

              {/* Totaux */}
              <div className="mt-3 bg-gray-50 rounded-xl p-3 text-xs text-right space-y-0.5">
                <div className="flex justify-between text-gray-500"><span>HT</span><span>{formatCurrency(total_ht, 'CHF')}</span></div>
                <div className="flex justify-between text-gray-500"><span>TVA</span><span>{formatCurrency(total_tva, 'CHF')}</span></div>
                <div className="flex justify-between font-bold text-gray-800 text-sm pt-1 border-t border-gray-200"><span>TTC</span><span>{formatCurrency(total_ttc, 'CHF')}</span></div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes internes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
            <button onClick={handleSave} disabled={saving || !fournisseurId}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
              Créer la commande
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL RÉCEPTION ──────────────────────────────────────────────────────────

function ReceptionModal({ commande, onClose, onSave }: {
  commande: CommandeFournisseur;
  onClose: () => void;
  onSave: (recs: { ligne_id: string; quantite: number }[]) => void;
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries((commande.lignes || []).map(l => [l.id!, 0]))
  );

  const handleSave = () => {
    const recs = Object.entries(quantities)
      .filter(([, q]) => q > 0)
      .map(([id, q]) => ({ ligne_id: id, quantite: q }));
    onSave(recs);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500/75" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-green-600" />Réception marchandises
            </h2>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">✕</button>
          </div>
          <div className="px-6 py-5 space-y-3">
            <p className="text-sm text-gray-500">Commande {commande.numero}</p>
            {(commande.lignes || []).map(l => {
              const restant = l.quantite_commandee - l.quantite_recue;
              return (
                <div key={l.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{l.description}</p>
                    <p className="text-xs text-gray-400">Commandé : {l.quantite_commandee} — Déjà reçu : {l.quantite_recue} — Restant : {restant}</p>
                  </div>
                  <input type="number" min={0} max={restant} step={0.001}
                    value={quantities[l.id!] || 0}
                    onChange={e => setQuantities(prev => ({ ...prev, [l.id!]: Math.min(parseFloat(e.target.value) || 0, restant) }))}
                    className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              );
            })}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
            <button onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">
              <CheckCircle className="w-4 h-4" />Confirmer la réception
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL FOURNISSEUR ────────────────────────────────────────────────────────

function FournisseurModal({ fournisseur, organisationId, onClose, onSave }: {
  fournisseur: Fournisseur | null;
  organisationId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [nom, setNom] = useState(fournisseur?.nom || '');
  const [contact, setContact] = useState(fournisseur?.contact || '');
  const [email, setEmail] = useState(fournisseur?.email || '');
  const [telephone, setTelephone] = useState(fournisseur?.telephone || '');
  const [adresse, setAdresse] = useState(fournisseur?.adresse || '');
  const [ville, setVille] = useState(fournisseur?.ville || '');
  const [codePostal, setCodePostal] = useState(fournisseur?.code_postal || '');
  const [iban, setIban] = useState(fournisseur?.iban || '');
  const [notes, setNotes] = useState(fournisseur?.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!nom.trim()) return;
    setSaving(true);
    try {
      const payload = { nom: nom.trim(), contact: contact.trim() || undefined, email: email.trim() || undefined, telephone: telephone.trim() || undefined, adresse: adresse.trim() || undefined, ville: ville.trim() || undefined, code_postal: codePostal.trim() || undefined, iban: iban.trim() || undefined, notes: notes.trim() || undefined, pays: 'Suisse', delai_paiement: 30, actif: true };
      if (fournisseur) await mettreAJourFournisseur(fournisseur.id, payload);
      else await creerFournisseur(organisationId, payload);
      onSave();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500/75" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{fournisseur ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</h2>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">✕</button>
          </div>
          <div className="px-6 py-5 space-y-3 max-h-[65vh] overflow-y-auto">
            {[
              { label: 'Nom *', val: nom, set: setNom, type: 'text', ph: 'Dupont SA' },
              { label: 'Contact', val: contact, set: setContact, type: 'text', ph: 'Jean Dupont' },
              { label: 'Email', val: email, set: setEmail, type: 'email', ph: 'achats@dupont.ch' },
              { label: 'Téléphone', val: telephone, set: setTelephone, type: 'tel', ph: '+41 22 000 00 00' },
              { label: 'Adresse', val: adresse, set: setAdresse, type: 'text', ph: 'Rue de la Paix 1' },
              { label: 'Code postal', val: codePostal, set: setCodePostal, type: 'text', ph: '1200' },
              { label: 'Ville', val: ville, set: setVille, type: 'text', ph: 'Genève' },
              { label: 'IBAN', val: iban, set: setIban, type: 'text', ph: 'CH93 0076 2011 6238 5295 7' },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
            <button onClick={handleSave} disabled={saving || !nom.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building className="w-4 h-4" />}
              {fournisseur ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
