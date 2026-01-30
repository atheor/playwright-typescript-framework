# @atheor/playwright-framework

A comprehensive, production-ready test automation framework built on Playwright with TypeScript. Supports UI, API, and FTP testing with a three-layer architecture for maximum reusability and maintainability.

## Features

- 🎭 **UI Testing** - Smart element wrappers with auto-waiting, retry logic, and fluent API
- 🌐 **API Testing** - REST and GraphQL clients with interceptors and retry mechanisms
- 📁 **FTP Testing** - File transfer verification and synchronization
- 🏗️ **Three-Layer Architecture** - Test Files → Workflows → Page Objects
- ⚙️ **Centralized Configuration** - Single source of truth for all settings
- 🔄 **Smart Retries** - Configurable retry logic for flaky operations
- 📝 **Comprehensive Logging** - Winston-based logging with multiple transports
- 🧪 **Test Data Builders** - Faker-powered data generation
- 💉 **Dependency Injection** - Custom Playwright fixtures

## Installation

```bash
npm install @atheor/playwright-framework
```

### Peer Dependencies

```bash
npm install @playwright/test typescript
```

## Quick Start

### 1. Create Framework Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import { FrameworkConfig } from '@atheor/playwright-framework';

FrameworkConfig.initialize({
  environment: 'local',
  baseUrl: 'http://localhost:3000',
  timeouts: {
    default: 30000,
    navigation: 60000,
    element: 10000,
  },
  retries: {
    elementAction: 3,
    apiRequest: 2,
  },
  logging: {
    level: 'info',
    console: true,
    file: true,
    filePath: './logs/test.log',
  },
});

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: FrameworkConfig.getConfig().baseUrl,
  },
});
```

### 2. Create Page Objects

```typescript
// pages/login.page.ts
import { Page, Locator } from '@playwright/test';
import { BasePage, Button, TextField, Checkbox } from '@atheor/playwright-framework';

export class LoginPage extends BasePage {
  readonly usernameField: Locator;
  readonly passwordField: Locator;
  readonly loginButton: Locator;
  readonly rememberMeCheckbox: Locator;

  constructor(page: Page) {
    super(page, { path: '/login', titlePattern: /Login/ });

    this.usernameField = page.locator('#username');
    this.passwordField = page.locator('#password');
    this.loginButton = page.locator('button[type="submit"]');
    this.rememberMeCheckbox = page.locator('#remember-me');
  }

  async enterCredentials(username: string, password: string): Promise<void> {
    await TextField(this.usernameField).fill(username);
    await TextField(this.passwordField).fill(password);
  }

  async clickLogin(): Promise<void> {
    await Button(this.loginButton).click();
  }

  async setRememberMe(checked: boolean): Promise<void> {
    await Checkbox(this.rememberMeCheckbox).setChecked(checked);
  }
}
```

### 3. Create Workflows

```typescript
// workflows/login.workflow.ts
import { Page } from '@playwright/test';
import { Logger } from '@atheor/playwright-framework';
import { LoginPage } from '../pages/login.page';

export class LoginWorkflow {
  private logger = Logger.getInstance();
  private loginPage: LoginPage;

  constructor(page: Page) {
    this.loginPage = new LoginPage(page);
  }

  async loginAsUser(username: string, password: string): Promise<void> {
    this.logger.step(1, 'Navigate to login page');
    await this.loginPage.navigate();

    this.logger.step(2, 'Enter credentials');
    await this.loginPage.enterCredentials(username, password);

    this.logger.step(3, 'Submit login');
    await this.loginPage.clickLogin();
  }
}
```

### 4. Write Tests

```typescript
// tests/login.spec.ts
import { test, expect } from '@atheor/playwright-framework';
import { LoginWorkflow } from '../workflows/login.workflow';

