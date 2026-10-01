# Coding Standards

All contributors must follow these standards. The Kiro AI agent is also instructed to follow them when generating or modifying code.

---

## TypeScript

- **Strict mode** is enabled (`"strict": true` in tsconfig). No `any` without a comment explaining why.
- Use `const` by default. Only use `let` when the value genuinely changes.
- All functions and methods must have explicit return types.
- Use `async/await` — never raw `.then()` chains.
- Prefer `??` (nullish coalescing) over `||` for default values.
- No `console.log` — use `this.logger.info/warn/error/debug`.

```typescript
// ✅ Good
async createContact(data: ContactData): Promise<void> {
  this.logger.info(`Creating contact: ${data.lastName}`);
  await this.fillInput(this.lastNameField, data.lastName);
}

// ❌ Bad
async createContact(data: any) {
  console.log('creating');
  await this.fillInput('[data-id="lastname"] input', data.lastName);
}
```

---

## Page Object Model Rules

### One class per CRM entity
Each entity (Contacts, Accounts, Leads, Opportunities…) gets its own class in `src/pages/crm/`.

### Locators are private class fields — never inline
```typescript
// ✅ Good — locator defined once at the top of the class
private readonly lastNameField = this.page.locator('[data-id="lastname"] input');

async fillLastName(value: string): Promise<void> {
  await this.fillInput(this.lastNameField, value);
}

// ❌ Bad — raw locator in the method
async fillLastName(value: string): Promise<void> {
  await this.page.locator('[data-id="lastname"] input').fill(value);
}
```

### CRM locator conventions
| Field type | Selector pattern |
|---|---|
| Text / number input | `[data-id="fieldLogicalName"] input` |
| Textarea | `[data-id="fieldLogicalName"] textarea` |
| OptionSet (dropdown) | Use `selectOptionSetField('fieldLogicalName', 'Label')` |
| Lookup field | Use `fillLookupField('fieldLogicalName', 'search term')` |
| Date field | Use `fillDateField('fieldLogicalName', 'MM/DD/YYYY')` |
| Command bar button | Use `clickCommandBarButton('Button Label')` |

### Every public method must have a JSDoc comment
```typescript
/**
 * Qualify a lead — optionally creates Contact, Account, and Opportunity.
 * @param leadName  Last name visible in the grid
 * @param options   Which entities to create on qualification
 */
async qualifyLead(leadName: string, options?: QualifyLeadOptions): Promise<void>
```

### Assertions belong in Page Objects, not tests
```typescript
// ✅ Good — assertion is a reusable method on ContactsPage
await contacts.assertContactDetails({ firstName, lastName });

// ❌ Bad — raw assertion in the test
expect(await page.locator('[data-id="firstname"] input').inputValue()).toBe(firstName);
```

---

## Test File Standards

### File naming
```
tests/crm/<entity-name>.spec.ts        # Hand-authored
tests/crm/<us-title-kebab>.spec.ts     # AI-generated (from sync:azure)
features/crm/<entity-name>.feature     # BDD scenarios
```

### Test structure
```typescript
test.describe('[US-<id>] <User Story Title>', () => {

  // Group by scenario type
  test('Happy path — <what succeeds>', async ({ page }) => { ... });
  test('Validation — <what fails>', async ({ page }) => { ... });
  test('Edge case — <boundary condition>', async ({ page }) => { ... });

});
```

### Test data — always use TestDataHelper
```typescript
// ✅ Good — unique, traceable, cleanable
const { firstName, lastName } = TestDataHelper.contactName();

// ❌ Bad — hardcoded data causes collisions between runs
const firstName = 'John';
const lastName = 'Smith';
```

### Never hardcode waits
```typescript
// ✅ Good
await contacts.waitForCRMLoad();
await page.waitForSelector('[data-id="name"]');

// ❌ Bad
await page.waitForTimeout(3000);
```

---

## AI-Generated Code

When `npm run sync:azure` generates a spec file:
1. Review the generated file before committing.
2. The `playwrightCode` blocks are starting points — verify selectors against the actual CRM form.
3. Add `// REVIEWED: <your name> <date>` comment to the describe block after review.
4. Do not edit the header comment block (it contains the work item ID and generation timestamp).

---

## Git Conventions

### Branch naming
```
feature/US-<id>-short-description
fix/US-<id>-short-description
chore/update-dependencies
```

### Commit messages (Conventional Commits)
```
feat(contacts): add createContact method to ContactsPage
fix(login): handle MFA prompt on AAD login
test(leads): add qualify lead spec for US-1234
chore: update playwright to 1.46
```

### Pull Request checklist
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes locally (or in Docker)
- [ ] No hardcoded selectors in test files
- [ ] No `page.waitForTimeout()` calls
- [ ] Test data uses `TestDataHelper`
- [ ] New page objects have JSDoc on all public methods
- [ ] AI-generated specs marked as REVIEWED

---

## Folder Ownership

| Folder | Owner | Notes |
|---|---|---|
| `src/pages/` | QA Automation team | Add pages for new CRM entities here |
| `src/ai/` | Automation lead | Changes affect all AI generation |
| `src/azure/` | Automation lead | ADO API client |
| `tests/crm/` | All QA engineers | Add specs freely |
| `features/` | QA + Business Analysts | BDD scenarios — BA sign-off required |
| `docs/` | Automation lead | Update with every major change |
| `.github/workflows/` | DevOps / Automation lead | CI changes need review |
