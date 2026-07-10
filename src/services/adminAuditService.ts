import { supabase } from '@/lib/supabaseClient';
import type { Json } from '@/types/database.types';

export interface AdminAuditEntry {
  id: string;
  admin_id: string | null;
  admin_email: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Enregistre une action administrative dans `admin_audit_log` (voir migration
 * 20260710000300_admin_settings_and_audit_log.sql). Appelé juste après chaque
 * action admin réussie (blocage/déblocage/suppression d'utilisateur,
 * changement de rôle, modification de la configuration...).
 *
 * Volontairement silencieux en cas d'échec (log manqué) : une erreur ici ne
 * doit jamais bloquer l'action admin elle-même, qui a déjà réussi au moment
 * où cette fonction est appelée.
 */
export const logAdminAction = async (
  action: string,
  targetType: string,
  targetId?: string | null,
  details?: Record<string, unknown>
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('admin_audit_log').insert([{
      admin_id: user?.id || null,
      admin_email: user?.email || null,
      action,
      target_type: targetType,
      target_id: targetId ?? null,
      details: (details ?? null) as Json | null,
    }]);

    if (error) {
      console.error('Erreur lors de l\'enregistrement du journal d\'audit :', error);
    }
  } catch (error) {
    console.error('Erreur inattendue lors de l\'enregistrement du journal d\'audit :', error);
  }
};

/**
 * Récupère les entrées du journal d'audit (les plus récentes d'abord),
 * avec pagination simple. Restreint aux admins/super_admins par la policy
 * RLS `admin_audit_log_select_admin` (public.is_admin()).
 */
export const getAdminAuditLog = async (
  limit: number = 100,
  offset: number = 0
): Promise<AdminAuditEntry[]> => {
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Erreur lors de la récupération du journal d\'audit :', error);
    throw error;
  }

  return (data || []) as unknown as AdminAuditEntry[];
};
