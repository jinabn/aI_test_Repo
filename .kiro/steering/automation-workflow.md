---
inclusion: auto
name: automation-workflow
description: Apply when the user asks to automate a feature, create a test from a ticket, build a page object, or implement end-to-end automation for a CRM entity
---

# Azure DevOps Automation Workflow — Master Flow

Follow this step-by-step process every time you are asked to automate a user story or CRM feature. Do not skip steps. Each step references the tool or steering file that drives it.

---

## End-to-End Pipeline

```
1. READ AZURE DEVOPS WORK ITEM
   → get work item (summary, description, acceptance)

2. CREATE ALL MANUAL TEST CASES (Add link > New item)
   → Full set (happy/validation/negative/e2e) as Children

3. GENERATE FEATURE FILE
   → feature-file-generation.md (Gherkin, tags, save)

4. DISCOVER & VERIFY LOCATORS
   → playwright-healer.md (navigate, inspect, verify)

5. BUILD PAGE OBJECT
   → structure.md (naming, BasePage, fixtures)

6. WRITE TEST SPEC
   → tech.md (Playwright patterns, test structure)

7. RUN & HEAL
   → playwright-healer.md (fix failures, re-run)

8. UPDATE WORK ITEM & TRACEABILITY
   → Comment on work item + update test case outcomes
```

---

## Step-by-Step Detail

### Step 1: Read Azure DevOps Work Item

Use the **azure-devops MCP** `wit_work_item_get` tool:

```
get work item → id, title, description, acceptance criteria, tags
```

Extract:
- `System.Title` → test describe block name `[US-{id}] {title}`
- `System.Description` → requirements and scope
- `Microsoft.VSTS.Common.AcceptanceCriteria` → mandatory test coverage
- `System.Tags` → BDD tags

Connection: `https://dev.azure.com/NthDegree-Enterprise-Apps` / Project: `Projected Stock System`

---

### Step 2: Create All Manual Test Cases in ADO

Use **azure-devops MCP** `wit_work_item_create` — create each TC as a **Child** of the user story:

```
WorkItemType: "Test Case"
Action: "create"
Project: "Projected Stock System"
Fields:
  - System.Title: "<TC title>"
  - Microsoft.VSTS.TCM.Steps: "<steps XML>"
  - Microsoft.VSTS.Common.Priority: 1|2|3|4
  - Microsoft.VSTS.TCM.AutomationStatus: "Planned"
Link: Child of US-{id}
```

Create the full set sequentially to avoid revision conflicts:
1. Happy path — valid data, successful operation
2. Validation — required fields empty
3. Negative — invalid / boundary data
4. E2E — full workflow (e.g. create → search → update → delete)

After creation, link each TC to the parent US using `TestedBy` relation via `wit_work_item_update`.

---

### Step 3: Generate Feature File

Follow **`feature-file-generation.md`** steering:

- File: `features/crm/{entity-name}.feature`
- Include `@smoke`, `@regression`, `@crm`, `@{entity}` tags
- Background: `Given I am logged into CRM`
- Scenarios: one per test case created in Step 2
- Save to disk and confirm file exists

---

### Step 4: Discover & Verify Locators

Follow **`playwright-healer.md`** — use **Playwright MCP** tools:

```
navigate → CRM org URL
wait for CRM shell → [data-id="navbar-main"]
navigate to entity → sitemap or direct URL
inspect form fields → data-id attributes
verify each locator → fill/click/select to confirm it resolves
```

CRM locator pattern:
- Text field: `[data-id="fieldLogicalName"] input`
- Textarea: `[data-id="fieldLogicalName"] textarea`
- OptionSet: `selectOptionSetField('fieldLogicalName', 'Label')`
- Lookup: `fillLookupField('fieldLogicalName', 'search term')`
- Command bar: `clickCommandBarButton('Label')`

Store all verified locators as `private readonly` class fields in the page object.

---

### Step 5: Build Page Object

Follow **`coding-standards.md`** structure rules:

- File: `src/pages/crm/{EntityName}Page.ts`
- Extend `CRMDashboardPage` (not `BasePage` directly)
- Group: navigation locators → form fields → buttons → feedback
- Add action methods with JSDoc on every `public` method
- Register export in `src/pages/index.ts`

```typescript
export class {Entity}Page extends CRMDashboardPage {
  private readonly nameField = this.page.locator('[data-id="name"] input');
  constructor(page: Page) { super(page); }

  /** Navigate to the {Entity} list view. */
  async navigateTo{Entity}s(): Promise<void> {
    await this.navigateToEntityList('{entitylogicalname}');
    await this.waitForGrid();
  }
}
```

---

### Step 6: Write Test Spec

Follow **`test-generation.md`** patterns:

- File: `tests/crm/{entity-name}.spec.ts`
- Header comment with Work Item ID and TC IDs
- `test.describe('[US-{id}] {title}', () => { ... })`
- One `test()` block per TC created in Step 2
- Use `TestDataHelper` for all data — no hardcoded values
- Use `test.setTimeout(120000)` — CRM is slow
- Use `domcontentloaded` not `networkidle`
- Arrange-Act-Assert pattern in every test

---

### Step 7: Run & Heal (2-attempt retry rule)

Use **Playwright MCP** to run and observe:

```bash
npx playwright test tests/crm/{name}.spec.ts --headed
```

- **Attempt 1 fails** → diagnose: check locator, timing, CRM load state
- **Fix** → re-run once
- **Attempt 2 fails** → go back to Step 4, re-verify locators live on the app via Playwright MCP
- **Never patch the same locator a third time** without re-discovering it on the live app

