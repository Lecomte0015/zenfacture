-- Migration : Corrige une faille CRITIQUE d'auto-élévation de privilèges
-- (audit sécurité 2026-07-09)
--
-- PROBLÈME :
-- La policy "profils_update_own" (USING id = auth.uid()) autorise un
-- utilisateur authentifié à modifier N'IMPORTE QUELLE colonne de SA PROPRE
-- ligne dans `profils`, y compris `role`, `is_active`, `blocked_at`,
-- `blocked_reason`, `plan_abonnement`, `subscription_status` et les colonnes
-- Stripe. Un utilisateur malveillant pouvait donc, depuis la console du
-- navigateur, exécuter :
--
--   supabase.from('profils').update({ role: 'super_admin', is_active: true })
--     .eq('id', (await supabase.auth.getUser()).data.user.id)
--
-- ...et s'auto-promouvoir administrateur, ou se donner un abonnement payant
-- gratuitement, sans jamais passer par Stripe ni par un vrai admin.
--
-- Par ailleurs, aucune policy RLS n'autorisait un admin légitime à lire ou
-- modifier la ligne d'un AUTRE utilisateur : `AdminUsersPage.tsx` fait des
-- `.update({ role, is_active, ... }).eq('id', userId)` côté client sur des
-- lignes qui ne sont pas les siennes — bloqué silencieusement par RLS pour
-- tout le monde, y compris pour un vrai admin. Le back-office utilisateurs
-- était donc à la fois cassé fonctionnellement ET la faille d'escalade
-- restait ouverte.
--
-- CORRECTION (deux volets, même principe que get_user_org_ids() déjà
-- utilisé dans ce projet : fonction SECURITY DEFINER pour éviter toute
-- récursion RLS, cf. 20260219100000_fix_rls_infinite_recursion.sql) :
--
-- 1. Un trigger BEFORE UPDATE fige les colonnes sensibles à leur valeur
--    précédente dès que l'appelant modifie SA PROPRE ligne (sauf le
--    service_role, utilisé par les Edge Functions / webhooks Stripe) —
--    personne ne peut jamais s'auto-promouvoir, quelle que soit la policy
--    RLS en vigueur par ailleurs. C'est la barrière qui compte vraiment.
--
-- 2. Une fonction public.is_admin() + deux policies RLS additionnelles
--    permettent à un admin/super_admin réel de lire et modifier les lignes
--    des AUTRES utilisateurs (nécessaire pour que le back-office fonctionne),
--    tout en laissant le trigger du point 1 bloquer toute tentative
--    d'auto-modification de ses propres colonnes sensibles.

-- ── 1. Fonction admin (SECURITY DEFINER, pas de récursion RLS) ──────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profils
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

-- ── 2. Policies RLS : un admin peut lire/modifier les autres utilisateurs ──
DROP POLICY IF EXISTS "profils_select_admin" ON public.profils;
CREATE POLICY "profils_select_admin" ON public.profils
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "profils_update_admin" ON public.profils;
CREATE POLICY "profils_update_admin" ON public.profils
  FOR UPDATE USING (public.is_admin());

-- ── 3. Trigger : personne ne peut jamais changer ses PROPRES colonnes
--       sensibles, admin ou pas (seul le service_role le peut) ─────────────
CREATE OR REPLACE FUNCTION public.prevent_profil_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Edge Functions / webhooks (ex: stripe-webhook) : accès total nécessaire.
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Un utilisateur (admin ou non) ne peut jamais modifier ces colonnes sur
  -- SA PROPRE ligne — évite toute auto-élévation, y compris par un admin
  -- qui voudrait se donner un rôle supérieur ou se débloquer lui-même.
  IF NEW.id = auth.uid() THEN
    NEW.role := OLD.role;
    NEW.is_active := OLD.is_active;
    NEW.blocked_at := OLD.blocked_at;
    NEW.blocked_reason := OLD.blocked_reason;
    NEW.plan_abonnement := OLD.plan_abonnement;
    NEW.subscription_status := OLD.subscription_status;
    NEW.stripe_customer_id := OLD.stripe_customer_id;
    NEW.stripe_subscription_id := OLD.stripe_subscription_id;
    NEW.stripe_price_id := OLD.stripe_price_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_profil_privilege_escalation ON public.profils;
CREATE TRIGGER trg_prevent_profil_privilege_escalation
  BEFORE UPDATE ON public.profils
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profil_privilege_escalation();

-- NOTE : pour promouvoir le tout premier super_admin (poule et œuf, personne
-- n'est admin au départ), passer par le SQL Editor Supabase directement :
--   UPDATE public.profils SET role = 'super_admin' WHERE email = 'vous@exemple.ch';
-- (exécuté avec les droits postgres, donc pas soumis au trigger ci-dessus).
