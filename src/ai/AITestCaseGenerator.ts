import OpenAI, { AzureOpenAI } from 'openai';
import { Logger } from '../utils/logger';
import {
  AIGenerationRequest,
  AIGenerationResponse,
  AIGeneratedTestCase,
  AITestStep,
} from '../types';
import config from '../config';

/**
 * AITestCaseGenerator — reads a User Story title + description and produces
 * structured, Playwright-ready test cases.
 *
 * Supported AI backends (set AI_PROVIDER in .env):
 *
 *   AI_PROVIDER=azure-openai   → Azure OpenAI Service (recommended for corporate tenants)
 *                                 Requires: AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT,
 *                                           AZURE_OPENAI_API_KEY, AZURE_OPENAI_API_VERSION
 *
 *   AI_PROVIDER=ollama         → Local Ollama (fully offline, no API key needed)
 *                                 Requires: OLLAMA_BASE_URL (default http://localhost:11434)
 *                                           OLLAMA_MODEL    (default llama3)
 *
 *   AI_PROVIDER=openai         → OpenAI.com (original, blocked in some orgs)
 *                                 Requires: OPENAI_API_KEY, OPENAI_MODEL
 */
export class AITestCaseGenerator {
  private readonly logger = new Logger('AITestCaseGenerator');
  private readonly provider: string;

