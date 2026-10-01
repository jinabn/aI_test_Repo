// ============================================================
// Azure DevOps Types
// ============================================================

export interface AzureWorkItem {
  id: number;
  title: string;
  description: string;
  state: string;
  workItemType: string;
  areaPath: string;
  iterationPath: string;
  tags?: string;
  url: string;
}

export interface AzureTestCase {
  id?: number;
  title: string;
  description: string;
  steps: AzureTestStep[];
  workItemId?: number; // linked user story
  automationStatus?: 'Automated' | 'Not Automated' | 'Planned';
  priority?: 1 | 2 | 3 | 4;
}

export interface AzureTestStep {
  action: string;
  expectedResult: string;
}

export interface AzureTestCaseLink {
  userStoryId: number;
  testCaseId: number;
  linkType: 'Microsoft.VSTS.Common.TestedBy-Forward' | 'Microsoft.VSTS.Common.TestedBy-Reverse';
}

export interface AzureSyncResult {
  workItemId: number;
  title: string;
  testCasesCreated: number;
  testCaseIds: number[];
  playwrightFile: string;
}

// ============================================================
// AI Generation Types
// ============================================================

export interface AIGeneratedTestCase {
  title: string;
  description: string;
  preconditions: string[];
  steps: AITestStep[];
  expectedOutcome: string;
  tags: string[];
  priority: 'High' | 'Medium' | 'Low';
  playwrightCode: string;
}

export interface AITestStep {
  stepNumber: number;
  action: string;
  locatorHint: string;
  expectedResult: string;
}

export interface AIGenerationRequest {
  workItemId: number;
  title: string;
  description: string;
  acceptanceCriteria?: string;
  appContext: 'CRM' | 'InventoryManagement';
}

export interface AIGenerationResponse {
  workItemId: number;
  testCases: AIGeneratedTestCase[];
  generatedAt: string;
}

// ============================================================
// Framework Config Types
// ============================================================

export interface FrameworkConfig {
  crm: {
    baseUrl: string;
    orgUrl: string;
    userName: string;
    password: string;
    testUserName: string;
    testPassword: string;
  };
  inventory: {
    url: string;
    userName: string;
    password: string;
  };
  azure: {
    org: string;
    project: string;
    pat: string;
  };
  openai: {
    apiKey: string;
    model: string;
  };
}

// ============================================================
// Page Object Types
// ============================================================

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface CRMEntity {
  entityName: string;
  formTitle?: string;
  fields: Record<string, string>;
}

export interface NavigationItem {
  groupName: string;
  itemName: string;
}
