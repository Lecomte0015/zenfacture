-- Programme de parrainage intégré (remplace le process manuel par email).
--
-- Principe : chaque profil a un code de parrainage unique (referral_code),
-- partageable via un lien du type https://zenfacture.ch/inscription?ref=CODE.
-- À l'inscription, le code éventuellement transmis est stocké
-- (referred_by_code) et résolu vers l'utilisateur parrain
-- (referred_by_profile_id). Quand le filleul devient payant pour la première
-- fois (checkout.session.completed dans supabase/functions/stripe-webhook),
-- le parrain reçoit automatiquement un crédit Stripe équivalent à un mois de
-- son abonnement (voir stripe-webhook/index.ts). referral_reward_granted_at
-- sur la ligne du FILLEUL sert de garde-fou pour ne récompenser qu'une fois.

ALTER TABLE public.profils
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_code TEXT,
  ADD COLUMN IF NOT EXISTS referred_by_profile_id UUID REFERENCES public.profils(id),
  ADD COLUMN IF NOT EXISTS referral_reward_granted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profils_referral_code ON public.profils(referral_code);
CREATE INDEX IF NOT EXISTS idx_profils_referred_by_profile_id ON public.profils(referred_by_profile_id);

COMMENT ON COLUMN public.profils.referral_code IS 'Code de parrainage unique de cet utilisateur, à partager (?ref=CODE)';
COMMENT ON COLUMN public.profils.referred_by_code IS 'Code de parrainage saisi/transmis lors de l''inscription de cet utilisateur';
COMMENT ON COLUMN public.profils.referred_by_profile_id IS 'Profil du parrain, résolu depuis referred_by_code à l''inscription';
COMMENT ON COLUMN public.profils.referral_reward_granted_at IS 'Date à laquelle le parrain a été crédité pour CE filleul (NULL = pas encore/jamais)';

-- Backfill : génère un code de parrainage pour tous les profils déjà existants
-- (sinon les clients actuels n'auraient aucun lien de parrainage à partager).
DO $$
DECLARE
  r RECORD;
  v_code TEXT;
BEGIN
  FOR r IN SELECT id FROM public.profils WHERE referral_code IS NULL LOOP
    LOOP
      v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profils WHERE referral_code = v_code);
    END LOOP;
    UPDATE public.profils SET referral_code = v_code WHERE id = r.id;
  END LOOP;
END $$;

-- Étend le trigger d'inscription (dernière version : 20260714000000_trial_dates_on_signup.sql)
-- pour générer le code de parrainage du nouvel utilisateur et résoudre son
-- éventuel parrain, sans toucher au reste de la logique (profil + organisation).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
    v_code TEXT;
    v_referred_by_code TEXT;
    v_referrer_id UUID;
BEGIN
    -- Génère un code de parrainage unique pour ce nouvel utilisateur
    LOOP
        v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profils WHERE referral_code = v_code);
    END LOOP;

    -- Code de parrainage éventuellement transmis via ?ref=CODE à l'inscription
    -- (voir src/pages/RegisterPage.tsx et src/context/AuthContext.tsx)
    v_referred_by_code := NULLIF(NEW.raw_user_meta_data->>'referred_by_code', '');
    IF v_referred_by_code IS NOT NULL THEN
        SELECT id INTO v_referrer_id FROM public.profils WHERE referral_code = v_referred_by_code;
    END IF;

    -- Créer le profil utilisateur (avec période d'essai de 15 jours)
    INSERT INTO public.profils (
        id, email, name, trial_start_date, trial_end_date, created_at, updated_at,
        referral_code, referred_by_code, referred_by_profile_id
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NOW(),
        NOW() + INTERVAL '15 days',
        NOW(),
        NOW(),
        v_code,
        v_referred_by_code,
        v_referrer_id
    )
    ON CONFLICT (id) DO NOTHING;

    -- Créer une organisation par défaut
    INSERT INTO public.organisations (nom, proprietaire_id, created_at, updated_at)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'name', 'Mon entreprise') || ' Organisation',
        NEW.id,
        NOW(),
        NOW()
    )
    RETURNING id INTO org_id;

    -- Lier l'utilisateur à l'organisation
    INSERT INTO public.utilisateurs_organisations (organisation_id, utilisateur_id, role, cree_le)
    VALUES (org_id, NEW.id, 'admin', NOW())
    ON CONFLICT (organisation_id, utilisateur_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS 'Trigger automatique: crée le profil (avec essai 15 jours + code de parrainage), l''organisation et le lien admin lors de l''inscription';

-- Fonction dédiée pour que chaque utilisateur consulte la liste de ses
-- filleuls, sans exposer les colonnes sensibles (stripe_customer_id, etc.)
-- via une éventuelle policy RLS trop large sur `profils`.
CREATE OR REPLACE FUNCTION public.get_mes_filleuls()
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    created_at TIMESTAMPTZ,
    plan_abonnement TEXT,
    subscription_status TEXT,
    referral_reward_granted_at TIMESTAMPTZ
) AS $$
    SELECT id, name, email, created_at, plan_abonnement, subscription_status, referral_reward_granted_at
    FROM public.profils
    WHERE referred_by_profile_id = auth.uid()
    ORDER BY created_at DESC;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_mes_filleuls TO authenticated;

-- La service_role (Edge Function stripe-webhook) doit pouvoir lire/mettre à
-- jour referred_by_profile_id / referral_reward_granted_at pour appliquer la
-- récompense — déjà couvert par la policy "service_role_profils_stripe"
-- (FOR ALL TO service_role) créée dans 20260709000001_stripe_subscriptions.sql.
