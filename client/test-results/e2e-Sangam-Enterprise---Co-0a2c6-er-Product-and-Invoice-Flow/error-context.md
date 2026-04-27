# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> Sangam Enterprise - Complete Flow >> Complete Authentication, Customer, Product, and Invoice Flow
- Location: e2e.spec.ts:4:7

# Error details

```
TimeoutError: page.fill: Timeout 20000ms exceeded.
Call log:
  - waiting for locator('input[type="email"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - heading "404" [level=1] [ref=e4]
    - heading "This page could not be found." [level=2] [ref=e6]
  - generic [ref=e9]:
    - img [ref=e11]
    - generic [ref=e13]:
      - generic [ref=e14]:
        - heading "Cookie Preferences" [level=3] [ref=e15]
        - button [ref=e16]:
          - img [ref=e17]
      - paragraph [ref=e20]: We use cookies to enhance your experience, analyze site traffic, and ensure security. By clicking "Accept All", you consent to our use of cookies.
      - generic [ref=e21]:
        - button "Necessary Only" [ref=e22]
        - button "Accept All" [ref=e23]
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e29] [cursor=pointer]:
    - generic [ref=e32]:
      - text: Compiling
      - generic [ref=e33]:
        - generic [ref=e34]: .
        - generic [ref=e35]: .
        - generic [ref=e36]: .
  - alert [ref=e37]
```

# Test source

```ts
  1  | import { test, expect, Page } from '@playwright/test';
  2  | 
  3  | test.describe('Sangam Enterprise - Complete Flow', () => {
  4  |   test('Complete Authentication, Customer, Product, and Invoice Flow', async ({ page }: { page: Page }) => {
  5  |     // Navigate to Login
  6  |     await page.goto('http://localhost:3000/login');
  7  |     
  8  |     // Login
> 9  |     await page.fill('input[type="email"]', 'cptjacksprw@gmail.com');
     |                ^ TimeoutError: page.fill: Timeout 20000ms exceeded.
  10 |     await page.fill('input[type="password"]', 'Player@123');
  11 |     await page.click('button:has-text("Sign in")');
  12 |     
  13 |     // Wait for Dashboard
  14 |     await expect(page.locator('h1:has-text("Overview")')).toBeVisible({ timeout: 10000 });
  15 | 
  16 |     // Navigate to Settings -> Templates
  17 |     await page.goto('http://localhost:3000/dashboard/settings');
  18 |     await page.click('button:has-text("Template")');
  19 |     await expect(page.locator('text=Invoice Template Customization')).toBeVisible();
  20 | 
  21 |     // Navigate to Customers
  22 |     await page.goto('http://localhost:3000/dashboard/customers');
  23 |     await page.click('button:has-text("Add Customer")');
  24 |     await page.fill('input#name', 'Test User');
  25 |     await page.fill('input#email', 'test@example.com');
  26 |     await page.click('button:has-text("Add Customer")');
  27 |     await expect(page.locator('text=Customer created successfully')).toBeVisible();
  28 | 
  29 |     // Navigate to Invoices
  30 |     await page.goto('http://localhost:3000/dashboard/invoices');
  31 |     await page.click('button:has-text("Create Invoice")');
  32 |     await expect(page.locator('text=New Invoice')).toBeVisible();
  33 |     
  34 |     // Test custom items and calculations
  35 |     await page.click('button:has-text("Add Item")');
  36 |     await page.click('button:has-text("Add Custom Item")');
  37 |     await page.fill('input[placeholder="Item name"]', 'E2E Validation Service');
  38 |     const priceInput = page.locator('input[type="number"][step="0.01"]').first();
  39 |     await priceInput.fill('150');
  40 | 
  41 |     // Create Invoice
  42 |     await page.click('button:has-text("Select a customer...")');
  43 |     await page.click('button:has-text("Test User")');
  44 |     await page.click('button:has-text("Create Invoice")');
  45 |   });
  46 | });
  47 | 
```