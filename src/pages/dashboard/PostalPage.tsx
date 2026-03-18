import { useState, useEffect } from 'react';
import { useOrganisation } from '@/context/OrganisationContext';
import {
  Mail, MapPin, Send, Clock, CheckCircle, AlertCircle,
  Package, Truck, Star, Info, Loader2, History, ChevronRight,
} from 'lucide-react';
import {
  PostalType, PostalStatut, EnvoiPostal, AdressePostale,
  TARIFS_POSTAUX, calculerPrixPostal, envoyerDocumentPostal,
  getEnvoisPostaux, getStatsPostaux,
} from '@/services/postalService';

const STATUT_CONFIG: Record<PostalStatut, { label: string; color: string; icon: typeof Clock }> = {
  en_preparation: { label: 'En préparation', color: 'bg-gray-100 text-gray-700', icon: Clock },
  envoye: { label: 'Envoyé', color: 'bg-blue-100 text-blue-700', icon: Send },
  en_transit: { label: 'En transit', color: 'bg-amber-100 text-amber-700', icon: Truck },
  distribue: { label: 'Distribué', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  echec: { label: 'Échec', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const defaultAdresse: AdressePostale = {
  nom: '',
  adresse: '',
  code_postal: '',
  ville: '',
  pays: 'Suisse',
};

interface FormState {
  type: PostalType;
  destinataire: AdressePostale;
  nombre_pages: number;
  couleur: boolean;
}

const defaultForm: FormState = {
  type: 'lettre_b',
  destinataire: { ...defaultAdresse },
  nombre_pages: 2,
  couleur: true,
};

function formatCHF(centimes: number) {
  return `CHF ${(centimes / 100).toFixed(2)}`;
}

export default function PostalPage() {
  const { organisation } = useOrganisation();
  const [tab, setTab] = useState<'envoyer' | 'historique'>('envoyer');
  const [form, setForm] = useState<FormState>(defaultForm);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<EnvoiPostal | null>(null);
  const [envois, setEnvois] = useState<EnvoiPostal[]>([]);
  const [stats, setStats] = useState<{ total: number; ce_mois: number; cout_total_chf: number } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!organisation?.id) return;
    setLoadingHistory(true);
    Promise.all([
      getEnvoisPostaux(organisation.id),
      getStatsPostaux(organisation.id),
    ])
      .then(([e, s]) => { setEnvois(e); setStats(s); })
      .catch(console.error)
      .finally(() => setLoadingHistory(false));
  }, [organisation?.id, sent]);

  const prix = calculerPrixPostal(form.type, form.nombre_pages, form.couleur);
  const tarif = TARIFS_POSTAUX.find(t => t.type === form.type)!;

  const updateDest = (field: keyof AdressePostale, value: string) => {
    setForm(f => ({ ...f, destinataire: { ...f.destinataire, [field]: value } }));
  };

  const handleSend = async () => {
    if (!organisation?.id) return;
    setSending(true);
    try {
      const expediteur: AdressePostale = {
        nom: organisation.nom || 'Mon Organisation',
        adresse: organisation.adresse || '',
        code_postal: organisation.code_postal || '',
        ville: organisation.ville || '',
        pays: 'Suisse',
      };

      const result = await envoyerDocumentPostal(organisation.id, {
        type: form.type,
        destinataire: form.destinataire,
        expediteur,
        nombre_pages: form.nombre_pages,
        couleur: form.couleur,
      });
      setSent(result);
      setForm(defaultForm);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const isValid = form.destinataire.nom && form.destinataire.adresse &&
    form.destinataire.code_postal && form.destinataire.ville;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Mail className="w-6 h-6 text-blue-600" />
          Envoi postal Swiss Post
        </h1>
        <p className="text-gray-500 mt-1">
          Envoyez vos factures et documents par courrier postal ou ePost directement depuis ZenFacture.
        </p>
      </div>

      {/* Info intégration */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <strong>Intégration Swiss Post :</strong> En mode simulation. Pour activer l'envoi réel,
          configurez votre compte Swiss Post Business et ajoutez <code className="bg-blue-100 px-1 rounded">VITE_SWISS_POST_API_KEY</code> dans vos variables d'environnement.
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total envois</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Ce mois-ci</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.ce_mois}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Coût total</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">CHF {stats.cout_total_chf.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {([
            { id: 'envoyer', label: 'Nouvel envoi', icon: Send },
            { id: 'historique', label: 'Historique', icon: History },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB: Nouvel envoi */}
      {tab === 'envoyer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulaire */}
          <div className="space-y-4">
            {/* Type d'envoi */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Type d'envoi</h3>
              <div className="space-y-2">
                {TARIFS_POSTAUX.map(t => (
                  <label
                    key={t.type}
                    className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                      form.type === t.type ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={t.type}
                      checked={form.type === t.type}
                      onChange={() => setForm(f => ({ ...f, type: t.type }))}
                      className="mt-1 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-gray-800">{t.label}</p>
                        <span className="text-sm font-bold text-blue-700">{formatCHF(t.prix_base_centimes)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {t.delai}
                        </span>
                        {t.tracking && (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            Tracking
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Options impression */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Options d'impression</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Nombre de pages</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={form.nombre_pages}
                    onChange={e => setForm(f => ({ ...f, nombre_pages: parseInt(e.target.value) || 1 }))}
                    className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.couleur}
                    onChange={e => setForm(f => ({ ...f, couleur: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Impression couleur (+CHF 0.20/page)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Adresse + Récapitulatif */}
          <div className="space-y-4">
            {/* Adresse destinataire */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                Adresse du destinataire
              </h3>
              <div className="space-y-3">
                {[
                  { field: 'nom' as const, label: 'Nom / Entreprise', placeholder: 'Jean Dupont SA' },
                  { field: 'adresse' as const, label: 'Adresse', placeholder: 'Rue de la Paix 10' },
                ].map(f => (
                  <div key={f.field}>
                    <label className="block text-xs text-gray-500 mb-0.5">{f.label}</label>
                    <input
                      type="text"
                      value={form.destinataire[f.field]}
                      onChange={e => updateDest(f.field, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">NPA</label>
                    <input
                      type="text"
                      value={form.destinataire.code_postal}
                      onChange={e => updateDest('code_postal', e.target.value)}
                      placeholder="1201"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Localité</label>
                    <input
                      type="text"
                      value={form.destinataire.ville}
                      onChange={e => updateDest('ville', e.target.value)}
                      placeholder="Genève"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Pays</label>
                  <input
                    type="text"
                    value={form.destinataire.pays}
                    onChange={e => updateDest('pays', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Récapitulatif + Prix */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Récapitulatif</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium">{tarif.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pages</span>
                  <span className="font-medium">{form.nombre_pages} {form.couleur ? '(couleur)' : '(N&B)'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Délai</span>
                  <span className="font-medium">{tarif.delai}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                  <span className="font-semibold text-gray-700">Total estimé</span>
                  <span className="font-bold text-blue-700 text-lg">{formatCHF(prix)}</span>
                </div>
              </div>

              <button
                onClick={handleSend}
                disabled={sending || !isValid}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer par {tarif.label}
                  </>
                )}
              </button>
            </div>

            {/* Confirmation d'envoi */}
            {sent && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-800">Envoi confirmé !</p>
                  {sent.tracking_number && (
                    <p className="text-sm text-green-700 mt-0.5">
                      Numéro de suivi : <code className="font-mono font-bold">{sent.tracking_number}</code>
                    </p>
                  )}
                  <p className="text-sm text-green-600 mt-0.5">
                    Prix : {formatCHF(sent.prix_centimes)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Historique */}
      {tab === 'historique' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-800">Historique des envois</h3>
          </div>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : envois.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Aucun envoi postal enregistré</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {envois.map(envoi => {
                const conf = STATUT_CONFIG[envoi.statut];
                const StatutIcon = conf.icon;
                return (
                  <div key={envoi.id} className="flex items-center gap-4 px-4 py-3">
                    <div className={`p-1.5 rounded-lg ${conf.color}`}>
                      <StatutIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800">{(envoi.destinataire as AdressePostale).nom}</p>
                      <p className="text-xs text-gray-400">
                        {(envoi.destinataire as AdressePostale).code_postal} {(envoi.destinataire as AdressePostale).ville}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${conf.color}`}>
                      {conf.label}
                    </span>
                    {envoi.tracking_number && (
                      <code className="text-xs text-gray-400 font-mono">{envoi.tracking_number}</code>
                    )}
                    <span className="text-sm font-medium text-gray-700">{formatCHF(envoi.prix_centimes)}</span>
                    <span className="text-xs text-gray-400">{new Date(envoi.created_at).toLocaleDateString('fr-CH')}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
