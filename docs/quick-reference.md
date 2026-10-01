# Quick Reference Guide - Daily Workflow

**Quick Commands & Workflows for Daily Test Creation**

---

## 🚀 Quick Start - Create Test from Azure Ticket

```powershell
# 1. Run workflow with ticket ID
npm run manual:workflow -- --id=<TICKET_ID>

# 2. Implement the generated test
# - Open: tests/<module>/<name>.spec.ts
# - Open: src/pages/<module>/<Name>Page.ts

# 3. Run your test
npm test tests/<module>/<name>.spec.ts -- --headed

# 4. Generate report
npm run allure:serve
```

---

## 📝 Common Commands

### Test Execution
```powershell
# Run all tests
npm test

# Run specific module
npm test tests/crm
npm test tests/inventory

# Run single file
npm test tests/crm/contacts.spec.ts

# Watch browser (headed mode)
npm test -- --headed

# Debug mode (step through)
npm run test:debug

# Run specific test by name
npm test -- -g "TC-1"
```

### Reporting
```powershell
# Generate & open Allure report
npm run allure:serve

# Generate only
npm run allure:report

# Open existing
npm run allure:open
```

### Code Quality
```powershell
# TypeScript check
npm run typecheck

# Lint
npm run lint

# Lint with auto-fix
npm run lint:fix
```

### BDD (Optional)
```powershell
# Run all BDD scenarios
npm run test:bdd

# Run smoke tests only
npm run test:bdd:tags -- "@smoke"

# Run regression tests
npm run test:bdd:tags -- "@regression"
```

---

## 🎯 Workflow Options

### Option 1: Full Workflow (Creates Test Cases in Azure DevOps)
```powershell
npm run manual:workflow -- --id=5827
```

### Option 2: Dry Run (No Azure DevOps Write)
```powershell
npm run manual:workflow -- --id=5827 --dry-run
```

### Option 3: Local Only (Skip Azure Update)
```powershell
npm run manual:workflow -- --id=5827 --skip-azure
```

### Option 4: AI-Powered (Requires AI Provider)
```powershell
npm run sync:azure -- --id=5827
```

---

## 🔑 Environment Variables

### Required
```env
# CRM
DYN365_TEST_ORG_URL=<url>
DYN365_USER_NAME=<email>
DYN365_PASSWORD=<password>

# Inventory
INVENTORY_MGMT_URL=<url>
INVENTORY_MGMT_USER_NAME=<email>
INVENTORY_MGMT_PASSWORD=<password>

# Azure DevOps
AZURE_DEVOPS_ORG=<org-url>
AZURE_DEVOPS_PROJECT=<project-name>
AZURE_DEVOPS_PAT=<personal-access-token>
```

### Optional (AI)
```env
AI_PROVIDER=azure-openai  # or ollama or openai

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=<endpoint>
AZURE_OPENAI_API_KEY=<key>
AZURE_OPENAI_DEPLOYMENT=<deployment>
```

---

## 📁 File Structure Quick Reference

```
tests/
├── auth/auth.setup.ts          # Auth configuration
├── crm/                        # CRM tests
│   ├── contacts.spec.ts
│   ├── accounts.spec.ts
│   └── leads.spec.ts
└── inventory/                  # Inventory tests
    └── <your-test>.spec.ts

src/pages/
├── BasePage.ts                 # Base class
├── CRMDashboardPage.ts         # CRM base
├── crm/                        # CRM page objects
│   ├── ContactsPage.ts
│   ├── AccountsPage.ts
│   └── LeadsPage.ts
└── inventory/                  # Inventory page objects
    ├── InventoryBasePage.ts
    └── <YourPage>.ts

src/utils/
├── authHelper.ts               # Session management
├── logger.ts                   # Logging
├── screenshotHelper.ts         # Screenshots
└── testDataHelper.ts           # Test data
```

---

## 🐛 Troubleshooting

### TypeScript Errors
```powershell
npm run typecheck
```

### Test Failures
```powershell
# Run in headed mode
npm test <file> -- --headed

# Check screenshots
# Location: test-results/<test-name>/
```

