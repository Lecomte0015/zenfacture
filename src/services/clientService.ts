import { supabase } from '../lib/supabaseClient';

export interface ClientData {
  id: string;
  organisation_id: string;
  numero_client: string | null;
  prenom: string | null;
  nom: string;
  entreprise: string | null;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  pays: string;
  notes: string | null;
  devise_preferee: string;
  conditions_paiement: number;
  cree_le: string;
  mis_a_jour_le: string;
}

interface GetClientsOptions {
  organisationId: string;
  page?: number;
  limit?: number;
  search?: string;
}

interface GetClientsResult {
  data: ClientData[];
  hasMore: boolean;
  total: number;
}

export const getClients = async ({
  organisationId,
  page = 1,
  limit = 20,
  search,
}: GetClientsOptions): Promise<GetClientsResult> => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .eq('organisation_id', organisationId)
    .order('cree_le', { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(
      `nom.ilike.%${search}%,prenom.ilike.%${search}%,entreprise.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }

  const hasMore = count ? from + (data?.length || 0) < count : false;

  return {
    data: data || [],
    hasMore,
    total: count || 0,
  };
};

export const getClient = async (id: string): Promise<ClientData | null> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching client:', error);
    throw error;
  }

  return data;
};

export const createClient = async (
  clientData: Omit<ClientData, 'id' | 'cree_le' | 'mis_a_jour_le' | 'numero_client'>
): Promise<ClientData> => {
  // Récupérer l'utilisateur connecté
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) throw new Error('Utilisateur non connecté');

  // Générer le numéro client
  const numero = await generateClientNumber(clientData.organisation_id);

  const { data, error } = await supabase
    .from('clients')
    .insert([{
      ...clientData,
      user_id: currentUser.id,
      numero_client: numero,
      entreprise: clientData.entreprise || null,
      email: clientData.email || null,
      telephone: clientData.telephone || null,
      adresse: clientData.adresse || null,
      code_postal: clientData.code_postal || null,
      ville: clientData.ville || null,
      notes: clientData.notes || null,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating client:', error);
    throw error;
  }

  return data;
};

export const updateClient = async (id: string, updates: Partial<ClientData>): Promise<ClientData> => {
  const { id: _, cree_le, mis_a_jour_le, ...safeUpdates } = updates;

  const { data, error } = await supabase
    .from('clients')
    .update({
      ...safeUpdates,
      mis_a_jour_le: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating client:', error);
    throw error;
  }

  return data;
};

export const deleteClient = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};

export const generateClientNumber = async (organisationId: string): Promise<string> => {
  const { data, error } = await supabase
    .from('clients')
    .select('numero_client')
    .eq('organisation_id', organisationId)
    .order('cree_le', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching last client number:', error);
  }

  const lastNumber = data?.numero_client || '';
  const match = lastNumber.match(/(\d+)$/);
  const nextNumber = match ? parseInt(match[1], 10) + 1 : 1;

  return `CLI-${String(nextNumber).padStart(4, '0')}`;
};

export const getClientInvoices = async (clientId: string) => {
  const { data, error } = await supabase
    .from('factures')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client invoices:', error);
    throw error;
  }

  return data || [];
};

export const exportClientsCSV = (clients: ClientData[]): string => {
  const headers = ['Numéro', 'Prénom', 'Nom', 'Entreprise', 'Email', 'Téléphone', 'Adresse', 'Code postal', 'Ville', 'Pays'];
  const rows = clients.map(c => [
    c.numero_client,
    c.prenom,
    c.nom,
    c.entreprise || '',
    c.email || '',
    c.telephone || '',
    c.adresse || '',
    c.code_postal || '',
    c.ville || '',
    c.pays,
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(';'))
  ].join('\n');

  return csvContent;
};
