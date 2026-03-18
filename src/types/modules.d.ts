declare module '../../../hooks/useInvoices' {
  import { InvoiceData } from './invoice';
  
  interface UseInvoicesOptions {
    limit?: number;
    status?: string;
    search?: string;
  }

  interface UseInvoicesReturn {
    invoices: InvoiceData[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    removeInvoice: (id: string) => Promise<void>;
    loadMore: () => void;
  }

  export const useInvoices: (options?: UseInvoicesOptions) => UseInvoicesReturn;
}

declare module '../../../context/AuthContext' {
  interface User {
    id: string;
    email: string;
    // Ajoutez d'autres propriétés utilisateur si nécessaire
  }

  interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
  }

  export const useAuth: () => AuthContextType;
}
