# Manual Test Creation Workflow Guide

## Overview

This document describes the **manual workflow** for creating test cases and automation scripts from Azure DevOps work items (User Stories or Bugs).

**No AI required** - this workflow uses a structured, interactive process to generate test cases and automation scaffolding.

## Workflow Steps

### 1. Provide Azure DevOps Ticket ID

Run the manual workflow command with a work item ID:

```powershell
npm run manual:workflow -- --id=5827
```

### 2. Framework Fetches Work Item Details

The framework will:
- Connect to Azure DevOps
- Fetch the work item (Bug or User Story)
- Display the details (title, description, type, state)
- Auto-detect the module (CRM or Inventory Management)

Example output:
```
================================================================================
WORK ITEM DETAILS
================================================================================
ID: 5827
Title: Validate Inventory Management navigation for stock transfer workflows
Type: User Story
State: New
Module: INVENTORY

Description:
As an inventory management user, I want to access the key inventory and 
transfer-management functions...
================================================================================
```

### 3. Create Test Cases

The framework will prompt you to create test cases. Currently, it generates a template test case that you can customize:

**Template:**
```
Test Case 1: [User Story #5827] <Title> - Happy Path
Steps: 
  1. Navigate to the application
  2. Perform the main action
  3. Verify the result
Expected: The action completes successfully
Priority: 1
```

**Future Enhancement:** We can add interactive prompts to create multiple test cases with custom steps.

### 4. Push Test Cases to Azure DevOps

The framework will:
- Create each test case as a work item in Azure DevOps (Type: `Test Case`)
- Link each test case to the original work item using the "Tested By" relationship
- Return the test case IDs

Example:
```
Created test case #6001
Created test case #6002
Linked test cases to User Story #5827
```

### 5. Generate Automation Scaffold

The framework automatically generates:

**a) Test Spec File**

Location: `tests/<module>/<kebab-case-title>.spec.ts`

Example: `tests/inventory/validate-inventory-management-navigation.spec.ts`

```typescript
/**
 * Test Spec for Work Item #5827
 * Title: Validate Inventory Management navigation
 * Module: INVENTORY
 */

import { test, expect } from '@playwright/test';
import { ValidateInventoryPage } from '../../src/pages/inventory/ValidateInventoryPage';

test.describe('[User Story #5827] Validate Inventory Management navigation', () => {
  
  test('Happy path test', async ({ page }) => {
    test.info().annotations.push({ type: 'test_case', description: 'TC-6001' });
    
    const pageObject = new ValidateInventoryPage(page);
    
    // Step 1: Navigate to the module
    await pageObject.navigate();
    
    // TODO: Add your test implementation here
    
    // Expected Result: ...
    // TODO: Add assertions
  });
});
```

**b) Page Object File**

Location: `src/pages/<module>/<PascalCaseName>Page.ts`

Example: `src/pages/inventory/ValidateInventoryPage.ts`

```typescript
import { Page } from '@playwright/test';
import { InventoryBasePage } from './InventoryBasePage';

/**
 * Page Object for Validate Inventory Management navigation
 * Module: INVENTORY
 */
export class ValidateInventoryPage extends InventoryBasePage {
  // Locators
  private readonly mainContainer = this.page.locator('[data-testid="main-container"]');
  
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to this page/module
   */
  async navigate(): Promise<void> {
    await this.page.goto(process.env.INVENTORY_MGMT_URL + '/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  // TODO: Add page-specific methods here
}
```

### 6. Implement the Tests

Now you manually fill in:
1. **Page Object methods** - locators and actions specific to the feature
2. **Test steps** - actual test implementation
3. **Assertions** - verify expected results

### 7. Run the Tests

```powershell
# Run the specific test
npm test tests/inventory/validate-inventory-management-navigation.spec.ts

# Run with headed browser to debug
npm test tests/inventory/validate-inventory-management-navigation.spec.ts -- --headed

# Run all inventory tests
npm test tests/inventory
```

### 8. Generate Report

```powershell
npm run allure:serve
```

---

## Module Detection

The framework automatically detects which module (CRM or Inventory) based on keywords:

**Inventory Keywords:**
- inventory, stock, transfer, warehouse, pick, receive, adjust, product display

**CRM Keywords:**
- crm, contact, account, lead, opportunity, case, dynamics, customer

**Default:** If unclear, defaults to CRM

---

## Command Options

### Basic Usage
```powershell
npm run manual:workflow -- --id=5827
```

### Dry Run (Skip Azure DevOps Write)
```powershell
npm run manual:workflow -- --id=5827 --dry-run
```

### Skip Azure Update (Local Only)
```powershell
npm run manual:workflow -- --id=5827 --skip-azure
```

---

## Project Structure

After running the workflow, you'll have:

```
d:\2026\Oasis\Trial4\
├── tests/
│   ├── crm/
│   │   ├── contacts.spec.ts
│   │   ├── accounts.spec.ts
│   │   └── <new-test>.spec.ts
│   └── inventory/
│       └── <new-test>.spec.ts
├── src/
│   └── pages/
│       ├── crm/
│       │   ├── ContactsPage.ts
│       │   └── <NewPage>.ts
│       └── inventory/
│           ├── InventoryBasePage.ts (base class)
│           └── <NewPage>.ts
```

