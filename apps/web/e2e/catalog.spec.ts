import { test, expect } from '@playwright/test';

test.describe('Catalog Page', () => {
  test('should load and display products', async ({ page }) => {
    await page.goto('/');

    // Should have the page title
    await expect(page.locator('h1')).toContainText(/Все товары|товар/i);

    // Should display product grid
    const productGrid = page.locator('[class*="grid"]').first();
    await expect(productGrid).toBeVisible();

    // Should have product cards (or empty state)
    const productCards = page.locator('article');
    const emptyState = page.getByText('Товары не найдены');

    // Either we have products or empty state
    const hasProducts = (await productCards.count()) > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasProducts || hasEmptyState).toBeTruthy();
  });

  test('should display header with currency rate', async ({ page }) => {
    await page.goto('/');

    // Header should be visible
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Should have logo/brand
    await expect(page.getByText('Store77')).toBeVisible();

    // Currency indicator should be visible (loading or with rate)
    const currencySection = page.locator('header').getByText(/₽|USDT|Загрузка/i);
    await expect(currencySection).toBeVisible();
  });

  test('should display categories menu on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Categories sidebar should be visible
    const categoriesMenu = page.getByRole('navigation', { name: 'Категории' });
    await expect(categoriesMenu).toBeVisible();

    // Should have "All products" link
    await expect(page.getByText('Все товары')).toBeVisible();
  });
});
