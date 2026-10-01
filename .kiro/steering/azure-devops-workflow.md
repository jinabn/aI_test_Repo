---
inclusion: auto
name: azure-devops-workflow
description: Apply when the user asks to fetch tickets, create test cases, link work items, sync with Azure DevOps, or push automation results to ADO
---

# Azure DevOps Workflow

## Connection Details
- **Organisation**: `https://dev.azure.com/NthDegree-Enterprise-Apps`
- **Project**: `Projected Stock System`
- **PAT**: stored in `AZURE_DEVOPS_PAT` env variable
- **API version**: `7.1`
- **Client**: `src/azure/AzureDevOpsClient.ts`

---

## Fetching a User Story

```typescript
const client = new AzureDevOpsClient();
const story = await client.getWorkItem(5827);
// story.title, story.description, story.state, story.tags
```

Via REST directly:
```
GET https://dev.azure.com/NthDegree-Enterprise-Apps/Projected%20Stock%20System/_apis/wit/workitems/5827?$expand=all&api-version=7.1
```

---

## Creating a Test Case

```typescript
const tcId = await client.createTestCase({
  title: 'Verify contact can be created with valid data',
  description: 'Validates the happy path for contact creation',
  steps: [
    { action: 'Navigate to Contacts list', expectedResult: 'Contacts grid loads' },
    { action: 'Click New', expectedResult: 'New Contact form opens' },
    { action: 'Fill Last Name and click Save', expectedResult: 'Success notification appears' },
  ],
  priority: 1,          // 1=Critical, 2=High, 3=Medium, 4=Low
  automationStatus: 'Planned',
});
```

---

## Linking Test Case to User Story

```typescript
await client.linkTestCaseToUserStory(userStoryId, testCaseId);
// Creates TestedBy relationship: US → TC
```

---

## Marking a Test Case as Automated

```typescript
await client.markTestCaseAutomated(testCaseId, 'tests/crm/contacts.spec.ts');
// Sets AutomationStatus = Automated
// Sets AutomatedTestName = file path
// Sets AutomatedTestStorage = playwright
```

---

## Full Sync Command

```bash
# Single ticket
npm run sync:azure -- --id 5827

# All active user stories
npm run sync:azure

# By tag
npm run sync:azure -- --tag sprint-5

# Dry run (no ADO write)
npm run sync:azure -- --id 5827 --dry-run

# For Inventory Management
npm run sync:azure -- --id 5827 --app InventoryManagement
```

---

## WIQL Query Examples

Get all active user stories:
```sql
SELECT [System.Id], [System.Title], [System.State], [System.Description]
FROM WorkItems
WHERE [System.TeamProject] = 'Projected Stock System'
AND [System.WorkItemType] = 'User Story'
AND [System.State] IN ('Active', 'New', 'In Progress')
ORDER BY [System.Id]
```

Get stories in current sprint:
```sql
SELECT [System.Id], [System.Title]
FROM WorkItems
WHERE [System.TeamProject] = 'Projected Stock System'
AND [System.WorkItemType] = 'User Story'
AND [System.IterationPath] UNDER 'Projected Stock System\Current'
```

---

## Test Case Steps XML Format

Azure DevOps stores steps as XML. `AzureDevOpsClient.buildStepsXml()` handles this automatically. Manual format:

```xml
<steps id="0" last="3">
  <step id="2" type="ValidateStep">
    <parameterizedString isformatted="true">&lt;DIV&gt;Action text&lt;/DIV&gt;</parameterizedString>
    <parameterizedString isformatted="true">&lt;DIV&gt;Expected result&lt;/DIV&gt;</parameterizedString>
  </step>
</steps>
```

---

## GitHub Actions Manual Trigger

Go to **Actions → AI Test Case Sync (Manual)** in the repository.
Enter a Work Item ID and click **Run workflow**. The pipeline will:
1. Fetch the story from ADO
2. Generate tests via Azure OpenAI
3. Create Test Case work items in ADO
4. Link them to the user story
5. Commit the generated spec to a new branch
