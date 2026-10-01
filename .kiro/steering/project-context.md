---
inclusion: always
---

# Project Context — Projected Stock System CRM Automation

## Repository
- **Workspace root**: `d:\2026\Oasis\Trial4`
- **ADO Organisation**: `https://dev.azure.com/NthDegree-Enterprise-Apps`
- **ADO Project**: `Projected Stock System`

## Applications Under Test

### Dynamics 365 CRM
- **URL**: `https://nthcrm-test.crm.dynamics.com/main.aspx?appid=aa6ffe26-ba5d-44d3-9d87-09e23d665f73`
- **Primary user**: `zeliha.test@nthdegree2EO.onmicrosoft.com`
- **Test plan user**: `testplan@nthdegree2eo.onmicrosoft.com`
- **Auth**: Microsoft AAD — session saved to `auth-state/crm.storageState.json`
- **Entities in scope**: Contacts, Accounts, Leads, Opportunities, Cases, Activities

### Inventory Management
- **URL**: `https://inventorymanagement-qa-cgfag2apgkbzhphj.eastus2-01.azurewebsites.net`
- **User**: `zeliha.test@nthdegree2EO.onmicrosoft.com`
- **Auth**: Microsoft AAD — session saved to `auth-state/inventory.storageState.json`

## Key Source Locations

| What | Where |
|---|---|
| All shared types/interfaces | `src/types/index.ts` |
| Environment config loader | `src/config/index.ts` |
| Base page helpers | `src/pages/BasePage.ts` |
| AAD login flow | `src/pages/LoginPage.ts` |
| CRM nav/grid/form helpers | `src/pages/CRMDashboardPage.ts` |
| CRM entity page objects | `src/pages/crm/` |
| AI test generation | `src/ai/AITestCaseGenerator.ts` |
| Spec file writer | `src/ai/TestCaseWriter.ts` |
| ADO REST client | `src/azure/AzureDevOpsClient.ts` |
| Full sync script | `src/azure/syncTestCases.ts` |
| Logger | `src/utils/logger.ts` |
| Auth session helper | `src/utils/authHelper.ts` |
| Test data factory | `src/utils/testDataHelper.ts` |
| Screenshot helper | `src/utils/screenshotHelper.ts` |

## AI Provider Configuration
- `AI_PROVIDER=azure-openai` is the default (set in `.env`)
- Azure OpenAI credentials: `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`
- Fallback: `AI_PROVIDER=ollama` with `OLLAMA_MODEL=llama3`
- OpenAI.com is blocked by the organisation

## Test Data Convention
All test records created by the framework are prefixed with `AUTO-TEST` (via `TestDataHelper`).
Search CRM globally for `AUTO-TEST` to find and clean up test data after a run.

## Available npm Scripts
- `npm test` — run all Playwright tests
- `npm run test:bdd` — run Cucumber BDD tests (OPTIONAL - can be skipped)
- `npm run manual:workflow -- --id <id>` — **MAIN WORKFLOW**: fetch ADO ticket, create test cases, generate automation script
- `npm run sync:azure -- --id <id>` — AI sync from ADO ticket (requires AI provider)
- `npm run generate:tests -- --id <id>` — generate spec locally (no ADO write, requires AI)
- `npm run typecheck` — TypeScript check
- `npm run allure:serve` — generate + open Allure report
