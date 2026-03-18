import { describe, it, expect } from 'vitest';
import { produitSchema } from '../components/produits/ProduitForm';

const validProduit = {
  nom: 'Consultation',
  description: 'Conseil en développement logiciel',
  prix_unitaire: 150,
  taux_tva: 8.1,
  unite: 'hour' as const,
  categorie: 'Services',
  actif: true,
};

describe('produitSchema — validation', () => {
  it('accepte un produit valide', () => {
    expect(produitSchema.safeParse(validProduit).success).toBe(true);
  });

  it('rejette si le nom est vide', () => {
    const result = produitSchema.safeParse({ ...validProduit, nom: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map(i => i.message)).toContain('Nom requis');
    }
  });

  it('rejette un nom trop long (> 100 chars)', () => {
    const result = produitSchema.safeParse({ ...validProduit, nom: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('rejette un prix négatif', () => {
    const result = produitSchema.safeParse({ ...validProduit, prix_unitaire: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map(i => i.message)).toContain('Le prix ne peut pas être négatif');
    }
  });

  it('accepte un prix de 0', () => {
    expect(produitSchema.safeParse({ ...validProduit, prix_unitaire: 0 }).success).toBe(true);
  });

  it('accepte toutes les unités valides', () => {
    const unites = ['piece', 'hour', 'day', 'flat', 'm2', 'kg'] as const;
    for (const unite of unites) {
      expect(produitSchema.safeParse({ ...validProduit, unite }).success).toBe(true);
    }
  });

  it("rejette une unité inconnue", () => {
    const result = produitSchema.safeParse({ ...validProduit, unite: 'litre' });
    expect(result.success).toBe(false);
  });

  it('accepte une description vide (facultative)', () => {
    expect(produitSchema.safeParse({ ...validProduit, description: '' }).success).toBe(true);
  });

  it('accepte une catégorie vide (facultative)', () => {
    expect(produitSchema.safeParse({ ...validProduit, categorie: '' }).success).toBe(true);
  });

  it('accepte les taux de TVA valides suisses', () => {
    const taux = [0, 2.6, 3.8, 8.1];
    for (const taux_tva of taux) {
      expect(produitSchema.safeParse({ ...validProduit, taux_tva }).success).toBe(true);
    }
  });

  it('accepte actif = false', () => {
    expect(produitSchema.safeParse({ ...validProduit, actif: false }).success).toBe(true);
  });
});
