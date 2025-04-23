/**
 * Global error handling utilities
 */

// Safe JSON parse that won't throw errors
export function safeJsonParse(str, fallback = {}) {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return fallback;
  }
}

// Safe async function wrapper
export async function safeAsync(asyncFn, fallbackValue = null) {
  try {
    return await asyncFn();
  } catch (error) {
    console.error('Async operation failed:', error);
    return fallbackValue;
  }
}

// Handle API fetch requests safely
export async function safeFetch(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    return { error: error.message, success: false };
  }
}

// SSR-safe window access
export function safeWindow() {
  if (typeof window !== 'undefined') {
    return window;
  }
  return null;
}

// Safe localStorage access
export function safeLocalStorage() {
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
}

// Safely get environment variables
export function getEnv(key, fallback = '') {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || fallback;
  }
  return fallback;
}
