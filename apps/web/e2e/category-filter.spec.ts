import { test, expect } from '@playwright/test';

test.describe('Category Filtering', () => {
  test('should filter products by category via URL', async ({ page }) => {
    // First visit home to ensure categories are loaded
    await page.goto('/');

    // Wait for page to load
    await expect(page.locator('h1')).toBeVisible();

    // Get category links from sidebar (desktop)
    await page.setViewportSize({ width: 1280, height: 720 });

    const categoryLinks = page.locator('nav[aria-label="Категории"] a');
    const count = await categoryLinks.count();

    // If we have categories, click on one
    if (count > 1) {
      // Skip "Все товары" (first link), click on a category
      const categoryLink = categoryLinks.nth(1);
      const categoryName = await categoryLink.textContent();

      await categoryLink.click();

      // URL should contain category parameter
      await expect(page).toHaveURL(/category=/);

      // Title should change to category name
      if (categoryName) {
        await expect(page.locator('h1')).toContainText(categoryName.trim());
      }
    }
  });

  test('should show active state for selected category', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // "Все товары" should be active by default
    const allProductsLink = page.getByRole('link', { name: 'Все товары' });
    await expect(allProductsLink).toHaveClass(/bg-primary/);
  });

  test('should clear filter when clicking "Все товары"', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Start with a category filter
    await page.goto('/?category=test');

    // Click "Все товары"
    await page.getByRole('link', { name: 'Все товары' }).click();

    // URL should not have category parameter
    await expect(page).toHaveURL('/');
  });
});