| Symptom | Fix |
|---|---|
| Element not found | Re-verify `data-id` with Playwright MCP |
| Timeout on nav | Add `await page.waitForCRMLoad()` |
| Grid shows 0 rows | Wrong search bar selector — CRM has multiple |
| Save notification missing | Check `assertSaveError()` — may be an error not success |
| Lookup won't resolve | Use `fillLookupField()` — plain `fill()` skips suggestion dropdown |

---

### Step 8: Update Work Item & Traceability

Use **azure-devops MCP** `wit_work_item_update` and `wit_work_item_add_comment`:

1. Mark each Test Case as `Automated`:
   ```
   Microsoft.VSTS.TCM.AutomationStatus → "Automated"
   Microsoft.VSTS.TCM.AutomatedTestName → "tests/crm/{name}.spec.ts"
   Microsoft.VSTS.TCM.AutomatedTestStorage → "playwright"
   ```

2. Add a comment to the User Story:
   ```
   "Automation complete. Spec: tests/crm/{name}.spec.ts
    Test Cases: TC-{id1}, TC-{id2}, TC-{id3}
    All tests passing as of {date}."
   ```

3. Or use the npm script (does steps 1–3 automatically):
   ```bash
   npm run sync:azure -- --id {workItemId}
   ```

---

## Final Checklist

- [ ] `npm run typecheck` passes
- [ ] All spec tests pass locally
- [ ] No `page.waitForTimeout()` calls
- [ ] No hardcoded test data
- [ ] All locators are `private readonly` class fields
- [ ] Test Cases created in ADO and linked to User Story
- [ ] Test Cases marked `Automated` with file path
- [ ] BDD feature file written and step definitions complete
- [ ] Comment added to User Story in ADO


```typescript
/**
 * Work Item: #{id} — {title}
 * Generated: {date}
 * REVIEWED: <!-- add your name after review -->
 */
import { test, expect } from '@playwright/test';
import { {Entity}Page } from '../../src/pages/crm/{Entity}Page';
import { TestDataHelper } from '../../src/utils/testDataHelper';
import { ScreenshotHelper } from '../../src/utils/screenshotHelper';

test.describe('[US-{id}] {title}', () => {

  test('Happy path — {description}', async ({ page }, testInfo) => {
    const entity = new {Entity}Page(page);
    const screenshots = new ScreenshotHelper(page, testInfo);
    const data = { name: TestDataHelper.accountName() }; // use appropriate helper

    await entity.create{Entity}(data);
    await screenshots.capture('after-create');
    await entity.assert{Entity}Exists(data.name);
  });

  test('Validation — required fields', async ({ page }) => {
    // submit without required fields, assert error visible
  });

});
```

- Import from `../../src/pages` and `../../src/utils` — never direct paths
- Follow Arrange-Act-Assert pattern
- Use `test.setTimeout(120000)` for Dynamics CRM (slow loading)
- Use `domcontentloaded` instead of `networkidle` for navigation
- Include traceability comment header linking to work item + test case IDs

---

## Step 7: Write BDD Feature File

Create `features/crm/{name}.feature` alongside the spec:

```gherkin
@crm @{entity}
Feature: [US-{id}] {title}
  As a {role}
  I want to {action}
  So that {benefit}

  Background:
    Given I am logged into CRM

  @smoke
  Scenario: Successfully {happy path description}
    Given I navigate to the {Entity} list
    When I click New
    And I fill in the {entity} name with a unique test value
    And I click Save
    Then the {entity} should be saved successfully

  @regression
  Scenario: {Entity} requires {field} to be saved
    Given I navigate to the {Entity} list
    When I click New
    And I click Save without filling any fields
    Then I should see a required field validation error for {Field}
```

Create matching step definitions in `step-definitions/crm/{name}.steps.ts`.

---

## Step 8: Run & Heal (2-attempt retry rule)

```bash
# Run the new spec
npx playwright test tests/crm/{name}.spec.ts --headed

# If it fails once — diagnose the locator or timing issue
# Fix and re-run once more

# If it fails twice — step back and re-verify locators via Playwright MCP
# Do NOT patch the same locator a third time without re-discovering it
```

**Common CRM failure causes:**
| Symptom | Fix |
|---|---|
| Element not found | Re-verify data-id with Playwright MCP on live app |
| Timeout on navigation | Add `await leads.waitForCRMLoad()` after every nav |
| Grid shows 0 rows | Check search input selector — CRM has multiple search bars |
| Save notification never appears | CRM may show error instead — check `assertSaveError()` |
| Lookup field doesn't resolve | Use `fillLookupField()` helper — plain `fill()` won't trigger suggestions |

---

## Step 9: Push Test Case to Azure DevOps

```bash
# This creates the TC work item, links it to the user story, and marks it Automated
npm run sync:azure -- --id {workItemId}
```

Or manually via `AzureDevOpsClient`:
1. `createTestCase({ title, steps, priority })` → returns `testCaseId`
2. `linkTestCaseToUserStory(userStoryId, testCaseId)`
3. `markTestCaseAutomated(testCaseId, 'tests/crm/{name}.spec.ts')`

---

## Step 10: Final Checklist

- [ ] `npm run typecheck` passes
- [ ] Spec runs green locally
- [ ] No `page.waitForTimeout()` calls
- [ ] No hardcoded test data (names, emails, phones)
- [ ] Page object locators are all `private readonly` class fields
- [ ] Test Case linked to User Story in Azure DevOps
- [ ] BDD feature file written and step definitions complete
- [ ] `// REVIEWED:` comment added to describe block
