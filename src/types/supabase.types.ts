import { Database } from './database.types';

export type Tables = Database['public']['Tables'];
export type Enums = Database['public']['Enums'];

export type OrganizationInvitation = Tables['organization_invitations']['Row'] & {
  metadata: {
    name?: string;
    permissions?: string[];
  } | null;
};

export type OrganizationMember = Tables['organization_members']['Row'] & {
  user: Tables['users']['Row'];
};

export type UserProfile = Tables['users']['Row'] & {
  name?: string;
  avatar_url?: string;
};

export type TeamMember = {
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

export type InviteTeamMemberParams = {
  email: string;
  name: string;
  role: string;
  permissions: string[];
  organizationId: string;
  invitedById: string;
};

export type GetOrganizationMembersResult = {
  members: TeamMember[];
  error?: string;
};

export type InviteTeamMemberResult = {
  success: boolean;
  invitation?: OrganizationInvitation;
  error?: string;
};
