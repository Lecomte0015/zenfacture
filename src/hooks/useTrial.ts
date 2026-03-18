import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

// Types
type PlanKey = 'FREE' | 'ESSENTIEL' | 'ESSOR';

type Features = {
  invoices: { limit: number };
  clients: { limit: number };
  team: boolean;
  api: boolean;
  reminders: boolean;
  export: boolean;
  expenses: boolean;
  reports: boolean;
};

interface PlanDefinition {
  key: PlanKey;
  features: Features;
}

// Plans et fonctionnalités
export const PLANS: Record<PlanKey, PlanDefinition> = {
  FREE: {
    key: 'FREE',
    features: {
      invoices: { limit: 5 },
      clients: { limit: 3 },
      team: false,
      api: false,
      reminders: false,
      export: false,
      expenses: true,
      reports: true,
    }
  },
  ESSENTIEL: {
    key: 'ESSENTIEL',
    features: {
      invoices: { limit: 50 },
      clients: { limit: 20 },
      team: true,
      api: false,
      reminders: true,
      export: true,
      expenses: true,
      reports: true,
    }
  },
  ESSOR: {
    key: 'ESSOR',
    features: {
      invoices: { limit: Infinity },
      clients: { limit: Infinity },
      expenses: true,
      reports: true,
      team: true,
      api: true,
      reminders: true,
      export: true,
    }
  }
};

export interface TrialStatus {
  // État de l'essai
  isOnTrial: boolean;
  daysRemaining: number;
  trialEndDate: Date | null;
  trialStartDate: Date | null;
  isTrialExpired: boolean;
  trialPercentageCompleted: number;
  formattedTrialEndDate: string | null;
  
  // Informations sur l'abonnement
  currentPlan: PlanKey;
  hasActiveSubscription: boolean;
  subscriptionEndDate: Date | null;
  
  // Fonctions
  refreshTrialStatus: () => Promise<void>;
  canAccessFeature: (featureKey: string, options?: any) => boolean;
  getFeatureLimit: (featureKey: string) => number | boolean | null;
}

/**
 * Hook personnalisé pour gérer la logique de la période d'essai
 * @returns {TrialStatus} État actuel de la période d'essai
 */
