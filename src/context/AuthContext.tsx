import React, { createContext, useContext, useState, ReactNode } from 'react';

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Charger l'utilisateur depuis le localStorage au chargement initial
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    }
    return null;
  });
  
  const [loading, setLoading] = useState(true); // Initialisé à true pour le chargement initial
  const [error, setError] = useState<string | null>(null);
  
  // Effet pour gérer la persistance de la session
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        setUser(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };
    
    // Écouter les changements de localStorage sur d'autres onglets
    window.addEventListener('storage', handleStorageChange);
    
    // Chargement initial terminé
    setLoading(false);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async (email: string, _password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulation de connexion
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // En production, remplacez ceci par un appel à votre API
      const mockUser = {
        id: '1',
        name: email.split('@')[0],
        email,
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } catch (err) {
      setError('Échec de la connexion. Veuillez vérifier vos identifiants.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, _password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulation d'inscription
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // En production, remplacez ceci par un appel à votre API
      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
      };
      
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
    } catch (err) {
      setError("Une erreur s'est produite lors de l'inscription.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider 
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
