# CRM AI Automation Framework

End-to-end automation framework for **Microsoft Dynamics 365 CRM** built with **Playwright + TypeScript**.  
AI-powered test case generation reads Azure DevOps user stories and produces ready-to-run Playwright spec files, then links the test cases back to the original tickets.

---

## Architecture Overview

```
crm-ai-automation-framework/
├── src/
│   ├── ai/                        # AI test generation
│   │   ├── AITestCaseGenerator.ts # OpenAI GPT → structured test cases
│   │   ├── TestCaseWriter.ts      # Writes .spec.ts files to disk
│   │   └── generateTests.ts       # CLI: generate tests without Azure push
│   │
│   ├── azure/                     # Azure DevOps integration
│   │   ├── AzureDevOpsClient.ts   # REST API: fetch stories, create/link TCs
│   │   └── syncTestCases.ts       # CLI: full sync (fetch → generate → push → write)
│   │
│   ├── pages/                     # Page Object Model
│   │   ├── BasePage.ts            # All common helpers (waits, fill, assert...)
│   │   ├── LoginPage.ts           # Microsoft AAD login flow
│   │   ├── CRMDashboardPage.ts    # Nav, command bar, grid, form helpers
│   │   └── crm/
│   │       ├── ContactsPage.ts    # Contacts CRUD + assertions
│   │       ├── AccountsPage.ts    # Accounts CRUD + assertions
│   │       └── LeadsPage.ts       # Leads CRUD, qualify, disqualify
│   │
│   ├── utils/
│   │   ├── logger.ts              # Winston logger with per-class context
│   │   ├── authHelper.ts          # Save/reuse browser session (storageState)
│   │   ├── screenshotHelper.ts    # Named screenshots + test report attachment
│   │   └── testDataHelper.ts      # Unique AUTO-TEST prefixed test data
│   │
│   ├── config/index.ts            # Typed env config loader
│   └── types/index.ts             # All shared TypeScript interfaces
│
├── tests/
│   ├── auth/
│   │   └── auth.setup.ts          # Playwright setup project (saves sessions)
│   └── crm/
│       ├── contacts.spec.ts       # Contacts example tests
│       ├── accounts.spec.ts       # Accounts example tests
│       └── leads.spec.ts          # Leads example tests
│       └── <generated>/           # AI-generated specs appear here
│
├── auth-state/                    # gitignored — session storage files
├── test-results/                  # gitignored — screenshots, logs, reports
├── .env                           # gitignored — all credentials
├── .env.example                   # Template — commit this, not .env
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20+ |
| npm | 10+ |
| Azure DevOps PAT | `Work Items: Read/Write`, `Test Management: Read/Write` |
| OpenAI API Key | GPT-4o access |

---

## Quick Start

### 1. Install dependencies

```bash
npm install
npx playwright install chromium
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
copy .env.example .env
```

Required values to update:

| Variable | Description |
|---|---|
| `AZURE_DEVOPS_ORG` | e.g. `https://dev.azure.com/your-org` |
| `AZURE_DEVOPS_PROJECT` | Your project name |
| `AZURE_DEVOPS_PAT` | Personal Access Token |
| `OPENAI_API_KEY` | Your OpenAI key |
| `OPENAI_MODEL` | Default: `gpt-4o` |

CRM and Inventory credentials are pre-configured in `.env`.

### 3. Run existing tests

```bash
# Run all CRM tests (headless)
npm test

# Run headed (see the browser)
npm run test:headed

# Run with Playwright debug mode
npm run test:debug

# Open the HTML report after a run
npm run test:report
```

---

## AI Test Generation Workflow

### Full workflow: Azure DevOps → AI → Playwright spec + TC link

```
Azure User Story
      │
      ▼
AITestCaseGenerator  ──── OpenAI GPT-4o ────►  Structured test cases
      │                                          (title, steps, playwright code)
      ▼
AzureDevOpsClient   ──── ADO REST API ────►  Test Case work items created
      │                                          + linked to User Story
      ▼
TestCaseWriter      ──── writes to disk ──►  tests/crm/<story-title>.spec.ts
```

### Step-by-step

