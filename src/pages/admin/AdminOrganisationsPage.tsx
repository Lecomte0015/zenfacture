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
  nom_organisation: string;
  created_at: string;
  updated_at: string;
  invoices_count?: number;
  users_count?: number;
}

const AdminOrganisationsPage: React.FC = () => {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadOrganisations();
  }, []);

  const loadOrganisations = async () => {
    try {
      setLoading(true);

      // Charger les organisations
      const { data: orgsData, error: orgsError } = await supabase
        .from('organisations')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;

      // Charger les compteurs pour chaque organisation
      const orgsWithStats = await Promise.all(
        (orgsData || []).map(async (org) => {
          // Compter les factures
          const { count: invoicesCount } = await supabase
            .from('factures')
            .select('*', { count: 'exact', head: true })
            .eq('organisation_id', org.id);

          // Compter les utilisateurs
          const { count: usersCount } = await supabase
            .from('utilisateurs_organisations')
            .select('*', { count: 'exact', head: true })
            .eq('organisation_id', org.id);

          return {
            ...org,
            invoices_count: invoicesCount || 0,
            users_count: usersCount || 0,
          };
        })
      );

      setOrganisations(orgsWithStats);
    } catch (error) {
      console.error('Erreur lors du chargement des organisations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage des organisations
  const filteredOrganisations = organisations.filter((org) => {
    return org.nom_organisation?.toLowerCase().includes(searchTerm.toLowerCase());
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
                        {org.nom_organisation || 'Sans nom'}
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
                    {format(new Date(org.created_at), 'dd MMM yyyy', { locale: fr })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {format(new Date(org.updated_at), 'dd MMM yyyy', { locale: fr })}
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
