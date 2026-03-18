import { supabase } from '../lib/supabaseClient';

export interface InvoiceData {
  id: string;
  user_id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  client_company?: string;
  client_address?: string;
  client_zip?: string;
  client_postal_code?: string;
  client_city?: string;
  client_country?: string;
  date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
  }>;
  notes?: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  created_at: string;
  updated_at: string;
}

interface GetInvoicesOptions {
  userId: string;
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

interface GetInvoicesResult {
  data: InvoiceData[];
  hasMore: boolean;
  total: number;
}

export const getInvoices = async ({
  userId,
  page = 1,
  limit = 10,
  status,
  search,
}: GetInvoicesOptions): Promise<GetInvoicesResult> => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  // Créer une requête de base
  let query = supabase
    .from('factures')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);
  
  // Appliquer les filtres
  if (status) {
    query = query.eq('status', status);
  }
  
  if (search) {
    query = query.or(
      `client_name.ilike.%${search}%,client_company.ilike.%${search}%,invoice_number.ilike.%${search}%`
    );
  }
  
  const { data, error, count } = await query;
  
  if (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
  
  // Vérifier s'il y a plus de résultats
  const hasMore = count ? from + data.length < count : false;
  
  return {
    data: data || [],
    hasMore,
    total: count || 0,
  };
};

export const getInvoice = async (id: string): Promise<InvoiceData | null> => {
  const { data, error } = await supabase
    .from('factures')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // Aucune ligne trouvée
      return null;
    }
    console.error('Error fetching invoice:', error);
    throw error;
  }

  return data;
};

export const createInvoice = async (invoiceData: Omit<InvoiceData, 'id' | 'created_at' | 'updated_at'>): Promise<InvoiceData> => {
  const { data, error } = await supabase
    .from('factures')
    .insert([{
      ...invoiceData,
      // S'assurer que les champs optionnels sont correctement gérés
      client_company: invoiceData.client_company || null,
      client_address: invoiceData.client_address || null,
      client_zip: invoiceData.client_zip || null,
      client_city: invoiceData.client_city || null,
      client_country: invoiceData.client_country || null,
      notes: invoiceData.notes || null,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }

  return data;
};

export const updateInvoice = async (id: string, updates: Partial<InvoiceData>): Promise<InvoiceData> => {
  // Ne pas permettre la mise à jour de l'ID ou des dates de création/mise à jour
  const { id: _, created_at, updated_at, ...safeUpdates } = updates;
  
  const { data, error } = await supabase
    .from('factures')
    .update({
      ...safeUpdates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }

  return data;
};

export const deleteInvoice = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('factures')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
};

// Fonction utilitaire pour générer un numéro de facture séquentiel
export const generateInvoiceNumber = async (userId: string, prefix = 'FACT-'): Promise<string> => {
  // Récupérer le dernier numéro de facture pour cet utilisateur
  const { data, error } = await supabase
    .from('factures')
    .select('invoice_number')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
    
  if (error && error.code !== 'PGRST116') { // PGRST116 = Aucune ligne trouvée
    console.error('Error fetching last invoice number:', error);
    throw error;
  }
  
  const lastNumber = data?.invoice_number || '';
  const match = lastNumber.match(/\d+/);
  const nextNumber = match ? parseInt(match[0], 10) + 1 : 1;
  
  // Format: PREFIX-YYYYMMDD-NNNN
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const paddedNumber = String(nextNumber).padStart(4, '0');
  
  return `${prefix}${year}${month}${day}-${paddedNumber}`;
};
