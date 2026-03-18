import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Reproduction du schéma Zod de InvoiceForm pour les tests unitaires
const invoiceItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'La description est requise'),
  quantity: z.number().positive('La quantité doit être supérieure à 0'),
  unitPrice: z.number().nonnegative('Le prix unitaire ne peut pas être négatif'),
  vatRate: z.number().nonnegative('Le taux de TVA ne peut pas être négatif'),
  total: z.number(),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Le numéro de facture est requis'),
  issueDate: z.string().min(1, "La date d'émission est requise"),
  dueDate: z.string().min(1, "La date d'échéance est requise"),
  selectedClientId: z.string().min(1, 'Veuillez sélectionner un client'),
  items: z
    .array(invoiceItemSchema)
    .min(1, 'Au moins une ligne de facturation est requise'),
}).refine(
  data => new Date(data.dueDate) >= new Date(data.issueDate),
  {
    message: "La date d'échéance doit être postérieure à la date d'émission",
    path: ['dueDate'],
  }
);

const validItem = {
  id: 'item-1',
  description: 'Développement web',
  quantity: 5,
  unitPrice: 150,
  vatRate: 8.1,
  total: 810,
};

const validData = {
  invoiceNumber: 'FACT-202403-1234',
  issueDate: '2024-03-01',
  dueDate: '2024-03-31',
  selectedClientId: 'client-uuid-123',
  items: [validItem],
};

describe('invoiceItemSchema — validation', () => {
  it('accepte un item valide', () => {
    const result = invoiceItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it('rejette une description vide', () => {
    const result = invoiceItemSchema.safeParse({ ...validItem, description: '' });
    expect(result.success).toBe(false);
  });

  it('rejette une quantité nulle', () => {
    const result = invoiceItemSchema.safeParse({ ...validItem, quantity: 0 });
    expect(result.success).toBe(false);
  });

  it('rejette une quantité négative', () => {
    const result = invoiceItemSchema.safeParse({ ...validItem, quantity: -1 });
    expect(result.success).toBe(false);
  });

  it('accepte un prix unitaire de 0 (service gratuit)', () => {
    const result = invoiceItemSchema.safeParse({ ...validItem, unitPrice: 0 });
    expect(result.success).toBe(true);
  });

  it('rejette un prix unitaire négatif', () => {
    const result = invoiceItemSchema.safeParse({ ...validItem, unitPrice: -10 });
    expect(result.success).toBe(false);
  });

  it('accepte taux TVA 0% (exonéré)', () => {
    const result = invoiceItemSchema.safeParse({ ...validItem, vatRate: 0 });
    expect(result.success).toBe(true);
  });

  it('accepte les taux TVA suisses 2.6%, 3.8%, 8.1%', () => {
    for (const rate of [2.6, 3.8, 8.1]) {
      const result = invoiceItemSchema.safeParse({ ...validItem, vatRate: rate });
      expect(result.success).toBe(true);
    }
  });
});

describe('invoiceSchema — validation complète', () => {
  it('accepte des données de facture valides', () => {
    const result = invoiceSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejette si pas de numéro de facture', () => {
    const result = invoiceSchema.safeParse({ ...validData, invoiceNumber: '' });
    expect(result.success).toBe(false);
  });

  it('rejette si pas de client sélectionné', () => {
    const result = invoiceSchema.safeParse({ ...validData, selectedClientId: '' });
    expect(result.success).toBe(false);
  });

  it("rejette si la date d'échéance est avant la date d'émission", () => {
    const result = invoiceSchema.safeParse({
      ...validData,
      issueDate: '2024-03-31',
      dueDate: '2024-03-01',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map(i => i.message);
      expect(messages.some(m => m.includes("date d'échéance"))).toBe(true);
    }
  });

  it("accepte si la date d'échéance est égale à la date d'émission (même jour)", () => {
    const result = invoiceSchema.safeParse({
      ...validData,
      issueDate: '2024-03-15',
      dueDate: '2024-03-15',
    });
    expect(result.success).toBe(true);
  });

  it("rejette si la liste d'articles est vide", () => {
    const result = invoiceSchema.safeParse({ ...validData, items: [] });
    expect(result.success).toBe(false);
  });

  it('accepte plusieurs articles', () => {
    const result = invoiceSchema.safeParse({
      ...validData,
      items: [
        validItem,
        { ...validItem, id: 'item-2', description: 'Hébergement', quantity: 1, unitPrice: 50, total: 54.05 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejette si un article a une description vide (même si les autres sont valides)', () => {
    const result = invoiceSchema.safeParse({
      ...validData,
      items: [
        validItem,
        { ...validItem, id: 'item-2', description: '' }, // invalide
      ],
    });
    expect(result.success).toBe(false);
  });
});
