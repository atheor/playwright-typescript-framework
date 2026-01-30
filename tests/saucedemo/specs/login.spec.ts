/**
 * SauceDemo Login Tests
 */

import { test, expect } from '../fixtures';
import { SauceDemoCredentials } from '../workflows';

test.describe('Login Feature', () => {
  test.describe('Valid Login', () => {
    test('should login successfully with standard user', async ({ loginWorkflow }) => {
      await loginWorkflow.loginAsStandardUser();
    });

    test('should login successfully with valid credentials', async ({ loginWorkflow }) => {
      const { username, password } = SauceDemoCredentials.STANDARD_USER;
      await loginWorkflow.loginAndVerifySuccess(username, password);
    });
  });

  test.describe('Invalid Login', () => {
    test('should show error for locked out user', async ({ loginWorkflow }) => {
      const { username, password } = SauceDemoCredentials.LOCKED_OUT_USER;
      const error = await loginWorkflow.loginAndExpectFailure(username, password);
      
      expect(error).toContain('locked out');
    });

    test('should show error for invalid username', async ({ loginWorkflow }) => {
      const error = await loginWorkflow.loginAndExpectFailure('invalid_user', 'secret_sauce');
      
      expect(error).toContain('Username and password do not match');
    });

    test('should show error for invalid password', async ({ loginWorkflow }) => {
      const error = await loginWorkflow.loginAndExpectFailure('standard_user', 'wrong_password');
      
      expect(error).toContain('Username and password do not match');
    });

    test('should show error for empty credentials', async ({ loginWorkflow, loginPage }) => {
      await loginPage.navigate();
      await loginPage.clickLogin();
      
      const error = await loginPage.getErrorMessage();
      expect(error).toContain('Username is required');
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ loginWorkflow, loginPage }) => {
      await loginWorkflow.loginAsStandardUser();
      await loginWorkflow.logout();
      
      expect(await loginPage.isCurrentPage()).toBe(true);
    });
  });
});
