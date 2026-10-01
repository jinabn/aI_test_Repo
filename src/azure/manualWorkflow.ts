/**
 * Manual Workflow - No AI Required
 * 
 * This script handles the complete workflow:
 * 1. Fetch Azure DevOps work item (Bug or User Story)
 * 2. Create manual test cases in Azure DevOps
 * 3. Link test cases to the work item
 * 4. Generate automation script scaffolding (POM)
 * 
 * Usage: npm run manual:workflow -- --id <workItemId>
 */

import { AzureDevOpsClient } from './AzureDevOpsClient';
import { Logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

interface TestCase {
  title: string;
  steps: string;
  expectedResult: string;
  priority: number;
}

interface WorkflowOptions {
  workItemId: number;
  dryRun?: boolean;
  skipAzureUpdate?: boolean;
}

export class ManualWorkflow {
  private logger: Logger;
  private azureClient: AzureDevOpsClient;

  constructor() {
    this.logger = new Logger('ManualWorkflow');
    this.azureClient = new AzureDevOpsClient();
  }

  /**
   * Execute the complete manual workflow
   */
  async execute(options: WorkflowOptions): Promise<void> {
    const { workItemId, dryRun = false, skipAzureUpdate = false } = options;

    this.logger.info(`Starting manual workflow for work item #${workItemId}`);
    
    // Step 1: Fetch work item
    const workItem = await this.azureClient.getWorkItem(workItemId);
    this.logger.info(`Fetched work item: ${workItem.title}`);
    
    const module = this.detectModule(workItem);
    this.logger.info(`Detected module: ${module}`);
    
    // Step 2: Prompt user for manual test cases
    console.log('\n' + '='.repeat(80));
    console.log('WORK ITEM DETAILS');
    console.log('='.repeat(80));
    console.log(`ID: ${workItem.id}`);
    console.log(`Title: ${workItem.title}`);
    console.log(`Type: ${workItem.workItemType}`);
    console.log(`State: ${workItem.state}`);
    console.log(`Module: ${module.toUpperCase()}`);
    console.log(`\nDescription:\n${this.cleanDescription(workItem.description)}`);
    console.log('='.repeat(80));
    console.log('\n');

    // Step 3: Interactive test case creation
    const testCases = await this.promptForTestCases(workItem);
    
    if (testCases.length === 0) {
      this.logger.warn('No test cases provided. Exiting.');
      return;
    }

    this.logger.info(`Created ${testCases.length} manual test case(s)`);

    // Step 4: Push test cases to Azure DevOps
    const testCaseIds: number[] = [];
    if (!skipAzureUpdate && !dryRun) {
      for (const tc of testCases) {
        const azureTestCase = {
          title: tc.title,
          description: tc.steps,
          steps: [{ action: tc.steps, expectedResult: tc.expectedResult }],
          priority: (tc.priority >= 1 && tc.priority <= 4 ? tc.priority : 2) as 1 | 2 | 3 | 4,
          automationStatus: 'Planned' as const
        };
        
        const tcId = await this.azureClient.createTestCase(azureTestCase);
        testCaseIds.push(tcId);
        
        // Link test case to work item
        await this.azureClient.linkTestCaseToUserStory(workItemId, tcId);
        this.logger.info(`Created and linked test case #${tcId}`);
      }
    }

    // Step 5: Generate automation scaffold
    const specFilePath = await this.generateTestScaffold(
      workItem,
      testCases,
      module,
      testCaseIds
    );

    // Step 6: Generate or update page object
    await this.ensurePageObject(workItem, module);

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('WORKFLOW COMPLETE');
    console.log('='.repeat(80));
    console.log(`Work Item: #${workItemId} - ${workItem.title}`);
    console.log(`Module: ${module.toUpperCase()}`);
    console.log(`Test Cases Created: ${testCaseIds.length}`);
    if (testCaseIds.length > 0) {
      console.log(`Test Case IDs: ${testCaseIds.join(', ')}`);
    }
    console.log(`Test Spec: ${specFilePath}`);
    console.log('='.repeat(80));
    console.log('\nNext Steps:');
    console.log('1. Review the generated test spec and page object');
    console.log('2. Fill in the test implementation details');
    console.log('3. Run: npm test ' + specFilePath);
    console.log('='.repeat(80));
  }

  /**
   * Detect which module (crm or inventory) this work item belongs to
   */
  private detectModule(workItem: any): 'crm' | 'inventory' {
    const title = workItem.title.toLowerCase();
    const description = workItem.description?.toLowerCase() || '';
    const tags = workItem.tags?.toLowerCase() || '';

    const inventoryKeywords = [
      'inventory', 'stock', 'transfer', 'warehouse', 
      'pick', 'receive', 'adjust', 'product display'
    ];

    const crmKeywords = [
      'crm', 'contact', 'account', 'lead', 'opportunity',
      'case', 'dynamics', 'customer'
    ];

    const text = `${title} ${description} ${tags}`;

    // Check inventory keywords
    if (inventoryKeywords.some(kw => text.includes(kw))) {
      return 'inventory';
    }

    // Check CRM keywords
    if (crmKeywords.some(kw => text.includes(kw))) {
      return 'crm';
    }

    // Default to CRM if unclear
    return 'crm';
  }

  /**
   * Clean HTML description from Azure DevOps
   */
  private cleanDescription(description: string): string {
    if (!description) return 'No description provided.';
    
    return description
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n\s*\n/g, '\n') // Remove extra blank lines
      .trim();
  }

  /**
   * Prompt user to create test cases interactively
   */
  private async promptForTestCases(workItem: any): Promise<TestCase[]> {
    console.log('Please provide test cases for this work item.');
    console.log('You can provide them in the following format:\n');
    console.log('Example:');
    console.log('---');
    console.log('Test Case 1: Verify user can login');
    console.log('Steps: 1. Navigate to login page 2. Enter credentials 3. Click login');
    console.log('Expected: User is logged in successfully');
    console.log('Priority: 1');
    console.log('---\n');
    
    // For now, return a template that the user can modify
    // In a real interactive scenario, you'd use readline or prompt
    const testCases: TestCase[] = [
      {
        title: `[${workItem.workItemType} #${workItem.id}] ${workItem.title} - Happy Path`,
        steps: `1. Navigate to the application\n2. Perform the main action\n3. Verify the result`,
        expectedResult: 'The action completes successfully and expected results are displayed',
        priority: 1
      }
    ];

    return testCases;
  }

  /**
   * Generate test spec scaffold
   */
  private async generateTestScaffold(
    workItem: any,
    testCases: TestCase[],
    module: 'crm' | 'inventory',
    testCaseIds: number[]
  ): Promise<string> {
    const fileName = this.generateFileName(workItem.title);
    const specPath = path.join(process.cwd(), 'tests', module, `${fileName}.spec.ts`);
    
    // Determine page object class name
    const pageObjectName = this.generatePageObjectName(workItem.title, module);
    const pageObjectImport = `../../src/pages/${module}/${pageObjectName}`;

    let testContent = `/**
 * Test Spec for Work Item #${workItem.id}
 * Title: ${workItem.title}
 * Type: ${workItem.workItemType}
 * Module: ${module.toUpperCase()}
 * 
 * Generated: ${new Date().toISOString()}
 */

import { test, expect } from '@playwright/test';
import { ${pageObjectName} } from '${pageObjectImport}';
import { TestDataHelper } from '../../src/utils/testDataHelper';

test.describe('[${workItem.workItemType} #${workItem.id}] ${workItem.title}', () => {
`;

    // Generate test cases
    testCases.forEach((tc, index) => {
      const tcId = testCaseIds[index];
      const tcAnnotation = tcId ? `\n    test.info().annotations.push({ type: 'test_case', description: 'TC-${tcId}' });` : '';
      
      testContent += `
  test('${tc.title}', async ({ page }) => {${tcAnnotation}
    // TODO: Implement test steps
    // ${tc.steps.split('\n').join('\n    // ')}
    
    const pageObject = new ${pageObjectName}(page);
    
    // Step 1: Navigate to the module
    await pageObject.navigate();
    
    // TODO: Add your test implementation here
    
    // Expected Result: ${tc.expectedResult}
    // TODO: Add assertions
  });
`;
    });

    testContent += `});
`;

    // Write the file
    const dir = path.dirname(specPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(specPath, testContent, 'utf-8');
    this.logger.info(`Generated test spec: ${specPath}`);

    return specPath;
  }

  /**
   * Ensure page object exists for this module
   */
  private async ensurePageObject(workItem: any, module: 'crm' | 'inventory'): Promise<void> {
    const pageObjectName = this.generatePageObjectName(workItem.title, module);
    const pageObjectPath = path.join(process.cwd(), 'src', 'pages', module, `${pageObjectName}.ts`);

    if (fs.existsSync(pageObjectPath)) {
      this.logger.info(`Page object already exists: ${pageObjectPath}`);
      return;
    }

    // Generate page object scaffold
    const basePageImport = module === 'crm' ? 'CRMDashboardPage' : 'InventoryBasePage';
    const basePagePath = module === 'crm' ? '../CRMDashboardPage' : './InventoryBasePage';

    let pageObjectContent = `import { Page } from '@playwright/test';
import { ${basePageImport} } from '${basePagePath}';

/**
 * Page Object for ${workItem.title}
 * Module: ${module.toUpperCase()}
 * 
 * Generated: ${new Date().toISOString()}
 */
export class ${pageObjectName} extends ${basePageImport} {
  // Locators
  private readonly mainContainer = this.page.locator('[data-testid="main-container"]');
  
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to this page/module
   */
  async navigate(): Promise<void> {
`;

    if (module === 'crm') {
      pageObjectContent += `    // TODO: Update with actual CRM entity name
    await this.navigateToEntityList('contacts'); // Replace 'contacts' with actual entity
    await this.waitForGrid();
`;
    } else {
      pageObjectContent += `    // TODO: Update with actual inventory page path
    await this.page.goto(process.env.INVENTORY_MGMT_URL + '/dashboard');
    await this.page.waitForLoadState('networkidle');
`;
    }

    pageObjectContent += `  }

  // TODO: Add page-specific methods here
  // Example:
  // async clickButton(buttonText: string): Promise<void> {
  //   await this.page.getByRole('button', { name: buttonText }).click();
  // }
}
`;

    // Write the file
    const dir = path.dirname(pageObjectPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(pageObjectPath, pageObjectContent, 'utf-8');
    this.logger.info(`Generated page object: ${pageObjectPath}`);
  }

  /**
   * Generate file name from work item title
   */
  private generateFileName(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .substring(0, 60);
  }

  /**
   * Generate page object class name
   */
  private generatePageObjectName(title: string, module: string): string {
    // Extract key noun from title
    const words = title
      .replace(/[^a-z0-9\s]/gi, '')
      .split(/\s+/)
      .filter(w => w.length > 3)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

    // Take first 3 significant words
    const className = words.slice(0, 3).join('') + 'Page';
    return className;
  }
}

// CLI Entry Point
if (require.main === module) {
  const args = process.argv.slice(2);
  const idArg = args.find(arg => arg.startsWith('--id='));
  const dryRun = args.includes('--dry-run');
  const skipAzure = args.includes('--skip-azure');

  if (!idArg) {
    console.error('Usage: npm run manual:workflow -- --id=<workItemId> [--dry-run] [--skip-azure]');
    process.exit(1);
  }

  const workItemId = parseInt(idArg.split('=')[1], 10);

  const workflow = new ManualWorkflow();
  workflow.execute({ workItemId, dryRun, skipAzureUpdate: skipAzure })
    .then(() => {
      console.log('\n✅ Workflow completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Workflow failed:', error.message);
      process.exit(1);
    });
}