---

## Two Applications

### 1. Oasis CRM (Dynamics 365)
- **URL:** `https://nthcrm-test.crm.dynamics.com/main.aspx?appid=aa6ffe26-ba5d-44d3-9d87-09e23d665f73`
- **Base Page:** `CRMDashboardPage` (extends `BasePage`)
- **Test Location:** `tests/crm/`
- **Page Objects:** `src/pages/crm/`

### 2. Inventory Management
- **URL:** `https://inventorymanagement-qa-cgfag2apgkbzhphj.eastus2-01.azurewebsites.net`
- **Base Page:** `InventoryBasePage` (extends `BasePage`)
- **Test Location:** `tests/inventory/`
- **Page Objects:** `src/pages/inventory/`

---

## Best Practices

### 1. Naming Conventions
- **Test files:** kebab-case: `validate-navigation.spec.ts`
- **Page Objects:** PascalCase: `ValidateNavigationPage.ts`
- **Test titles:** Include work item ID: `[User Story #5827] Title`

### 2. Page Object Model
- All locators are **private readonly** class fields
- One public method per user action
- Methods should be descriptive: `clickStockOverviewButton()` not `click()`
- Include JSDoc comments for all public methods

### 3. Test Data
- Use `TestDataHelper` for generating test data
- All generated records prefixed with `AUTO-TEST`
- Never hardcode emails, names, phone numbers

### 4. Assertions
- Put assertions in page object methods when they're specific to that page
- Keep complex assertions in test files
- Always include meaningful error messages

### 5. Waits
- Never use `page.waitForTimeout()`
- Use `waitForLoadState('networkidle')`
- Use `waitForSelector()` with explicit state
- Use page-specific wait methods: `waitForCRMLoad()`, `waitForInventoryLoad()`

---

## Example: Complete Workflow for Work Item #5827

### Step 1: Run Command
```powershell
npm run manual:workflow -- --id=5827
```

### Step 2: Review Output
```
Work Item: Validate Inventory Management navigation for stock transfer workflows
Module: INVENTORY
Test Cases Created: 1
Test Case IDs: 6001
Test Spec: tests/inventory/validate-inventory-management-navigation.spec.ts
```

### Step 3: Implement Page Object

Open `src/pages/inventory/ValidateInventoryPage.ts`:

```typescript
export class ValidateInventoryPage extends InventoryBasePage {
  // Locators
  private readonly stockOverviewLink = this.page.locator('nav >> text="Stock Overview"');
  private readonly productDisplayLink = this.page.locator('nav >> text="Product Display"');
  private readonly createTransferLink = this.page.locator('nav >> text="Create Transfer"');

  async navigate(): Promise<void> {
    await this.navigateToPath('/dashboard');
  }

  async verifyStockOverviewNavigation(): Promise<void> {
    await this.stockOverviewLink.click();
    await this.verifyPageHeading('Stock Overview');
  }

  async verifyProductDisplayNavigation(): Promise<void> {
    await this.productDisplayLink.click();
    await this.verifyPageHeading('Product Display');
  }

  async verifyCreateTransferNavigation(): Promise<void> {
    await this.createTransferLink.click();
    await this.verifyPageHeading('Create Transfer');
  }
}
```

### Step 4: Implement Test

Open `tests/inventory/validate-inventory-management-navigation.spec.ts`:

```typescript
test('Verify all navigation links work', async ({ page }) => {
  test.info().annotations.push({ type: 'test_case', description: 'TC-6001' });
  
  const inventoryPage = new ValidateInventoryPage(page);
  
  // Navigate to dashboard
  await inventoryPage.navigate();
  
  // Verify each navigation item
  await inventoryPage.verifyStockOverviewNavigation();
  await inventoryPage.verifyProductDisplayNavigation();
  await inventoryPage.verifyCreateTransferNavigation();
});
```

### Step 5: Run Test
```powershell
npm test tests/inventory/validate-inventory-management-navigation.spec.ts -- --headed
```

### Step 6: Generate Report
```powershell
npm run allure:serve
```

---

## Troubleshooting

### TypeScript Errors
```powershell
npm run typecheck
```

### Test Failures
```powershell
# Run in debug mode
npm run test:debug

# Run in headed mode to watch
npm test -- --headed

# Check screenshots
# Located in: test-results/<test-name>/
```

### Azure DevOps Connection Issues
- Verify `AZURE_DEVOPS_PAT` in `.env` is valid
- Check org/project names are correct
- Ensure PAT has permissions: Work Items (Read, Write), Test Management (Read, Write)

---

## Next Steps

1. ✅ Run `npm run manual:workflow -- --id=5827`
2. ✅ Implement page object methods
3. ✅ Implement test steps
4. ✅ Run tests: `npm test`
5. ✅ Generate report: `npm run allure:serve`
6. ✅ Repeat for next work item!

---

## Future Enhancements

- [ ] Interactive CLI prompts for creating multiple test cases
- [ ] Support for editing existing test specs (append new tests)
- [ ] Automatic locator suggestions based on page inspection
- [ ] Integration with AI (optional) for generating test case suggestions
- [ ] Support for test data generation based on work item requirements