test.describe('Login Feature', () => {
  test('User can login successfully', async ({ page }) => {
    const loginWorkflow = new LoginWorkflow(page);
    await loginWorkflow.loginAsUser('user@example.com', 'password123');
    
    // Verify success
    await expect(page).toHaveURL(/dashboard/);
  });
});
```

## Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      TEST FILES                         │
│  • Orchestrate workflows                                │
│  • Define test scenarios                                │
│  • Make assertions                                      │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                      WORKFLOWS                          │
│  • Business behavior encapsulation                      │
│  • Step-by-step logging                                 │
│  • Coordinate multiple pages                            │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    PAGE OBJECTS                         │
│  • Element locators                                     │
│  • Page-specific actions                                │
│  • No business logic                                    │
└─────────────────────────────────────────────────────────┘
```

## Element Wrappers

The framework provides fluent element wrappers with built-in retry logic and logging:

### Button

```typescript
import { Button } from '@atheor/playwright-framework';

// Basic click
await Button(page.locator('#submit')).click();

// With custom timeout
await Button(page.locator('#submit'))
  .withTimeout(5000)
  .click();

// With retries
await Button(page.locator('#submit'))
  .withRetries(5)
  .click();

// Named element for better logs
await Button(page.locator('#submit'))
  .withName('Submit Button')
  .click();

// Click and wait for navigation
await Button(page.locator('#submit'))
  .clickAndWaitForNavigation();
```

### TextField

```typescript
import { TextField } from '@atheor/playwright-framework';

// Fill text
await TextField(page.locator('#email')).fill('user@example.com');

// Type character by character
await TextField(page.locator('#search')).type('search query', 100);

// Clear field
await TextField(page.locator('#email')).clear();

// Fill and verify
await TextField(page.locator('#email'))
  .fill('test@example.com')
  .andVerify();
```

### Dropdown

```typescript
import { Dropdown } from '@atheor/playwright-framework';

// Select by visible text
await Dropdown(page.locator('#country')).selectByLabel('United States');

// Select by value
await Dropdown(page.locator('#country')).selectByValue('US');

// Select by index
await Dropdown(page.locator('#country')).selectByIndex(2);

// Get all options
const options = await Dropdown(page.locator('#country')).getOptions();
```

### Checkbox

```typescript
import { Checkbox } from '@atheor/playwright-framework';

// Check
await Checkbox(page.locator('#terms')).check();

// Uncheck
await Checkbox(page.locator('#marketing')).uncheck();

// Toggle
await Checkbox(page.locator('#newsletter')).toggle();

// Set to specific state
await Checkbox(page.locator('#terms')).setChecked(true);
```

### RadioButton

```typescript
import { RadioButton } from '@atheor/playwright-framework';

// Select a radio button
await RadioButton(page.locator('#payment-credit')).select();

// Check if selected
const isSelected = await RadioButton(page.locator('#payment-credit')).isSelected();
```

### Table

```typescript
import { Table } from '@atheor/playwright-framework';

// Get table data
const data = await Table(page.locator('#users-table')).getData();

// Get specific cell
const value = await Table(page.locator('#users-table'))
  .getCellValue(0, 'Email');

// Find row by criteria
const row = await Table(page.locator('#users-table'))
  .findRow({ Name: 'John Doe' });

// Get headers
const headers = await Table(page.locator('#users-table')).getHeaders();
```

### FileUpload

```typescript
import { FileUpload } from '@atheor/playwright-framework';

// Upload single file
await FileUpload(page.locator('#avatar')).upload('/path/to/file.png');

// Upload multiple files
await FileUpload(page.locator('#documents'))
  .uploadMultiple(['/path/to/doc1.pdf', '/path/to/doc2.pdf']);
```

## API Testing

### REST Client

```typescript
import { createApiClient } from '@atheor/playwright-framework';

const apiClient = createApiClient({
  baseUrl: 'https://api.example.com',
  defaultHeaders: { 'Content-Type': 'application/json' },
});

// GET request
const response = await apiClient.get<User[]>('/users');

// POST request
const newUser = await apiClient.post<User>('/users', {
  name: 'John Doe',
  email: 'john@example.com',
});

// With authentication
apiClient.setAuthToken('your-token');
const protectedData = await apiClient.get('/protected');

// File upload
await apiClient.uploadFile('/upload', '/path/to/file.pdf');

// File download
await apiClient.downloadFile('/download/123', '/local/path/file.pdf');
```

