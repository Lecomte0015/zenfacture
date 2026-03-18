import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Supabase avec vi.hoisted ────────────────────────────────────────────

const { mockSupabase } = vi.hoisted(() => {
  const chainMock = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  };

  const mockSupabase = {
    from: vi.fn(() => chainMock),
    _chain: chainMock,
  };

  return { mockSupabase };
});

vi.mock('../lib/supabaseClient', () => ({
  supabase: mockSupabase,
  typedSupabase: mockSupabase,
}));

// ─── Import du service ────────────────────────────────────────────────────────

import { getInvoices, getInvoice, createInvoice, updateInvoice } from '../services/invoiceService';

const chain = mockSupabase._chain;

beforeEach(() => {
  vi.clearAllMocks();
  // Réinitialiser les return values par défaut
  mockSupabase.from.mockReturnValue(chain);
  chain.select.mockReturnThis();
  chain.eq.mockReturnThis();
  chain.order.mockReturnThis();
  chain.range.mockReturnThis();
  chain.single.mockReturnThis();
  chain.insert.mockReturnThis();
  chain.update.mockReturnThis();
});

// ─── Tests getInvoices ────────────────────────────────────────────────────────

describe('getInvoices', () => {
  it('appelle supabase.from("factures")', async () => {
    chain.range.mockResolvedValueOnce({ data: [], count: 0, error: null });

    await getInvoices({ userId: 'user-1' });

    expect(mockSupabase.from).toHaveBeenCalledWith('factures');
  });

  it('retourne un tableau vide si aucune facture', async () => {
    chain.range.mockResolvedValueOnce({ data: [], count: 0, error: null });

    const result = await getInvoices({ userId: 'user-1' });

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('retourne les factures si elles existent', async () => {
    const fakeInvoices = [
      { id: '1', invoice_number: 'FACT-001', total: 1000 },
      { id: '2', invoice_number: 'FACT-002', total: 2000 },
    ];
    chain.range.mockResolvedValueOnce({ data: fakeInvoices, count: 2, error: null });

    const result = await getInvoices({ userId: 'user-1' });

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('propage les erreurs Supabase', async () => {
    chain.range.mockResolvedValueOnce({ data: null, count: null, error: { message: 'DB error' } });

    await expect(getInvoices({ userId: 'user-1' })).rejects.toThrow();
  });
});

// ─── Tests getInvoice ─────────────────────────────────────────────────────────

describe('getInvoice', () => {
  it('appelle supabase.from("factures") avec l\'id correct', async () => {
    chain.single.mockResolvedValueOnce({ data: { id: 'abc' }, error: null });

    await getInvoice('abc');

    expect(mockSupabase.from).toHaveBeenCalledWith('factures');
    expect(chain.eq).toHaveBeenCalledWith('id', 'abc');
  });

  it('retourne null si la facture n\'existe pas', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

    const result = await getInvoice('unknown-id');
    expect(result).toBeNull();
  });
});

// ─── Tests createInvoice ──────────────────────────────────────────────────────

describe('createInvoice', () => {
  it('appelle supabase.from("factures").insert()', async () => {
    const fakeInvoice = { id: 'new-1', invoice_number: 'FACT-003', total: 500 };
    chain.single.mockResolvedValueOnce({ data: fakeInvoice, error: null });

    const invoiceData = {
      invoice_number: 'FACT-003',
      user_id: 'user-1',
      organisation_id: 'org-1',
      client_name: 'Jean Dupont',
      date: '2026-03-18',
      due_date: '2026-04-18',
      status: 'draft' as const,
      items: [],
      subtotal: 500,
      tax_amount: 40.5,
      total: 540.5,
    };

    await createInvoice(invoiceData);

    expect(mockSupabase.from).toHaveBeenCalledWith('factures');
    expect(chain.insert).toHaveBeenCalled();
  });

  it('propage les erreurs lors de la création', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'Violation contrainte' } });

    await expect(
      createInvoice({
        invoice_number: 'FACT-004',
        user_id: 'user-1',
        organisation_id: 'org-1',
        client_name: 'Test',
        date: '2026-03-18',
        due_date: '2026-04-18',
        status: 'draft' as const,
        items: [],
        subtotal: 0,
        tax_amount: 0,
        total: 0,
      })
    ).rejects.toThrow();
  });
});

// ─── Tests updateInvoice ──────────────────────────────────────────────────────

describe('updateInvoice', () => {
  it('appelle supabase.from("factures").update() avec l\'id correct', async () => {
    const updated = { id: 'inv-1', status: 'sent' };
    chain.single.mockResolvedValueOnce({ data: updated, error: null });

    await updateInvoice('inv-1', { status: 'sent' });

    expect(mockSupabase.from).toHaveBeenCalledWith('factures');
    expect(chain.update).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('id', 'inv-1');
  });

  it('ne passe pas l\'id dans les updates (immutabilité)', async () => {
    const updated = { id: 'inv-1', status: 'paid' };
    chain.single.mockResolvedValueOnce({ data: updated, error: null });

    await updateInvoice('inv-1', { status: 'paid', id: 'should-be-stripped' } as any);

    // L'appel update() ne doit pas contenir l'id
    const updateCall = chain.update.mock.calls[0][0];
    expect(updateCall).not.toHaveProperty('id');
  });
});
