# Execution Guide

Everything you need to know about running, generating, and reporting tests.

---

## Running Tests

### Full test suite
```bash
npm test
```

### Specific project
```bash
npx playwright test --project=crm-chromium
npx playwright test --project=inventory-chromium
```

### Single spec file
```bash
npx playwright test tests/crm/contacts.spec.ts
```

### Single test by title (grep)
```bash
npx playwright test --grep "Create a new contact"
```

### Headed mode (see the browser)
```bash
npm run test:headed
```

### Debug mode (step through with Playwright Inspector)
```bash
npm run test:debug
```

### With slow motion (useful for demos)
```bash
SLOW_MO=500 npm test
```

---

## AI Test Generation

### Full sync — fetch story, generate, push to ADO, write spec
```bash
# Single ticket
npm run sync:azure -- --id 5827

# All active user stories
npm run sync:azure

# Filter by ADO tag
npm run sync:azure -- --tag automation

# Dry run — generate files only, no ADO write
npm run sync:azure -- --dry-run --id 5827

# Inventory Management app
npm run sync:azure -- --id 5827 --app InventoryManagement
```

### Local generation only (no ADO write)
```bash
npm run generate:tests -- --id 5827
npm run generate:tests -- --title "Manage Contacts" --description "As a sales user..."
```

Generated files appear in `tests/crm/` or `tests/inventory/`.

---

## BDD / Cucumber Tests

```bash
# Run all feature files
npm run test:bdd

# Run a specific feature
npm run test:bdd -- --spec features/crm/contacts.feature

# Run by tag
npm run test:bdd -- --tags @smoke
npm run test:bdd -- --tags @regression
npm run test:bdd -- --tags "@crm and not @wip"
```

---

## Authentication

Sessions are saved in `auth-state/` and reused across all tests (valid for 12 hours).

```bash
# Force re-authentication (run this if tests fail with login errors)
Remove-Item auth-state\*.json
npx playwright test --project=setup
```

---

## Reporting

### Playwright HTML report
```bash
npm test
npm run test:report      # Opens the HTML report in your browser
```

### Allure report
```bash
npm test
npm run allure:report    # Generates the Allure HTML report
npm run allure:open      # Opens it in browser
npm run allure:serve     # Generates + opens in one command
```

The Allure report gives you:
- Test history and trend graphs
- Per-test timeline
- Screenshots and video inline
- Categorised failures (infrastructure vs product bugs)
- Environment info panel

### JUnit XML (for CI)
Generated automatically at `test-results/junit-results.xml` — used by GitHub Actions to publish results to the PR.

---

## Running in Docker

```bash
# Build the image
docker build -f docker/Dockerfile -t crm-automation .

# Run all tests
docker-compose -f docker/docker-compose.yml up --exit-code-from playwright

# Run a specific project
docker-compose -f docker/docker-compose.yml run playwright npx playwright test --project=crm-chromium
```

---

## Environment Variables for Local Overrides

You can override any `.env` value inline without editing the file:

```bash
# Run headed
HEADLESS=false npm test

# Extra slow for debugging
SLOW_MO=1000 HEADLESS=false npm test

# Use Ollama instead of Azure OpenAI
AI_PROVIDER=ollama npm run sync:azure -- --id 5827

# Verbose logging
LOG_LEVEL=debug npm run sync:azure -- --id 5827
```

---

## Parallelism

Tests are run with `fullyParallel: false` and `workers: 2` locally, `workers: 1` on CI.

CRM tests must not run fully parallel — shared CRM data (contacts, accounts) causes collisions. If you add cleanup logic (e.g. deleting records after each test), you can safely increase workers.

To run completely sequentially:
```bash
npx playwright test --workers=1
```

---

## Retries

- CI: 2 retries per failing test
- Local: 1 retry

To disable retries locally:
```bash
npx playwright test --retries=0
```

---

## Test Results Artefacts

After a run, these are available in `test-results/`:

| File | Content |
|---|---|
| `test-results/junit-results.xml` | JUnit XML for CI |
| `test-results/test-results.json` | Full JSON results |
| `test-results/screenshots/` | Failure screenshots |
| `test-results/logs/framework.log` | Full framework log |
| `test-results/logs/errors.log` | Errors only |
| `playwright-report/` | Playwright HTML report |
| `allure-results/` | Raw Allure data |
| `allure-report/` | Generated Allure HTML |

---

## Maintenance Tasks

### Update Playwright
```bash
npm install @playwright/test@latest
npx playwright install chromium
```

### Refresh test data (delete AUTO-TEST records from CRM)
Search CRM for `AUTO-TEST` in Global Search and bulk-delete. All test records created by `TestDataHelper` use this prefix.

### Re-generate tests for a sprint's user stories
```bash
# Sync all stories in the current iteration
npm run sync:azure
```
