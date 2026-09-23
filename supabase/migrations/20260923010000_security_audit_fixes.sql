-- Audit de sécurité du 23.09.2026 — 3 failles trouvées via l'advisor Supabase.

-- 1) CRITIQUE : la table `expenses` (table anglaise inutilisée, doublon de
--    `depenses` qui elle est bien protégée) n'avait AUCUNE Row Level Security.
--    anon ET authenticated avaient les droits CRUD complets dessus au niveau
--    Postgres : n'importe qui sur Internet, avec la simple clé publique
--    anon du frontend, pouvait lire/modifier/supprimer cette table via l'API
--    REST. Table vide actuellement (aucune fuite de données constatée), mais
--    le trou était bien exploitable. On verrouille avec le même modèle que
--    `depenses` (scoping par organisation).
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY expenses_select ON public.expenses
  FOR SELECT USING (organisation_id IN (SELECT get_user_org_ids()));

CREATE POLICY expenses_insert ON public.expenses
  FOR INSERT WITH CHECK (organisation_id IN (SELECT get_user_org_ids()));

CREATE POLICY expenses_update ON public.expenses
  FOR UPDATE USING (organisation_id IN (SELECT get_user_org_ids()));

CREATE POLICY expenses_delete ON public.expenses
  FOR DELETE USING (organisation_id IN (SELECT get_user_org_ids()));

-- 2) CRITIQUE : la vue `payment_links_with_invoice` était en SECURITY DEFINER.
--    Une vue SECURITY DEFINER s'exécute avec les droits de son créateur et
--    IGNORE complètement les policies RLS des tables qu'elle interroge
--    (`payment_links`, `factures`). Résultat réel : n'importe quel visiteur
--    non connecté (anon a SELECT sur la vue) pouvait récupérer via l'API REST
--    la liste de TOUS les liens de paiement de TOUTES les organisations de la
--    plateforme — nom client, email client, montant, lien de paiement,
--    identifiant de transaction externe — alors que `payment_links` elle-même
--    est correctement isolée par organisation. Fuite de données inter-clients
--    réelle et déjà exploitable, corrigée en repassant la vue en
--    SECURITY INVOKER (respecte enfin les RLS des tables sous-jacentes).
ALTER VIEW public.payment_links_with_invoice SET (security_invoker = true);

-- 3) MOYEN : 15 fonctions (dont plusieurs SECURITY DEFINER sensibles :
--    creer_organisation, handle_new_user, get_mes_filleuls, generer_cle_api,
--    archiver_document...) n'avaient pas de search_path figé. Une fonction
--    SECURITY DEFINER sans search_path fixe est vulnérable à une attaque par
--    détournement de schéma (un attaquant crée un objet du même nom dans un
--    schéma qu'il contrôle et le place avant `public` dans le search_path de
--    sa session). On fige le search_path sur chacune.
ALTER FUNCTION public.update_stock_articles_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_payment_links_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
ALTER FUNCTION public.generer_cle_api() SET search_path = public, pg_temp;
ALTER FUNCTION public.archiver_document(text, uuid, uuid, text, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_marques_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_boutique_connexions_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_crm_opportunites_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_fournisseurs_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.creer_organisation(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_user_on_trial(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_remaining_trial_days(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_admin_reminders_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_mes_filleuls() SET search_path = public, pg_temp;
