import { test, expect } from '@playwright/test';

test.describe('Product Detail Page', () => {
  test('should navigate to product page from catalog', async ({ page }) => {
    await page.goto('/');

    // Wait for products to load
    await expect(page.locator('h1')).toBeVisible();

    // Find product cards
    const productCards = page.locator('article');
    const count = await productCards.count();

    if (count > 0) {
      // Click on first product card link (the image or title link)
      const firstProductLink = productCards.first().locator('a').first();
      await firstProductLink.click();

      // Should navigate to product page
      await expect(page).toHaveURL(/\/products\/[a-zA-Z0-9-]+/);

      // Product page should have title
      await expect(page.locator('h1')).toBeVisible();

      // Should have price in RUB
      await expect(page.getByText(/₽/)).toBeVisible();
    }
  });

  test('should display product details', async ({ page }) => {
    await page.goto('/');

    const productCards = page.locator('article');
    const count = await productCards.count();

    if (count > 0) {
      // Navigate to first product
      await productCards.first().locator('a').first().click();

      // Should have breadcrumb navigation
      await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
      await expect(page.getByText('Каталог')).toBeVisible();

      // Should have "Back to catalog" button
      await expect(page.getByRole('link', { name: /Назад к каталогу/i })).toBeVisible();

      // Should have "Open on website" link
      await expect(page.getByRole('link', { name: /Открыть на сайте/i })).toBeVisible();
    }
  });

  test('should navigate back to catalog', async ({ page }) => {
    await page.goto('/');

    const productCards = page.locator('article');
    const count = await productCards.count();

    if (count > 0) {
      // Go to product page
      await productCards.first().locator('a').first().click();
      await expect(page).toHaveURL(/\/products\//);

      // Click back to catalog
      await page.getByRole('link', { name: /Назад к каталогу/i }).click();

      // Should be back on home page
      await expect(page).toHaveURL('/');
    }
  });

  test('should show 404 for non-existent product', async ({ page }) => {
    await page.goto('/products/non-existent-product-id-12345');

    // Should show not found message
    await expect(page.getByText(/не найден|not found/i)).toBeVisible();

    // Should have link to go back
    await expect(page.getByRole('link', { name: /каталог/i })).toBeVisible();
  });
});
