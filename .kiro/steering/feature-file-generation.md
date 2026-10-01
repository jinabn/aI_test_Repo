---
inclusion: auto
name: feature-file-generation
description: Apply when the user asks to generate, create, or write BDD feature files, Gherkin scenarios, or Cucumber specs for a CRM entity
---

# Feature File Generation Guide

## File Location
`features/crm/{entity-name}.feature`

## Standard Template

```gherkin
@crm @{entity}
Feature: [US-{id}] {Story Title}
  As a {role}
  I want to {goal}
  So that {business value}

  Background:
    Given I am logged into CRM

  # ── Create ────────────────────────────────────────────────────────────────

  @smoke @create
  Scenario: Successfully create a {entity} with required fields
    Given I navigate to the {Entity} list
    When I click New
    And I fill in the {entity} name with a unique test value
    And I click Save
    Then the {entity} should be saved successfully
    And I should see the {entity} in the {Entity} grid

  # ── Validation ────────────────────────────────────────────────────────────

  @regression @validation
  Scenario: {Entity} requires {RequiredField} to be saved
    Given I navigate to the {Entity} list
    When I click New
    And I click Save without filling any fields
    Then I should see a required field validation error for {RequiredField}

  # ── Search ────────────────────────────────────────────────────────────────

  @regression @search
  Scenario: Search for an existing {entity} by name
    Given a {entity} with a unique name exists in CRM
    When I navigate to the {Entity} list
    And I search for the {entity} by name
    Then the {entity} should appear in the search results

  # ── Update ────────────────────────────────────────────────────────────────

  @regression @update
  Scenario: Update a {entity} field
    Given a {entity} with a unique name exists in CRM
    When I open the {entity} record
    And I update the {field} to "{new value}"
    And I click Save
    Then the {entity} should be saved successfully

  # ── Delete ────────────────────────────────────────────────────────────────

  @regression @delete
  Scenario: Delete a {entity}
    Given a {entity} with a unique name exists in CRM
    When I open the {entity} record
    And I click Delete and confirm
    Then the {entity} should no longer appear in the {Entity} grid
```

## Tag Conventions

| Tag | When to use |
|---|---|
| `@smoke` | 1 key scenario per entity — must always pass |
| `@regression` | Full coverage scenarios |
| `@crm` | All CRM scenarios |
| `@{entity}` | Entity-specific tag (contacts, accounts, leads…) |
| `@create` / `@update` / `@delete` / `@search` | Operation type |
| `@validation` | Negative / error path scenarios |
| `@wip` | Work in progress — excluded from CI by default |

Run by tag:
```bash
npm run test:bdd:tags -- "@smoke"
npm run test:bdd:tags -- "@crm and not @wip"
npm run test:bdd:tags -- "@contacts and @regression"
```

## Step Definitions

After writing a feature file, run:
```bash
npm run test:bdd -- --spec features/crm/{entity}.feature
```

Cucumber will print which steps are undefined. Add them to `step-definitions/crm/{entity}.steps.ts`.

### Reuse existing steps

Check `step-definitions/common/crm.steps.ts` first — generic steps like:
- `Given I am logged into CRM`
- `When I click New`
- `When I click Save`
- `When I click Save without filling any fields`
- `When I click Delete and confirm`
- `Then the {word} should be saved successfully`
- `Then I should see a required field validation error for {word}`

Only create new step definitions for entity-specific actions.

## Step Definition Template

```typescript
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CRMWorld } from '../world';
import { {Entity}Page } from '../../src/pages/crm/{Entity}Page';
import { TestDataHelper } from '../../src/utils/testDataHelper';

Given('I navigate to the {Entity} list', async function (this: CRMWorld) {
  const entity = new {Entity}Page(this.page);
  await entity.navigateTo{Entity}s();
});

Given('a {entity} with a unique name exists in CRM', async function (this: CRMWorld) {
  const entity = new {Entity}Page(this.page);
  const name = TestDataHelper.accountName('{Entity}BDD');
  this.set('{entity}Name', name);
  await entity.create{Entity}({ name });
});

When('I fill in the {entity} name with a unique test value', async function (this: CRMWorld) {
  const name = TestDataHelper.accountName('{Entity}BDD');
  this.set('{entity}Name', name);
  const field = this.page.locator('[data-id="name"] input');
  await field.fill(name);
});

Then('I should see the {entity} in the {Entity} grid', async function (this: CRMWorld) {
  const entity = new {Entity}Page(this.page);
  const name = this.get('{entity}Name');
  await entity.assert{Entity}Exists(name);
});
```
