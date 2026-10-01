# Automation Audit Report

**Project**: Projected Stock System — CRM Automation Framework  
**Application**: Microsoft Dynamics 365 CRM + Inventory Management  
**Framework version**: 1.0.0  
**Report date**: <!-- update on each audit -->  
**Prepared by**: <!-- name -->

---

## Executive Summary

This document records the automation coverage, quality metrics, and risk assessment for the CRM test automation framework. It is updated at the end of each sprint or on demand.

---

## Coverage Summary

| Entity / Module | Total User Stories | Test Cases Created | Automated | Coverage % |
|---|---|---|---|---|
| Contacts | — | — | — | — |
| Accounts | — | — | — | — |
| Leads | — | — | — | — |
| Opportunities | — | — | — | — |
| Cases | — | — | — | — |
| Inventory Management | — | — | — | — |
| **Total** | — | — | — | — |

> Fill this table after each sprint sync. Run `npm run sync:azure` to update ADO test case counts.

---

## Test Execution Results (Last Run)

| Metric | Value |
|---|---|
| Total tests | — |
| Passed | — |
| Failed | — |
| Skipped | — |
| Pass rate | — % |
| Average duration | — s |
| Run date | — |
| Environment | nthcrm-test |
| Browser | Chromium |

---

## Automation Framework Health

### Code Quality

| Check | Status | Notes |
|---|---|---|
| TypeScript strict mode | ✅ Enabled | `tsc --noEmit` passes |
| ESLint | ✅ Configured | `npm run lint` |
| No hardcoded waits | ✅ Enforced | Grep: no `waitForTimeout` in tests |
| No inline selectors in tests | ✅ Enforced | All selectors in page objects |
| Test data isolation | ✅ AUTO-TEST prefix | Records identifiable and deletable |

### Infrastructure

| Component | Status | Notes |
|---|---|---|
| CI pipeline | ✅ | GitHub Actions — `.github/workflows/playwright.yml` |
| Docker runner | ✅ | `docker/Dockerfile` + `docker-compose.yml` |
| Auth session management | ✅ | `storageState` — 12h refresh |
| Allure reporting | ✅ | `npm run allure:serve` |
| BDD layer | ✅ | Cucumber feature files in `features/crm/` |

### AI Generation

| Metric | Value |
|---|---|
| AI provider | Azure OpenAI |
| Model / deployment | — |
| Stories processed | — |
| Test cases generated | — |
| Avg TCs per story | — |
| Manual review required | Yes — all generated specs reviewed before merge |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| CRM UI changes break locators | Medium | High | Locators centralised in page objects — one fix propagates everywhere |
| AAD MFA blocks CI login | Low | High | Conditional Access Policy excludes test accounts from MFA on CI IP |
| Azure OpenAI quota exhausted | Low | Medium | Ollama fallback configured (`AI_PROVIDER=ollama`) |
| Test data collision on shared env | Medium | Medium | `TestDataHelper` generates unique `AUTO-TEST` prefixed records |
| CRM session expires mid-run | Low | Medium | `authHelper` re-authenticates if session >12h old |
| Flaky tests from slow CRM load | Medium | Low | `waitForCRMLoad()` on all navigations; retry on CI |

---

## Known Issues

| Issue | Severity | Status | Ticket |
|---|---|---|---|
| — | — | — | — |

---

## Recommendations

- [ ] Increase test coverage on Opportunities and Cases entities
- [ ] Add API-level tests for CRM Web API (bypass UI for data setup)
- [ ] Set up Allure TestOps integration for historical trend tracking
- [ ] Add visual regression tests for key CRM dashboards
- [ ] Create a nightly CI schedule (in addition to PR-triggered runs)

---

## Audit History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0.0 | — | — | Initial framework audit |