**Option A — Full sync (fetches from ADO, creates TCs, writes spec)**

```bash
# Sync all active user stories
npm run sync:azure

# Sync a single user story by ID
npm run sync:azure -- --id 1234

# Filter by tag
npm run sync:azure -- --tag automation

# Dry run — generate files only, don't push to Azure
npm run sync:azure -- --dry-run

# For Inventory Management tests
npm run sync:azure -- --id 1234 --app InventoryManagement
```

**Option B — Local generation only (no ADO write)**

```bash
# Generate from a known work item ID (reads title+description from ADO)
npm run generate:tests -- --id 1234

# Generate from inline title/description (no ADO needed)
npm run generate:tests -- --title "Create Contact" --description "As a sales user, I want to create a contact so that..."

# For Inventory app
npm run generate:tests -- --id 1234 --app InventoryManagement
```

Generated spec files land in `tests/crm/` or `tests/inventory/` and are immediately runnable.

---

## Authentication

Dynamics CRM uses Microsoft Azure AD (AAD) authentication. The framework handles this with Playwright's `storageState`:

1. On first run, `tests/auth/auth.setup.ts` opens a real browser, logs in, and saves the session to `auth-state/*.storageState.json`.
2. All subsequent tests load that session — **no login steps in individual tests**.
3. Sessions are refreshed automatically if older than 12 hours.

> **MFA**: Test accounts must bypass MFA via Conditional Access Policy (known IP / trusted device). The framework logs a warning and attempts a best-effort bypass if MFA is detected, but it cannot enter authenticator codes.

To force a session refresh:

```bash
# Delete saved sessions — next run will re-authenticate
Remove-Item auth-state\*.json
```

---

## Writing New Page Objects

Extend `BasePage` (or `CRMDashboardPage` for CRM entities):

```typescript
import { Page } from '@playwright/test';
import { CRMDashboardPage } from '../CRMDashboardPage';

export class OpportunitiesPage extends CRMDashboardPage {
  // Define locators as private class fields
  private readonly opportunityNameField = this.page.locator('[data-id="name"] input');

  constructor(page: Page) {
    super(page);
  }

  async navigateToOpportunities(): Promise<void> {
    await this.navigateToEntityList('opportunities');
    await this.waitForGrid();
  }

  async createOpportunity(name: string): Promise<void> {
    await this.navigateToOpportunities();
    await this.clickNew();
    await this.fillInput(this.opportunityNameField, name);
    await this.clickSave();
    await this.assertSaveSuccess();
  }
}
```

**CRM locator conventions:**
- Form fields: `[data-id="fieldLogicalName"] input`
- Lookup fields: use `this.fillLookupField('fieldLogicalName', 'search value')`
- OptionSet (dropdowns): use `this.selectOptionSetField('fieldLogicalName', 'Option Label')`
- Command bar buttons: use `this.clickCommandBarButton('Button Label')`

---

## Writing Tests

Tests use the saved session — no login needed:

```typescript
import { test, expect } from '@playwright/test';
import { ContactsPage } from '../../src/pages/crm/ContactsPage';
import { TestDataHelper } from '../../src/utils/testDataHelper';

test.describe('[US-123] Contact Management', () => {

  test('Create a contact with valid data', async ({ page }) => {
    const contacts = new ContactsPage(page);
    const { firstName, lastName } = TestDataHelper.contactName();

    await contacts.createContact({ firstName, lastName });
    await contacts.assertContactDetails({ firstName, lastName });
  });

});
```

**Test data**: Always use `TestDataHelper` to generate unique names prefixed with `AUTO-TEST`. This prevents collisions and makes cleanup easy — search CRM for `AUTO-TEST` to find and delete all test records.

---

## Playwright Projects

Three projects are configured in `playwright.config.ts`:

| Project | Runs | Storage State |
|---|---|---|
| `setup` | `tests/auth/auth.setup.ts` | None (creates sessions) |
| `crm-chromium` | `tests/crm/**/*.spec.ts` | `crm.storageState.json` |
| `inventory-chromium` | `tests/inventory/**/*.spec.ts` | `inventory.storageState.json` |

Run a specific project:

```bash
npx playwright test --project=crm-chromium
npx playwright test --project=inventory-chromium
```

