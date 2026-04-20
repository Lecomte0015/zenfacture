import React, { useState } from 'react';
import { useOrganisation } from '@/context/OrganisationContext';
import { useAuth } from '@/context/AuthContext';
import {
  BUSINESS_PROFILES,
  PROFIL_LIST,
  type ProfilMetier,
} from '@/config/businessProfiles';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

/**
 * Modal d'onboarding affichée lorsque l'organisation n'a pas encore de profil_metier.
 * L'utilisateur choisit son type d'activité, ce qui personnalise le dashboard et la sidebar.
 */
const ProfilMetierModal: React.FC = () => {
  const { profilMetier, updateProfilMetier, loading } = useOrganisation();
  const { user } = useAuth();
  const [selected, setSelected] = useState<ProfilMetier | null>(null);
  const [saving, setSaving] = useState(false);

  // Ne pas afficher si déjà un profil ou si encore en chargement
  if (loading || profilMetier !== null) return null;

  const prenom = (() => {
    const name = (user?.user_metadata?.name as string) || '';
    return name.split(' ')[0] || user?.email?.split('@')[0] || '';
  })();

  const handleConfirm = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      await updateProfilMetier(selected);
    } catch {
      setSaving(false);
    }
  };

  return (
    // Overlay plein écran
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* ── En-tête ───────────────────────────────────────────────── */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Personnalisation
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {prenom ? `Bienvenue, ${prenom} ! 👋` : 'Bienvenue sur ZenFacture ! 👋'}
          </h2>
          <p className="text-gray-500 mt-1.5 text-sm leading-relaxed">
            Dites-nous quel type d'activité vous exercez. Nous adapterons votre dashboard,
            votre menu et vos outils pour ne vous montrer que ce qui vous est utile.
          </p>
        </div>

        {/* ── Grille de profils ─────────────────────────────────────── */}
        <div className="px-8 py-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Mon activité principale
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PROFIL_LIST.map((id) => {
              const profile = BUSINESS_PROFILES[id];
              const isSelected = selected === id;
              return (
                <button
                  key={id}
                  onClick={() => setSelected(id)}
                  className={`relative flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-500/10'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  {/* Emoji */}
                  <span className="text-3xl leading-none flex-shrink-0 mt-0.5">
                    {profile.emoji}
                  </span>

                  {/* Texte */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                      {profile.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      {profile.description}
                    </p>
                  </div>

                  {/* Check */}
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Aperçu des fonctionnalités activées ──────────────────── */}
        {selected && (
          <div className="px-8 pb-4">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Fonctionnalités activées pour ce profil
              </p>
              <div className="flex flex-wrap gap-2">
                {getActivatedFeatureLabels(selected).map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 text-xs font-medium bg-white border border-green-200 text-green-700 px-2.5 py-1 rounded-full shadow-sm"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Actions ───────────────────────────────────────────────── */}
        <div className="px-8 pb-8 pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            Vous pourrez changer de profil à tout moment dans les paramètres.
          </p>
          <button
            onClick={handleConfirm}
            disabled={!selected || saving}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-150 ${
              selected && !saving
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Enregistrement…
              </>
            ) : (
              <>
                Personnaliser mon dashboard
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Helper : labels lisibles des features activées ────────────────────────
const FEATURE_LABELS: Record<string, string> = {
  produits: 'Catalogue produits',
  devis: 'Devis',
  recurrences: 'Facturations récurrentes',
  batch: 'Facturation groupée',
  signatures: 'Signatures électroniques',
  stock: 'Gestion stock',
  pos: 'Point de vente (caisse)',
  boutique: 'Boutiques en ligne',
  portailClient: 'Portail client',
  crm: 'CRM Pipeline',
  commandes: 'Commandes fournisseurs',
  timeTracking: 'Suivi du temps',
  payroll: 'Gestion salaires',
  marques: 'Multi-marques',
  fraud: 'Détection fraude',
  audit: 'Audit Trail',
  postal: 'Envoi postal',
  taxEstimation: 'Estimation fiscale',
};

function getActivatedFeatureLabels(profil: ProfilMetier): string[] {
  const features = BUSINESS_PROFILES[profil].features;
  return Object.entries(features)
    .filter(([, enabled]) => enabled)
    .map(([key]) => FEATURE_LABELS[key] ?? key);
}

export default ProfilMetierModal;
