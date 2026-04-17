/**
 * PortailClientPage — Page publique (sans authentification)
 * URL : /portail/:token
 *
 * Le client voit toutes ses factures, devis et avoirs.
 * Il peut télécharger les PDFs et payer en ligne.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  FileText, Download, CreditCard, Clock, CheckCircle,
  AlertTriangle, Loader2, Eye, ChevronDown, ChevronUp,
  Building2, Mail, Phone, XCircle,
} from 'lucide-react';
import {
  getPortailParToken, PortailData, PortailDocument,
  getStatutLabel, getStatutColor,
} from '../services/portailClientService';
import { formatCurrency } from '../utils/format';

export default function PortailClientPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PortailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<'tous' | 'facture' | 'devis' | 'avoir'>('tous');

  useEffect(() => {
    if (!token) { setErreur('Lien invalide.'); setLoading(false); return; }
    getPortailParToken(token)
      .then(d => {
        if (!d) setErreur('Ce lien est invalide ou a expiré.');
        else setData(d);
      })
      .catch(() => setErreur('Impossible de charger votre espace client.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-gray-500">Chargement de votre espace client…</p>
      </div>
    </div>
  );

  if (erreur || !data) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
        <p className="text-gray-500">{erreur || 'Ce lien a expiré ou est introuvable.'}</p>
      </div>
    </div>
  );

  const { lien, organisation, documents, stats } = data;
  const couleur = organisation.couleur_principale || '#2563EB';
  const documentsFiltres = filtre === 'tous' ? documents : documents.filter(d => d.type === filtre);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header organisation */}
      <div className="text-white py-6 px-4 shadow-md" style={{ backgroundColor: couleur }}>
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          {organisation.logo_url ? (
            <img src={organisation.logo_url} alt="Logo" className="h-12 w-12 object-contain rounded-lg bg-white/20 p-1" />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">{organisation.nom}</h1>
            <p className="text-white/70 text-sm">Votre espace client</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Message d'accueil */}
        {lien.message_accueil && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-gray-700 text-sm">{lien.message_accueil}</p>
          </div>
        )}

        {/* Bonjour */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Bonjour{lien.client_nom ? ` ${lien.client_nom}` : ''} 👋
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">Retrouvez ici tous vos documents.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.total_du, 'CHF')}</p>
            <p className="text-xs text-gray-500 mt-1">Total dû</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.total_paye, 'CHF')}</p>
            <p className="text-xs text-gray-500 mt-1">Payé</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-orange-500">{stats.factures_en_attente}</p>
            <p className="text-xs text-gray-500 mt-1">En attente</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 flex-wrap">
          {(['tous', 'facture', 'devis', 'avoir'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltre(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filtre === f
                  ? 'text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
              style={filtre === f ? { backgroundColor: couleur } : {}}
            >
              {f === 'tous' ? `Tous (${documents.length})` :
               f === 'facture' ? `Factures (${documents.filter(d => d.type === 'facture').length})` :
               f === 'devis' ? `Devis (${documents.filter(d => d.type === 'devis').length})` :
               `Avoirs (${documents.filter(d => d.type === 'avoir').length})`}
            </button>
          ))}
        </div>

        {/* Liste documents */}
        {documentsFiltres.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun document à afficher.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-50">
            {documentsFiltres.map(doc => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                expanded={expandedId === doc.id}
                onToggle={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                couleur={couleur}
              />
            ))}
          </div>
        )}

        {/* Contact organisation */}
        {(organisation.email || organisation.telephone) && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-2">Nous contacter</p>
            <div className="space-y-1">
              {organisation.email && (
                <a href={`mailto:${organisation.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <Mail className="w-4 h-4" />{organisation.email}
                </a>
              )}
              {organisation.telephone && (
                <a href={`tel:${organisation.telephone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <Phone className="w-4 h-4" />{organisation.telephone}
                </a>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">
          Propulsé par <span className="font-semibold text-gray-500">ZenFacture</span> — Facturation intelligente pour la Suisse
        </p>
      </div>
    </div>
  );
}

// ─── COMPOSANT LIGNE DOCUMENT ─────────────────────────────────────────────────

function DocumentRow({ doc, expanded, onToggle, couleur }: {
  doc: PortailDocument;
  expanded: boolean;
  onToggle: () => void;
  couleur: string;
}) {
  const typeLabels: Record<string, string> = {
    facture: 'Facture', devis: 'Devis', avoir: 'Avoir',
  };
  const typeIcons: Record<string, typeof FileText> = {
    facture: FileText, devis: Eye, avoir: CreditCard,
  };
  const Icon = typeIcons[doc.type] || FileText;

  const isOverdue = doc.type === 'facture' && doc.statut === 'overdue';
  const isPaid = doc.statut === 'paid';
  const isSigned = doc.statut === 'accepte';

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3 cursor-pointer" onClick={onToggle}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: couleur + '15' }}>
          <Icon className="w-4 h-4" style={{ color: couleur }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-medium">{typeLabels[doc.type]}</span>
            <span className="font-semibold text-gray-800 text-sm">{doc.numero}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatutColor(doc.statut)}`}>
              {getStatutLabel(doc.statut, doc.type)}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(doc.date).toLocaleDateString('fr-CH')}
            {doc.date_echeance && ` — Échéance : ${new Date(doc.date_echeance).toLocaleDateString('fr-CH')}`}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-gray-800">{formatCurrency(doc.total, doc.devise)}</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </div>

      {expanded && (
        <div className="mt-3 pl-12 space-y-3">
          {/* Alertes */}
          {isOverdue && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Cette facture est en retard de paiement. Merci de régler dès que possible.
            </div>
          )}
          {isPaid && (
            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg p-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Cette facture a été payée. Merci !
            </div>
          )}

          {/* Détails */}
          <div className="text-xs text-gray-500 space-y-0.5">
            <div className="flex justify-between">
              <span>Montant TTC</span>
              <span className="font-semibold text-gray-700">{formatCurrency(doc.total, doc.devise)}</span>
            </div>
            {doc.date_echeance && (
              <div className="flex justify-between">
                <span>Échéance</span>
                <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                  {new Date(doc.date_echeance).toLocaleDateString('fr-CH')}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
            >
              <Download className="w-3.5 h-3.5" />
              Télécharger PDF
            </button>

            {doc.type === 'facture' && !isPaid && (
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg"
                style={{ backgroundColor: couleur }}
                onClick={() => alert('Paiement en ligne — Intégrez votre lien Payrexx ici')}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Payer maintenant
              </button>
            )}

            {doc.type === 'devis' && doc.statut === 'envoye' && (
              <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                <Clock className="w-3.5 h-3.5" />
                En attente de votre réponse
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
