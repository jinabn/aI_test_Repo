/**
 * generateTests.ts
 *
 * Standalone script: run with `npm run generate:tests`
 * Use this to generate Playwright spec files from a single user story
 * WITHOUT pushing to Azure DevOps (useful for local dev / exploration).
 *
 * Examples:
 *   npm run generate:tests -- --id 1234
 *   npm run generate:tests -- --id 1234 --app InventoryManagement
 *   npm run generate:tests -- --title "Create Contact" --description "As a sales user..."
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { AITestCaseGenerator } from './AITestCaseGenerator';
import { TestCaseWriter } from './TestCaseWriter';
import { AzureDevOpsClient } from '../azure/AzureDevOpsClient';
import { Logger } from '../utils/logger';

const logger = new Logger('generateTests');

async function run(): Promise<void> {
  const args = process.argv.slice(2);
  const opts: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      opts[args[i].slice(2)] = args[i + 1] ?? 'true';
      i++;
    }
  }

  const generator = new AITestCaseGenerator();
  const writer = new TestCaseWriter();

  let workItemId: number;
  let title: string;
  let description: string;

  if (opts['id']) {
    // Fetch from Azure DevOps
    workItemId = parseInt(opts['id'], 10);
    logger.info(`Fetching work item #${workItemId} from Azure DevOps...`);
    const client = new AzureDevOpsClient();
    const item = await client.getWorkItem(workItemId);
    title = item.title;
    description = item.description;
    logger.info(`Fetched: "${title}"`);
  } else if (opts['title']) {
    // Inline input
    workItemId = parseInt(opts['workItemId'] ?? '0', 10);
    title = opts['title'];
    description = opts['description'] ?? '';
  } else {
    console.error('Usage: npm run generate:tests -- --id <workItemId>');
    console.error('       npm run generate:tests -- --title "Story Title" --description "..."');
    process.exit(1);
  }

  const appContext = (opts['app'] ?? 'CRM') as 'CRM' | 'InventoryManagement';

  logger.info(`Generating test cases for: "${title}"`);
  const response = await generator.generateTestCases({
    workItemId,
    title,
    description,
    appContext,
  });

  logger.info(`Generated ${response.testCases.length} test case(s)`);

  const fakeStory = { id: workItemId, title, description, state: 'Active', workItemType: 'User Story', areaPath: '', iterationPath: '', url: '' };
  const filePath = await writer.writeTestFile(fakeStory, response.testCases, appContext);

  logger.info(`\n✅ Spec file written: ${filePath}`);
  logger.info('\nTest cases:');
  response.testCases.forEach((tc, i) => {
    logger.info(`  ${i + 1}. [${tc.priority}] ${tc.title}`);
  });
}

run().catch(err => {
  logger.error(`Fatal: ${err.message}`);
  process.exit(1);
});
