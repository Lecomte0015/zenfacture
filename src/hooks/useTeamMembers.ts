import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { TeamMember as SupabaseTeamMember } from '@/types/supabase.types';
import { inviteTeamMember, getOrganizationMembers } from '@/services/teamService';

// Local type that matches our needs
interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'active' | 'pending' | 'inactive';
  lastActive: string | null;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

interface UseTeamMembersResult {
  members: TeamMember[];
  loading: boolean;
  error: string | null;
  addTeamMember: (email: string, name: string, role: string, permissions: string[]) => Promise<{ success: boolean; error?: string }>;
  refresh: () => Promise<void>;
}

export const useTeamMembers = (): UseTeamMembersResult => {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  type UserWithOrg = typeof user & { organization_id?: string };
  const organizationId = (user as UserWithOrg)?.organization_id;
  const currentUserId = user?.id;

  const fetchTeamMembers = useCallback(async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { members: fetchedMembers, error: fetchError } = await getOrganizationMembers(organizationId);
      
      if (fetchError) {
        throw new Error(fetchError);
      }

      // Map the Supabase team members to our local TeamMember type
      const mappedMembers: TeamMember[] = (fetchedMembers || []).map(member => ({
        id: member.id,
        email: member.email,
        name: member.name,
        role: member.role,
        status: member.status as 'active' | 'pending' | 'inactive',
        lastActive: member.lastActive,
        permissions: member.permissions || [],
        createdAt: member.createdAt || new Date().toISOString(),
        updatedAt: member.updatedAt || new Date().toISOString(),
      }));

      const filteredMembers = mappedMembers.filter(member => member.id !== currentUserId);
      setMembers(filteredMembers);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur inconnue est survenue';
      console.error('Error fetching team members:', err);
      setError(`Erreur lors du chargement des membres de l'équipe: ${errorMessage}`);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId, currentUserId]);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  const addTeamMember = async (
    email: string, 
    name: string, 
    role: string, 
    permissions: string[]
  ): Promise<{ success: boolean; error?: string }> => {
    if (!organizationId) {
      return { success: false, error: 'Organisation non identifiée' };
    }
    
    if (!currentUserId) {
      return { success: false, error: 'Utilisateur non connecté' };
    }
    
    if (!email || !name || !role) {
      return { success: false, error: 'Tous les champs sont obligatoires' };
    }

    try {
      const result = await inviteTeamMember({
        email: email.trim(),
        name: name.trim(),
        role: role.trim(),
        permissions,
        organizationId,
        invitedById: currentUserId,
      });

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'invitation du membre');
      }

      await fetchTeamMembers();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('Error adding team member:', err);
      return { success: false, error: errorMessage };
    }
  };

  return {
    members,
    loading,
    error,
    addTeamMember,
    refresh: fetchTeamMembers,
  };
};
