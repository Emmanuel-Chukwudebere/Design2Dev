// src/config/env.ts
let apiKey = '';

export const ENV = {
  API_KEY: apiKey,
  NODE_ENV: typeof process !== 'undefined' ? process.env.NODE_ENV : 'development'
} as const;

// Function to set API key
export async function setApiKey(key: string) {
  apiKey = key;
  await figma.clientStorage.setAsync('API_KEY', key);
}

// Function to initialize API key
export async function initApiKey() {
  apiKey = await figma.clientStorage.getAsync('API_KEY') || '';
} 