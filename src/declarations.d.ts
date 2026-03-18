// Déclaration des modules pour résoudre les erreurs d'importation
declare module '../../../hooks/useInvoices' {
  import { InvoiceData } from '../types/invoice';
  
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

  const useInvoices: (options?: UseInvoicesOptions) => UseInvoicesReturn;
  export default useInvoices;
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

  const useAuth: () => AuthContextType;
  export default useAuth;
}

declare module '../../../types/invoice' {
  export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

  export interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
  }

  export interface InvoiceData {
    id: string;
    user_id: string;
    invoice_number: string;
    client_name: string;
    client_email: string;
    client_company?: string;
    client_address?: string;
    client_zip?: string;
    client_city?: string;
    client_country?: string;
    date: string;
    due_date: string;
    status: InvoiceStatus;
    items: InvoiceItem[];
    notes?: string;
    subtotal: number;
    tax_amount: number;
    total: number;
    created_at: string;
    updated_at: string;
  }
}
