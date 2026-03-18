import React, { useState, useEffect } from 'react';
import {
  Timer,
  FolderOpen,
  ListTodo,
  Play,
  Square,
  Plus,
  FileText,
  Clock,
  TrendingUp,
  CheckCircle,
  X,
  Trash2,
} from 'lucide-react';
import { useTimeTracking } from '../../hooks/useTimeTracking';
import { useAuth } from '../../context/AuthContext';
import { Projet, SessionTemps, Tache } from '../../services/timeTrackingService';
import { formatCurrency } from '../../utils/format';

// ─── Utilitaires ─────────────────────────────────────────────────────────────

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatMinutes = (minutes: number | null): string => {
  if (!minutes) return '0min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
};

const formatHeures = (heures: number): string => {
  const h = Math.floor(heures);
  const m = Math.round((heures - h) * 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
};

const statutBadge = (statut: Projet['statut']) => {
  const config: Record<string, { label: string; color: string }> = {
    actif: { label: 'Actif', color: 'bg-green-100 text-green-700' },
    pause: { label: 'En pause', color: 'bg-yellow-100 text-yellow-700' },
    termine: { label: 'Terminé', color: 'bg-gray-100 text-gray-600' },
    archive: { label: 'Archivé', color: 'bg-red-100 text-red-700' },
  };
  const c = config[statut] || config.actif;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.color}`}>
      {c.label}
    </span>
  );
};

const prioriteBadge = (priorite: Tache['priorite']) => {
  const config: Record<string, { label: string; color: string }> = {
    basse: { label: 'Basse', color: 'bg-gray-100 text-gray-600' },
    normale: { label: 'Normale', color: 'bg-blue-100 text-blue-700' },
    haute: { label: 'Haute', color: 'bg-orange-100 text-orange-700' },
    urgente: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
  };
  const c = config[priorite] || config.normale;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.color}`}>
      {c.label}
    </span>
  );
};

// ─── Modal Nouveau Projet ─────────────────────────────────────────────────────

interface ModalProjetProps {
  organisationId: string;
  onClose: () => void;
  onSubmit: (data: Omit<Projet, 'id' | 'cree_le' | 'mis_a_jour_le' | 'total_heures' | 'heures_facturables' | 'ca_potentiel'>) => Promise<void>;
}