### Authentication Issues
```powershell
# Delete saved session
Remove-Item auth-state\*.json

# Run auth setup
npm test tests/auth/auth.setup.ts
```

### Azure DevOps Connection
```powershell
# Verify PAT token
# Check .env file

# Test connection (manual)
npx ts-node -e "import {AzureDevOpsClient} from './src/azure/AzureDevOpsClient'; const c = new AzureDevOpsClient(); c.getWorkItem(5827).then(console.log)"
```

---

## 🎨 Page Object Template

```typescript
import { Page } from '@playwright/test';
import { CRMDashboardPage } from '../CRMDashboardPage'; // or InventoryBasePage

export class YourPage extends CRMDashboardPage {
  // Locators (private readonly)
  private readonly yourField = this.page.locator('[data-id="field"]');
  private readonly yourButton = this.page.locator('button:has-text("Click")');
  
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to this page
   */
  async navigate(): Promise<void> {
    await this.navigateToEntityList('entity-name');
    await this.waitForGrid();
  }

  /**
   * Your method with JSDoc
   */
  async yourMethod(): Promise<void> {
    await this.yourField.fill('value');
    await this.yourButton.click();
  }
}
```

---

## 📝 Test Spec Template

```typescript
import { test, expect } from '@playwright/test';
import { YourPage } from '../../src/pages/<module>/YourPage';
import { TestDataHelper } from '../../src/utils/testDataHelper';

test.describe('[Work Item #XXXX] Test Suite Name', () => {
  
  test('TC-1: Test description', async ({ page }) => {
    const yourPage = new YourPage(page);
    
    // Arrange
    await yourPage.navigate();
    
    // Act
    await yourPage.yourMethod();
    
    // Assert
    await expect(page).toHaveURL(/expected/);
  });
});
```

---

## 🔗 Quick Links

### Azure DevOps
- Organization: https://dev.azure.com/NthDegree-Enterprise-Apps
- Project: https://dev.azure.com/NthDegree-Enterprise-Apps/Projected%20Stock%20System

### Applications
- CRM: https://nthcrm-test.crm.dynamics.com/main.aspx?appid=aa6ffe26-ba5d-44d3-9d87-09e23d665f73
- Inventory: https://inventorymanagement-qa-cgfag2apgkbzhphj.eastus2-01.azurewebsites.net

### Documentation
- [Full Summary](./project-summary.md)
- [Architecture](./architecture.md)
- [Manual Workflow](./manual-workflow-guide.md)
- [Coding Standards](./coding-standards.md)

---

## 💡 Tips & Best Practices

### 1. Always Use Test Data Helper
```typescript
const { firstName, lastName } = TestDataHelper.contactName();
// firstName: "AUTO-TEST-John"
// lastName: "AUTO-TEST-Smith-abc123"
```

### 2. Never Hardcode Waits
```typescript
// ❌ Bad
await page.waitForTimeout(5000);

// ✅ Good
await page.waitForLoadState('networkidle');
await page.waitForSelector('[data-id="grid"]');
```

### 3. Use Logger, Not Console
```typescript
// ❌ Bad
console.log('Clicking button');

// ✅ Good
this.logger.info('Clicking button');
```

### 4. Keep Tests Independent
```typescript
// Each test should:
// - Setup its own data
// - Clean up after itself
// - Not depend on other tests
```

### 5. Use Descriptive Test Names
```typescript
// ❌ Bad
test('test 1', async ({ page }) => {});

// ✅ Good
test('TC-1: Verify user can create contact with valid data', async ({ page }) => {});
```

---

## 🎯 Daily Checklist

- [ ] Pull latest changes: `git pull`
- [ ] Check Azure DevOps for new tickets
- [ ] Run workflow: `npm run manual:workflow -- --id=<TICKET>`
- [ ] Implement page object methods
- [ ] Implement test steps
- [ ] Run tests: `npm test <file> -- --headed`
- [ ] Fix any failures
- [ ] Generate report: `npm run allure:serve`
- [ ] Commit: `git commit -m "feat(module): description"`
- [ ] Push: `git push`
- [ ] Create PR

---

**Last Updated:** September 28, 2026  
**Version:** 1.0
