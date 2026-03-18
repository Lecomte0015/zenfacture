import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Vérification des variables d'environnement
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erreur: Les variables d\'environnement Supabase sont manquantes');
  console.log('Veuillez configurer vos variables d\'environnement dans le fichier .env');
  console.log('Exemple:');
  console.log('VITE_SUPABASE_URL=https://votre-projet.supabase.co');
  console.log('VITE_SUPABASE_ANON_KEY=votre-cle-anon');
}

// Type pour le client Supabase avec typage fort
export type TypedSupabaseClient = SupabaseClient<Database>;

// Fonction pour créer le client Supabase avec typage fort
export function createSupabaseClient(): TypedSupabaseClient {
  try {
    // Vérification du format de l'URL
    if (!supabaseUrl.startsWith('http')) {
      throw new Error(`URL Supabase invalide: ${supabaseUrl}`);
    }

    // Initialisation du client avec les types de la base de données
    const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-application-name': 'zenfacture-app',
        },
      },
    });

    return client;
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de Supabase:', error);
    
    // En mode développement, retourner un client factice
    if (import.meta.env.DEV) {
      console.warn('⚠️  Mode développement: Utilisation d\'un client Supabase factice');
      
      // Création d'un client factice avec les méthodes nécessaires
      const mockAuth = {
        onAuthStateChange: () => {
          console.warn('Mode développement: AuthStateChange simulé');
          return { data: { subscription: { unsubscribe: () => {} } } };
        },
        signIn: async () => ({ 
          error: new Error('Configuration Supabase manquante - Mode développement') 
        }),
        signUp: async () => ({
          data: { 
            user: { 
              id: 'mock-user-id',
              email: 'dev@example.com',
              user_metadata: { name: 'Développeur' },
              identities: []
            },
            session: null
          },
          error: null
        }),
        signOut: async () => ({ 
          error: new Error('Configuration Supabase manquante - Mode développement') 
        }),
        getSession: async () => ({
          data: { session: null },
          error: null
        }),
        resetPasswordForEmail: async () => ({
          data: {},
          error: import.meta.env.DEV ? null : new Error('Configuration Supabase manquante')
        }),
        updateUser: async () => ({
          data: { user: null },
          error: import.meta.env.DEV ? null : new Error('Configuration Supabase manquante')
        }),
        setSession: async () => ({
          data: { session: null, user: null },
          error: import.meta.env.DEV ? null : new Error('Configuration Supabase manquante')
        }),
        user: () => ({
          id: 'mock-user-id',
          email: 'dev@example.com',
          user_metadata: { name: 'Développeur' }
        }),
        session: () => ({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user: {
            id: 'mock-user-id',
            email: 'dev@example.com',
            user_metadata: { name: 'Développeur' }
          }
        }),
      };

      return {
        auth: mockAuth,
        from: () => ({
          select: () => ({ 
            data: [], 
            error: null 
          }),
          insert: () => ({ 
            error: new Error('Configuration Supabase manquante - Mode développement') 
          }),
          update: () => ({ 
            error: new Error('Configuration Supabase manquante - Mode développement') 
          }),
          delete: () => ({ 
            error: new Error('Configuration Supabase manquante - Mode développement') 
          }),
          single: () => ({
            data: null,
            error: new Error('Configuration Supabase manquante - Mode développement')
          })
        })
      };
    }
    
    throw error;
  }
}

// Création du client Supabase typé
const supabase = createSupabaseClient();

// Helper pour les requêtes typées
export const typedSupabase = {
  from: (table: keyof Database['public']['Tables']) => {
    return {
      select: (columns: string) => {
        return supabase.from(table).select(columns);
      },
      insert: (values: any) => {
        return supabase.from(table).insert(values);
      },
      update: (values: any) => {
        return supabase.from(table).update(values);
      },
      delete: () => {
        return supabase.from(table).delete();
      },
      eq: (column: string, value: any) => {
        return supabase.from(table).eq(column, value);
      },
      maybeSingle: () => {
        return supabase.from(table).maybeSingle();
      },
    };
  }
};

// Export du client Supabase de base pour les cas avancés
export { supabase };