const useTrial = (): TrialStatus => {
  const { user } = useAuth();
  const [trialStatus, setTrialStatus] = useState<Omit<TrialStatus, 'refreshTrialStatus' | 'canAccessFeature' | 'getFeatureLimit'>>({
    isOnTrial: false,
    daysRemaining: 0,
    trialEndDate: null,
    trialStartDate: null,
    isTrialExpired: false,
    hasActiveSubscription: false,
    trialPercentageCompleted: 0,
    formattedTrialEndDate: null,
    currentPlan: 'FREE',
    subscriptionEndDate: null,
  });

  /**
   * Formate une date en français
   */
  const formatDate = useCallback((date: Date | null): string | null => {
    if (!date) return null;
    
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date));
  }, []);

  /**
   * Vérifie si une fonctionnalité est accessible
   */
  const canAccessFeature = useCallback((featureKey: string, options?: any): boolean => {
    // Pendant la période d'essai, toutes les fonctionnalités sont accessibles
    if (trialStatus.isOnTrial && !trialStatus.isTrialExpired) {
      return true;
    }

    // Si l'utilisateur a un abonnement actif, vérifier les fonctionnalités du plan
    if (trialStatus.hasActiveSubscription) {
      const plan = PLANS[trialStatus.currentPlan];
      if (!plan) return false;

      const feature = plan.features[featureKey as keyof typeof plan.features];
      
      if (feature === undefined) return false;
      
      if (typeof feature === 'object' && 'limit' in feature) {
        if (options?.currentUsage !== undefined) {
          return options.currentUsage < feature.limit;
        }
        return true;
      }
      
      return Boolean(feature);
    }

    // Pour les utilisateurs gratuits (sans abonnement)
    const freePlan = PLANS.FREE;
    const feature = freePlan.features[featureKey as keyof typeof freePlan.features];
    
    if (feature === undefined) return false;
    
    if (typeof feature === 'object' && 'limit' in feature) {
      if (options?.currentUsage !== undefined) {
        return options.currentUsage < feature.limit;
      }
      return true;
    }
    
    return Boolean(feature);
  }, [trialStatus]);

  /**
   * Récupère la limite d'une fonctionnalité
   */
  const getFeatureLimit = useCallback((featureKey: string): number | boolean | null => {
    // Pendant l'essai, retourne null (illimité)
    if (trialStatus.isOnTrial && !trialStatus.isTrialExpired) {
      return null;
    }

    const plan = PLANS[trialStatus.currentPlan];
    if (!plan) return false;

    const feature = plan.features[featureKey as keyof typeof plan.features];
    if (!feature) return false;
    
    return typeof feature === 'object' && 'limit' in feature ? feature.limit : feature;
  }, [trialStatus]);

  /**
   * Rafraîchit le statut de la période d'essai
   */
  const refreshTrialStatus = useCallback(async () => {
    if (!user) return;

    try {
      // Récupérer les informations d'abonnement depuis le profil utilisateur
      // Note: les tables 'subscriptions' et 'user_trials' n'existent pas encore,
      // on utilise les métadonnées utilisateur et le profil comme fallback
      let subscriptionData: any = null;
      let trialData: any = null;

      try {
        const { data } = await supabase
          .from('profils')
          .select('plan_abonnement, trial_start_date, trial_end_date')
          .eq('id', user.id)
          .maybeSingle();

        if (data) {
          // Mapper les données du profil vers le format attendu
          if (data.plan_abonnement && data.plan_abonnement !== 'essentiel') {
            subscriptionData = { current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() };
          }
          if (data.trial_start_date && data.trial_end_date) {
            trialData = { started_at: data.trial_start_date, ends_at: data.trial_end_date };
          }
        }
      } catch {
        // Table profils might not match schema, use user metadata as fallback
        const metadata = user.user_metadata as any;
        if (metadata?.trial_start_date && metadata?.trial_end_date) {
          trialData = { started_at: metadata.trial_start_date, ends_at: metadata.trial_end_date };
        }
      }

      const hasActiveSubscription = !!subscriptionData &&
        new Date(subscriptionData.current_period_end) > new Date();

      const now = new Date();
      let isOnTrial = false;
      let trialEndDate = null;
      let trialStartDate = null;
      let daysRemaining = 0;
      let isTrialExpired = false;
      let trialPercentageCompleted = 0;

      if (trialData) {
        trialStartDate = new Date(trialData.started_at);
        trialEndDate = new Date(trialData.ends_at);
        const diffTime = trialEndDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        isOnTrial = daysRemaining > 0 && !hasActiveSubscription;
        isTrialExpired = !isOnTrial && trialEndDate !== null;
        
        // Calculer le pourcentage d'avancement
        const trialDuration = trialEndDate.getTime() - trialStartDate.getTime();
        const elapsedTime = now.getTime() - trialStartDate.getTime();
        trialPercentageCompleted = Math.min(
          100,
          Math.max(0, (elapsedTime / trialDuration) * 100)
        );
      }

      setTrialStatus({
        isOnTrial,
        daysRemaining: Math.max(0, daysRemaining),
        trialEndDate,
        trialStartDate,
        isTrialExpired,
        hasActiveSubscription,
        trialPercentageCompleted,
        formattedTrialEndDate: formatDate(trialEndDate),
        currentPlan: hasActiveSubscription ? 'ESSENTIEL' : 'FREE',
        subscriptionEndDate: hasActiveSubscription ? new Date(subscriptionData.current_period_end) : null,
      });

      // Note: trial reminders désactivés - tables trial_reminders pas encore créées
    } catch (error) {
      console.error('Erreur lors de la vérification du statut de l\'essai :', error);
    }
  }, [user, formatDate]);

  /**
   * Vérifie et envoie les rappels d'essai si nécessaire
   */
  const checkAndSendTrialReminders = useCallback(async (userId: string, daysRemaining: number, trialEndDate: Date | null) => {
    if (!trialEndDate) return;

    try {
      // Vérifier si un rappel a déjà été envoyé
      const { data: reminderData, error: reminderError } = await supabase
        .from('trial_reminders')
        .select('*')
        .eq('user_id', userId)
        .eq('days_remaining', daysRemaining)
        .single();

      // PGRST116 = Aucune ligne trouvée (ce qui est attendu)
      if (reminderError && reminderError.code !== 'PGRST116') {
        console.error('Erreur lors de la vérification des rappels :', reminderError);
        return;
      }

      // Si aucun rappel n'a été envoyé pour ce jour
      if (!reminderData) {
        try {
          // Envoyer un email de rappel
          const { error: invokeError } = await supabase.functions.invoke('send-trial-reminder', {
            body: { userId, daysRemaining }
          });

          if (invokeError) throw invokeError;

          // Enregistrer le rappel
          const { error: insertError } = await supabase
            .from('trial_reminders')
            .insert([{ user_id: userId, days_remaining: daysRemaining }]);

          if (insertError) throw insertError;
          
        } catch (error) {
          console.error('Erreur lors de l\'envoi du rappel d\'essai :', error);
        }
      }
    } catch (error) {
      console.error('Erreur inattendue dans checkAndSendTrialReminders :', error);
    }
  }, []);

  // Effet pour vérifier le statut de l'essai au chargement et lors des changements d'utilisateur
  useEffect(() => {
    let isMounted = true;
    
    const checkTrial = async () => {
      if (!user) {
        if (isMounted) {
          setTrialStatus(prev => ({
            ...prev,
            isOnTrial: false,
            daysRemaining: 0,
            trialEndDate: null,
            trialStartDate: null,
            isTrialExpired: false,
            hasActiveSubscription: false,
            trialPercentageCompleted: 0,
            formattedTrialEndDate: null,
            currentPlan: 'FREE',
            subscriptionEndDate: null,
          }));
        }
        return;
      }

      try {
        await refreshTrialStatus();
      } catch (error) {
        console.error('Erreur lors de la vérification du statut de l\'essai :', error);
      }
    };

    // Vérifier immédiatement
    checkTrial();

    // Vérifier périodiquement (toutes les heures)
    const intervalId = setInterval(checkTrial, 60 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [user?.id]);

  return {
    ...trialStatus,
    refreshTrialStatus,
    canAccessFeature,
    getFeatureLimit,
  };
};

export { useTrial };
