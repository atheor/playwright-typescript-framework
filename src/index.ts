/**
 * @atheor/playwright-framework
 * Production-ready test automation framework
 * 
 * @packageDocumentation
 */

// Core modules
export * from './core';

// UI modules
export * from './ui';

// API modules
export * from './api';

// Protocol modules
export * from './protocols';

// Utility modules
export * from './utils';

// Re-export commonly used types for convenience
export type {
  Page,
  Locator,
  Browser,
  BrowserContext,
  Route,
  Request,
  Response,
} from '@playwright/test';
