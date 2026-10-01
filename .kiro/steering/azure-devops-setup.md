---
inclusion: manual
---

# Azure DevOps Setup Guide

One-time setup steps to connect the framework to the `Projected Stock System` ADO project.

## 1. Create a Personal Access Token

1. Go to `https://dev.azure.com/NthDegree-Enterprise-Apps`
2. Click your profile picture (top right) → **Personal access tokens**
3. Click **New Token**
4. Name: `crm-automation-framework`
5. Organisation: `NthDegree-Enterprise-Apps`
6. Expiry: 1 year (set a calendar reminder to renew)
7. Scopes — select **Custom defined**, then enable:
   - Work Items: **Read & Write**
   - Test Management: **Read & Write**
   - Code: **Read** (needed for the AI sync workflow to commit spec files)
8. Click **Create** → copy the token immediately (shown once only)
9. Paste into `.env` as `AZURE_DEVOPS_PAT=<token>`

## 2. Verify Connection

```bash
# Test that the PAT works and the project is accessible
npx ts-node -e "
  const { AzureDevOpsClient } = require('./src/azure/AzureDevOpsClient');
  const client = new AzureDevOpsClient();
  client.getWorkItem(5827).then(item => console.log('Connected:', item.title)).catch(console.error);
"
```

## 3. Set Up GitHub Secrets

In the repository → **Settings → Secrets and variables → Actions**, add:

| Secret name | Value |
|---|---|
| `DYN365_BaseURL` | `https://login.microsoftonline.com/` |
| `DYN365_TEST_ORG_URL` | Full CRM URL with app ID |
| `DYN365_USER_NAME` | `zeliha.test@nthdegree2EO.onmicrosoft.com` |
| `DYN365_PASSWORD` | CRM password |
| `DYN365_TEST_USER_NAME` | `testplan@nthdegree2eo.onmicrosoft.com` |
| `DYN365_TEST_PASSWORD` | Test user password |
| `INVENTORY_MGMT_URL` | Inventory app URL |
| `INVENTORY_MGMT_USER_NAME` | Inventory user |
| `INVENTORY_MGMT_PASSWORD` | Inventory password |
| `AZURE_DEVOPS_ORG` | `https://dev.azure.com/NthDegree-Enterprise-Apps` |
| `AZURE_DEVOPS_PROJECT` | `Projected Stock System` |
| `AZURE_DEVOPS_PAT` | The PAT from Step 1 |
| `AI_PROVIDER` | `azure-openai` |
| `AZURE_OPENAI_ENDPOINT` | Your Azure OpenAI endpoint |
| `AZURE_OPENAI_API_KEY` | Your Azure OpenAI key |
| `AZURE_OPENAI_DEPLOYMENT` | Your deployment name |
| `AZURE_OPENAI_API_VERSION` | `2024-02-01` |

## 4. Create a Test Plan in ADO (optional but recommended)

1. Go to **Test Plans** in the `Projected Stock System` project
2. Create a plan named `CRM Automation — Sprint <N>`
3. Create a suite per entity: Contacts, Accounts, Leads, Opportunities, Cases
4. When `npm run sync:azure` creates test cases, they are linked to user stories.
   Optionally add them to suites via `client.addTestCaseToSuite(planId, suiteId, tcId)`.

## 5. Configure Conditional Access for Test Accounts

To prevent MFA blocking CI runs:
1. Azure Portal → **Azure Active Directory → Security → Conditional Access**
2. Create a new policy named `CRM Automation Test Accounts`
3. **Users**: Include `zeliha.test@nthdegree2EO.onmicrosoft.com` and `testplan@nthdegree2eo.onmicrosoft.com`
4. **Cloud apps**: Microsoft Dynamics CRM Online
5. **Conditions → Locations**: Exclude your CI runner's IP range (GitHub Actions uses `140.82.112.0/20` and others — see https://api.github.com/meta)
6. **Grant**: Allow access (no MFA required for this policy)
