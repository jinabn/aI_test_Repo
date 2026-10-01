# Contributing to CRM AI Automation Framework

Thank you for your interest in contributing! This document provides guidelines and workflows for contributing to this project.

## 🎯 Getting Started

### Prerequisites

- Node.js 18+
- Git
- Access to Azure DevOps (NthDegree Enterprise Apps)
- CRM & Inventory Management credentials

### Setup

1. Clone the repository
```bash
git clone https://github.com/jinabn/aI_test_Repo.git
cd aI_test_Repo
```

2. Install dependencies
```bash
npm install
npx playwright install chromium
```

3. Configure environment
```bash
copy .env.example .env
# Edit .env with your credentials
```

4. Verify setup
```bash
npm run typecheck
npm test -- --headed
```

---

## 🌳 Branching Strategy

### Branch Naming Convention

```
feature/US-<ticket-id>-short-description
fix/BUG-<ticket-id>-short-description
docs/<description>
chore/<description>
```

**Examples:**
- `feature/US-5827-inventory-navigation`
- `fix/BUG-1234-login-timeout`
- `docs/update-readme`
- `chore/update-dependencies`

### Workflow

1. Create a branch from `main`
```bash
git checkout main
git pull origin main
git checkout -b feature/US-1234-add-opportunities
```

2. Make your changes

3. Commit with conventional commits
```bash
git add .
git commit -m "feat(opportunities): add create opportunity functionality"
```

4. Push to GitHub
```bash
git push origin feature/US-1234-add-opportunities
```

5. Create a Pull Request

---

## 📝 Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(contacts): add bulk delete` |
| `fix` | Bug fix | `fix(auth): resolve timeout issue` |
| `docs` | Documentation | `docs(readme): add setup guide` |
| `test` | Tests | `test(leads): add qualification tests` |
| `refactor` | Code refactoring | `refactor(pages): extract common methods` |
| `style` | Formatting | `style(contacts): fix indentation` |
| `chore` | Maintenance | `chore(deps): update playwright` |
| `perf` | Performance | `perf(grid): optimize load time` |

### Scope

Use the module or component name:
- `contacts`, `accounts`, `leads`, `opportunities`
- `auth`, `logger`, `utils`
- `ci`, `docker`, `readme`

### Examples

```bash
feat(opportunities): add create opportunity with products
fix(auth): handle MFA redirect properly
docs(contributing): add branching strategy
test(inventory): add navigation smoke tests
refactor(pages): extract CRM base helpers
chore(deps): update playwright to 1.46.0
```

---

## 🧪 Testing Guidelines

### Before Committing

1. **Run TypeScript check**
```bash
npm run typecheck
```

2. **Run all tests**
```bash
npm test
```

3. **Run your specific tests**
```bash
npm test tests/crm/opportunities.spec.ts -- --headed
```

4. **Generate report**
```bash
npm run allure:serve
```

### Writing Tests

Follow these rules:

1. **Use Page Object Model**
```typescript
// ✅ Good
const opportunities = new OpportunitiesPage(page);
await opportunities.createOpportunity(data);

// ❌ Bad
await page.click('[data-id="new"]');
await page.fill('[data-id="name"]', 'Test');
```

2. **Use TestDataHelper**
```typescript
// ✅ Good
const { firstName, lastName } = TestDataHelper.contactName();

// ❌ Bad
const firstName = 'John';
const lastName = 'Doe';
```

3. **Add JSDoc comments**
```typescript
/**
 * Create a new opportunity with products
 * @param data Opportunity data including name, account, and products
 */
async createOpportunityWithProducts(data: OpportunityData): Promise<void> {
  // ...
}
```

4. **Include test case ID in describe block**
```typescript
test.describe('[US-1234] Opportunity Management', () => {
  // tests here
});
```

---

## 📄 Documentation

### When to Update Docs

Update documentation when:
- Adding new features
- Changing workflows
- Fixing significant bugs
- Adding new page objects
- Changing configuration

### Documentation Files

| File | Update When |
|------|-------------|
| `README.md` | Major features, setup changes |
| `docs/manual-workflow-guide.md` | Workflow changes |
| `docs/coding-standards.md` | New coding rules |
| `docs/quick-reference.md` | New commands |

---

## 🔍 Code Review Checklist

Before requesting review:

- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] Code follows POM pattern
- [ ] JSDoc comments added
- [ ] Test data uses TestDataHelper
- [ ] No hardcoded credentials
- [ ] No `console.log` (use logger)
- [ ] Screenshots attached (if UI changes)
- [ ] Allure report generated

---

## 🚀 Pull Request Process

### PR Title Format

```
[US-1234] Add opportunity management functionality
[BUG-5678] Fix authentication timeout
[DOCS] Update onboarding guide
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation update
- [ ] Refactoring
- [ ] Performance improvement

## Related Work Items
- Azure DevOps: #1234

## Testing
- [ ] All existing tests pass
- [ ] New tests added
- [ ] Manual testing completed

## Screenshots/Videos
(If applicable)

## Checklist
- [ ] Code follows POM pattern
- [ ] TypeScript compiles clean
- [ ] Documentation updated
- [ ] Allure report generated
```

### Review Process

1. Create PR on GitHub
2. Link Azure DevOps work item
3. Wait for CI/CD checks
4. Address review comments
5. Get approval from 1+ reviewers
6. Squash and merge

---

## 🏗️ Adding New Page Objects

### 1. Create Page Object

```bash
# For CRM entities
src/pages/crm/OpportunitiesPage.ts

# For Inventory
src/pages/inventory/StockOverviewPage.ts
```

### 2. Extend Correct Base Class

```typescript
// CRM entities
export class OpportunitiesPage extends CRMDashboardPage {
  // ...
}

// Inventory pages
export class StockOverviewPage extends InventoryBasePage {
  // ...
}
```

### 3. Follow Locator Pattern

```typescript
// All locators are private readonly
private readonly nameField = this.page.locator('[data-id="name"] input');
private readonly saveButton = this.page.locator('[data-id="save-button"]');
```

### 4. Add JSDoc Comments

```typescript
/**
 * Navigate to opportunities list
 */
async navigateToOpportunities(): Promise<void> {
  await this.navigateToEntityList('opportunities');
  await this.waitForGrid();
}
```

### 5. Create Test File

```bash
tests/crm/opportunities.spec.ts
```

### 6. Run Tests

```bash
npm test tests/crm/opportunities.spec.ts -- --headed
```

---

## 🐛 Bug Reports

When reporting bugs:

1. **Check existing issues first**
2. **Use the bug template**
3. **Include:**
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/videos
   - Console logs
   - Test results
   - Environment (OS, Node version)

---

## 💡 Feature Requests

When requesting features:

1. **Check roadmap first** (in README.md)
2. **Use the feature template**
3. **Include:**
   - Clear use case
   - Proposed solution
   - Alternative solutions
   - Additional context

---

## 📞 Getting Help

- **Documentation:** [docs/](docs/)
- **Azure DevOps:** [Project Boards](https://dev.azure.com/NthDegree-Enterprise-Apps/Projected%20Stock%20System)
- **GitHub Issues:** [Issues](https://github.com/jinabn/aI_test_Repo/issues)

---

## 🎨 Code Style

### TypeScript

- Use `const` by default
- Explicit return types on all functions
- No `any` type (use `unknown` if needed)
- Use `async/await` (no `.then()`)
- Use `??` for defaults (not `||`)

### Naming

- **Files:** kebab-case (`contact-details.spec.ts`)
- **Classes:** PascalCase (`ContactsPage`)
- **Methods:** camelCase (`createContact`)
- **Constants:** UPPER_SNAKE_CASE (`DEFAULT_TIMEOUT`)

### Comments

```typescript
// Good: Explain WHY, not WHAT
// Wait for async validation to complete before clicking
await page.waitForLoadState('networkidle');

// Bad: Obvious comments
// Click the button
await page.click('button');
```

---

## 📦 Dependencies

### Adding New Dependencies

1. Check if dependency is necessary
2. Verify it's actively maintained
3. Check for security vulnerabilities
4. Pin exact version (no `^` or `~`)
5. Update documentation

```bash
npm install --save-exact playwright@1.45.3
```

---

## ✅ Definition of Done

A task is done when:

- [ ] Code complete and reviewed
- [ ] All tests pass
- [ ] TypeScript compiles clean
- [ ] Documentation updated
- [ ] PR approved and merged
- [ ] Azure DevOps work item updated
- [ ] Demo completed (if applicable)

---

**Thank you for contributing!** 🎉
