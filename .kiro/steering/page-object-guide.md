---
inclusion: manual
---

# Page Object Creation Guide

Reference this when adding a new CRM entity to the framework.

## Step 1 — Create the interface in src/types/index.ts

Add a data interface for the new entity's form fields:

```typescript
export interface OpportunityData {
  name: string;
  accountName?: string;
  estimatedRevenue?: string;
  estimatedCloseDate?: string;
  stage?: string;
  probability?: string;
  description?: string;
}
```

## Step 2 — Create the Page Object

File: `src/pages/crm/<EntityName>Page.ts`

```typescript
import { Page } from '@playwright/test';
import { CRMDashboardPage } from '../CRMDashboardPage';
import { OpportunityData } from '../../types';

export class OpportunitiesPage extends CRMDashboardPage {
  // ── Locators ─────────────────────────────────────────────────────────────
  private readonly nameField = this.page.locator('[data-id="name"] input');
  private readonly accountField = this.page.locator('[data-id="parentaccountid"] input');
  private readonly revenueField = this.page.locator('[data-id="estimatedvalue"] input');
  private readonly closeDateField = this.page.locator('[data-id="estimatedclosedate"] input');
  private readonly stageField = this.page.locator('[data-id="stepname"] input');

  constructor(page: Page) {
    super(page);
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  /** Navigate to the Opportunities list view. */
  async navigateToOpportunities(): Promise<void> {
    await this.navigateToEntityList('opportunities');
    await this.waitForGrid();
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  /** Create a new opportunity and save. */
  async createOpportunity(data: OpportunityData): Promise<void> {
    this.logger.info(`Creating opportunity: ${data.name}`);
    await this.navigateToOpportunities();
    await this.clickNew();
    await this.fillOpportunityForm(data);
    await this.clickSave();
    await this.assertSaveSuccess();
  }

  /** Fill opportunity form with provided data. */
  async fillOpportunityForm(data: OpportunityData): Promise<void> {
    await this.fillInput(this.nameField, data.name);
    if (data.accountName) await this.fillLookupField('parentaccountid', data.accountName);
    if (data.estimatedRevenue) await this.fillInput(this.revenueField, data.estimatedRevenue);
    if (data.estimatedCloseDate) await this.fillDateField('estimatedclosedate', data.estimatedCloseDate);
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  /** Assert an opportunity with the given name exists in the grid. */
  async assertOpportunityExists(name: string): Promise<void> {
    await this.navigateToOpportunities();
    await this.searchInGrid(name);
    const row = this.page.locator(`[data-automationid="DetailsRow"]:has-text("${name}")`).first();
    await this.assertVisible(row, `Opportunity "${name}" should exist`);
  }
}
```

## Step 3 — Export from pages/index.ts

```typescript
export { OpportunitiesPage } from './crm/OpportunitiesPage';
```

## Step 4 — Write the spec

`tests/crm/opportunities.spec.ts` — follow the template in `test-generation.md`.

## Step 5 — Write the BDD feature

`features/crm/opportunities.feature` — follow the template in `test-generation.md`.

## Step 6 — Add step definitions

`step-definitions/crm/opportunities.steps.ts` — re-use generic steps from `step-definitions/common/crm.steps.ts` where possible.

## CRM Logical Names Reference

Find entity logical names in: **CRM Settings → Customizations → Customize the System → Entities**

Common ones:
| Display Name | Logical Name (plural) |
|---|---|
| Contacts | contacts |
| Accounts | accounts |
| Leads | leads |
| Opportunities | opportunities |
| Cases | incidents |
| Activities | activitypointers |
| Tasks | tasks |
| Phone Calls | phonecalls |
| Appointments | appointments |

## Finding data-id Attributes

1. Open the CRM form in Chromium
2. Right-click the field → Inspect
3. Look for `data-id="fieldlogicalname"` on the container `div`
4. The input inside it is what you target: `[data-id="fieldlogicalname"] input`

If `data-id` is not present, fall back to:
- `[aria-label="Field Label"]`
- `input[placeholder="Field Label"]`
- `#fieldlogicalname_id`
