/**
 * BoutiquePage — Connecteur Boutiques en ligne (Phase 7.5)
 * Synchronisation Shopify / WooCommerce / PrestaShop / Magento / Custom
 */

import { useState, useEffect, useCallback } from 'react';
import { useOrganisation } from '@/context/OrganisationContext';
import {
  Store, Plus, RefreshCw, Trash2, CheckCircle, XCircle,
  Loader2, ShoppingBag, Settings, ArrowRight, Wifi, WifiOff,
  Package, FileText, TrendingUp, ChevronDown, ChevronUp, Eye, EyeOff,
  Clock, AlertCircle,
} from 'lucide-react';
import {
  BoutiqueConnexion, PlateformeBoutique, BoutiqueCommande,
  PLATEFORMES_CONFIG, getBoutiqueConnexions, creerConnexion,
  mettreAJourConnexion, supprimerConnexion, getBoutiqueCommandes,
  testerConnexion, synchroniserCommandes, getStatsBoutiques,
  StatsBoutique, ResultatSynchro,
} from '@/services/boutiqueService';
import { formatCurrency } from '@/utils/format';

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export default function BoutiquePage() {
  const { organisation } = useOrganisation();
  const [connexions, setConnexions] = useState<BoutiqueConnexion[]>([]);
  const [commandes, setCommandes] = useState<BoutiqueCommande[]>([]);
  const [stats, setStats] = useState<StatsBoutique | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'connexions' | 'commandes'>('connexions');
  const [showModal, setShowModal] = useState(false);
  const [editingConnexion, setEditingConnexion] = useState<BoutiqueConnexion | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, ResultatSynchro>>({});
  const [syncing, setSyncing] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  const charger = useCallback(async () => {
    if (!organisation?.id) return;
    setLoading(true);
    try {
      const [cx, cmd, st] = await Promise.all([
        getBoutiqueConnexions(organisation.id),
        getBoutiqueCommandes(organisation.id),
        getStatsBoutiques(organisation.id),
      ]);
      setConnexions(cx);
      setCommandes(cmd);
      setStats(st);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [organisation?.id]);

  useEffect(() => { charger(); }, [charger]);

  const handleTester = async (connexion: BoutiqueConnexion) => {
    setTesting(connexion.id);
    const result = await testerConnexion(connexion);
    if (result.succes) {
      await mettreAJourConnexion(connexion.id, { statut: 'actif' });
      await charger();
    }
    setTesting(null);
    alert(result.succes ? `✅ ${result.message}` : `❌ ${result.message}`);
  };

  const handleSynchroniser = async (connexion: BoutiqueConnexion) => {
    if (!organisation?.id) return;
    setSyncing(connexion.id);
    try {
      const result = await synchroniserCommandes(organisation.id, connexion);
      setSyncResults(prev => ({ ...prev, [connexion.id]: result }));
      await charger();
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(null);
    }
  };

  const handleSupprimer = async (connexion: BoutiqueConnexion) => {
    if (!window.confirm(`Supprimer la connexion "${connexion.nom}" ? Les commandes synchronisées seront conservées.`)) return;
    await supprimerConnexion(connexion.id);
    charger();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="w-6 h-6 text-blue-600" />
            Boutiques en ligne
          </h1>
          <p className="text-gray-500 mt-1">
            Connectez vos boutiques e-commerce et synchronisez les commandes en factures automatiquement.
          </p>
        </div>
        <button
          onClick={() => { setEditingConnexion(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Connecter une boutique
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Wifi className="w-5 h-5 text-green-600" />}
            label="Boutiques actives"
            value={stats.connexions_actives}
            bg="bg-green-50"
          />
          <StatCard
            icon={<ShoppingBag className="w-5 h-5 text-blue-600" />}
            label="Commandes sync"
            value={stats.commandes_synchronisees}
            bg="bg-blue-50"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
            label="CA synchronisé"
            value={formatCurrency(stats.ca_synchronise, 'CHF')}
            bg="bg-purple-50"
          />
          <StatCard
            icon={<FileText className="w-5 h-5 text-orange-600" />}
            label="Factures générées"
            value={stats.factures_generees}
            bg="bg-orange-50"
          />
        </div>
      )}

      {/* Plateformes supportées */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-800 mb-3">Plateformes supportées</p>
        <div className="flex flex-wrap gap-3">
          {(Object.entries(PLATEFORMES_CONFIG) as [PlateformeBoutique, typeof PLATEFORMES_CONFIG[PlateformeBoutique]][]).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5 bg-white rounded-lg px-3 py-1.5 border border-blue-100 shadow-sm text-sm font-medium text-gray-700">
              <span>{cfg.logo}</span>
              <span>{cfg.nom}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['connexions', 'commandes'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'connexions' ? `Connexions (${connexions.length})` : `Commandes (${commandes.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : activeTab === 'connexions' ? (
        <ConnexionsList
          connexions={connexions}
          syncResults={syncResults}
          syncing={syncing}
          testing={testing}
          onEdit={cx => { setEditingConnexion(cx); setShowModal(true); }}
          onDelete={handleSupprimer}
          onTest={handleTester}
          onSync={handleSynchroniser}
          onNew={() => { setEditingConnexion(null); setShowModal(true); }}
        />
      ) : (
        <CommandesList commandes={commandes} connexions={connexions} />
      )}

      {/* Modal création/édition */}
      {showModal && (
        <ConnexionModal
          connexion={editingConnexion}
          organisationId={organisation?.id || ''}
          onClose={() => setShowModal(false)}
          onSave={async () => { setShowModal(false); await charger(); }}
        />
      )}
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, bg }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  bg: string;
}) {
  return (
    <div className={`${bg} rounded-xl p-4 border border-white/50`}>
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-gray-500">{label}</span></div>
      <p className="text-xl font-bold text-gray-800">{value}</p>
    </div>
  );
}

// ─── LISTE CONNEXIONS ─────────────────────────────────────────────────────────

function ConnexionsList({
  connexions, syncResults, syncing, testing, onEdit, onDelete, onTest, onSync, onNew,
}: {
  connexions: BoutiqueConnexion[];
  syncResults: Record<string, ResultatSynchro>;
  syncing: string | null;
  testing: string | null;
  onEdit: (cx: BoutiqueConnexion) => void;
  onDelete: (cx: BoutiqueConnexion) => void;
  onTest: (cx: BoutiqueConnexion) => void;
  onSync: (cx: BoutiqueConnexion) => void;
  onNew: () => void;
}) {
  if (connexions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-16">
        <Store className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500 font-medium">Aucune boutique connectée</p>
        <p className="text-sm text-gray-400 mt-1 mb-4">
          Connectez Shopify, WooCommerce ou une autre plateforme pour synchroniser vos commandes.
        </p>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Connecter ma première boutique
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {connexions.map(cx => {
        const cfg = PLATEFORMES_CONFIG[cx.plateforme];
        const result = syncResults[cx.id];
        const isSyncing = syncing === cx.id;
        const isTesting = testing === cx.id;

        return (
          <div key={cx.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                {/* Info boutique */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: cfg.couleur + '20' }}
                  >
                    {cfg.logo}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{cx.nom}</h3>
                      <StatutBadge statut={cx.statut} />
                    </div>
                    <p className="text-sm text-gray-500 truncate">{cx.url_boutique}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {cfg.nom}
                      {cx.derniere_synchro && (
                        <span className="ml-2 flex items-center gap-1 inline-flex">
                          <Clock className="w-3 h-3" />
                          Synchro {new Date(cx.derniere_synchro).toLocaleString('fr-CH', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Options sync */}
                <div className="flex items-center gap-1.5 flex-shrink-0 text-xs text-gray-500">
                  {cx.auto_facture && (
                    <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-200">
                      Auto-facture
                    </span>
                  )}
                  {cx.auto_stock && (
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                      Stock sync
                    </span>
                  )}
                </div>
              </div>

              {/* Résultat dernière synchro */}
              {result && (
                <div className={`mt-3 p-3 rounded-lg text-xs ${
                  result.erreurs.length === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <p className={`font-medium ${result.erreurs.length === 0 ? 'text-green-800' : 'text-yellow-800'}`}>
                    Synchronisation terminée : {result.commandes_nouvelles} nouvelle(s) commande(s) sur {result.commandes_trouvees} trouvée(s)
                    {result.factures_creees > 0 && ` — ${result.factures_creees} facture(s) créée(s)`}
                  </p>
                  {result.erreurs.map((e, i) => (
                    <p key={i} className="text-yellow-700 mt-0.5">{e}</p>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => onTest(cx)}
                  disabled={isTesting || isSyncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
                  Tester
                </button>
                <button
                  onClick={() => onSync(cx)}
                  disabled={isSyncing || isTesting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                >
                  {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {isSyncing ? 'Synchronisation…' : 'Synchroniser'}
                </button>
                <button
                  onClick={() => onEdit(cx)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Configurer
                </button>
                <button
                  onClick={() => onDelete(cx)}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatutBadge({ statut }: { statut: BoutiqueConnexion['statut'] }) {
  if (statut === 'actif') return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
      <CheckCircle className="w-3 h-3" />Actif
    </span>
  );
  if (statut === 'erreur') return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
      <XCircle className="w-3 h-3" />Erreur
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
      <WifiOff className="w-3 h-3" />Inactif
    </span>
  );
}

// ─── LISTE COMMANDES ──────────────────────────────────────────────────────────

function CommandesList({ commandes, connexions }: {
  commandes: BoutiqueCommande[];
  connexions: BoutiqueConnexion[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getConnexionNom = (id: string) => connexions.find(c => c.id === id)?.nom || id;
  const getConnexionPlateforme = (id: string) => connexions.find(c => c.id === id)?.plateforme;

  if (commandes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-16">
        <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500 font-medium">Aucune commande synchronisée</p>
        <p className="text-sm text-gray-400 mt-1">
          Connectez une boutique et lancez une synchronisation.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-50">
      {commandes.map(cmd => {
        const isExpanded = expandedId === cmd.id;
        const plat = getConnexionPlateforme(cmd.connexion_id);
        const cfg = plat ? PLATEFORMES_CONFIG[plat] : null;

        return (
          <div key={cmd.id} className="px-4 py-3">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : cmd.id)}
            >
              {cfg && <span className="text-lg">{cfg.logo}</span>}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800 text-sm">{cmd.numero_commande}</span>
                  <span className="text-xs text-gray-400">{getConnexionNom(cmd.connexion_id)}</span>
                  <StatutCommandeBadge statut={cmd.statut} />
                  {cmd.invoice_id && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">
                      <FileText className="w-3 h-3" />Facture
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{cmd.client_nom} {cmd.client_email ? `— ${cmd.client_email}` : ''}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-gray-800">{formatCurrency(cmd.total_ttc, cmd.devise)}</p>
                <p className="text-xs text-gray-400">{cmd.commande_at ? new Date(cmd.commande_at).toLocaleDateString('fr-CH') : ''}</p>
              </div>
              {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
            </div>

            {isExpanded && (
              <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-2">
                {/* Lignes de commande */}
                <div className="text-xs space-y-1">
                  {cmd.lignes.map((l, i) => (
                    <div key={i} className="flex justify-between text-gray-600">
                      <span>{l.quantite}× {l.nom}</span>
                      <span>{formatCurrency(l.total_ht, cmd.devise)} HT</span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 pt-1 border-t border-gray-100">
                  <div className="flex justify-between"><span>HT</span><span>{formatCurrency(cmd.total_ht, cmd.devise)}</span></div>
                  <div className="flex justify-between"><span>TVA</span><span>{formatCurrency(cmd.total_tva, cmd.devise)}</span></div>
                  <div className="flex justify-between font-semibold text-gray-700 mt-1"><span>TTC</span><span>{formatCurrency(cmd.total_ttc, cmd.devise)}</span></div>
                </div>
                {cmd.client_adresse && (
                  <p className="text-xs text-gray-400">
                    📍 {[cmd.client_adresse.adresse1, cmd.client_adresse.code_postal, cmd.client_adresse.ville, cmd.client_adresse.pays].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatutCommandeBadge({ statut }: { statut: string }) {
  const colors: Record<string, string> = {
    paid: 'bg-green-100 text-green-700',
    fulfilled: 'bg-blue-100 text-blue-700',
    pending: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
    refunded: 'bg-gray-100 text-gray-600',
  };
  const labels: Record<string, string> = {
    paid: 'Payée', fulfilled: 'Expédiée', pending: 'En attente', cancelled: 'Annulée', refunded: 'Remboursée',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${colors[statut] || 'bg-gray-100 text-gray-600'}`}>
      {labels[statut] || statut}
    </span>
  );
}

// ─── MODAL CONNEXION ──────────────────────────────────────────────────────────

function ConnexionModal({
  connexion, organisationId, onClose, onSave,
}: {
  connexion: BoutiqueConnexion | null;
  organisationId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [plateforme, setPlateforme] = useState<PlateformeBoutique>(connexion?.plateforme || 'shopify');
  const [nom, setNom] = useState(connexion?.nom || '');
  const [urlBoutique, setUrlBoutique] = useState(connexion?.url_boutique || '');
  const [apiKey, setApiKey] = useState(connexion?.api_key || '');
  const [apiSecret, setApiSecret] = useState(connexion?.api_secret || '');
  const [accessToken, setAccessToken] = useState(connexion?.access_token || '');
  const [webhookSecret, setWebhookSecret] = useState(connexion?.webhook_secret || '');
  const [autoFacture, setAutoFacture] = useState(connexion?.auto_facture ?? true);
  const [autoStock, setAutoStock] = useState(connexion?.auto_stock ?? false);
  const [statutCommande, setStatutCommande] = useState<'any' | 'pending' | 'paid' | 'fulfilled'>(connexion?.statut_commande || 'paid');
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  const cfg = PLATEFORMES_CONFIG[plateforme];

  const handleSave = async () => {
    if (!nom.trim() || !urlBoutique.trim()) return;
    setSaving(true);
    try {
      const payload = {
        nom: nom.trim(),
        plateforme,
        url_boutique: urlBoutique.trim(),
        api_key: apiKey.trim() || undefined,
        api_secret: apiSecret.trim() || undefined,
        access_token: accessToken.trim() || undefined,
        webhook_secret: webhookSecret.trim() || undefined,
        auto_facture: autoFacture,
        auto_stock: autoStock,
        statut_commande: statutCommande,
      };
      if (connexion) {
        await mettreAJourConnexion(connexion.id, payload);
      } else {
        await creerConnexion(organisationId, payload);
      }
      onSave();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500/75" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {connexion ? 'Modifier la connexion' : 'Connecter une boutique'}
            </h2>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              ✕
            </button>
          </div>

          <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Choix plateforme */}
            {!connexion && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plateforme</label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {(Object.entries(PLATEFORMES_CONFIG) as [PlateformeBoutique, typeof PLATEFORMES_CONFIG[PlateformeBoutique]][]).map(([key, c]) => (
                    <button
                      key={key}
                      onClick={() => { setPlateforme(key); setNom(c.nom); }}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        plateforme === key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{c.logo}</div>
                      <div className="text-xs font-medium text-gray-700 truncate">{c.nom}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fonctionnalités */}
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">Fonctionnalités {cfg.nom}</p>
              <div className="flex flex-wrap gap-1.5">
                {cfg.fonctionnalites.map(f => (
                  <span key={f} className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-600">
                    <CheckCircle className="w-3 h-3 text-green-500" />{f}
                  </span>
                ))}
              </div>
            </div>

            {/* Champ Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la connexion *</label>
              <input
                type="text"
                value={nom}
                onChange={e => setNom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ex: Ma boutique Shopify principale"
              />
            </div>

            {/* Champs dynamiques selon plateforme */}
            {cfg.champs.map(champ => {
              let val = '';
              let setter: (v: string) => void = () => {};
              if (champ.key === 'url_boutique') { val = urlBoutique; setter = setUrlBoutique; }
              else if (champ.key === 'api_key') { val = apiKey; setter = setApiKey; }
              else if (champ.key === 'api_secret') { val = apiSecret; setter = setApiSecret; }
              else if (champ.key === 'access_token') { val = accessToken; setter = setAccessToken; }
              else if (champ.key === 'webhook_secret') { val = webhookSecret; setter = setWebhookSecret; }

              const isSecret = champ.type === 'password';

              return (
                <div key={champ.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {champ.label} {champ.requis && '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={isSecret && !showSecrets ? 'password' : 'text'}
                      value={val}
                      onChange={e => setter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      placeholder={champ.aide}
                    />
                    {isSecret && (
                      <button
                        type="button"
                        onClick={() => setShowSecrets(s => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  {champ.aide && champ.type !== 'password' && (
                    <p className="text-xs text-gray-400 mt-0.5">{champ.aide}</p>
                  )}
                </div>
              );
            })}

            {/* Options de synchronisation */}
            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700">Options de synchronisation</p>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoFacture}
                  onChange={e => setAutoFacture(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">Générer factures automatiquement</p>
                  <p className="text-xs text-gray-400">Crée une facture ZenFacture pour chaque commande synchronisée</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoStock}
                  onChange={e => setAutoStock(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">Synchroniser le stock</p>
                  <p className="text-xs text-gray-400">Met à jour les quantités de stock bidirectionnellement</p>
                </div>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut des commandes à importer
                </label>
                <select
                  value={statutCommande}
                  onChange={e => setStatutCommande(e.target.value as typeof statutCommande)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="any">Toutes les commandes</option>
                  <option value="pending">En attente de paiement</option>
                  <option value="paid">Payées uniquement</option>
                  <option value="fulfilled">Expédiées uniquement</option>
                </select>
              </div>
            </div>

            {/* Avertissement sécurité */}
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>Vos clés API sont chiffrées et stockées de manière sécurisée. Ne partagez jamais ces identifiants.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
            {cfg.doc_url ? (
              <a href={cfg.doc_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                Documentation {cfg.nom} <ArrowRight className="w-3 h-3" />
              </a>
            ) : <div />}
            <div className="flex gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !nom.trim() || !urlBoutique.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                {connexion ? 'Mettre à jour' : 'Connecter'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
