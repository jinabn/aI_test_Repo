import * as dotenv from 'dotenv';
import * as path from 'path';
import { FrameworkConfig } from '../types';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const config: FrameworkConfig = {
  crm: {
    baseUrl: requireEnv('DYN365_BaseURL'),
    orgUrl: requireEnv('DYN365_TEST_ORG_URL'),
    userName: requireEnv('DYN365_USER_NAME'),
    password: requireEnv('DYN365_PASSWORD'),
    testUserName: requireEnv('DYN365_TEST_USER_NAME'),
    testPassword: requireEnv('DYN365_TEST_PASSWORD'),
  },
  inventory: {
    url: requireEnv('INVENTORY_MGMT_URL'),
    userName: requireEnv('INVENTORY_MGMT_USER_NAME'),
    password: requireEnv('INVENTORY_MGMT_PASSWORD'),
  },
  azure: {
    org: optionalEnv('AZURE_DEVOPS_ORG'),
    project: optionalEnv('AZURE_DEVOPS_PROJECT'),
    pat: optionalEnv('AZURE_DEVOPS_PAT'),
  },
  openai: {
    apiKey: optionalEnv('OPENAI_API_KEY'),
    model: optionalEnv('OPENAI_MODEL', 'gpt-4o'),
  },
};

export const aiConfig = {
  provider: optionalEnv('AI_PROVIDER', 'azure-openai') as 'azure-openai' | 'ollama' | 'openai',
  azureOpenAI: {
    endpoint: optionalEnv('AZURE_OPENAI_ENDPOINT'),
    apiKey: optionalEnv('AZURE_OPENAI_API_KEY'),
    deployment: optionalEnv('AZURE_OPENAI_DEPLOYMENT'),
    apiVersion: optionalEnv('AZURE_OPENAI_API_VERSION', '2024-02-01'),
  },
  ollama: {
    baseUrl: optionalEnv('OLLAMA_BASE_URL', 'http://localhost:11434'),
    model: optionalEnv('OLLAMA_MODEL', 'llama3'),
  },
};

export default config;
