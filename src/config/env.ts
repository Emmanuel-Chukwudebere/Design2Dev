// src/config/env.ts
// Environment configuration
const API_KEY = 'd2d1';

// Initialize API key from Figma client storage
export const initApiKey = async () => {
  try {
    const storedKey = await figma.clientStorage.getAsync('api-key');
    if (storedKey) {
      return storedKey;
    }
    return API_KEY;
  } catch (error) {
    console.error('Error initializing API key:', error);
    return API_KEY;
  }
};

// Set API key in Figma client storage
export const setApiKey = async (key: string) => {
  try {
    await figma.clientStorage.setAsync('api-key', key);
  } catch (error) {
    console.error('Error setting API key:', error);
  }
};

// Environment variables
export const ENV = {
  API_KEY,
  NODE_ENV: 'development'
} as const; 