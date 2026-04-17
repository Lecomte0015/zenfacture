/**
 * PortailClientAdminPage — Gestion des liens Portail Client (dashboard admin)
 * URL : /dashboard/portail-client
 */

import { useState, useEffect, useCallback } from 'react';
import { useOrganisation } from '@/context/OrganisationContext';
import {
  Link2, Plus, Trash2, Copy, CheckCircle, RefreshCw,
  Loader2, Globe, Clock, Eye, Users, XCircle,
} from 'lucide-react';
import {
  PortailLien, getLiensPortail, creerLienPortail,
  desactiverLien, regenererToken, buildPortailUrl,
} from '@/services/portailClientService';

export default function PortailClientAdminPage() {
  const { organisation } = useOrganisation();
  const [liens, setLiens] = useState<PortailLien[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const charger = useCallback(async () => {
    if (!organisation?.id) return;
    setLoading(true);
    try {
      setLiens(await getLiensPortail(organisation.id));
    } finally {
      setLoading(false);
    }
  }, [organisation?.id]);

  useEffect(() => { charger(); }, [charger]);

  const handleCopier = async (lien: PortailLien) => {
    const url = buildPortailUrl(lien.token);
    await navigator.clipboard.writeText(url);
    setCopiedId(lien.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDesactiver = async (lien: PortailLien) => {
    if (!window.confirm(`Désactiver le portail de ${lien.client_email} ?`)) return;
    await desactiverLien(lien.id);
    charger();
  };

  const handleRegenerer = async (lien: PortailLien) => {
    if (!window.confirm(`Générer un nouveau lien pour ${lien.client_email} ? L'ancien lien sera invalidé.`)) return;
    await regenererToken(lien.id);
    charger();
  };

  const liensActifs = liens.filter(l => l.actif && new Date(l.expires_at) > new Date());
  const liensExpires = liens.filter(l => !l.actif || new Date(l.expires_at) <= new Date());

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-600" />
            Portail Client
          </h1>
          <p className="text-gray-500 mt-1">
            Générez des liens sécurisés pour que vos clients consultent leurs documents sans créer de compte.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nouveau lien
        </button>
      </div>

      {/* Bannière explicative */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Globe className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Comment ça fonctionne ?</p>
            <ul className="space-y-0.5 text-blue-700">
              <li>• Créez un lien pour l'email d'un client → il peut voir toutes ses factures, devis et avoirs</li>
              <li>• Le client n'a pas besoin de créer un compte — le lien sécurisé suffit</li>
              <li>• Il peut télécharger les PDFs et payer directement depuis son espace</li>
              <li>• Valable 90 jours par défaut, renouvelable à tout moment</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<Globe className="w-4 h-4 text-blue-600" />} label="Liens actifs" value={liensActifs.length} />
        <StatCard icon={<Eye className="w-4 h-4 text-purple-600" />} label="Total accès" value={liens.reduce((s, l) => s + l.nb_acces, 0)} />
        <StatCard icon={<Users className="w-4 h-4 text-green-600" />} label="Clients avec portail" value={new Set(liens.map(l => l.client_email)).size} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
      ) : (
        <>
          {/* Liens actifs */}
          {liensActifs.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />Liens actifs ({liensActifs.length})
              </h2>
              <div className="space-y-3">
                {liensActifs.map(lien => (
                  <LienCard
                    key={lien.id}
                    lien={lien}
                    copied={copiedId === lien.id}
                    onCopier={() => handleCopier(lien)}
                    onDesactiver={() => handleDesactiver(lien)}
                    onRegenerer={() => handleRegenerer(lien)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Liens expirés/désactivés */}
          {liensExpires.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-gray-400" />Liens inactifs ({liensExpires.length})
              </h2>
              <div className="space-y-2">
                {liensExpires.map(lien => (
                  <div key={lien.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3 opacity-60">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600">{lien.client_email}</span>
                      {lien.client_nom && <span className="text-xs text-gray-400">{lien.client_nom}</span>}
                      <span className="ml-auto text-xs text-gray-400">
                        {!lien.actif ? 'Désactivé' : `Expiré le ${new Date(lien.expires_at).toLocaleDateString('fr-CH')}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {liens.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 text-center py-16 shadow-sm">
              <Globe className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium">Aucun lien portail créé</p>
              <p className="text-sm text-gray-400 mt-1">Créez votre premier lien pour un client.</p>
            </div>
          )}
        </>
      )}

      {showModal && (
        <CreerLienModal
          organisationId={organisation?.id || ''}
          onClose={() => setShowModal(false)}
          onSave={async () => { setShowModal(false); await charger(); }}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-gray-500">{label}</span></div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}

function LienCard({ lien, copied, onCopier, onDesactiver, onRegenerer }: {
  lien: PortailLien;
  copied: boolean;
  onCopier: () => void;
  onDesactiver: () => void;
  onRegenerer: () => void;
}) {
  const url = buildPortailUrl(lien.token);
  const expiry = new Date(lien.expires_at);
  const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-800">{lien.client_email}</p>
            {lien.client_nom && <span className="text-sm text-gray-500">{lien.client_nom}</span>}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{lien.nb_acces} accès</span>
            {lien.dernier_acces && (
              <span>Dernier accès : {new Date(lien.dernier_acces).toLocaleDateString('fr-CH')}</span>
            )}
            <span className={`flex items-center gap-1 ${daysLeft < 10 ? 'text-orange-500' : ''}`}>
              <Clock className="w-3 h-3" />Expire dans {daysLeft}j
            </span>
          </div>
          {/* URL tronquée */}
          <p className="text-xs text-gray-300 truncate mt-1 max-w-xs">{url}</p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={onCopier}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
            {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copié !' : 'Copier'}
          </button>
          <button onClick={onRegenerer}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 border border-gray-200" title="Régénérer le lien">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDesactiver}
            className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 border border-red-200" title="Désactiver">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {lien.message_accueil && (
        <p className="mt-2 text-xs text-gray-400 italic border-t border-gray-100 pt-2">
          Message : {lien.message_accueil}
        </p>
      )}
    </div>
  );
}

function CreerLienModal({ organisationId, onClose, onSave }: {
  organisationId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [email, setEmail] = useState('');
  const [nom, setNom] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [lienCree, setLienCree] = useState<PortailLien | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!email.trim()) return;
    setSaving(true);
    try {
      const lien = await creerLienPortail(organisationId, {
        client_email: email.trim(),
        client_nom: nom.trim() || undefined,
        message_accueil: message.trim() || undefined,
      });
      setLienCree(lien);
    } finally {
      setSaving(false);
    }
  };

  const handleCopier = async () => {
    if (!lienCree) return;
    await navigator.clipboard.writeText(buildPortailUrl(lienCree.token));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500/75" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Nouveau lien portail client</h2>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">✕</button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {!lienCree ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email du client *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="client@exemple.ch" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du client (optionnel)</label>
                  <input type="text" value={nom} onChange={e => setNom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Marie Dupont" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message d'accueil (optionnel)</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Bonjour, retrouvez ici tous vos documents..." />
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <p className="font-semibold text-gray-900">Lien créé avec succès !</p>
                <div className="bg-gray-50 rounded-xl p-3 text-left">
                  <p className="text-xs text-gray-500 mb-1">Lien à envoyer au client :</p>
                  <p className="text-sm text-blue-600 break-all font-mono">{buildPortailUrl(lienCree.token)}</p>
                </div>
                <button onClick={handleCopier}
                  className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copié !' : 'Copier le lien'}
                </button>
                <p className="text-xs text-gray-400">Valable 90 jours</p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            {!lienCree ? (
              <>
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
                <button onClick={handleCreate} disabled={saving || !email.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                  Créer le lien
                </button>
              </>
            ) : (
              <button onClick={onSave} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">
                Terminer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
