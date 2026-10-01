# Framework Architecture

## Overview

This is an AI-powered, end-to-end test automation framework for **Microsoft Dynamics 365 CRM** and the **Inventory Management** web application. It is built on Playwright + TypeScript, follows the Page Object Model (POM) pattern, integrates with Azure DevOps for test case management, and uses AI (Azure OpenAI / Ollama) to auto-generate test cases from user stories.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DEVELOPER / CI PIPELINE                      │
└───────────────┬────────────────────────────────────┬────────────────┘
                │                                    │
                ▼                                    ▼
   ┌────────────────────────┐          ┌─────────────────────────────┐
   │   AI Sync Command      │          │   npm test / playwright test │
   │   npm run sync:azure   │          │   (runs .spec.ts files)      │
   └────────────┬───────────┘          └────────────┬────────────────┘
                │                                    │
        ┌───────┴────────┐                  ┌────────┴──────────┐
        │ Azure DevOps   │                  │  Playwright Engine │
        │ REST API       │                  │  (Chromium)        │
        │ - Fetch US     │                  └────────┬──────────┘
        │ - Create TCs   │                           │
        │ - Link TCs     │              ┌────────────┴──────────────┐
        └───────┬────────┘              │      Page Object Model     │
                │                       │  BasePage                  │
        ┌───────┴────────┐              │  ├── LoginPage             │
        │ AI Generator   │              │  ├── CRMDashboardPage      │
        │ (Azure OpenAI  │              │  └── crm/                  │
        │  or Ollama)    │              │      ├── ContactsPage       │
        └───────┬────────┘              │      ├── AccountsPage       │
                │                       │      └── LeadsPage          │
        ┌───────┴────────┐              └────────────┬──────────────┘
        │ TestCaseWriter │                           │
        │ writes .spec.ts│              ┌────────────┴──────────────┐
        └────────────────┘              │        Utilities           │
                                        │  AuthHelper (storageState) │
                                        │  Logger (winston)          │
                                        │  ScreenshotHelper          │
                                        │  TestDataHelper            │
                                        └───────────────────────────┘
```

---

## Directory Structure

```
crm-ai-automation-framework/
│
├── .github/workflows/          # GitHub Actions CI pipelines
├── .kiro/                      # Kiro IDE steering & agent config
├── docker/                     # Dockerfile + compose for CI runner
│
├── docs/                       # This folder — team documentation
│   ├── architecture.md         ← You are here
│   ├── coding-standards.md
│   ├── onboarding-guide.md
│   ├── execution-guide.md
│   └── audit-report.md
│
├── src/
│   ├── ai/                     # AI test generation (Azure OpenAI / Ollama)
│   │   ├── AITestCaseGenerator.ts
│   │   ├── TestCaseWriter.ts
│   │   └── generateTests.ts
│   │
│   ├── azure/                  # Azure DevOps REST API integration
│   │   ├── AzureDevOpsClient.ts
│   │   └── syncTestCases.ts
│   │
│   ├── pages/                  # Page Object Model
│   │   ├── BasePage.ts         # Common helpers: fill, click, assert, wait
│   │   ├── LoginPage.ts        # Microsoft AAD login flow
│   │   ├── CRMDashboardPage.ts # Sitemap nav, command bar, grid, forms
│   │   └── crm/
│   │       ├── ContactsPage.ts
│   │       ├── AccountsPage.ts
│   │       └── LeadsPage.ts
│   │
│   ├── utils/
│   │   ├── logger.ts           # Winston structured logging
│   │   ├── authHelper.ts       # Session state save/restore
│   │   ├── screenshotHelper.ts # Named screenshots + report attach
│   │   └── testDataHelper.ts   # Unique AUTO-TEST prefixed test data
│   │
│   ├── config/index.ts         # Env config loader (typed)
│   └── types/index.ts          # All shared TypeScript interfaces
│
├── tests/
│   ├── auth/
│   │   └── auth.setup.ts       # Session authentication (runs before tests)
│   ├── crm/                    # Hand-authored + AI-generated spec files
│   │   ├── contacts.spec.ts
│   │   ├── accounts.spec.ts
│   │   └── leads.spec.ts
│   └── inventory/              # Inventory Management specs
│
├── features/                   # BDD Cucumber feature files
│   └── crm/
│       ├── contacts.feature
│       ├── accounts.feature
│       └── leads.feature
│
├── step-definitions/           # Cucumber step implementations
│
├── allure-results/             # Raw Allure data (gitignored)
├── allure-report/              # Generated HTML report (gitignored)
├── auth-state/                 # Browser sessions (gitignored)
├── test-results/               # Playwright artifacts (gitignored)
│
├── .env                        # Secrets (gitignored)
├── .env.example                # Template
├── cucumber.json               # Cucumber/BDD config
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

---

## Key Design Decisions

### 1. Page Object Model
Every screen/entity gets its own class. Tests never contain raw `page.locator()` calls — all selectors live in page objects. This makes tests resilient to UI changes: update one locator, all tests using it are fixed.

### 2. Authentication via storageState
CRM's AAD login is slow (3–8 seconds). Using Playwright `storageState`, we log in once per run and reuse the session cookie across all tests. The `auth.setup.ts` project runs first and saves `auth-state/*.storageState.json`.

### 3. AI Test Generation
The `AITestCaseGenerator` sends ticket title + description to GPT and receives structured JSON containing both natural-language steps (for Azure DevOps) and Playwright TypeScript code. The `TestCaseWriter` assembles the final `.spec.ts` file with proper imports, describe blocks, and annotations.

### 4. Azure DevOps Integration
Test cases are created as proper Test Case work items in ADO, not just notes. Each is linked to its parent User Story via the `TestedBy` relationship. After the spec file is written, the test case is marked `Automated` with the file path stored on the work item.

### 5. Dual Test Layers
- **Playwright specs** — fast, headless, full assertion power
- **Cucumber/BDD features** — human-readable scenarios that business stakeholders can review and sign off before automation runs

### 6. Multi-AI Backend
The generator supports Azure OpenAI (corporate tenants), Ollama (offline), and OpenAI.com — controlled by `AI_PROVIDER` in `.env`.

---

## Data Flow: User Story → Automated Test

```
1. Developer creates User Story in Azure DevOps with title + description
2. Run: npm run sync:azure -- --id <workItemId>
3. Framework fetches the story via ADO REST API
4. AI generates 3–6 test cases as structured JSON
5. AzureDevOpsClient creates Test Case work items in ADO
6. Each Test Case is linked to the User Story (TestedBy relation)
7. TestCaseWriter writes tests/crm/<story>.spec.ts
8. Test Case is marked Automated with the spec file path
9. Developer reviews and refines the generated spec
10. npm test runs the spec in CI and publishes results
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Test runner | Playwright 1.45+ |
| Language | TypeScript 5.5+ |
| AI generation | Azure OpenAI / Ollama (llama3) |
| Test management | Azure DevOps REST API v7.1 |
| BDD | Cucumber.js + @cucumber/playwright |
| Reporting | Playwright HTML + Allure |
| Logging | Winston |
| CI/CD | GitHub Actions |
| Containerisation | Docker + Docker Compose |
| Runtime | Node.js 20 LTS |
