# Example Test Project

This directory contains example implementations demonstrating how to use the `@atheor/playwright-framework` in a real test project.

## Structure

```
examples/
├── pages/                    # Page Object implementations
│   └── example-pages.ts      # LoginPage, HomePage, ProductListPage, etc.
├── workflows/                # Business workflow implementations
│   └── example-workflows.ts  # LoginWorkflow, CheckoutWorkflow, etc.
├── fixtures/                 # Extended fixtures for this project
│   └── example-fixtures.ts   # Custom fixtures with pages and workflows
├── tests/                    # Test specifications
│   ├── login/
│   │   └── login.spec.ts
│   ├── products/
│   │   └── product-search.spec.ts
│   ├── checkout/
│   │   └── checkout.spec.ts
│   ├── api/
│   │   └── api-integration.spec.ts
│   └── ftp/
│       └── ftp-integration.spec.ts
└── playwright.config.ts      # Playwright configuration
```

## Three-Layer Architecture

### Layer 1: Test Files (`tests/`)
- Orchestrate workflows
- Define test scenarios
- Make assertions
- **No direct page interactions**

```typescript
test('User can login successfully', async ({ loginWorkflow }) => {
  await loginWorkflow.loginAndVerifySuccess('user@example.com', 'password');
});
```

### Layer 2: Workflows (`workflows/`)
- Encapsulate business behaviors
- Coordinate multiple pages
- Provide step-by-step logging
- **No assertions**

```typescript
async loginAndVerifySuccess(username: string, password: string): Promise<void> {
  this.logger.step(1, 'Navigate to login page');
  await this.loginPage.navigate();
  
  this.logger.step(2, 'Enter credentials');
  await this.loginPage.login(username, password);
  
  this.logger.step(3, 'Verify success');
  await this.homePage.waitForPageLoad();
}
```

### Layer 3: Page Objects (`pages/`)
- Define element locators
- Provide page-specific actions
- Use fluent element wrappers
- **No business logic**

```typescript
async enterCredentials(username: string, password: string): Promise<void> {
  await TextField(this.usernameField).fill(username);
  await TextField(this.passwordField).fill(password);
}
```

## Running Examples

From the root directory:

```bash
# Install dependencies
npm install

# Run all example tests
cd examples && npx playwright test

# Run specific test file
cd examples && npx playwright test tests/login/login.spec.ts

# Run with UI mode
cd examples && npx playwright test --ui

# Run headed (visible browser)
cd examples && npx playwright test --headed
```

## Customizing Fixtures

The example extends the framework's base fixtures with project-specific ones:

```typescript
import { test as base } from '../../src';
import { LoginWorkflow } from '../workflows/example-workflows';

export const test = base.extend({
  loginWorkflow: async ({ page }, use) => {
    const workflow = new LoginWorkflow(page);
    await use(workflow);
  },
});
```

## Configuration

The `playwright.config.ts` demonstrates:
- Framework configuration initialization
- Multi-browser setup
- Mobile viewport testing
- API-only test project
- Report generation
