/**
 * syncTestCases.ts
 *
 * Entry-point script: run with `npm run sync:azure`
 *
 * Flow:
 *  1. Fetch all active User Stories from Azure DevOps
 *  2. For each story, call the AI generator to produce test cases
 *  3. Create the test cases as work items in Azure DevOps
 *  4. Link each test case back to the parent user story
 *  5. Write the Playwright spec files to disk
 *  6. Report a summary
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { AzureDevOpsClient } from './AzureDevOpsClient';
import { AITestCaseGenerator } from '../ai/AITestCaseGenerator';
import { TestCaseWriter } from '../ai/TestCaseWriter';
import { Logger } from '../utils/logger';
import { AzureWorkItem, AzureSyncResult } from '../types';

const logger = new Logger('syncTestCases');

interface SyncOptions {
  /** Only process this specific work item ID */
  workItemId?: number;
  /** Filter by tag */
  tag?: string;
  /** Skip creating Azure test cases; only generate Playwright files */
  dryRun?: boolean;
  /** App context to generate tests for */
  appContext?: 'CRM' | 'InventoryManagement';
}

async function syncTestCases(options: SyncOptions = {}): Promise<void> {
  logger.info('=== Azure DevOps Test Case Sync Started ===');

  const azureClient = new AzureDevOpsClient();
  const aiGenerator = new AITestCaseGenerator();
  const testWriter = new TestCaseWriter();

  // ── Step 1: Fetch user stories ───────────────────────────────────────────
  let userStories: AzureWorkItem[] = [];

  if (options.workItemId) {
    logger.info(`Fetching single work item: #${options.workItemId}`);
    const item = await azureClient.getWorkItem(options.workItemId);
    userStories = [item];
  } else if (options.tag) {
    logger.info(`Fetching user stories with tag: ${options.tag}`);
    userStories = await azureClient.getUserStoriesByTag(options.tag);
  } else {
    logger.info('Fetching all active user stories');
    userStories = await azureClient.getAllActiveUserStories();
  }

  if (userStories.length === 0) {
    logger.warn('No user stories found. Exiting.');
    return;
  }

  logger.info(`Found ${userStories.length} user story(ies) to process`);

  const results: AzureSyncResult[] = [];

  // ── Step 2–5: Process each user story ───────────────────────────────────
  for (const story of userStories) {
    logger.info(`\n--- Processing: [#${story.id}] ${story.title} ---`);

    try {
      // Check if test cases already exist for this story
      const existingTCIds = await azureClient.getLinkedTestCases(story.id);
      if (existingTCIds.length > 0) {
        logger.warn(`  Skipping — ${existingTCIds.length} test case(s) already linked.`);
        continue;
      }

      // Step 2: Generate test cases with AI
      const aiResponse = await aiGenerator.generateTestCases({
        workItemId: story.id,
        title: story.title,
        description: story.description,
        appContext: options.appContext ?? 'CRM',
      });

      logger.info(`  AI generated ${aiResponse.testCases.length} test case(s)`);

      const testCaseIds: number[] = [];

      for (const tc of aiResponse.testCases) {
        if (!options.dryRun) {
          // Step 3: Create test case in Azure DevOps
          const azureSteps = tc.steps.map(s => ({
            action: s.action,
            expectedResult: s.expectedResult,
          }));

          const tcId = await azureClient.createTestCase({
            title: tc.title,
            description: tc.description,
            steps: azureSteps,
            priority: tc.priority === 'High' ? 1 : tc.priority === 'Medium' ? 2 : 3,
            automationStatus: 'Planned',
          });

          // Step 4: Link test case to user story
          await azureClient.linkTestCaseToUserStory(story.id, tcId);
          testCaseIds.push(tcId);

          logger.info(`  Created & linked TC#${tcId}: ${tc.title}`);
        } else {
          logger.info(`  [DRY RUN] Would create: ${tc.title}`);
        }
      }

      // Step 5: Write Playwright spec file
      const filePath = await testWriter.writeTestFile(story, aiResponse.testCases);
      logger.info(`  Playwright spec written: ${filePath}`);

      // Mark as automated after file is written
      if (!options.dryRun) {
        for (const tcId of testCaseIds) {
          await azureClient.markTestCaseAutomated(tcId, `tests/crm/${sanitizeFileName(story.title)}.spec.ts`);
        }
      }

      results.push({
        workItemId: story.id,
        title: story.title,
        testCasesCreated: testCaseIds.length,
        testCaseIds,
        playwrightFile: filePath,
      });

    } catch (err: any) {
      logger.error(`  Failed to process story #${story.id}: ${err.message}`);
    }
  }

  // ── Step 6: Summary ──────────────────────────────────────────────────────
  logger.info('\n=== Sync Summary ===');
  for (const result of results) {
    logger.info(
      `  US#${result.workItemId} "${result.title}" → ${result.testCasesCreated} TC(s) created [${result.testCaseIds.join(', ')}] → ${result.playwrightFile}`
    );
  }
  logger.info(`Total: ${results.length} user story(ies) processed`);
  logger.info('=== Sync Complete ===');
}

function sanitizeFileName(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 80);
}

// ── CLI entry point ────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const options: SyncOptions = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--id' && args[i + 1]) options.workItemId = parseInt(args[i + 1], 10);
  if (args[i] === '--tag' && args[i + 1]) options.tag = args[i + 1];
  if (args[i] === '--dry-run') options.dryRun = true;
  if (args[i] === '--app' && args[i + 1]) options.appContext = args[i + 1] as 'CRM' | 'InventoryManagement';
}

syncTestCases(options).catch(err => {
  logger.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
