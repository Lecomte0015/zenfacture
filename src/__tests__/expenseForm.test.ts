import { describe, it, expect } from 'vitest';
import { expenseSchema } from '../pages/dashboard/ExpensesPage';

const validExpense = {
  description: 'Fournitures de bureau',
  amount: '150.50',
  category: 'Fournitures',
  date: '2026-03-18',
};

describe('expenseSchema — validation dépense', () => {
  it('accepte une dépense valide', () => {
    expect(expenseSchema.safeParse(validExpense).success).toBe(true);
  });

  it('rejette si la description est vide', () => {
    const result = expenseSchema.safeParse({ ...validExpense, description: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map(i => i.message)).toContain('Description requise');
    }
  });

  it('rejette si le montant est vide', () => {
    const result = expenseSchema.safeParse({ ...validExpense, amount: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map(i => i.message)).toContain('Montant requis');
    }
  });

  it('rejette un montant de 0', () => {
    const result = expenseSchema.safeParse({ ...validExpense, amount: '0' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map(i => i.message)).toContain('Montant invalide (doit être supérieur à 0)');
    }
  });

  it('rejette un montant négatif', () => {
    const result = expenseSchema.safeParse({ ...validExpense, amount: '-10' });
    expect(result.success).toBe(false);
  });

  it('rejette un montant non numérique', () => {
    const result = expenseSchema.safeParse({ ...validExpense, amount: 'abc' });
    expect(result.success).toBe(false);
  });

  it('rejette si la catégorie est vide', () => {
    const result = expenseSchema.safeParse({ ...validExpense, category: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map(i => i.message)).toContain('Catégorie requise');
    }
  });

  it('rejette si la date est vide', () => {
    const result = expenseSchema.safeParse({ ...validExpense, date: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map(i => i.message)).toContain('Date requise');
    }
  });

  it('accepte des petits montants (0.01)', () => {
    expect(expenseSchema.safeParse({ ...validExpense, amount: '0.01' }).success).toBe(true);
  });

  it('accepte de grands montants', () => {
    expect(expenseSchema.safeParse({ ...validExpense, amount: '99999.99' }).success).toBe(true);
  });
});
