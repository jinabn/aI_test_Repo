import axios, { AxiosInstance } from 'axios';
import { Logger } from '../utils/logger';
import { AzureWorkItem, AzureTestCase, AzureTestStep } from '../types';
import config from '../config';

/**
 * AzureDevOpsClient wraps the Azure DevOps REST API.
 * Handles: fetching work items (user stories), creating test cases,
 * linking test cases to user stories, and fetching test plans.
 */
export class AzureDevOpsClient {
  private readonly client: AxiosInstance;
  private readonly logger = new Logger('AzureDevOpsClient');
  private readonly org: string;
  private readonly project: string;

  constructor() {
    this.org = config.azure.org;
    this.project = config.azure.project;
    const pat = config.azure.pat;

    if (!pat) {
      throw new Error('AZURE_DEVOPS_PAT is not set in .env');
    }

    const token = Buffer.from(`:${pat}`).toString('base64');

    this.client = axios.create({
      headers: {
        Authorization: `Basic ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  // ─── Base URL helpers ──────────────────────────────────────────────────────

  private witUrl(path: string): string {
    return `${this.org}/${encodeURIComponent(this.project)}/_apis/wit/${path}?api-version=7.1`;
  }

  private testUrl(path: string): string {
    return `${this.org}/${encodeURIComponent(this.project)}/_apis/test/${path}?api-version=7.1`;
  }

  private testCaseUrl(path: string): string {
    return `${this.org}/${encodeURIComponent(this.project)}/_apis/testplan/${path}?api-version=7.1-preview.2`;
  }

  // ─── Work Items (User Stories / Tasks) ────────────────────────────────────

  /**
   * Fetch a single work item by ID.
   */
  async getWorkItem(id: number): Promise<AzureWorkItem> {
    this.logger.info(`Fetching work item #${id}`);
    const response = await this.client.get(this.witUrl(`workitems/${id}`) + '&$expand=all');
    const fields = response.data.fields;

    return {
      id,
      title: fields['System.Title'],
      description: this.stripHtml(fields['System.Description'] ?? ''),
      state: fields['System.State'],
      workItemType: fields['System.WorkItemType'],
      areaPath: fields['System.AreaPath'],
      iterationPath: fields['System.IterationPath'],
      tags: fields['System.Tags'],
      url: response.data._links?.html?.href ?? '',
    };
  }

  /**
   * Fetch all User Stories (or Bugs) from the current iteration / sprint.
   */
  async getUserStoriesInIteration(iterationPath?: string): Promise<AzureWorkItem[]> {
    const iteration = iterationPath ?? `${this.project}\\\\Current`;
    const wiql = {
      query: `SELECT [System.Id], [System.Title], [System.State], [System.Description]
              FROM WorkItems
              WHERE [System.TeamProject] = '${this.project}'
              AND [System.WorkItemType] = 'User Story'
              AND [System.State] <> 'Removed'
              AND [System.IterationPath] UNDER '${iteration}'
              ORDER BY [System.Id]`,
    };

    return this.runWiqlQuery(wiql.query);
  }

  /**
   * Fetch all active User Stories in the project.
   */
  async getAllActiveUserStories(): Promise<AzureWorkItem[]> {
    const query = `SELECT [System.Id], [System.Title], [System.State], [System.Description]
                   FROM WorkItems
                   WHERE [System.TeamProject] = '${this.project}'
                   AND [System.WorkItemType] = 'User Story'
                   AND [System.State] IN ('Active', 'New', 'In Progress', 'Ready')
                   ORDER BY [System.Id]`;
    return this.runWiqlQuery(query);
  }

  /**
   * Fetch User Story IDs from a specific tag.
   */
  async getUserStoriesByTag(tag: string): Promise<AzureWorkItem[]> {
    const query = `SELECT [System.Id], [System.Title], [System.State], [System.Description]
                   FROM WorkItems
                   WHERE [System.TeamProject] = '${this.project}'
                   AND [System.WorkItemType] = 'User Story'
                   AND [System.Tags] CONTAINS '${tag}'
                   ORDER BY [System.Id]`;
    return this.runWiqlQuery(query);
  }

  private async runWiqlQuery(query: string): Promise<AzureWorkItem[]> {
    const wiqlUrl = `${this.org}/${encodeURIComponent(this.project)}/_apis/wit/wiql?api-version=7.1`;
    this.logger.info('Running WIQL query');

    const wiqlResponse = await this.client.post(wiqlUrl, { query });
    const workItemRefs: Array<{ id: number }> = wiqlResponse.data.workItems ?? [];

    if (workItemRefs.length === 0) return [];

    const ids = workItemRefs.map(w => w.id).join(',');
    const batchUrl = `${this.org}/_apis/wit/workitems?ids=${ids}&$expand=all&api-version=7.1`;
    const batchResponse = await this.client.get(batchUrl);

    return batchResponse.data.value.map((item: any) => ({
      id: item.id,
      title: item.fields['System.Title'],
      description: this.stripHtml(item.fields['System.Description'] ?? ''),
      state: item.fields['System.State'],
      workItemType: item.fields['System.WorkItemType'],
      areaPath: item.fields['System.AreaPath'],
      iterationPath: item.fields['System.IterationPath'],
      tags: item.fields['System.Tags'],
      url: item._links?.html?.href ?? '',
    }));
  }

  // ─── Test Cases ────────────────────────────────────────────────────────────

  /**
   * Create a Test Case work item in Azure DevOps.
   * Returns the newly created test case ID.
   */
  async createTestCase(testCase: AzureTestCase): Promise<number> {
    this.logger.info(`Creating test case: ${testCase.title}`);
    const stepsXml = this.buildStepsXml(testCase.steps);

    const patchDocument = [
      { op: 'add', path: '/fields/System.Title', value: testCase.title },
      { op: 'add', path: '/fields/System.Description', value: testCase.description },
      { op: 'add', path: '/fields/Microsoft.VSTS.TCM.Steps', value: stepsXml },
      {
        op: 'add',
        path: '/fields/Microsoft.VSTS.Common.Priority',
        value: testCase.priority ?? 2,
      },
      {
        op: 'add',
        path: '/fields/Microsoft.VSTS.TCM.AutomationStatus',
        value: testCase.automationStatus ?? 'Planned',
      },
    ];

    const url = `${this.org}/${encodeURIComponent(this.project)}/_apis/wit/workitems/$Test%20Case?api-version=7.1`;
    const response = await this.client.post(url, patchDocument, {
      headers: { 'Content-Type': 'application/json-patch+json' },
    });

    const newId: number = response.data.id;
    this.logger.info(`Test case created with ID: ${newId}`);
    return newId;
  }

  /**
   * Update an existing test case's steps and title.
   */
  async updateTestCase(testCaseId: number, testCase: Partial<AzureTestCase>): Promise<void> {
    this.logger.info(`Updating test case #${testCaseId}`);
    const patchDocument: any[] = [];

    if (testCase.title) {
      patchDocument.push({ op: 'replace', path: '/fields/System.Title', value: testCase.title });
    }
    if (testCase.steps) {
      patchDocument.push({
        op: 'replace',
        path: '/fields/Microsoft.VSTS.TCM.Steps',
        value: this.buildStepsXml(testCase.steps),
      });
    }
    if (testCase.automationStatus) {
      patchDocument.push({
        op: 'replace',
        path: '/fields/Microsoft.VSTS.TCM.AutomationStatus',
        value: testCase.automationStatus,
      });
    }

    const url = `${this.org}/${encodeURIComponent(this.project)}/_apis/wit/workitems/${testCaseId}?api-version=7.1`;
    await this.client.patch(url, patchDocument, {
      headers: { 'Content-Type': 'application/json-patch+json' },
    });
  }

  /**
   * Mark a test case as Automated and store the automation info.
   */
  async markTestCaseAutomated(testCaseId: number, automatedTestName: string): Promise<void> {
    const patchDocument = [
      { op: 'replace', path: '/fields/Microsoft.VSTS.TCM.AutomationStatus', value: 'Automated' },
      { op: 'add', path: '/fields/Microsoft.VSTS.TCM.AutomatedTestName', value: automatedTestName },
      { op: 'add', path: '/fields/Microsoft.VSTS.TCM.AutomatedTestStorage', value: 'playwright' },
    ];

    const url = `${this.org}/${encodeURIComponent(this.project)}/_apis/wit/workitems/${testCaseId}?api-version=7.1`;
    await this.client.patch(url, patchDocument, {
      headers: { 'Content-Type': 'application/json-patch+json' },
    });
    this.logger.info(`Test case #${testCaseId} marked as Automated`);
  }

  // ─── Linking Test Cases to User Stories ───────────────────────────────────

  /**
   * Links a test case to a user story using the "Tested By" relationship.
   */
  async linkTestCaseToUserStory(userStoryId: number, testCaseId: number): Promise<void> {
    this.logger.info(`Linking test case #${testCaseId} to user story #${userStoryId}`);

    const testCaseUrl = `${this.org}/_apis/wit/workitems/${testCaseId}`;
    const patchDocument = [
      {
        op: 'add',
        path: '/relations/-',
        value: {
          rel: 'Microsoft.VSTS.Common.TestedBy-Reverse',
          url: testCaseUrl,
          attributes: { comment: 'Auto-linked by AI test generation framework' },
        },
      },
    ];

    const url = `${this.org}/${encodeURIComponent(this.project)}/_apis/wit/workitems/${userStoryId}?api-version=7.1`;
    await this.client.patch(url, patchDocument, {
      headers: { 'Content-Type': 'application/json-patch+json' },
    });
    this.logger.info(`Link established: US#${userStoryId} ←→ TC#${testCaseId}`);
  }

  /**
   * Get all test cases already linked to a user story.
   */
  async getLinkedTestCases(userStoryId: number): Promise<number[]> {
    const response = await this.client.get(
      this.witUrl(`workitems/${userStoryId}`) + '&$expand=relations'
    );

    const relations: any[] = response.data.relations ?? [];
    return relations
      .filter((r: any) => r.rel === 'Microsoft.VSTS.Common.TestedBy-Reverse')
      .map((r: any) => {
        const parts = r.url.split('/');
        return parseInt(parts[parts.length - 1], 10);
      });
  }

  // ─── Test Plans & Suites ───────────────────────────────────────────────────

  /**
   * Get all test plans in the project.
   */
  async getTestPlans(): Promise<Array<{ id: number; name: string }>> {
    const url = `${this.org}/${encodeURIComponent(this.project)}/_apis/testplan/plans?api-version=7.1-preview.1`;
    const response = await this.client.get(url);
    return (response.data.value ?? []).map((p: any) => ({ id: p.id, name: p.name }));
  }

  /**
   * Add a test case to a specific test suite within a plan.
   */
  async addTestCaseToSuite(planId: number, suiteId: number, testCaseId: number): Promise<void> {
    this.logger.info(`Adding test case #${testCaseId} to suite #${suiteId} in plan #${planId}`);
    const url = `${this.org}/${encodeURIComponent(this.project)}/_apis/testplan/Plans/${planId}/Suites/${suiteId}/TestCase?api-version=7.1-preview.3`;
    await this.client.post(url, [{ workItem: { id: testCaseId } }]);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Build the Azure DevOps XML steps format from a simple step array.
   */
  private buildStepsXml(steps: AzureTestStep[]): string {
    const stepElements = steps
      .map(
        (step, i) => `
      <step id="${i + 2}" type="ValidateStep">
        <parameterizedString isformatted="true">&lt;DIV&gt;&lt;P&gt;${this.escapeXml(step.action)}&lt;/P&gt;&lt;/DIV&gt;</parameterizedString>
        <parameterizedString isformatted="true">&lt;DIV&gt;&lt;P&gt;${this.escapeXml(step.expectedResult)}&lt;/P&gt;&lt;/DIV&gt;</parameterizedString>
        <description/>
      </step>`
      )
      .join('');

    return `<steps id="0" last="${steps.length + 1}">${stepElements}</steps>`;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