### GraphQL Client

```typescript
import { createGraphQLClient, GraphQLQueryBuilder } from '@atheor/playwright-framework';

const graphqlClient = createGraphQLClient({ baseUrl: 'https://api.example.com/graphql' });

// Simple query
const users = await graphqlClient.query<{ users: User[] }>(`
  query {
    users {
      id
      name
      email
    }
  }
`);

// Query with variables
const user = await graphqlClient.query<{ user: User }>(
  `query GetUser($id: ID!) { user(id: $id) { id name } }`,
  { id: '123' }
);

// Mutation
const newUser = await graphqlClient.mutate<{ createUser: User }>(
  `mutation CreateUser($input: UserInput!) { createUser(input: $input) { id name } }`,
  { input: { name: 'John', email: 'john@example.com' } }
);

// Using Query Builder
const query = new GraphQLQueryBuilder('query', 'GetUser')
  .addVariable('id', 'ID!')
  .addField('user', ['id', 'name', 'email'], { id: '$id' })
  .build();
```

## FTP Testing

```typescript
import { createFtpClient } from '@atheor/playwright-framework';

const ftpClient = createFtpClient({
  host: 'ftp.example.com',
  user: 'username',
  password: 'password',
  secure: true,
});

// Connect
await ftpClient.connect();

// Upload file
await ftpClient.uploadFile('/local/file.txt', '/remote/file.txt');

// Download file
await ftpClient.downloadFile('/remote/file.txt', '/local/file.txt');

// List files
const files = await ftpClient.listFiles('/remote/directory');

// Check file exists
const exists = await ftpClient.fileExists('/remote/file.txt');

// Delete file
await ftpClient.deleteFile('/remote/file.txt');

// Disconnect
await ftpClient.disconnect();
```

## Test Data Generation

```typescript
import { testData } from '@atheor/playwright-framework';

// Generate user data
const user = testData.user();
// { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', ... }

// Generate address
const address = testData.address();
// { street: '123 Main St', city: 'New York', state: 'NY', ... }

// Generate payment info
const payment = testData.payment();
// { cardNumber: '4111111111111111', expiryDate: '12/25', cvv: '123', ... }

// Generate multiple items
const users = testData.many(testData.user, 10);
// Array of 10 user objects

// Custom data with overrides
const customUser = testData.user({ email: 'custom@example.com' });
```

## Custom Fixtures

The framework provides pre-built fixtures for dependency injection:

```typescript
import { test, expect } from '@atheor/playwright-framework';

test('API and UI test', async ({ 
  page,           // Playwright page
  apiClient,      // Configured API client
  graphqlClient,  // GraphQL client
  ftpClient,      // FTP client
  testData,       // Test data builder
  logger,         // Logger instance
  uiActions,      // UI action helpers
}) => {
  // Login via API
  const response = await apiClient.post('/auth/login', {
    email: 'user@example.com',
    password: 'password',
  });

  // Set token in browser
  await page.evaluate((token) => {
    localStorage.setItem('authToken', token);
  }, response.data.token);

  // Continue with UI testing
  await page.goto('/dashboard');
});
```

## Configuration Options

