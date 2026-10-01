# Onboarding Guide

Welcome to the CRM AI Automation Framework. This guide gets you from zero to running tests in under 30 minutes.

---

## Prerequisites

Install these before anything else:

| Tool | Version | Download |
|---|---|---|
| Node.js | 20 LTS | https://nodejs.org |
| Git | Latest | https://git-scm.com |
| VS Code | Latest | https://code.visualstudio.com |
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop (optional, for CI parity) |
| Kiro IDE | Latest | https://kiro.dev (optional, for AI-assisted development) |

---

## Step 1 — Clone and install

```bash
git clone <repo-url>
cd crm-ai-automation-framework
npm install
npx playwright install chromium
```

---

## Step 2 — Configure environment

```bash
copy .env.example .env
```

Open `.env` and fill in these values. Ask your team lead for the secrets.

| Variable | Where to get it |
|---|---|
| `AZURE_DEVOPS_PAT` | Azure DevOps → Profile → Personal Access Tokens → New Token (Work Items R/W + Test Management R/W) |
| `AZURE_OPENAI_ENDPOINT` | Azure Portal → your OpenAI resource → Keys and Endpoint |
| `AZURE_OPENAI_API_KEY` | Same place as above |
| `AZURE_OPENAI_DEPLOYMENT` | Azure Portal → your OpenAI resource → Model deployments |

CRM credentials (`DYN365_*`) and the ADO org/project are already pre-filled.

---

## Step 3 — Verify setup

```bash
# Check TypeScript compiles cleanly
npm run typecheck

# Run the auth setup (logs into CRM and saves session)
npx playwright test --project=setup

# Run a single smoke test to verify everything works
npx playwright test tests/crm/contacts.spec.ts --project=crm-chromium --headed
```

You should see a Chromium browser open, log into CRM, create a contact, and close.

---

## Step 4 — Understand the project

Read these docs in order:
1. `docs/architecture.md` — how all the pieces fit together
2. `docs/coding-standards.md` — rules for writing tests and page objects
3. `docs/execution-guide.md` — how to run, generate, and report tests

---

## Step 5 — Write your first test

### Option A — AI-generate from an Azure DevOps ticket

```bash
# Replace 5827 with a real ticket ID
npm run sync:azure -- --id 5827 --dry-run
```

`--dry-run` generates the spec file locally without pushing to ADO. Review the output in `tests/crm/`.

Remove `--dry-run` to also create Test Case work items in ADO and link them.

### Option B — Write a manual test

1. Create `tests/crm/opportunities.spec.ts`
2. Import the relevant page object:
   ```typescript
   import { CRMDashboardPage } from '../../src/pages/CRMDashboardPage';
   ```
3. If no page object exists for your entity, create one in `src/pages/crm/` — extend `CRMDashboardPage`.
4. Follow the patterns in `tests/crm/contacts.spec.ts`.

### Option C — Write a BDD scenario

1. Create `features/crm/opportunities.feature`
2. Write Gherkin steps (see `features/crm/contacts.feature` for examples)
3. Run `npm run test:bdd` — Cucumber will tell you which steps need implementation
4. Add step definitions to `step-definitions/crm/opportunities.steps.ts`

---

## VS Code Extensions (recommended)

Install these from the Extensions panel:

| Extension | ID |
|---|---|
| Playwright Test for VS Code | `ms-playwright.playwright` |
| ESLint | `dbaeumer.vscode-eslint` |
| Cucumber (Gherkin) Full Support | `alexkrechik.cucumberautocomplete` |
| DotENV | `mikestead.dotenv` |
| GitLens | `eamodio.gitlens` |

---

## Common Issues

**"Auth state file not found" when running tests**
```bash
npx playwright test --project=setup
```
This creates the session files in `auth-state/`. Tests depend on this running first.

**CRM shows a "You need permission" page**
Your test account may not have a CRM licence. Contact your Azure AD admin to assign a Dynamics 365 licence to `zeliha.test@nthdegree2EO.onmicrosoft.com`.

**AI generation returns empty test cases**
- Check `AI_PROVIDER` is set correctly in `.env`
- For `azure-openai`: verify the endpoint URL ends with `/` and the deployment name is exact
- For `ollama`: run `ollama list` to confirm the model is pulled

**TypeScript errors after pulling latest**
```bash
npm install
npm run typecheck
```

**Tests fail with timeout on CRM loading**
Increase `DEFAULT_TIMEOUT` in `.env` to `60000`. CRM can be slow on first load.

---

## Getting Help

- **Slack**: `#crm-automation` channel
- **ADO Board**: `Projected Stock System` project → `Automation` area
- **Docs**: This `docs/` folder
- **Architecture questions**: `docs/architecture.md`
