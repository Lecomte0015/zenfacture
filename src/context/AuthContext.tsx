import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { PlanAbonnement } from '../hooks/useSubscriptionFeatures';

type Fonctionnalites = {
  multiUtilisateurs: boolean;
  api: boolean;
  supportPrioritaire: boolean;
  support24_7: boolean;
  facturationAvancee: boolean;
  exportDonnees: boolean;
  [key: string]: boolean; // Index signature pour permettre l'accès par clé de type string
};

type User = {
  id: string;
  email: string;
  plan?: PlanAbonnement;
  name?: string;
  organization_id?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
    username?: string;
    about?: string;
  };
  fonctionnalites?: Fonctionnalites;
} | null;

type RegisterResponse = {
  user: User | null;
  session: Session | null;
  requiresConfirmation?: boolean;
};

type AuthContextType = {
  user: User;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, organisationName?: string) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  aLaFonctionnalite: (fonctionnalite: keyof Fonctionnalites) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fonction pour obtenir les fonctionnalités en fonction du plan
  const getFonctionnalites = useCallback((plan: PlanAbonnement) => {
    const fonctionnalitesParDefaut = {
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
  }, []);
  
  // Fonction pour créer un utilisateur à partir des données Supabase
  const createUserFromSupabase = useCallback(async (userData: SupabaseUser | null) => {
    if (!userData) {
      console.log('[Auth] createUserFromSupabase: pas de userData');
      return null;
    }

    console.log('[Auth] Chargement du profil pour l\'utilisateur:', userData.id);

    try {
      // Récupérer les informations du profil utilisateur avec un timeout
      const { data: profileData, error: profileError } = await Promise.race([
        supabase
          .from('profils')
          .select('*')
          .eq('id', userData.id)
          .maybeSingle(),
        new Promise<{ data: null; error: any }>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]) as any;

      if (profileError && profileError.message !== 'Timeout') {
        console.error('[Auth] Erreur lors du chargement du profil:', profileError);
      } else if (!profileError) {
        console.log('[Auth] Profil chargé:', profileData ? 'OK' : 'Aucun profil trouvé');
      }

      // Si le profil n'existe pas, créer un profil minimal
      if (!profileData) {
        console.log('[Auth] Création du profil minimal pour:', userData.email);
        const { error: createError } = await supabase
          .from('profils')
          .upsert({
            id: userData.id,
            email: userData.email,
            name: userData.user_metadata?.name || userData.email?.split('@')[0] || 'Utilisateur',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });

        if (createError) {
          console.error('[Auth] Erreur création profil:', createError);
        }
      }

      const plan = (profileData?.plan_abonnement as PlanAbonnement) || 'essentiel';

      const userObj = {
        id: userData.id,
        email: userData.email || '',
        plan,
        user_metadata: userData.user_metadata,
        fonctionnalites: getFonctionnalites(plan)
      };

      console.log('[Auth] Utilisateur créé:', userObj.id, userObj.email);
      return userObj;
    } catch (err) {
      console.error('[Auth] Erreur dans createUserFromSupabase:', err);
      // Retourner un utilisateur minimal même en cas d'erreur
      return {
        id: userData.id,
        email: userData.email || '',
        plan: 'essentiel' as PlanAbonnement,
        user_metadata: userData.user_metadata,
        fonctionnalites: getFonctionnalites('essentiel')
      };
    }
  }, [getFonctionnalites]);

  useEffect(() => {
    // Vérifier la session active au chargement
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(data.session);
        if (data.session?.user) {
          const userData = await createUserFromSupabase(data.session.user);
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error getting session:', err);
        setError('Erreur lors de la vérification de la session');
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        try {
          if (session?.user) {
            const userData = await createUserFromSupabase(session.user);
            setUser(userData);
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error('Error in auth state change:', err);
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              user_metadata: session.user.user_metadata,
            });
          }
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [createUserFromSupabase]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('[Auth] Tentative de connexion pour:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Mettre à jour les données utilisateur après connexion
      if (data?.user) {
        console.log('[Auth] Utilisateur authentifié, chargement du profil...');
        const userData = await createUserFromSupabase(data.user);
        setUser(userData);
        console.log('[Auth] Profil chargé:', userData?.id);
      }

    } catch (err: any) {
      console.error('[Auth] Erreur lors de la connexion:', err);
      setError(err.message || 'Échec de la connexion. Veuillez vérifier vos identifiants.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, organisationName?: string): Promise<RegisterResponse> => {
    setLoading(true);
    setError(null);

    try {
      // Calculer les dates d'essai
      const trialStartDate = new Date().toISOString();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 15); // Essai de 15 jours

      // Créer l'utilisateur avec les dates d'essai
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            trial_start_date: trialStartDate,
            trial_end_date: trialEndDate.toISOString(),
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      // Si l'utilisateur est créé mais nécessite une confirmation par email
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        throw new Error('Un utilisateur avec cet email existe déjà');
      }

      if (data.user) {
        try {
          // 1. Créer le profil utilisateur
          const { error: profileError } = await supabase
            .from('profils')
            .upsert({
              id: data.user.id,
              name,
              email,
              trial_start_date: trialStartDate,
              trial_end_date: trialEndDate.toISOString(),
              plan_abonnement: 'essentiel',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (profileError) {
            console.error('Erreur lors de la mise à jour du profil:', profileError);
          }

          // 2. Créer l'organisation via RPC SECURITY DEFINER (bypasse RLS)
          const orgName = organisationName || (name ? `Organisation de ${name}` : 'Mon entreprise');
          const { data: orgId, error: orgError } = await supabase.rpc('creer_organisation', {
            nom_organisation: orgName,
          });

          if (orgError) {
            console.error('Erreur lors de la création de l\'organisation:', orgError);
          }

          const userData = await createUserFromSupabase(data.user);
          return {
            user: userData,
            session: data.session
          };
        } catch (profileErr) {
          console.error('Erreur lors de la création du profil:', profileErr);
          return {
            user: data.user ? { id: data.user.id, email: data.user.email || '' } : null,
            session: data.session
          };
        }
      }

      // Si on arrive ici, c'est qu'un email de confirmation a été envoyé
      return {
        user: null,
        session: null,
        requiresConfirmation: true
      };
      
    } catch (err: any) {
      const errorMessage = err.message.includes('already registered') 
        ? 'Un compte existe déjà avec cette adresse email.'
        : err.message || "Une erreur s'est produite lors de l'inscription.";
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // Toujours nettoyer l'état local, même si Supabase échoue
    setUser(null);
    setSession(null);
    try {
      // scope: 'local' évite l'appel réseau si la session est déjà expirée
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err: any) {
      // AuthSessionMissingError est normal après expiration — pas d'erreur à afficher
      if (!err?.message?.includes('Auth session missing')) {
        console.error('Error logging out:', err);
      }
    }
  };

  const updateUser = async (data: Partial<User>): Promise<void> => {
    if (!user || !data) return;

    try {
      // Préparer les données de mise à jour
      const updateData: {
        data?: Record<string, any>;
        email?: string;
      } = {};

      // Mettre à jour les métadonnées utilisateur si elles sont fournies
      if (data.user_metadata || data.name) {
        updateData.data = {
          ...(user.user_metadata || {}),
          ...(data.user_metadata || {}),
        };

        if (data.name) {
          updateData.data.name = data.name;
        }
      }

      // Mettre à jour l'email si fourni
      if (data.email && data.email !== user.email) {
        updateData.email = data.email;
      }

      // Ne rien faire s'il n'y a aucune donnée à mettre à jour
      if (!updateData.data && !updateData.email) return;

      // Effectuer la mise à jour dans Supabase
      const { data: updatedUser, error } = await supabase.auth.updateUser(updateData);

      if (error) throw error;

      // Mettre à jour l'état local directement (sans re-fetch pour éviter la boucle)
      if (updatedUser?.user) {
        setUser(prev => prev ? {
          ...prev,
          email: updatedUser.user.email || prev.email,
          name: updatedUser.user.user_metadata?.name || prev.name,
          user_metadata: {
            ...prev.user_metadata,
            ...updatedUser.user.user_metadata,
          },
        } : prev);
      }
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.message || "Une erreur s'est produite lors de la mise à jour du profil");
      throw err;
    }
  };

  const value: AuthContextType = {
    user: user ? {
      ...user,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Utilisateur',
    } : null as any, // On utilise 'as any' car TypeScript ne peut pas inférer correctement le type
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!session,
    loading,
    error,
    // Fonction utilitaire pour vérifier les autorisations
    aLaFonctionnalite: (fonctionnalite: keyof Fonctionnalites) => {
      if (!user || !user.fonctionnalites) return false;
      return user.fonctionnalites[fonctionnalite] || false;
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