```typescript
FrameworkConfig.initialize({
  // Environment
  environment: 'local' | 'dev' | 'staging' | 'prod',
  baseUrl: 'http://localhost:3000',

  // Timeouts (ms)
  timeouts: {
    default: 30000,      // Default timeout for all operations
    navigation: 60000,   // Page navigation timeout
    element: 10000,      // Element wait timeout
    api: 30000,          // API request timeout
    ftp: 60000,          // FTP operation timeout
    assertion: 5000,     // Assertion timeout
  },

  // Retry configuration
  retries: {
    elementAction: 3,    // Element action retries
    apiRequest: 2,       // API request retries
    ftpOperation: 2,     // FTP operation retries
    retryDelay: 1000,    // Delay between retries (ms)
  },

  // Browser settings
  browser: {
    browserType: 'chromium' | 'firefox' | 'webkit',
    headless: true,
    slowMo: 0,
    viewportWidth: 1920,
    viewportHeight: 1080,
    recordVideo: false,
    screenshotOnFailure: true,
    traceOnFailure: true,
  },

  // API configuration
  api: {
    baseUrl: 'http://localhost:3000/api',
    defaultHeaders: {
      'Content-Type': 'application/json',
    },
    enableLogging: true,
    validateSsl: true,
  },

  // FTP configuration
  ftp: {
    host: 'localhost',
    port: 21,
    user: 'anonymous',
    password: '',
    secure: false,
  },

  // Logging
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error',
    console: true,
    file: true,
    filePath: './logs/test.log',
    timestamps: true,
    stackTraces: true,
  },

  // Output directories
  screenshotsDir: './test-results/screenshots',
  videosDir: './test-results/videos',
  reportsDir: './test-results/reports',
});
```

### Runtime Configuration Changes

```typescript
import { FrameworkConfig } from '@atheor/playwright-framework';

// Change timeout
FrameworkConfig.setDefaultTimeout(60000);

// Change retries
FrameworkConfig.setActionRetries(5);

// Get current config
const config = FrameworkConfig.getConfig();
```

## Assertions

```typescript
import { Assertions } from '@atheor/playwright-framework';

const assertions = new Assertions(page);

// Element assertions
await assertions.elementIsVisible(page.locator('#welcome'));
await assertions.elementHasText(page.locator('#title'), 'Welcome');
await assertions.elementHasValue(page.locator('#email'), 'user@example.com');

// Page assertions
await assertions.pageHasUrl(/dashboard/);
await assertions.pageHasTitle('Dashboard');

// Soft assertions (don't stop test on failure)
assertions.softAssert(async () => {
  await assertions.elementIsVisible(page.locator('#optional'));
});
await assertions.assertAll(); // Throws if any soft assertion failed
```

## Logging

```typescript
import { Logger } from '@atheor/playwright-framework';

const logger = Logger.getInstance();

// Log levels
logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', new Error('Details'));

// Structured logging
logger.action('click', 'Login Button');
logger.step(1, 'Navigate to login page');
```

## Error Handling

The framework provides a comprehensive exception hierarchy:

```typescript
import {
  FrameworkException,
  ElementNotFoundException,
  ElementTimeoutException,
  ApiRequestException,
  FtpConnectionException,
  WorkflowExecutionException,
} from '@atheor/playwright-framework';

try {
  await Button(page.locator('#missing')).click();
} catch (error) {
  if (error instanceof ElementNotFoundException) {
    console.log('Element not found:', error.selector);
  } else if (error instanceof ElementTimeoutException) {
    console.log('Element timeout:', error.timeout);
  }
}
```

## Project Structure

Recommended structure for test projects using this framework:

```
your-test-project/
├── pages/                  # Page Objects
│   ├── login.page.ts
│   ├── home.page.ts
│   └── checkout.page.ts
├── workflows/              # Workflow classes
│   ├── login.workflow.ts
│   ├── checkout.workflow.ts
│   └── search.workflow.ts
├── fixtures/               # Custom fixtures
│   └── project.fixtures.ts
├── tests/                  # Test files
│   ├── login/
│   │   └── login.spec.ts
│   ├── checkout/
│   │   └── checkout.spec.ts
│   └── api/
│       └── api.spec.ts
├── playwright.config.ts
├── package.json
└── tsconfig.json
```

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: test-results/
```

## Environment Variables

```bash
# Required
BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000/api

# Optional
TEST_ENV=local
FTP_HOST=ftp.example.com
FTP_USER=username
FTP_PASSWORD=password
ADMIN_API_TOKEN=admin-token
```

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request