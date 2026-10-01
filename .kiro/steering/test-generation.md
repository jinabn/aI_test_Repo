---
inclusion: auto
name: test-generation
description: Apply when the user asks to generate, create, or write test cases, specs, or automation for a CRM entity or user story
---

# AI Test Generation Rules

When generating test cases or spec files for this framework, always follow this checklist.

## Checklist Before Writing Any Test

1. **Check if a page object exists** for the entity in `src/pages/crm/`. If not, create it first.
2. **Check `src/types/index.ts`** for existing interfaces before defining new data shapes.
3. **Use `TestDataHelper`** for all test data — never hardcode names, emails, or phones.
4. **Wrap in a describe block** with the ADO work item ID: `[US-XXXX] Title`.

## Spec File Template

```typescript
/**
 * AUTO-GENERATED / REVIEWED
 * Azure DevOps Work Item: #XXXX
 * Title: <story title>
 */
import { test, expect } from '@playwright/test';
import { <EntityPage> } from '../../src/pages/crm/<EntityPage>';
import { TestDataHelper } from '../../src/utils/testDataHelper';
import { ScreenshotHelper } from '../../src/utils/screenshotHelper';

test.describe('[US-XXXX] <Story Title>', () => {

  test('Happy path — <what succeeds>', async ({ page }, testInfo) => {
    const entity = new <EntityPage>(page);
    const screenshots = new ScreenshotHelper(page, testInfo);
    // test data
    // actions
    // assertions via page object methods
  });

  test('Validation — <what fails>', async ({ page }) => {
    // negative path
  });

});
```

## Required Test Coverage Per User Story

Always cover all of these unless the story explicitly excludes them:
- **Happy path** — valid data, successful operation
- **Required field validation** — submit with empty required fields
- **Duplicate / boundary** — duplicate records, max-length inputs
- **Search / find** — verify the record appears in grid search
- **Edit** — update a field and verify it persists
- **Delete** — delete and verify it's gone from the grid

## Page Object Template (new CRM entity)

```typescript
import { Page } from '@playwright/test';
import { CRMDashboardPage } from '../CRMDashboardPage';

export interface <Entity>Data {
  name: string;
  // add other fields
}

export class <Entity>Page extends CRMDashboardPage {
  // Locators — private readonly fields only
  private readonly nameField = this.page.locator('[data-id="name"] input');

  constructor(page: Page) {
    super(page);
  }

  /** Navigate to the <Entity> list view. */
  async navigateTo<Entity>s(): Promise<void> {
    await this.navigateToEntityList('<entityplurallogicalname>');
    await this.waitForGrid();
  }

  /** Create a new <entity> and save. */
  async create<Entity>(data: <Entity>Data): Promise<void> {
    await this.navigateTo<Entity>s();
    await this.clickNew();
    await this.fillInput(this.nameField, data.name);
    await this.clickSave();
    await this.assertSaveSuccess();
  }

  /** Assert the <entity> record shows in the grid. */
  async assert<Entity>Exists(name: string): Promise<void> {
    await this.navigateTo<Entity>s();
    await this.searchInGrid(name);
    const row = this.page.locator(`[data-automationid="DetailsRow"]:has-text("${name}")`).first();
    await this.assertVisible(row);
  }
}
```

## BDD Feature Template (alongside spec file)

```gherkin
Feature: [US-XXXX] <Story Title>

  Background:
    Given I am logged into CRM as a sales user

  @smoke @crm
  Scenario: Successfully create a <entity> with valid data
    Given I navigate to the <Entity> list
    When I click New
    And I fill in the name "<AUTO-TEST Name>"
    And I click Save
    Then the <entity> should be saved successfully
    And I should see "<AUTO-TEST Name>" in the <entity> grid
```
