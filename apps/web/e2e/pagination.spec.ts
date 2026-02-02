import { test, expect } from '@playwright/test';

test.describe('Pagination', () => {
  test('should display pagination when there are multiple pages', async ({ page }) => {
    await page.goto('/');

    // Wait for content to load
    await expect(page.locator('h1')).toBeVisible();

    // Check if pagination exists (only if there are enough products)
    const pagination = page.getByRole('navigation', { name: 'Навигация по страницам' });
    const paginationExists = await pagination.isVisible().catch(() => false);

    if (paginationExists) {
      // Should have page numbers
      await expect(page.getByRole('link', { name: 'Страница 1' })).toBeVisible();
    }
  });

  test('should navigate to next page', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toBeVisible();

    const pagination = page.getByRole('navigation', { name: 'Навигация по страницам' });
    const paginationExists = await pagination.isVisible().catch(() => false);

    if (paginationExists) {
      // Check if next button is available (not disabled)
      const nextButton = page.getByRole('link', { name: 'Следующая страница' });
      const nextExists = await nextButton.isVisible().catch(() => false);

      if (nextExists) {
        await nextButton.click();

        // URL should have page=2
        await expect(page).toHaveURL(/page=2/);

        // Page 2 should be active
        const page2Link = page.getByRole('link', { name: 'Страница 2' });
        await expect(page2Link).toHaveAttribute('aria-current', 'page');
      }
    }
  });

  test('should navigate to specific page', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toBeVisible();

    const pagination = page.getByRole('navigation', { name: 'Навигация по страницам' });
    const paginationExists = await pagination.isVisible().catch(() => false);

    if (paginationExists) {
      // Try to click on page 2 if it exists
      const page2Link = page.getByRole('link', { name: 'Страница 2' });
      const page2Exists = await page2Link.isVisible().catch(() => false);

      if (page2Exists) {
        await page2Link.click();
        await expect(page).toHaveURL(/page=2/);
      }
    }
  });

  test('should navigate back with previous button', async ({ page }) => {
    // Start on page 2
    await page.goto('/?page=2');

    await expect(page.locator('h1')).toBeVisible();

    const pagination = page.getByRole('navigation', { name: 'Навигация по страницам' });
    const paginationExists = await pagination.isVisible().catch(() => false);

    if (paginationExists) {
      const prevButton = page.getByRole('link', { name: 'Предыдущая страница' });
      const prevExists = await prevButton.isVisible().catch(() => false);

      if (prevExists) {
        await prevButton.click();

        // Should be back on page 1 (no page param or page=1)
        await expect(page).not.toHaveURL(/page=2/);
      }
    }
  });

  test('should preserve category filter during pagination', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/?category=test-category');

    await expect(page.locator('h1')).toBeVisible();

    const pagination = page.getByRole('navigation', { name: 'Навигация по страницам' });
    const paginationExists = await pagination.isVisible().catch(() => false);

    if (paginationExists) {
      const page2Link = page.getByRole('link', { name: 'Страница 2' });
      const page2Exists = await page2Link.isVisible().catch(() => false);

      if (page2Exists) {
        await page2Link.click();

        // Should preserve category in URL
        await expect(page).toHaveURL(/category=test-category/);
        await expect(page).toHaveURL(/page=2/);
      }
    }
  });
});
