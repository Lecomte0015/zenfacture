-- Suite de l'audit : ces fonctions ne sont que des triggers internes (mise à
-- jour de updated_at, création de profil à l'inscription, garde-fou anti
-- élévation de privilège). Elles n'ont aucune raison d'être appelables
-- directement en RPC par un visiteur ou un utilisateur connecté
-- (/rest/v1/rpc/handle_new_user, etc.) — Postgres accorde EXECUTE à PUBLIC
-- par défaut à la création, on le retire explicitement ici.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_profil_privilege_escalation() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_platform_settings_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_stock_articles_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_payment_links_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_marques_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_boutique_connexions_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_crm_opportunites_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_fournisseurs_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_admin_reminders_updated_at() FROM PUBLIC;
