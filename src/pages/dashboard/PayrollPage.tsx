import { useState } from 'react';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  FileText,
  CheckCircle,
  Download,
  ChevronRight,
  X,
  Wallet,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { usePayroll } from '../../hooks/usePayroll';
import { Employe, FicheSalaire, TAUX_LEGAUX, calculerFicheSalaire, exportFichesCSV, exportSwissdecXML } from '../../services/payrollService';
import { formatCurrency } from '../../utils/format';
import { useOrganisation } from '../../context/OrganisationContext';

// ─────────────────────────────────────────────
// Types locaux
// ─────────────────────────────────────────────

type OngletActif = 'employes' | 'fiches';

const TYPE_CONTRAT_LABELS: Record<string, string> = {
  cdi: 'CDI',
  cdd: 'CDD',
  stage: 'Stage',
  apprenti: 'Apprentissage',
};

const STATUT_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  valide: 'Validé',
  paye: 'Payé',
};

const STATUT_COLORS: Record<string, string> = {
  brouillon: 'bg-gray-100 text-gray-700',
  valide: 'bg-blue-100 text-blue-700',
  paye: 'bg-green-100 text-green-700',
};

const TYPE_COLORS: Record<string, string> = {
  cdi: 'bg-indigo-100 text-indigo-700',
  cdd: 'bg-orange-100 text-orange-700',
  stage: 'bg-purple-100 text-purple-700',
  apprenti: 'bg-teal-100 text-teal-700',
};

// ─────────────────────────────────────────────
// Formulaire Employé (modal)
// ─────────────────────────────────────────────

interface FormulaireEmployeProps {
  employe?: Employe;
  organisationId: string;
  onSauvegarder: (data: Omit<Employe, 'id' | 'cree_le' | 'mis_a_jour_le'>) => Promise<void>;
  onFermer: () => void;
}

