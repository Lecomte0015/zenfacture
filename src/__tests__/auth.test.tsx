import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { SupabaseClient, User, Session } from '@supabase/supabase-js';

// Création du mock Supabase avec vi.hoisted
const { mockSupabase } = vi.hoisted(() => {
  // Types pour les mocks
  type MockSupabase = {
    auth: {
      getSession: any;
      signInWithPassword: any;
      signUp: any;
      signOut: any;
      onAuthStateChange: any;
      user: any;
    };
    from: any;
    select: any;
    eq: any;
    single: any;
    insert: any;
    update: any;
    delete: any;
  };

  // Fonction pour créer un mock Supabase
  const createMockSupabase = (): MockSupabase => {
    const mock = {
      auth: {
        getSession: vi.fn(),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChange: vi.fn(),
        user: vi.fn()
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis()
    };

    // Configuration par défaut pour les requêtes de base
    mock.from.mockImplementation((table: string) => {
      if (table === 'profils') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValueOnce({
            data: { plan_abonnement: 'essentiel' },
            error: null
          })
        };
      }
      if (table === 'organisations') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValueOnce({
            data: [
              { id: 'org-123', nom: 'Mon Entreprise', proprietaire_id: 'user-123' }
            ],
            error: null
          })
        };
      }
      if (table === 'utilisateurs_organisations') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValueOnce({
            data: [
              { 
                id: 'user-org-123',
                organisation_id: 'org-123',
                utilisateur_id: 'user-123',
                role: 'admin'
              }
            ],
            error: null
          })
        };
      }
      return mock;
    });

    return mock;
  };

  const mockSupabase = createMockSupabase();
  
  return { mockSupabase };
});

// Mock pour le client Supabase
vi.mock('../lib/supabaseClient', () => ({
  __esModule: true,
  default: mockSupabase,
  supabase: mockSupabase
}));

// Configuration des mocks par défaut
beforeEach(() => {
  vi.clearAllMocks();
  
  // Configuration par défaut pour onAuthStateChange
  mockSupabase.auth.onAuthStateChange = vi.fn((callback) => {
    const session = { 
      user: { 
        id: 'user-123', 
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
        app_metadata: { provider: 'email' },
        aud: 'authenticated',
        created_at: new Date().toISOString()
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      expires_in: 3600,
      refresh_token: 'test-refresh-token',
      token_type: 'bearer',
      access_token: 'test-access-token'
    };
    
    callback('SIGNED_IN', session);
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });

  // Configuration par défaut pour la requête de session
  mockSupabase.auth.getSession = vi.fn().mockResolvedValue({ 
    data: { 
      session: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: { name: 'Test User' },
          app_metadata: { provider: 'email' },
          aud: 'authenticated',
          created_at: new Date().toISOString()
        },
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        token_type: 'bearer'
      } 
    }, 
    error: null 
  });

  // Configuration des réponses par défaut pour les requêtes de base de données
  mockSupabase.from.mockImplementation((table: string) => {
    if (table === 'profils') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { 
            id: 'user-123',
            plan_abonnement: 'essentiel',
            nom: 'Test',
            prenom: 'User',
            entreprise: 'Test Entreprise'
          },
          error: null
        })
      };
    }
    if (table === 'organisations') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'org-123',
            nom: 'Mon Entreprise',
            proprietaire_id: 'user-123',
            cree_le: new Date().toISOString(),
            mis_a_jour_le: new Date().toISOString()
          },
          error: null
        })
      };
    }
    if (table === 'utilisateurs_organisations') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'user-org-123',
            organisation_id: 'org-123',
            utilisateur_id: 'user-123',
            role: 'admin',
            cree_le: new Date().toISOString()
          },
          error: null
        })
      };
    }
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null })
    };
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Composant de test pour vérifier l'authentification
const AuthTestComponent = () => {
  const { isAuthenticated, user, login, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await login('test@example.com', 'password');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Connecté' : 'Déconnecté'}
      </div>
      {user && (
        <div data-testid="user-email">{user.email}</div>
      )}
      <button 
        onClick={handleLogin}
        data-testid="login-button"
      >
        Se connecter
      </button>
      <button 
        onClick={handleLogout}
        data-testid="logout-button"
      >
        Se déconnecter
      </button>
      <button 
        onClick={() => navigate('/protege')}
        data-testid="navigate-button"
      >
        Accéder à la page protégée
      </button>
    </div>
  );
};

// Composant de page protégée (commenté car non utilisé pour l'instant)
// const ProtectedPage = () => {
//   const { user } = useAuth();
//   return (
//     <div data-testid="protected-page">
//       Page protégée - {user?.email}
//     </div>
//   );
// };

