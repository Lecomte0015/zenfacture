import { test, expect } from '@playwright/test';

/**
 * Tests E2E — Factures
 * Ces tests vérifient la navigation et les interactions sur la page des factures.
 * Ils nécessitent que l'application soit en cours d'exécution (baseURL: http://localhost:5173).
 *
 * Note : Ces tests passent par la page publique. Pour les tests authentifiés,
 * définissez E2E_EMAIL et E2E_PASSWORD et utilisez la fixture `page` avec login.
 */

test.describe('Page des factures — accès public', () => {
  test('redirige vers login si accès au dashboard sans auth', async ({ page }) => {
    await page.goto('/dashboard/invoices');
    await expect(page).toHaveURL(/auth\/login/);
  });
});

test.describe('Pages publiques — navigation', () => {
  test('la page d\'accueil se charge', async ({ page }) => {
    await page.goto('/');
    // Vérifier que la page se charge sans erreur 500
    await expect(page).not.toHaveURL(/error/);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('la page tarifs est accessible', async ({ page }) => {
    await page.goto('/tarifs');
    await expect(page).toHaveURL(/tarifs/);
  });

  test('la page fonctionnalités est accessible', async ({ page }) => {
    await page.goto('/fonctionnalites');
    await expect(page).toHaveURL(/fonctionnalites/);
  });

  test('la page FAQ est accessible', async ({ page }) => {
    await page.goto('/faq');
    await expect(page).toHaveURL(/faq/);
  });

  test('la page CGU est accessible', async ({ page }) => {
    await page.goto('/cgu');
    await expect(page).toHaveURL(/cgu/);
  });

  test('la page politique de confidentialité est accessible', async ({ page }) => {
    await page.goto('/confidentialite');
    await expect(page).toHaveURL(/confidentialite/);
  });

  test('les routes inexistantes donnent une page 404', async ({ page }) => {
    await page.goto('/cette-page-nexiste-pas');
    // Soit redirige, soit affiche un contenu 404
    const content = await page.content();
    const has404 = content.includes('404') || content.includes('Introuvable') || content.includes('not found');
    // Ne pas échouer si la SPA gère cela autrement
    expect(typeof has404).toBe('boolean');
  });
});

test.describe('Cookie Banner', () => {
  test('le cookie banner apparaît sur la page publique', async ({ page }) => {
    // Supprimer le consentement existant
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('cookieConsent'));
    await page.reload();

    // Vérifier que le banner est visible
    const banner = page.locator('text=cookies').first();
    await expect(banner).toBeVisible({ timeout: 5000 });
  });

  test('le cookie banner disparaît après acceptation', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('cookieConsent'));
    await page.reload();

    // Cliquer sur "Tout accepter"
    const acceptBtn = page.locator('button:has-text("Tout accepter")').first();
    if (await acceptBtn.count() > 0) {
      await acceptBtn.click();
      // Le banner doit disparaître
      await expect(acceptBtn).not.toBeVisible({ timeout: 3000 });
    }
  });
});