const FormulaireEmploye = ({ employe, organisationId, onSauvegarder, onFermer }: FormulaireEmployeProps) => {
  const [form, setForm] = useState({
    prenom: employe?.prenom || '',
    nom: employe?.nom || '',
    email: employe?.email || '',
    telephone: employe?.telephone || '',
    adresse: employe?.adresse || '',
    code_postal: employe?.code_postal || '',
    ville: employe?.ville || '',
    date_naissance: employe?.date_naissance || '',
    date_entree: employe?.date_entree || new Date().toISOString().slice(0, 10),
    date_sortie: employe?.date_sortie || '',
    numero_avs: employe?.numero_avs || '',
    type_contrat: employe?.type_contrat || 'cdi',
    taux_activite: employe?.taux_activite ?? 100,
    salaire_brut_mensuel: employe?.salaire_brut_mensuel ?? 0,
    lpp_taux_employe: employe?.lpp_taux_employe ?? 5.0,
    ijm_taux: employe?.ijm_taux ?? 1.5,
    impot_source: employe?.impot_source || false,
    taux_is: employe?.taux_is ?? 0,
    iban: employe?.iban || '',
    actif: employe?.actif ?? true,
    notes: employe?.notes || '',
    organisation_id: organisationId,
  });
  const [sauvegarde, setSauvegarde] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.prenom.trim() || !form.nom.trim()) {
      setErreur('Le prénom et le nom sont obligatoires.');
      return;
    }
    setSauvegarde(true);
    setErreur(null);
    try {
      await onSauvegarder({
        ...form,
        type_contrat: form.type_contrat as Employe['type_contrat'],
        email: form.email || null,
        telephone: form.telephone || null,
        adresse: form.adresse || null,
        code_postal: form.code_postal || null,
        ville: form.ville || null,
        date_naissance: form.date_naissance || null,
        date_sortie: form.date_sortie || null,
        numero_avs: form.numero_avs || null,
        iban: form.iban || null,
        notes: form.notes || null,
      });
      onFermer();
    } catch {
      setErreur('Une erreur est survenue lors de la sauvegarde.');
    } finally {
      setSauvegarde(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {employe ? 'Modifier l\'employé' : 'Ajouter un employé'}
          </h2>
          <button onClick={onFermer} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {erreur && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
              <AlertCircle size={16} />
              {erreur}
            </div>
          )}

          {/* Identité */}
          <fieldset className="border border-gray-200 rounded-lg p-4">
            <legend className="text-sm font-semibold text-gray-700 px-2">Identité</legend>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                <input name="prenom" value={form.prenom} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input name="nom" value={form.nom} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input name="telephone" value={form.telephone} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                <input name="date_naissance" type="date" value={form.date_naissance} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro AVS</label>
                <input name="numero_avs" value={form.numero_avs} onChange={handleChange}
                  placeholder="756.xxxx.xxxx.xx"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
          </fieldset>

          {/* Contrat */}
          <fieldset className="border border-gray-200 rounded-lg p-4">
            <legend className="text-sm font-semibold text-gray-700 px-2">Contrat</legend>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de contrat</label>
                <select name="type_contrat" value={form.type_contrat} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="cdi">CDI</option>
                  <option value="cdd">CDD</option>
                  <option value="stage">Stage</option>
                  <option value="apprenti">Apprentissage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taux d'activité (%)</label>
                <input name="taux_activite" type="number" min={1} max={100} value={form.taux_activite} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'entrée *</label>
                <input name="date_entree" type="date" value={form.date_entree} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de sortie</label>
                <input name="date_sortie" type="date" value={form.date_sortie} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
          </fieldset>

          {/* Rémunération */}
          <fieldset className="border border-gray-200 rounded-lg p-4">
            <legend className="text-sm font-semibold text-gray-700 px-2">Rémunération &amp; cotisations</legend>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salaire brut mensuel (CHF) *</label>
                <input name="salaire_brut_mensuel" type="number" min={0} step="0.01" value={form.salaire_brut_mensuel} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taux LPP employé (%)</label>
                <input name="lpp_taux_employe" type="number" min={0} max={20} step="0.01" value={form.lpp_taux_employe} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taux IJM (%)</label>
                <input name="ijm_taux" type="number" min={0} max={10} step="0.01" value={form.ijm_taux} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                <input name="iban" value={form.iban} onChange={handleChange}
                  placeholder="CH xx xxxx xxxx xxxx xxxx x"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input name="impot_source" type="checkbox" checked={form.impot_source} onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Soumis à l'impôt à la source</span>
                </label>
              </div>
              {form.impot_source && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taux impôt à la source (%)</label>
                  <input name="taux_is" type="number" min={0} max={60} step="0.01" value={form.taux_is} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              )}
            </div>
          </fieldset>

          {/* Statut */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input name="actif" type="checkbox" checked={form.actif} onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Employé actif</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onFermer}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={sauvegarde}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {sauvegarde ? 'Sauvegarde...' : employe ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Modal détail fiche de salaire
// ─────────────────────────────────────────────

interface ModalFicheProps {
  fiche: FicheSalaire;
  employe?: Employe;
  onFermer: () => void;
  onValider: () => Promise<void>;
}

const ModalFiche = ({ fiche, employe, onFermer, onValider }: ModalFicheProps) => {
  const [validation, setValidation] = useState(false);

  const nomPeriode = () => {
    const [yyyy, mm] = fiche.periode.split('-');
    const date = new Date(parseInt(yyyy), parseInt(mm) - 1, 1);
    return date.toLocaleDateString('fr-CH', { month: 'long', year: 'numeric' });
  };

  const handleValider = async () => {
    setValidation(true);
    try {
      await onValider();
    } finally {
      setValidation(false);
    }
  };

  const LigneCotisation = ({ label, taux, montant }: { label: string; taux?: string; montant: number }) => (
    <tr className="border-b border-gray-100">
      <td className="py-2 text-sm text-gray-700">{label}</td>
      <td className="py-2 text-sm text-gray-500 text-right">{taux || ''}</td>
      <td className="py-2 text-sm text-gray-900 text-right font-medium">{formatCurrency(montant)}</td>
    </tr>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white rounded-t-xl">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Fiche de salaire</p>
            <h2 className="text-lg font-semibold capitalize">{nomPeriode()}</h2>
            {employe && <p className="text-sm text-gray-300">{employe.prenom} {employe.nom}</p>}
          </div>
          <button onClick={onFermer} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Section salaire brut */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-700">Salaire brut mensuel</span>
              <span className="text-lg font-bold text-gray-900">{formatCurrency(fiche.salaire_brut)}</span>
            </div>
            {(fiche.primes > 0 || fiche.heures_sup > 0 || fiche.indemnites > 0) && (
              <div className="mt-2 space-y-1">
                {fiche.primes > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>+ Primes</span><span>{formatCurrency(fiche.primes)}</span>
                  </div>
                )}
                {fiche.heures_sup > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>+ Heures supplémentaires</span><span>{formatCurrency(fiche.heures_sup)}</span>
                  </div>
                )}
                {fiche.indemnites > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>+ Indemnités</span><span>{formatCurrency(fiche.indemnites)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold text-gray-800 border-t border-gray-200 pt-1">
                  <span>= Salaire brut total</span>
                  <span>{formatCurrency(fiche.salaire_brut + fiche.primes + fiche.heures_sup + fiche.indemnites)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Déductions employé */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
              Déductions part employé
            </h3>
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase">
                  <th className="text-left pb-1">Cotisation</th>
                  <th className="text-right pb-1">Taux</th>
                  <th className="text-right pb-1">Montant</th>
                </tr>
              </thead>
              <tbody>
                <LigneCotisation label="AVS (assurance vieillesse)" taux={`${TAUX_LEGAUX.AVS_EMPLOYE}%`} montant={fiche.avs_employe} />
                <LigneCotisation label="AI (assurance invalidité)" taux={`${TAUX_LEGAUX.AI_EMPLOYE}%`} montant={fiche.ai_employe} />
                <LigneCotisation label="APG (allocations perte gain)" taux={`${TAUX_LEGAUX.APG_EMPLOYE}%`} montant={fiche.apg_employe} />
                <LigneCotisation label="AC (chômage)" taux={`${TAUX_LEGAUX.AC_EMPLOYE}%`} montant={fiche.ac_employe} />
                <LigneCotisation label="LPP (prévoyance professionnelle)" montant={fiche.lpp_employe} />
                <LigneCotisation label="IJM (indemnité journalière maladie)" montant={fiche.ijm_employe} />
                {fiche.impot_source > 0 && (
                  <LigneCotisation label="Impôt à la source" montant={fiche.impot_source} />
                )}
                {fiche.autres_deductions > 0 && (
                  <LigneCotisation label="Autres déductions" montant={fiche.autres_deductions} />
                )}
                <tr className="bg-red-50">
                  <td className="py-2 text-sm font-bold text-red-800 rounded-l">Total déductions</td>
                  <td></td>
                  <td className="py-2 text-sm font-bold text-red-800 text-right rounded-r">{formatCurrency(fiche.total_deductions)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Salaire net */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex justify-between items-center">
            <span className="text-base font-bold text-green-800">Salaire net à payer</span>
            <span className="text-xl font-bold text-green-700">{formatCurrency(fiche.salaire_net)}</span>
          </div>

          {/* Charges patronales */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-400 inline-block"></span>
              Charges patronales (part employeur)
            </h3>
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase">
                  <th className="text-left pb-1">Cotisation</th>
                  <th className="text-right pb-1">Taux</th>
                  <th className="text-right pb-1">Montant</th>
                </tr>
              </thead>
              <tbody>
                <LigneCotisation label="AVS (part employeur)" taux={`${TAUX_LEGAUX.AVS_EMPLOYEUR}%`} montant={fiche.avs_employeur} />
                <LigneCotisation label="AI (part employeur)" taux={`${TAUX_LEGAUX.AI_EMPLOYEUR}%`} montant={fiche.ai_employeur} />
                <LigneCotisation label="APG (part employeur)" taux={`${TAUX_LEGAUX.APG_EMPLOYEUR}%`} montant={fiche.apg_employeur} />
                <LigneCotisation label="AC (part employeur)" taux={`${TAUX_LEGAUX.AC_EMPLOYEUR}%`} montant={fiche.ac_employeur} />
                <LigneCotisation label="LPP (part employeur)" montant={fiche.lpp_employeur} />
                {fiche.allocations_familiales > 0 && (
                  <LigneCotisation label="Allocations familiales" montant={fiche.allocations_familiales} />
                )}
                <tr className="bg-orange-50">
                  <td className="py-2 text-sm font-bold text-orange-800 rounded-l">Total charges patronales</td>
                  <td></td>
                  <td className="py-2 text-sm font-bold text-orange-800 text-right rounded-r">{formatCurrency(fiche.total_charges_patronales)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Coût total */}
          <div className="bg-gray-900 text-white rounded-lg p-4 flex justify-between items-center">
            <span className="text-sm font-semibold">Coût total employeur</span>
            <span className="text-lg font-bold">{formatCurrency(fiche.cout_total_employeur)}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onFermer}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              Fermer
            </button>
            {fiche.statut === 'brouillon' && (
              <button onClick={handleValider} disabled={validation}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                <CheckCircle size={16} />
                {validation ? 'Validation...' : 'Valider la fiche'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────

export default function PayrollPage() {
  const { organisationId } = useOrganisation();
  const {
    employes,
    fiches,
    loading,
    error,
    periodeSelectionnee,
    setPeriodeSelectionnee,
    addEmploye,
    editEmploye,
    removeEmploye,
    removeFiche,
    editFiche,
    genererFichesMois,
    refreshAll,
    stats,
  } = usePayroll();

  const [onglet, setOnglet] = useState<OngletActif>('employes');
  const [modalEmploye, setModalEmploye] = useState<{ ouvert: boolean; employe?: Employe }>({ ouvert: false });
  const [modalFiche, setModalFiche] = useState<FicheSalaire | null>(null);
  const [generation, setGeneration] = useState(false);
  const [confirmation, setConfirmation] = useState<{ type: 'employe' | 'fiche'; id: string } | null>(null);

  const nomPeriode = (periode: string) => {
    const [yyyy, mm] = periode.split('-');
    const date = new Date(parseInt(yyyy), parseInt(mm) - 1, 1);
    return date.toLocaleDateString('fr-CH', { month: 'long', year: 'numeric' });
  };

  const handleGenererFiches = async () => {
    setGeneration(true);
    try {
      await genererFichesMois(periodeSelectionnee);
    } catch {
      // l'erreur est gérée dans le hook
    } finally {
      setGeneration(false);
    }
  };

  const handleSauvegarderEmploye = async (data: Omit<Employe, 'id' | 'cree_le' | 'mis_a_jour_le'>) => {
    if (modalEmploye.employe) {
      await editEmploye(modalEmploye.employe.id, data);
    } else {
      await addEmploye(data);
    }
  };

  const handleValiderFiche = async () => {
    if (!modalFiche) return;
    await editFiche(modalFiche.id, { statut: 'valide' });
    setModalFiche(prev => prev ? { ...prev, statut: 'valide' } : null);
  };

  const handleExportCSV = () => {
    const csv = exportFichesCSV(fiches, employes);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salaires-${periodeSelectionnee}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportXML = () => {
    const xml = exportSwissdecXML(fiches, employes, { nom: 'Mon organisation' });
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swissdec-${periodeSelectionnee}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportFicheCSV = (fiche: FicheSalaire) => {
    const csv = exportFichesCSV([fiche], employes);
    const emp = employes.find(e => e.id === fiche.employe_id);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fiche-${emp?.nom || 'employe'}-${fiche.periode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSupprimer = async () => {
    if (!confirmation) return;
    try {
      if (confirmation.type === 'employe') {
        await removeEmploye(confirmation.id);
      } else {
        await removeFiche(confirmation.id);
      }
    } finally {
      setConfirmation(null);
    }
  };

  const employeMap = new Map(employes.map(e => [e.id, e]));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Wallet className="text-indigo-600" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Salaires</h1>
              <p className="text-sm text-gray-500">Gestion de la paie — conforme Swissdec</p>
            </div>
          </div>
          <button onClick={refreshAll}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            <RotateCcw size={14} />
            Actualiser
          </button>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 mt-5 border-b border-gray-200">
          <button
            onClick={() => setOnglet('employes')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              onglet === 'employes'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Users size={15} />
              Employés
              <span className="bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 text-xs">
                {employes.length}
              </span>
            </span>
          </button>
          <button
            onClick={() => setOnglet('fiches')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              onglet === 'fiches'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <FileText size={15} />
              Fiches de salaire
              <span className="bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 text-xs">
                {fiches.length}
              </span>
            </span>
          </button>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Message d'erreur */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* ─── Onglet Employés ─── */}
        {onglet === 'employes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">
                {stats.nombreEmployesActifs} employé{stats.nombreEmployesActifs !== 1 ? 's' : ''} actif{stats.nombreEmployesActifs !== 1 ? 's' : ''}
              </h2>
              <button
                onClick={() => setModalEmploye({ ouvert: true })}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
              >
                <Plus size={16} />
                Ajouter un employé
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
              </div>
            ) : employes.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <Users size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">Aucun employé enregistré.</p>
                <button
                  onClick={() => setModalEmploye({ ouvert: true })}
                  className="mt-3 text-indigo-600 text-sm hover:underline"
                >
                  Ajouter le premier employé
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left">Employé</th>
                      <th className="px-4 py-3 text-left">Contrat</th>
                      <th className="px-4 py-3 text-right">Taux</th>
                      <th className="px-4 py-3 text-right">Salaire brut</th>
                      <th className="px-4 py-3 text-right">AVS/mois</th>
                      <th className="px-4 py-3 text-center">Statut</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {employes.map(emp => {
                      const avsEmp = Math.round(emp.salaire_brut_mensuel * TAUX_LEGAUX.AVS_EMPLOYE / 100 * 100) / 100;
                      return (
                        <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{emp.prenom} {emp.nom}</p>
                              {emp.email && <p className="text-xs text-gray-400">{emp.email}</p>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[emp.type_contrat]}`}>
                              {TYPE_CONTRAT_LABELS[emp.type_contrat]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">{emp.taux_activite}%</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            {formatCurrency(emp.salaire_brut_mensuel)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(avsEmp)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {emp.actif ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setModalEmploye({ ouvert: true, employe: emp })}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                title="Modifier"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => setConfirmation({ type: 'employe', id: emp.id })}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Supprimer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── Onglet Fiches ─── */}
        {onglet === 'fiches' && (
          <div className="space-y-4">
            {/* Barre d'actions */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Période :</label>
                <input
                  type="month"
                  value={periodeSelectionnee}
                  onChange={e => setPeriodeSelectionnee(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleGenererFiches}
                disabled={generation || employes.filter(e => e.actif).length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                <Plus size={16} />
                {generation ? 'Génération...' : `Générer les fiches — ${nomPeriode(periodeSelectionnee)}`}
              </button>
              <div className="flex-1" />
              {fiches.length > 0 && (
                <>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                  >
                    <Download size={14} />
                    Export CSV
                  </button>
                  <button
                    onClick={handleExportXML}
                    className="flex items-center gap-2 px-3 py-2 border border-indigo-300 rounded-lg text-sm text-indigo-600 hover:bg-indigo-50"
                  >
                    <Download size={14} />
                    Export Swissdec XML
                  </button>
                </>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
              </div>
            ) : fiches.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">Aucune fiche pour cette période.</p>
                {employes.filter(e => e.actif).length > 0 ? (
                  <button onClick={handleGenererFiches} disabled={generation}
                    className="mt-3 text-indigo-600 text-sm hover:underline">
                    Générer les fiches de salaire
                  </button>
                ) : (
                  <button onClick={() => setOnglet('employes')}
                    className="mt-3 text-indigo-600 text-sm hover:underline">
                    Ajouter des employés d'abord
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-left">Employé</th>
                        <th className="px-4 py-3 text-right">Salaire brut</th>
                        <th className="px-4 py-3 text-right">Déductions</th>
                        <th className="px-4 py-3 text-right">Salaire net</th>
                        <th className="px-4 py-3 text-right">Charges pat.</th>
                        <th className="px-4 py-3 text-right">Coût employeur</th>
                        <th className="px-4 py-3 text-center">Statut</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {fiches.map(fiche => {
                        const emp = employeMap.get(fiche.employe_id);
                        return (
                          <tr key={fiche.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {emp ? `${emp.prenom} ${emp.nom}` : 'Employé inconnu'}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(fiche.salaire_brut)}</td>
                            <td className="px-4 py-3 text-right text-red-600">−{formatCurrency(fiche.total_deductions)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-green-700">{formatCurrency(fiche.salaire_net)}</td>
                            <td className="px-4 py-3 text-right text-orange-600">{formatCurrency(fiche.total_charges_patronales)}</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(fiche.cout_total_employeur)}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUT_COLORS[fiche.statut]}`}>
                                {STATUT_LABELS[fiche.statut]}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setModalFiche(fiche)}
                                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                  title="Voir le détail"
                                >
                                  <ChevronRight size={14} />
                                </button>
                                {fiche.statut === 'brouillon' && (
                                  <button
                                    onClick={() => editFiche(fiche.id, { statut: 'valide' })}
                                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                    title="Valider"
                                  >
                                    <CheckCircle size={14} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleExportFicheCSV(fiche)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                  title="Télécharger CSV"
                                >
                                  <Download size={14} />
                                </button>
                                <button
                                  onClick={() => setConfirmation({ type: 'fiche', id: fiche.id })}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                  title="Supprimer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Récapitulatif */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Masse salariale brute</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalMasseSalariale)}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-orange-200 p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total charges patronales</p>
                    <p className="text-xl font-bold text-orange-600">{formatCurrency(stats.totalChargesPatronales)}</p>
                  </div>
                  <div className="bg-gray-900 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Coût total employeur</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(stats.totalCoutEmployeur)}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal employé */}
      {modalEmploye.ouvert && organisationId && (
        <FormulaireEmploye
          employe={modalEmploye.employe}
          organisationId={organisationId}
          onSauvegarder={handleSauvegarderEmploye}
          onFermer={() => setModalEmploye({ ouvert: false })}
        />
      )}

      {/* Modal fiche détail */}
      {modalFiche && (
        <ModalFiche
          fiche={modalFiche}
          employe={employeMap.get(modalFiche.employe_id)}
          onFermer={() => setModalFiche(null)}
          onValider={handleValiderFiche}
        />
      )}

      {/* Modal confirmation suppression */}
      {confirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Confirmer la suppression</h3>
            <p className="text-sm text-gray-600 mb-5">
              {confirmation.type === 'employe'
                ? 'Êtes-vous sûr de vouloir supprimer cet employé ? Toutes ses fiches de salaire seront également supprimées.'
                : 'Êtes-vous sûr de vouloir supprimer cette fiche de salaire ?'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmation(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={handleSupprimer}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
