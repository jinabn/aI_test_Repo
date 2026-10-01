---
inclusion: always
---

# CRM Automation Framework — Coding Standards

You are an AI assistant working inside the CRM AI Automation Framework. Always follow these rules when generating or modifying code.

## Project Context

- Application under test: **Microsoft Dynamics 365 CRM** + Inventory Management web app
- Framework: **Playwright + TypeScript** with Page Object Model
- Test management: **Azure DevOps** (`Projected Stock System` project)
- AI backend: **Azure OpenAI** (primary), Ollama (fallback)
- Organisation: NthDegree Enterprise Apps

## TypeScript Rules

- Strict mode is ON — never use implicit `any`. If `any` is unavoidable, add a comment explaining why.
- All functions and methods must have explicit return types.
- Use `async/await` — never `.then()` chains.
- Use `const` by default; only `let` when the value genuinely changes.
- Use `??` for defaults, not `||`.
- Never use `console.log` — use `this.logger.info/warn/error/debug`.
- No magic strings — use typed interfaces from `src/types/index.ts`.

## Page Object Rules

- Every CRM entity gets its own class in `src/pages/crm/` extending `CRMDashboardPage`.
- All locators are **private readonly class fields** — never inline in methods.
- CRM locator patterns:
  - Text input: `[data-id="fieldLogicalName"] input`
  - Textarea: `[data-id="fieldLogicalName"] textarea`
  - OptionSet: use `this.selectOptionSetField('fieldName', 'Label')`
  - Lookup: use `this.fillLookupField('fieldName', 'search term')`
  - Command bar: use `this.clickCommandBarButton('Label')`
- All public methods must have JSDoc comments.
- Assertions belong in page object methods — never raw `expect()` in test files directly unless trivial.

## Test File Rules

- Always use `TestDataHelper` for test data — never hardcode names, emails, or phones.
- Never use `page.waitForTimeout()` — use `waitForCRMLoad()`, `waitForSelector()`, or `waitForGrid()`.
- Every test describe block title must include the Azure work item ID: `[US-XXXX] Title`.
- Import page objects from `../../src/pages`, utilities from `../../src/utils`.
- Auth is handled by `storageState` — never include login steps in individual tests.

## File Naming

- Page objects: `src/pages/crm/EntityNamePage.ts` (PascalCase)
- Test specs: `tests/crm/entity-name.spec.ts` (kebab-case)
- BDD features: `features/crm/entity-name.feature` (kebab-case)
- Step definitions: `step-definitions/crm/entity-name.steps.ts` (kebab-case)

## When Creating New Page Objects

Always extend `CRMDashboardPage` (not `BasePage` directly) for CRM entities:

```typescript
import { Page } from '@playwright/test';
import { CRMDashboardPage } from '../CRMDashboardPage';

export class OpportunitiesPage extends CRMDashboardPage {
  private readonly nameField = this.page.locator('[data-id="name"] input');

  constructor(page: Page) {
    super(page);
  }

  async navigateToOpportunities(): Promise<void> {
    await this.navigateToEntityList('opportunities');
    await this.waitForGrid();
  }
}
```

## When Creating New Tests

```typescript
import { test, expect } from '@playwright/test';
import { ContactsPage } from '../../src/pages/crm/ContactsPage';
import { TestDataHelper } from '../../src/utils/testDataHelper';

test.describe('[US-XXXX] Feature Name', () => {
  test('Happy path — description', async ({ page }) => {
    const contacts = new ContactsPage(page);
    const { firstName, lastName } = TestDataHelper.contactName();
    await contacts.createContact({ firstName, lastName });
    await contacts.assertContactDetails({ firstName, lastName });
  });
});
```

## When Adding New Dependencies

- Pin exact versions in `package.json` (no `^` or `~`).
- Verify the package is actively maintained and has no critical CVEs.
- Run `npm run typecheck` after adding.

## Git Conventions

- Branch: `feature/US-<id>-description` or `fix/US-<id>-description`
- Commits: Conventional Commits — `feat(contacts): ...`, `fix(login): ...`, `test(leads): ...`
- Never commit `.env`, `auth-state/`, `test-results/`, or `allure-results/`.