---

## Reporting

After every run:

```bash
npm run test:report       # Opens the HTML report in browser
```

Reports include:
- Pass/fail per test
- Screenshots on failure (auto-attached)
- Video on first retry
- Full trace viewer on first retry
- JUnit XML at `test-results/junit-results.xml` (for CI)
- JSON at `test-results/test-results.json`

Logs are written to `test-results/logs/framework.log` and `errors.log`.

---

## CI/CD Integration

Set these environment variables in your pipeline instead of `.env`:

```yaml
# Azure Pipelines example
variables:
  DYN365_BaseURL: $(DYN365_BaseURL)
  DYN365_TEST_ORG_URL: $(DYN365_TEST_ORG_URL)
  DYN365_USER_NAME: $(DYN365_USER_NAME)
  DYN365_PASSWORD: $(DYN365_PASSWORD)
  DYN365_TEST_USER_NAME: $(DYN365_TEST_USER_NAME)
  DYN365_TEST_PASSWORD: $(DYN365_TEST_PASSWORD)
  AZURE_DEVOPS_PAT: $(AZURE_DEVOPS_PAT)
  OPENAI_API_KEY: $(OPENAI_API_KEY)
  HEADLESS: "true"
  CI: "true"

steps:
  - script: npm ci
  - script: npx playwright install --with-deps chromium
  - script: npm test
  - task: PublishTestResults@2
    inputs:
      testResultsFormat: JUnit
      testResultsFiles: test-results/junit-results.xml
```

`CI=true` automatically sets `retries: 2` and `workers: 1`.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DYN365_BaseURL` | ✅ | Microsoft login base URL |
| `DYN365_TEST_ORG_URL` | ✅ | Full CRM org URL with app ID |
| `DYN365_USER_NAME` | ✅ | Primary CRM user |
| `DYN365_PASSWORD` | ✅ | Primary CRM password |
| `DYN365_TEST_USER_NAME` | ✅ | Test plan user |
| `DYN365_TEST_PASSWORD` | ✅ | Test plan user password |
| `INVENTORY_MGMT_URL` | ✅ | Inventory Management app URL |
| `INVENTORY_MGMT_USER_NAME` | ✅ | Inventory app user |
| `INVENTORY_MGMT_PASSWORD` | ✅ | Inventory app password |
| `AZURE_DEVOPS_ORG` | AI sync only | ADO org URL |
| `AZURE_DEVOPS_PROJECT` | AI sync only | ADO project name |
| `AZURE_DEVOPS_PAT` | AI sync only | Personal Access Token |
| `OPENAI_API_KEY` | AI sync only | OpenAI API key |
| `OPENAI_MODEL` | Optional | Default: `gpt-4o` |
| `HEADLESS` | Optional | `true`/`false`, default `true` |
| `SLOW_MO` | Optional | Ms delay per action, default `0` |
| `DEFAULT_TIMEOUT` | Optional | Ms per test, default `30000` |
| `LOG_LEVEL` | Optional | `info`/`debug`/`warn`, default `info` |

---

## Troubleshooting

**Login fails / redirects to wrong page**
- Verify `DYN365_TEST_ORG_URL` includes the full `?appid=` query string
- Check that the test account has a CRM licence assigned
- Ensure Conditional Access allows login from your runner's IP

**MFA blocks automation**
- Create a Conditional Access Policy that excludes the test accounts from MFA when logging in from your CI IP range
- Or use app passwords if your tenant supports them

**Dynamics CRM loading spinner never disappears**
- Increase `DEFAULT_TIMEOUT` in `.env` (try `60000`)
- Add `SLOW_MO=200` to slow down actions and give CRM time to react

**AI generates incomplete test code**
- The `TestCaseWriter` uses a skeleton fallback for any test that lacks `expect()` calls
- Review the generated file and flesh out the `// TODO` comments
- Re-run with a more detailed description: add acceptance criteria to the user story in ADO

**TypeScript errors after generation**
- Run `npm run typecheck` to see all errors
- Generated code references `ContactsPage`, `AccountsPage`, `LeadsPage` — ensure the correct page is imported for your entity