  constructor() {
    this.provider = (process.env.AI_PROVIDER ?? 'openai').toLowerCase();
    this.logger.info(`AI provider: ${this.provider}`);
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  async generateTestCases(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    this.logger.info(`Generating test cases for US#${request.workItemId}: "${request.title}"`);

    const systemPrompt = this.buildSystemPrompt(request.appContext);
    const userPrompt = this.buildUserPrompt(request);

    let raw: string;

    switch (this.provider) {
      case 'azure-openai':
        raw = await this.callAzureOpenAI(systemPrompt, userPrompt);
        break;
      case 'ollama':
        raw = await this.callOllama(systemPrompt, userPrompt);
        break;
      case 'openai':
        raw = await this.callOpenAI(systemPrompt, userPrompt);
        break;
      default:
        throw new Error(`Unknown AI_PROVIDER: "${this.provider}". Use azure-openai, ollama, or openai.`);
    }

    this.logger.debug(`Raw AI response (first 300 chars): ${raw.substring(0, 300)}`);
    const parsed = this.parseResponse(raw, request.workItemId);
    this.logger.info(`Generated ${parsed.testCases.length} test case(s) for US#${request.workItemId}`);
    return parsed;
  }

  // ─── Backend: Azure OpenAI ─────────────────────────────────────────────────

  private async callAzureOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? '2024-02-01';

    if (!endpoint || !apiKey || !deployment) {
      throw new Error(
        'Azure OpenAI requires AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT in .env'
      );
    }

    this.logger.info(`Calling Azure OpenAI: ${endpoint} / deployment: ${deployment}`);

    const client = new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment });

    const response = await client.chat.completions.create({
      model: deployment, // Azure uses deployment name as the model
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    return response.choices[0].message.content ?? '{}';
  }

  // ─── Backend: Ollama (local) ───────────────────────────────────────────────

  private async callOllama(systemPrompt: string, userPrompt: string): Promise<string> {
    const baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
    const model = process.env.OLLAMA_MODEL ?? 'llama3';

    this.logger.info(`Calling Ollama at ${baseUrl}, model: ${model}`);

    // Ollama exposes an OpenAI-compatible /v1 endpoint
    const client = new OpenAI({
      baseURL: `${baseUrl}/v1`,
      apiKey: 'ollama', // Ollama ignores the key but the client requires a non-empty string
    });

    const response = await client.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `${userPrompt}\n\nIMPORTANT: Respond ONLY with valid JSON matching the schema in your instructions. No markdown, no explanation outside the JSON.`,
        },
      ],
    });

    const raw = response.choices[0].message.content ?? '{}';

    // Ollama sometimes wraps JSON in markdown code fences — strip them
    return this.stripMarkdownFences(raw);
  }

  // ─── Backend: OpenAI.com ───────────────────────────────────────────────────

  private async callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!config.openai.apiKey) {
      throw new Error('OPENAI_API_KEY is not set in .env');
    }

    const client = new OpenAI({ apiKey: config.openai.apiKey });

    const response = await client.chat.completions.create({
      model: config.openai.model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    return response.choices[0].message.content ?? '{}';
  }

  // ─── Prompt Builders ───────────────────────────────────────────────────────

  private buildSystemPrompt(appContext: 'CRM' | 'InventoryManagement'): string {
    const crmContext = `
You are an expert QA automation engineer specialising in Microsoft Dynamics 365 CRM.
The application under test is Dynamics CRM accessed via a web browser.
Common CRM entities: Contacts, Accounts, Leads, Opportunities, Cases, Activities.
CRM uses data-id attributes for form fields, e.g. [data-id="firstname"], [data-id="lastname"].
CRM navigation uses a sitemap with groups (Sales, Service, Marketing) and entity items.
After every save, CRM shows a success notification banner.
Always use Page Object Model pattern with the available page classes:
  - LoginPage     (loginToCRM, loginToCRMAsTestUser)
  - CRMDashboardPage (navigateToEntity, clickNew, clickSave, fillFormField, getFormFieldValue)
  - ContactsPage  (createContact, searchContact, openContact, assertContactDetails)
  - AccountsPage  (createAccount, searchAccount, openAccount)
  - LeadsPage     (createLead, qualifyLead, searchLead)
`.trim();

    const inventoryContext = `
You are an expert QA automation engineer specialising in web applications.
The application under test is an Inventory Management web app.
Common entities: Products, Stock, Orders, Suppliers, Warehouses.
Always use Page Object Model pattern. Use descriptive locators.
`.trim();

    return `
${appContext === 'CRM' ? crmContext : inventoryContext}

Your task: Given a User Story title and description, generate comprehensive test cases.

RULES:
1. Generate between 3 and 6 test cases per user story.
2. Cover: happy path, negative/validation cases, boundary conditions, and any acceptance criteria.
3. Each test case MUST include ready-to-run Playwright TypeScript code using the POM classes.
4. Playwright code must import from '../../src/pages' and use fixtures (page from @playwright/test).
5. All test IDs in code must include the Azure work item ID: e.g. test('[US-123] TC-1 Title', ...).
6. Use async/await throughout.
7. Include explicit expect assertions.
8. Do NOT include login steps — assume the test already has an authenticated session via storageState.

RESPONSE FORMAT (strict JSON — no markdown, no extra text outside the JSON):
{
  "testCases": [
    {
      "title": "string — short test case title",
      "description": "string — what this test validates",
      "preconditions": ["string array of preconditions"],
      "steps": [
        {
          "stepNumber": 1,
          "action": "string — what the tester does",
          "locatorHint": "string — CSS/data-id hint for the element",
          "expectedResult": "string — what should happen"
        }
      ],
      "expectedOutcome": "string — overall pass condition",
      "tags": ["string array, e.g. smoke, regression, crm"],
      "priority": "High | Medium | Low",
      "playwrightCode": "string — complete test() block TypeScript code"
    }
  ]
}
`.trim();
  }

  private buildUserPrompt(request: AIGenerationRequest): string {
    return `
Generate test cases for the following Azure DevOps User Story:

WORK ITEM ID: ${request.workItemId}
TITLE: ${request.title}
DESCRIPTION:
${request.description || '(No description provided)'}
${request.acceptanceCriteria ? `\nACCEPTANCE CRITERIA:\n${request.acceptanceCriteria}` : ''}

APPLICATION: ${request.appContext}

Generate comprehensive test cases following all the rules in your instructions.
Ensure the playwrightCode for each test case is complete, correct TypeScript.
`.trim();
  }

  // ─── Response Parser ───────────────────────────────────────────────────────

  private parseResponse(raw: string, workItemId: number): AIGenerationResponse {
    try {
      const parsed = JSON.parse(raw);
      const testCases: AIGeneratedTestCase[] = (parsed.testCases ?? []).map(
        (tc: any, index: number) => this.validateAndNormaliseTestCase(tc, index, workItemId)
      );
      return { workItemId, testCases, generatedAt: new Date().toISOString() };
    } catch (err: any) {
      this.logger.error(`Failed to parse AI response: ${err.message}`);
      return { workItemId, testCases: [], generatedAt: new Date().toISOString() };
    }
  }

  private validateAndNormaliseTestCase(tc: any, index: number, workItemId: number): AIGeneratedTestCase {
    const steps: AITestStep[] = (tc.steps ?? []).map((s: any, i: number) => ({
      stepNumber: s.stepNumber ?? i + 1,
      action: s.action ?? '',
      locatorHint: s.locatorHint ?? '',
      expectedResult: s.expectedResult ?? '',
    }));

    return {
      title: tc.title ?? `Test Case ${index + 1} for US#${workItemId}`,
      description: tc.description ?? '',
      preconditions: tc.preconditions ?? [],
      steps,
      expectedOutcome: tc.expectedOutcome ?? '',
      tags: tc.tags ?? ['regression'],
      priority: tc.priority ?? 'Medium',
      playwrightCode: tc.playwrightCode ?? this.generateFallbackCode(tc, workItemId),
    };
  }

  private generateFallbackCode(tc: any, workItemId: number): string {
    const steps: string = (tc.steps ?? [])
      .map((s: any) => `
    // Step ${s.stepNumber}: ${s.action}
    // Expected: ${s.expectedResult}
    // TODO: implement`)
      .join('\n');

    return `test('[US-${workItemId}] ${tc.title ?? 'Test Case'}', async ({ page }) => {
  // Preconditions: ${(tc.preconditions ?? []).join(', ')}
${steps}

  // Expected outcome: ${tc.expectedOutcome ?? ''}
});`.trim();
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private stripMarkdownFences(text: string): string {
    return text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }
}