describe('AuthContext', () => {
  beforeEach(() => {
    // Réinitialiser les mocks avant chaque test
    vi.clearAllMocks();
  });

  it('devrait fournir le contexte d\'authentification', async () => {
    // Configurer le mock pour simuler une session vide au démarrage
    mockSupabase.auth.getSession = vi.fn().mockResolvedValueOnce({ 
      data: { session: null }, 
      error: null 
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <AuthTestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    // Vérifier que le composant est rendu
    const authStatus = await screen.findByTestId('auth-status');
    expect(authStatus).toBeInTheDocument();
    
    // Vérifier que l'utilisateur est initialement déconnecté
    expect(authStatus).toHaveTextContent('Déconnecté');
  });

  it('devrait gérer la connexion et la déconnexion', async () => {
    // Configurer le mock pour simuler une connexion réussie
    mockSupabase.auth.signInWithPassword = vi.fn().mockResolvedValueOnce({
      data: { 
        user: { 
          id: '123', 
          email: 'test@example.com',
          user_metadata: { name: 'Test User' },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        },
        session: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id: '123',
            email: 'test@example.com',
            user_metadata: { name: 'Test User' }
          }
        }
      },
      error: null
    });

    // Configurer le mock pour simuler une déconnexion réussie
    mockSupabase.auth.signOut = vi.fn().mockResolvedValueOnce({ error: null });

    render(
      <MemoryRouter>
        <AuthProvider>
          <AuthTestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    // Simuler un clic sur le bouton de connexion
    const loginButton = screen.getByTestId('login-button');
    loginButton.click();

    // Vérifier que la fonction de connexion a été appelée
    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });
    });

    // Vérifier que l'utilisateur est connecté
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Connecté');
    });

    // Simuler un clic sur le bouton de déconnexion
    const logoutButton = screen.getByTestId('logout-button');
    logoutButton.click();

    // Vérifier que la fonction de déconnexion a été appelée
    await waitFor(() => {
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
  });

  it('devrait permettre l\'accès aux routes protégées avec authentification', async () => {
    // Configurer le mock pour simuler un utilisateur connecté
    mockSupabase.auth.getSession = vi.fn().mockResolvedValueOnce({ 
      data: { 
        session: { 
          user: { 
            id: 'user-123', 
            email: 'test@example.com',
            user_metadata: { name: 'Test User' },
            app_metadata: { provider: 'email' },
            aud: 'authenticated',
            created_at: new Date().toISOString()
          },
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          token_type: 'bearer'
        } 
      }, 
      error: null 
    });

    // Créer un composant de page protégée simple
    const ProtectedPage = () => {
      const { isAuthenticated } = useAuth();
      return isAuthenticated ? (
        <div data-testid="protected-page">Page protégée</div>
      ) : (
        <div data-testid="login-required">Veuillez vous connecter</div>
      );
    };

    render(
      <MemoryRouter initialEntries={['/protege']}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<AuthTestComponent />} />
            <Route 
              path="/protege" 
              element={
                <div>
                  <ProtectedPage />
                  <AuthTestComponent />
                </div>
              } 
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Vérifier que la page protégée est accessible avec authentification
    await waitFor(() => {
      expect(screen.getByTestId('protected-page')).toBeInTheDocument();
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Connecté');
    });
  });

  it('devrait vérifier les autorisations de fonctionnalités', async () => {
    // Configurer le mock pour simuler un utilisateur avec un plan Pro
    mockSupabase.auth.getSession = vi.fn().mockResolvedValueOnce({ 
      data: { 
        session: { 
          user: { 
            id: '123', 
            email: 'pro@example.com',
            user_metadata: { name: 'Test Pro' },
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
          },
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          token_type: 'bearer'
        } 
      }, 
      error: null 
    });

    // Configurer le mock pour retourner le plan Pro
    mockSupabase.from = vi.fn().mockReturnThis();
    mockSupabase.select = vi.fn().mockReturnThis();
    mockSupabase.eq = vi.fn().mockImplementation(() => ({
      single: vi.fn().mockResolvedValue({ 
        data: { plan_abonnement: 'pro' }, 
        error: null 
      })
    }));

    const TestComponent = () => {
      const { aLaFonctionnalite } = useAuth();
      return (
        <div>
          <div data-testid="has-support">
            {aLaFonctionnalite('supportPrioritaire') ? 'Oui' : 'Non'}
          </div>
          <div data-testid="has-api">
            {aLaFonctionnalite('api') ? 'Oui' : 'Non'}
          </div>
        </div>
      );
    };

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    // Vérifier que les fonctionnalités sont correctement vérifiées
    await waitFor(() => {
      expect(screen.getByTestId('has-support')).toHaveTextContent('Oui');
      expect(screen.getByTestId('has-api')).toHaveTextContent('Non');
    });
  });
});
