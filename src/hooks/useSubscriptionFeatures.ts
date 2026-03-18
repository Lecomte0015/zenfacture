import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

type PlanAbonnement = 'essentiel' | 'pro' | 'entreprise';

interface Fonctionnalites {
  multiUtilisateurs: boolean;
  api: boolean;
  supportPrioritaire: boolean;
  support24_7: boolean;
  facturationAvancee: boolean;
  exportDonnees: boolean;
}

const useSubscriptionFeatures = () => {
  const [plan, setPlan] = useState<PlanAbonnement>('essentiel');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger le plan d'abonnement de l'utilisateur
  useEffect(() => {
    const chargerPlan = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from('profils')
          .select('plan_abonnement')
          .eq('id', user.id)
          .maybeSingle();
        
        if (data?.plan_abonnement) {
          setPlan(data.plan_abonnement as PlanAbonnement);
        }
      } catch (err) {
        console.error('Erreur lors du chargement du plan:', err);
        setError('Impossible de charger les informations de votre abonnement');
      } finally {
        setLoading(false);
      }
    };

    chargerPlan();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        chargerPlan();
      } else if (event === 'SIGNED_OUT') {
        setPlan('essentiel');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Définir les fonctionnalités disponibles pour chaque plan
  const getFonctionnalites = (): Fonctionnalites => {
    const fonctionnalitesParDefaut: Fonctionnalites = {
      multiUtilisateurs: false,
      api: false,
      supportPrioritaire: false,
      support24_7: false,
      facturationAvancee: false,
      exportDonnees: false,
    };

    switch (plan) {
      case 'entreprise':
        return {
          ...fonctionnalitesParDefaut,
          multiUtilisateurs: true,
          api: true,
          supportPrioritaire: true,
          support24_7: true,
          facturationAvancee: true,
          exportDonnees: true,
        };
      case 'pro':
        return {
          ...fonctionnalitesParDefaut,
          supportPrioritaire: true,
          facturationAvancee: true,
          exportDonnees: true,
        };
      case 'essentiel':
      default:
        return fonctionnalitesParDefaut;
    }
  };

  // Vérifier si une fonctionnalité spécifique est disponible
  const aLaFonctionnalite = (fonctionnalite: keyof Fonctionnalites): boolean => {
    return getFonctionnalites()[fonctionnalite] || false;
  };

  // Obtenir le nom complet du plan
  const getNomCompletPlan = (): string => {
    switch (plan) {
      case 'entreprise':
        return 'Entreprise';
      case 'pro':
        return 'Professionnel';
      case 'essentiel':
      default:
        return 'Essentiel';
    }
  };

  // Mettre à niveau le plan
  const mettreAJourPlan = async (nouveauPlan: PlanAbonnement) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      const { error } = await supabase
        .from('profils')
        .update({ plan_abonnement: nouveauPlan })
        .eq('id', user.id);

      if (error) throw error;

      setPlan(nouveauPlan);
      return true;
    } catch (err) {
      console.error('Erreur lors de la mise à jour du plan:', err);
      setError('Impossible de mettre à jour votre plan');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    plan,
    nomCompletPlan: getNomCompletPlan(),
    fonctionnalites: getFonctionnalites(),
    aLaFonctionnalite,
    mettreAJourPlan,
    loading,
    error,
  };
};

export default useSubscriptionFeatures;

export type { PlanAbonnement, Fonctionnalites };
