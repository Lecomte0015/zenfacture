import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Supabase avec vi.hoisted ────────────────────────────────────────────

const { mockSupabase } = vi.hoisted(() => {
  const chainMock = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  };

  const mockSupabase = {
    from: vi.fn(() => chainMock),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
    },
    _chain: chainMock,
  };

  return { mockSupabase };
});

vi.mock('../lib/supabaseClient', () => ({
  supabase: mockSupabase,
  typedSupabase: mockSupabase,
}));

// ─── Import du service ────────────────────────────────────────────────────────

import { getClients, getClient, createClient, updateClient } from '../services/clientService';

const chain = mockSupabase._chain;

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase.from.mockReturnValue(chain);
  chain.select.mockReturnThis();
  chain.eq.mockReturnThis();
  chain.order.mockReturnThis();
  chain.range.mockReturnThis();
  chain.single.mockReturnThis();
  chain.maybeSingle.mockResolvedValue({ data: null, error: null });
  chain.insert.mockReturnThis();
  chain.update.mockReturnThis();
  chain.or.mockReturnThis();
});

// ─── Tests getClients ─────────────────────────────────────────────────────────

describe('getClients', () => {
  it('appelle supabase.from("clients")', async () => {
    chain.range.mockResolvedValueOnce({ data: [], count: 0, error: null });

    await getClients({ organisationId: 'org-1' });

    expect(mockSupabase.from).toHaveBeenCalledWith('clients');
  });

  it('retourne un tableau vide si aucun client', async () => {
    chain.range.mockResolvedValueOnce({ data: [], count: 0, error: null });

    const result = await getClients({ organisationId: 'org-1' });

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('retourne les clients s\'ils existent', async () => {
    const fakeClients = [
      { id: '1', prenom: 'Jean', nom: 'Dupont', email: 'jean@example.com' },
      { id: '2', prenom: 'Marie', nom: 'Martin', email: 'marie@example.com' },
    ];
    chain.range.mockResolvedValueOnce({ data: fakeClients, count: 2, error: null });

    const result = await getClients({ organisationId: 'org-1' });

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('propage les erreurs Supabase', async () => {
    chain.range.mockResolvedValueOnce({ data: null, count: null, error: { message: 'DB error' } });

    await expect(getClients({ organisationId: 'org-1' })).rejects.toThrow();
  });
});

// ─── Tests getClient ──────────────────────────────────────────────────────────

describe('getClient', () => {
  it('appelle supabase.from("clients") avec l\'id correct', async () => {
    chain.single.mockResolvedValueOnce({ data: { id: 'client-1' }, error: null });

    await getClient('client-1');

    expect(mockSupabase.from).toHaveBeenCalledWith('clients');
    expect(chain.eq).toHaveBeenCalledWith('id', 'client-1');
  });

  it('retourne null si le client n\'existe pas', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

    const result = await getClient('unknown');
    expect(result).toBeNull();
  });
});

// ─── Tests createClient ───────────────────────────────────────────────────────

describe('createClient', () => {
  it('appelle supabase.from("clients").insert()', async () => {
    const fakeClient = { id: 'c-new', prenom: 'Alice', nom: 'Bonnet', numero_client: 'CLI-001' };
    chain.single.mockResolvedValueOnce({ data: fakeClient, error: null });

    const clientData = {
      organisation_id: 'org-1',
      prenom: 'Alice',
      nom: 'Bonnet',
      entreprise: null,
      email: 'alice@example.com',
      telephone: null,
      adresse: null,
      code_postal: null,
      ville: null,
      pays: 'CH',
      notes: null,
      devise_preferee: 'CHF' as const,
      conditions_paiement: 30,
    };

    await createClient(clientData);

    expect(mockSupabase.from).toHaveBeenCalledWith('clients');
    expect(chain.insert).toHaveBeenCalled();
  });
});

// ─── Tests updateClient ───────────────────────────────────────────────────────

describe('updateClient', () => {
  it('appelle supabase.from("clients").update() avec l\'id correct', async () => {
    const updated = { id: 'c-1', email: 'new@example.com' };
    chain.single.mockResolvedValueOnce({ data: updated, error: null });

    await updateClient('c-1', { email: 'new@example.com' });

    expect(mockSupabase.from).toHaveBeenCalledWith('clients');
    expect(chain.update).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('id', 'c-1');
  });

  it('ne passe pas l\'id dans les updates', async () => {
    const updated = { id: 'c-1', prenom: 'Bob' };
    chain.single.mockResolvedValueOnce({ data: updated, error: null });

    await updateClient('c-1', { prenom: 'Bob', id: 'should-be-stripped' } as any);

    const updateCall = chain.update.mock.calls[0][0];
    expect(updateCall).not.toHaveProperty('id');
  });
});
