import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Re-définit le schéma ici pour tester la validation indépendamment du composant
const clientSchema = z.object({
  prenom: z.string().min(1, 'Le prénom est requis'),
  nom: z.string().min(1, 'Le nom est requis'),
  entreprise: z.string(),
  email: z
    .string()
    .refine(v => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: 'Adresse e-mail invalide',
    }),
  telephone: z.string(),
  adresse: z.string(),
  code_postal: z.string(),
  ville: z.string(),
  pays: z.string().min(1),
  notes: z.string(),
  devise_preferee: z.enum(['CHF', 'EUR', 'USD']),
  conditions_paiement: z.number().int().positive('Les conditions de paiement doivent être positives'),
});

const validData = {
  prenom: 'Jean',
  nom: 'Dupont',
  entreprise: 'ACME SA',
  email: 'jean@example.com',
  telephone: '+41 79 123 45 67',
  adresse: 'Route de la Paix 1',
  code_postal: '1000',
  ville: 'Lausanne',
  pays: 'CH',
  notes: '',
  devise_preferee: 'CHF' as const,
  conditions_paiement: 30,
};

describe('clientSchema — validation', () => {
  it('accepte des données valides', () => {
    const result = clientSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejette si le prénom est vide", () => {
    const result = clientSchema.safeParse({ ...validData, prenom: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map(i => i.message);
      expect(messages).toContain('Le prénom est requis');
    }
  });

  it("rejette si le nom est vide", () => {
    const result = clientSchema.safeParse({ ...validData, nom: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map(i => i.message);
      expect(messages).toContain('Le nom est requis');
    }
  });

  it("rejette un e-mail invalide", () => {
    const result = clientSchema.safeParse({ ...validData, email: 'pas-un-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map(i => i.message);
      expect(messages).toContain('Adresse e-mail invalide');
    }
  });

  it("accepte un email vide (facultatif)", () => {
    const result = clientSchema.safeParse({ ...validData, email: '' });
    expect(result.success).toBe(true);
  });

  it("accepte les devises CHF, EUR, USD", () => {
    for (const devise of ['CHF', 'EUR', 'USD'] as const) {
      const result = clientSchema.safeParse({ ...validData, devise_preferee: devise });
      expect(result.success).toBe(true);
    }
  });

  it("rejette une devise inconnue", () => {
    const result = clientSchema.safeParse({ ...validData, devise_preferee: 'GBP' });
    expect(result.success).toBe(false);
  });

  it("accepte des conditions de paiement standards", () => {
    for (const days of [10, 15, 30, 45, 60, 90]) {
      const result = clientSchema.safeParse({ ...validData, conditions_paiement: days });
      expect(result.success).toBe(true);
    }
  });

  it("rejette des conditions de paiement négatives", () => {
    const result = clientSchema.safeParse({ ...validData, conditions_paiement: -10 });
    expect(result.success).toBe(false);
  });

  it("rejette des conditions de paiement nulles", () => {
    const result = clientSchema.safeParse({ ...validData, conditions_paiement: 0 });
    expect(result.success).toBe(false);
  });
});
