import { typedSupabase } from '@/lib/supabaseClient';

// Types
type TeamMember = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'active' | 'pending' | 'inactive';
  lastActive: string | null;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
};

type Invitation = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'pending';
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  lastActive: null;
};

type InviteTeamMemberParams = {
  email: string;
  name: string;
  role: string;
  permissions: string[];
  organizationId: string;
  invitedById: string;
};

type InviteTeamMemberResult = {
  success: boolean;
  error?: string;
  invitation?: {
    email: string;
    organisation_id: string;
    invite_par: string;
    role: string;
    accepte: boolean;
    metadata: { name: string; permissions: string[] };
    cree_le: string;
  };
};

type GetOrganizationMembersResult = {
  members: (TeamMember | Invitation)[];
  error?: string;
};

// Utility function to handle errors
function handleSupabaseError(error: unknown, context: string): string {
  console.error(`Error in ${context}:`, error);
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}

/**
 * Inviter un nouveau membre d'équipe
 */
export const inviteTeamMember = async ({
  email,
  name,
  role,
  permissions,
  organizationId,
  invitedById,
}: InviteTeamMemberParams): Promise<InviteTeamMemberResult> => {
  try {
    // 1. Vérifier si l'utilisateur existe
    const { data: userData, error: userError } = await typedSupabase
      .from('profils')
      .select('id, email')
      .eq('email', email)
      .maybeSingle<{ id: string; email: string }>();

    if (userError) {
      return {
        success: false,
        error: handleSupabaseError(userError, 'checking existing user')
      };
    }

    // 2. Créer l'invitation
    const invitationData = {
      email,
      organisation_id: organizationId,
      invite_par: invitedById,
      role,
      accepte: false,
      metadata: { name, permissions },
      cree_le: new Date().toISOString(),
    };

    type InvitationData = typeof invitationData & { id: string };
    const { data: newInvitation, error: inviteError } = await typedSupabase
      .from('invitations_organisation')
      .insert([invitationData])
      .select()
      .single<InvitationData>();

    if (inviteError) {
      return {
        success: false,
        error: `Failed to create invitation: ${inviteError.message}`
      };
    }

    // 3. Si l'utilisateur existe, l'ajouter à l'organisation
    if (userData?.id) {
      try {
        // Vérifier si l'utilisateur est déjà membre
        type MemberData = { utilisateur_id: string };
        const { data: existingMember } = await typedSupabase
          .from('utilisateurs_organisations')
          .select('utilisateur_id')
          .eq('utilisateur_id', userData.id)
          .eq('organisation_id', organizationId)
          .maybeSingle<MemberData>();

        const memberData = {
          utilisateur_id: userData.id,
          organisation_id: organizationId,
          role,
          permissions,
          cree_le: new Date().toISOString(),
          mis_a_jour_le: new Date().toISOString(),
        };

        if (!existingMember) {
          // Ajouter l'utilisateur à l'organisation
          const { error: insertError } = await typedSupabase
            .from('utilisateurs_organisations')
            .insert([memberData])
            .select()
            .single();

          if (insertError) {
            console.warn('Invitation créée mais échec de l\'ajout à l\'organisation:', insertError);
          }
        } else {
          // Mettre à jour le membre existant
          const { error: updateError } = await typedSupabase
            .from('utilisateurs_organisations')
            .update({
              role,
              permissions,
              mis_a_jour_le: new Date().toISOString(),
            })
            .eq('utilisateur_id', userData.id)
            .eq('organisation_id', organizationId)
            .select()
            .single();

          if (updateError) {
            console.warn('Échec de la mise à jour du membre:', updateError);
          }
        }
      } catch (memberError) {
        console.error('Erreur inattendue lors de la gestion du membre:', memberError);
      }
    }

    return {
      success: true,
      invitation: newInvitation
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to send invitation: ${handleSupabaseError(error, 'inviteTeamMember')}`
    };
  }
};

/**
 * Obtenir tous les membres de l'organisation y compris les invitations en attente
 */
export const getOrganizationMembers = async (
  organizationId: string
): Promise<GetOrganizationMembersResult> => {
  try {
    // 1. Obtenir les membres actuels de l'organisation
    const { data: membersData, error: membersError } = await typedSupabase
      .from('utilisateurs_organisations')
      .select(`
        *,
        utilisateur:profils (
          id,
          email,
          name
        )
      `)
      .eq('organisation_id', organizationId);

    if (membersError) {
      return {
        members: [],
        error: handleSupabaseError(membersError, 'fetching organization members')
      };
    }

    // 2. Obtenir les invitations en attente
    const { data: pendingInvitations, error: invitesError } = await typedSupabase
      .from('invitations_organisation')
      .select('*')
      .eq('organisation_id', organizationId)
      .eq('accepte', false);

    if (invitesError) {
      return {
        members: [],
        error: handleSupabaseError(invitesError, 'fetching pending invitations')
      };
    }

    // 3. Formater les membres
    type MemberWithUser = {
      id: string;
      role: string;
      permissions: string[];
      cree_le: string;
      mis_a_jour_le: string;
      utilisateur: {
        id: string;
        email: string;
        name?: string;
      };
    };

    const formattedMembers: TeamMember[] = (membersData || []).map((member: MemberWithUser) => {
      const utilisateur = member.utilisateur || {};

      return {
        id: utilisateur.id || '',
        email: utilisateur.email || '',
        name: utilisateur.name || (utilisateur.email ? utilisateur.email.split('@')[0] : 'Utilisateur inconnu'),
        role: member.role || 'membre',
        status: 'active' as const,
        lastActive: null,
        permissions: Array.isArray(member.permissions) ? member.permissions : [],
        createdAt: member.cree_le || new Date().toISOString(),
        updatedAt: member.mis_a_jour_le || new Date().toISOString(),
      };
    });

    // 4. Formater les invitations
    type PendingInvitation = {
      id: string;
      email: string;
      role: string;
      metadata: {
        name?: string;
        permissions?: unknown;
      };
      cree_le: string;
      mis_a_jour_le?: string;
    };

    const formattedInvitations: Invitation[] = (pendingInvitations || []).map((invite: PendingInvitation) => {
      const metadata = invite.metadata || {};

      return {
        id: `invite-${invite.id}`,
        email: invite.email,
        name: metadata.name || invite.email.split('@')[0],
        role: invite.role,
        status: 'pending',
        permissions: Array.isArray(metadata.permissions) ? metadata.permissions : [],
        createdAt: invite.cree_le,
        updatedAt: invite.mis_a_jour_le || invite.cree_le,
        lastActive: null
      };
    });

    return { members: [...formattedMembers, ...formattedInvitations] };
  } catch (error) {
    return {
      members: [],
      error: `Failed to fetch organization members: ${handleSupabaseError(error, 'getOrganizationMembers')}`
    };
  }
};
