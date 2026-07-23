/**
 * Service Programme de parrainage — ZenFacture
 *
 * Chaque utilisateur a un code de parrainage unique (`profils.referral_code`,
 * généré automatiquement à l'inscription — voir migration
 * 20260723000000_referral_program.sql). Il le partage via un lien
 * `/auth/register?ref=CODE`. Quand un filleul inscrit avec ce lien devient
 * payant pour la première fois, le parrain est automatiquement crédité d'un
 * mois de son abonnement (voir supabase/functions/stripe-webhook/index.ts,
 * fonction applyReferralRewardIfNeeded).
 */

import { supabase } from '../lib/supabaseClient';

export interface Filleul {
  id: string;
  name: string | null;
  email: string | null;
  created_at: string;
  plan_abonnement: string | null;
  subscription_status: string | null;
  referral_reward_granted_at: string | null;
}

/**
 * Récupère le code de parrainage du profil courant (généré automatiquement
 * à l'inscription, y compris pour les comptes déjà existants — backfill fait
 * en base par la migration).
 */
export async function getMonCodeParrainage(): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profils')
    .select('referral_code')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Erreur lors de la récupération du code de parrainage:', error);
    return null;
  }

  return data?.referral_code ?? null;
}

/**
 * Liste des filleuls (utilisateurs inscrits via le lien de parrainage de
 * l'utilisateur courant), via la fonction RPC dédiée `get_mes_filleuls`
 * (évite d'exposer les colonnes sensibles de `profils` via une policy RLS).
 */
export async function getMesFilleuls(): Promise<Filleul[]> {
  const { data, error } = await supabase.rpc('get_mes_filleuls');
  if (error) {
    console.error('Erreur lors de la récupération des filleuls:', error);
    return [];
  }
  return (data as Filleul[]) || [];
}

/**
 * Construit le lien de parrainage complet à partager.
 */
export function buildLienParrainage(code: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://zenfacture.ch';
  // /auth/register directement : /register redirige via <Navigate replace>,
  // qui perdrait le paramètre ?ref= au passage.
  return `${base}/auth/register?ref=${code}`;
}
