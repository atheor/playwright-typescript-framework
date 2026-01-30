/**
 * Default Configuration Values
 * Central location for all default settings
 */

import { FrameworkConfigOptions } from './config.types';

export const DEFAULT_CONFIG: FrameworkConfigOptions = {
  environment: 'local',
  baseUrl: 'http://localhost:3000',
  
  timeouts: {
    default: 30000,
    navigation: 60000,
    element: 10000,
    api: 30000,
    ftp: 60000,
    assertion: 5000,
  },

  retries: {
    elementAction: 3,
    apiRequest: 2,
    ftpOperation: 2,
    retryDelay: 1000,
  },

  browser: {
    browserType: 'chromium',
    headless: true,
    slowMo: 0,
    viewportWidth: 1920,
    viewportHeight: 1080,
    recordVideo: false,
    screenshotOnFailure: true,
    traceOnFailure: true,
  },

  api: {
    baseUrl: 'http://localhost:3000/api',
    defaultHeaders: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    enableLogging: true,
    validateSsl: true,
  },

  ftp: {
    host: 'localhost',
    port: 21,
    username: 'anonymous',
    password: '',
    secure: false,
  },

  logging: {
    level: 'info',
    console: true,
    file: true,
    filePath: './logs/framework.log',
    timestamps: true,
    stackTraces: true,
  },

  elementWaitStrategy: 'visible',
  actionLogging: true,
  screenshotsDir: './screenshots',
  videosDir: './videos',
  reportsDir: './reports',
};
