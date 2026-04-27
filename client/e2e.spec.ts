import { test, expect, Page } from '@playwright/test';

test.describe('Sangam Enterprise - Complete Flow', () => {
  test('Complete Authentication, Customer, Product, and Invoice Flow', async ({ page }: { page: Page }) => {
    // Navigate to Login
    await page.goto('http://localhost:3000/login');
    
    // Login
    await page.fill('input[type="email"]', 'cptjacksprw@gmail.com');
    await page.fill('input[type="password"]', 'Player@123');
    await page.click('button:has-text("Sign in")');
    
    // Wait for Dashboard
    await expect(page.locator('h1:has-text("Overview")')).toBeVisible({ timeout: 10000 });

    // Navigate to Settings -> Templates
    await page.goto('http://localhost:3000/dashboard/settings');
    await page.click('button:has-text("Template")');
    await expect(page.locator('text=Invoice Template Customization')).toBeVisible();

    // Navigate to Customers
    await page.goto('http://localhost:3000/dashboard/customers');
    await page.click('button:has-text("Add Customer")');
    await page.fill('input#name', 'Test User');
    await page.fill('input#email', 'test@example.com');
    await page.click('button:has-text("Add Customer")');
    await expect(page.locator('text=Customer created successfully')).toBeVisible();

    // Navigate to Invoices
    await page.goto('http://localhost:3000/dashboard/invoices');
    await page.click('button:has-text("Create Invoice")');
    await expect(page.locator('text=New Invoice')).toBeVisible();
    
    // Test custom items and calculations
    await page.click('button:has-text("Add Item")');
    await page.click('button:has-text("Add Custom Item")');
    await page.fill('input[placeholder="Item name"]', 'E2E Validation Service');
    const priceInput = page.locator('input[type="number"][step="0.01"]').first();
    await priceInput.fill('150');

    // Create Invoice
    await page.click('button:has-text("Select a customer...")');
    await page.click('button:has-text("Test User")');
    await page.click('button:has-text("Create Invoice")');
  });
});
