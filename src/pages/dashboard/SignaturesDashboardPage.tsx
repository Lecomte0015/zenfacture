/**
 * SignaturesDashboardPage — Gestion des demandes de signature (Phase 8.4)
 * URL : /dashboard/signatures
 */

import { useState, useEffect, useCallback } from 'react';
import { useOrganisation } from '@/context/OrganisationContext';
import {
  PenSquare, Plus, Copy, CheckCircle, Loader2,
  Clock, XCircle, Eye, FileText, AlertCircle,
} from 'lucide-react';
import {
  SignatureDemande, DocumentType, STATUTS_SIGNATURE,
  getDemandesSignature, creerDemandeSignature, annulerDemande,
  buildSignatureUrl,
} from '@/services/signatureService';

export default function SignaturesDashboardPage() {
  const { organisation } = useOrganisation();
  const [demandes, setDemandes] = useState<SignatureDemande[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const charger = useCallback(async () => {
    if (!organisation?.id) return;
    setLoading(true);
    try {
      setDemandes(await getDemandesSignature(organisation.id));
    } finally {
      setLoading(false);
    }
  }, [organisation?.id]);

  useEffect(() => { charger(); }, [charger]);

  const handleCopier = async (d: SignatureDemande) => {
    await navigator.clipboard.writeText(buildSignatureUrl(d.token));
    setCopiedId(d.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAnnuler = async (d: SignatureDemande) => {
    if (!window.confirm(`Annuler la demande de signature pour ${d.signataire_email} ?`)) return;
    await annulerDemande(d.id);
    charger();
  };

  const actives = demandes.filter(d => ['en_attente', 'vu'].includes(d.statut));
  const terminees = demandes.filter(d => ['signe', 'refuse', 'expire'].includes(d.statut));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PenSquare className="w-6 h-6 text-blue-600" />
            Signatures électroniques
          </h1>
          <p className="text-gray-500 mt-1">
            Envoyez des documents à signer en ligne. Conforme au droit suisse (CO art. 14).
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" />Nouvelle demande
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'En attente', count: demandes.filter(d => d.statut === 'en_attente').length, color: 'bg-yellow-50', emoji: '⏳' },
          { label: 'Vus', count: demandes.filter(d => d.statut === 'vu').length, color: 'bg-blue-50', emoji: '👁' },
          { label: 'Signés', count: demandes.filter(d => d.statut === 'signe').length, color: 'bg-green-50', emoji: '✅' },
          { label: 'Refusés', count: demandes.filter(d => d.statut === 'refuse').length, color: 'bg-red-50', emoji: '❌' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl p-3 border border-white/50`}>
            <p className="text-xs text-gray-500">{s.emoji} {s.label}</p>
            <p className="text-2xl font-bold text-gray-800">{s.count}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
      ) : (
        <>
          {/* En cours */}
          {actives.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />En cours ({actives.length})
              </h2>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-50">
                {actives.map(d => (
                  <DemandeRow key={d.id} demande={d} copied={copiedId === d.id}
                    onCopier={() => handleCopier(d)} onAnnuler={() => handleAnnuler(d)} />
                ))}
              </div>
            </div>
          )}

          {/* Terminées */}
          {terminees.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 mb-3">Terminées ({terminees.length})</h2>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-50">
                {terminees.map(d => (
                  <DemandeRow key={d.id} demande={d} copied={copiedId === d.id}
                    onCopier={() => handleCopier(d)} onAnnuler={undefined} />
                ))}
              </div>
            </div>
          )}

          {demandes.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 text-center py-16 shadow-sm">
              <PenSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium">Aucune demande de signature</p>
              <p className="text-sm text-gray-400 mt-1">Envoyez votre premier document à signer.</p>
            </div>
          )}
        </>
      )}

      {showModal && (
        <NouvelleDemandeModal
          organisationId={organisation?.id || ''}
          onClose={() => setShowModal(false)}
          onSave={async () => { setShowModal(false); await charger(); }}
        />
      )}
    </div>
  );
}

// ─── ROW ──────────────────────────────────────────────────────────────────────

function DemandeRow({ demande, copied, onCopier, onAnnuler }: {
  demande: SignatureDemande;
  copied: boolean;
  onCopier: () => void;
  onAnnuler?: () => void;
}) {
  const sc = STATUTS_SIGNATURE[demande.statut];
  const typeLabels: Record<DocumentType, string> = { devis: 'Devis', facture: 'Facture', contrat: 'Contrat' };

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg">{sc.emoji}</span>
          <span className="font-medium text-gray-800 text-sm truncate">{demande.document_titre}</span>
          <span className="text-xs text-gray-400">{typeLabels[demande.document_type]}</span>
          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${sc.bg} ${sc.couleur}`}>{sc.label}</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          Pour : {demande.signataire_nom} &lt;{demande.signataire_email}&gt;
          {demande.signe_at && ` · Signé le ${new Date(demande.signe_at).toLocaleDateString('fr-CH')}`}
          {demande.statut === 'en_attente' && ` · Expire le ${new Date(demande.expires_at).toLocaleDateString('fr-CH')}`}
        </p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {['en_attente', 'vu'].includes(demande.statut) && (
          <button onClick={onCopier}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
            {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copié !' : 'Lien'}
          </button>
        )}
        {onAnnuler && ['en_attente', 'vu'].includes(demande.statut) && (
          <button onClick={onAnnuler}
            className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 border border-red-100">
            <XCircle className="w-4 h-4" />
          </button>
        )}
        {demande.statut === 'signe' && demande.signature_data && (
          <div className="w-8 h-8 rounded border border-green-200 overflow-hidden">
            <img src={demande.signature_data} alt="sig" className="w-full h-full object-contain" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────

function NouvelleDemandeModal({ organisationId, onClose, onSave }: {
  organisationId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [docType, setDocType] = useState<DocumentType>('devis');
  const [docTitre, setDocTitre] = useState('');
  const [sigNom, setSigNom] = useState('');
  const [sigEmail, setSigEmail] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [demande, setDemande] = useState<SignatureDemande | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!docTitre.trim() || !sigNom.trim() || !sigEmail.trim()) return;
    setSaving(true);
    try {
      const d = await creerDemandeSignature(organisationId, {
        document_type: docType,
        document_id: crypto.randomUUID(), // En prod : passer l'ID réel
        document_titre: docTitre.trim(),
        signataire_nom: sigNom.trim(),
        signataire_email: sigEmail.trim(),
        message_personnalise: message.trim() || undefined,
      });
      setDemande(d);
    } finally {
      setSaving(false);
    }
  };

  const handleCopier = async () => {
    if (!demande) return;
    await navigator.clipboard.writeText(buildSignatureUrl(demande.token));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500/75" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Nouvelle demande de signature</h2>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">✕</button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {!demande ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de document</label>
                  <div className="flex gap-2">
                    {(['devis', 'facture', 'contrat'] as DocumentType[]).map(t => (
                      <button key={t} onClick={() => setDocType(t)}
                        className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${docType === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                        {t === 'devis' ? '📄 Devis' : t === 'facture' ? '🧾 Facture' : '📝 Contrat'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre du document *</label>
                  <input type="text" value={docTitre} onChange={e => setDocTitre(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ex: Devis DEV-2026-0042 — Refonte site web" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du signataire *</label>
                    <input type="text" value={sigNom} onChange={e => setSigNom(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Marie Dupont" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input type="email" value={sigEmail} onChange={e => setSigEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="marie@exemple.ch" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message personnalisé</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Merci de bien vouloir signer ce document..." />
                </div>
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Vous recevrez un lien unique à envoyer au signataire. Il expirera dans 30 jours.
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <p className="font-semibold text-gray-900">Demande créée !</p>
                <p className="text-sm text-gray-500">Envoyez ce lien à <strong>{sigEmail}</strong> :</p>
                <div className="bg-gray-50 rounded-xl p-3 text-left">
                  <p className="text-sm text-blue-600 break-all font-mono">{buildSignatureUrl(demande.token)}</p>
                </div>
                <button onClick={handleCopier}
                  className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copié !' : 'Copier le lien'}
                </button>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            {!demande ? (
              <>
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
                <button onClick={handleCreate} disabled={saving || !docTitre.trim() || !sigNom.trim() || !sigEmail.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenSquare className="w-4 h-4" />}
                  Créer la demande
                </button>
              </>
            ) : (
              <button onClick={onSave} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">Terminer</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