const ModalProjet: React.FC<ModalProjetProps> = ({ organisationId, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    nom: '',
    description: '',
    tarif_horaire: '',
    budget_heures: '',
    devise: 'CHF',
    statut: 'actif' as Projet['statut'],
    couleur: '#3B82F6',
    date_debut: '',
    date_fin: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim()) return;

    setSaving(true);
    try {
      await onSubmit({
        organisation_id: organisationId,
        client_id: null,
        nom: form.nom,
        description: form.description || null,
        tarif_horaire: parseFloat(form.tarif_horaire) || 0,
        budget_heures: form.budget_heures ? parseFloat(form.budget_heures) : null,
        devise: form.devise,
        statut: form.statut,
        couleur: form.couleur,
        date_debut: form.date_debut || null,
        date_fin: form.date_fin || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Nouveau projet</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du projet *</label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex. Refonte site web client"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Description du projet..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tarif horaire (CHF)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.tarif_horaire}
                onChange={(e) => setForm({ ...form, tarif_horaire: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget heures</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.budget_heures}
                onChange={(e) => setForm({ ...form, budget_heures: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex. 40"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
              <input
                type="date"
                value={form.date_debut}
                onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
              <input
                type="date"
                value={form.date_fin}
                onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
              <input
                type="color"
                value={form.couleur}
                onChange={(e) => setForm({ ...form, couleur: e.target.value })}
                className="w-10 h-10 rounded cursor-pointer border border-gray-300"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={form.statut}
                onChange={(e) => setForm({ ...form, statut: e.target.value as Projet['statut'] })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="actif">Actif</option>
                <option value="pause">En pause</option>
                <option value="termine">Terminé</option>
                <option value="archive">Archivé</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={saving || !form.nom.trim()} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Création...' : 'Créer le projet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Modal Saisie Session Manuelle ────────────────────────────────────────────

interface ModalSessionProps {
  projets: Projet[];
  userId: string | undefined;
  onClose: () => void;
  onSubmit: (data: Omit<SessionTemps, 'id' | 'cree_le'>) => Promise<void>;
}

const ModalSession: React.FC<ModalSessionProps> = ({ projets, userId, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    projet_id: projets[0]?.id || '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    duree_heures: '',
    duree_minutes_input: '',
    facturable: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projet_id) return;

    const heures = parseInt(form.duree_heures) || 0;
    const minutes = parseInt(form.duree_minutes_input) || 0;
    const totalMinutes = heures * 60 + minutes;
    if (totalMinutes <= 0) return;

    setSaving(true);
    try {
      await onSubmit({
        projet_id: form.projet_id,
        user_id: userId || null,
        description: form.description || null,
        debut_at: `${form.date}T08:00:00.000Z`,
        fin_at: `${form.date}T08:00:00.000Z`,
        duree_minutes: totalMinutes,
        facturable: form.facturable,
        facture: false,
        facture_id: null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Saisie manuelle</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Projet *</label>
            <select
              value={form.projet_id}
              onChange={(e) => setForm({ ...form, projet_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {projets.map((p) => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Travaux effectués..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heures *</label>
              <input
                type="number"
                min="0"
                max="24"
                value={form.duree_heures}
                onChange={(e) => setForm({ ...form, duree_heures: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minutes *</label>
              <input
                type="number"
                min="0"
                max="59"
                value={form.duree_minutes_input}
                onChange={(e) => setForm({ ...form, duree_minutes_input: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="facturable"
              checked={form.facturable}
              onChange={(e) => setForm({ ...form, facturable: e.target.checked })}
              className="rounded border-gray-300 text-blue-600"
            />
            <label htmlFor="facturable" className="text-sm text-gray-700">Facturable</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Modal Nouvelle Tâche ─────────────────────────────────────────────────────

interface ModalTacheProps {
  projetId: string;
  statutInitial: Tache['statut'];
  onClose: () => void;
  onSubmit: (data: Omit<Tache, 'id' | 'cree_le'>) => Promise<void>;
}

const ModalTache: React.FC<ModalTacheProps> = ({ projetId, statutInitial, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    titre: '',
    description: '',
    statut: statutInitial,
    heures_estimees: '',
    priorite: 'normale' as Tache['priorite'],
    date_echeance: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre.trim()) return;

    setSaving(true);
    try {
      await onSubmit({
        projet_id: projetId,
        titre: form.titre,
        description: form.description || null,
        statut: form.statut,
        heures_estimees: form.heures_estimees ? parseFloat(form.heures_estimees) : null,
        heures_reelles: 0,
        assignee_id: null,
        priorite: form.priorite,
        date_echeance: form.date_echeance || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Nouvelle tâche</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input
              type="text"
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Titre de la tâche"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Détails de la tâche..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
              <select
                value={form.priorite}
                onChange={(e) => setForm({ ...form, priorite: e.target.value as Tache['priorite'] })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="basse">Basse</option>
                <option value="normale">Normale</option>
                <option value="haute">Haute</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heures estimées</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.heures_estimees}
                onChange={(e) => setForm({ ...form, heures_estimees: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
            <input
              type="date"
              value={form.date_echeance}
              onChange={(e) => setForm({ ...form, date_echeance: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={saving || !form.titre.trim()} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Création...' : 'Créer la tâche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Page principale ──────────────────────────────────────────────────────────

const TimeTrackingPage: React.FC = () => {
  const { user } = useAuth();
  const {
    projets,
    loading,
    error,
    activeTimer,
    timerDuration,
    addProjet,
    removeProjet,
    startTimer,
    stopTimer,
    getSessions,
    addSession,
    removeSession,
    getTaches,
    addTache,
    editTache,
    removeTache,
    refreshProjets,
  } = useTimeTracking();

  const [onglet, setOnglet] = useState<'overview' | 'sessions' | 'taches'>('overview');

  // Sélection du projet pour le timer
  const [timerProjetId, setTimerProjetId] = useState<string>('');
  const [timerDescription, setTimerDescription] = useState<string>('');
  const [timerLoading, setTimerLoading] = useState(false);

  // Modales
  const [showModalProjet, setShowModalProjet] = useState(false);
  const [showModalSession, setShowModalSession] = useState(false);
  const [showModalTache, setShowModalTache] = useState<{ statut: Tache['statut']; projetId: string } | null>(null);

  // Détail projet sélectionné
  const [projetSelectionne, setProjetSelectionne] = useState<string>('');

  // Sessions chargées
  const [sessions, setSessions] = useState<SessionTemps[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [filtreProjetSessions, setFiltreProjetSessions] = useState<string>('');

  // Tâches chargées
  const [taches, setTaches] = useState<Tache[]>([]);
  const [tachesLoading, setTachesLoading] = useState(false);
  const [filtreProjetTaches, setFiltreProjetTaches] = useState<string>('');

  // Timer actif : nom du projet
  const projetTimerActif = projets.find((p) => p.id === activeTimer?.projet_id);

  // Stats globales ce mois
  const maintenant = new Date();
  const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);

  const projetsActifs = projets.filter((p) => p.statut === 'actif');
  const totalHeuresMois = projets.reduce((acc, p) => acc + (p.total_heures || 0), 0);
  const caPotentielMois = projets.reduce((acc, p) => acc + (p.ca_potentiel || 0), 0);
  const heuresFacturablesMois = projets.reduce((acc, p) => acc + (p.heures_facturables || 0), 0);

  // Initialiser le sélecteur de projet pour le timer
  useEffect(() => {
    if (projetsActifs.length > 0 && !timerProjetId) {
      setTimerProjetId(projetsActifs[0].id);
    }
  }, [projetsActifs]);

  // Charger les sessions quand l'onglet change
  useEffect(() => {
    if (onglet === 'sessions') {
      chargerSessions();
    }
  }, [onglet, filtreProjetSessions]);

  // Charger les tâches quand l'onglet change
  useEffect(() => {
    if (onglet === 'taches') {
      chargerTaches();
    }
  }, [onglet, filtreProjetTaches]);

  const chargerSessions = async () => {
    if (projets.length === 0) return;
    setSessionsLoading(true);
    try {
      const projetId = filtreProjetSessions || projets[0]?.id;
      if (!projetId) return;
      const data = await getSessions(projetId);
      setSessions(data);
    } catch (err) {
      console.error('Erreur chargement sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const chargerTaches = async () => {
    if (projets.length === 0) return;
    setTachesLoading(true);
    try {
      const projetId = filtreProjetTaches || projets[0]?.id;
      if (!projetId) return;
      const data = await getTaches(projetId);
      setTaches(data);
    } catch (err) {
      console.error('Erreur chargement tâches:', err);
    } finally {
      setTachesLoading(false);
    }
  };

  const handleDemarrerTimer = async () => {
    if (!timerProjetId) return;
    setTimerLoading(true);
    try {
      await startTimer(timerProjetId, timerDescription);
      setTimerDescription('');
    } catch (err) {
      console.error('Erreur démarrage timer:', err);
    } finally {
      setTimerLoading(false);
    }
  };

  const handleArreterTimer = async () => {
    setTimerLoading(true);
    try {
      await stopTimer();
      refreshProjets();
    } catch (err) {
      console.error('Erreur arrêt timer:', err);
    } finally {
      setTimerLoading(false);
    }
  };

  const handleAjouterProjet = async (data: Omit<Projet, 'id' | 'cree_le' | 'mis_a_jour_le' | 'total_heures' | 'heures_facturables' | 'ca_potentiel'>) => {
    await addProjet(data);
  };

  const handleAjouterSession = async (data: Omit<SessionTemps, 'id' | 'cree_le'>) => {
    await addSession(data);
    chargerSessions();
  };

  const handleAjouterTache = async (data: Omit<Tache, 'id' | 'cree_le'>) => {
    await addTache(data);
    chargerTaches();
  };

  const handleChangerStatutTache = async (tacheId: string, statut: Tache['statut']) => {
    await editTache(tacheId, { statut });
    setTaches((prev) => prev.map((t) => (t.id === tacheId ? { ...t, statut } : t)));
  };

  const handleSupprimerTache = async (tacheId: string) => {
    await removeTache(tacheId);
    setTaches((prev) => prev.filter((t) => t.id !== tacheId));
  };

  const handleSupprimerSession = async (sessionId: string) => {
    await removeSession(sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  // organisationId depuis les projets ou contexte
  const organisationId = projets[0]?.organisation_id || '';

  // Groupes tâches Kanban
  const tachesAFaire = taches.filter((t) => t.statut === 'a_faire');
  const tachesEnCours = taches.filter((t) => t.statut === 'en_cours');
  const tachesTerminees = taches.filter((t) => t.statut === 'termine');

  const projetTaches = filtreProjetTaches || projets[0]?.id || '';
  const projetSessions = filtreProjetSessions || projets[0]?.id || '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Timer className="text-blue-600" size={28} />
            Suivi du temps
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gérez vos projets, sessions et tâches</p>
        </div>
        <button
          onClick={() => setShowModalProjet(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus size={16} />
          Nouveau projet
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setOnglet('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            onglet === 'overview' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FolderOpen size={16} />
          Vue d'ensemble
        </button>
        <button
          onClick={() => setOnglet('sessions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            onglet === 'sessions' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock size={16} />
          Sessions
        </button>
        <button
          onClick={() => setOnglet('taches')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            onglet === 'taches' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ListTodo size={16} />
          Tâches
        </button>
      </div>

      {/* ─── Onglet Vue d'ensemble ──────────────────────────────────────────── */}
      {onglet === 'overview' && (
        <div className="space-y-6">
          {/* Widget chronomètre */}
          <div className="bg-blue-600 rounded-xl p-6 text-white">
            {activeTimer ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    En cours : {projetTimerActif?.nom || 'Projet inconnu'}
                  </div>
                  {activeTimer.description && (
                    <p className="text-blue-200 text-xs mb-2">{activeTimer.description}</p>
                  )}
                  <div className="text-4xl font-mono font-bold tracking-widest">
                    {formatDuration(timerDuration)}
                  </div>
                </div>
                <button
                  onClick={handleArreterTimer}
                  disabled={timerLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                >
                  <Square size={18} />
                  Arrêter
                </button>
              </div>
            ) : (
              <div>
                <p className="text-blue-100 text-sm mb-3 font-medium">Démarrer le chronomètre</p>
                <div className="flex gap-3 flex-wrap">
                  <select
                    value={timerProjetId}
                    onChange={(e) => setTimerProjetId(e.target.value)}
                    className="flex-1 min-w-40 bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    {projetsActifs.length === 0 ? (
                      <option value="">Aucun projet actif</option>
                    ) : (
                      projetsActifs.map((p) => (
                        <option key={p.id} value={p.id} className="text-gray-900">
                          {p.nom}
                        </option>
                      ))
                    )}
                  </select>
                  <input
                    type="text"
                    value={timerDescription}
                    onChange={(e) => setTimerDescription(e.target.value)}
                    placeholder="Description (optionnel)..."
                    className="flex-1 min-w-48 bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                  <button
                    onClick={handleDemarrerTimer}
                    disabled={timerLoading || !timerProjetId || projetsActifs.length === 0}
                    className="flex items-center gap-2 px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                  >
                    <Play size={16} />
                    Démarrer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stats globales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Clock size={20} className="text-blue-600" />
                </div>
                <p className="text-sm text-gray-500">Total heures</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatHeures(totalHeuresMois)}</p>
              <p className="text-xs text-gray-400 mt-1">Tous projets confondus</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-50 rounded-lg">
                  <TrendingUp size={20} className="text-green-600" />
                </div>
                <p className="text-sm text-gray-500">CA potentiel</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(caPotentielMois, 'CHF')}</p>
              <p className="text-xs text-gray-400 mt-1">Basé sur heures facturables</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <CheckCircle size={20} className="text-purple-600" />
                </div>
                <p className="text-sm text-gray-500">Heures facturables</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatHeures(heuresFacturablesMois)}</p>
              <p className="text-xs text-gray-400 mt-1">Prêtes à facturer</p>
            </div>
          </div>

          {/* Liste des projets */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Projets</h2>
            </div>
            {projets.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <FolderOpen size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun projet. Créez votre premier projet pour commencer.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {projets.map((projet) => {
                  const progression = projet.budget_heures
                    ? Math.min(((projet.total_heures || 0) / projet.budget_heures) * 100, 100)
                    : null;

                  return (
                    <div key={projet.id} className="p-5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: projet.couleur }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-gray-900">{projet.nom}</p>
                              {statutBadge(projet.statut)}
                            </div>
                            {projet.description && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">{projet.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-gray-900">{formatHeures(projet.total_heures || 0)}</p>
                            <p className="text-xs text-gray-400">{formatCurrency(projet.ca_potentiel || 0, projet.devise)}</p>
                          </div>
                          <button
                            onClick={() => {
                              setFiltreProjetSessions(projet.id);
                              setOnglet('sessions');
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Voir les sessions"
                          >
                            <Clock size={16} />
                          </button>
                          <button
                            onClick={() => removeProjet(projet.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer le projet"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      {progression !== null && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Budget : {formatHeures(projet.total_heures || 0)} / {formatHeures(projet.budget_heures || 0)}</span>
                            <span>{Math.round(progression)}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${progression >= 100 ? 'bg-red-500' : progression >= 80 ? 'bg-orange-500' : 'bg-blue-500'}`}
                              style={{ width: `${progression}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Onglet Sessions ─────────────────────────────────────────────────── */}
      {onglet === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Projet :</label>
              <select
                value={filtreProjetSessions}
                onChange={(e) => setFiltreProjetSessions(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {projets.map((p) => (
                  <option key={p.id} value={p.id}>{p.nom}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowModalSession(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Plus size={16} />
              Saisie manuelle
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {sessionsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Clock size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune session enregistrée pour ce projet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Description</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Durée</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-500">Facturable</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-500">Facturé</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sessions.map((session) => {
                      const date = session.debut_at
                        ? new Date(session.debut_at).toLocaleDateString('fr-CH')
                        : '—';
                      return (
                        <tr key={session.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{date}</td>
                          <td className="px-4 py-3 text-gray-900">{session.description || <span className="text-gray-400 italic">Sans description</span>}</td>
                          <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                            {session.fin_at ? formatMinutes(session.duree_minutes) : (
                              <span className="text-green-600 flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                En cours
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {session.facturable ? (
                              <span className="text-green-600 font-medium">Oui</span>
                            ) : (
                              <span className="text-gray-400">Non</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {session.facture ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                Facturé
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                En attente
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!session.facture && session.facturable && (
                                <button
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Facturer cette session"
                                >
                                  <FileText size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => handleSupprimerSession(session.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
        </div>
      )}

      {/* ─── Onglet Tâches (Kanban) ──────────────────────────────────────────── */}
      {onglet === 'taches' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Projet :</label>
            <select
              value={filtreProjetTaches}
              onChange={(e) => setFiltreProjetTaches(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {projets.map((p) => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>
          </div>

          {tachesLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Colonne À faire */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                    À faire
                    <span className="text-xs font-normal text-gray-400 bg-white px-2 py-0.5 rounded-full border">
                      {tachesAFaire.length}
                    </span>
                  </h3>
                  <button
                    onClick={() => setShowModalTache({ statut: 'a_faire', projetId: projetTaches })}
                    className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                    disabled={!projetTaches}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-2">
                  {tachesAFaire.map((tache) => (
                    <CarteTache
                      key={tache.id}
                      tache={tache}
                      onChangerStatut={handleChangerStatutTache}
                      onSupprimer={handleSupprimerTache}
                    />
                  ))}
                  {tachesAFaire.length === 0 && (
                    <p className="text-center text-xs text-gray-400 py-4">Aucune tâche</p>
                  )}
                </div>
              </div>

              {/* Colonne En cours */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-blue-700 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    En cours
                    <span className="text-xs font-normal text-blue-400 bg-white px-2 py-0.5 rounded-full border border-blue-100">
                      {tachesEnCours.length}
                    </span>
                  </h3>
                  <button
                    onClick={() => setShowModalTache({ statut: 'en_cours', projetId: projetTaches })}
                    className="p-1 text-blue-400 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors"
                    disabled={!projetTaches}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-2">
                  {tachesEnCours.map((tache) => (
                    <CarteTache
                      key={tache.id}
                      tache={tache}
                      onChangerStatut={handleChangerStatutTache}
                      onSupprimer={handleSupprimerTache}
                    />
                  ))}
                  {tachesEnCours.length === 0 && (
                    <p className="text-center text-xs text-blue-400 py-4">Aucune tâche</p>
                  )}
                </div>
              </div>

              {/* Colonne Terminé */}
              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-green-700 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    Terminé
                    <span className="text-xs font-normal text-green-400 bg-white px-2 py-0.5 rounded-full border border-green-100">
                      {tachesTerminees.length}
                    </span>
                  </h3>
                  <button
                    onClick={() => setShowModalTache({ statut: 'termine', projetId: projetTaches })}
                    className="p-1 text-green-400 hover:text-green-700 hover:bg-green-100 rounded transition-colors"
                    disabled={!projetTaches}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-2">
                  {tachesTerminees.map((tache) => (
                    <CarteTache
                      key={tache.id}
                      tache={tache}
                      onChangerStatut={handleChangerStatutTache}
                      onSupprimer={handleSupprimerTache}
                    />
                  ))}
                  {tachesTerminees.length === 0 && (
                    <p className="text-center text-xs text-green-400 py-4">Aucune tâche</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modales */}
      {showModalProjet && organisationId && (
        <ModalProjet
          organisationId={organisationId}
          onClose={() => setShowModalProjet(false)}
          onSubmit={handleAjouterProjet}
        />
      )}
      {showModalSession && projets.length > 0 && (
        <ModalSession
          projets={projets}
          userId={user?.id}
          onClose={() => setShowModalSession(false)}
          onSubmit={handleAjouterSession}
        />
      )}
      {showModalTache && (
        <ModalTache
          projetId={showModalTache.projetId}
          statutInitial={showModalTache.statut}
          onClose={() => setShowModalTache(null)}
          onSubmit={handleAjouterTache}
        />
      )}
    </div>
  );
};

// ─── Carte Tâche (Kanban) ─────────────────────────────────────────────────────

interface CarteTacheProps {
  tache: Tache;
  onChangerStatut: (id: string, statut: Tache['statut']) => Promise<void>;
  onSupprimer: (id: string) => Promise<void>;
}

const prioriteBadgeInline = (priorite: Tache['priorite']) => {
  const config: Record<string, { label: string; color: string }> = {
    basse: { label: 'Basse', color: 'bg-gray-100 text-gray-600' },
    normale: { label: 'Normale', color: 'bg-blue-100 text-blue-700' },
    haute: { label: 'Haute', color: 'bg-orange-100 text-orange-700' },
    urgente: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
  };
  const c = config[priorite] || config.normale;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${c.color}`}>
      {c.label}
    </span>
  );
};

const CarteTache: React.FC<CarteTacheProps> = ({ tache, onChangerStatut, onSupprimer }) => {
  const statutSuivant: Record<Tache['statut'], Tache['statut']> = {
    a_faire: 'en_cours',
    en_cours: 'termine',
    termine: 'a_faire',
  };

  const statutLabel: Record<Tache['statut'], string> = {
    a_faire: 'Démarrer',
    en_cours: 'Terminer',
    termine: 'Réouvrir',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 flex-1">{tache.titre}</p>
        <button
          onClick={() => onSupprimer(tache.id)}
          className="p-0.5 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
        >
          <X size={14} />
        </button>
      </div>
      {tache.description && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tache.description}</p>
      )}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {prioriteBadgeInline(tache.priorite)}
        {tache.heures_estimees && (
          <span className="text-xs text-gray-400">
            {tache.heures_reelles}h / {tache.heures_estimees}h
          </span>
        )}
        {tache.date_echeance && (
          <span className="text-xs text-gray-400 ml-auto">
            {new Date(tache.date_echeance).toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit' })}
          </span>
        )}
      </div>
      <button
        onClick={() => onChangerStatut(tache.id, statutSuivant[tache.statut])}
        className="mt-2 w-full text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 py-1 rounded transition-colors border border-gray-100 hover:border-blue-200"
      >
        {statutLabel[tache.statut]}
      </button>
    </div>
  );
};

export default TimeTrackingPage;
