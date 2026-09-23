import React, { useEffect, useState } from 'react';
import {
  Search,
  Building2,
  Calendar,
  FileText,
  Users as UsersIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Organisation {
  id: string;
  // La colonne réelle en base est `nom` (pas `nom_organisation` — celle-ci
  // n'existe pas dans la table, ce qui faisait toujours afficher "Sans nom").
  nom: string | null;
  created_at: string | null;
  updated_at: string | null;
  invoices_count?: number;
  users_count?: number;
}

const AdminOrganisationsPage: React.FC = () => {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadOrganisations();
  }, []);

  const loadOrganisations = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      // Au chargement direct de cette page (F5 sur /dashboard/admin/organisations),
      // le composant se monte et lance sa requête avant que le client Supabase ait
      // fini de récupérer/rafraîchir la session (l'app a même vu un timeout de 5s
      // sur ce parcours — voir AuthContext.createUserFromSupabase). La requête part
      // alors sans jeton valide, RLS la traite comme anonyme et renvoie 0 ligne
      // sans erreur — d'où le "Aucune organisation trouvée" alors que les données
      // existent bien. On force l'attente de la session avant d'interroger.
      await supabase.auth.getSession();

      // Charger les organisations
      const { data: orgsData, error: orgsError } = await supabase
        .from('organisations')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;

      // Compteurs : avant, on envoyait 2 requêtes HEAD PAR organisation (24
      // requêtes en parallèle pour 12 organisations). En prod, ces requêtes HEAD
      // échouaient systématiquement au niveau réseau ("Échec du chargement de
      // Fetch" dans la console, probablement le service worker PWA qui gère mal
      // les requêtes HEAD sous forte concurrence) — une seule requête rejetée
      // suffisait à faire échouer tout le Promise.all et donc TOUTE la liste
      // (d'où "Aucune organisation trouvée" alors que la requête principale
      // au-dessus réussissait très bien). On regroupe maintenant en 2 requêtes
      // au total, et un échec de ces compteurs n'empêche plus d'afficher la
      // liste des organisations (repli sur 0).
      let invoicesByOrg = new Map<string, number>();
      let usersByOrg = new Map<string, number>();
      try {
        const orgIds = (orgsData || []).map((org) => org.id);
        const [{ data: facturesData }, { data: uoData }] = await Promise.all([
          supabase.from('factures').select('organisation_id').in('organisation_id', orgIds),
          supabase.from('utilisateurs_organisations').select('organisation_id').in('organisation_id', orgIds),
        ]);
        (facturesData || []).forEach((f: { organisation_id: string | null }) => {
          if (!f.organisation_id) return;
          invoicesByOrg.set(f.organisation_id, (invoicesByOrg.get(f.organisation_id) || 0) + 1);
        });
        (uoData || []).forEach((u: { organisation_id: string | null }) => {
          if (!u.organisation_id) return;
          usersByOrg.set(u.organisation_id, (usersByOrg.get(u.organisation_id) || 0) + 1);
        });
      } catch (statsError) {
        console.error('Erreur lors du chargement des compteurs (liste affichée quand même):', statsError);
      }

      const orgsWithStats: Organisation[] = (orgsData || []).map((org) => ({
        id: org.id,
        nom: org.nom,
        created_at: org.created_at,
        updated_at: org.updated_at,
        invoices_count: invoicesByOrg.get(org.id) || 0,
        users_count: usersByOrg.get(org.id) || 0,
      }));

      setOrganisations(orgsWithStats);
    } catch (error) {
      console.error('Erreur lors du chargement des organisations:', error);
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage des organisations
  const filteredOrganisations = organisations.filter((org) => {
    return (org.nom || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des organisations</h1>
        <p className="text-gray-600 mt-2">
          {filteredOrganisations.length} organisation{filteredOrganisations.length > 1 ? 's' : ''} trouvée{filteredOrganisations.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Erreur de chargement (RLS, réseau, etc.) — visible au lieu d'être juste loguée en console */}
      {loadError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded mb-6">
          <p className="text-sm text-red-700">
            Erreur lors du chargement des organisations : {loadError}
          </p>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une organisation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Organisation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statistiques
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Création
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dernière MAJ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrganisations.map((org) => (
              <tr key={org.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {org.nom || 'Sans nom'}
                      </div>
                      <div className="text-sm text-gray-500">ID: {org.id.slice(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {org.invoices_count || 0} factures
                    </div>
                    <div className="flex items-center">
                      <UsersIcon className="w-4 h-4 mr-1" />
                      {org.users_count || 0} utilisateurs
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {org.created_at ? format(new Date(org.created_at), 'dd MMM yyyy', { locale: fr }) : '—'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {org.updated_at ? format(new Date(org.updated_at), 'dd MMM yyyy', { locale: fr }) : '—'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrganisations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucune organisation trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrganisationsPage;
